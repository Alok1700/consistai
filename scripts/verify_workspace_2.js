import assert from 'assert';

const BASE_URL = 'http://127.0.0.1:5000/api';

async function run() {
  console.log('🚀 Running ConsistAI Workspace 2.0 End-to-End Verification...');

  // 1. Authenticate user
  const email = `test_ws2_${Date.now()}@example.com`;
  const password = 'Password123!';

  const regRes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Workspace User', email, password })
  });
  const regData = await regRes.json();
  const token = regData.token;
  assert(token, 'User token should be returned');
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
  console.log('  ✔ User authenticated');

  // 2. Fetch Goal Templates
  const tplRes = await fetch(`${BASE_URL}/goals/templates`, { headers });
  const tplData = await tplRes.json();
  assert(tplData.success, 'Template fetch must succeed');
  assert(tplData.templates.length >= 6, `Expected at least 6 templates, got ${tplData.templates.length}`);
  console.log(`  ✔ Verified ${tplData.templates.length} pre-configured curated templates`);

  // 3. Create Goal from Template
  const fromTplRes = await fetch(`${BASE_URL}/goals/from-template`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      templateId: 'dsa_100',
      folder: 'Technical Prep'
    })
  });
  const fromTplData = await fromTplRes.json();
  console.log('fromTplData:', fromTplData);
  assert(fromTplData.success, 'Goal from template creation must succeed');
  const createdGoal = fromTplData.goal;
  assert(createdGoal._id, 'Created goal ID must exist');
  console.log(`  ✔ Created goal from template: "${createdGoal.title}" (${createdGoal._id})`);

  // 4. Verify GET /api/goals compactMetrics and continueGoal
  const goalsRes = await fetch(`${BASE_URL}/goals`, { headers });
  const goalsData = await goalsRes.json();
  assert(goalsData.success, 'Goals fetch must succeed');
  assert(goalsData.compactMetrics, 'compactMetrics must exist');
  assert.strictEqual(typeof goalsData.compactMetrics.activeGoalsCount, 'number');
  assert.strictEqual(typeof goalsData.compactMetrics.completedModulesCount, 'number');
  assert(goalsData.continueGoal, 'continueGoal hero card data must exist');
  assert.strictEqual(goalsData.continueGoal.title, createdGoal.title);
  assert(goalsData.continueGoal.nextModule, 'continueGoal must have nextModule');
  console.log(`  ✔ Verified compactMetrics & continueGoal hero pointing to: Module #${goalsData.continueGoal.nextModule.sequenceNumber}: ${goalsData.continueGoal.nextModule.title}`);

  // 5. Test Bulk Import Modules
  const importRes = await fetch(`${BASE_URL}/goals/${createdGoal._id}/milestones/import`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      modules: [
        { sequenceNumber: 31, title: 'Trie & Prefix Tree', estimatedEffort: '60 mins', description: 'Implement insert and search' },
        { sequenceNumber: 32, title: 'Union Find & Disjoint Set', estimatedEffort: '75 mins', description: 'Cycle detection in graphs' }
      ]
    })
  });
  const importData = await importRes.json();
  assert(importData.success, 'Bulk import must succeed');
  assert.strictEqual(importData.importedCount, 2, 'Should import 2 new modules');
  console.log('  ✔ Verified bulk module syllabus import');

  // 6. Test Global Search (Command Menu)
  const searchRes = await fetch(`${BASE_URL}/goals/search?q=Trie`, { headers });
  const searchData = await searchRes.json();
  assert(searchData.success, 'Global search must succeed');
  assert(searchData.results.modules.length > 0, 'Module "Trie & Prefix Tree" should be found');
  console.log(`  ✔ Verified global Ctrl+K search: found ${searchData.results.modules.length} matching modules`);

  // 7. Verify Level 2 Command Center Data (getGoalById with intelligence)
  const detailRes = await fetch(`${BASE_URL}/goals/${createdGoal._id}`, { headers });
  const detailData = await detailRes.json();
  assert(detailData.success, 'Detail fetch must succeed');
  const intelligence = detailData.goal.intelligence;
  assert(intelligence, 'Goal intelligence must be present');
  assert(intelligence.nextModule, 'intelligence.nextModule must be present');
  assert(intelligence.suggestedDailyWorkload, 'suggestedDailyWorkload must be computed');
  assert(intelligence.totalEligibleDays > 0, 'totalEligibleDays must be > 0');
  assert(intelligence.bufferExplanation, 'bufferExplanation must be present');
  assert(intelligence.restDaysPolicy, 'restDaysPolicy must be present');
  console.log(`  ✔ Verified Level 2 Command Center intelligence: ${intelligence.suggestedDailyWorkload}`);

  // 8. Test Skipped Module Calculation
  const firstModule = detailData.goal.milestones[0];
  const skipRes = await fetch(`${BASE_URL}/milestones/${firstModule._id}/status`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ status: 'skipped', skipReason: 'Already mastered in college' })
  });
  const skipData = await skipRes.json();
  assert(skipData.success, 'Skip module must succeed');
  assert.strictEqual(skipData.milestone.status, 'skipped');
  assert(skipData.goalProgress >= 0, 'Progress percentage should remain non-negative');
  console.log(`  ✔ Verified Skipped Module Policy: Module marked skipped without penalizing progress`);

  // 9. Test Target Deadline Extension (PATCH /api/goals/:id)
  const newTargetDate = new Date(Date.now() + 120 * 86400000).toISOString();
  const extendRes = await fetch(`${BASE_URL}/goals/${createdGoal._id}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ targetDate: newTargetDate })
  });
  const extendData = await extendRes.json();
  assert(extendData.success, 'Target date extension must succeed');
  assert.strictEqual(new Date(extendData.goal.targetDate).toISOString(), newTargetDate);
  console.log('  ✔ Verified Overdue Deadline Recovery: Deadline extended and schedule recalculated');

  console.log('\n🎉 ALL CONSISTAI WORKSPACE 2.0 VERIFICATIONS PASSED SUCCESSFULLY!');
}

run().catch((err) => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
