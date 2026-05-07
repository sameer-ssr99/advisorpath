/* eslint-disable no-console */
const BASE = process.env.API_BASE || 'http://localhost:5000/api';

async function req(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, { headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }, ...options });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  if (!res.ok) throw new Error(`${path} failed: ${res.status} ${JSON.stringify(data)}`);
  return data;
}

async function main() {
  const student = await req('/auth/login', { method: 'POST', body: JSON.stringify({ email: 'student@advisorpath.edu', password: 'Password123!' }) });
  const advisor = await req('/auth/login', { method: 'POST', body: JSON.stringify({ email: 'advisor@advisorpath.edu', password: 'Password123!' }) });
  const admin = await req('/auth/login', { method: 'POST', body: JSON.stringify({ email: 'admin@advisorpath.edu', password: 'Password123!' }) });

  const plans = await req('/plans', { headers: { Authorization: `Bearer ${student.token}` } });
  const convs = await req('/conversations', { headers: { Authorization: `Bearer ${student.token}` } });
  const sessions = await req('/sessions', { headers: { Authorization: `Bearer ${student.token}` } });
  const advisorDash = await req('/advisor/dashboard', { headers: { Authorization: `Bearer ${advisor.token}` } });
  const adminDash = await req('/admin/dashboard', { headers: { Authorization: `Bearer ${admin.token}` } });

  console.log('Smoke checks passed');
  console.log({ plans: plans.plans.length, conversations: convs.conversations.length, sessions: sessions.sessions.length, advisees: advisorDash.data.advisees.length, users: adminDash.stats.users });
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
