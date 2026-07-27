export interface Child {
  id: string;
  user_id: string;
  name: string;
  birth_date: string;
  gender: 'L' | 'P';
  height_cm?: number;
  weight_kg?: number;
}

export interface ActivityLog {
  id?: string;
  child_id: string;
  activity_category: string; // e.g., 'Motorik Halus', 'Motorik Kasar'
  activity_name: string;
  duration_minutes: number;
  assistance_level: 'Independent' | 'Partial Support' | 'Full Support';
  focus_score: number; // 1 - 5
  notes?: string;
  image_url?: string;
  logged_at?: string;
}

export interface ActivityCategory {
  id: string;
  user_id: string;
  name: string;
  created_at?: string;
}