// Generado desde Supabase (proyecto lunallena-planificador). No editar a mano:
// después de cada migración, regenerar con el MCP de Supabase o `supabase gen types typescript`.
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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      destinations: {
        Row: {
          active: boolean
          altitude_m: number
          created_at: string
          id: string
          image_url: string | null
          is_core: boolean
          min_nights: number
          name: string
          region: string
          route_order: number
          slug: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          altitude_m: number
          created_at?: string
          id?: string
          image_url?: string | null
          is_core?: boolean
          min_nights?: number
          name: string
          region: string
          route_order: number
          slug: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          altitude_m?: number
          created_at?: string
          id?: string
          image_url?: string | null
          is_core?: boolean
          min_nights?: number
          name?: string
          region?: string
          route_order?: number
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      experiences: {
        Row: {
          active: boolean
          closed_months: number[]
          created_at: string
          days: number
          destination_id: string
          difficulty: number
          duration: Database["public"]["Enums"]["experience_duration"]
          ends_at_destination_id: string | null
          id: string
          image_url: string | null
          is_icon: boolean
          is_outdoor: boolean
          is_trek: boolean
          max_altitude_m: number | null
          name: string
          price_from_pen: number
          slug: string
          source_url: string | null
          styles: Database["public"]["Enums"]["trip_style"][]
          updated_at: string
        }
        Insert: {
          active?: boolean
          closed_months?: number[]
          created_at?: string
          days?: number
          destination_id: string
          difficulty: number
          duration: Database["public"]["Enums"]["experience_duration"]
          ends_at_destination_id?: string | null
          id?: string
          image_url?: string | null
          is_icon?: boolean
          is_outdoor?: boolean
          is_trek?: boolean
          max_altitude_m?: number | null
          name: string
          price_from_pen: number
          slug: string
          source_url?: string | null
          styles?: Database["public"]["Enums"]["trip_style"][]
          updated_at?: string
        }
        Update: {
          active?: boolean
          closed_months?: number[]
          created_at?: string
          days?: number
          destination_id?: string
          difficulty?: number
          duration?: Database["public"]["Enums"]["experience_duration"]
          ends_at_destination_id?: string | null
          id?: string
          image_url?: string | null
          is_icon?: boolean
          is_outdoor?: boolean
          is_trek?: boolean
          max_altitude_m?: number | null
          name?: string
          price_from_pen?: number
          slug?: string
          source_url?: string | null
          styles?: Database["public"]["Enums"]["trip_style"][]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "experiences_destination_id_fkey"
            columns: ["destination_id"]
            isOneToOne: false
            referencedRelation: "destinations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "experiences_ends_at_destination_id_fkey"
            columns: ["ends_at_destination_id"]
            isOneToOne: false
            referencedRelation: "destinations"
            referencedColumns: ["id"]
          },
        ]
      }
      hotel_tiers: {
        Row: {
          active: boolean
          created_at: string
          destination_id: string
          id: string
          price_per_night_from_pen: number
          tier: Database["public"]["Enums"]["hotel_tier"]
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          destination_id: string
          id?: string
          price_per_night_from_pen: number
          tier: Database["public"]["Enums"]["hotel_tier"]
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          destination_id?: string
          id?: string
          price_per_night_from_pen?: number
          tier?: Database["public"]["Enums"]["hotel_tier"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hotel_tiers_destination_id_fkey"
            columns: ["destination_id"]
            isOneToOne: false
            referencedRelation: "destinations"
            referencedColumns: ["id"]
          },
        ]
      }
      itineraries: {
        Row: {
          answers: Json
          created_at: string
          days: Json
          edit_token_hash: string
          id: string
          lang: string
          price_from_total_pen: number | null
          share_slug: string
          source: Database["public"]["Enums"]["itinerary_source"]
          updated_at: string
        }
        Insert: {
          answers?: Json
          created_at?: string
          days?: Json
          edit_token_hash: string
          id?: string
          lang?: string
          price_from_total_pen?: number | null
          share_slug: string
          source: Database["public"]["Enums"]["itinerary_source"]
          updated_at?: string
        }
        Update: {
          answers?: Json
          created_at?: string
          days?: Json
          edit_token_hash?: string
          id?: string
          lang?: string
          price_from_total_pen?: number | null
          share_slug?: string
          source?: Database["public"]["Enums"]["itinerary_source"]
          updated_at?: string
        }
        Relationships: []
      }
      legs: {
        Row: {
          active: boolean
          created_at: string
          from_id: string
          hours: number
          id: string
          mode: Database["public"]["Enums"]["transport_mode"]
          to_id: string
          updated_at: string
          uses_full_day: boolean
        }
        Insert: {
          active?: boolean
          created_at?: string
          from_id: string
          hours: number
          id?: string
          mode: Database["public"]["Enums"]["transport_mode"]
          to_id: string
          updated_at?: string
          uses_full_day?: boolean
        }
        Update: {
          active?: boolean
          created_at?: string
          from_id?: string
          hours?: number
          id?: string
          mode?: Database["public"]["Enums"]["transport_mode"]
          to_id?: string
          updated_at?: string
          uses_full_day?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "legs_from_id_fkey"
            columns: ["from_id"]
            isOneToOne: false
            referencedRelation: "destinations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "legs_to_id_fkey"
            columns: ["to_id"]
            isOneToOne: false
            referencedRelation: "destinations"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_requests: {
        Row: {
          attachment_path: string | null
          code: string
          created_at: string
          email: string
          id: string
          itinerary_id: string | null
          month: number | null
          name: string
          notes: string | null
          status: Database["public"]["Enums"]["quote_status"]
          travelers: number
          updated_at: string
          whatsapp: string
        }
        Insert: {
          attachment_path?: string | null
          code: string
          created_at?: string
          email: string
          id?: string
          itinerary_id?: string | null
          month?: number | null
          name: string
          notes?: string | null
          status?: Database["public"]["Enums"]["quote_status"]
          travelers: number
          updated_at?: string
          whatsapp: string
        }
        Update: {
          attachment_path?: string | null
          code?: string
          created_at?: string
          email?: string
          id?: string
          itinerary_id?: string | null
          month?: number | null
          name?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["quote_status"]
          travelers?: number
          updated_at?: string
          whatsapp?: string
        }
        Relationships: [
          {
            foreignKeyName: "quote_requests_itinerary_id_fkey"
            columns: ["itinerary_id"]
            isOneToOne: false
            referencedRelation: "itineraries"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      experience_duration: "medio_dia" | "dia" | "varios_dias"
      hotel_tier: "economico" | "estandar" | "superior"
      itinerary_source: "A" | "B" | "mixto"
      quote_status: "nuevo" | "contactado" | "cotizado" | "cerrado" | "perdido"
      transport_mode: "bus" | "tren" | "vuelo"
      trip_style: "clasico" | "aventura" | "mistico" | "relax"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      experience_duration: ["medio_dia", "dia", "varios_dias"],
      hotel_tier: ["economico", "estandar", "superior"],
      itinerary_source: ["A", "B", "mixto"],
      quote_status: ["nuevo", "contactado", "cotizado", "cerrado", "perdido"],
      transport_mode: ["bus", "tren", "vuelo"],
      trip_style: ["clasico", "aventura", "mistico", "relax"],
    },
  },
} as const
