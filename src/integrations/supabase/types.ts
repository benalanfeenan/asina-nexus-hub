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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      auto_reference_sequences: {
        Row: {
          id: string
          last_number: number
          type: string
          year: number
        }
        Insert: {
          id?: string
          last_number?: number
          type: string
          year: number
        }
        Update: {
          id?: string
          last_number?: number
          type?: string
          year?: number
        }
        Relationships: []
      }
      board_lodging_invoices: {
        Row: {
          amount: number
          created_at: string
          id: string
          notes: string | null
          participant_id: string
          period_end: string
          period_start: string
          status: Database["public"]["Enums"]["invoice_status"]
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          notes?: string | null
          participant_id: string
          period_end: string
          period_start: string
          status?: Database["public"]["Enums"]["invoice_status"]
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          notes?: string | null
          participant_id?: string
          period_end?: string
          period_start?: string
          status?: Database["public"]["Enums"]["invoice_status"]
        }
        Relationships: [
          {
            foreignKeyName: "board_lodging_invoices_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
        ]
      }
      complaints: {
        Row: {
          acknowledgement_date: string | null
          assigned_to: string | null
          complainant_contact: string | null
          complainant_name: string | null
          created_at: string
          created_by: string
          description: string
          id: string
          reference_number: string
          resolution_date: string | null
          resolution_details: string | null
          status: Database["public"]["Enums"]["complaint_status"]
          title: string
          updated_at: string
        }
        Insert: {
          acknowledgement_date?: string | null
          assigned_to?: string | null
          complainant_contact?: string | null
          complainant_name?: string | null
          created_at?: string
          created_by: string
          description: string
          id?: string
          reference_number?: string
          resolution_date?: string | null
          resolution_details?: string | null
          status?: Database["public"]["Enums"]["complaint_status"]
          title: string
          updated_at?: string
        }
        Update: {
          acknowledgement_date?: string | null
          assigned_to?: string | null
          complainant_contact?: string | null
          complainant_name?: string | null
          created_at?: string
          created_by?: string
          description?: string
          id?: string
          reference_number?: string
          resolution_date?: string | null
          resolution_details?: string | null
          status?: Database["public"]["Enums"]["complaint_status"]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      documents: {
        Row: {
          category: Database["public"]["Enums"]["document_category"]
          created_at: string
          file_url: string | null
          id: string
          notes: string | null
          review_date: string | null
          title: string
          updated_at: string
          uploaded_by: string | null
          version: string | null
        }
        Insert: {
          category?: Database["public"]["Enums"]["document_category"]
          created_at?: string
          file_url?: string | null
          id?: string
          notes?: string | null
          review_date?: string | null
          title: string
          updated_at?: string
          uploaded_by?: string | null
          version?: string | null
        }
        Update: {
          category?: Database["public"]["Enums"]["document_category"]
          created_at?: string
          file_url?: string | null
          id?: string
          notes?: string | null
          review_date?: string | null
          title?: string
          updated_at?: string
          uploaded_by?: string | null
          version?: string | null
        }
        Relationships: []
      }
      hazards: {
        Row: {
          control_measures: string | null
          created_at: string
          description: string
          id: string
          location: string | null
          photo_url: string | null
          reported_by: string | null
          resolved_at: string | null
          risk_level: string | null
          sil_house_id: string | null
          status: Database["public"]["Enums"]["hazard_status"]
          updated_at: string
        }
        Insert: {
          control_measures?: string | null
          created_at?: string
          description: string
          id?: string
          location?: string | null
          photo_url?: string | null
          reported_by?: string | null
          resolved_at?: string | null
          risk_level?: string | null
          sil_house_id?: string | null
          status?: Database["public"]["Enums"]["hazard_status"]
          updated_at?: string
        }
        Update: {
          control_measures?: string | null
          created_at?: string
          description?: string
          id?: string
          location?: string | null
          photo_url?: string | null
          reported_by?: string | null
          resolved_at?: string | null
          risk_level?: string | null
          sil_house_id?: string | null
          status?: Database["public"]["Enums"]["hazard_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hazards_sil_house_id_fkey"
            columns: ["sil_house_id"]
            isOneToOne: false
            referencedRelation: "sil_houses"
            referencedColumns: ["id"]
          },
        ]
      }
      incidents: {
        Row: {
          category_flags: Json | null
          closed_at: string | null
          closed_by: string | null
          corrective_actions: string | null
          created_at: string
          date_occurred: string
          date_reported: string
          description: string
          id: string
          immediate_actions: string | null
          investigation_findings: string | null
          is_reportable: boolean | null
          participant_id: string | null
          reference_number: string
          reported_by: string
          root_cause: string | null
          severity: Database["public"]["Enums"]["incident_severity"]
          sil_house_id: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          category_flags?: Json | null
          closed_at?: string | null
          closed_by?: string | null
          corrective_actions?: string | null
          created_at?: string
          date_occurred?: string
          date_reported?: string
          description: string
          id?: string
          immediate_actions?: string | null
          investigation_findings?: string | null
          is_reportable?: boolean | null
          participant_id?: string | null
          reference_number?: string
          reported_by: string
          root_cause?: string | null
          severity?: Database["public"]["Enums"]["incident_severity"]
          sil_house_id?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          category_flags?: Json | null
          closed_at?: string | null
          closed_by?: string | null
          corrective_actions?: string | null
          created_at?: string
          date_occurred?: string
          date_reported?: string
          description?: string
          id?: string
          immediate_actions?: string | null
          investigation_findings?: string | null
          is_reportable?: boolean | null
          participant_id?: string | null
          reference_number?: string
          reported_by?: string
          root_cause?: string | null
          severity?: Database["public"]["Enums"]["incident_severity"]
          sil_house_id?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "incidents_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidents_sil_house_id_fkey"
            columns: ["sil_house_id"]
            isOneToOne: false
            referencedRelation: "sil_houses"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_line_items: {
        Row: {
          amount: number
          created_at: string
          description: string
          id: string
          invoice_id: string
          ndis_line_item_code: string | null
          quantity: number | null
          rate: number
          service_date: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          description: string
          id?: string
          invoice_id: string
          ndis_line_item_code?: string | null
          quantity?: number | null
          rate: number
          service_date?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string
          id?: string
          invoice_id?: string
          ndis_line_item_code?: string | null
          quantity?: number | null
          rate?: number
          service_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoice_line_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          created_at: string
          created_by: string | null
          due_date: string | null
          id: string
          invoice_number: string
          issue_date: string
          notes: string | null
          participant_id: string
          status: Database["public"]["Enums"]["invoice_status"]
          total: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          due_date?: string | null
          id?: string
          invoice_number: string
          issue_date?: string
          notes?: string | null
          participant_id: string
          status?: Database["public"]["Enums"]["invoice_status"]
          total?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          due_date?: string | null
          id?: string
          invoice_number?: string
          issue_date?: string
          notes?: string | null
          participant_id?: string
          status?: Database["public"]["Enums"]["invoice_status"]
          total?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
        ]
      }
      mar_records: {
        Row: {
          administered_by: string | null
          created_at: string
          date: string
          id: string
          medication_id: string
          notes: string | null
          status: string
          time_slot: string
        }
        Insert: {
          administered_by?: string | null
          created_at?: string
          date: string
          id?: string
          medication_id: string
          notes?: string | null
          status?: string
          time_slot: string
        }
        Update: {
          administered_by?: string | null
          created_at?: string
          date?: string
          id?: string
          medication_id?: string
          notes?: string | null
          status?: string
          time_slot?: string
        }
        Relationships: [
          {
            foreignKeyName: "mar_records_medication_id_fkey"
            columns: ["medication_id"]
            isOneToOne: false
            referencedRelation: "medications"
            referencedColumns: ["id"]
          },
        ]
      }
      medications: {
        Row: {
          created_at: string
          dose: string | null
          frequency: string | null
          id: string
          instructions: string | null
          is_active: boolean
          is_prn: boolean | null
          name: string
          participant_id: string
          prescriber: string | null
          route: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          dose?: string | null
          frequency?: string | null
          id?: string
          instructions?: string | null
          is_active?: boolean
          is_prn?: boolean | null
          name: string
          participant_id: string
          prescriber?: string | null
          route?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          dose?: string | null
          frequency?: string | null
          id?: string
          instructions?: string | null
          is_active?: boolean
          is_prn?: boolean | null
          name?: string
          participant_id?: string
          prescriber?: string | null
          route?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "medications_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
        ]
      }
      ndis_price_list: {
        Row: {
          category: string | null
          created_at: string
          description: string
          id: string
          is_active: boolean | null
          item_code: string
          rate: number
          unit: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          description: string
          id?: string
          is_active?: boolean | null
          item_code: string
          rate: number
          unit?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string
          id?: string
          is_active?: boolean | null
          item_code?: string
          rate?: number
          unit?: string | null
        }
        Relationships: []
      }
      organisation_settings: {
        Row: {
          abn: string | null
          address: string | null
          bank_details: Json | null
          created_at: string
          email: string | null
          id: string
          logo_url: string | null
          name: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          abn?: string | null
          address?: string | null
          bank_details?: Json | null
          created_at?: string
          email?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          abn?: string | null
          address?: string | null
          bank_details?: Json | null
          created_at?: string
          email?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      participant_contacts: {
        Row: {
          contact_type: Database["public"]["Enums"]["contact_type"]
          created_at: string
          email: string | null
          id: string
          is_primary: boolean | null
          name: string
          notes: string | null
          participant_id: string
          phone: string | null
          relationship: string | null
        }
        Insert: {
          contact_type?: Database["public"]["Enums"]["contact_type"]
          created_at?: string
          email?: string | null
          id?: string
          is_primary?: boolean | null
          name: string
          notes?: string | null
          participant_id: string
          phone?: string | null
          relationship?: string | null
        }
        Update: {
          contact_type?: Database["public"]["Enums"]["contact_type"]
          created_at?: string
          email?: string | null
          id?: string
          is_primary?: boolean | null
          name?: string
          notes?: string | null
          participant_id?: string
          phone?: string | null
          relationship?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "participant_contacts_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
        ]
      }
      participant_daily_routines: {
        Row: {
          created_at: string
          id: string
          participant_id: string
          routine_description: string
          support_required: string | null
          time_of_day: string
        }
        Insert: {
          created_at?: string
          id?: string
          participant_id: string
          routine_description: string
          support_required?: string | null
          time_of_day: string
        }
        Update: {
          created_at?: string
          id?: string
          participant_id?: string
          routine_description?: string
          support_required?: string | null
          time_of_day?: string
        }
        Relationships: [
          {
            foreignKeyName: "participant_daily_routines_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
        ]
      }
      participant_goals: {
        Row: {
          created_at: string
          goal_text: string
          id: string
          notes: string | null
          participant_id: string
          progress_percentage: number | null
          status: Database["public"]["Enums"]["goal_status"]
          target_date: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          goal_text: string
          id?: string
          notes?: string | null
          participant_id: string
          progress_percentage?: number | null
          status?: Database["public"]["Enums"]["goal_status"]
          target_date?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          goal_text?: string
          id?: string
          notes?: string | null
          participant_id?: string
          progress_percentage?: number | null
          status?: Database["public"]["Enums"]["goal_status"]
          target_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "participant_goals_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
        ]
      }
      participant_support_needs: {
        Row: {
          category: string
          created_at: string
          description: string
          id: string
          participant_id: string
          support_level: string | null
        }
        Insert: {
          category: string
          created_at?: string
          description: string
          id?: string
          participant_id: string
          support_level?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          id?: string
          participant_id?: string
          support_level?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "participant_support_needs_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
        ]
      }
      participants: {
        Row: {
          address: string | null
          alerts: Json | null
          created_at: string
          date_of_birth: string | null
          email: string | null
          first_name: string
          id: string
          is_active: boolean
          last_name: string
          ndis_number: string | null
          notes: string | null
          phone: string | null
          photo_url: string | null
          sil_house_id: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          alerts?: Json | null
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          first_name: string
          id?: string
          is_active?: boolean
          last_name: string
          ndis_number?: string | null
          notes?: string | null
          phone?: string | null
          photo_url?: string | null
          sil_house_id?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          alerts?: Json | null
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          first_name?: string
          id?: string
          is_active?: boolean
          last_name?: string
          ndis_number?: string | null
          notes?: string | null
          phone?: string | null
          photo_url?: string | null
          sil_house_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "participants_sil_house_id_fkey"
            columns: ["sil_house_id"]
            isOneToOne: false
            referencedRelation: "sil_houses"
            referencedColumns: ["id"]
          },
        ]
      }
      prn_records: {
        Row: {
          administered_at: string
          administered_by: string | null
          created_at: string
          follow_up_required: boolean | null
          id: string
          medication_id: string
          outcome: string | null
          reason: string
        }
        Insert: {
          administered_at?: string
          administered_by?: string | null
          created_at?: string
          follow_up_required?: boolean | null
          id?: string
          medication_id: string
          outcome?: string | null
          reason: string
        }
        Update: {
          administered_at?: string
          administered_by?: string | null
          created_at?: string
          follow_up_required?: boolean | null
          id?: string
          medication_id?: string
          outcome?: string | null
          reason?: string
        }
        Relationships: [
          {
            foreignKeyName: "prn_records_medication_id_fkey"
            columns: ["medication_id"]
            isOneToOne: false
            referencedRelation: "medications"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          is_active: boolean
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id: string
          is_active?: boolean
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          is_active?: boolean
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      progress_notes: {
        Row: {
          concern_details: string | null
          concerns_flagged: boolean | null
          content: string
          created_at: string
          goal_progress: Json | null
          id: string
          participant_id: string
          shift_id: string | null
          staff_id: string
          updated_at: string
        }
        Insert: {
          concern_details?: string | null
          concerns_flagged?: boolean | null
          content: string
          created_at?: string
          goal_progress?: Json | null
          id?: string
          participant_id: string
          shift_id?: string | null
          staff_id: string
          updated_at?: string
        }
        Update: {
          concern_details?: string | null
          concerns_flagged?: boolean | null
          content?: string
          created_at?: string
          goal_progress?: Json | null
          id?: string
          participant_id?: string
          shift_id?: string | null
          staff_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "progress_notes_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "progress_notes_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "shifts"
            referencedColumns: ["id"]
          },
        ]
      }
      property_maintenance_log: {
        Row: {
          completed_date: string | null
          contractor: string | null
          cost: number | null
          created_at: string
          description: string
          id: string
          notes: string | null
          priority: string | null
          reported_by: string | null
          scheduled_date: string | null
          sil_house_id: string
          status: Database["public"]["Enums"]["maintenance_status"]
          updated_at: string
        }
        Insert: {
          completed_date?: string | null
          contractor?: string | null
          cost?: number | null
          created_at?: string
          description: string
          id?: string
          notes?: string | null
          priority?: string | null
          reported_by?: string | null
          scheduled_date?: string | null
          sil_house_id: string
          status?: Database["public"]["Enums"]["maintenance_status"]
          updated_at?: string
        }
        Update: {
          completed_date?: string | null
          contractor?: string | null
          cost?: number | null
          created_at?: string
          description?: string
          id?: string
          notes?: string | null
          priority?: string | null
          reported_by?: string | null
          scheduled_date?: string | null
          sil_house_id?: string
          status?: Database["public"]["Enums"]["maintenance_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_maintenance_log_sil_house_id_fkey"
            columns: ["sil_house_id"]
            isOneToOne: false
            referencedRelation: "sil_houses"
            referencedColumns: ["id"]
          },
        ]
      }
      public_holidays: {
        Row: {
          created_at: string
          date: string
          id: string
          name: string
          state: string | null
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          name: string
          state?: string | null
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          name?: string
          state?: string | null
        }
        Relationships: []
      }
      quality_improvements: {
        Row: {
          action_required: string | null
          completed_at: string | null
          created_at: string
          created_by: string | null
          description: string
          due_date: string | null
          id: string
          responsible_person: string | null
          source_id: string | null
          source_type: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          action_required?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description: string
          due_date?: string | null
          id?: string
          responsible_person?: string | null
          source_id?: string | null
          source_type?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          action_required?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string
          due_date?: string | null
          id?: string
          responsible_person?: string | null
          source_id?: string | null
          source_type?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      recurring_roster_patterns: {
        Row: {
          created_at: string
          day_of_week: number
          end_time: string | null
          id: string
          is_active: boolean | null
          shift_type: Database["public"]["Enums"]["shift_type"]
          sil_house_id: string
          staff_id: string | null
          start_time: string | null
        }
        Insert: {
          created_at?: string
          day_of_week: number
          end_time?: string | null
          id?: string
          is_active?: boolean | null
          shift_type: Database["public"]["Enums"]["shift_type"]
          sil_house_id: string
          staff_id?: string | null
          start_time?: string | null
        }
        Update: {
          created_at?: string
          day_of_week?: number
          end_time?: string | null
          id?: string
          is_active?: boolean | null
          shift_type?: Database["public"]["Enums"]["shift_type"]
          sil_house_id?: string
          staff_id?: string | null
          start_time?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recurring_roster_patterns_sil_house_id_fkey"
            columns: ["sil_house_id"]
            isOneToOne: false
            referencedRelation: "sil_houses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_roster_patterns_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      restrictive_practices: {
        Row: {
          antecedent: string | null
          authorised_by: string | null
          created_at: string
          date_occurred: string
          description: string
          duration_minutes: number | null
          id: string
          is_authorised: boolean | null
          outcome: string | null
          participant_id: string
          practice_type: Database["public"]["Enums"]["restrictive_practice_type"]
          reported_by: string
        }
        Insert: {
          antecedent?: string | null
          authorised_by?: string | null
          created_at?: string
          date_occurred?: string
          description: string
          duration_minutes?: number | null
          id?: string
          is_authorised?: boolean | null
          outcome?: string | null
          participant_id: string
          practice_type: Database["public"]["Enums"]["restrictive_practice_type"]
          reported_by: string
        }
        Update: {
          antecedent?: string | null
          authorised_by?: string | null
          created_at?: string
          date_occurred?: string
          description?: string
          duration_minutes?: number | null
          id?: string
          is_authorised?: boolean | null
          outcome?: string | null
          participant_id?: string
          practice_type?: Database["public"]["Enums"]["restrictive_practice_type"]
          reported_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "restrictive_practices_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
        ]
      }
      risks: {
        Row: {
          additional_controls: string | null
          category: string | null
          consequence: Database["public"]["Enums"]["risk_consequence"]
          created_at: string
          created_by: string | null
          description: string
          existing_controls: string | null
          id: string
          likelihood: Database["public"]["Enums"]["risk_likelihood"]
          responsible_person: string | null
          review_date: string | null
          risk_rating: number | null
          status: string | null
          title: string
          updated_at: string
        }
        Insert: {
          additional_controls?: string | null
          category?: string | null
          consequence?: Database["public"]["Enums"]["risk_consequence"]
          created_at?: string
          created_by?: string | null
          description: string
          existing_controls?: string | null
          id?: string
          likelihood?: Database["public"]["Enums"]["risk_likelihood"]
          responsible_person?: string | null
          review_date?: string | null
          risk_rating?: number | null
          status?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          additional_controls?: string | null
          category?: string | null
          consequence?: Database["public"]["Enums"]["risk_consequence"]
          created_at?: string
          created_by?: string | null
          description?: string
          existing_controls?: string | null
          id?: string
          likelihood?: Database["public"]["Enums"]["risk_likelihood"]
          responsible_person?: string | null
          review_date?: string | null
          risk_rating?: number | null
          status?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      shift_handovers: {
        Row: {
          acknowledged: boolean | null
          acknowledged_at: string | null
          content: Json | null
          created_at: string
          id: string
          incoming_staff_id: string | null
          outgoing_staff_id: string
          shift_id: string | null
          sil_house_id: string
        }
        Insert: {
          acknowledged?: boolean | null
          acknowledged_at?: string | null
          content?: Json | null
          created_at?: string
          id?: string
          incoming_staff_id?: string | null
          outgoing_staff_id: string
          shift_id?: string | null
          sil_house_id: string
        }
        Update: {
          acknowledged?: boolean | null
          acknowledged_at?: string | null
          content?: Json | null
          created_at?: string
          id?: string
          incoming_staff_id?: string | null
          outgoing_staff_id?: string
          shift_id?: string | null
          sil_house_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shift_handovers_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "shifts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_handovers_sil_house_id_fkey"
            columns: ["sil_house_id"]
            isOneToOne: false
            referencedRelation: "sil_houses"
            referencedColumns: ["id"]
          },
        ]
      }
      shifts: {
        Row: {
          created_at: string
          date: string
          end_time: string | null
          id: string
          notes: string | null
          shift_type: Database["public"]["Enums"]["shift_type"]
          sil_house_id: string
          staff_id: string | null
          start_time: string | null
          status: Database["public"]["Enums"]["shift_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          date: string
          end_time?: string | null
          id?: string
          notes?: string | null
          shift_type: Database["public"]["Enums"]["shift_type"]
          sil_house_id: string
          staff_id?: string | null
          start_time?: string | null
          status?: Database["public"]["Enums"]["shift_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          date?: string
          end_time?: string | null
          id?: string
          notes?: string | null
          shift_type?: Database["public"]["Enums"]["shift_type"]
          sil_house_id?: string
          staff_id?: string | null
          start_time?: string | null
          status?: Database["public"]["Enums"]["shift_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shifts_sil_house_id_fkey"
            columns: ["sil_house_id"]
            isOneToOne: false
            referencedRelation: "sil_houses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shifts_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      sil_house_participants: {
        Row: {
          id: string
          is_current: boolean | null
          move_in_date: string | null
          move_out_date: string | null
          participant_id: string
          sil_house_id: string
        }
        Insert: {
          id?: string
          is_current?: boolean | null
          move_in_date?: string | null
          move_out_date?: string | null
          participant_id: string
          sil_house_id: string
        }
        Update: {
          id?: string
          is_current?: boolean | null
          move_in_date?: string | null
          move_out_date?: string | null
          participant_id?: string
          sil_house_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sil_house_participants_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sil_house_participants_sil_house_id_fkey"
            columns: ["sil_house_id"]
            isOneToOne: false
            referencedRelation: "sil_houses"
            referencedColumns: ["id"]
          },
        ]
      }
      sil_house_staff: {
        Row: {
          id: string
          is_primary: boolean | null
          sil_house_id: string
          staff_id: string
        }
        Insert: {
          id?: string
          is_primary?: boolean | null
          sil_house_id: string
          staff_id: string
        }
        Update: {
          id?: string
          is_primary?: boolean | null
          sil_house_id?: string
          staff_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sil_house_staff_sil_house_id_fkey"
            columns: ["sil_house_id"]
            isOneToOne: false
            referencedRelation: "sil_houses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sil_house_staff_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      sil_houses: {
        Row: {
          address: string | null
          capacity: number | null
          created_at: string
          id: string
          is_active: boolean
          name: string
          notes: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          capacity?: number | null
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          notes?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          capacity?: number | null
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          notes?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      sleepover_logs: {
        Row: {
          active_minutes: number | null
          created_at: string
          end_time: string | null
          id: string
          notes: string | null
          participant_id: string | null
          reason: string | null
          shift_id: string | null
          staff_id: string
          start_time: string
        }
        Insert: {
          active_minutes?: number | null
          created_at?: string
          end_time?: string | null
          id?: string
          notes?: string | null
          participant_id?: string | null
          reason?: string | null
          shift_id?: string | null
          staff_id: string
          start_time: string
        }
        Update: {
          active_minutes?: number | null
          created_at?: string
          end_time?: string | null
          id?: string
          notes?: string | null
          participant_id?: string | null
          reason?: string | null
          shift_id?: string | null
          staff_id?: string
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "sleepover_logs_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sleepover_logs_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "shifts"
            referencedColumns: ["id"]
          },
        ]
      }
      staff: {
        Row: {
          created_at: string
          employment_type: string | null
          end_date: string | null
          id: string
          is_active: boolean
          notes: string | null
          position: string | null
          profile_id: string
          start_date: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          employment_type?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean
          notes?: string | null
          position?: string | null
          profile_id: string
          start_date?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          employment_type?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean
          notes?: string | null
          position?: string | null
          profile_id?: string
          start_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_compliance: {
        Row: {
          check_type: Database["public"]["Enums"]["compliance_check_type"]
          created_at: string
          document_url: string | null
          expiry_date: string | null
          id: string
          is_verified: boolean | null
          issue_date: string | null
          reference_number: string | null
          staff_id: string
          updated_at: string
        }
        Insert: {
          check_type: Database["public"]["Enums"]["compliance_check_type"]
          created_at?: string
          document_url?: string | null
          expiry_date?: string | null
          id?: string
          is_verified?: boolean | null
          issue_date?: string | null
          reference_number?: string | null
          staff_id: string
          updated_at?: string
        }
        Update: {
          check_type?: Database["public"]["Enums"]["compliance_check_type"]
          created_at?: string
          document_url?: string | null
          expiry_date?: string | null
          id?: string
          is_verified?: boolean | null
          issue_date?: string | null
          reference_number?: string | null
          staff_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_compliance_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_training: {
        Row: {
          certificate_url: string | null
          completion_date: string | null
          created_at: string
          expiry_date: string | null
          id: string
          provider: string | null
          staff_id: string
          status: string | null
          training_name: string
        }
        Insert: {
          certificate_url?: string | null
          completion_date?: string | null
          created_at?: string
          expiry_date?: string | null
          id?: string
          provider?: string | null
          staff_id: string
          status?: string | null
          training_name: string
        }
        Update: {
          certificate_url?: string | null
          completion_date?: string | null
          created_at?: string
          expiry_date?: string | null
          id?: string
          provider?: string | null
          staff_id?: string
          status?: string | null
          training_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_training_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      timesheets: {
        Row: {
          approval_status: Database["public"]["Enums"]["approval_status"]
          approved_at: string | null
          approved_by: string | null
          break_minutes: number | null
          created_at: string
          date: string
          end_time: string | null
          hours: number | null
          id: string
          notes: string | null
          rate_type: Database["public"]["Enums"]["rate_type"]
          shift_id: string | null
          staff_id: string
          start_time: string | null
          updated_at: string
        }
        Insert: {
          approval_status?: Database["public"]["Enums"]["approval_status"]
          approved_at?: string | null
          approved_by?: string | null
          break_minutes?: number | null
          created_at?: string
          date: string
          end_time?: string | null
          hours?: number | null
          id?: string
          notes?: string | null
          rate_type?: Database["public"]["Enums"]["rate_type"]
          shift_id?: string | null
          staff_id: string
          start_time?: string | null
          updated_at?: string
        }
        Update: {
          approval_status?: Database["public"]["Enums"]["approval_status"]
          approved_at?: string | null
          approved_by?: string | null
          break_minutes?: number | null
          created_at?: string
          date?: string
          end_time?: string | null
          hours?: number | null
          id?: string
          notes?: string | null
          rate_type?: Database["public"]["Enums"]["rate_type"]
          shift_id?: string | null
          staff_id?: string
          start_time?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "timesheets_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "shifts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timesheets_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      next_reference: { Args: { ref_type: string }; Returns: string }
    }
    Enums: {
      app_role: "admin" | "house_manager" | "support_worker"
      approval_status: "pending" | "approved" | "rejected"
      complaint_status:
        | "received"
        | "acknowledged"
        | "investigating"
        | "resolved"
        | "closed"
      compliance_check_type:
        | "ndis_wsc"
        | "wwcc"
        | "first_aid"
        | "cpr"
        | "police_check"
        | "drivers_license"
        | "other"
      contact_type:
        | "emergency"
        | "guardian"
        | "gp"
        | "pharmacy"
        | "specialist"
        | "other"
      document_category:
        | "policy"
        | "procedure"
        | "form"
        | "template"
        | "training"
        | "compliance"
        | "other"
      goal_status: "not_started" | "in_progress" | "achieved" | "discontinued"
      hazard_status: "identified" | "assessed" | "controlled" | "eliminated"
      incident_severity: "low" | "medium" | "high" | "critical"
      invoice_status: "draft" | "sent" | "paid" | "overdue" | "cancelled"
      maintenance_status: "reported" | "scheduled" | "in_progress" | "completed"
      rate_type:
        | "standard"
        | "saturday"
        | "sunday"
        | "public_holiday"
        | "overtime"
        | "sleepover"
      restrictive_practice_type:
        | "chemical"
        | "mechanical"
        | "physical"
        | "seclusion"
        | "environmental"
      risk_consequence:
        | "insignificant"
        | "minor"
        | "moderate"
        | "major"
        | "catastrophic"
      risk_likelihood:
        | "rare"
        | "unlikely"
        | "possible"
        | "likely"
        | "almost_certain"
      shift_status:
        | "draft"
        | "published"
        | "confirmed"
        | "completed"
        | "cancelled"
      shift_type:
        | "morning"
        | "afternoon"
        | "night"
        | "sleepover"
        | "active_night"
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
      app_role: ["admin", "house_manager", "support_worker"],
      approval_status: ["pending", "approved", "rejected"],
      complaint_status: [
        "received",
        "acknowledged",
        "investigating",
        "resolved",
        "closed",
      ],
      compliance_check_type: [
        "ndis_wsc",
        "wwcc",
        "first_aid",
        "cpr",
        "police_check",
        "drivers_license",
        "other",
      ],
      contact_type: [
        "emergency",
        "guardian",
        "gp",
        "pharmacy",
        "specialist",
        "other",
      ],
      document_category: [
        "policy",
        "procedure",
        "form",
        "template",
        "training",
        "compliance",
        "other",
      ],
      goal_status: ["not_started", "in_progress", "achieved", "discontinued"],
      hazard_status: ["identified", "assessed", "controlled", "eliminated"],
      incident_severity: ["low", "medium", "high", "critical"],
      invoice_status: ["draft", "sent", "paid", "overdue", "cancelled"],
      maintenance_status: ["reported", "scheduled", "in_progress", "completed"],
      rate_type: [
        "standard",
        "saturday",
        "sunday",
        "public_holiday",
        "overtime",
        "sleepover",
      ],
      restrictive_practice_type: [
        "chemical",
        "mechanical",
        "physical",
        "seclusion",
        "environmental",
      ],
      risk_consequence: [
        "insignificant",
        "minor",
        "moderate",
        "major",
        "catastrophic",
      ],
      risk_likelihood: [
        "rare",
        "unlikely",
        "possible",
        "likely",
        "almost_certain",
      ],
      shift_status: [
        "draft",
        "published",
        "confirmed",
        "completed",
        "cancelled",
      ],
      shift_type: [
        "morning",
        "afternoon",
        "night",
        "sleepover",
        "active_night",
      ],
    },
  },
} as const
