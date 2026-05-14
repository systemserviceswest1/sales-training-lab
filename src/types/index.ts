export type UserRole = 'master' | 'consultant';

export interface UserProfile {
  id: string;
  full_name: string | null;
  email: string | null;
  role: UserRole;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export type Gender = 'Male' | 'Female' | 'Other';
export type MaritalStatus = 'Single' | 'Married' | 'Other';

export interface StudentProfile {
  id: string;
  name: string;
  age: number;
  gender: Gender;
  destination: string;
  marital_status: MaritalStatus;
  personality: string;
  profession: string | null;
  avatar_url: string | null;
  ai_voice_tone: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Scenario {
  id: string;
  name: string;
  description: string;
  west1_expectation: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface RoleplaySession {
  id: string;
  user_id: string;
  student_profile_id: string | null;
  scenario_id: string | null;
  student_profile_snapshot: StudentProfile | null;
  scenario_snapshot: Scenario | null;
  transcript: string | null;
  score: number | null;
  feedback_positive: string | null;
  feedback_improvements: string | null;
  duration_seconds: number | null;
  completed_at: string | null;
  created_at: string;
  user_profile?: UserProfile;
}

export interface LeaderboardEntry {
  id: string;
  full_name: string | null;
  total_sessions: number;
  average_score: number;
  best_score: number | null;
}

export interface EvaluationResult {
  score: number;
  feedback: {
    positive_points: string;
    improvement_points: string;
  };
}
