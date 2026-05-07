import api from '../api/axios';

export const getSessionsData = async () => {
  try {
    const res = await api.get('/sessions');
    return res.data.sessions;
  } catch (err) {
    console.error("Error fetching sessions:", err);
    return [];
  }
};

export const addSession = async (sessionDetails) => {
  try {
    const res = await api.post('/sessions', sessionDetails);
    return res.data.session;
  } catch (err) {
    console.error("Error creating session:", err);
    throw err;
  }
};

export const updateSessionStatus = async (sessionId, status) => {
  try {
    const res = await api.patch(`/sessions/${sessionId}/status`, { status });
    return res.data.session;
  } catch (err) {
    console.error("Error updating session:", err);
    throw err;
  }
};
