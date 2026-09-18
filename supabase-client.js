// Supabase Client Helper
const SUPABASE_URL = "https://rhmyqlxzuezmmjwbghfw.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJobXlxbHh6dWV6bW1qd2JnaGZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk2NzQyNjIsImV4cCI6MjEwNTI1MDI2Mn0.sqH8GbyZwqd1-5H7d3-f7hETvmzYBrZh_quh594F4QU";

window.supabaseClient = {
  url: SUPABASE_URL,
  key: SUPABASE_ANON_KEY,
  
  async request(endpoint, options = {}) {
    const url = `${this.url}/rest/v1/${endpoint}`;
    const headers = {
      'apikey': this.key,
      'Authorization': `Bearer ${this.key}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
      ...(options.headers || {})
    };

    try {
      const res = await fetch(url, { ...options, credentials: 'omit', headers });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: res.statusText }));
        throw err;
      }
      return await res.json().catch(() => null);
    } catch (e) {
      console.warn('Supabase fetch failed, falling back to local storage:', e);
      return null;
    }
  },

  // Candidates CRUD
  async getCandidates() {
    const data = await this.request('candidates?select=*&order=num.asc');
    return data;
  },

  async addCandidate(candidate) {
    const data = await this.request('candidates', {
      method: 'POST',
      body: JSON.stringify(candidate)
    });
    return data;
  },

  async updateCandidate(id, patch) {
    const data = await this.request(`candidates?id=eq.${id}`, {
      method: 'PATCH',
      body: JSON.stringify(patch)
    });
    return data;
  },

  async deleteCandidate(id) {
    const data = await this.request(`candidates?id=eq.${id}`, {
      method: 'DELETE'
    });
    return data;
  },

  // Voters CRUD
  async getVoters() {
    const data = await this.request('voters?select=*&order=nis.asc');
    return data;
  },

  async updateVoter(nis, patch) {
    const data = await this.request(`voters?nis=eq.${nis}`, {
      method: 'PATCH',
      body: JSON.stringify(patch)
    });
    return data;
  },

  async insertVoters(voters) {
    const data = await this.request('voters', {
      method: 'POST',
      headers: { 'Prefer': 'resolution=merge-duplicates' },
      body: JSON.stringify(voters)
    });
    return data;
  },

  // Voting
  async castVote(nis, candidateNum) {
    // 1. Catat vote
    await this.request('votes', {
      method: 'POST',
      body: JSON.stringify({ candidate_num: candidateNum })
    });
    // 2. Update voter status
    await this.request(`voters?nis=eq.${nis}`, {
      method: 'PATCH',
      body: JSON.stringify({ voted: true, voted_at: new Date().toISOString() })
    });
  }
};
