export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      // ... (existing tables)
      alerts: {
        Row: {
          id: string
          tenant_id: string
          type: 'agenda' | 'financeiro' | 'cliente' | 'profissional'
          message: string
          level: 'info' | 'atencao' | 'critico'
          action_link: string | null
          action_label: string | null
          resolved: boolean
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          type: 'agenda' | 'financeiro' | 'cliente' | 'profissional'
          message: string
          level: 'info' | 'atencao' | 'critico'
          action_link?: string | null
          action_label?: string | null
          resolved?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          type?: 'agenda' | 'financeiro' | 'cliente' | 'profissional'
          message?: string
          level?: 'info' | 'atencao' | 'critico'
          action_link?: string | null
          action_label?: string | null
          resolved?: boolean
          created_at?: string
        }
      }
      // ... (rest of existing tables)
      tenants: {
        Row: {
          id: string
          name: string
          slug: string
          owner_id: string
          plan_id: string
          status: string
          settings: Json
          subscription: Json
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          owner_id?: string
          plan_id?: string
          status?: string
          settings?: Json
          subscription?: Json
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          owner_id?: string
          plan_id?: string
          status?: string
          settings?: Json
          subscription?: Json
          created_at?: string
        }
      }
      clients: {
        Row: {
          id: string
          tenant_id: string
          name: string
          phone: string
          email: string | null
          address_data: Json
          ltv: number
          visit_count: number
          last_visit: string | null
          status: string
          segment: string
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          name: string
          phone: string
          email?: string | null
          address_data?: Json
          ltv?: number
          visit_count?: number
          last_visit?: string | null
          status?: string
          segment?: string
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          name?: string
          phone?: string
          email?: string | null
          address_data?: Json
          ltv?: number
          visit_count?: number
          last_visit?: string | null
          status?: string
          segment?: string
          notes?: string | null
          created_at?: string
        }
      }
      vehicles: {
        Row: {
          id: string
          tenant_id: string
          client_id: string
          model: string
          plate: string
          color: string
          year: string
          size: string
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          client_id: string
          model: string
          plate: string
          color: string
          year: string
          size: string
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          client_id?: string
          model?: string
          plate?: string
          color?: string
          year?: string
          size?: string
          created_at?: string
        }
      }
      work_orders: {
        Row: {
          id: string
          tenant_id: string
          client_id: string
          vehicle_plate: string
          service_summary: string
          status: string
          total_value: number
          technician: string
          deadline: string | null
          created_at: string
          payment_status: string
          payment_method: string | null
          nps_score: number | null
          json_data: Json
        }
        Insert: {
          id: string
          tenant_id: string
          client_id: string
          vehicle_plate: string
          service_summary: string
          status?: string
          total_value?: number
          technician?: string
          deadline?: string | null
          created_at?: string
          payment_status?: string
          payment_method?: string | null
          nps_score?: number | null
          json_data?: Json
        }
        Update: {
          id?: string
          tenant_id?: string
          client_id?: string
          vehicle_plate?: string
          service_summary?: string
          status?: string
          total_value?: number
          technician?: string
          deadline?: string | null
          created_at?: string
          payment_status?: string
          payment_method?: string | null
          nps_score?: number | null
          json_data?: Json
        }
      }
      inventory: {
        Row: {
          id: number
          tenant_id: string
          name: string
          category: string
          stock: number
          unit: string
          min_stock: number
          cost_price: number
          status: string
          created_at: string
        }
        Insert: {
          id?: number
          tenant_id: string
          name: string
          category: string
          stock?: number
          unit?: string
          min_stock?: number
          cost_price?: number
          status?: string
          created_at?: string
        }
        Update: {
          id?: number
          tenant_id?: string
          name?: string
          category?: string
          stock?: number
          unit?: string
          min_stock?: number
          cost_price?: number
          status?: string
          created_at?: string
        }
      }
      financial_transactions: {
        Row: {
          id: number
          tenant_id: string
          description: string
          category: string
          amount: number
          type: string
          date: string
          method: string
          status: string
          created_at: string
        }
        Insert: {
          id?: number
          tenant_id: string
          description: string
          category: string
          amount: number
          type: string
          date: string
          method: string
          status?: string
          created_at?: string
        }
        Update: {
          id?: number
          tenant_id?: string
          description?: string
          category?: string
          amount?: number
          type?: string
          date?: string
          method?: string
          status?: string
          created_at?: string
        }
      }
      services: {
        Row: {
          id: string
          tenant_id: string
          name: string
          category: string
          description: string | null
          standard_time: number
          active: boolean
          price_matrix: Json
          created_at: string
        }
        Insert: {
          id: string
          tenant_id: string
          name: string
          category: string
          description?: string | null
          standard_time?: number
          active?: boolean
          price_matrix?: Json
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          name?: string
          category?: string
          description?: string | null
          standard_time?: number
          active?: boolean
          price_matrix?: Json
          created_at?: string
        }
      }
      employees: {
        Row: {
          id: string
          tenant_id: string
          name: string
          role: string
          pin: string
          salary_data: Json
          active: boolean
          balance: number
          created_at: string
        }
        Insert: {
          id: string
          tenant_id: string
          name: string
          role: string
          pin: string
          salary_data?: Json
          active?: boolean
          balance?: number
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          name?: string
          role?: string
          pin?: string
          salary_data?: Json
          active?: boolean
          balance?: number
          created_at?: string
        }
      }
      rewards: {
        Row: {
          id: string
          tenant_id: string
          name: string
          description: string
          required_points: number
          required_level: string
          reward_type: string
          config: Json 
          active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          name: string
          description: string
          required_points: number
          required_level: string
          reward_type: string
          config?: Json
          active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          name?: string
          description?: string
          required_points?: number
          required_level?: string
          reward_type?: string
          config?: Json
          active?: boolean
          created_at?: string
        }
      }
      redemptions: {
        Row: {
          id: string
          tenant_id: string
          client_id: string
          reward_id: string
          reward_name: string
          code: string
          points_cost: number
          status: string
          redeemed_at: string
          used_at: string | null
        }
        Insert: {
          id?: string
          tenant_id: string
          client_id: string
          reward_id: string
          reward_name: string
          code: string
          points_cost: number
          status: string
          redeemed_at?: string
          used_at?: string | null
        }
        Update: {
          id?: string
          tenant_id?: string
          client_id?: string
          reward_id?: string
          reward_name?: string
          code?: string
          points_cost?: number
          status?: string
          redeemed_at?: string
          used_at?: string | null
        }
      }
      fidelity_cards: {
        Row: {
          id: string
          tenant_id: string
          client_id: string
          card_number: string
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          client_id: string
          card_number: string
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          client_id?: string
          card_number?: string
          created_at?: string
        }
      }
      points_history: {
        Row: {
          id: string
          tenant_id: string
          client_id: string
          points: number
          description: string
          type: string
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          client_id: string
          points: number
          description: string
          type: string
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          client_id?: string
          points?: number
          description?: string
          type?: string
          created_at?: string
        }
      }
      marketing_campaigns: {
        Row: {
          id: string
          tenant_id: string
          name: string
          target_segment: string
          message_template: string | null
          sent_count: number
          conversion_count: number
          revenue_generated: number
          cost_in_tokens: number
          status: string
          date: string
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          name: string
          target_segment: string
          message_template?: string | null
          sent_count?: number
          conversion_count?: number
          revenue_generated?: number
          cost_in_tokens?: number
          status?: string
          date?: string
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          name?: string
          target_segment?: string
          message_template?: string | null
          sent_count?: number
          conversion_count?: number
          revenue_generated?: number
          cost_in_tokens?: number
          status?: string
          date?: string
          created_at?: string
        }
      }
    }
  }
}
