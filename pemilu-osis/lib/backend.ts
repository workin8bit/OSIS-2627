// ============================================================================
// Adapter backend:
//  * Jika NEXT_PUBLIC_SUPABASE_URL + ANON_KEY tersedia  -> Supabase sungguhan
//  * Jika belum di-set                                   -> mode demo (localStorage)
// ============================================================================

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { demo } from "./demo";
import type {
  AdminStats,
  Candidate,
  CandidateInput,
  NewVoter,
  ResultRow,
  SettingsPatch,
  Status,
  Tally,
  VoterInfo,
  VoterRow,
} from "./types";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isDemoMode = !SUPABASE_URL || !SUPABASE_ANON_KEY;

let client: SupabaseClient | null = null;
function sb(): SupabaseClient {
  if (!client) {
    client = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!);
  }
  return client;
}

function friendly(e: unknown): Error {
  const msg = e instanceof Error ? e.message : String(e);
  if (/unauthorized/i.test(msg)) return new Error("Kunci admin salah.");
  if (/duplicate key/i.test(msg)) return new Error("Data sudah ada (NIS/numur urut duplikat).");
  return e instanceof Error ? e : new Error(msg);
}

export const api = {
  isDemo: isDemoMode,

  // ------------------------------ PUBLIK -----------------------------------

  async getStatus(): Promise<Status> {
    if (isDemoMode) return demo.getStatus();
    const { data, error } = await sb().rpc("get_status");
    if (error) throw friendly(error);
    return data as Status;
  },

  async listCandidates(): Promise<Candidate[]> {
    if (isDemoMode) return demo.listCandidates();
    const { data, error } = await sb()
      .from("candidates")
      .select("*")
      .order("number");
    if (error) throw friendly(error);
    return (data ?? []) as Candidate[];
  },

  async checkVoter(nis: string, password: string): Promise<VoterInfo | null> {
    if (isDemoMode) return demo.checkVoter(nis, password);
    const { data, error } = await sb().rpc("check_voter", {
      p_nis: nis,
      p_password: password,
    });
    if (error) throw friendly(error);
    const rows = (data ?? []) as VoterInfo[];
    return rows.length ? rows[0] : null;
  },

  async castVote(
    nis: string,
    password: string,
    candidateId: string
  ): Promise<string> {
    if (isDemoMode) return demo.castVote(nis, password, candidateId);
    const { data, error } = await sb().rpc("cast_vote", {
      p_nis: nis,
      p_password: password,
      p_candidate_id: candidateId,
    });
    if (error) throw friendly(error);
    return data as string;
  },

  async getResults(): Promise<ResultRow[]> {
    if (isDemoMode) return demo.getResults();
    const { data, error } = await sb().rpc("get_results");
    if (error) throw friendly(error);
    return (data ?? []) as ResultRow[];
  },

  async getTally(): Promise<Tally> {
    if (isDemoMode) return demo.getTally();
    const { data, error } = await sb().rpc("get_tally");
    if (error) throw friendly(error);
    const rows = (data ?? []) as Tally[];
    return rows.length
      ? rows[0]
      : { total_voters: 0, total_votes: 0 };
  },

  // ------------------------------ ADMIN ------------------------------------

  async adminStats(key: string): Promise<AdminStats> {
    if (isDemoMode) return demo.adminStats(key);
    const { data, error } = await sb().rpc("admin_stats", { p_key: key });
    if (error) throw friendly(error);
    return data as AdminStats;
  },

  async adminResults(key: string): Promise<ResultRow[]> {
    if (isDemoMode) return demo.adminResults(key);
    const { data, error } = await sb().rpc("admin_results", { p_key: key });
    if (error) throw friendly(error);
    return (data ?? []) as ResultRow[];
  },

  async adminListVoters(key: string): Promise<VoterRow[]> {
    if (isDemoMode) return demo.adminListVoters(key);
    const { data, error } = await sb().rpc("admin_list_voters", { p_key: key });
    if (error) throw friendly(error);
    return (data ?? []) as VoterRow[];
  },

  async adminSetSettings(key: string, patch: SettingsPatch): Promise<void> {
    if (isDemoMode) return demo.adminSetSettings(key, patch);
    const args: Record<string, unknown> = { p_key: key };
    if (patch.school_name != null) args.p_school_name = patch.school_name;
    if (patch.election_name != null) args.p_election_name = patch.election_name;
    if (patch.academic_year != null) args.p_academic_year = patch.academic_year;
    // "CLEAR" = kosongkan periode, ISO = set periode, undefined = tidak diubah
    if (patch.start_at != null) args.p_start_at = patch.start_at;
    if (patch.end_at != null) args.p_end_at = patch.end_at;
    if (patch.is_open != null) args.p_is_open = patch.is_open;
    if (patch.show_results != null) args.p_show_results = patch.show_results;
    const { error } = await sb().rpc("admin_set_settings", args);
    if (error) throw friendly(error);
  },

  async adminUpsertCandidate(key: string, data: CandidateInput): Promise<string> {
    if (isDemoMode) return demo.adminUpsertCandidate(key, data);
    const { data: id, error } = await sb().rpc("admin_upsert_candidate", {
      p_key: key,
      p_id: data.id ?? null,
      p_number: data.number,
      p_name: data.name,
      p_class_name: data.class_name,
      p_photo_url: data.photo_url || null,
      p_slogan: data.slogan || null,
      p_vision: data.vision,
      p_mission: data.mission,
      p_is_active: data.is_active,
    });
    if (error) throw friendly(error);
    return id as string;
  },

  async adminDeleteCandidate(key: string, id: string): Promise<void> {
    if (isDemoMode) return demo.adminDeleteCandidate(key, id);
    const { error } = await sb().rpc("admin_delete_candidate", {
      p_key: key,
      p_id: id,
    });
    if (error) throw friendly(error);
  },

  async adminAddVoters(key: string, rows: NewVoter[]): Promise<number> {
    if (isDemoMode) return demo.adminAddVoters(key, rows);
    const { data, error } = await sb().rpc("admin_add_voters", {
      p_key: key,
      p_rows: rows,
    });
    if (error) throw friendly(error);
    return Number(data ?? 0);
  },

  async adminRemoveVoter(key: string, nis: string): Promise<void> {
    if (isDemoMode) return demo.adminRemoveVoter(key, nis);
    const { error } = await sb().rpc("admin_remove_voter", {
      p_key: key,
      p_nis: nis,
    });
    if (error) throw friendly(error);
  },

  async adminResetVote(key: string, nis: string): Promise<void> {
    if (isDemoMode) return demo.adminResetVote(key, nis);
    const { error } = await sb().rpc("admin_reset_vote", { p_key: key, p_nis: nis });
    if (error) throw friendly(error);
  },

  async adminResetVotes(key: string): Promise<void> {
    if (isDemoMode) return demo.adminResetVotes(key);
    const { error } = await sb().rpc("admin_reset_votes", { p_key: key });
    if (error) throw friendly(error);
  },

  async adminSetAdminPassword(key: string, newKey: string): Promise<void> {
    if (isDemoMode) return demo.adminSetAdminPassword(key, newKey);
    const { error } = await sb().rpc("admin_set_admin_password", {
      p_key: key,
      p_new: newKey,
    });
    if (error) throw friendly(error);
  },

  // Reset data demo (hanya mode demo)
  async resetDemo(): Promise<void> {
    if (!isDemoMode)
      throw new Error("Reset data demo hanya tersedia di mode demo.");
    return demo.resetAll();
  },
};
