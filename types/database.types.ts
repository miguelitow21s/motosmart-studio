// Auto-generated shape — replace with: npx supabase gen types typescript --project-id <ref> > types/database.types.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          full_name: string
          role: "admin" | "designer" | "production" | "client"
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name: string
          role: "admin" | "designer" | "production" | "client"
          avatar_url?: string | null
        }
        Update: Partial<Database["public"]["Tables"]["users"]["Insert"]>
        Relationships: []
      }
      clients: {
        Row: {
          id: string
          name: string
          phone: string
          email: string | null
          notes: string | null
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          name: string
          phone: string
          email?: string | null
          notes?: string | null
          deleted_at?: string | null
        }
        Update: Partial<Database["public"]["Tables"]["clients"]["Insert"]>
        Relationships: []
      }
      motorcycles: {
        Row: {
          id: string
          brand: string
          model: string
          year: number | null
          displacement: string | null
          notes: string | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          brand: string
          model: string
          year?: number | null
          displacement?: string | null
          notes?: string | null
          is_active?: boolean
        }
        Update: Partial<Database["public"]["Tables"]["motorcycles"]["Insert"]>
        Relationships: []
      }
      orders: {
        Row: {
          id: string
          serial: string
          client_id: string
          motorcycle_id: string | null
          motorcycle_custom: string | null
          work_type: string
          status: string
          total_price: number
          deposit: number
          balance: number
          delivery_date: string | null
          notes: string | null
          public_token: string
          created_by: string
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          client_id: string
          motorcycle_id?: string | null
          motorcycle_custom?: string | null
          work_type: string
          status: string
          total_price: number
          deposit?: number
          delivery_date?: string | null
          notes?: string | null
          created_by: string
          deleted_at?: string | null
        }
        Update: Partial<Database["public"]["Tables"]["orders"]["Insert"]>
        Relationships: [
          {
            foreignKeyName: "orders_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_motorcycle_id_fkey"
            columns: ["motorcycle_id"]
            isOneToOne: false
            referencedRelation: "motorcycles"
            referencedColumns: ["id"]
          }
        ]
      }
      order_designs: {
        Row: {
          id: string
          order_id: string
          template_id: string | null
          fabric_json: Json
          svg_content: string | null
          preview_url: string | null
          version: number
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          order_id: string
          template_id?: string | null
          fabric_json: Json
          svg_content?: string | null
          preview_url?: string | null
          version?: number
          created_by: string
        }
        Update: Partial<Database["public"]["Tables"]["order_designs"]["Insert"]>
        Relationships: [
          {
            foreignKeyName: "order_designs_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          }
        ]
      }
      order_status_history: {
        Row: {
          id: string
          order_id: string
          status: string
          notes: string | null
          created_by: string
          created_at: string
        }
        Insert: {
          order_id: string
          status: string
          notes?: string | null
          created_by: string
        }
        Update: never
        Relationships: [
          {
            foreignKeyName: "order_status_history_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          }
        ]
      }
      seat_templates: {
        Row: {
          id: string
          motorcycle_id: string
          name: string
          svg_content: string
          fabric_json: Json | null
          preview_url: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          motorcycle_id: string
          name: string
          svg_content: string
          fabric_json?: Json | null
          preview_url?: string | null
          is_active?: boolean
        }
        Update: Partial<Database["public"]["Tables"]["seat_templates"]["Insert"]>
        Relationships: [
          {
            foreignKeyName: "seat_templates_motorcycle_id_fkey"
            columns: ["motorcycle_id"]
            isOneToOne: false
            referencedRelation: "motorcycles"
            referencedColumns: ["id"]
          }
        ]
      }
      template_zones: {
        Row: {
          id: string
          template_id: string
          name: string
          path_id: string
          default_color: string | null
          order: number
        }
        Insert: {
          template_id: string
          name: string
          path_id: string
          default_color?: string | null
          order?: number
        }
        Update: Partial<Database["public"]["Tables"]["template_zones"]["Insert"]>
        Relationships: [
          {
            foreignKeyName: "template_zones_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "seat_templates"
            referencedColumns: ["id"]
          }
        ]
      }
      materials: {
        Row: {
          id: string
          name: string
          type: string
          color_hex: string | null
          texture_url: string | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          name: string
          type: string
          color_hex?: string | null
          texture_url?: string | null
          is_active?: boolean
        }
        Update: Partial<Database["public"]["Tables"]["materials"]["Insert"]>
        Relationships: []
      }
      files: {
        Row: {
          id: string
          order_id: string | null
          name: string
          url: string
          type: string
          size: number
          created_by: string
          created_at: string
        }
        Insert: {
          order_id?: string | null
          name: string
          url: string
          type: string
          size: number
          created_by: string
        }
        Update: Partial<Database["public"]["Tables"]["files"]["Insert"]>
        Relationships: [
          {
            foreignKeyName: "files_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          }
        ]
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          title: string
          message: string
          read: boolean
          order_id: string | null
          created_at: string
        }
        Insert: {
          user_id: string
          title: string
          message: string
          read?: boolean
          order_id?: string | null
        }
        Update: Partial<Database["public"]["Tables"]["notifications"]["Insert"]>
        Relationships: [
          {
            foreignKeyName: "notifications_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: Record<string, never>
    Functions: {
      get_dashboard_stats: {
        Args: Record<string, never>
        Returns: Json
      }
      get_order_by_serial: {
        Args: { p_serial: string; p_token: string }
        Returns: Json
      }
      get_next_serial: {
        Args: Record<string, never>
        Returns: string
      }
      current_user_role: {
        Args: Record<string, never>
        Returns: string
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
