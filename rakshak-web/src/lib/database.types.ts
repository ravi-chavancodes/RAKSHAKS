
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "assignments": {
                  Row: {
                    "assigned_at": string,"distance_m": number | null,"id": string,"incident_id": string,"rejection_reason": string | null,"responded_at": string | null,"responder_id": string,"response_state": string
                  }
                  ComputedFields: never
                  Insert: {
                    "assigned_at"?: string,"distance_m"?: number | null,"id"?: string,"incident_id": string,"rejection_reason"?: string | null,"responded_at"?: string | null,"responder_id": string,"response_state"?: string
                  }
                  Update: {
                    "assigned_at"?: string,"distance_m"?: number | null,"id"?: string,"incident_id"?: string,"rejection_reason"?: string | null,"responded_at"?: string | null,"responder_id"?: string,"response_state"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "assignments_incident_id_fkey"
      columns: ["incident_id"]
isOneToOne: false
      referencedRelation: "incidents"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "assignments_responder_id_fkey"
      columns: ["responder_id"]
isOneToOne: false
      referencedRelation: "responders"
      referencedColumns: ["id"]
    }
                  ]
                },"notifications": {
                  Row: {
                    "channel": string,"created_at": string,"id": string,"incident_id": string,"payload": NonNullable<Json>,"responder_id": string,"status": string
                  }
                  ComputedFields: never
                  Insert: {
                    "channel"?: string,"created_at"?: string,"id"?: string,"incident_id": string,"payload"?: NonNullable<Json>,"responder_id": string,"status"?: string
                  }
                  Update: {
                    "channel"?: string,"created_at"?: string,"id"?: string,"incident_id"?: string,"payload"?: NonNullable<Json>,"responder_id"?: string,"status"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "notifications_incident_id_fkey"
      columns: ["incident_id"]
isOneToOne: false
      referencedRelation: "incidents"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "notifications_responder_id_fkey"
      columns: ["responder_id"]
isOneToOne: false
      referencedRelation: "responders"
      referencedColumns: ["id"]
    }
                  ]
                },"audit_logs": {
                  Row: {
                    "action": string,"actor_id": string | null,"created_at": string,"entity": string,"entity_id": string,"id": number,"metadata": NonNullable<Json>
                  }
                  ComputedFields: never
                  Insert: {
                    "action": string,"actor_id"?: string | null,"created_at"?: string,"entity": string,"entity_id": string,"id"?: number,"metadata"?: NonNullable<Json>
                  }
                  Update: {
                    "action"?: string,"actor_id"?: string | null,"created_at"?: string,"entity"?: string,"entity_id"?: string,"id"?: number,"metadata"?: NonNullable<Json>
                  }
                  Relationships: [
                    {
      foreignKeyName: "audit_logs_actor_id_fkey"
      columns: ["actor_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"incidents": {
                  Row: {
                    "ai_confidence": number | null,"ai_suggested_category": Database["public"]['Enums']["emergency_category"] | null,"ai_suggested_priority": string | null,"audio_duration_ms": number | null,"audio_path": string | null,"audio_permission_state": string | null,"category": Database["public"]['Enums']["emergency_category"],"category_confirmed": boolean,"client_request_id": string,"created_at": string,"description": string,"id": string,"location": unknown,"location_accuracy_m": number | null,"location_is_approximate": boolean,"location_text": string | null,"reference": string,"reporter_id": string | null,"reporting_mode": Database["public"]['Enums']["reporting_mode"],"status": Database["public"]['Enums']["case_status"],"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "ai_confidence"?: number | null,"ai_suggested_category"?: Database["public"]['Enums']["emergency_category"] | null,"ai_suggested_priority"?: string | null,"audio_duration_ms"?: number | null,"audio_path"?: string | null,"audio_permission_state"?: string | null,"category": Database["public"]['Enums']["emergency_category"],"category_confirmed"?: boolean,"client_request_id": string,"created_at"?: string,"description": string,"id"?: string,"location"?: unknown,"location_accuracy_m"?: number | null,"location_is_approximate"?: boolean,"location_text"?: string | null,"reference": string,"reporter_id"?: string | null,"reporting_mode": Database["public"]['Enums']["reporting_mode"],"status"?: Database["public"]['Enums']["case_status"],"updated_at"?: string
                  }
                  Update: {
                    "ai_confidence"?: number | null,"ai_suggested_category"?: Database["public"]['Enums']["emergency_category"] | null,"ai_suggested_priority"?: string | null,"audio_duration_ms"?: number | null,"audio_path"?: string | null,"audio_permission_state"?: string | null,"category"?: Database["public"]['Enums']["emergency_category"],"category_confirmed"?: boolean,"client_request_id"?: string,"created_at"?: string,"description"?: string,"id"?: string,"location"?: unknown,"location_accuracy_m"?: number | null,"location_is_approximate"?: boolean,"location_text"?: string | null,"reference"?: string,"reporter_id"?: string | null,"reporting_mode"?: Database["public"]['Enums']["reporting_mode"],"status"?: Database["public"]['Enums']["case_status"],"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "incidents_reporter_id_fkey"
      columns: ["reporter_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"profiles": {
                  Row: {
                    "created_at": string,"full_name": string | null,"id": string,"phone": string | null,"role": Database["public"]['Enums']["user_role"]
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"full_name"?: string | null,"id": string,"phone"?: string | null,"role"?: Database["public"]['Enums']["user_role"]
                  }
                  Update: {
                    "created_at"?: string,"full_name"?: string | null,"id"?: string,"phone"?: string | null,"role"?: Database["public"]['Enums']["user_role"]
                  }
                  Relationships: [
                    
                  ]
                },"responders": {
                  Row: {
                    "category": Database["public"]['Enums']["emergency_category"],"contact_channel": string,"created_at": string,"id": string,"is_active": boolean,"last_verified_at": string | null,"organisation_name": string,"profile_id": string | null,"radius_m": number | null,"service_area": unknown,"service_point": unknown,"verified": boolean
                  }
                  ComputedFields: never
                  Insert: {
                    "category": Database["public"]['Enums']["emergency_category"],"contact_channel": string,"created_at"?: string,"id"?: string,"is_active"?: boolean,"last_verified_at"?: string | null,"organisation_name": string,"profile_id"?: string | null,"radius_m"?: number | null,"service_area"?: unknown,"service_point"?: unknown,"verified"?: boolean
                  }
                  Update: {
                    "category"?: Database["public"]['Enums']["emergency_category"],"contact_channel"?: string,"created_at"?: string,"id"?: string,"is_active"?: boolean,"last_verified_at"?: string | null,"organisation_name"?: string,"profile_id"?: string | null,"radius_m"?: number | null,"service_area"?: unknown,"service_point"?: unknown,"verified"?: boolean
                  }
                  Relationships: [
                    {
      foreignKeyName: "responders_profile_id_fkey"
      columns: ["profile_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"status_history": {
                  Row: {
                    "actor_id": string | null,"actor_role": Database["public"]['Enums']["user_role"] | null,"created_at": string,"id": number,"incident_id": string,"new_status": Database["public"]['Enums']["case_status"],"note": string | null,"old_status": Database["public"]['Enums']["case_status"] | null
                  }
                  ComputedFields: never
                  Insert: {
                    "actor_id"?: string | null,"actor_role"?: Database["public"]['Enums']["user_role"] | null,"created_at"?: string,"id"?: number,"incident_id": string,"new_status": Database["public"]['Enums']["case_status"],"note"?: string | null,"old_status"?: Database["public"]['Enums']["case_status"] | null
                  }
                  Update: {
                    "actor_id"?: string | null,"actor_role"?: Database["public"]['Enums']["user_role"] | null,"created_at"?: string,"id"?: number,"incident_id"?: string,"new_status"?: Database["public"]['Enums']["case_status"],"note"?: string | null,"old_status"?: Database["public"]['Enums']["case_status"] | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "status_history_actor_id_fkey"
      columns: ["actor_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "status_history_incident_id_fkey"
      columns: ["incident_id"]
isOneToOne: false
      referencedRelation: "incidents"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "find_nearby_responders":
{ Args: { "p_incident_id": string }; Returns: {
              "category": Database["public"]['Enums']["emergency_category"],"contact_channel": string,"distance_m": number,"organisation_name": string,"responder_id": string
            }[]
                           },
"get_incident_coordinates":
{ Args: { "p_incident_id": string }; Returns: {
              "latitude": number,"longitude": number
            }[]
                           },
"is_valid_transition":
{ Args: { "from_s": Database["public"]['Enums']["case_status"],"to_s": Database["public"]['Enums']["case_status"] }; Returns: boolean
                           },
"transition_case_status":
{ Args: { "p_incident_id": string,"p_note"?: string,"p_to": Database["public"]['Enums']["case_status"] }; Returns: {
              "ai_confidence": number | null,
"ai_suggested_category": Database["public"]['Enums']["emergency_category"] | null,
"ai_suggested_priority": string | null,
"audio_duration_ms": number | null,
"audio_path": string | null,
"audio_permission_state": string | null,
"category": Database["public"]['Enums']["emergency_category"],
"category_confirmed": boolean,
"client_request_id": string,
"created_at": string,
"description": string,
"id": string,
"location": unknown,
"location_accuracy_m": number | null,
"location_is_approximate": boolean,
"location_text": string | null,
"reference": string,
"reporter_id": string | null,
"reporting_mode": Database["public"]['Enums']["reporting_mode"],
"status": Database["public"]['Enums']["case_status"],
"updated_at": string
            }
                          SetofOptions: {
        from: "*"
        to: "incidents"
        isOneToOne: true
        isSetofReturn: false
      } }
          }
          Enums: {
            "case_status": "submitted"|"under_review"|"assigned"|"accepted"|"in_progress"|"closed"|"unresolved_escalated","emergency_category": "human"|"animal_bird"|"fire_rescue","reporting_mode": "self"|"third_person","user_role": "reporter"|"responder"|"admin"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            "case_status": ["submitted", "under_review", "assigned", "accepted", "in_progress", "closed", "unresolved_escalated"],"emergency_category": ["human", "animal_bird", "fire_rescue"],"reporting_mode": ["self", "third_person"],"user_role": ["reporter", "responder", "admin"]
          }
        }
} as const
