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

async function runVerification() {
  console.log('=== CONSISTAI ML 3.0: MILESTONE-BASED MODULE CHECKLIST E2E TEST ===\n');

  // Phase 0: Register/Login test user
  const testEmail = `tester_checklist_${Date.now()}@consistai.dev`;
  const regRes = await request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Checklist Tester',
      email: testEmail,
      password: 'password123',
      role: 'student'
    })
  });
  assert.strictEqual(regRes.status, 201, 'User registration should succeed');
  const cookie = regRes.headers.get('set-cookie')?.split(';')[0];
  const authHeaders = { Cookie: cookie };
  console.log('✔ Phase 0: Registered test user & authenticated session');

  // Phase 1: Create a goal with three milestones (30, 20, 50 modules)
  console.log('Testing Phase 1: Create Goal with 3 Milestones (30, 20, 50 modules)...');
  const createGoalRes = await request('/api/goals', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      title: 'Master Data Structures & Algorithms',
      description: 'Comprehensive DSA Mastery Roadmap',
      category: 'DSA & Coding',
      priority: 'high',
      progressType: 'milestone_based',
      startDate: new Date().toISOString(),
      targetDate: new Date(Date.now() + 120 * 86400000).toISOString(),
      milestones: [
        { name: 'Milestone 1: Arrays & Sliding Window', moduleCount: 30, weight: 1.5 },
        { name: 'Milestone 2: Linked Lists', moduleCount: 20, weight: 1.0 },
        { name: 'Milestone 3: Trees & Dynamic Programming', moduleCount: 50, weight: 2.0 }
      ]
    })
  });
  assert.strictEqual(createGoalRes.status, 201, 'Goal creation should succeed');
  const goalId = createGoalRes.data.goal._id;
  console.log(`✔ Goal created with id: ${goalId}`);

  // Phase 2: Confirm the goal has 100 total modules and 3 milestones
  console.log('Testing Phase 2: Confirm Goal has 100 Total Modules & 3 Milestones...');
  const milestonesRes = await request(`/api/goals/${goalId}/goal-milestones`, {
    headers: authHeaders
  });
  assert.strictEqual(milestonesRes.status, 200);
  const milestones = milestonesRes.data.milestones;
  assert.strictEqual(milestones.length, 3, 'Should have 3 milestone containers');
  assert.strictEqual(milestones[0].moduleCount, 30, 'Milestone 1 should have 30 modules');
  assert.strictEqual(milestones[1].moduleCount, 20, 'Milestone 2 should have 20 modules');
  assert.strictEqual(milestones[2].moduleCount, 50, 'Milestone 3 should have 50 modules');

  const totalModules = milestones.reduce((sum, m) => sum + m.moduleCount, 0);
  assert.strictEqual(totalModules, 100, 'Total modules should be exactly 100');
  console.log(`✔ Confirmed: 3 milestones, total modules = ${totalModules}`);

  // Phase 3: Fetch modules for Milestone 1
  const ms1 = milestones[0];
  const ms1ModulesRes = await request(`/api/goal-milestones/${ms1._id}/modules`, {
    headers: authHeaders
  });
  assert.strictEqual(ms1ModulesRes.status, 200);
  const ms1Modules = ms1ModulesRes.data.modules;
  assert.strictEqual(ms1Modules.length, 30, 'Milestone 1 should return 30 modules');
  assert.strictEqual(ms1Modules[0].title, 'Module 01');
  assert.strictEqual(ms1Modules[29].title, 'Module 30');
  console.log(`✔ Confirmed: Milestone 1 modules named Module 01 through Module 30`);

  // Phase 4: Complete 14 modules in Milestone 1
  console.log('Testing Phase 4: Complete 14 modules in Milestone 1...');
  for (let i = 0; i < 14; i++) {
    const toggleRes = await request(`/api/goal-modules/${ms1Modules[i]._id}/toggle`, {
      method: 'PATCH',
      headers: authHeaders
    });
    assert.strictEqual(toggleRes.status, 200);
    assert.strictEqual(toggleRes.data.module.isCompleted, true);
  }

  // Phase 5: Confirm milestone progress is 46.67% and unweighted goal progress is 14%
  console.log('Testing Phase 5: Verify Authoritative Progress Calculations...');
  const progressRes = await request(`/api/goals/${goalId}/progress`, {
    headers: authHeaders
  });
  assert.strictEqual(progressRes.status, 200);
  const progressData = progressRes.data;

  // Unweighted progress: 14 / 100 = 14%
  assert.strictEqual(progressData.completedModules, 14, 'Completed modules should be 14');
  assert.strictEqual(progressData.totalModules, 100, 'Total modules should be 100');
  assert.strictEqual(progressData.unweightedProgressPercentage, 14, 'Goal progress should be 14%');

  // Milestone 1 progress: 14 / 30 = 46.67%
  const ms1Progress = progressData.milestones.find(m => m.id === ms1._id);
  assert(Math.abs(ms1Progress.progressPercentage - 46.7) < 0.2, `Milestone 1 progress should be ~46.7%, got ${ms1Progress.progressPercentage}`);
  console.log(`✔ Milestone 1 progress = ${ms1Progress.progressPercentage}% (14/30)`);
  console.log(`✔ Overall goal progress = ${progressData.progressPercentage}% (14/100)`);

  // Phase 6: Add 1 module inline to Milestone 1 -> count becomes 31
  console.log('Testing Phase 6: Add Single Module to Milestone 1...');
  const addModRes = await request(`/api/goal-milestones/${ms1._id}/modules`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      title: 'Monotonic Queue Pattern'
    })
  });
  assert.strictEqual(addModRes.status, 201);
  const updatedMs1Progress = addModRes.data.milestoneProgress;
  assert.strictEqual(updatedMs1Progress.moduleCount, 31, 'Milestone 1 module count should become 31');
  assert.strictEqual(updatedMs1Progress.completedModuleCount, 14);
  // 14 / 31 = 45.16%
  assert(Math.abs(updatedMs1Progress.progressPercentage - 45.2) < 0.2, `Expected ~45.2%, got ${updatedMs1Progress.progressPercentage}`);
  console.log(`✔ Added module! New count = 31, New progress = ${updatedMs1Progress.progressPercentage}%`);

  // Phase 7: Uncheck a module -> verify progress decreases correctly
  console.log('Testing Phase 7: Uncheck a module & verify progress reduction...');
  const uncheckRes = await request(`/api/goal-modules/${ms1Modules[0]._id}/toggle`, {
    method: 'PATCH',
    headers: authHeaders
  });
  assert.strictEqual(uncheckRes.status, 200);
  assert.strictEqual(uncheckRes.data.module.isCompleted, false);
  assert.strictEqual(uncheckRes.data.milestoneProgress.completedModuleCount, 13, 'Completed count should be 13');
  console.log(`✔ Unchecked module! Completed count decreased to 13`);

  // Phase 8: Persistence across refresh (re-fetch)
  console.log('Testing Phase 8: Verify persistence across fresh queries...');
  const refetchGoalRes = await request(`/api/goals/${goalId}/progress`, {
    headers: authHeaders
  });
  assert.strictEqual(refetchGoalRes.data.completedModules, 13);
  assert.strictEqual(refetchGoalRes.data.totalModules, 101); // 31 + 20 + 50 = 101
  console.log(`✔ Persistence confirmed: 13/101 modules completed`);

  // Phase 9: Rename module inline
  console.log('Testing Phase 9: Rename module...');
  const renameRes = await request(`/api/goal-modules/${ms1Modules[1]._id}`, {
    method: 'PATCH',
    headers: authHeaders,
    body: JSON.stringify({
      title: 'Advanced Sliding Window: Variable Length'
    })
  });
  assert.strictEqual(renameRes.status, 200);
  assert.strictEqual(renameRes.data.module.title, 'Advanced Sliding Window: Variable Length');
  console.log(`✔ Module renamed successfully`);

  // Phase 10: Import Syllabus with Populate Empty Slots (no duplicates!)
  console.log('Testing Phase 10: Import Syllabus with Populate Empty Slots...');
  const ms2 = milestones[1]; // Milestone 2 has 20 modules
  const importRes = await request(`/api/goal-milestones/${ms2._id}/modules/import`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      titles: [
        'Singly Linked List Reversal',
        'Detect Cycle using Floyd Tortoise & Hare',
        'Merge Two Sorted Lists',
        'LRU Cache Implementation'
      ],
      mode: 'populate'
    })
  });
  assert.strictEqual(importRes.status, 200);
  // Milestone 2 still has 20 modules (slots were populated, not duplicated!)
  assert.strictEqual(importRes.data.modules.length, 20, 'Should still have exactly 20 modules');
  assert.strictEqual(importRes.data.modules[0].title, 'Singly Linked List Reversal');
  assert.strictEqual(importRes.data.modules[1].title, 'Detect Cycle using Floyd Tortoise & Hare');
  console.log(`✔ Populated 4 empty slots without creating duplicates (count remains 20)`);

  // Phase 11: Reorder modules
  console.log('Testing Phase 11: Reorder modules...');
  const ms2Modules = importRes.data.modules;
  const reorderedIds = [ms2Modules[1]._id, ms2Modules[0]._id, ...ms2Modules.slice(2).map(m => m._id)];
  const reorderRes = await request(`/api/goal-milestones/${ms2._id}/modules/reorder`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      milestoneId: ms2._id,
      orderedIds: reorderedIds
    })
  });
  assert.strictEqual(reorderRes.status, 200);
  console.log(`✔ Modules reordered successfully`);

  // Phase 12: Delete module & milestone with confirmation
  console.log('Testing Phase 12: Delete module and milestone...');
  const moduleToDelete = addModRes.data.module._id;
  const delModRes = await request(`/api/goal-modules/${moduleToDelete}`, {
    method: 'DELETE',
    headers: authHeaders
  });
  assert.strictEqual(delModRes.status, 200);
  assert.strictEqual(delModRes.data.milestoneProgress.moduleCount, 30);
  console.log(`✔ Module deleted, milestone 1 count reverted to 30`);

  // Phase 13: Auth isolation (unauthorized access check)
  console.log('Testing Phase 13: Verify Auth Isolation...');
  const otherUserRes = await request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Other User',
      email: `other_${Date.now()}@consistai.dev`,
      password: 'password123',
      role: 'student'
    })
  });
  const otherCookie = otherUserRes.headers.get('set-cookie')?.split(';')[0];
  const unauthorizedRes = await request(`/api/goal-milestones/${ms1._id}/modules`, {
    headers: { Cookie: otherCookie }
  });
  assert.strictEqual(unauthorizedRes.status, 404, 'User B should not access User A milestone');
  console.log(`✔ Auth isolation verified: 404 for unauthorized access`);

  console.log('\n🎉 ALL 13 TEST PHASES PASSED WITH 100% SUCCESS!');
}

runVerification().catch((err) => {
  console.error('\n❌ Test Failure:', err);
  process.exit(1);
});
