export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      announcements: {
        Row: {
          branch_id: string | null
          created_at: string
          created_by: string
          description_ar: string | null
          description_en: string | null
          expires_at: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          is_featured: boolean | null
          priority: Database["public"]["Enums"]["announcement_priority"] | null
          title_ar: string | null
          title_en: string
          updated_at: string
        }
        Insert: {
          branch_id?: string | null
          created_at?: string
          created_by: string
          description_ar?: string | null
          description_en?: string | null
          expires_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          priority?: Database["public"]["Enums"]["announcement_priority"] | null
          title_ar?: string | null
          title_en: string
          updated_at?: string
        }
        Update: {
          branch_id?: string | null
          created_at?: string
          created_by?: string
          description_ar?: string | null
          description_en?: string | null
          expires_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          priority?: Database["public"]["Enums"]["announcement_priority"] | null
          title_ar?: string | null
          title_en?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcements_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string | null
          actor: string | null
          id: number
          new_data: Json | null
          occurred_at: string
          old_data: Json | null
          row_id: string | null
          table_name: string
        }
        Insert: {
          action?: string | null
          actor?: string | null
          id?: number
          new_data?: Json | null
          occurred_at?: string
          old_data?: Json | null
          row_id?: string | null
          table_name: string
        }
        Update: {
          action?: string | null
          actor?: string | null
          id?: number
          new_data?: Json | null
          occurred_at?: string
          old_data?: Json | null
          row_id?: string | null
          table_name?: string
        }
        Relationships: []
      }
      auth_logs: {
        Row: {
          action: string
          created_at: string | null
          id: number
          ip_address: unknown
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: number
          ip_address?: unknown
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: number
          ip_address?: unknown
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      bookings: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          booking_range: unknown
          branch_id: string
          car_id: string
          created_at: string
          customer_id: string
          daily_rate: number
          discount_amount: number | null
          end_date: string
          expires_at: string | null
          final_amount: number
          id: string
          notes: string | null
          payment_reference: string | null
          rental_type: Database["public"]["Enums"]["rental_type"]
          start_date: string
          status: Database["public"]["Enums"]["booking_status"] | null
          total_amount: number
          total_days: number
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          booking_range?: unknown
          branch_id: string
          car_id: string
          created_at?: string
          customer_id: string
          daily_rate: number
          discount_amount?: number | null
          end_date: string
          expires_at?: string | null
          final_amount: number
          id?: string
          notes?: string | null
          payment_reference?: string | null
          rental_type: Database["public"]["Enums"]["rental_type"]
          start_date: string
          status?: Database["public"]["Enums"]["booking_status"] | null
          total_amount: number
          total_days: number
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          booking_range?: unknown
          branch_id?: string
          car_id?: string
          created_at?: string
          customer_id?: string
          daily_rate?: number
          discount_amount?: number | null
          end_date?: string
          expires_at?: string | null
          final_amount?: number
          id?: string
          notes?: string | null
          payment_reference?: string | null
          rental_type?: Database["public"]["Enums"]["rental_type"]
          start_date?: string
          status?: Database["public"]["Enums"]["booking_status"] | null
          total_amount?: number
          total_days?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_car_id_fkey"
            columns: ["car_id"]
            isOneToOne: false
            referencedRelation: "cars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_car_id_fkey"
            columns: ["car_id"]
            isOneToOne: false
            referencedRelation: "cars_availability"
            referencedColumns: ["car_id"]
          },
          {
            foreignKeyName: "bookings_car_id_fkey"
            columns: ["car_id"]
            isOneToOne: false
            referencedRelation: "cars_with_details"
            referencedColumns: ["id"]
          },
        ]
      }
      branches: {
        Row: {
          created_at: string
          description_ar: string | null
          description_en: string | null
          email: string | null
          geom: unknown
          id: string
          images: string[] | null
          is_active: boolean | null
          latitude: number | null
          location_ar: string | null
          location_en: string
          longitude: number | null
          manager_id: string | null
          name_ar: string | null
          name_en: string
          phone: string | null
          updated_at: string
          working_hours: string | null
        }
        Insert: {
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          email?: string | null
          geom?: unknown
          id?: string
          images?: string[] | null
          is_active?: boolean | null
          latitude?: number | null
          location_ar?: string | null
          location_en: string
          longitude?: number | null
          manager_id?: string | null
          name_ar?: string | null
          name_en: string
          phone?: string | null
          updated_at?: string
          working_hours?: string | null
        }
        Update: {
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          email?: string | null
          geom?: unknown
          id?: string
          images?: string[] | null
          is_active?: boolean | null
          latitude?: number | null
          location_ar?: string | null
          location_en?: string
          longitude?: number | null
          manager_id?: string | null
          name_ar?: string | null
          name_en?: string
          phone?: string | null
          updated_at?: string
          working_hours?: string | null
        }
        Relationships: []
      }
      car_brands: {
        Row: {
          created_at: string
          id: string
          is_active: boolean | null
          logo_url: string | null
          name_ar: string | null
          name_en: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name_ar?: string | null
          name_en: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name_ar?: string | null
          name_en?: string
        }
        Relationships: []
      }
      car_colors: {
        Row: {
          created_at: string
          hex_code: string | null
          id: string
          is_active: boolean | null
          name_ar: string | null
          name_en: string
        }
        Insert: {
          created_at?: string
          hex_code?: string | null
          id?: string
          is_active?: boolean | null
          name_ar?: string | null
          name_en: string
        }
        Update: {
          created_at?: string
          hex_code?: string | null
          id?: string
          is_active?: boolean | null
          name_ar?: string | null
          name_en?: string
        }
        Relationships: []
      }
      car_feature_assignments: {
        Row: {
          car_id: string
          created_at: string | null
          feature_id: string
          id: string
        }
        Insert: {
          car_id: string
          created_at?: string | null
          feature_id: string
          id?: string
        }
        Update: {
          car_id?: string
          created_at?: string | null
          feature_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "car_feature_assignments_car_id_fkey"
            columns: ["car_id"]
            isOneToOne: false
            referencedRelation: "cars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "car_feature_assignments_car_id_fkey"
            columns: ["car_id"]
            isOneToOne: false
            referencedRelation: "cars_availability"
            referencedColumns: ["car_id"]
          },
          {
            foreignKeyName: "car_feature_assignments_car_id_fkey"
            columns: ["car_id"]
            isOneToOne: false
            referencedRelation: "cars_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "car_feature_assignments_feature_id_fkey"
            columns: ["feature_id"]
            isOneToOne: false
            referencedRelation: "car_features"
            referencedColumns: ["id"]
          },
        ]
      }
      car_features: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          name_ar: string
          name_en: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name_ar: string
          name_en: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name_ar?: string
          name_en?: string
        }
        Relationships: []
      }
      car_models: {
        Row: {
          brand_id: string
          created_at: string
          default_image_url: string | null
          description_ar: string | null
          description_en: string | null
          id: string
          is_active: boolean | null
          name_ar: string | null
          name_en: string
          specifications: Json | null
          year: number
        }
        Insert: {
          brand_id: string
          created_at?: string
          default_image_url?: string | null
          description_ar?: string | null
          description_en?: string | null
          id?: string
          is_active?: boolean | null
          name_ar?: string | null
          name_en: string
          specifications?: Json | null
          year: number
        }
        Update: {
          brand_id?: string
          created_at?: string
          default_image_url?: string | null
          description_ar?: string | null
          description_en?: string | null
          id?: string
          is_active?: boolean | null
          name_ar?: string | null
          name_en?: string
          specifications?: Json | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "car_models_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "car_brands"
            referencedColumns: ["id"]
          },
        ]
      }
      car_offers: {
        Row: {
          branch_id: string
          car_id: string
          created_at: string
          created_by: string
          current_uses: number | null
          description_ar: string | null
          description_en: string | null
          discount_type: string
          discount_value: number
          id: string
          is_active: boolean | null
          max_rental_days: number | null
          max_uses: number | null
          min_rental_days: number | null
          offer_name_ar: string
          offer_name_en: string
          rental_types: Database["public"]["Enums"]["rental_type"][] | null
          updated_at: string
          valid_from: string
          valid_until: string
        }
        Insert: {
          branch_id: string
          car_id: string
          created_at?: string
          created_by: string
          current_uses?: number | null
          description_ar?: string | null
          description_en?: string | null
          discount_type: string
          discount_value: number
          id?: string
          is_active?: boolean | null
          max_rental_days?: number | null
          max_uses?: number | null
          min_rental_days?: number | null
          offer_name_ar: string
          offer_name_en: string
          rental_types?: Database["public"]["Enums"]["rental_type"][] | null
          updated_at?: string
          valid_from?: string
          valid_until: string
        }
        Update: {
          branch_id?: string
          car_id?: string
          created_at?: string
          created_by?: string
          current_uses?: number | null
          description_ar?: string | null
          description_en?: string | null
          discount_type?: string
          discount_value?: number
          id?: string
          is_active?: boolean | null
          max_rental_days?: number | null
          max_uses?: number | null
          min_rental_days?: number | null
          offer_name_ar?: string
          offer_name_en?: string
          rental_types?: Database["public"]["Enums"]["rental_type"][] | null
          updated_at?: string
          valid_from?: string
          valid_until?: string
        }
        Relationships: [
          {
            foreignKeyName: "car_offers_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "car_offers_car_id_fkey"
            columns: ["car_id"]
            isOneToOne: false
            referencedRelation: "cars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "car_offers_car_id_fkey"
            columns: ["car_id"]
            isOneToOne: false
            referencedRelation: "cars_availability"
            referencedColumns: ["car_id"]
          },
          {
            foreignKeyName: "car_offers_car_id_fkey"
            columns: ["car_id"]
            isOneToOne: false
            referencedRelation: "cars_with_details"
            referencedColumns: ["id"]
          },
        ]
      }
      cars: {
        Row: {
          additional_images: string[] | null
          available_quantity: number
          branch_id: string
          color_id: string | null
          created_at: string
          daily_price: number
          description_ar: string | null
          description_en: string | null
          discount_percentage: number | null
          features: string[] | null
          features_ar: string[] | null
          features_en: string[] | null
          fuel_type: string
          id: string
          is_new: boolean | null
          mileage: number | null
          model_id: string
          monthly_price: number | null
          offer_expires_at: string | null
          ownership_price: number | null
          quantity: number
          rental_types: Database["public"]["Enums"]["rental_type"][] | null
          seats: number
          status: Database["public"]["Enums"]["car_status"] | null
          transmission: string
          updated_at: string
          weekly_price: number | null
        }
        Insert: {
          additional_images?: string[] | null
          available_quantity?: number
          branch_id: string
          color_id?: string | null
          created_at?: string
          daily_price: number
          description_ar?: string | null
          description_en?: string | null
          discount_percentage?: number | null
          features?: string[] | null
          features_ar?: string[] | null
          features_en?: string[] | null
          fuel_type?: string
          id?: string
          is_new?: boolean | null
          mileage?: number | null
          model_id: string
          monthly_price?: number | null
          offer_expires_at?: string | null
          ownership_price?: number | null
          quantity?: number
          rental_types?: Database["public"]["Enums"]["rental_type"][] | null
          seats?: number
          status?: Database["public"]["Enums"]["car_status"] | null
          transmission?: string
          updated_at?: string
          weekly_price?: number | null
        }
        Update: {
          additional_images?: string[] | null
          available_quantity?: number
          branch_id?: string
          color_id?: string | null
          created_at?: string
          daily_price?: number
          description_ar?: string | null
          description_en?: string | null
          discount_percentage?: number | null
          features?: string[] | null
          features_ar?: string[] | null
          features_en?: string[] | null
          fuel_type?: string
          id?: string
          is_new?: boolean | null
          mileage?: number | null
          model_id?: string
          monthly_price?: number | null
          offer_expires_at?: string | null
          ownership_price?: number | null
          quantity?: number
          rental_types?: Database["public"]["Enums"]["rental_type"][] | null
          seats?: number
          status?: Database["public"]["Enums"]["car_status"] | null
          transmission?: string
          updated_at?: string
          weekly_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cars_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cars_color_id_fkey"
            columns: ["color_id"]
            isOneToOne: false
            referencedRelation: "car_colors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cars_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "car_models"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          created_at: string
          document_type: string
          document_url: string
          id: string
          rejection_reason: string | null
          status: Database["public"]["Enums"]["document_status"] | null
          updated_at: string
          user_id: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          created_at?: string
          document_type: string
          document_url: string
          id?: string
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["document_status"] | null
          updated_at?: string
          user_id: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          created_at?: string
          document_type?: string
          document_url?: string
          id?: string
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["document_status"] | null
          updated_at?: string
          user_id?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: []
      }
      notification_outbox: {
        Row: {
          created_at: string
          created_by: string | null
          id: number
          to_user: string
          type: Database["public"]["Enums"]["notification_type"]
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: number
          to_user: string
          type: Database["public"]["Enums"]["notification_type"]
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: number
          to_user?: string
          type?: Database["public"]["Enums"]["notification_type"]
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          is_read: boolean | null
          message_ar: string | null
          message_en: string
          metadata: Json | null
          sent_via: string | null
          title_ar: string | null
          title_en: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_read?: boolean | null
          message_ar?: string | null
          message_en: string
          metadata?: Json | null
          sent_via?: string | null
          title_ar?: string | null
          title_en: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_read?: boolean | null
          message_ar?: string | null
          message_en?: string
          metadata?: Json | null
          sent_via?: string | null
          title_ar?: string | null
          title_en?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: []
      }
      otp_requests: {
        Row: {
          authentica_session_id: string | null
          created_at: string | null
          expires_at: string | null
          id: string
          phone: string
          status: string | null
          updated_at: string | null
          user_id: string | null
          verified_at: string | null
        }
        Insert: {
          authentica_session_id?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          phone: string
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
          verified_at?: string | null
        }
        Update: {
          authentica_session_id?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          phone?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
          verified_at?: string | null
        }
        Relationships: []
      }
      phone_verifications: {
        Row: {
          created_at: string | null
          expires_at: string
          id: string
          phone_number: string
          verification_code: string
        }
        Insert: {
          created_at?: string | null
          expires_at: string
          id?: string
          phone_number: string
          verification_code: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          id?: string
          phone_number?: string
          verification_code?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          age: number | null
          branch_id: string | null
          created_at: string
          email: string | null
          full_name: string | null
          gender: string | null
          geom: unknown
          id: string
          is_verified: boolean | null
          location: string | null
          location_accuracy: number | null
          location_updated_at: string | null
          phone: string | null
          phone_verified_at: string | null
          updated_at: string
          user_id: string
          user_latitude: number | null
          user_longitude: number | null
        }
        Insert: {
          age?: number | null
          branch_id?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          gender?: string | null
          geom?: unknown
          id?: string
          is_verified?: boolean | null
          location?: string | null
          location_accuracy?: number | null
          location_updated_at?: string | null
          phone?: string | null
          phone_verified_at?: string | null
          updated_at?: string
          user_id: string
          user_latitude?: number | null
          user_longitude?: number | null
        }
        Update: {
          age?: number | null
          branch_id?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          gender?: string | null
          geom?: unknown
          id?: string
          is_verified?: boolean | null
          location?: string | null
          location_accuracy?: number | null
          location_updated_at?: string | null
          phone?: string | null
          phone_verified_at?: string | null
          updated_at?: string
          user_id?: string
          user_latitude?: number | null
          user_longitude?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limits: {
        Row: {
          action_type: string
          attempt_count: number | null
          blocked_until: string | null
          created_at: string | null
          first_attempt: string | null
          id: string
          identifier: string
          last_attempt: string | null
        }
        Insert: {
          action_type: string
          attempt_count?: number | null
          blocked_until?: string | null
          created_at?: string | null
          first_attempt?: string | null
          id?: string
          identifier: string
          last_attempt?: string | null
        }
        Update: {
          action_type?: string
          attempt_count?: number | null
          blocked_until?: string | null
          created_at?: string | null
          first_attempt?: string | null
          id?: string
          identifier?: string
          last_attempt?: string | null
        }
        Relationships: []
      }
      security_audit_log: {
        Row: {
          created_at: string | null
          details: Json | null
          event_type: string
          id: string
          identifier: string | null
          ip_address: unknown
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          details?: Json | null
          event_type: string
          id?: string
          identifier?: string | null
          ip_address?: unknown
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          details?: Json | null
          event_type?: string
          id?: string
          identifier?: string | null
          ip_address?: unknown
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      spatial_ref_sys: {
        Row: {
          auth_name: string | null
          auth_srid: number | null
          proj4text: string | null
          srid: number
          srtext: string | null
        }
        Insert: {
          auth_name?: string | null
          auth_srid?: number | null
          proj4text?: string | null
          srid: number
          srtext?: string | null
        }
        Update: {
          auth_name?: string | null
          auth_srid?: number | null
          proj4text?: string | null
          srid?: number
          srtext?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      cars_availability: {
        Row: {
          available_quantity: number | null
          branch_id: string | null
          brand_name_ar: string | null
          brand_name_en: string | null
          car_id: string | null
          model_name_ar: string | null
          model_name_en: string | null
          status: Database["public"]["Enums"]["car_status"] | null
          total_quantity: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cars_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      cars_with_details: {
        Row: {
          actual_available_quantity: number | null
          additional_images: string[] | null
          available_quantity: number | null
          branch_id: string | null
          branch_name_ar: string | null
          branch_name_en: string | null
          brand_name_ar: string | null
          brand_name_en: string | null
          color_name_ar: string | null
          color_name_en: string | null
          created_at: string | null
          daily_price: number | null
          description_ar: string | null
          description_en: string | null
          discount_percentage: number | null
          feature_ids: string[] | null
          features_ar: string[] | null
          features_en: string[] | null
          fuel_type: string | null
          has_active_offer: boolean | null
          id: string | null
          is_new: boolean | null
          mileage: number | null
          model_name_ar: string | null
          model_name_en: string | null
          monthly_price: number | null
          offer_expires_at: string | null
          ownership_price: number | null
          quantity: number | null
          rental_types: Database["public"]["Enums"]["rental_type"][] | null
          seats: number | null
          status: Database["public"]["Enums"]["car_status"] | null
          transmission: string | null
          updated_at: string | null
          weekly_price: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cars_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      geography_columns: {
        Row: {
          coord_dimension: number | null
          f_geography_column: unknown
          f_table_catalog: unknown
          f_table_name: unknown
          f_table_schema: unknown
          srid: number | null
          type: string | null
        }
        Relationships: []
      }
      geometry_columns: {
        Row: {
          coord_dimension: number | null
          f_geometry_column: unknown
          f_table_catalog: string | null
          f_table_name: unknown
          f_table_schema: unknown
          srid: number | null
          type: string | null
        }
        Insert: {
          coord_dimension?: number | null
          f_geometry_column?: unknown
          f_table_catalog?: string | null
          f_table_name?: unknown
          f_table_schema?: unknown
          srid?: number | null
          type?: string | null
        }
        Update: {
          coord_dimension?: number | null
          f_geometry_column?: unknown
          f_table_catalog?: string | null
          f_table_name?: unknown
          f_table_schema?: unknown
          srid?: number | null
          type?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      _postgis_deprecate: {
        Args: { newname: string; oldname: string; version: string }
        Returns: undefined
      }
      _postgis_index_extent: {
        Args: { col: string; tbl: unknown }
        Returns: unknown
      }
      _postgis_pgsql_version: { Args: never; Returns: string }
      _postgis_scripts_pgsql_version: { Args: never; Returns: string }
      _postgis_selectivity: {
        Args: { att_name: string; geom: unknown; mode?: string; tbl: unknown }
        Returns: number
      }
      _postgis_stats: {
        Args: { ""?: string; att_name: string; tbl: unknown }
        Returns: string
      }
      _st_3dintersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_containsproperly: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_coveredby:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_covers:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_crosses: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_dwithin: {
        Args: {
          geog1: unknown
          geog2: unknown
          tolerance: number
          use_spheroid?: boolean
        }
        Returns: boolean
      }
      _st_equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_intersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_linecrossingdirection: {
        Args: { line1: unknown; line2: unknown }
        Returns: number
      }
      _st_longestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      _st_maxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      _st_orderingequals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_sortablehash: { Args: { geom: unknown }; Returns: number }
      _st_touches: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_voronoi: {
        Args: {
          clip?: unknown
          g1: unknown
          return_polygons?: boolean
          tolerance?: number
        }
        Returns: unknown
      }
      _st_within: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      add_feature_to_car: {
        Args: { p_car_id: string; p_feature_id: string }
        Returns: undefined
      }
      addauth: { Args: { "": string }; Returns: boolean }
      addgeometrycolumn:
        | {
            Args: {
              column_name: string
              new_dim: number
              new_srid: number
              new_type: string
              schema_name: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              column_name: string
              new_dim: number
              new_srid: number
              new_type: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              catalog_name: string
              column_name: string
              new_dim: number
              new_srid_in: number
              new_type: string
              schema_name: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
      advanced_car_filter: {
        Args: {
          p_branch_ids?: string[]
          p_brand_ids?: string[]
          p_color_ids?: string[]
          p_end_date?: string
          p_feature_names?: string[]
          p_fuel_type?: string[]
          p_has_discount?: boolean
          p_is_new?: boolean
          p_limit?: number
          p_max_price?: number
          p_max_seats?: number
          p_max_year?: number
          p_min_price?: number
          p_min_seats?: number
          p_min_year?: number
          p_model_ids?: string[]
          p_offset?: number
          p_rental_types?: string[]
          p_sort_by?: string
          p_start_date?: string
          p_transmission?: string[]
        }
        Returns: {
          available_quantity: number
          branch_name_ar: string
          branch_name_en: string
          brand_name_ar: string
          brand_name_en: string
          color_name_ar: string
          color_name_en: string
          daily_price: number
          discount_percentage: number
          features_ar: string[]
          features_en: string[]
          final_price: number
          fuel_type: string
          id: string
          model_name_ar: string
          model_name_en: string
          monthly_price: number
          seats: number
          total_results: number
          transmission: string
          weekly_price: number
          year: number
        }[]
      }
      approve_booking: {
        Args: { p_booking_id: string; p_payment_deadline_hours?: number }
        Returns: {
          approved_at: string | null
          approved_by: string | null
          booking_range: unknown
          branch_id: string
          car_id: string
          created_at: string
          customer_id: string
          daily_rate: number
          discount_amount: number | null
          end_date: string
          expires_at: string | null
          final_amount: number
          id: string
          notes: string | null
          payment_reference: string | null
          rental_type: Database["public"]["Enums"]["rental_type"]
          start_date: string
          status: Database["public"]["Enums"]["booking_status"] | null
          total_amount: number
          total_days: number
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "bookings"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      approve_document: {
        Args: { p_document_id: string }
        Returns: {
          created_at: string
          document_type: string
          document_url: string
          id: string
          rejection_reason: string | null
          status: Database["public"]["Enums"]["document_status"] | null
          updated_at: string
          user_id: string
          verified_at: string | null
          verified_by: string | null
        }
        SetofOptions: {
          from: "*"
          to: "documents"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      booking_status_consumes_capacity: {
        Args: { _st: Database["public"]["Enums"]["booking_status"] }
        Returns: boolean
      }
      calculate_booking_price: {
        Args: {
          p_car_id: string
          p_discount_amount?: number
          p_discount_percentage?: number
          p_end_date: string
          p_rental_type: Database["public"]["Enums"]["rental_type"]
          p_start_date: string
        }
        Returns: {
          base_price: number
          booking_discount_amount: number
          car_discount_amount: number
          car_discount_percentage: number
          final_amount: number
          price_after_car_discount: number
          subtotal: number
          total_days: number
          total_savings: number
          total_savings_percentage: number
        }[]
      }
      calculate_booking_price_preview: {
        Args: {
          p_car_id: string
          p_end_date: string
          p_rental_type: Database["public"]["Enums"]["rental_type"]
          p_start_date: string
        }
        Returns: {
          base_price: number
          calculation_details: Json
          discount_amount: number
          discount_percentage: number
          final_price: number
          offer_expires_at: string
          offer_valid: boolean
          price_per_unit: number
          total_amount: number
          total_days: number
        }[]
      }
      check_car_availability: {
        Args: { _car_id: string; _end_date?: string; _start_date: string }
        Returns: boolean
      }
      check_car_availability_detailed: {
        Args: { p_car_id: string; p_end_date: string; p_start_date: string }
        Returns: {
          actual_available: number
          available_quantity: number
          car_status: Database["public"]["Enums"]["car_status"]
          conflicting_bookings: number
          is_available: boolean
          message: string
          total_quantity: number
        }[]
      }
      check_expired_offers: {
        Args: never
        Returns: {
          branch_name: string
          car_id: string
          discount_percentage: number
          expired_at: string
          model_name: string
        }[]
      }
      check_rate_limit: {
        Args: {
          p_action_type: string
          p_identifier: string
          p_max_attempts?: number
          p_window_minutes?: number
        }
        Returns: boolean
      }
      check_user_exists: {
        Args: { _column: string; _value: string }
        Returns: boolean
      }
      check_user_is_customer: { Args: never; Returns: boolean }
      cleanup_expired_bookings: {
        Args: never
        Returns: {
          cleaned_count: number
          restored_cars: string[]
        }[]
      }
      cleanup_expired_offers: { Args: never; Returns: number }
      cleanup_old_rate_limits: { Args: never; Returns: number }
      complete_active_bookings: { Args: never; Returns: number }
      complete_booking_payment_transaction: {
        Args: {
          p_booking_data: Json
          p_booking_id: string
          p_payment_reference: string
          p_user_id: string
        }
        Returns: {
          message: string
          success: boolean
        }[]
      }
      create_booking_atomic: {
        Args: {
          p_branch_id: string
          p_car_id: string
          p_customer_id: string
          p_daily_rate: number
          p_discount_amount?: number
          p_end: string
          p_initial_status?: Database["public"]["Enums"]["booking_status"]
          p_notes?: string
          p_rental_type: Database["public"]["Enums"]["rental_type"]
          p_start: string
        }
        Returns: {
          approved_at: string | null
          approved_by: string | null
          booking_range: unknown
          branch_id: string
          car_id: string
          created_at: string
          customer_id: string
          daily_rate: number
          discount_amount: number | null
          end_date: string
          expires_at: string | null
          final_amount: number
          id: string
          notes: string | null
          payment_reference: string | null
          rental_type: Database["public"]["Enums"]["rental_type"]
          start_date: string
          status: Database["public"]["Enums"]["booking_status"] | null
          total_amount: number
          total_days: number
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "bookings"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_customer_profile_safe: {
        Args: {
          p_age?: number
          p_email: string
          p_full_name?: string
          p_gender?: string
          p_location?: string
          p_phone?: string
          p_user_id: string
          p_user_latitude?: number
          p_user_longitude?: number
        }
        Returns: Json
      }
      create_user_with_phone: {
        Args: { _full_name?: string; _phone: string }
        Returns: string
      }
      current_user_branch_id: { Args: never; Returns: string }
      current_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
      customer_cancel_booking: {
        Args: { p_booking_id: string; p_cancellation_notes?: string }
        Returns: {
          approved_at: string | null
          approved_by: string | null
          booking_range: unknown
          branch_id: string
          car_id: string
          created_at: string
          customer_id: string
          daily_rate: number
          discount_amount: number | null
          end_date: string
          expires_at: string | null
          final_amount: number
          id: string
          notes: string | null
          payment_reference: string | null
          rental_type: Database["public"]["Enums"]["rental_type"]
          start_date: string
          status: Database["public"]["Enums"]["booking_status"] | null
          total_amount: number
          total_days: number
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "bookings"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      days_from_range: { Args: { _r: unknown }; Returns: number }
      detect_language: { Args: { text_input: string }; Returns: string }
      disablelongtransactions: { Args: never; Returns: string }
      dropgeometrycolumn:
        | {
            Args: {
              column_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
        | { Args: { column_name: string; table_name: string }; Returns: string }
        | {
            Args: {
              catalog_name: string
              column_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
      dropgeometrytable:
        | { Args: { schema_name: string; table_name: string }; Returns: string }
        | { Args: { table_name: string }; Returns: string }
        | {
            Args: {
              catalog_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
      enablelongtransactions: { Args: never; Returns: string }
      equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      fix_availability_inconsistencies: {
        Args: never
        Returns: {
          actual_availability: number
          car_id: string
          expected_availability: number
          needs_attention: boolean
        }[]
      }
      geometry: { Args: { "": string }; Returns: unknown }
      geometry_above: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_below: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_cmp: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_contained_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_contains_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_distance_box: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_distance_centroid: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_eq: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_ge: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_gt: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_le: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_left: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_lt: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overabove: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overbelow: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overlaps_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overleft: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overright: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_right: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_same: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_same_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_within: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geomfromewkt: { Args: { "": string }; Returns: unknown }
      get_active_announcements: {
        Args: { p_branch_id?: string; p_limit?: number; p_offset?: number }
        Returns: {
          announcement_id: string
          branch_id: string
          branch_name_ar: string
          created_at: string
          created_by_name: string
          description_ar: string
          description_en: string
          expires_at: string
          image_url: string
          is_featured: boolean
          priority: Database["public"]["Enums"]["announcement_priority"]
          title_ar: string
          title_en: string
          total_count: number
        }[]
      }
      get_actual_available_quantity: {
        Args: { _car_id: string; _end_date?: string; _start_date?: string }
        Returns: number
      }
      get_booking_details: {
        Args: { p_booking_id: string }
        Returns: {
          approved_at: string
          approved_by_id: string
          approved_by_name: string
          booking_id: string
          booking_status: Database["public"]["Enums"]["booking_status"]
          branch_id: string
          branch_location_ar: string
          branch_name_ar: string
          branch_phone: string
          brand_name_ar: string
          car_id: string
          car_image_url: string
          color_name_ar: string
          created_at: string
          customer_approved_documents_count: number
          customer_bookings_count: number
          customer_documents_count: number
          customer_email: string
          customer_id: string
          customer_name: string
          customer_phone: string
          customer_verified: boolean
          daily_rate: number
          discount_amount: number
          end_date: string
          expires_at: string
          final_amount: number
          model_name_ar: string
          model_year: number
          notes: string
          payment_reference: string
          rental_type: Database["public"]["Enums"]["rental_type"]
          start_date: string
          total_amount: number
          total_days: number
        }[]
      }
      get_booking_for_payment_check: {
        Args: { p_booking_id: string; p_user_id: string }
        Returns: Json
      }
      get_booking_full_details: {
        Args: { p_booking_id: string }
        Returns: Json
      }
      get_branch_active_bookings_count: {
        Args: { _branch_id: string }
        Returns: number
      }
      get_branch_cars_count: { Args: { _branch_id: string }; Returns: number }
      get_branch_employee_list: {
        Args: { _branch_id: string }
        Returns: {
          created_at: string
          email: string
          full_name: string
          id: string
          is_verified: boolean
          phone: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }[]
      }
      get_branch_employees_count: {
        Args: { _branch_id: string }
        Returns: number
      }
      get_branch_statistics: {
        Args: { _branch_id: string }
        Returns: {
          active_bookings_count: number
          cars_count: number
          created_at: string
          employees_count: number
          id: string
          is_active: boolean
          location: string
          manager_id: string
          manager_name: string
          name: string
          updated_at: string
        }[]
      }
      get_car_features: {
        Args: { p_car_id: string }
        Returns: {
          feature_id: string
          name_ar: string
          name_en: string
        }[]
      }
      get_car_for_booking: { Args: { p_car_id: string }; Returns: Json }
      get_current_user_role: { Args: never; Returns: string }
      get_customer_documents: {
        Args: { p_customer_id: string }
        Returns: {
          created_at: string
          document_id: string
          document_status: Database["public"]["Enums"]["document_status"]
          document_type: string
          document_url: string
          rejection_reason: string
          verified_at: string
          verified_by_name: string
        }[]
      }
      get_documents_by_status: {
        Args: {
          p_limit?: number
          p_offset?: number
          p_status?: Database["public"]["Enums"]["document_status"]
        }
        Returns: {
          created_at: string
          document_id: string
          document_status: Database["public"]["Enums"]["document_status"]
          document_type: string
          document_url: string
          rejection_reason: string
          total_count: number
          user_email: string
          user_id: string
          user_name: string
          user_phone: string
          verified_at: string
          verified_by_name: string
        }[]
      }
      get_nearest_cars: {
        Args: { _limit?: number; _user_lat: number; _user_lon: number }
        Returns: {
          actual_available_quantity: number
          branch_location: string
          branch_name: string
          car_brand: string
          car_color: string
          car_id: string
          car_model: string
          daily_price: number
          discount_percentage: number
          distance_km: number
          distance_meters: number
          fuel_type: string
          is_new: boolean
          main_image_url: string
          seats: number
          transmission: string
        }[]
      }
      get_pending_documents: {
        Args: { p_limit?: number; p_offset?: number }
        Returns: {
          created_at: string
          document_id: string
          document_status: Database["public"]["Enums"]["document_status"]
          document_type: string
          document_url: string
          total_count: number
          user_email: string
          user_id: string
          user_name: string
          user_phone: string
        }[]
      }
      get_search_statistics: {
        Args: never
        Returns: {
          active_bookings: number
          active_branches: number
          active_brands: number
          active_models: number
          available_cars: number
          total_bookings: number
          total_branches: number
          total_brands: number
          total_cars: number
          total_models: number
        }[]
      }
      get_user_booking_eligibility: {
        Args: { p_user_id: string }
        Returns: {
          documents_status: Json
          is_eligible: boolean
          reason_code: string
          reason_message_ar: string
          reason_message_en: string
          user_profile: Json
        }[]
      }
      get_user_booking_stats: {
        Args: { p_user_id?: string }
        Returns: {
          active: number
          cancelled: number
          completed: number
          confirmed: number
          expired: number
          payment_pending: number
          pending: number
          total: number
          total_spent: number
        }[]
      }
      get_user_bookings: {
        Args: {
          p_limit?: number
          p_offset?: number
          p_sort_by?: string
          p_sort_order?: string
          p_status?: string[]
          p_user_id?: string
        }
        Returns: {
          approved_at: string
          approved_by: string
          branch: Json
          branch_id: string
          car: Json
          car_id: string
          created_at: string
          customer_id: string
          daily_rate: number
          discount_amount: number
          end_date: string
          expires_at: string
          final_amount: number
          id: string
          notes: string
          payment_reference: string
          rental_type: Database["public"]["Enums"]["rental_type"]
          start_date: string
          status: Database["public"]["Enums"]["booking_status"]
          total_amount: number
          total_count: number
          total_days: number
          updated_at: string
        }[]
      }
      get_user_by_phone: {
        Args: { _phone: string }
        Returns: {
          age: number
          branch_id: string
          created_at: string
          email: string
          full_name: string
          gender: string
          is_verified: boolean
          location: string
          phone: string
          user_id: string
        }[]
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["user_role"]
      }
      gettransactionid: { Args: never; Returns: unknown }
      handle_payment_failure_transaction: {
        Args: {
          p_booking_id: string
          p_error_message: string
          p_payment_id?: string
          p_user_id: string
        }
        Returns: {
          message: string
          new_expires_at: string
          success: boolean
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["user_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      is_branch_manager: { Args: never; Returns: boolean }
      log_availability_inconsistency: {
        Args: { p_car_id: string; p_details: Json; p_issue_type: string }
        Returns: undefined
      }
      log_security_event: {
        Args: {
          p_details: Json
          p_event_type: string
          p_identifier: string
          p_user_id: string
        }
        Returns: undefined
      }
      longtransactionsenabled: { Args: never; Returns: boolean }
      make_booking_range: {
        Args: { _end: string; _start: string }
        Returns: unknown
      }
      populate_geometry_columns:
        | { Args: { use_typmod?: boolean }; Returns: string }
        | { Args: { tbl_oid: unknown; use_typmod?: boolean }; Returns: number }
      postgis_constraint_dims: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: number
      }
      postgis_constraint_srid: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: number
      }
      postgis_constraint_type: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: string
      }
      postgis_extensions_upgrade: { Args: never; Returns: string }
      postgis_full_version: { Args: never; Returns: string }
      postgis_geos_version: { Args: never; Returns: string }
      postgis_lib_build_date: { Args: never; Returns: string }
      postgis_lib_revision: { Args: never; Returns: string }
      postgis_lib_version: { Args: never; Returns: string }
      postgis_libjson_version: { Args: never; Returns: string }
      postgis_liblwgeom_version: { Args: never; Returns: string }
      postgis_libprotobuf_version: { Args: never; Returns: string }
      postgis_libxml_version: { Args: never; Returns: string }
      postgis_proj_version: { Args: never; Returns: string }
      postgis_scripts_build_date: { Args: never; Returns: string }
      postgis_scripts_installed: { Args: never; Returns: string }
      postgis_scripts_released: { Args: never; Returns: string }
      postgis_svn_version: { Args: never; Returns: string }
      postgis_type_name: {
        Args: {
          coord_dimension: number
          geomname: string
          use_new_name?: boolean
        }
        Returns: string
      }
      postgis_version: { Args: never; Returns: string }
      postgis_wagyu_version: { Args: never; Returns: string }
      quick_search_suggestions:
        | {
            Args: { _lang?: string; _limit?: number; _term: string }
            Returns: {
              detected_language: string
              source: string
              suggestion: string
            }[]
          }
        | {
            Args: {
              p_max_results_per_category?: number
              p_search_query: string
            }
            Returns: {
              relevance_score: number
              suggestion_id: string
              suggestion_text: string
              suggestion_type: string
            }[]
          }
      reject_booking: {
        Args: { p_booking_id: string; p_reason?: string }
        Returns: {
          approved_at: string | null
          approved_by: string | null
          booking_range: unknown
          branch_id: string
          car_id: string
          created_at: string
          customer_id: string
          daily_rate: number
          discount_amount: number | null
          end_date: string
          expires_at: string | null
          final_amount: number
          id: string
          notes: string | null
          payment_reference: string | null
          rental_type: Database["public"]["Enums"]["rental_type"]
          start_date: string
          status: Database["public"]["Enums"]["booking_status"] | null
          total_amount: number
          total_days: number
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "bookings"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      reject_document: {
        Args: { p_document_id: string; p_reason: string }
        Returns: {
          created_at: string
          document_type: string
          document_url: string
          id: string
          rejection_reason: string | null
          status: Database["public"]["Enums"]["document_status"] | null
          updated_at: string
          user_id: string
          verified_at: string | null
          verified_by: string | null
        }
        SetofOptions: {
          from: "*"
          to: "documents"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      remove_feature_from_car: {
        Args: { p_car_id: string; p_feature_id: string }
        Returns: undefined
      }
      reset_rate_limit: {
        Args: { p_action_type?: string; p_identifier: string }
        Returns: number
      }
      search_branches:
        | {
            Args: {
              p_city?: string
              p_has_available_cars?: boolean
              p_limit?: number
              p_offset?: number
              p_search_query?: string
            }
            Returns: {
              available_cars_count: number
              email: string
              id: string
              location_ar: string
              location_en: string
              name_ar: string
              name_en: string
              phone: string
              total_results: number
              working_hours: string
            }[]
          }
        | {
            Args: {
              is_active_filter?: boolean
              max_distance_km?: number
              page_number?: number
              page_size?: number
              search_language?: string
              search_query?: string
              user_lat?: number
              user_lon?: number
            }
            Returns: {
              branch_id: string
              cars_count: number
              description_ar: string
              description_en: string
              distance_km: number
              email: string
              images: string[]
              latitude: number
              location_ar: string
              location_en: string
              longitude: number
              manager_name: string
              name_ar: string
              name_en: string
              phone: string
              search_rank: number
              working_hours: string
            }[]
          }
      search_cars: {
        Args: {
          p_branch_id?: string
          p_brand_id?: string
          p_fuel_type?: string
          p_limit?: number
          p_max_price?: number
          p_min_price?: number
          p_model_id?: string
          p_offset?: number
          p_rental_type?: string
          p_search_query?: string
          p_sort_by?: string
          p_transmission?: string
        }
        Returns: {
          available_quantity: number
          branch_name_ar: string
          branch_name_en: string
          brand_name_ar: string
          brand_name_en: string
          color_name_ar: string
          color_name_en: string
          daily_price: number
          features_ar: string[]
          features_en: string[]
          fuel_type: string
          id: string
          model_name_ar: string
          model_name_en: string
          monthly_price: number
          relevance_score: number
          seats: number
          status: string
          total_results: number
          transmission: string
          weekly_price: number
        }[]
      }
      search_models:
        | {
            Args: {
              p_brand_id?: string
              p_limit?: number
              p_max_price?: number
              p_min_price?: number
              p_offset?: number
              p_search_query?: string
              p_year?: number
            }
            Returns: {
              available_cars_count: number
              brand_name_ar: string
              brand_name_en: string
              default_image_url: string
              id: string
              max_daily_price: number
              min_daily_price: number
              name_ar: string
              name_en: string
              total_results: number
              year: number
            }[]
          }
        | {
            Args: {
              brand_ids?: string[]
              is_active_filter?: boolean
              max_year?: number
              min_year?: number
              page_number?: number
              page_size?: number
              search_language?: string
              search_query?: string
            }
            Returns: {
              available_cars_count: number
              brand_logo_url: string
              brand_name_ar: string
              brand_name_en: string
              default_image_url: string
              description_ar: string
              description_en: string
              min_daily_price: number
              model_id: string
              name_ar: string
              name_en: string
              search_rank: number
              specifications: Json
              year: number
            }[]
          }
      search_user_bookings: {
        Args: { p_limit?: number; p_search_query: string; p_user_id?: string }
        Returns: {
          branch_info: string
          car_info: string
          created_at: string
          end_date: string
          final_amount: number
          id: string
          start_date: string
          status: Database["public"]["Enums"]["booking_status"]
        }[]
      }
      send_notification: {
        Args: {
          p_message_ar: string
          p_message_en: string
          p_metadata?: Json
          p_title_ar: string
          p_title_en: string
          p_type: Database["public"]["Enums"]["notification_type"]
          p_user_id: string
        }
        Returns: string
      }
      set_car_features: {
        Args: { p_car_id: string; p_feature_ids: string[] }
        Returns: undefined
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      st_3dclosestpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3ddistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_3dintersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_3dlongestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3dmakebox: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3dmaxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_3dshortestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_addpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_angle:
        | { Args: { line1: unknown; line2: unknown }; Returns: number }
        | {
            Args: { pt1: unknown; pt2: unknown; pt3: unknown; pt4?: unknown }
            Returns: number
          }
      st_area:
        | { Args: { geog: unknown; use_spheroid?: boolean }; Returns: number }
        | { Args: { "": string }; Returns: number }
      st_asencodedpolyline: {
        Args: { geom: unknown; nprecision?: number }
        Returns: string
      }
      st_asewkt: { Args: { "": string }; Returns: string }
      st_asgeojson:
        | {
            Args: {
              geom_column?: string
              maxdecimaldigits?: number
              pretty_bool?: boolean
              r: Record<string, unknown>
            }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_asgml:
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | {
            Args: {
              geom: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
              version: number
            }
            Returns: string
          }
        | {
            Args: {
              geog: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
            }
            Returns: string
          }
        | {
            Args: {
              geog: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
              version: number
            }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_askml:
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; nprefix?: string }
            Returns: string
          }
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; nprefix?: string }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_aslatlontext: {
        Args: { geom: unknown; tmpl?: string }
        Returns: string
      }
      st_asmarc21: { Args: { format?: string; geom: unknown }; Returns: string }
      st_asmvtgeom: {
        Args: {
          bounds: unknown
          buffer?: number
          clip_geom?: boolean
          extent?: number
          geom: unknown
        }
        Returns: unknown
      }
      st_assvg:
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; rel?: number }
            Returns: string
          }
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; rel?: number }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_astext: { Args: { "": string }; Returns: string }
      st_astwkb:
        | {
            Args: {
              geom: unknown[]
              ids: number[]
              prec?: number
              prec_m?: number
              prec_z?: number
              with_boxes?: boolean
              with_sizes?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              geom: unknown
              prec?: number
              prec_m?: number
              prec_z?: number
              with_boxes?: boolean
              with_sizes?: boolean
            }
            Returns: string
          }
      st_asx3d: {
        Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
        Returns: string
      }
      st_azimuth:
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
        | { Args: { geog1: unknown; geog2: unknown }; Returns: number }
      st_boundingdiagonal: {
        Args: { fits?: boolean; geom: unknown }
        Returns: unknown
      }
      st_buffer:
        | {
            Args: { geom: unknown; options?: string; radius: number }
            Returns: unknown
          }
        | {
            Args: { geom: unknown; quadsegs: number; radius: number }
            Returns: unknown
          }
      st_centroid: { Args: { "": string }; Returns: unknown }
      st_clipbybox2d: {
        Args: { box: unknown; geom: unknown }
        Returns: unknown
      }
      st_closestpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_collect: { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
      st_concavehull: {
        Args: {
          param_allow_holes?: boolean
          param_geom: unknown
          param_pctconvex: number
        }
        Returns: unknown
      }
      st_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_containsproperly: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_coorddim: { Args: { geometry: unknown }; Returns: number }
      st_coveredby:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_covers:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_crosses: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_curvetoline: {
        Args: { flags?: number; geom: unknown; tol?: number; toltype?: number }
        Returns: unknown
      }
      st_delaunaytriangles: {
        Args: { flags?: number; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_difference: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_disjoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_distance:
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
        | {
            Args: { geog1: unknown; geog2: unknown; use_spheroid?: boolean }
            Returns: number
          }
      st_distancesphere:
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
        | {
            Args: { geom1: unknown; geom2: unknown; radius: number }
            Returns: number
          }
      st_distancespheroid: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_dwithin: {
        Args: {
          geog1: unknown
          geog2: unknown
          tolerance: number
          use_spheroid?: boolean
        }
        Returns: boolean
      }
      st_equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_expand:
        | {
            Args: {
              dm?: number
              dx: number
              dy: number
              dz?: number
              geom: unknown
            }
            Returns: unknown
          }
        | {
            Args: { box: unknown; dx: number; dy: number; dz?: number }
            Returns: unknown
          }
        | { Args: { box: unknown; dx: number; dy: number }; Returns: unknown }
      st_force3d: { Args: { geom: unknown; zvalue?: number }; Returns: unknown }
      st_force3dm: {
        Args: { geom: unknown; mvalue?: number }
        Returns: unknown
      }
      st_force3dz: {
        Args: { geom: unknown; zvalue?: number }
        Returns: unknown
      }
      st_force4d: {
        Args: { geom: unknown; mvalue?: number; zvalue?: number }
        Returns: unknown
      }
      st_generatepoints:
        | {
            Args: { area: unknown; npoints: number; seed: number }
            Returns: unknown
          }
        | { Args: { area: unknown; npoints: number }; Returns: unknown }
      st_geogfromtext: { Args: { "": string }; Returns: unknown }
      st_geographyfromtext: { Args: { "": string }; Returns: unknown }
      st_geohash:
        | { Args: { geom: unknown; maxchars?: number }; Returns: string }
        | { Args: { geog: unknown; maxchars?: number }; Returns: string }
      st_geomcollfromtext: { Args: { "": string }; Returns: unknown }
      st_geometricmedian: {
        Args: {
          fail_if_not_converged?: boolean
          g: unknown
          max_iter?: number
          tolerance?: number
        }
        Returns: unknown
      }
      st_geometryfromtext: { Args: { "": string }; Returns: unknown }
      st_geomfromewkt: { Args: { "": string }; Returns: unknown }
      st_geomfromgeojson:
        | { Args: { "": Json }; Returns: unknown }
        | { Args: { "": Json }; Returns: unknown }
        | { Args: { "": string }; Returns: unknown }
      st_geomfromgml: { Args: { "": string }; Returns: unknown }
      st_geomfromkml: { Args: { "": string }; Returns: unknown }
      st_geomfrommarc21: { Args: { marc21xml: string }; Returns: unknown }
      st_geomfromtext: { Args: { "": string }; Returns: unknown }
      st_gmltosql: { Args: { "": string }; Returns: unknown }
      st_hasarc: { Args: { geometry: unknown }; Returns: boolean }
      st_hausdorffdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_hexagon: {
        Args: { cell_i: number; cell_j: number; origin?: unknown; size: number }
        Returns: unknown
      }
      st_hexagongrid: {
        Args: { bounds: unknown; size: number }
        Returns: Record<string, unknown>[]
      }
      st_interpolatepoint: {
        Args: { line: unknown; point: unknown }
        Returns: number
      }
      st_intersection: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_intersects:
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
      st_isvaliddetail: {
        Args: { flags?: number; geom: unknown }
        Returns: Database["public"]["CompositeTypes"]["valid_detail"]
        SetofOptions: {
          from: "*"
          to: "valid_detail"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      st_length:
        | { Args: { geog: unknown; use_spheroid?: boolean }; Returns: number }
        | { Args: { "": string }; Returns: number }
      st_letters: { Args: { font?: Json; letters: string }; Returns: unknown }
      st_linecrossingdirection: {
        Args: { line1: unknown; line2: unknown }
        Returns: number
      }
      st_linefromencodedpolyline: {
        Args: { nprecision?: number; txtin: string }
        Returns: unknown
      }
      st_linefromtext: { Args: { "": string }; Returns: unknown }
      st_linelocatepoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_linetocurve: { Args: { geometry: unknown }; Returns: unknown }
      st_locatealong: {
        Args: { geometry: unknown; leftrightoffset?: number; measure: number }
        Returns: unknown
      }
      st_locatebetween: {
        Args: {
          frommeasure: number
          geometry: unknown
          leftrightoffset?: number
          tomeasure: number
        }
        Returns: unknown
      }
      st_locatebetweenelevations: {
        Args: { fromelevation: number; geometry: unknown; toelevation: number }
        Returns: unknown
      }
      st_longestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makebox2d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makeline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makevalid: {
        Args: { geom: unknown; params: string }
        Returns: unknown
      }
      st_maxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_minimumboundingcircle: {
        Args: { inputgeom: unknown; segs_per_quarter?: number }
        Returns: unknown
      }
      st_mlinefromtext: { Args: { "": string }; Returns: unknown }
      st_mpointfromtext: { Args: { "": string }; Returns: unknown }
      st_mpolyfromtext: { Args: { "": string }; Returns: unknown }
      st_multilinestringfromtext: { Args: { "": string }; Returns: unknown }
      st_multipointfromtext: { Args: { "": string }; Returns: unknown }
      st_multipolygonfromtext: { Args: { "": string }; Returns: unknown }
      st_node: { Args: { g: unknown }; Returns: unknown }
      st_normalize: { Args: { geom: unknown }; Returns: unknown }
      st_offsetcurve: {
        Args: { distance: number; line: unknown; params?: string }
        Returns: unknown
      }
      st_orderingequals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_perimeter: {
        Args: { geog: unknown; use_spheroid?: boolean }
        Returns: number
      }
      st_pointfromtext: { Args: { "": string }; Returns: unknown }
      st_pointm: {
        Args: {
          mcoordinate: number
          srid?: number
          xcoordinate: number
          ycoordinate: number
        }
        Returns: unknown
      }
      st_pointz: {
        Args: {
          srid?: number
          xcoordinate: number
          ycoordinate: number
          zcoordinate: number
        }
        Returns: unknown
      }
      st_pointzm: {
        Args: {
          mcoordinate: number
          srid?: number
          xcoordinate: number
          ycoordinate: number
          zcoordinate: number
        }
        Returns: unknown
      }
      st_polyfromtext: { Args: { "": string }; Returns: unknown }
      st_polygonfromtext: { Args: { "": string }; Returns: unknown }
      st_project: {
        Args: { azimuth: number; distance: number; geog: unknown }
        Returns: unknown
      }
      st_quantizecoordinates: {
        Args: {
          g: unknown
          prec_m?: number
          prec_x: number
          prec_y?: number
          prec_z?: number
        }
        Returns: unknown
      }
      st_reduceprecision: {
        Args: { geom: unknown; gridsize: number }
        Returns: unknown
      }
      st_relate: { Args: { geom1: unknown; geom2: unknown }; Returns: string }
      st_removerepeatedpoints: {
        Args: { geom: unknown; tolerance?: number }
        Returns: unknown
      }
      st_segmentize: {
        Args: { geog: unknown; max_segment_length: number }
        Returns: unknown
      }
      st_setsrid:
        | { Args: { geom: unknown; srid: number }; Returns: unknown }
        | { Args: { geog: unknown; srid: number }; Returns: unknown }
      st_sharedpaths: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_shortestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_simplifypolygonhull: {
        Args: { geom: unknown; is_outer?: boolean; vertex_fraction: number }
        Returns: unknown
      }
      st_split: { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
      st_square: {
        Args: { cell_i: number; cell_j: number; origin?: unknown; size: number }
        Returns: unknown
      }
      st_squaregrid: {
        Args: { bounds: unknown; size: number }
        Returns: Record<string, unknown>[]
      }
      st_srid:
        | { Args: { geom: unknown }; Returns: number }
        | { Args: { geog: unknown }; Returns: number }
      st_subdivide: {
        Args: { geom: unknown; gridsize?: number; maxvertices?: number }
        Returns: unknown[]
      }
      st_swapordinates: {
        Args: { geom: unknown; ords: unknown }
        Returns: unknown
      }
      st_symdifference: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_symmetricdifference: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_tileenvelope: {
        Args: {
          bounds?: unknown
          margin?: number
          x: number
          y: number
          zoom: number
        }
        Returns: unknown
      }
      st_touches: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_transform:
        | { Args: { geom: unknown; to_proj: string }; Returns: unknown }
        | {
            Args: { from_proj: string; geom: unknown; to_srid: number }
            Returns: unknown
          }
        | {
            Args: { from_proj: string; geom: unknown; to_proj: string }
            Returns: unknown
          }
      st_triangulatepolygon: { Args: { g1: unknown }; Returns: unknown }
      st_union:
        | { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
        | {
            Args: { geom1: unknown; geom2: unknown; gridsize: number }
            Returns: unknown
          }
      st_voronoilines: {
        Args: { extend_to?: unknown; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_voronoipolygons: {
        Args: { extend_to?: unknown; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_within: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_wkbtosql: { Args: { wkb: string }; Returns: unknown }
      st_wkttosql: { Args: { "": string }; Returns: unknown }
      st_wrapx: {
        Args: { geom: unknown; move: number; wrap: number }
        Returns: unknown
      }
      test_rate_limit: {
        Args: { p_action_type: string; p_identifier: string }
        Returns: {
          attempt_number: number
          is_allowed: boolean
          remaining_attempts: number
          total_attempts: number
        }[]
      }
      toggle_announcement_status: {
        Args: { p_announcement_id: string }
        Returns: {
          branch_id: string | null
          created_at: string
          created_by: string
          description_ar: string | null
          description_en: string | null
          expires_at: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          is_featured: boolean | null
          priority: Database["public"]["Enums"]["announcement_priority"] | null
          title_ar: string | null
          title_en: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "announcements"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      unlockrows: { Args: { "": string }; Returns: number }
      update_booking_notes: {
        Args: { p_booking_id: string; p_notes: string }
        Returns: {
          approved_at: string | null
          approved_by: string | null
          booking_range: unknown
          branch_id: string
          car_id: string
          created_at: string
          customer_id: string
          daily_rate: number
          discount_amount: number | null
          end_date: string
          expires_at: string | null
          final_amount: number
          id: string
          notes: string | null
          payment_reference: string | null
          rental_type: Database["public"]["Enums"]["rental_type"]
          start_date: string
          status: Database["public"]["Enums"]["booking_status"] | null
          total_amount: number
          total_days: number
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "bookings"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      update_booking_to_payment_pending: {
        Args: { p_booking_id: string; p_user_id: string }
        Returns: {
          message: string
          new_expires_at: string
          success: boolean
        }[]
      }
      update_document_status: {
        Args: {
          p_document_id: string
          p_new_status: Database["public"]["Enums"]["document_status"]
          p_reason?: string
        }
        Returns: {
          created_at: string
          document_type: string
          document_url: string
          id: string
          rejection_reason: string | null
          status: Database["public"]["Enums"]["document_status"] | null
          updated_at: string
          user_id: string
          verified_at: string | null
          verified_by: string | null
        }
        SetofOptions: {
          from: "*"
          to: "documents"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      update_user_location: {
        Args: {
          _location: string
          _user_latitude: number
          _user_longitude: number
        }
        Returns: undefined
      }
      update_user_profile: {
        Args: {
          _age?: number
          _full_name?: string
          _gender?: string
          _location?: string
          _phone?: string
          _user_latitude?: number
          _user_longitude?: number
        }
        Returns: undefined
      }
      updategeometrysrid: {
        Args: {
          catalogn_name: string
          column_name: string
          new_srid_in: number
          schema_name: string
          table_name: string
        }
        Returns: string
      }
      validate_and_prepare_booking_for_payment: {
        Args: { p_booking_id: string; p_user_id: string }
        Returns: {
          booking_data: Json
          error_code: string
          error_message: string
          is_valid: boolean
        }[]
      }
      validate_booking_dates: {
        Args: { p_end_date: string; p_min_days?: number; p_start_date: string }
        Returns: {
          error_code: string
          error_message_ar: string
          error_message_en: string
          is_valid: boolean
        }[]
      }
      verify_system_health: {
        Args: never
        Returns: {
          component: string
          details: string
          status: string
        }[]
      }
      verify_user_phone: { Args: { _phone: string }; Returns: string }
    }
    Enums: {
      announcement_priority: "normal" | "high"
      booking_status:
        | "pending"
        | "confirmed"
        | "payment_pending"
        | "active"
        | "completed"
        | "cancelled"
        | "expired"
      car_status: "available" | "rented" | "maintenance" | "hidden"
      document_status: "pending" | "approved" | "rejected"
      notification_type:
        | "info"
        | "warning"
        | "booking_update"
        | "system"
        | "booking_cancelled"
        | "booking_expired"
        | "booking_completed"
      rental_type: "daily" | "weekly" | "monthly" | "ownership"
      user_role: "admin" | "branch" | "branch_employee" | "customer"
    }
    CompositeTypes: {
      geometry_dump: {
        path: number[] | null
        geom: unknown
      }
      valid_detail: {
        valid: boolean | null
        reason: string | null
        location: unknown
      }
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      announcement_priority: ["normal", "high"],
      booking_status: [
        "pending",
        "confirmed",
        "payment_pending",
        "active",
        "completed",
        "cancelled",
        "expired",
      ],
      car_status: ["available", "rented", "maintenance", "hidden"],
      document_status: ["pending", "approved", "rejected"],
      notification_type: [
        "info",
        "warning",
        "booking_update",
        "system",
        "booking_cancelled",
        "booking_expired",
        "booking_completed",
      ],
      rental_type: ["daily", "weekly", "monthly", "ownership"],
      user_role: ["admin", "branch", "branch_employee", "customer"],
    },
  },
} as const
