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
  console.log('--- Step 1: Register Test User ---');
  const email = `namer_tester_${Date.now()}@consistai.dev`;
  const reg = await request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Namer Tester',
      email,
      password: 'password123',
      role: 'student'
    })
  });

  assert.strictEqual(reg.status, 201, 'Registration must return 201');
  const cookie = reg.headers.get('set-cookie')?.split(';')[0];
  const token = reg.data.token;
  const authHeaders = {
    ...(cookie ? { Cookie: cookie } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
  console.log('✔ Authenticated test user session created');

  console.log('\n--- Step 2: Create Test Goal ---');
  const createGoalRes = await request('/api/goals', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      title: 'Master DSA Algorithms',
      category: 'DSA & Coding',
      startDate: new Date().toISOString(),
      targetDate: new Date(Date.now() + 30 * 86400000).toISOString(),
      priority: 'high',
      progressTrackingMethod: 'milestone_based'
    })
  });

  assert.strictEqual(createGoalRes.status, 201, 'Goal creation must return 201');
  const goal = createGoalRes.data.goal || createGoalRes.data.data;
  const goalId = goal._id;
  console.log(`✔ Created Goal: ${goal.title} (${goalId})`);

  console.log('\n--- Step 3: Create Milestone with Custom Module Names ---');
  const customNames = [
    'Module 01: Two Sum & Hash Lookup',
    'Module 02: Prefix Sum Basics',
    'Module 03: Subarray Sum Equals K',
    'Module 04: Two Pointers: Sorted Pair',
    'Module 05: Container With Most Water'
  ];

  const createMilestoneRes = await request(`/api/goals/${goalId}/goal-milestones`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      title: 'Arrays & Sliding Window',
      description: 'Foundations of arrays',
      weight: 1.5,
      moduleNames: customNames
    })
  });

  assert.strictEqual(createMilestoneRes.status, 201, 'Milestone creation must return 201');
  const milestone = createMilestoneRes.data.milestone;
  console.log(`✔ Milestone created: "${milestone.title}" (ID: ${milestone._id})`);
  assert.strictEqual(milestone.moduleCount, 5, 'Milestone must have moduleCount: 5');

  console.log('\n--- Step 4: Verify Modules Created with Exact Names ---');
  const getModulesRes = await request(`/api/goal-milestones/${milestone._id}/modules`, {
    headers: authHeaders
  });

  assert.strictEqual(getModulesRes.status, 200);
  const modules = getModulesRes.data.modules;
  assert.strictEqual(modules.length, 5, 'Must return 5 modules');
  console.log('✔ Verified 5 modules:');
  modules.forEach(m => console.log(`   [${m.order}] ${m.title} (completed: ${m.isCompleted})`));
  assert.strictEqual(modules[0].title, 'Module 01: Two Sum & Hash Lookup');
  assert.strictEqual(modules[4].title, 'Module 05: Container With Most Water');

  console.log('\n--- Step 5: Inline Rename Module 1 ---');
  const renameModule1Res = await request(`/api/goal-modules/${modules[0]._id}`, {
    method: 'PATCH',
    headers: authHeaders,
    body: JSON.stringify({
      title: 'Module 01: Two Sum & Fast Hash Lookup (Mastered)'
    })
  });

  assert.strictEqual(renameModule1Res.status, 200, 'Module patch must return 200');
  console.log(`✔ Inline renamed module: "${renameModule1Res.data.module.title}"`);
  assert.strictEqual(renameModule1Res.data.module.title, 'Module 01: Two Sum & Fast Hash Lookup (Mastered)');

  console.log('\n--- Step 6: Batch Rename Milestone Modules (Paste Mode) ---');
  const bulkNewTitles = [
    '01: Arrays Introduction',
    '02: Sliding Window Pattern',
    '03: Prefix Sum Tricks',
    '04: Two Pointers Classic',
    '05: Rain Water Trapping'
  ];

  const batchRenameRes = await request(`/api/goal-milestones/${milestone._id}/modules/rename`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      modules: bulkNewTitles
    })
  });

  assert.strictEqual(batchRenameRes.status, 200, 'Batch rename must return 200');
  assert.strictEqual(batchRenameRes.data.success, true);
  console.log(`✔ Batch renamed ${batchRenameRes.data.count} modules successfully`);

  console.log('\n--- Step 7: Verify Batch Renamed Titles in Database ---');
  const getUpdatedModulesRes = await request(`/api/goal-milestones/${milestone._id}/modules`, {
    headers: authHeaders
  });
  const updatedModules = getUpdatedModulesRes.data.modules;
  updatedModules.forEach(m => console.log(`   [${m.order}] ${m.title}`));
  assert.strictEqual(updatedModules[0].title, '01: Arrays Introduction');
  assert.strictEqual(updatedModules[4].title, '05: Rain Water Trapping');

  console.log('\n--- Step 8: Row-by-Row Object Array Rename ---');
  const objectRenamePayload = [
    { id: updatedModules[0]._id, title: 'Module 01: Hash Maps' },
    { id: updatedModules[1]._id, title: 'Module 02: Window Expansion' }
  ];

  const rowRenameRes = await request(`/api/goal-milestones/${milestone._id}/modules/rename`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      modules: objectRenamePayload
    })
  });
  assert.strictEqual(rowRenameRes.status, 200);

  const finalCheckRes = await request(`/api/goal-milestones/${milestone._id}/modules`, {
    headers: authHeaders
  });
  assert.strictEqual(finalCheckRes.data.modules[0].title, 'Module 01: Hash Maps');
  assert.strictEqual(finalCheckRes.data.modules[1].title, 'Module 02: Window Expansion');
  console.log('✔ Row-by-row object rename verified');

  console.log('\n--- Step 9: Cleanup Test Goal ---');
  const deleteRes = await request(`/api/goals/${goalId}`, {
    method: 'DELETE',
    headers: authHeaders
  });
  assert.strictEqual(deleteRes.status, 200);
  console.log('✔ Cleaned up test goal');

  console.log('\n=== ALL MODULE NAMING & RENAMING TESTS PASSED PERFECTLY ===');
}

run().catch(err => {
  console.error('\n❌ FAILED:', err);
  process.exit(1);
});
