// ============================================================================
// MODE DEMO — backend tiruan berbasis localStorage.
// Aktif otomatis saat NEXT_PUBLIC_SUPABASE_URL belum di-set.
// Semua data hanya hidup di browser ini (untuk uji coba alur aplikasi).
// ============================================================================

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

const KEY = "osis_demo_db_v1";

interface DemoSettings {
  school_name: string;
  election_name: string;
  academic_year: string;
  start_at: string | null;
  end_at: string | null;
  is_open: boolean;
  show_results: boolean;
  admin_password: string;
}

interface DemoVoter extends VoterRow {
  id: string;
  password: string;
}

interface DemoVote {
  id: number;
  candidate_id: string;
  voter_id: string;
  voted_at: string;
}

interface DemoDB {
  settings: DemoSettings;
  candidates: Candidate[];
  voters: DemoVoter[];
  votes: DemoVote[];
}

const NAMES = [
  "Ahmad Fauzi", "Dewi Lestari", "Rizky Hidayat", "Nur Aini",
  "Fajar Ramadhan", "Putri Ayu Lestari", "Dimas Anggara", "Rina Melati",
  "Hendra Wijaya", "Salsabila Zahra", "Ikbal Firmansyah", "Laila Mardhiah",
  "Yusuf Hakim", "Anisa Fitriani", "Galih Pambudi", "Tiara Salsabila",
  "Reza Pahlevi", "Nadia Kusuma", "Fikri Ramadhan", "Amanda Puspita",
  "Bagas Prakoso", "Citra Ayuningtyas", "Eko Nugroho", "Intan Permata",
];

const CLASSES = ["XII IPA 1", "XII IPA 2", "XII IPA 3", "XII IPS 1"];

function seed(): DemoDB {
  const now = Date.now();
  const c1 = "cand-001";
  const c2 = "cand-002";
  const c3 = "cand-003";
  const voters: DemoVoter[] = NAMES.map((name, i) => ({
    id: `voter-${String(i + 1).padStart(3, "0")}`,
    nis: `2025${String(i + 1).padStart(3, "0")}`,
    name,
    class_name: CLASSES[i % CLASSES.length],
    password: "siswa123",
    has_voted: false,
  }));
  // 9 pemilih pertama sudah vote (agar halaman hasil tidak kosong)
  const votes: DemoVote[] = [];
  const picks = [c1, c1, c1, c1, c2, c2, c2, c3, c3];
  picks.forEach((candidate_id, i) => {
    voters[i].has_voted = true;
    votes.push({
      id: i + 1,
      candidate_id,
      voter_id: voters[i].id,
      voted_at: new Date(now - (picks.length - i) * 3600000).toISOString(),
    });
  });
  return {
    settings: {
      school_name: "SMA Negeri 1 Rembangan",
      election_name: "Pemilihan Ketua OSIS",
      academic_year: "2026/2027",
      start_at: null,
      end_at: null,
      is_open: true,
      show_results: true,
      admin_password: "admin123",
    },
    candidates: [
      {
        id: c1,
        number: 1,
        name: "Andi Pratama",
        class_name: "XII IPA 1",
        photo_url: null,
        slogan: "Bersama Wujudkan OSIS yang Lebih Baik",
        vision:
          "Terwujudnya OSIS yang inovatif dan inklusif sebagai wadah aktualisasi diri seluruh siswa SMA Negeri 1 Rembangan.",
        mission:
          "- Membuka ruang kreativitas melalui festival seni, budaya, dan teknologi\n- Digitalisasi pengumuman dan administrasi OSIS\n- Menampung aspirasi siswa melalui kotak saran digital\n- Menjalin kerja sama dengan komunitas pelajar se-Rembangan",
        is_active: true,
      },
      {
        id: c2,
        number: 2,
        name: "Siti Rahmawati",
        class_name: "XII IPA 2",
        photo_url: null,
        slogan: "Kreatif, Kolaboratif, Berkarakter",
        vision:
          "OSIS menjadi rumah kedua yang membina karakter, mengasah potensi, dan mempererat kebersamaan seluruh warga sekolah.",
        mission:
          "- Program mentoring antarangkatan dan buddy system\n- Penguatan kegiatan keagamaan dan pembiasaan akhlak\n- Lomba intra-kelas setiap semester untuk menyatukan kelas\n- Publikasi prestasi siswa di media sosial sekolah",
        is_active: true,
      },
      {
        id: c3,
        number: 3,
        name: "Budi Santoso",
        class_name: "XII IPS 1",
        photo_url: null,
        slogan: "Suaramu, Wujudkan!",
        vision:
          "Setiap aspirasi siswa menjadi nyata melalui program kerja OSIS yang transparan dan berbasis kebutuhan siswa.",
        mission:
          "- Survei kebutuhan siswa awal periode sebagai dasar progker\n- Transparansi anggaran dan laporan kegiatan bulanan\n- Revitalisasi fasilitas olahraga dan taman baca\n- Forum rutin siswa-pengurus untuk menampung kritik & saran",
        is_active: true,
      },
    ],
    voters,
    votes,
  };
}

