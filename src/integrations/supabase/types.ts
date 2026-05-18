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
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      action_orchestrations: {
        Row: {
          assigned_to: string | null
          autonomy_level: string
          company_id: string | null
          confidence_score: number
          created_artifacts: Json
          created_at: string
          data_origin: string
          description: string | null
          detected_signal: string | null
          due_date: string | null
          financial_impact_estimate: string | null
          hypothesis: string | null
          id: string
          learning_summary: string | null
          recommended_action: string | null
          rejection_reason: string | null
          related_approval_id: string | null
          related_campaign_id: string | null
          related_task_id: string | null
          result_summary: string | null
          source_id: string | null
          source_type: string
          status: string
          title: string
          updated_at: string
          urgency: string
          user_id: string
        }
        Insert: {
          assigned_to?: string | null
          autonomy_level?: string
          company_id?: string | null
          confidence_score?: number
          created_artifacts?: Json
          created_at?: string
          data_origin?: string
          description?: string | null
          detected_signal?: string | null
          due_date?: string | null
          financial_impact_estimate?: string | null
          hypothesis?: string | null
          id?: string
          learning_summary?: string | null
          recommended_action?: string | null
          rejection_reason?: string | null
          related_approval_id?: string | null
          related_campaign_id?: string | null
          related_task_id?: string | null
          result_summary?: string | null
          source_id?: string | null
          source_type?: string
          status?: string
          title: string
          updated_at?: string
          urgency?: string
          user_id?: string
        }
        Update: {
          assigned_to?: string | null
          autonomy_level?: string
          company_id?: string | null
          confidence_score?: number
          created_artifacts?: Json
          created_at?: string
          data_origin?: string
          description?: string | null
          detected_signal?: string | null
          due_date?: string | null
          financial_impact_estimate?: string | null
          hypothesis?: string | null
          id?: string
          learning_summary?: string | null
          recommended_action?: string | null
          rejection_reason?: string | null
          related_approval_id?: string | null
          related_campaign_id?: string | null
          related_task_id?: string | null
          result_summary?: string | null
          source_id?: string | null
          source_type?: string
          status?: string
          title?: string
          updated_at?: string
          urgency?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "action_orchestrations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dna"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "action_orchestrations_related_approval_id_fkey"
            columns: ["related_approval_id"]
            isOneToOne: false
            referencedRelation: "approvals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "action_orchestrations_related_campaign_id_fkey"
            columns: ["related_campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "action_orchestrations_related_task_id_fkey"
            columns: ["related_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      ad_integrations: {
        Row: {
          access_token: string | null
          account_id: string | null
          account_name: string | null
          created_at: string
          id: string
          last_sync_at: string | null
          last_sync_error: string | null
          metadata: Json
          platform: string
          refresh_token: string | null
          status: string
          token_expires_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token?: string | null
          account_id?: string | null
          account_name?: string | null
          created_at?: string
          id?: string
          last_sync_at?: string | null
          last_sync_error?: string | null
          metadata?: Json
          platform: string
          refresh_token?: string | null
          status?: string
          token_expires_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string | null
          account_id?: string | null
          account_name?: string | null
          created_at?: string
          id?: string
          last_sync_at?: string | null
          last_sync_error?: string | null
          metadata?: Json
          platform?: string
          refresh_token?: string | null
          status?: string
          token_expires_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      agency_accounts: {
        Row: {
          agency_company_id: string | null
          client_company_id: string | null
          created_at: string
          id: string
          name: string
          owner_user_id: string
          settings: Json
          status: string
          updated_at: string
        }
        Insert: {
          agency_company_id?: string | null
          client_company_id?: string | null
          created_at?: string
          id?: string
          name: string
          owner_user_id?: string
          settings?: Json
          status?: string
          updated_at?: string
        }
        Update: {
          agency_company_id?: string | null
          client_company_id?: string | null
          created_at?: string
          id?: string
          name?: string
          owner_user_id?: string
          settings?: Json
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agency_accounts_agency_company_id_fkey"
            columns: ["agency_company_id"]
            isOneToOne: false
            referencedRelation: "company_dna"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agency_accounts_client_company_id_fkey"
            columns: ["client_company_id"]
            isOneToOne: false
            referencedRelation: "company_dna"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_call_log: {
        Row: {
          agent: string | null
          call_type: string
          cost_usd: number | null
          created_at: string
          error_message: string | null
          id: string
          latency_ms: number | null
          metadata: Json
          model: string | null
          provider: string
          request_id: string | null
          status: string
          tokens_in: number | null
          tokens_out: number | null
          user_id: string
        }
        Insert: {
          agent?: string | null
          call_type: string
          cost_usd?: number | null
          created_at?: string
          error_message?: string | null
          id?: string
          latency_ms?: number | null
          metadata?: Json
          model?: string | null
          provider: string
          request_id?: string | null
          status?: string
          tokens_in?: number | null
          tokens_out?: number | null
          user_id: string
        }
        Update: {
          agent?: string | null
          call_type?: string
          cost_usd?: number | null
          created_at?: string
          error_message?: string | null
          id?: string
          latency_ms?: number | null
          metadata?: Json
          model?: string | null
          provider?: string
          request_id?: string | null
          status?: string
          tokens_in?: number | null
          tokens_out?: number | null
          user_id?: string
        }
        Relationships: []
      }
      ai_decisions: {
        Row: {
          action_type: string
          applied_at: string | null
          campaign_id: string | null
          company_id: string | null
          confidence_score: number
          created_at: string
          diagnostic_id: string | null
          estimated_impact: string | null
          evidence: string
          expected_impact: string
          id: string
          payload: Json
          rationale: string
          reason: string | null
          recommendation: string | null
          related_funnel_id: string | null
          related_task_id: string | null
          result: Json
          risk_level: string | null
          severity: string
          source_data: Json
          status: string
          suggested_action_type: string | null
          title: string
          updated_at: string
          urgency: string | null
          user_id: string
        }
        Insert: {
          action_type: string
          applied_at?: string | null
          campaign_id?: string | null
          company_id?: string | null
          confidence_score?: number
          created_at?: string
          diagnostic_id?: string | null
          estimated_impact?: string | null
          evidence?: string
          expected_impact?: string
          id?: string
          payload?: Json
          rationale: string
          reason?: string | null
          recommendation?: string | null
          related_funnel_id?: string | null
          related_task_id?: string | null
          result?: Json
          risk_level?: string | null
          severity?: string
          source_data?: Json
          status?: string
          suggested_action_type?: string | null
          title: string
          updated_at?: string
          urgency?: string | null
          user_id: string
        }
        Update: {
          action_type?: string
          applied_at?: string | null
          campaign_id?: string | null
          company_id?: string | null
          confidence_score?: number
          created_at?: string
          diagnostic_id?: string | null
          estimated_impact?: string | null
          evidence?: string
          expected_impact?: string
          id?: string
          payload?: Json
          rationale?: string
          reason?: string | null
          recommendation?: string | null
          related_funnel_id?: string | null
          related_task_id?: string | null
          result?: Json
          risk_level?: string | null
          severity?: string
          source_data?: Json
          status?: string
          suggested_action_type?: string | null
          title?: string
          updated_at?: string
          urgency?: string | null
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
            foreignKeyName: "ai_decisions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dna"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_decisions_diagnostic_id_fkey"
            columns: ["diagnostic_id"]
            isOneToOne: false
            referencedRelation: "diagnostics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_decisions_related_task_id_fkey"
            columns: ["related_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_playbooks: {
        Row: {
          action_pattern: Json
          created_at: string
          id: string
          industry: string | null
          last_updated_at: string
          sample_size: number
          situation_pattern: Json
          success_rate: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          action_pattern?: Json
          created_at?: string
          id?: string
          industry?: string | null
          last_updated_at?: string
          sample_size?: number
          situation_pattern?: Json
          success_rate?: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          action_pattern?: Json
          created_at?: string
          id?: string
          industry?: string | null
          last_updated_at?: string
          sample_size?: number
          situation_pattern?: Json
          success_rate?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      approvals: {
        Row: {
          approval_type: string | null
          approved_at: string | null
          assigned_to: string | null
          category: string
          comments: Json
          company_id: string | null
          created_at: string
          description: string
          due_date: string | null
          id: string
          impact: string
          level: string
          reasoning: string
          rejected_at: string | null
          related_entity_id: string | null
          related_entity_type: string | null
          requested_by: string | null
          resolved_at: string | null
          status: string
          supporting_data: Json
          title: string
          updated_at: string
          user_id: string
          version: number
        }
        Insert: {
          approval_type?: string | null
          approved_at?: string | null
          assigned_to?: string | null
          category: string
          comments?: Json
          company_id?: string | null
          created_at?: string
          description: string
          due_date?: string | null
          id?: string
          impact: string
          level?: string
          reasoning: string
          rejected_at?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          requested_by?: string | null
          resolved_at?: string | null
          status?: string
          supporting_data?: Json
          title: string
          updated_at?: string
          user_id: string
          version?: number
        }
        Update: {
          approval_type?: string | null
          approved_at?: string | null
          assigned_to?: string | null
          category?: string
          comments?: Json
          company_id?: string | null
          created_at?: string
          description?: string
          due_date?: string | null
          id?: string
          impact?: string
          level?: string
          reasoning?: string
          rejected_at?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          requested_by?: string | null
          resolved_at?: string | null
          status?: string
          supporting_data?: Json
          title?: string
          updated_at?: string
          user_id?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "approvals_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dna"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          company_dna_id: string | null
          created_at: string | null
          details: Json | null
          id: string
          resource_id: string | null
          resource_type: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          company_dna_id?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string
          resource_id?: string | null
          resource_type?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          company_dna_id?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string
          resource_id?: string | null
          resource_type?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_company_dna_id_fkey"
            columns: ["company_dna_id"]
            isOneToOne: false
            referencedRelation: "company_dna"
            referencedColumns: ["id"]
          },
        ]
      }
      benchmark_snapshots: {
        Row: {
          benchmark_value: number | null
          channel: string
          company_dna_id: string | null
          created_at: string
          current_value: number | null
          gap_summary: string | null
          id: string
          metric_name: string
          observation: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          benchmark_value?: number | null
          channel: string
          company_dna_id?: string | null
          created_at?: string
          current_value?: number | null
          gap_summary?: string | null
          id?: string
          metric_name: string
          observation?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          benchmark_value?: number | null
          channel?: string
          company_dna_id?: string | null
          created_at?: string
          current_value?: number | null
          gap_summary?: string | null
          id?: string
          metric_name?: string
          observation?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "benchmark_snapshots_company_dna_id_fkey"
            columns: ["company_dna_id"]
            isOneToOne: false
            referencedRelation: "company_dna"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_visual_profile: {
        Row: {
          analyzed_at: string | null
          company_dna_id: string | null
          created_at: string
          fonts: Json
          id: string
          mood_keywords: string[]
          palette: Json
          references_uploaded: Json
          updated_at: string
          user_id: string
          vetoed_styles: string[]
          visual_style_descriptors: Json
        }
        Insert: {
          analyzed_at?: string | null
          company_dna_id?: string | null
          created_at?: string
          fonts?: Json
          id?: string
          mood_keywords?: string[]
          palette?: Json
          references_uploaded?: Json
          updated_at?: string
          user_id: string
          vetoed_styles?: string[]
          visual_style_descriptors?: Json
        }
        Update: {
          analyzed_at?: string | null
          company_dna_id?: string | null
          created_at?: string
          fonts?: Json
          id?: string
          mood_keywords?: string[]
          palette?: Json
          references_uploaded?: Json
          updated_at?: string
          user_id?: string
          vetoed_styles?: string[]
          visual_style_descriptors?: Json
        }
        Relationships: [
          {
            foreignKeyName: "brand_visual_profile_company_dna_id_fkey"
            columns: ["company_dna_id"]
            isOneToOne: false
            referencedRelation: "company_dna"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_voice_profile: {
        Row: {
          avoid_phrases: Json
          color_palette: Json
          company_dna_id: string | null
          created_at: string
          hook_patterns_that_failed: Json
          hook_patterns_that_worked: Json
          id: string
          last_updated_at: string | null
          preferred_tone: Json
          sample_size: number
          updated_at: string
          user_id: string
          visual_style_keywords: string[]
        }
        Insert: {
          avoid_phrases?: Json
          color_palette?: Json
          company_dna_id?: string | null
          created_at?: string
          hook_patterns_that_failed?: Json
          hook_patterns_that_worked?: Json
          id?: string
          last_updated_at?: string | null
          preferred_tone?: Json
          sample_size?: number
          updated_at?: string
          user_id: string
          visual_style_keywords?: string[]
        }
        Update: {
          avoid_phrases?: Json
          color_palette?: Json
          company_dna_id?: string | null
          created_at?: string
          hook_patterns_that_failed?: Json
          hook_patterns_that_worked?: Json
          id?: string
          last_updated_at?: string | null
          preferred_tone?: Json
          sample_size?: number
          updated_at?: string
          user_id?: string
          visual_style_keywords?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "brand_voice_profile_company_dna_id_fkey"
            columns: ["company_dna_id"]
            isOneToOne: false
            referencedRelation: "company_dna"
            referencedColumns: ["id"]
          },
        ]
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
          embedding: string | null
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
          embedding?: string | null
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
          embedding?: string | null
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
          raw_data: Json
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
          raw_data?: Json
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
          raw_data?: Json
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
          funnel_id: string | null
          funnel_node_id: string | null
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
          funnel_id?: string | null
          funnel_node_id?: string | null
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
          funnel_id?: string | null
          funnel_node_id?: string | null
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
            foreignKeyName: "campaigns_funnel_id_fkey"
            columns: ["funnel_id"]
            isOneToOne: false
            referencedRelation: "marketing_funnels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaigns_funnel_node_id_fkey"
            columns: ["funnel_node_id"]
            isOneToOne: false
            referencedRelation: "funnel_nodes"
            referencedColumns: ["id"]
          },
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
      commerce_products: {
        Row: {
          category: string | null
          cost: number
          created_at: string
          external_id: string | null
          id: string
          margin_pct: number | null
          name: string
          price: number
          sku: string | null
          status: string
          stock_qty: number
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          cost?: number
          created_at?: string
          external_id?: string | null
          id?: string
          margin_pct?: number | null
          name: string
          price?: number
          sku?: string | null
          status?: string
          stock_qty?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          cost?: number
          created_at?: string
          external_id?: string | null
          id?: string
          margin_pct?: number | null
          name?: string
          price?: number
          sku?: string | null
          status?: string
          stock_qty?: number
          updated_at?: string
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
            referencedRelation: "company_role_definitions"
            referencedColumns: ["id"]
          },
        ]
      }
      company_role_definitions: {
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
            foreignKeyName: "company_role_definitions_company_dna_id_fkey"
            columns: ["company_dna_id"]
            isOneToOne: false
            referencedRelation: "company_dna"
            referencedColumns: ["id"]
          },
        ]
      }
      competitor_profiles: {
        Row: {
          category: string | null
          channels: string | null
          company_dna_id: string | null
          created_at: string
          id: string
          key_offer: string | null
          name: string
          notes: string | null
          positioning: string | null
          status: string
          strengths: string | null
          threat_level: string
          updated_at: string
          user_id: string
          weaknesses: string | null
        }
        Insert: {
          category?: string | null
          channels?: string | null
          company_dna_id?: string | null
          created_at?: string
          id?: string
          key_offer?: string | null
          name: string
          notes?: string | null
          positioning?: string | null
          status?: string
          strengths?: string | null
          threat_level?: string
          updated_at?: string
          user_id: string
          weaknesses?: string | null
        }
        Update: {
          category?: string | null
          channels?: string | null
          company_dna_id?: string | null
          created_at?: string
          id?: string
          key_offer?: string | null
          name?: string
          notes?: string | null
          positioning?: string | null
          status?: string
          strengths?: string | null
          threat_level?: string
          updated_at?: string
          user_id?: string
          weaknesses?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "competitor_profiles_company_dna_id_fkey"
            columns: ["company_dna_id"]
            isOneToOne: false
            referencedRelation: "company_dna"
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
          funnel_id: string | null
          funnel_node_id: string | null
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
          funnel_id?: string | null
          funnel_node_id?: string | null
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
          funnel_id?: string | null
          funnel_node_id?: string | null
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
          {
            foreignKeyName: "creative_briefs_funnel_id_fkey"
            columns: ["funnel_id"]
            isOneToOne: false
            referencedRelation: "marketing_funnels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creative_briefs_funnel_node_id_fkey"
            columns: ["funnel_node_id"]
            isOneToOne: false
            referencedRelation: "funnel_nodes"
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
      creative_variants: {
        Row: {
          angle: string | null
          brief_id: string
          campaign_id: string | null
          created_at: string
          created_by_ai: boolean
          cta: string | null
          generated_images: Json
          generation_source: string
          headline: string | null
          hook: string | null
          hypothesis_id: string | null
          id: string
          notes: string | null
          performance_metric: string | null
          performance_value: number | null
          primary_copy: string | null
          rationale: string | null
          score: number | null
          status: string
          test_focus: string | null
          title: string
          updated_at: string
          user_id: string
          variant_type: string
          visual_prompt: string | null
          winner_status: string
        }
        Insert: {
          angle?: string | null
          brief_id: string
          campaign_id?: string | null
          created_at?: string
          created_by_ai?: boolean
          cta?: string | null
          generated_images?: Json
          generation_source?: string
          headline?: string | null
          hook?: string | null
          hypothesis_id?: string | null
          id?: string
          notes?: string | null
          performance_metric?: string | null
          performance_value?: number | null
          primary_copy?: string | null
          rationale?: string | null
          score?: number | null
          status?: string
          test_focus?: string | null
          title: string
          updated_at?: string
          user_id: string
          variant_type?: string
          visual_prompt?: string | null
          winner_status?: string
        }
        Update: {
          angle?: string | null
          brief_id?: string
          campaign_id?: string | null
          created_at?: string
          created_by_ai?: boolean
          cta?: string | null
          generated_images?: Json
          generation_source?: string
          headline?: string | null
          hook?: string | null
          hypothesis_id?: string | null
          id?: string
          notes?: string | null
          performance_metric?: string | null
          performance_value?: number | null
          primary_copy?: string | null
          rationale?: string | null
          score?: number | null
          status?: string
          test_focus?: string | null
          title?: string
          updated_at?: string
          user_id?: string
          variant_type?: string
          visual_prompt?: string | null
          winner_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "creative_variants_brief_id_fkey"
            columns: ["brief_id"]
            isOneToOne: false
            referencedRelation: "creative_briefs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creative_variants_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creative_variants_hypothesis_id_fkey"
            columns: ["hypothesis_id"]
            isOneToOne: false
            referencedRelation: "marketing_hypotheses"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_consent: {
        Row: {
          channel: string
          consented: boolean
          consented_at: string | null
          created_at: string
          customer_id: string
          id: string
          ip_address: string | null
          source: string | null
          user_id: string
        }
        Insert: {
          channel: string
          consented?: boolean
          consented_at?: string | null
          created_at?: string
          customer_id: string
          id?: string
          ip_address?: string | null
          source?: string | null
          user_id: string
        }
        Update: {
          channel?: string
          consented?: boolean
          consented_at?: string | null
          created_at?: string
          customer_id?: string
          id?: string
          ip_address?: string | null
          source?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_consent_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "crm_customers"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_customers: {
        Row: {
          average_order_value: number
          consent_marketing: boolean
          created_at: string
          email: string | null
          external_id: string | null
          first_order_at: string | null
          gross_margin: number
          id: string
          last_order_at: string | null
          name: string
          orders_count: number
          phone: string | null
          predicted_ltv: number
          source: string
          status: string
          tags: string[]
          total_revenue: number
          updated_at: string
          user_id: string
        }
        Insert: {
          average_order_value?: number
          consent_marketing?: boolean
          created_at?: string
          email?: string | null
          external_id?: string | null
          first_order_at?: string | null
          gross_margin?: number
          id?: string
          last_order_at?: string | null
          name: string
          orders_count?: number
          phone?: string | null
          predicted_ltv?: number
          source?: string
          status?: string
          tags?: string[]
          total_revenue?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          average_order_value?: number
          consent_marketing?: boolean
          created_at?: string
          email?: string | null
          external_id?: string | null
          first_order_at?: string | null
          gross_margin?: number
          id?: string
          last_order_at?: string | null
          name?: string
          orders_count?: number
          phone?: string | null
          predicted_ltv?: number
          source?: string
          status?: string
          tags?: string[]
          total_revenue?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      crm_events: {
        Row: {
          created_at: string
          customer_id: string
          event_type: string
          id: string
          occurred_at: string
          payload: Json
          user_id: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          event_type: string
          id?: string
          occurred_at?: string
          payload?: Json
          user_id: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          event_type?: string
          id?: string
          occurred_at?: string
          payload?: Json
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_events_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "crm_customers"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_journey_steps: {
        Row: {
          content: Json
          created_at: string
          delay_days: number
          id: string
          journey_id: string
          status: string
          step_order: number
          step_type: string
          user_id: string
        }
        Insert: {
          content?: Json
          created_at?: string
          delay_days?: number
          id?: string
          journey_id: string
          status?: string
          step_order: number
          step_type?: string
          user_id: string
        }
        Update: {
          content?: Json
          created_at?: string
          delay_days?: number
          id?: string
          journey_id?: string
          status?: string
          step_order?: number
          step_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_journey_steps_journey_id_fkey"
            columns: ["journey_id"]
            isOneToOne: false
            referencedRelation: "crm_journeys"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_journeys: {
        Row: {
          conversion_rate: number
          created_at: string
          id: string
          journey_type: string
          name: string
          revenue_attributed: number
          status: string
          steps_count: number
          updated_at: string
          user_id: string
        }
        Insert: {
          conversion_rate?: number
          created_at?: string
          id?: string
          journey_type?: string
          name: string
          revenue_attributed?: number
          status?: string
          steps_count?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          conversion_rate?: number
          created_at?: string
          id?: string
          journey_type?: string
          name?: string
          revenue_attributed?: number
          status?: string
          steps_count?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      crm_messages: {
        Row: {
          approval_id: string | null
          body: string
          channel: string
          created_at: string
          customer_id: string | null
          id: string
          journey_step_id: string | null
          segment_id: string | null
          sent_at: string | null
          status: string
          subject: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          approval_id?: string | null
          body: string
          channel?: string
          created_at?: string
          customer_id?: string | null
          id?: string
          journey_step_id?: string | null
          segment_id?: string | null
          sent_at?: string | null
          status?: string
          subject?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          approval_id?: string | null
          body?: string
          channel?: string
          created_at?: string
          customer_id?: string | null
          id?: string
          journey_step_id?: string | null
          segment_id?: string | null
          sent_at?: string | null
          status?: string
          subject?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_messages_approval_id_fkey"
            columns: ["approval_id"]
            isOneToOne: false
            referencedRelation: "approvals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_messages_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "crm_customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_messages_journey_step_id_fkey"
            columns: ["journey_step_id"]
            isOneToOne: false
            referencedRelation: "crm_journey_steps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_messages_segment_id_fkey"
            columns: ["segment_id"]
            isOneToOne: false
            referencedRelation: "crm_segments"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_opportunities: {
        Row: {
          approval_id: string | null
          created_at: string
          customer_id: string | null
          expected_margin: number
          expected_revenue: number
          id: string
          opportunity_type: string
          rationale: string | null
          recommended_channel: string | null
          recommended_message: string | null
          segment_id: string | null
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          approval_id?: string | null
          created_at?: string
          customer_id?: string | null
          expected_margin?: number
          expected_revenue?: number
          id?: string
          opportunity_type?: string
          rationale?: string | null
          recommended_channel?: string | null
          recommended_message?: string | null
          segment_id?: string | null
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          approval_id?: string | null
          created_at?: string
          customer_id?: string | null
          expected_margin?: number
          expected_revenue?: number
          id?: string
          opportunity_type?: string
          rationale?: string | null
          recommended_channel?: string | null
          recommended_message?: string | null
          segment_id?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_opportunities_approval_id_fkey"
            columns: ["approval_id"]
            isOneToOne: false
            referencedRelation: "approvals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_opportunities_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "crm_customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_opportunities_segment_id_fkey"
            columns: ["segment_id"]
            isOneToOne: false
            referencedRelation: "crm_segments"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_order_items: {
        Row: {
          created_at: string
          id: string
          order_id: string
          product_name: string
          quantity: number
          sku: string | null
          subtotal: number
          unit_price: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          product_name: string
          quantity?: number
          sku?: string | null
          subtotal?: number
          unit_price?: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          product_name?: string
          quantity?: number
          sku?: string | null
          subtotal?: number
          unit_price?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "crm_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_orders: {
        Row: {
          campaign_id: string | null
          channel: string
          coupon_code: string | null
          created_at: string
          customer_id: string
          discount_amount: number
          external_id: string | null
          funnel_id: string | null
          gross_margin: number
          id: string
          items_count: number
          ordered_at: string
          revenue: number
          status: string
          user_id: string
        }
        Insert: {
          campaign_id?: string | null
          channel?: string
          coupon_code?: string | null
          created_at?: string
          customer_id: string
          discount_amount?: number
          external_id?: string | null
          funnel_id?: string | null
          gross_margin?: number
          id?: string
          items_count?: number
          ordered_at?: string
          revenue?: number
          status?: string
          user_id: string
        }
        Update: {
          campaign_id?: string | null
          channel?: string
          coupon_code?: string | null
          created_at?: string
          customer_id?: string
          discount_amount?: number
          external_id?: string | null
          funnel_id?: string | null
          gross_margin?: number
          id?: string
          items_count?: number
          ordered_at?: string
          revenue?: number
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_orders_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "crm_customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_orders_funnel_id_fkey"
            columns: ["funnel_id"]
            isOneToOne: false
            referencedRelation: "marketing_funnels"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_segment_members: {
        Row: {
          added_at: string
          customer_id: string
          id: string
          segment_id: string
          user_id: string
        }
        Insert: {
          added_at?: string
          customer_id: string
          id?: string
          segment_id: string
          user_id: string
        }
        Update: {
          added_at?: string
          customer_id?: string
          id?: string
          segment_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_segment_members_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "crm_customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_segment_members_segment_id_fkey"
            columns: ["segment_id"]
            isOneToOne: false
            referencedRelation: "crm_segments"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_segments: {
        Row: {
          created_at: string
          description: string | null
          estimated_count: number
          estimated_revenue_potential: number
          id: string
          last_computed_at: string | null
          name: string
          rule_config: Json
          segment_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          estimated_count?: number
          estimated_revenue_potential?: number
          id?: string
          last_computed_at?: string | null
          name: string
          rule_config?: Json
          segment_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          estimated_count?: number
          estimated_revenue_potential?: number
          id?: string
          last_computed_at?: string | null
          name?: string
          rule_config?: Json
          segment_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      decision_outcomes: {
        Row: {
          campaign_id: string | null
          confidence_score: number | null
          created_at: string
          decision_id: string
          expected_metric: string | null
          expected_value: number | null
          id: string
          notes: string | null
          observed_metric: string | null
          observed_value: number | null
          outcome_status: string
          reviewed_at: string | null
          summary: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          campaign_id?: string | null
          confidence_score?: number | null
          created_at?: string
          decision_id: string
          expected_metric?: string | null
          expected_value?: number | null
          id?: string
          notes?: string | null
          observed_metric?: string | null
          observed_value?: number | null
          outcome_status?: string
          reviewed_at?: string | null
          summary?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          campaign_id?: string | null
          confidence_score?: number | null
          created_at?: string
          decision_id?: string
          expected_metric?: string | null
          expected_value?: number | null
          id?: string
          notes?: string | null
          observed_metric?: string | null
          observed_value?: number | null
          outcome_status?: string
          reviewed_at?: string | null
          summary?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "decision_outcomes_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "decision_outcomes_decision_id_fkey"
            columns: ["decision_id"]
            isOneToOne: false
            referencedRelation: "ai_decisions"
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
      executive_reports: {
        Row: {
          company_dna_id: string | null
          content: Json
          created_at: string
          decisions_applied: number
          generated_at: string | null
          headline: string | null
          id: string
          next_priority: string | null
          period_end: string
          period_start: string
          raw_data: Json | null
          report_type: string
          status: string
          summary: string | null
          top_loss: string | null
          top_win: string | null
          user_id: string
        }
        Insert: {
          company_dna_id?: string | null
          content?: Json
          created_at?: string
          decisions_applied?: number
          generated_at?: string | null
          headline?: string | null
          id?: string
          next_priority?: string | null
          period_end: string
          period_start: string
          raw_data?: Json | null
          report_type?: string
          status?: string
          summary?: string | null
          top_loss?: string | null
          top_win?: string | null
          user_id: string
        }
        Update: {
          company_dna_id?: string | null
          content?: Json
          created_at?: string
          decisions_applied?: number
          generated_at?: string | null
          headline?: string | null
          id?: string
          next_priority?: string | null
          period_end?: string
          period_start?: string
          raw_data?: Json | null
          report_type?: string
          status?: string
          summary?: string | null
          top_loss?: string | null
          top_win?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "executive_reports_company_dna_id_fkey"
            columns: ["company_dna_id"]
            isOneToOne: false
            referencedRelation: "company_dna"
            referencedColumns: ["id"]
          },
        ]
      }
      funnel_edges: {
        Row: {
          created_at: string
          data: Json
          funnel_id: string
          id: string
          label: string | null
          source_node_id: string
          target_node_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json
          funnel_id: string
          id?: string
          label?: string | null
          source_node_id: string
          target_node_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json
          funnel_id?: string
          id?: string
          label?: string | null
          source_node_id?: string
          target_node_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "funnel_edges_funnel_id_fkey"
            columns: ["funnel_id"]
            isOneToOne: false
            referencedRelation: "marketing_funnels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "funnel_edges_source_node_id_fkey"
            columns: ["source_node_id"]
            isOneToOne: false
            referencedRelation: "funnel_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "funnel_edges_target_node_id_fkey"
            columns: ["target_node_id"]
            isOneToOne: false
            referencedRelation: "funnel_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      funnel_metric_snapshots: {
        Row: {
          alerts: Json
          conversions: number
          created_at: string
          exit_ticket_avg: number | null
          funnel_id: string
          id: string
          metrics: Json
          node_id: string | null
          people_count: number
          period_end: string
          period_start: string
          revenue: number
          spend: number
          user_id: string
        }
        Insert: {
          alerts?: Json
          conversions?: number
          created_at?: string
          exit_ticket_avg?: number | null
          funnel_id: string
          id?: string
          metrics?: Json
          node_id?: string | null
          people_count?: number
          period_end: string
          period_start: string
          revenue?: number
          spend?: number
          user_id: string
        }
        Update: {
          alerts?: Json
          conversions?: number
          created_at?: string
          exit_ticket_avg?: number | null
          funnel_id?: string
          id?: string
          metrics?: Json
          node_id?: string | null
          people_count?: number
          period_end?: string
          period_start?: string
          revenue?: number
          spend?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "funnel_metric_snapshots_funnel_id_fkey"
            columns: ["funnel_id"]
            isOneToOne: false
            referencedRelation: "marketing_funnels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "funnel_metric_snapshots_node_id_fkey"
            columns: ["node_id"]
            isOneToOne: false
            referencedRelation: "funnel_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      funnel_nodes: {
        Row: {
          created_at: string
          data: Json
          description: string | null
          funnel_id: string
          id: string
          node_type: string
          position: Json
          regenerated_at: string | null
          status: string
          step_order: number
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json
          description?: string | null
          funnel_id: string
          id?: string
          node_type?: string
          position?: Json
          regenerated_at?: string | null
          status?: string
          step_order?: number
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json
          description?: string | null
          funnel_id?: string
          id?: string
          node_type?: string
          position?: Json
          regenerated_at?: string | null
          status?: string
          step_order?: number
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "funnel_nodes_funnel_id_fkey"
            columns: ["funnel_id"]
            isOneToOne: false
            referencedRelation: "marketing_funnels"
            referencedColumns: ["id"]
          },
        ]
      }
      market_signals: {
        Row: {
          company_dna_id: string | null
          created_at: string
          description: string | null
          id: string
          implication: string | null
          recommended_action: string | null
          signal_type: string
          source: string | null
          status: string
          title: string
          updated_at: string
          urgency: string
          user_id: string
        }
        Insert: {
          company_dna_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          implication?: string | null
          recommended_action?: string | null
          signal_type?: string
          source?: string | null
          status?: string
          title: string
          updated_at?: string
          urgency?: string
          user_id: string
        }
        Update: {
          company_dna_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          implication?: string | null
          recommended_action?: string | null
          signal_type?: string
          source?: string | null
          status?: string
          title?: string
          updated_at?: string
          urgency?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "market_signals_company_dna_id_fkey"
            columns: ["company_dna_id"]
            isOneToOne: false
            referencedRelation: "company_dna"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_finance_targets: {
        Row: {
          break_even_cpa: number | null
          campaign_budget: Json
          channel_budget: Json
          company_id: string | null
          created_at: string
          daily_budget: number | null
          estimated_margin: number | null
          id: string
          monthly_budget: number | null
          period_end: string
          period_start: string
          target_cac: number | null
          target_cpa: number | null
          target_roas: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          break_even_cpa?: number | null
          campaign_budget?: Json
          channel_budget?: Json
          company_id?: string | null
          created_at?: string
          daily_budget?: number | null
          estimated_margin?: number | null
          id?: string
          monthly_budget?: number | null
          period_end: string
          period_start: string
          target_cac?: number | null
          target_cpa?: number | null
          target_roas?: number | null
          updated_at?: string
          user_id?: string
        }
        Update: {
          break_even_cpa?: number | null
          campaign_budget?: Json
          channel_budget?: Json
          company_id?: string | null
          created_at?: string
          daily_budget?: number | null
          estimated_margin?: number | null
          id?: string
          monthly_budget?: number | null
          period_end?: string
          period_start?: string
          target_cac?: number | null
          target_cpa?: number | null
          target_roas?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketing_finance_targets_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dna"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_funnels: {
        Row: {
          approved_at: string | null
          company_dna_id: string | null
          created_at: string
          description: string | null
          id: string
          metadata: Json
          name: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          company_dna_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json
          name: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          approved_at?: string | null
          company_dna_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json
          name?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketing_funnels_company_dna_id_fkey"
            columns: ["company_dna_id"]
            isOneToOne: false
            referencedRelation: "company_dna"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_hypotheses: {
        Row: {
          audience: string | null
          campaign_id: string | null
          channel: string | null
          company_dna_id: string | null
          created_at: string
          created_by_ai: boolean
          creative_angle: string | null
          funnel_id: string | null
          funnel_node_id: string | null
          hypothesis: string
          id: string
          offer_angle: string | null
          priority: string
          source: string
          status: string
          strategic_goal_id: string | null
          success_metric: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          audience?: string | null
          campaign_id?: string | null
          channel?: string | null
          company_dna_id?: string | null
          created_at?: string
          created_by_ai?: boolean
          creative_angle?: string | null
          funnel_id?: string | null
          funnel_node_id?: string | null
          hypothesis: string
          id?: string
          offer_angle?: string | null
          priority?: string
          source?: string
          status?: string
          strategic_goal_id?: string | null
          success_metric?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          audience?: string | null
          campaign_id?: string | null
          channel?: string | null
          company_dna_id?: string | null
          created_at?: string
          created_by_ai?: boolean
          creative_angle?: string | null
          funnel_id?: string | null
          funnel_node_id?: string | null
          hypothesis?: string
          id?: string
          offer_angle?: string | null
          priority?: string
          source?: string
          status?: string
          strategic_goal_id?: string | null
          success_metric?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketing_hypotheses_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketing_hypotheses_company_dna_id_fkey"
            columns: ["company_dna_id"]
            isOneToOne: false
            referencedRelation: "company_dna"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketing_hypotheses_funnel_id_fkey"
            columns: ["funnel_id"]
            isOneToOne: false
            referencedRelation: "marketing_funnels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketing_hypotheses_funnel_node_id_fkey"
            columns: ["funnel_node_id"]
            isOneToOne: false
            referencedRelation: "funnel_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketing_hypotheses_strategic_goal_id_fkey"
            columns: ["strategic_goal_id"]
            isOneToOne: false
            referencedRelation: "strategic_goals"
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
      operational_memory: {
        Row: {
          audience_id: string | null
          campaign_id: string | null
          channel: string | null
          company_id: string | null
          confidence_score: number
          copy_id: string | null
          created_at: string
          created_by: string | null
          creative_id: string | null
          description: string | null
          generated_by: string
          id: string
          learning_type: string | null
          memory_type: string
          offer_id: string | null
          period_end: string | null
          period_start: string | null
          related_entities: Json
          result_metric: string | null
          result_value: number | null
          source_count: number
          source_id: string | null
          source_type: string
          tags: string[]
          title: string
          user_id: string
        }
        Insert: {
          audience_id?: string | null
          campaign_id?: string | null
          channel?: string | null
          company_id?: string | null
          confidence_score?: number
          copy_id?: string | null
          created_at?: string
          created_by?: string | null
          creative_id?: string | null
          description?: string | null
          generated_by?: string
          id?: string
          learning_type?: string | null
          memory_type: string
          offer_id?: string | null
          period_end?: string | null
          period_start?: string | null
          related_entities?: Json
          result_metric?: string | null
          result_value?: number | null
          source_count?: number
          source_id?: string | null
          source_type?: string
          tags?: string[]
          title: string
          user_id?: string
        }
        Update: {
          audience_id?: string | null
          campaign_id?: string | null
          channel?: string | null
          company_id?: string | null
          confidence_score?: number
          copy_id?: string | null
          created_at?: string
          created_by?: string | null
          creative_id?: string | null
          description?: string | null
          generated_by?: string
          id?: string
          learning_type?: string | null
          memory_type?: string
          offer_id?: string | null
          period_end?: string | null
          period_start?: string | null
          related_entities?: Json
          result_metric?: string | null
          result_value?: number | null
          source_count?: number
          source_id?: string | null
          source_type?: string
          tags?: string[]
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "operational_memory_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "operational_memory_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dna"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          company_dna_id: string
          created_at: string | null
          custom_permissions: Json | null
          department: string | null
          email: string | null
          id: string
          invited_by: string | null
          name: string | null
          reports_to: string | null
          role_id: string
          seniority: string | null
          status: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          company_dna_id: string
          created_at?: string | null
          custom_permissions?: Json | null
          department?: string | null
          email?: string | null
          id?: string
          invited_by?: string | null
          name?: string | null
          reports_to?: string | null
          role_id?: string
          seniority?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          company_dna_id?: string
          created_at?: string | null
          custom_permissions?: Json | null
          department?: string | null
          email?: string | null
          id?: string
          invited_by?: string | null
          name?: string | null
          reports_to?: string | null
          role_id?: string
          seniority?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_org_members_role"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "role_definitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_members_company_dna_id_fkey"
            columns: ["company_dna_id"]
            isOneToOne: false
            referencedRelation: "company_dna"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_members_reports_to_fkey"
            columns: ["reports_to"]
            isOneToOne: false
            referencedRelation: "organization_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_members_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "role_definitions"
            referencedColumns: ["id"]
          },
        ]
      }
      permissions: {
        Row: {
          category: string
          created_at: string | null
          id: string
          label: string
        }
        Insert: {
          category?: string
          created_at?: string | null
          id: string
          label?: string
        }
        Update: {
          category?: string
          created_at?: string | null
          id?: string
          label?: string
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
      publication_jobs: {
        Row: {
          approval_id: string | null
          approved_at: string | null
          approved_by: string | null
          autonomy_level: string
          campaign_id: string | null
          caption: string | null
          channel: string
          company_id: string | null
          copy: string | null
          created_at: string
          creative_asset_id: string | null
          creative_asset_url: string | null
          data_origin: string
          error_message: string | null
          external_campaign_id: string | null
          external_platform: string | null
          external_post_id: string | null
          id: string
          orchestration_id: string | null
          policy_snapshot: Json
          publication_type: string
          published_at: string | null
          requires_approval: boolean
          scheduled_at: string | null
          source_id: string | null
          source_type: string
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          approval_id?: string | null
          approved_at?: string | null
          approved_by?: string | null
          autonomy_level?: string
          campaign_id?: string | null
          caption?: string | null
          channel: string
          company_id?: string | null
          copy?: string | null
          created_at?: string
          creative_asset_id?: string | null
          creative_asset_url?: string | null
          data_origin?: string
          error_message?: string | null
          external_campaign_id?: string | null
          external_platform?: string | null
          external_post_id?: string | null
          id?: string
          orchestration_id?: string | null
          policy_snapshot?: Json
          publication_type: string
          published_at?: string | null
          requires_approval?: boolean
          scheduled_at?: string | null
          source_id?: string | null
          source_type?: string
          status?: string
          title: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          approval_id?: string | null
          approved_at?: string | null
          approved_by?: string | null
          autonomy_level?: string
          campaign_id?: string | null
          caption?: string | null
          channel?: string
          company_id?: string | null
          copy?: string | null
          created_at?: string
          creative_asset_id?: string | null
          creative_asset_url?: string | null
          data_origin?: string
          error_message?: string | null
          external_campaign_id?: string | null
          external_platform?: string | null
          external_post_id?: string | null
          id?: string
          orchestration_id?: string | null
          policy_snapshot?: Json
          publication_type?: string
          published_at?: string | null
          requires_approval?: boolean
          scheduled_at?: string | null
          source_id?: string | null
          source_type?: string
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "publication_jobs_approval_id_fkey"
            columns: ["approval_id"]
            isOneToOne: false
            referencedRelation: "approvals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "publication_jobs_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "publication_jobs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dna"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "publication_jobs_orchestration_id_fkey"
            columns: ["orchestration_id"]
            isOneToOne: false
            referencedRelation: "action_orchestrations"
            referencedColumns: ["id"]
          },
        ]
      }
      publication_logs: {
        Row: {
          action: string
          channel: string | null
          company_id: string | null
          created_at: string
          details: Json
          error_message: string | null
          id: string
          publication_job_id: string
          status_from: string | null
          status_to: string | null
          user_id: string
        }
        Insert: {
          action: string
          channel?: string | null
          company_id?: string | null
          created_at?: string
          details?: Json
          error_message?: string | null
          id?: string
          publication_job_id: string
          status_from?: string | null
          status_to?: string | null
          user_id?: string
        }
        Update: {
          action?: string
          channel?: string | null
          company_id?: string | null
          created_at?: string
          details?: Json
          error_message?: string | null
          id?: string
          publication_job_id?: string
          status_from?: string | null
          status_to?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "publication_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dna"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "publication_logs_publication_job_id_fkey"
            columns: ["publication_job_id"]
            isOneToOne: false
            referencedRelation: "publication_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      publication_policies: {
        Row: {
          allowed_time_windows: Json
          approval_role_required: string | null
          autonomy_level_allowed: string
          blocked_words: string[]
          channel: string
          company_id: string | null
          created_at: string
          created_by: string
          id: string
          max_daily_budget: number | null
          max_daily_posts: number | null
          publication_type: string
          required_brand_checks: string[]
          requires_approval: boolean
          updated_at: string
        }
        Insert: {
          allowed_time_windows?: Json
          approval_role_required?: string | null
          autonomy_level_allowed?: string
          blocked_words?: string[]
          channel: string
          company_id?: string | null
          created_at?: string
          created_by?: string
          id?: string
          max_daily_budget?: number | null
          max_daily_posts?: number | null
          publication_type: string
          required_brand_checks?: string[]
          requires_approval?: boolean
          updated_at?: string
        }
        Update: {
          allowed_time_windows?: Json
          approval_role_required?: string | null
          autonomy_level_allowed?: string
          blocked_words?: string[]
          channel?: string
          company_id?: string | null
          created_at?: string
          created_by?: string
          id?: string
          max_daily_budget?: number | null
          max_daily_posts?: number | null
          publication_type?: string
          required_brand_checks?: string[]
          requires_approval?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "publication_policies_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dna"
            referencedColumns: ["id"]
          },
        ]
      }
      role_definitions: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_system: boolean | null
          label: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id: string
          is_system?: boolean | null
          label?: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_system?: boolean | null
          label?: string
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          permission_id: string
          role_id: string
          scope: string
        }
        Insert: {
          permission_id: string
          role_id: string
          scope?: string
        }
        Update: {
          permission_id?: string
          role_id?: string
          scope?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "role_definitions"
            referencedColumns: ["id"]
          },
        ]
      }
      strategic_goals: {
        Row: {
          company_dna_id: string | null
          created_at: string
          current_value: number | null
          description: string | null
          goal_type: string
          id: string
          owner_role: string | null
          status: string
          target_metric: string | null
          target_value: number | null
          time_horizon: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          company_dna_id?: string | null
          created_at?: string
          current_value?: number | null
          description?: string | null
          goal_type?: string
          id?: string
          owner_role?: string | null
          status?: string
          target_metric?: string | null
          target_value?: number | null
          time_horizon?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          company_dna_id?: string | null
          created_at?: string
          current_value?: number | null
          description?: string | null
          goal_type?: string
          id?: string
          owner_role?: string | null
          status?: string
          target_metric?: string | null
          target_value?: number | null
          time_horizon?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "strategic_goals_company_dna_id_fkey"
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
          density_mode: string
          hidden_banners: string[]
          id: string
          onboarding_checklist: Json
          persona: string | null
          tour_completed: boolean
          tour_completed_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          density_mode?: string
          hidden_banners?: string[]
          id?: string
          onboarding_checklist?: Json
          persona?: string | null
          tour_completed?: boolean
          tour_completed_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          density_mode?: string
          hidden_banners?: string[]
          id?: string
          onboarding_checklist?: Json
          persona?: string | null
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
            referencedRelation: "company_role_definitions"
            referencedColumns: ["id"]
          },
        ]
      }
      variant_edits: {
        Row: {
          created_at: string
          edit_source: string
          field_name: string
          id: string
          new_value: string | null
          notes: string | null
          old_value: string | null
          user_id: string
          variant_id: string
        }
        Insert: {
          created_at?: string
          edit_source?: string
          field_name: string
          id?: string
          new_value?: string | null
          notes?: string | null
          old_value?: string | null
          user_id: string
          variant_id: string
        }
        Update: {
          created_at?: string
          edit_source?: string
          field_name?: string
          id?: string
          new_value?: string | null
          notes?: string | null
          old_value?: string | null
          user_id?: string
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "variant_edits_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "creative_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_business_snapshots: {
        Row: {
          active_campaigns: number
          cac_avg: number | null
          created_at: string
          crm_opportunities_created: number
          decisions_applied: number
          decisions_made: number
          funnel_conversions: number
          id: string
          new_customers: number
          repeat_customers: number
          repurchase_rate: number | null
          roas_avg: number | null
          total_revenue: number
          total_spend: number
          user_id: string
          week_start: string
        }
        Insert: {
          active_campaigns?: number
          cac_avg?: number | null
          created_at?: string
          crm_opportunities_created?: number
          decisions_applied?: number
          decisions_made?: number
          funnel_conversions?: number
          id?: string
          new_customers?: number
          repeat_customers?: number
          repurchase_rate?: number | null
          roas_avg?: number | null
          total_revenue?: number
          total_spend?: number
          user_id: string
          week_start: string
        }
        Update: {
          active_campaigns?: number
          cac_avg?: number | null
          created_at?: string
          crm_opportunities_created?: number
          decisions_applied?: number
          decisions_made?: number
          funnel_conversions?: number
          id?: string
          new_customers?: number
          repeat_customers?: number
          repurchase_rate?: number | null
          roas_avg?: number | null
          total_revenue?: number
          total_spend?: number
          user_id?: string
          week_start?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_effective_permissions: {
        Args: { _user_id: string }
        Returns: {
          company_dna_id: string
          permission_id: string
          scope: string
        }[]
      }
      get_invite_preview: {
        Args: { _token: string }
        Returns: {
          company_name: string
          email: string
          expires_at: string
          full_name: string
          role: Database["public"]["Enums"]["app_role"]
          status: string
        }[]
      }
      get_user_company: { Args: { _user_id: string }; Returns: string }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_permission: {
        Args: {
          _company_dna_id?: string
          _permission_id: string
          _user_id: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      search_memory: {
        Args: {
          match_count?: number
          match_threshold?: number
          p_user_id: string
          query_embedding: string
        }
        Returns: {
          content: string
          id: string
          importance: number
          memory_type: string
          occurred_at: string
          similarity: number
          source: string
          summary: string
          tags: string[]
          title: string
        }[]
      }
      shared_company_dna_id: {
        Args: { user_a: string; user_b: string }
        Returns: string
      }
      user_can_manage_company_finance: {
        Args: { _company_id: string }
        Returns: boolean
      }
      user_can_operate_company: {
        Args: { _company_id: string }
        Returns: boolean
      }
      user_can_view_company: { Args: { _company_id: string }; Returns: boolean }
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      app_role: ["owner", "admin", "employee"],
    },
  },
} as const
