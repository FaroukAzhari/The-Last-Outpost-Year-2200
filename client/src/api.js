const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {})
    },
    ...options
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.message || "Request failed.");
  }

  return payload;
}

export const api = {
  getPublicSettings() {
    return request("/settings/public");
  },
  getCrews() {
    return request("/crews");
  },
  getCrew(id) {
    return request(`/crews/${id}`);
  },
  updateCrewLight(id, delta) {
    return request(`/crews/${id}/light`, {
      method: "POST",
      body: JSON.stringify({ delta })
    });
  },
  updateCrewShadow(id, delta) {
    return request(`/crews/${id}/shadow`, {
      method: "POST",
      body: JSON.stringify({ delta })
    });
  },
  updateCrewRecovery(id, amount) {
    return request(`/crews/${id}/recovery`, {
      method: "POST",
      body: JSON.stringify({ amount })
    });
  },
  updateCrewNote(id, note) {
    return request(`/crews/${id}/note`, {
      method: "POST",
      body: JSON.stringify({ note })
    });
  },
  getMissions(crewId) {
    const query = crewId ? `?crewId=${crewId}` : "";
    return request(`/missions${query}`);
  },
  getMission(id, crewId) {
    const query = crewId ? `?crewId=${crewId}` : "";
    return request(`/missions/${id}${query}`);
  },
  submitMission(id, crewId, answer) {
    return request(`/missions/${id}/submit`, {
      method: "POST",
      body: JSON.stringify({ crewId, answer })
    });
  },
  getMembers() {
    return request("/members");
  },
  evaluateMember(id, body) {
    return request(`/members/${id}/evaluate`, {
      method: "POST",
      body: JSON.stringify(body)
    });
  },
  getReports() {
    return request("/reports");
  },
  setMostImproved(memberId) {
    return request("/reports/most-improved", {
      method: "POST",
      body: JSON.stringify({ memberId })
    });
  }
};
