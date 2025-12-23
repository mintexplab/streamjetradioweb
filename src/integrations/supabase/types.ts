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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      active_listeners: {
        Row: {
          id: string
          last_heartbeat: string
          started_at: string
          station_name: string
          station_uuid: string
          user_id: string
        }
        Insert: {
          id?: string
          last_heartbeat?: string
          started_at?: string
          station_name: string
          station_uuid: string
          user_id: string
        }
        Update: {
          id?: string
          last_heartbeat?: string
          started_at?: string
          station_name?: string
          station_uuid?: string
          user_id?: string
        }
        Relationships: []
      }
      favorite_artists: {
        Row: {
          artist_id: string
          artist_image: string | null
          artist_name: string
          created_at: string
          id: string
          position: number
          user_id: string
        }
        Insert: {
          artist_id: string
          artist_image?: string | null
          artist_name: string
          created_at?: string
          id?: string
          position?: number
          user_id: string
        }
        Update: {
          artist_id?: string
          artist_image?: string | null
          artist_name?: string
          created_at?: string
          id?: string
          position?: number
          user_id?: string
        }
        Relationships: []
      }
      favorite_tracks: {
        Row: {
          album_name: string | null
          artist_name: string
          created_at: string
          id: string
          position: number
          track_id: string
          track_image: string | null
          track_name: string
          user_id: string
        }
        Insert: {
          album_name?: string | null
          artist_name: string
          created_at?: string
          id?: string
          position?: number
          track_id: string
          track_image?: string | null
          track_name: string
          user_id: string
        }
        Update: {
          album_name?: string | null
          artist_name?: string
          created_at?: string
          id?: string
          position?: number
          track_id?: string
          track_image?: string | null
          track_name?: string
          user_id?: string
        }
        Relationships: []
      }
      friendships: {
        Row: {
          addressee_id: string
          created_at: string
          id: string
          requester_id: string
          status: string
          updated_at: string
        }
        Insert: {
          addressee_id: string
          created_at?: string
          id?: string
          requester_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          addressee_id?: string
          created_at?: string
          id?: string
          requester_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      listening_sessions: {
        Row: {
          duration_seconds: number | null
          ended_at: string | null
          id: string
          started_at: string
          station_name: string
          station_uuid: string
          user_id: string
        }
        Insert: {
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          started_at?: string
          station_name: string
          station_uuid: string
          user_id: string
        }
        Update: {
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          started_at?: string
          station_name?: string
          station_uuid?: string
          user_id?: string
        }
        Relationships: []
      }
      neighborhoods: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          vibe_tags: string[] | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          vibe_tags?: string[] | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          vibe_tags?: string[] | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          data: Json | null
          id: string
          message: string | null
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json | null
          id?: string
          message?: string | null
          read?: boolean
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json | null
          id?: string
          message?: string | null
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      pinned_stations: {
        Row: {
          id: string
          is_go_to: boolean | null
          pinned_at: string
          station_country: string | null
          station_favicon: string | null
          station_name: string
          station_tags: string | null
          station_url: string
          station_uuid: string
          user_id: string
        }
        Insert: {
          id?: string
          is_go_to?: boolean | null
          pinned_at?: string
          station_country?: string | null
          station_favicon?: string | null
          station_name: string
          station_tags?: string | null
          station_url: string
          station_uuid: string
          user_id: string
        }
        Update: {
          id?: string
          is_go_to?: boolean | null
          pinned_at?: string
          station_country?: string | null
          station_favicon?: string | null
          station_name?: string
          station_tags?: string | null
          station_url?: string
          station_uuid?: string
          user_id?: string
        }
        Relationships: []
      }
      posts: {
        Row: {
          content: string
          created_at: string
          id: string
          station_name: string | null
          station_uuid: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          station_name?: string | null
          station_uuid?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          station_name?: string | null
          station_uuid?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          ban_reason: string | null
          banned_at: string | null
          bio: string | null
          created_at: string
          display_name: string | null
          id: string
          is_banned: boolean
          is_verified: boolean
          updated_at: string
          user_id: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          ban_reason?: string | null
          banned_at?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          is_banned?: boolean
          is_verified?: boolean
          updated_at?: string
          user_id: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          ban_reason?: string | null
          banned_at?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          is_banned?: boolean
          is_verified?: boolean
          updated_at?: string
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      saved_stations: {
        Row: {
          created_at: string
          id: string
          station_bitrate: number | null
          station_codec: string | null
          station_country: string | null
          station_favicon: string | null
          station_name: string
          station_tags: string | null
          station_url: string
          station_uuid: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          station_bitrate?: number | null
          station_codec?: string | null
          station_country?: string | null
          station_favicon?: string | null
          station_name: string
          station_tags?: string | null
          station_url: string
          station_uuid: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          station_bitrate?: number | null
          station_codec?: string | null
          station_country?: string | null
          station_favicon?: string | null
          station_name?: string
          station_tags?: string | null
          station_url?: string
          station_uuid?: string
          user_id?: string
        }
        Relationships: []
      }
      station_chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          station_name: string
          station_uuid: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          station_name: string
          station_uuid: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          station_name?: string
          station_uuid?: string
          user_id?: string
        }
        Relationships: []
      }
      station_moments: {
        Row: {
          created_at: string
          created_by: string
          expires_at: string
          id: string
          moment_name: string
          station_name: string
          station_uuid: string
        }
        Insert: {
          created_at?: string
          created_by: string
          expires_at?: string
          id?: string
          moment_name: string
          station_name: string
          station_uuid: string
        }
        Update: {
          created_at?: string
          created_by?: string
          expires_at?: string
          id?: string
          moment_name?: string
          station_name?: string
          station_uuid?: string
        }
        Relationships: []
      }
      station_reactions: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          reaction_type: Database["public"]["Enums"]["reaction_type"]
          station_name: string
          station_uuid: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string
          id?: string
          reaction_type: Database["public"]["Enums"]["reaction_type"]
          station_name: string
          station_uuid: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          reaction_type?: Database["public"]["Enums"]["reaction_type"]
          station_name?: string
          station_uuid?: string
          user_id?: string
        }
        Relationships: []
      }
      user_music_roles: {
        Row: {
          created_at: string
          id: string
          role_name: string
          role_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role_name: string
          role_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role_name?: string
          role_type?: string
          user_id?: string
        }
        Relationships: []
      }
      user_neighborhoods: {
        Row: {
          affinity_score: number | null
          id: string
          joined_at: string
          neighborhood_id: string
          user_id: string
        }
        Insert: {
          affinity_score?: number | null
          id?: string
          joined_at?: string
          neighborhood_id: string
          user_id: string
        }
        Update: {
          affinity_score?: number | null
          id?: string
          joined_at?: string
          neighborhood_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_neighborhoods_neighborhood_id_fkey"
            columns: ["neighborhood_id"]
            isOneToOne: false
            referencedRelation: "neighborhoods"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_station_stats: {
        Row: {
          created_at: string
          crying_count: number
          fire_count: number
          id: string
          last_listened_at: string | null
          sleep_count: number
          station_name: string
          station_uuid: string
          total_listen_time: number
          updated_at: string
          user_id: string
          wave_count: number
        }
        Insert: {
          created_at?: string
          crying_count?: number
          fire_count?: number
          id?: string
          last_listened_at?: string | null
          sleep_count?: number
          station_name: string
          station_uuid: string
          total_listen_time?: number
          updated_at?: string
          user_id: string
          wave_count?: number
        }
        Update: {
          created_at?: string
          crying_count?: number
          fire_count?: number
          id?: string
          last_listened_at?: string | null
          sleep_count?: number
          station_name?: string
          station_uuid?: string
          total_listen_time?: number
          updated_at?: string
          user_id?: string
          wave_count?: number
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
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      reaction_type: "fire" | "wave" | "crying" | "sleep"
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
      app_role: ["admin", "moderator", "user"],
      reaction_type: ["fire", "wave", "crying", "sleep"],
    },
  },
} as const
