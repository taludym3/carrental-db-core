import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const MOYASAR_SECRET_KEY = Deno.env.get("MOYASAR_SECRET_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("💳 Payment request received");

    // ==========================================
    // 1. AUTHENTICATION
    // ==========================================
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization header");

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    const jwt = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(jwt);

    if (authError || !user) throw new Error("Unauthorized");
    console.log("✅ User authenticated:", user.id);

    // ==========================================
    // 2. PARSE REQUEST
    // ==========================================
    const { bookingId, token, idempotencyKey } = await req.json();

    if (!bookingId || !token) {
      throw new Error("Missing required fields");
    }

    if (!token.startsWith("token_")) {
      throw new Error("Invalid token format");
    }

    console.log("✅ Token received");

    // ==========================================
    // 3. VALIDATE BOOKING (SQL Function)
    // ==========================================
    console.log("🔍 Validating booking...");

    const { data: validation, error: validationError } = await supabase.rpc(
      "validate_and_prepare_booking_for_payment",
      {
        p_booking_id: bookingId,
        p_user_id: user.id,
      }
    );

    if (validationError) {
      console.error("❌ Validation error:", validationError);
      throw new Error(validationError.message);
    }

    const validationResult = Array.isArray(validation)
      ? validation[0]
      : validation;

    if (!validationResult.is_valid) {
      console.error("❌ Validation failed:", validationResult.error_message);
      throw new Error(validationResult.error_message);
    }

    const bookingData = validationResult.booking_data;
    console.log("✅ Booking validated");

    // ==========================================
    // 4. UPDATE TO PAYMENT_PENDING (SQL Function)
    // ==========================================
    if (bookingData.needs_status_update) {
      console.log("🔄 Updating to payment_pending...");

      const { data: updateData, error: updateError } = await supabase.rpc(
        "update_booking_to_payment_pending",
        {
          p_booking_id: bookingId,
          p_user_id: user.id,
        }
      );

      if (updateError) {
        console.error("❌ Update error:", updateError);
        throw new Error(updateError.message);
      }

      const updateResult = Array.isArray(updateData)
        ? updateData[0]
        : updateData;

      if (!updateResult.success) {
        throw new Error(updateResult.message);
      }

      console.log("✅", updateResult.message);
    }

    // ==========================================
    // 5. PREPARE MOYASAR PAYMENT
    // ==========================================
    const paymentIdempotencyKey = idempotencyKey || crypto.randomUUID();
    const amountInHalalas = Math.round(bookingData.booking.final_amount * 100);
    const carName =
      `${bookingData.car?.model?.brand?.name_ar || ""} ${bookingData.car?.model?.name_ar || ""}`.trim();

    const moyasarPayload = {
      given_id: paymentIdempotencyKey,
      amount: amountInHalalas,
      currency: "SAR",
      description: `حجز سيارة - ${carName}`,
      source: {
        type: "token",
        token: token,
      },
      metadata: {
        booking_id: bookingId,
        customer_id: user.id,
        car_id: bookingData.booking.car_id,
        branch_id: bookingData.booking.branch_id,
        car_name: carName,
      },
    };

    console.log("🔄 Sending to Moyasar:", {
      amount: amountInHalalas / 100,
      currency: "SAR",
    });

    // ==========================================
    // 6. CREATE PAYMENT IN MOYASAR
    // ==========================================
    const auth = btoa(`${MOYASAR_SECRET_KEY}:`);
    const moyasarResponse = await fetch("https://api.moyasar.com/v1/payments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify(moyasarPayload),
    });

    const moyasarResult = await moyasarResponse.json();
    console.log("📥 Moyasar status:", moyasarResult.status);

    // ==========================================
    // 7. HANDLE MOYASAR RESPONSE
    // ==========================================
    if (!moyasarResponse.ok) {
      console.error("❌ Moyasar API error:", moyasarResult);
      throw new Error(moyasarResult.message || "Payment processing failed");
    }

    // ✅ CASE 1: Payment succeeded immediately
    if (moyasarResult.status === "paid") {
      console.log("✅ Payment completed immediately");

      const { data: completeData, error: completeError } = await supabase.rpc(
        "complete_booking_payment_transaction",
        {
          p_booking_id: bookingId,
          p_payment_reference: moyasarResult.id,
          p_user_id: user.id,
          p_booking_data: bookingData,
        }
      );

      if (completeError) {
        console.error("❌ Complete error:", completeError);
        throw completeError;
      }

      return new Response(
        JSON.stringify({
          success: true,
          status: "paid",
          paymentId: moyasarResult.id,
          message: "Payment completed successfully",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // 🔐 CASE 2: 3DS required
    if (moyasarResult.status === "initiated") {
      console.log("🔐 3DS required");
      return new Response(
        JSON.stringify({
          success: true,
          status: "initiated",
          paymentId: moyasarResult.id,
          transactionUrl: moyasarResult.source?.transaction_url,
          message: "3DS verification required",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // ❌ CASE 3: Payment failed
    if (moyasarResult.status === "failed") {
      console.error("❌ Payment failed:", moyasarResult.source?.message);

      const { data: failureData, error: failureError } = await supabase.rpc(
        "handle_payment_failure_transaction",
        {
          p_booking_id: bookingId,
          p_user_id: user.id,
          p_error_message: moyasarResult.source?.message || "خطأ غير معروف",
          p_payment_id: moyasarResult.id,
        }
      );

      if (failureError) {
        console.warn("⚠️ Failure handling error:", failureError);
      }

      return new Response(
        JSON.stringify({
          success: false,
          status: "failed",
          message: moyasarResult.source?.message || "Payment failed",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // ⚠️ Unknown status
    throw new Error(`Unknown payment status: ${moyasarResult.status}`);
  } catch (error) {
    console.error("❌ Error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Internal server error",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
