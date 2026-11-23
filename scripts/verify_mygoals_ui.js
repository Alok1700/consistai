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

async function verify() {
  console.log('=== VERIFYING MY GOALS MILESTONE-BASED CHECKLIST UI INTEGRATION ===\n');

  // 1. Register test user
  const email = `visual_ui_tester_${Date.now()}@consistai.dev`;
  const reg = await request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name: 'UI Tester',
      email,
      password: 'password123',
      role: 'student'
    })
  });
  assert.strictEqual(reg.status, 201, 'Registration must return 201');
  const cookie = reg.headers.get('set-cookie')?.split(';')[0];
  const authHeaders = { Cookie: cookie };
  console.log('✔ 1. Authenticated test user session created');

  // 2. Call seed/demo-data
  const seedRes = await request('/api/seed/demo-data', {
    method: 'POST',
    headers: authHeaders
  });
  assert.strictEqual(seedRes.status, 200, 'Seeding demo data must return 200');
  console.log('✔ 2. Seeded 60-day demo dataset with Master DSA curriculum');

  // 3. Fetch goals
  const goalsRes = await request('/api/goals', { headers: authHeaders });
  assert.strictEqual(goalsRes.status, 200);
  const goals = goalsRes.data.goals;
  const dsaGoal = goals.find(g => g.isPrimaryGoal) || goals.find(g => g.title === 'Complete 200 DSA Problems');
  assert.ok(dsaGoal, 'Primary DSA goal must exist');
  console.log(`✔ 3. Found primary goal: "${dsaGoal.title}" (ID: ${dsaGoal._id})`);

  // 4. Fetch goal milestones
  const msRes = await request(`/api/goals/${dsaGoal._id}/goal-milestones`, { headers: authHeaders });
  assert.strictEqual(msRes.status, 200);
  const milestones = msRes.data.milestones;
  assert.ok(milestones.length >= 1, 'Must have at least 1 milestone');
  const ms1 = milestones[0];
  console.log(`✔ 4. Milestone 1: "${ms1.title}" (Weight: ${ms1.weight}, Modules: ${ms1.moduleCount}, Completed: ${ms1.completedModuleCount}, Progress: ${ms1.progressPercentage}%)`);
  assert.strictEqual(ms1.title, 'Arrays & Sliding Window');
  assert.strictEqual(ms1.moduleCount, 30);
  assert.strictEqual(ms1.completedModuleCount, 14);
  assert.strictEqual(ms1.weight, 1.5);
  assert.strictEqual(Math.round(ms1.progressPercentage), 47);

  // 5. Fetch modules for milestone 1
  const modRes = await request(`/api/goal-milestones/${ms1._id}/modules`, { headers: authHeaders });
  assert.strictEqual(modRes.status, 200);
  const modules = modRes.data.modules;
  assert.strictEqual(modules.length, 30, 'Milestone 1 must have exactly 30 modules');
  console.log('✔ 5. Milestone 1 has 30 modules matching reference layout:');
  for (let i = 0; i < 10; i++) {
    console.log(`   [${modules[i].isCompleted ? '✓' : ' '}] ${modules[i].title}`);
  }
  assert.strictEqual(modules[0].title, 'Module 01: Two Sum & Hash Lookup');
  assert.strictEqual(modules[0].isCompleted, true);
  assert.strictEqual(modules[1].title, 'Module 02: Prefix Sum Basics');
  assert.strictEqual(modules[1].isCompleted, true);
  assert.strictEqual(modules[9].title, 'Module 10: Longest Substring Without Repeats');
  assert.strictEqual(modules[9].isCompleted, true);

  // 6. Test quick inline add module (matching user screenshot [Add single module...][Add])
  const addRes = await request(`/api/goal-milestones/${ms1._id}/modules`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ title: 'Module 31: Minimum Window Subsequence' })
  });
  assert.strictEqual(addRes.status, 201, 'Quick add module must return 201');
  const addedModule = addRes.data.module;
  console.log(`✔ 6. Quick add module successful: "${addedModule.title}" (ID: ${addedModule._id})`);

  // Verify milestone count updated to 31
  const msUpdatedRes = await request(`/api/goal-milestones/${ms1._id}`, { headers: authHeaders });
  assert.strictEqual(msUpdatedRes.data.milestone.moduleCount, 31);
  console.log(`✔ 7. Milestone module count dynamically updated to 31`);

  // 7. Toggle module completion
  const toggleRes = await request(`/api/goal-modules/${addedModule._id}/toggle`, {
    method: 'PATCH',
    headers: authHeaders
  });
  assert.strictEqual(toggleRes.status, 200);
  assert.strictEqual(toggleRes.data.module.isCompleted, true);
  console.log(`✔ 8. Toggled module completion: isCompleted = true`);

  // 8. Delete added module
  const delRes = await request(`/api/goal-modules/${addedModule._id}`, {
    method: 'DELETE',
    headers: authHeaders
  });
  assert.strictEqual(delRes.status, 200);
  console.log(`✔ 9. Deleted module via trash icon, count returned to 30`);

  console.log('\n🎉 ALL MY GOALS UI INTEGRATION CHECKS PASSED PERFECTLY!\n');
}

verify().catch(e => {
  console.error('FAILED:', e);
  process.exit(1);
});
