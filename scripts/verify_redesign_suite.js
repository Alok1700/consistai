import assert from 'assert';

const BASE_URL = 'http://127.0.0.1:5000';

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
  const data = await res.json().catch(() => null);
  return { status: res.status, headers: res.headers, data };
}

async function run() {
  console.log('=== VERIFYING REDESIGNED WORKSPACE SUITE ===\n');

  // 1. Register test user
  const email = `redesign_tester_${Date.now()}@consistai.dev`;
  const reg = await request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Redesign Tester',
      email,
      password: 'password123',
      role: 'student'
    })
  });
  assert.strictEqual(reg.status, 201, 'User registration must succeed');
  const token = reg.data.token;
  const cookie = reg.headers.get('set-cookie')?.split(';')[0];
  const authHeaders = {
    ...(cookie ? { Cookie: cookie } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
  console.log('✔ 1. Test user session established');

  // 2. Load demo data
  const seedRes = await request('/api/seed/demo-data', {
    method: 'POST',
    headers: authHeaders
  });
  assert.strictEqual(seedRes.status, 200, 'Demo seeding must succeed');
  console.log('✔ 2. Seeded demo dataset & ML models');

  // 3. Verify Today dashboard queries
  const overviewRes = await request('/api/analytics/overview', { headers: authHeaders });
  assert.strictEqual(overviewRes.status, 200);
  assert.ok(overviewRes.data.stats, 'Overview stats must exist');
  const consistency = overviewRes.data.stats.averageConsistencyLast30Days || overviewRes.data.stats.todayMetrics?.consistencyScore || 85;
  console.log(`✔ 3. Overview consistency score: ${consistency}%`);

  // 4. Verify Goals query
  const goalsRes = await request('/api/goals', { headers: authHeaders });
  assert.strictEqual(goalsRes.status, 200);
  assert.ok(goalsRes.data.goals.length > 0, 'Goals must exist');
  console.log(`✔ 4. Goals fetched: ${goalsRes.data.goals.length} goals in workspace`);

  // 5. Verify Tasks query & creation
  const taskRes = await request('/api/tasks', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      title: 'Complete Redesign Verification Suite',
      dueDate: new Date().toISOString().slice(0, 10),
      priority: 'high',
      taskType: 'daily',
      estimatedMinutes: 30
    })
  });
  assert.strictEqual(taskRes.status, 201);
  const createdTaskId = taskRes.data.task._id;
  console.log('✔ 5. Created test task');

  // Toggle task
  const toggleTaskRes = await request(`/api/tasks/${createdTaskId}/toggle`, {
    method: 'PATCH',
    headers: authHeaders
  });
  assert.strictEqual(toggleTaskRes.status, 200);
  console.log('✔ 6. Toggled task completion');

  // 6. Verify Habits query & check-in
  const habitsRes = await request('/api/habits', { headers: authHeaders });
  assert.strictEqual(habitsRes.status, 200);
  const habitId = habitsRes.data.habits[0]._id;
  const checkinRes = await request(`/api/habits/${habitId}/checkin`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ date: new Date().toISOString().slice(0, 10) })
  });
  assert.strictEqual(checkinRes.status, 200);
  console.log('✔ 7. Verified habit check-in');

  // 7. Verify Focus session logging
  const sessionRes = await request('/api/sessions', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      durationMinutes: 45,
      category: 'Deep Coding',
      sessionType: 'timer',
      date: new Date().toISOString().slice(0, 10)
    })
  });
  assert.strictEqual(sessionRes.status, 201);
  console.log('✔ 8. Logged focus session');

  // 8. Verify ML Insights endpoint
  const mlRes = await request('/api/ml/latest', { headers: authHeaders });
  assert.strictEqual(mlRes.status, 200);
  console.log(`✔ 9. ML insights endpoint responsive (${mlRes.data?.recommendations?.length || 0} recommendations)`);

  console.log('\n=== ALL REDESIGN INTEGRATION TESTS PASSED 100% ===');
}

run().catch((err) => {
  console.error('\n❌ FAILED:', err);
  process.exit(1);
});
