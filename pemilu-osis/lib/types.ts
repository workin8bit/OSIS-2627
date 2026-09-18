export interface Status {
  school_name: string;
  election_name: string;
  academic_year: string;
  start_at: string | null;
  end_at: string | null;
  is_open: boolean;
  show_results: boolean;
}

export interface Candidate {
  id: string;
  number: number;
  name: string;
  class_name: string;
  photo_url: string | null;
  slogan: string | null;
  vision: string;
  mission: string;
  is_active: boolean;
}

export interface VoterInfo {
  name: string;
  class_name: string;
  has_voted: boolean;
}

export interface VoterSession {
  nis: string;
  name: string;
  class_name: string;
  has_voted: boolean;
}

export interface VoterRow {
  nis: string;
  name: string;
  class_name: string;
  has_voted: boolean;
}

export interface ResultRow {
  candidate_id: string;
  candidate_number: number;
  candidate_name: string;
  total: number;
}

export interface Tally {
  total_voters: number;
  total_votes: number;
}

export interface AdminStats {
  total_voters: number;
  total_votes: number;
  voted: number;
  candidates: number;
}

export interface SettingsPatch {
  school_name?: string;
  election_name?: string;
  academic_year?: string;
  start_at?: string | null; // ISO string, null = tidak diubah, "CLEAR" = kosongkan
  end_at?: string | null;
  is_open?: boolean;
  show_results?: boolean;
}

export interface CandidateInput {
  id?: string;
  number: number;
  name: string;
  class_name: string;
  photo_url: string;
  slogan: string;
  vision: string;
  mission: string;
  is_active: boolean;
}

export interface NewVoter {
  nis: string;
  name: string;
  class_name: string;
  password: string;
}
