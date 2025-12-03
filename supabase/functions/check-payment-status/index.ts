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
    console.log("🔍 Payment status check");

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

    if (authError || !user) {
      console.error("❌ Auth failed:", authError);
      throw new Error("Unauthorized");
    }

    console.log("✅ User authenticated:", user.id);

    // ==========================================
    // 2. PARSE REQUEST
    // ==========================================
    const { paymentId, bookingId } = await req.json();

    if (!paymentId || !bookingId) {
      throw new Error("Missing required fields");
    }

    console.log("📋 Checking:", { paymentId, bookingId });

    // ==========================================
    // 3. VALIDATE BOOKING EXISTS
    // ==========================================
    console.log("🔍 Validating booking ownership...");

    const { data: bookingData, error: bookingError } = await supabase.rpc(
      "get_booking_for_payment_check",
      {
        p_booking_id: bookingId,
        p_user_id: user.id,
      }
    );

    if (bookingError) {
      console.error("❌ Booking validation failed:", bookingError);
      throw new Error("Booking not found or unauthorized");
    }

    console.log("✅ Booking validated:", {
      bookingId,
      status: bookingData.current_status,
    });

    // ==========================================
    // 4. FETCH FROM MOYASAR
    // ==========================================
    console.log("🔄 Fetching payment from Moyasar...");

    const auth = btoa(`${MOYASAR_SECRET_KEY}:`);
    const moyasarResponse = await fetch(
      `https://api.moyasar.com/v1/payments/${paymentId}`,
      {
        headers: { Authorization: `Basic ${auth}` },
      }
    );

    if (!moyasarResponse.ok) {
      console.error("❌ Moyasar API error:", moyasarResponse.status);
      throw new Error("Failed to fetch from Moyasar");
    }

    const payment = await moyasarResponse.json();
    console.log("💳 Moyasar status:", payment.status);

    // ==========================================
    // 5. HANDLE STATUS
    // ==========================================

    // ✅ PAID
    if (payment.status === "paid") {
      console.log("✅ Payment is paid");

      if (bookingData.current_status !== "active") {
        console.log("🔄 Completing booking payment...");

        const { data: completeData, error: completeError } =
          await supabase.rpc("complete_booking_payment_transaction", {
            p_booking_id: bookingId,
            p_payment_reference: paymentId,
            p_user_id: user.id,
            p_booking_data: bookingData,
          });

        if (completeError) {
          console.error("❌ Complete error:", completeError);
        } else {
          console.log("✅ Booking completed successfully");
        }
      } else {
        console.log("ℹ️ Booking already active");
      }

      return new Response(
        JSON.stringify({
          success: true,
          status: "paid",
          paymentId: paymentId,
          bookingStatus: "active",
          message: "Payment completed",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // ❌ FAILED
    if (payment.status === "failed") {
      console.log("❌ Payment failed");

      if (bookingData.current_status === "payment_pending") {
        console.log("🔄 Handling payment failure...");

        const { error: failureError } = await supabase.rpc(
          "handle_payment_failure_transaction",
          {
            p_booking_id: bookingId,
            p_user_id: user.id,
            p_error_message: payment.source?.message || "Payment failed",
            p_payment_id: paymentId,
          }
        );

        if (failureError) {
          console.warn("⚠️ Failure handling error:", failureError);
        } else {
          console.log("✅ Failure handled successfully");
        }
      } else {
        console.log("ℹ️ Booking status is", bookingData.current_status);
      }

      return new Response(
        JSON.stringify({
          success: false,
          status: "failed",
          message: payment.source?.message || "Payment failed",
          bookingStatus: bookingData.current_status,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // ⏳ INITIATED/AUTHORIZED
    if (["initiated", "authorized"].includes(payment.status)) {
      console.log("⏳ Payment still processing:", payment.status);
      return new Response(
        JSON.stringify({
          success: true,
          status: payment.status,
          message: "Payment still processing",
          transactionUrl: payment.source?.transaction_url,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // 💰 REFUNDED - استخدام RPC بدلاً من التحديث المباشر
    if (payment.status === "refunded") {
      console.log("💰 Payment refunded");

      if (bookingData.current_status === "active") {
        console.log("🔄 Handling booking refund...");

        const { error: refundError } = await supabase.rpc(
          "handle_booking_refund",
          {
            p_booking_id: bookingId,
            p_user_id: user.id,
            p_payment_id: paymentId,
          }
        );

        if (refundError) {
          console.warn("⚠️ Refund handling error:", refundError);
        } else {
          console.log("✅ Booking refund handled");
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          status: "refunded",
          message: "Payment refunded",
          bookingStatus: "cancelled",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // ⚠️ OTHER
    console.log("ℹ️ Other payment status:", payment.status);
    return new Response(
      JSON.stringify({
        success: true,
        status: payment.status,
        message: `Payment status: ${payment.status}`,
        bookingStatus: bookingData.current_status,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
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
