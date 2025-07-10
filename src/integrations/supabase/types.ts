export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      assignment_student_submissions: {
        Row: {
          assignment_id: string
          created_at: string
          feedback: string | null
          id: string
          score: number | null
          status: string
          student_id: string
          submission_content: Json
          submitted_at: string
          submitted_files: Json | null
          updated_at: string
        }
        Insert: {
          assignment_id: string
          created_at?: string
          feedback?: string | null
          id?: string
          score?: number | null
          status?: string
          student_id: string
          submission_content?: Json
          submitted_at?: string
          submitted_files?: Json | null
          updated_at?: string
        }
        Update: {
          assignment_id?: string
          created_at?: string
          feedback?: string | null
          id?: string
          score?: number | null
          status?: string
          student_id?: string
          submission_content?: Json
          submitted_at?: string
          submitted_files?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignment_student_submissions_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      assignment_submissions: {
        Row: {
          assignment_id: string
          auto_grade_feedback: Json | null
          auto_grade_score: number | null
          created_at: string
          execution_results: Json | null
          id: string
          manual_feedback: string | null
          manual_grade_score: number | null
          status: string
          student_id: string
          submission_time: string
          submitted_content: Json
          updated_at: string
        }
        Insert: {
          assignment_id: string
          auto_grade_feedback?: Json | null
          auto_grade_score?: number | null
          created_at?: string
          execution_results?: Json | null
          id?: string
          manual_feedback?: string | null
          manual_grade_score?: number | null
          status?: string
          student_id: string
          submission_time?: string
          submitted_content?: Json
          updated_at?: string
        }
        Update: {
          assignment_id?: string
          auto_grade_feedback?: Json | null
          auto_grade_score?: number | null
          created_at?: string
          execution_results?: Json | null
          id?: string
          manual_feedback?: string | null
          manual_grade_score?: number | null
          status?: string
          student_id?: string
          submission_time?: string
          submitted_content?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignment_submissions_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "notebook_assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      assignments: {
        Row: {
          allowed_file_types: string[] | null
          assignment_type: string | null
          class_id: string
          content: Json
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          instructions: string | null
          is_published: boolean
          max_score: number | null
          teacher_id: string
          title: string
          updated_at: string
        }
        Insert: {
          allowed_file_types?: string[] | null
          assignment_type?: string | null
          class_id: string
          content?: Json
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          instructions?: string | null
          is_published?: boolean
          max_score?: number | null
          teacher_id: string
          title: string
          updated_at?: string
        }
        Update: {
          allowed_file_types?: string[] | null
          assignment_type?: string | null
          class_id?: string
          content?: Json
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          instructions?: string | null
          is_published?: boolean
          max_score?: number | null
          teacher_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      class_activities: {
        Row: {
          activity_type: string
          cell_id: string | null
          class_id: string
          content: string | null
          id: string
          timestamp: string
          user_id: string
        }
        Insert: {
          activity_type: string
          cell_id?: string | null
          class_id: string
          content?: string | null
          id?: string
          timestamp?: string
          user_id: string
        }
        Update: {
          activity_type?: string
          cell_id?: string | null
          class_id?: string
          content?: string | null
          id?: string
          timestamp?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_activities_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      class_members: {
        Row: {
          class_id: string
          id: string
          is_active: boolean | null
          joined_at: string
          last_activity: string | null
          student_id: string
        }
        Insert: {
          class_id: string
          id?: string
          is_active?: boolean | null
          joined_at?: string
          last_activity?: string | null
          student_id: string
        }
        Update: {
          class_id?: string
          id?: string
          is_active?: boolean | null
          joined_at?: string
          last_activity?: string | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_members_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      class_messages: {
        Row: {
          class_id: string
          created_at: string
          id: string
          is_deleted: boolean
          message: string
          message_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          class_id: string
          created_at?: string
          id?: string
          is_deleted?: boolean
          message: string
          message_type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          class_id?: string
          created_at?: string
          id?: string
          is_deleted?: boolean
          message?: string
          message_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_messages_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      class_sessions: {
        Row: {
          active_cell: string | null
          class_id: string
          cursor_position: Json | null
          id: string
          is_online: boolean | null
          last_activity: string
          session_data: Json | null
          user_id: string
        }
        Insert: {
          active_cell?: string | null
          class_id: string
          cursor_position?: Json | null
          id?: string
          is_online?: boolean | null
          last_activity?: string
          session_data?: Json | null
          user_id: string
        }
        Update: {
          active_cell?: string | null
          class_id?: string
          cursor_position?: Json | null
          id?: string
          is_online?: boolean | null
          last_activity?: string
          session_data?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_sessions_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          class_code: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          notebook_content: Json | null
          teacher_id: string
          updated_at: string
        }
        Insert: {
          class_code: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          notebook_content?: Json | null
          teacher_id: string
          updated_at?: string
        }
        Update: {
          class_code?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          notebook_content?: Json | null
          teacher_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      code_review_comments: {
        Row: {
          assignment_id: string
          author_id: string
          content: string
          created_at: string
          id: string
          line_number: number
          submission_id: string
          type: string
          updated_at: string
        }
        Insert: {
          assignment_id: string
          author_id: string
          content: string
          created_at?: string
          id?: string
          line_number: number
          submission_id: string
          type?: string
          updated_at?: string
        }
        Update: {
          assignment_id?: string
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          line_number?: number
          submission_id?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      notebook_assignments: {
        Row: {
          assigned_at: string
          grade: string | null
          id: string
          notebook_id: string
          status: string
          student_content: Json | null
          student_id: string
          submitted_at: string | null
          teacher_feedback: string | null
          teacher_id: string
        }
        Insert: {
          assigned_at?: string
          grade?: string | null
          id?: string
          notebook_id: string
          status?: string
          student_content?: Json | null
          student_id: string
          submitted_at?: string | null
          teacher_feedback?: string | null
          teacher_id: string
        }
        Update: {
          assigned_at?: string
          grade?: string | null
          id?: string
          notebook_id?: string
          status?: string
          student_content?: Json | null
          student_id?: string
          submitted_at?: string | null
          teacher_feedback?: string | null
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notebook_assignments_notebook_id_fkey"
            columns: ["notebook_id"]
            isOneToOne: false
            referencedRelation: "notebooks"
            referencedColumns: ["id"]
          },
        ]
      }
      notebook_collaborators: {
        Row: {
          accepted_at: string | null
          id: string
          invited_at: string
          invited_by: string
          notebook_id: string
          permission: string
          user_id: string
        }
        Insert: {
          accepted_at?: string | null
          id?: string
          invited_at?: string
          invited_by: string
          notebook_id: string
          permission?: string
          user_id: string
        }
        Update: {
          accepted_at?: string | null
          id?: string
          invited_at?: string
          invited_by?: string
          notebook_id?: string
          permission?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notebook_collaborators_notebook_id_fkey"
            columns: ["notebook_id"]
            isOneToOne: false
            referencedRelation: "notebooks"
            referencedColumns: ["id"]
          },
        ]
      }
      notebook_test_cases: {
        Row: {
          cell_index: number
          created_at: string
          id: string
          is_hidden: boolean
          notebook_id: string
          points: number
          test_config: Json
          test_type: string
        }
        Insert: {
          cell_index: number
          created_at?: string
          id?: string
          is_hidden?: boolean
          notebook_id: string
          points?: number
          test_config: Json
          test_type: string
        }
        Update: {
          cell_index?: number
          created_at?: string
          id?: string
          is_hidden?: boolean
          notebook_id?: string
          points?: number
          test_config?: Json
          test_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "notebook_test_cases_notebook_id_fkey"
            columns: ["notebook_id"]
            isOneToOne: false
            referencedRelation: "notebooks"
            referencedColumns: ["id"]
          },
        ]
      }
      notebooks: {
        Row: {
          auto_grade_config: Json | null
          content: Json
          created_at: string
          created_by: string
          description: string | null
          difficulty: string | null
          estimated_time: number | null
          id: string
          is_shared: boolean | null
          is_template: boolean | null
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          auto_grade_config?: Json | null
          content?: Json
          created_at?: string
          created_by: string
          description?: string | null
          difficulty?: string | null
          estimated_time?: number | null
          id?: string
          is_shared?: boolean | null
          is_template?: boolean | null
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          auto_grade_config?: Json | null
          content?: Json
          created_at?: string
          created_by?: string
          description?: string | null
          difficulty?: string | null
          estimated_time?: number | null
          id?: string
          is_shared?: boolean | null
          is_template?: boolean | null
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          role?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      student_progress: {
        Row: {
          cells_completed: number
          completion_percentage: number
          id: string
          last_accessed: string
          notebook_id: string
          student_id: string
          time_spent: number
          total_cells: number
        }
        Insert: {
          cells_completed?: number
          completion_percentage?: number
          id?: string
          last_accessed?: string
          notebook_id: string
          student_id: string
          time_spent?: number
          total_cells?: number
        }
        Update: {
          cells_completed?: number
          completion_percentage?: number
          id?: string
          last_accessed?: string
          notebook_id?: string
          student_id?: string
          time_spent?: number
          total_cells?: number
        }
        Relationships: [
          {
            foreignKeyName: "student_progress_notebook_id_fkey"
            columns: ["notebook_id"]
            isOneToOne: false
            referencedRelation: "notebooks"
            referencedColumns: ["id"]
          },
        ]
      }
      terminal_sessions: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          last_activity: string
          notebook_id: string | null
          session_data: Json
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          last_activity?: string
          notebook_id?: string | null
          session_data?: Json
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          last_activity?: string
          notebook_id?: string | null
          session_data?: Json
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "terminal_sessions_notebook_id_fkey"
            columns: ["notebook_id"]
            isOneToOne: false
            referencedRelation: "notebooks"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_class_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_user_role: {
        Args: { user_id_param: string }
        Returns: string
      }
      is_class_member: {
        Args: { class_id_param: string; user_id_param: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
