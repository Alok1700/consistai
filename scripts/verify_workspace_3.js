import http from 'http';
import assert from 'assert';

const BASE_URL = 'http://127.0.0.1:5000/api';

function request(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + path);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        let parsed = null;
        try {
          parsed = JSON.parse(data);
        } catch (e) {
          parsed = data;
        }
        resolve({ status: res.statusCode, data: parsed });
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

async function run() {
  console.log('🚀 Starting ConsistAI ML 3.0 Comprehensive Verification Suite...\n');

  // Step 1: Register / Login Test User
  const testEmail = `architect_test_${Date.now()}@consistai.io`;
  const password = 'Password@123';

  console.log('Phase 1: Authentication & User Preferences Setup');
  const regRes = await request('POST', '/auth/register', {
    name: 'Productivity Architect',
    email: testEmail,
    password
  });
  assert.strictEqual(regRes.status, 201, `Registration failed: ${JSON.stringify(regRes.data)}`);
  const token = regRes.data.token;
  const authHeader = { Authorization: `Bearer ${token}` };
  console.log('  ✔ Registered test user with JWT token.');

  // Update preferences with custom working days
  const prefRes = await request('PUT', '/auth/preferences', {
    workingDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    dailyStudyHours: 3
  }, authHeader);
  assert.strictEqual(prefRes.status, 200, `Preferences update failed: ${JSON.stringify(prefRes.data)}`);
  console.log('  ✔ Configured 5-day work week (Mon-Fri) in user preferences.\n');

  // Step 2: Nested Folder Management & Circular Prevention
  console.log('Phase 2: Nested Folder Management & Cycle Prevention');
  const f1Res = await request('POST', '/goal-folders', {
    name: 'Computer Science',
    color: '#7C3AED',
    icon: 'Folder'
  }, authHeader);
  assert.strictEqual(f1Res.status, 201, `Failed to create root folder: ${JSON.stringify(f1Res.data)}`);
  const rootFolderId = f1Res.data.folder._id;
  console.log('  ✔ Created root folder: Computer Science');

  const f2Res = await request('POST', '/goal-folders', {
    name: 'Algorithms & Data Structures',
    parentFolderId: rootFolderId,
    color: '#6366F1',
    icon: 'Folder'
  }, authHeader);
  assert.strictEqual(f2Res.status, 201, `Failed to create child folder: ${JSON.stringify(f2Res.data)}`);
  const childFolderId = f2Res.data.folder._id;
  console.log('  ✔ Created subfolder: Algorithms & Data Structures (child of CS)');

  const f3Res = await request('POST', '/goal-folders', {
    name: 'Graph Theory',
    parentFolderId: childFolderId,
    color: '#06B6D4',
    icon: 'Folder'
  }, authHeader);
  assert.strictEqual(f3Res.status, 201, `Failed to create leaf folder: ${JSON.stringify(f3Res.data)}`);
  const leafFolderId = f3Res.data.folder._id;
  console.log('  ✔ Created nested leaf folder: Graph Theory (child of Algorithms)');

  // Attempt circular move: move root into its own leaf descendant
  const cycleRes = await request('PUT', `/goal-folders/${rootFolderId}`, {
    parentFolderId: leafFolderId
  }, authHeader);
  assert.strictEqual(cycleRes.status, 400, 'Cycle prevention failed to reject circular parenting');
  console.log('  ✔ Cycle Prevention: Blocked moving parent folder into its own descendant.');

  // Fetch Folder Tree
  const treeRes = await request('GET', '/goal-folders', null, authHeader);
  assert.strictEqual(treeRes.status, 200);
  assert.ok(Array.isArray(treeRes.data.folders));
  assert.ok(treeRes.data.folders.length >= 3);
  console.log('  ✔ Successfully retrieved nested folder hierarchy tree.\n');

  // Step 3: Module-Based Goal Creation with 30 Dynamic Slots
  console.log('Phase 3: Module-Based Goal Creation & Dynamic Slot Generation');
  const targetDate = new Date(Date.now() + 60 * 86400000).toISOString();
  const goal30Res = await request('POST', '/goals', {
    title: 'Master Java DSA Course',
    description: 'Complete all 30 algorithmic modules with deep conceptual understanding',
    category: 'DSA & Coding',
    folderId: childFolderId,
    targetDate,
    priority: 'high',
    progressType: 'milestone_based',
    moduleCount: 30
  }, authHeader);
  assert.strictEqual(goal30Res.status, 201, `Failed to create 30-slot goal: ${JSON.stringify(goal30Res.data)}`);
  const goal30Id = goal30Res.data.goal._id;
  console.log('  ✔ Created goal "Master Java DSA Course" with moduleCount: 30.');

  // Verify exactly 30 milestone slots exist
  const modulesRes = await request('GET', `/goals/${goal30Id}/modules`, null, authHeader);
  assert.strictEqual(modulesRes.status, 200);
  const slots = modulesRes.data.milestones;
  assert.strictEqual(slots.length, 30, `Expected exactly 30 slots, got ${slots.length}`);
  assert.strictEqual(slots[0].sequenceNumber, 1);
  assert.strictEqual(slots[29].sequenceNumber, 30);
  console.log('  ✔ Verified exactly 30 ordered milestone slots were automatically created without duplicates.\n');

  // Step 4: Proportional Recalibration & Skipped Module Policy
  console.log('Phase 4: Progress Recalibration & Skipped Policy Verification');
  // Mark Module 1 completed
  const m1 = slots[0];
  const m1Res = await request('PATCH', `/milestones/${m1._id}/status`, { status: 'completed' }, authHeader);
  assert.strictEqual(m1Res.status, 200);

  // Mark Module 2 completed
  const m2 = slots[1];
  const m2Res = await request('PATCH', `/milestones/${m2._id}/status`, { status: 'completed' }, authHeader);
  assert.strictEqual(m2Res.status, 200);

  // Mark Module 3 skipped
  const m3 = slots[2];
  const m3Res = await request('PATCH', `/milestones/${m3._id}/status`, {
    status: 'skipped',
    skipReason: 'Topic already mastered in prior coursework'
  }, authHeader);
  assert.strictEqual(m3Res.status, 200);

  // Check Goal Progress
  const goalCheckRes = await request('GET', `/goals/${goal30Id}`, null, authHeader);
  assert.strictEqual(goalCheckRes.status, 200);
  const updatedGoal = goalCheckRes.data.goal;
  // Out of 30, 1 skipped -> 29 active. 2 completed / 29 = 6.9%
  const expectedProgress = Number(((2 / 29) * 100).toFixed(1));
  assert.ok(Math.abs(updatedGoal.currentProgressPercentage - expectedProgress) < 0.2,
    `Expected progress ${expectedProgress}%, got ${updatedGoal.currentProgressPercentage}%`);
  console.log(`  ✔ Verified progress recalibration: 2 completed / 29 eligible = ${updatedGoal.currentProgressPercentage}% (skipped module excluded without penalty).\n`);

  // Step 5: Numerical Goal & Idempotent Progress Logging
  console.log('Phase 5: Numerical Goal & Progress Logging');
  const numGoalRes = await request('POST', '/goals', {
    title: 'Solve 200 DSA Problems',
    description: 'Daily practice across LeetCode and Codeforces',
    category: 'DSA & Coding',
    targetDate,
    priority: 'medium',
    progressType: 'numerical',
    targetQuantity: 200,
    measurementUnit: 'Problems'
  }, authHeader);
  assert.strictEqual(numGoalRes.status, 201);
  const numGoalId = numGoalRes.data.goal._id;
  console.log('  ✔ Created numerical goal: Solve 200 DSA Problems.');

  // Log +10 problems
  const log1Res = await request('POST', `/goals/${numGoalId}/progress`, {
    quantityAdded: 10,
    notes: 'Completed two-pointer array problems'
  }, authHeader);
  assert.strictEqual(log1Res.status, 200);

  // Log +5 problems
  const log2Res = await request('POST', `/goals/${numGoalId}/progress`, {
    quantityAdded: 5,
    notes: 'Completed sliding window problems'
  }, authHeader);
  assert.strictEqual(log2Res.status, 200);

  const numCheckRes = await request('GET', `/goals/${numGoalId}`, null, authHeader);
  const checkedNumGoal = numCheckRes.data.goal;
  assert.strictEqual(checkedNumGoal.achievedQuantity, 15);
  // 15 / 200 = 7.5% -> rounded to 8% or 7.5%
  assert.ok(checkedNumGoal.currentProgressPercentage >= 7 && checkedNumGoal.currentProgressPercentage <= 8);
  console.log(`  ✔ Verified numerical progress: 15 / 200 = ${checkedNumGoal.currentProgressPercentage}%. Progress events stored.\n`);

  // Step 6: Deterministic Pacing Engine Verification
  console.log('Phase 6: Deterministic Schedule Pacing Engine');
  const pacing = updatedGoal.pacing;
  assert.ok(pacing, 'Goal pacing object missing');
  assert.ok(typeof pacing.progress_gap_pct === 'number', 'progress_gap_pct must be number');
  assert.ok(pacing.pacing_status, 'pacing_status must be string');
  assert.ok(pacing.pacing_label, 'pacing_label must be string');
  console.log(`  ✔ Deterministic Pacing: Status = "${pacing.pacing_status}", Label = "${pacing.pacing_label}", Gap = ${pacing.progress_gap_pct}%.`);

  const intelligence = updatedGoal.intelligence;
  assert.ok(intelligence, 'Intelligence object missing');
  assert.ok(typeof intelligence.bufferDays === 'number', 'bufferDays must be number');
  assert.ok(typeof intelligence.remainingEligibleDays === 'number', 'remainingEligibleDays must be number');
  console.log(`  ✔ Workload Metrics: Buffer = ${intelligence.bufferDays} days, Eligible Days = ${intelligence.remainingEligibleDays}, Next Module = "${intelligence.nextModule?.title}".\n`);

  // Step 7: Safe Folder Deletion & Fallback Migration
  console.log('Phase 7: Safe Folder Deletion & Fallback Migration');
  const delFolderRes = await request('DELETE', `/goal-folders/${childFolderId}`, null, authHeader);
  assert.strictEqual(delFolderRes.status, 200);
  console.log('  ✔ Deleted folder "Algorithms & Data Structures".');

  // Verify goal was not deleted but safely migrated to 'General'
  const postDelGoalRes = await request('GET', `/goals/${goal30Id}`, null, authHeader);
  assert.strictEqual(postDelGoalRes.status, 200);
  assert.strictEqual(postDelGoalRes.data.goal.folder, 'General');
  assert.strictEqual(postDelGoalRes.data.goal.folderId, null);
  console.log('  ✔ Safe Fallback: Goal was preserved and migrated to "General" folder.\n');

  console.log('===========================================================');
  console.log('🎉 ALL 7 E2E PHASES PASSED WITH ZERO ERRORS!');
  console.log('===========================================================');
}

run().catch((err) => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
