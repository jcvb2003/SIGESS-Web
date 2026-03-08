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
      [key: string]: {
        Row: {
          [key: string]: Json | undefined
        }
        Insert: {
          [key: string]: Json | undefined
        }
        Update: {
          [key: string]: Json | undefined
        }
        Relationships: []
      }
    }
    Views: {
      [_: string]: {
        Row: {
          [key: string]: Json | undefined
        }
        Insert: {
          [key: string]: Json | undefined
        }
        Update: {
          [key: string]: Json | undefined
        }
        Relationships: []
      }
    }
    Functions: {
      [_: string]: {
        Args: {
          [key: string]: Json | undefined
        }
        Returns: Json
      }
    }
    Enums: {
      [_: string]: string
    }
  }
}