function load(): DemoDB {
  if (typeof window === "undefined") return seed();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as DemoDB;
  } catch {
    /* rusak -> seed ulang */
  }
  const db = seed();
  save(db);
  return db;
}

function save(db: DemoDB) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(db));
}

const delay = () => new Promise((r) => setTimeout(r, 120));

function requireAdmin(db: DemoDB, key: string) {
  if (key !== db.settings.admin_password) throw new Error("Unauthorized");
}

function publicStatus(db: DemoDB): Status {
  const s = db.settings;
  return {
    school_name: s.school_name,
    election_name: s.election_name,
    academic_year: s.academic_year,
    start_at: s.start_at,
    end_at: s.end_at,
    is_open: s.is_open,
    show_results: s.show_results,
  };
}

export const demo = {
  async getStatus(): Promise<Status> {
    await delay();
    return publicStatus(load());
  },

  async listCandidates(): Promise<Candidate[]> {
    await delay();
    return [...load().candidates].sort((a, b) => a.number - b.number);
  },

  async checkVoter(nis: string, password: string): Promise<VoterInfo | null> {
    await delay();
    const v = load().voters.find(
      (x) => x.nis === nis.trim() && x.password === password
    );
    if (!v) return null;
    return { name: v.name, class_name: v.class_name, has_voted: v.has_voted };
  },

  async castVote(
    nis: string,
    password: string,
    candidateId: string
  ): Promise<string> {
    await delay();
    const db = load();
    const s = db.settings;
    if (!s.is_open) return "error:Voting belum dibuka atau sudah ditutup.";
    const now = Date.now();
    if (s.start_at && now < new Date(s.start_at).getTime())
      return "error:Voting belum dimulai.";
    if (s.end_at && now > new Date(s.end_at).getTime())
      return "error:Voting sudah ditutup.";
    const v = db.voters.find((x) => x.nis === nis.trim());
    if (!v) return "error:NIS tidak terdaftar.";
    if (v.password !== password) return "error:Password salah.";
    if (v.has_voted) return "error:Kamu sudah melakukan voting.";
    const c = db.candidates.find((x) => x.id === candidateId && x.is_active);
    if (!c) return "error:Candidat tidak ditemukan.";
    db.votes.push({
      id: db.votes.length + 1,
      candidate_id: candidateId,
      voter_id: v.id,
      voted_at: new Date().toISOString(),
    });
    v.has_voted = true;
    save(db);
    return "ok";
  },

  async getResults(): Promise<ResultRow[]> {
    await delay();
    const db = load();
    if (!db.settings.show_results) return [];
    return db.candidates
      .filter((c) => c.is_active)
      .map((c) => ({
        candidate_id: c.id,
        candidate_number: c.number,
        candidate_name: c.name,
        total: db.votes.filter((v) => v.candidate_id === c.id).length,
      }))
      .sort((a, b) => a.candidate_number - b.candidate_number);
  },

  async getTally(): Promise<Tally> {
    await delay();
    const db = load();
    if (!db.settings.show_results)
      return { total_voters: 0, total_votes: 0 };
    return { total_voters: db.voters.length, total_votes: db.votes.length };
  },

  // ------------------------------ ADMIN -----------------------------------

  async adminStats(key: string): Promise<AdminStats> {
    await delay();
    const db = load();
    requireAdmin(db, key);
    return {
      total_voters: db.voters.length,
      total_votes: db.votes.length,
      voted: db.voters.filter((v) => v.has_voted).length,
      candidates: db.candidates.filter((c) => c.is_active).length,
    };
  },

  async adminResults(key: string): Promise<ResultRow[]> {
    await delay();
    const db = load();
    requireAdmin(db, key);
    return db.candidates.map((c) => ({
      candidate_id: c.id,
      candidate_number: c.number,
      candidate_name: c.name,
      total: db.votes.filter((v) => v.candidate_id === c.id).length,
    })).sort((a, b) => a.candidate_number - b.candidate_number);
  },

  async adminListVoters(key: string): Promise<VoterRow[]> {
    await delay();
    const db = load();
    requireAdmin(db, key);
    return [...db.voters]
      .sort((a, b) => a.nis.localeCompare(b.nis))
      .map(({ nis, name, class_name, has_voted }) => ({
        nis,
        name,
        class_name,
        has_voted,
      }));
  },

  async adminSetSettings(key: string, patch: SettingsPatch): Promise<void> {
    await delay();
    const db = load();
    requireAdmin(db, key);
    const s = db.settings;
    if (patch.school_name != null) s.school_name = patch.school_name;
    if (patch.election_name != null) s.election_name = patch.election_name;
    if (patch.academic_year != null) s.academic_year = patch.academic_year;
    if (patch.start_at === "CLEAR") s.start_at = null;
    else if (patch.start_at) s.start_at = patch.start_at;
    if (patch.end_at === "CLEAR") s.end_at = null;
    else if (patch.end_at) s.end_at = patch.end_at;
    if (patch.is_open != null) s.is_open = patch.is_open;
    if (patch.show_results != null) s.show_results = patch.show_results;
    save(db);
  },

  async adminUpsertCandidate(
    key: string,
    data: CandidateInput
  ): Promise<string> {
    await delay();
    const db = load();
    requireAdmin(db, key);
    const dup = db.candidates.find(
      (c) => c.number === data.number && c.id !== data.id
    );
    if (dup) throw new Error("Nomor urut sudah dipakai kandidat lain.");
    if (data.id) {
      const c = db.candidates.find((x) => x.id === data.id);
      if (!c) throw new Error("Candidat tidak ditemukan.");
      Object.assign(c, {
        number: data.number,
        name: data.name,
        class_name: data.class_name,
        photo_url: data.photo_url || c.photo_url,
        slogan: data.slogan || c.slogan,
        vision: data.vision,
        mission: data.mission,
        is_active: data.is_active,
      });
      save(db);
      return c.id;
    }
    const id = `cand-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    db.candidates.push({ id, ...data, photo_url: data.photo_url || null });
    save(db);
    return id;
  },

  async adminDeleteCandidate(key: string, id: string): Promise<void> {
    await delay();
    const db = load();
    requireAdmin(db, key);
    const affected = new Set(
      db.votes.filter((v) => v.candidate_id === id).map((v) => v.voter_id)
    );
    db.candidates = db.candidates.filter((c) => c.id !== id);
    db.votes = db.votes.filter((v) => v.candidate_id !== id);
    db.voters.forEach((v) => {
      if (affected.has(v.id)) v.has_voted = false;
    });
    save(db);
  },

  async adminAddVoters(key: string, rows: NewVoter[]): Promise<number> {
    await delay();
    const db = load();
    requireAdmin(db, key);
    let n = 0;
    for (const r of rows) {
      if (!/^\d+$/.test(r.nis) || !r.name) continue;
      const existing = db.voters.find((v) => v.nis === r.nis);
      if (existing) {
        existing.name = r.name;
        existing.class_name = r.class_name;
        existing.password = r.password;
      } else {
        db.voters.push({
          id: `voter-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          nis: r.nis,
          name: r.name,
          class_name: r.class_name,
          password: r.password,
          has_voted: false,
        });
      }
      n++;
    }
    save(db);
    return n;
  },

  async adminRemoveVoter(key: string, nis: string): Promise<void> {
    await delay();
    const db = load();
    requireAdmin(db, key);
    const v = db.voters.find((x) => x.nis === nis);
    if (!v) return;
    db.votes = db.votes.filter((x) => x.voter_id !== v.id);
    db.voters = db.voters.filter((x) => x.nis !== nis);
    save(db);
  },

  async adminResetVote(key: string, nis: string): Promise<void> {
    await delay();
    const db = load();
    requireAdmin(db, key);
    const v = db.voters.find((x) => x.nis === nis);
    if (!v) return;
    db.votes = db.votes.filter((x) => x.voter_id !== v.id);
    v.has_voted = false;
    save(db);
  },

  async adminResetVotes(key: string): Promise<void> {
    await delay();
    const db = load();
    requireAdmin(db, key);
    db.votes = [];
    db.voters = db.voters.map((v) => ({ ...v, has_voted: false }));
    save(db);
  },

  async adminSetAdminPassword(key: string, newKey: string): Promise<void> {
    await delay();
    const db = load();
    requireAdmin(db, key);
    if (newKey.length < 4) throw new Error("Password baru minimal 4 karakter.");
    db.settings.admin_password = newKey;
    save(db);
  },

  async resetAll(): Promise<void> {
    await delay();
    save(seed());
  },
};
