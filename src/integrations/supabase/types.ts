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
      ad_integrations: {
        Row: {
          access_token: string | null
          account_id: string | null
          account_name: string | null
          created_at: string
          id: string
          metadata: Json
          platform: string
          refresh_token: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token?: string | null
          account_id?: string | null
          account_name?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          platform: string
          refresh_token?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string | null
          account_id?: string | null
          account_name?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          platform?: string
          refresh_token?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_decisions: {
        Row: {
          action_type: string
          applied_at: string | null
          campaign_id: string | null
          created_at: string
          diagnostic_id: string | null
          evidence: string
          expected_impact: string
          id: string
          payload: Json
          rationale: string
          result: Json
          severity: string
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          action_type: string
          applied_at?: string | null
          campaign_id?: string | null
          created_at?: string
          diagnostic_id?: string | null
          evidence?: string
          expected_impact?: string
          id?: string
          payload?: Json
          rationale: string
          result?: Json
          severity?: string
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          action_type?: string
          applied_at?: string | null
          campaign_id?: string | null
          created_at?: string
          diagnostic_id?: string | null
          evidence?: string
          expected_impact?: string
          id?: string
          payload?: Json
          rationale?: string
          result?: Json
          severity?: string
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_decisions_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_decisions_diagnostic_id_fkey"
            columns: ["diagnostic_id"]
            isOneToOne: false
            referencedRelation: "diagnostics"
            referencedColumns: ["id"]
          },
        ]
      }
      approvals: {
        Row: {
          category: string
          created_at: string
          description: string
          id: string
          impact: string
          level: string
          reasoning: string
          resolved_at: string | null
          status: string
          supporting_data: Json
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string
          description: string
          id?: string
          impact: string
          level?: string
          reasoning: string
          resolved_at?: string | null
          status?: string
          supporting_data?: Json
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          id?: string
          impact?: string
          level?: string
          reasoning?: string
          resolved_at?: string | null
          status?: string
          supporting_data?: Json
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      business_events: {
        Row: {
          company_dna_id: string | null
          created_at: string
          description: string | null
          event_data: Json
          event_type: string
          id: string
          source: string
          title: string
          user_id: string
        }
        Insert: {
          company_dna_id?: string | null
          created_at?: string
          description?: string | null
          event_data?: Json
          event_type: string
          id?: string
          source?: string
          title: string
          user_id: string
        }
        Update: {
          company_dna_id?: string | null
          created_at?: string
          description?: string | null
          event_data?: Json
          event_type?: string
          id?: string
          source?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_events_company_dna_id_fkey"
            columns: ["company_dna_id"]
            isOneToOne: false
            referencedRelation: "company_dna"
            referencedColumns: ["id"]
          },
        ]
      }
      business_memory: {
        Row: {
          company_dna_id: string | null
          content: string | null
          created_at: string
          id: string
          importance: number
          memory_type: string
          occurred_at: string
          raw_data: Json | null
          reference_id: string | null
          reference_table: string | null
          source: string
          summary: string | null
          tags: string[] | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          company_dna_id?: string | null
          content?: string | null
          created_at?: string
          id?: string
          importance?: number
          memory_type: string
          occurred_at?: string
          raw_data?: Json | null
          reference_id?: string | null
          reference_table?: string | null
          source?: string
          summary?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          company_dna_id?: string | null
          content?: string | null
          created_at?: string
          id?: string
          importance?: number
          memory_type?: string
          occurred_at?: string
          raw_data?: Json | null
          reference_id?: string | null
          reference_table?: string | null
          source?: string
          summary?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_memory_company_dna_id_fkey"
            columns: ["company_dna_id"]
            isOneToOne: false
            referencedRelation: "company_dna"
            referencedColumns: ["id"]
          },
        ]
      }
      business_metrics: {
        Row: {
          avg_margin_pct: number | null
          avg_roas: number | null
          avg_ticket: number | null
          cac_current: number | null
          company_dna_id: string | null
          conversion_rate_pct: number | null
          created_at: string
          current_tools: string | null
          id: string
          ltv_estimated: number | null
          monthly_revenue: number | null
          monthly_traffic: number | null
          notes: string | null
          payback_months: number | null
          perceived_bottlenecks: string | null
          snapshot_date: string
          source: string
          team_size: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avg_margin_pct?: number | null
          avg_roas?: number | null
          avg_ticket?: number | null
          cac_current?: number | null
          company_dna_id?: string | null
          conversion_rate_pct?: number | null
          created_at?: string
          current_tools?: string | null
          id?: string
          ltv_estimated?: number | null
          monthly_revenue?: number | null
          monthly_traffic?: number | null
          notes?: string | null
          payback_months?: number | null
          perceived_bottlenecks?: string | null
          snapshot_date?: string
          source?: string
          team_size?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avg_margin_pct?: number | null
          avg_roas?: number | null
          avg_ticket?: number | null
          cac_current?: number | null
          company_dna_id?: string | null
          conversion_rate_pct?: number | null
          created_at?: string
          current_tools?: string | null
          id?: string
          ltv_estimated?: number | null
          monthly_revenue?: number | null
          monthly_traffic?: number | null
          notes?: string | null
          payback_months?: number | null
          perceived_bottlenecks?: string | null
          snapshot_date?: string
          source?: string
          team_size?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_metrics_company_dna_id_fkey"
            columns: ["company_dna_id"]
            isOneToOne: false
            referencedRelation: "company_dna"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_metrics: {
        Row: {
          campaign_id: string
          clicks: number
          conversions: number
          cpa: number | null
          cpc: number | null
          created_at: string
          ctr: number | null
          date: string
          id: string
          impressions: number
          revenue: number
          roas: number | null
          spend: number
          user_id: string
        }
        Insert: {
          campaign_id: string
          clicks?: number
          conversions?: number
          cpa?: number | null
          cpc?: number | null
          created_at?: string
          ctr?: number | null
          date: string
          id?: string
          impressions?: number
          revenue?: number
          roas?: number | null
          spend?: number
          user_id: string
        }
        Update: {
          campaign_id?: string
          clicks?: number
          conversions?: number
          cpa?: number | null
          cpc?: number | null
          created_at?: string
          ctr?: number | null
          date?: string
          id?: string
          impressions?: number
          revenue?: number
          roas?: number | null
          spend?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_metrics_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          budget_daily: number | null
          budget_total: number | null
          created_at: string
          end_date: string | null
          external_id: string | null
          id: string
          integration_id: string | null
          metrics_snapshot: Json
          name: string
          objective: string | null
          platform: string
          start_date: string | null
          status: string
          targeting: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          budget_daily?: number | null
          budget_total?: number | null
          created_at?: string
          end_date?: string | null
          external_id?: string | null
          id?: string
          integration_id?: string | null
          metrics_snapshot?: Json
          name: string
          objective?: string | null
          platform: string
          start_date?: string | null
          status?: string
          targeting?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          budget_daily?: number | null
          budget_total?: number | null
          created_at?: string
          end_date?: string | null
          external_id?: string | null
          id?: string
          integration_id?: string | null
          metrics_snapshot?: Json
          name?: string
          objective?: string | null
          platform?: string
          start_date?: string | null
          status?: string
          targeting?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "ad_integrations"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_history: {
        Row: {
          content: string
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      company_dna: {
        Row: {
          brand_assets: Json
          business_context: Json
          company_name: string | null
          created_at: string
          dna_data: Json
          id: string
          onboarding_completed: boolean
          team_structure: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          brand_assets?: Json
          business_context?: Json
          company_name?: string | null
          created_at?: string
          dna_data?: Json
          id?: string
          onboarding_completed?: boolean
          team_structure?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          brand_assets?: Json
          business_context?: Json
          company_name?: string | null
          created_at?: string
          dna_data?: Json
          id?: string
          onboarding_completed?: boolean
          team_structure?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      company_invites: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          company_dna_id: string
          created_at: string
          email: string
          expires_at: string
          full_name: string | null
          id: string
          invited_by: string
          job_title_id: string | null
          role: Database["public"]["Enums"]["app_role"]
          status: string
          token: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          company_dna_id: string
          created_at?: string
          email: string
          expires_at?: string
          full_name?: string | null
          id?: string
          invited_by: string
          job_title_id?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          status?: string
          token?: string
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          company_dna_id?: string
          created_at?: string
          email?: string
          expires_at?: string
          full_name?: string | null
          id?: string
          invited_by?: string
          job_title_id?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          status?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_invites_company_dna_id_fkey"
            columns: ["company_dna_id"]
            isOneToOne: false
            referencedRelation: "company_dna"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_invites_job_title_id_fkey"
            columns: ["job_title_id"]
            isOneToOne: false
            referencedRelation: "role_definitions"
            referencedColumns: ["id"]
          },
        ]
      }
      content_calendar: {
        Row: {
          ai_generated: boolean
          campaign_id: string | null
          channel: string
          content_type: string
          copy_text: string | null
          created_at: string
          cta: string | null
          hashtags: string | null
          id: string
          notes: string | null
          scheduled_date: string
          scheduled_time: string | null
          status: string
          title: string
          updated_at: string
          user_id: string
          visual_description: string | null
        }
        Insert: {
          ai_generated?: boolean
          campaign_id?: string | null
          channel?: string
          content_type?: string
          copy_text?: string | null
          created_at?: string
          cta?: string | null
          hashtags?: string | null
          id?: string
          notes?: string | null
          scheduled_date: string
          scheduled_time?: string | null
          status?: string
          title: string
          updated_at?: string
          user_id: string
          visual_description?: string | null
        }
        Update: {
          ai_generated?: boolean
          campaign_id?: string | null
          channel?: string
          content_type?: string
          copy_text?: string | null
          created_at?: string
          cta?: string | null
          hashtags?: string | null
          id?: string
          notes?: string | null
          scheduled_date?: string
          scheduled_time?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
          visual_description?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_calendar_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      creative_briefs: {
        Row: {
          brief_type: string
          campaign_id: string | null
          content: Json
          created_at: string
          id: string
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          brief_type?: string
          campaign_id?: string | null
          content?: Json
          created_at?: string
          id?: string
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          brief_type?: string
          campaign_id?: string | null
          content?: Json
          created_at?: string
          id?: string
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "creative_briefs_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      creative_uploads: {
        Row: {
          asset_kind: string
          company_dna_id: string | null
          copy_text: string | null
          created_at: string
          file_name: string
          file_path: string
          file_type: string
          id: string
          notes: string | null
          performance_label: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          asset_kind?: string
          company_dna_id?: string | null
          copy_text?: string | null
          created_at?: string
          file_name: string
          file_path: string
          file_type: string
          id?: string
          notes?: string | null
          performance_label?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          asset_kind?: string
          company_dna_id?: string | null
          copy_text?: string | null
          created_at?: string
          file_name?: string
          file_path?: string
          file_type?: string
          id?: string
          notes?: string | null
          performance_label?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "creative_uploads_company_dna_id_fkey"
            columns: ["company_dna_id"]
            isOneToOne: false
            referencedRelation: "company_dna"
            referencedColumns: ["id"]
          },
        ]
      }
      diagnostics: {
        Row: {
          area_scores: Json
          bottlenecks: Json
          business_metrics_id: string | null
          company_dna_id: string | null
          created_at: string
          executive_summary: string
          id: string
          model_used: string
          raw_response: Json
          recommendations: Json
          score: number
          updated_at: string
          user_id: string
        }
        Insert: {
          area_scores?: Json
          bottlenecks?: Json
          business_metrics_id?: string | null
          company_dna_id?: string | null
          created_at?: string
          executive_summary?: string
          id?: string
          model_used?: string
          raw_response?: Json
          recommendations?: Json
          score: number
          updated_at?: string
          user_id: string
        }
        Update: {
          area_scores?: Json
          bottlenecks?: Json
          business_metrics_id?: string | null
          company_dna_id?: string | null
          created_at?: string
          executive_summary?: string
          id?: string
          model_used?: string
          raw_response?: Json
          recommendations?: Json
          score?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "diagnostics_business_metrics_id_fkey"
            columns: ["business_metrics_id"]
            isOneToOne: false
            referencedRelation: "business_metrics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diagnostics_company_dna_id_fkey"
            columns: ["company_dna_id"]
            isOneToOne: false
            referencedRelation: "company_dna"
            referencedColumns: ["id"]
          },
        ]
      }
      metrics_alerts: {
        Row: {
          acknowledged: boolean
          campaign_id: string | null
          created_at: string
          current_value: number | null
          delta_pct: number | null
          id: string
          message: string
          metric: string
          previous_value: number | null
          severity: string
          user_id: string
        }
        Insert: {
          acknowledged?: boolean
          campaign_id?: string | null
          created_at?: string
          current_value?: number | null
          delta_pct?: number | null
          id?: string
          message: string
          metric: string
          previous_value?: number | null
          severity?: string
          user_id: string
        }
        Update: {
          acknowledged?: boolean
          campaign_id?: string | null
          created_at?: string
          current_value?: number | null
          delta_pct?: number | null
          id?: string
          message?: string
          metric?: string
          previous_value?: number | null
          severity?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "metrics_alerts_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      oauth_credentials: {
        Row: {
          client_id: string
          client_secret: string
          created_at: string
          extra_config: Json
          id: string
          platform: string
          updated_at: string
          user_id: string
        }
        Insert: {
          client_id: string
          client_secret: string
          created_at?: string
          extra_config?: Json
          id?: string
          platform: string
          updated_at?: string
          user_id: string
        }
        Update: {
          client_id?: string
          client_secret?: string
          created_at?: string
          extra_config?: Json
          id?: string
          platform?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      role_definitions: {
        Row: {
          area: string | null
          company_dna_id: string
          created_at: string
          created_by: string
          description: string | null
          headcount: number
          id: string
          responsibilities: string | null
          seniority: string | null
          title: string
          tools: string | null
          updated_at: string
        }
        Insert: {
          area?: string | null
          company_dna_id: string
          created_at?: string
          created_by: string
          description?: string | null
          headcount?: number
          id?: string
          responsibilities?: string | null
          seniority?: string | null
          title: string
          tools?: string | null
          updated_at?: string
        }
        Update: {
          area?: string | null
          company_dna_id?: string
          created_at?: string
          created_by?: string
          description?: string | null
          headcount?: number
          id?: string
          responsibilities?: string | null
          seniority?: string | null
          title?: string
          tools?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_definitions_company_dna_id_fkey"
            columns: ["company_dna_id"]
            isOneToOne: false
            referencedRelation: "company_dna"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          ai_context: string | null
          assignee_id: string | null
          category: string | null
          company_dna_id: string | null
          created_at: string
          created_by_ai: boolean
          description: string | null
          due_date: string | null
          id: string
          priority: string
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_context?: string | null
          assignee_id?: string | null
          category?: string | null
          company_dna_id?: string | null
          created_at?: string
          created_by_ai?: boolean
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_context?: string | null
          assignee_id?: string | null
          category?: string | null
          company_dna_id?: string | null
          created_at?: string
          created_by_ai?: boolean
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assignee_id_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_company_dna_id_fkey"
            columns: ["company_dna_id"]
            isOneToOne: false
            referencedRelation: "company_dna"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          company_dna_id: string
          created_at: string
          department: string | null
          email: string
          id: string
          name: string
          responsibilities: string | null
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          company_dna_id: string
          created_at?: string
          department?: string | null
          email: string
          id?: string
          name: string
          responsibilities?: string | null
          role?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          company_dna_id?: string
          created_at?: string
          department?: string | null
          email?: string
          id?: string
          name?: string
          responsibilities?: string | null
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_company_dna_id_fkey"
            columns: ["company_dna_id"]
            isOneToOne: false
            referencedRelation: "company_dna"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          created_at: string
          hidden_banners: string[]
          id: string
          onboarding_checklist: Json
          tour_completed: boolean
          tour_completed_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          hidden_banners?: string[]
          id?: string
          onboarding_checklist?: Json
          tour_completed?: boolean
          tour_completed_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          hidden_banners?: string[]
          id?: string
          onboarding_checklist?: Json
          tour_completed?: boolean
          tour_completed_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          company_dna_id: string | null
          created_at: string
          id: string
          job_title_id: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          company_dna_id?: string | null
          created_at?: string
          id?: string
          job_title_id?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          company_dna_id?: string | null
          created_at?: string
          id?: string
          job_title_id?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_company_dna_id_fkey"
            columns: ["company_dna_id"]
            isOneToOne: false
            referencedRelation: "company_dna"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_job_title_id_fkey"
            columns: ["job_title_id"]
            isOneToOne: false
            referencedRelation: "role_definitions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_company: { Args: { _user_id: string }; Returns: string }
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
      app_role: "owner" | "admin" | "employee"
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
      app_role: ["owner", "admin", "employee"],
    },
  },
} as const
