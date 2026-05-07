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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      doctors: {
        Row: {
          bio: string | null
          consultation_fee: number | null
          council_reg_number: string
          created_at: string
          doctor_code: string
          experience_years: number | null
          hospital_id: string | null
          id: string
          languages: string[] | null
          opd_days: string[] | null
          opd_end_time: string | null
          opd_start_time: string | null
          qualification: string
          rating: number | null
          specialization: string
        }
        Insert: {
          bio?: string | null
          consultation_fee?: number | null
          council_reg_number: string
          created_at?: string
          doctor_code: string
          experience_years?: number | null
          hospital_id?: string | null
          id: string
          languages?: string[] | null
          opd_days?: string[] | null
          opd_end_time?: string | null
          opd_start_time?: string | null
          qualification: string
          rating?: number | null
          specialization: string
        }
        Update: {
          bio?: string | null
          consultation_fee?: number | null
          council_reg_number?: string
          created_at?: string
          doctor_code?: string
          experience_years?: number | null
          hospital_id?: string | null
          id?: string
          languages?: string[] | null
          opd_days?: string[] | null
          opd_end_time?: string | null
          opd_start_time?: string | null
          qualification?: string
          rating?: number | null
          specialization?: string
        }
        Relationships: [
          {
            foreignKeyName: "doctors_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
        ]
      }
      hospital_admins: {
        Row: {
          created_at: string
          designation: string | null
          hospital_id: string
          id: string
        }
        Insert: {
          created_at?: string
          designation?: string | null
          hospital_id: string
          id: string
        }
        Update: {
          created_at?: string
          designation?: string | null
          hospital_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hospital_admins_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
        ]
      }
      hospitals: {
        Row: {
          address: string | null
          beds_general: number | null
          beds_icu: number | null
          beds_nicu: number | null
          city: string | null
          created_at: string
          district: string | null
          email: string | null
          facilities: string[] | null
          hospital_type: string
          id: string
          insurance_panels: string[] | null
          latitude: number | null
          longitude: number | null
          name: string
          phone: string | null
          photo_url: string | null
          pincode: string | null
          rating: number | null
          review_count: number | null
          specialities: string[] | null
          state: string
        }
        Insert: {
          address?: string | null
          beds_general?: number | null
          beds_icu?: number | null
          beds_nicu?: number | null
          city?: string | null
          created_at?: string
          district?: string | null
          email?: string | null
          facilities?: string[] | null
          hospital_type: string
          id?: string
          insurance_panels?: string[] | null
          latitude?: number | null
          longitude?: number | null
          name: string
          phone?: string | null
          photo_url?: string | null
          pincode?: string | null
          rating?: number | null
          review_count?: number | null
          specialities?: string[] | null
          state: string
        }
        Update: {
          address?: string | null
          beds_general?: number | null
          beds_icu?: number | null
          beds_nicu?: number | null
          city?: string | null
          created_at?: string
          district?: string | null
          email?: string | null
          facilities?: string[] | null
          hospital_type?: string
          id?: string
          insurance_panels?: string[] | null
          latitude?: number | null
          longitude?: number | null
          name?: string
          phone?: string | null
          photo_url?: string | null
          pincode?: string | null
          rating?: number | null
          review_count?: number | null
          specialities?: string[] | null
          state?: string
        }
        Relationships: []
      }
      patients: {
        Row: {
          aadhaar_full: string | null
          aadhaar_last4: string | null
          address_line: string | null
          blood_group: string | null
          city: string | null
          created_at: string
          date_of_birth: string
          district: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          gender: string
          id: string
          patient_code: string
          pincode: string | null
          state: string
          state_code: string
        }
        Insert: {
          aadhaar_full?: string | null
          aadhaar_last4?: string | null
          address_line?: string | null
          blood_group?: string | null
          city?: string | null
          created_at?: string
          date_of_birth: string
          district?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          gender: string
          id: string
          patient_code: string
          pincode?: string | null
          state: string
          state_code: string
        }
        Update: {
          aadhaar_full?: string | null
          aadhaar_last4?: string | null
          address_line?: string | null
          blood_group?: string | null
          city?: string | null
          created_at?: string
          date_of_birth?: string
          district?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          gender?: string
          id?: string
          patient_code?: string
          pincode?: string | null
          state?: string
          state_code?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          phone: string | null
          photo_url: string | null
          preferred_language: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id: string
          phone?: string | null
          photo_url?: string | null
          preferred_language?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          phone?: string | null
          photo_url?: string | null
          preferred_language?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_doctor_code: { Args: never; Returns: string }
      generate_patient_code: { Args: { _state_code: string }; Returns: string }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "patient" | "doctor" | "admin"
    }
    CompositeTypes: {
      [_ in never]: never
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
      app_role: ["patient", "doctor", "admin"],
    },
  },
} as const
