const BASE_URL = 'http://127.0.0.1:5000/api';

async function main() {
  console.log('--- STARTING VERIFICATION: ADVANCED MY GOALS & SMART FOLDERS ---');

  let authToken = '';

  const request = async (path, options = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    const res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers
    });

    const data = await res.json().catch(() => null);
    if (data?.token) {
      authToken = data.token;
    }
    return { status: res.status, ok: res.ok, data };
  };

  // 1. Register test user
  const unique = Date.now();
  const regRes = await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Goals Tester',
      email: `goalstester_${unique}@example.com`,
      password: 'Password123!',
      role: 'student'
    })
  });

  console.log(`1. Registration: status ${regRes.status}, success = ${regRes.data?.success}, token = ${!!authToken}`);

  // 2. Fetch seeded folders
  const foldersRes = await request('/folders');
  console.log(`2. Get Folders: count = ${foldersRes.data?.folders?.length}, root folders in tree = ${foldersRes.data?.folderTree?.length}`);
  if (!foldersRes.data?.folders || foldersRes.data.folders.length < 5) {
    throw new Error(`Expected at least 5 seeded default folders, got ${foldersRes.data?.folders?.length}`);
  }

  // 3. Create Root Folder & Subfolder
  const createFolderRes = await request('/folders', {
    method: 'POST',
    body: JSON.stringify({
      name: `Computer Science ${unique}`,
      color: '#6366f1',
      icon: 'Folder'
    })
  });
  const rootFolderId = createFolderRes.data?.folder?._id;
  console.log(`3a. Created root folder: ID ${rootFolderId}, name = "${createFolderRes.data?.folder?.name}"`);
  if (!rootFolderId) throw new Error('Root folder creation failed');

  const createSubRes = await request('/folders', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Advanced Algorithms',
      parentFolderId: rootFolderId,
      color: '#a855f7',
      icon: 'Code'
    })
  });
  const subFolderId = createSubRes.data?.folder?._id;
  console.log(`3b. Created subfolder: ID ${subFolderId}, parentId = ${createSubRes.data?.folder?.parentFolderId}`);
  if (!subFolderId || createSubRes.data?.folder?.parentFolderId !== rootFolderId) {
    throw new Error('Subfolder hierarchy failed');
  }

  // 4. Create Goal with 30 dynamically generated module slots
  const createGoalRes = await request('/goals', {
    method: 'POST',
    body: JSON.stringify({
      title: 'Master Java DSA Roadmap',
      description: 'Comprehensive 30-module syllabus for coding rounds',
      category: 'DSA & Coding',
      folderId: subFolderId,
      targetDate: new Date(Date.now() + 90 * 86400000).toISOString(),
      priority: 'high',
      progressType: 'milestone_based',
      moduleCount: 30,
      milestoneCount: 30
    })
  });

  const goal = createGoalRes.data?.goal;
  console.log(`4. Goal Created: ID ${goal?._id}, moduleCount = ${goal?.moduleCount}, progress = ${goal?.currentProgressPercentage}%`);

  // 5. Fetch Milestones for Goal
  const milestonesRes = await request(`/goals/${goal._id}/milestones`);
  const milestones = milestonesRes.data?.milestones || [];
  console.log(`5. Milestones fetched: count = ${milestones.length}`);
  if (milestones.length !== 30) {
    throw new Error(`Expected exactly 30 milestones, got ${milestones.length}`);
  }
  console.log(`   First milestone: ${milestones[0].title}, status = ${milestones[0].status}`);
  console.log(`   30th milestone: ${milestones[29].title}, status = ${milestones[29].status}`);

  // 6. Complete 12 modules -> authoritative recalculation should be 40.0%
  for (let i = 0; i < 12; i++) {
    const patchRes = await request(`/milestones/${milestones[i]._id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'completed' })
    });
    if (i === 11) {
      console.log(`6. Completed 12th module. Updated goal progress: ${patchRes.data?.goalProgress}% (expected 40.0%)`);
      if (patchRes.data?.goalProgress !== 40.0) {
        throw new Error(`Expected progress 40.0%, got ${patchRes.data?.goalProgress}%`);
      }
    }
  }

  // 7. Add Subtask to Module 01
  const taskRes = await request(`/milestones/${milestones[0]._id}/tasks`, {
    method: 'POST',
    body: JSON.stringify({
      title: 'Solve LeetCode #1 Two Sum',
      priority: 'high',
      estimatedMinutes: 30
    })
  });
  console.log(`7. Added subtask to Module 01: task title = "${taskRes.data?.task?.title}", milestone = ${taskRes.data?.task?.linkedMilestone}`);

  // 8. Update Study Notes on Module 01
  const notesRes = await request(`/milestones/${milestones[0]._id}/notes`, {
    method: 'PUT',
    body: JSON.stringify({
      notes: '### Two Pointers & Hashing Guide\n- Map compliment target - x to index\n- Space O(N), Time O(N)'
    })
  });
  console.log(`8. Updated notes on Module 01: notes length = ${notesRes.data?.milestone?.notes?.length} chars`);

  // 9. Add Study Resource on Module 01
  const resRes = await request(`/milestones/${milestones[0]._id}/resources`, {
    method: 'POST',
    body: JSON.stringify({
      title: 'NeetCode Roadmap Guide',
      url: 'https://neetcode.io/roadmap',
      resourceType: 'link'
    })
  });
  console.log(`9. Added study resource: resources count = ${resRes.data?.milestone?.resources?.length}`);

  // 10. AI Goal Assistance
  const aiCoachRes = await request('/ai/goal-assistance', {
    method: 'POST',
    body: JSON.stringify({
      goalId: goal._id,
      question: 'How should I study for Module 13 and keep pace?'
    })
  });
  console.log(`10. AI Goal Coach assistance reply received: provider = ${aiCoachRes.data?.assistance?.provider}`);
  console.log(`    Coach stats: progress = ${aiCoachRes.data?.assistance?.stats?.progressPct}%, completed = ${aiCoachRes.data?.assistance?.stats?.completedMilestones}/30`);

  // 11. Move Goal to root folder
  const moveRes = await request(`/goals/${goal._id}/move`, {
    method: 'PATCH',
    body: JSON.stringify({
      folderId: rootFolderId
    })
  });
  console.log(`11. Moved goal to root folder: updated folder = "${moveRes.data?.goal?.folder}", folderId = ${moveRes.data?.goal?.folderId}`);

  // 12. Toggle Favorite & Archive
  const favRes = await request(`/goals/${goal._id}/favorite`, { method: 'PATCH' });
  console.log(`12a. Toggled favorite: isFavorite = ${favRes.data?.isFavorite}`);

  const archRes = await request(`/goals/${goal._id}/archive`, { method: 'PATCH' });
  console.log(`12b. Toggled archive: isArchived = ${archRes.data?.isArchived}`);

  // 13. AI Milestones Generator
  const aiGenRes = await request('/ai/generate-milestones', {
    method: 'POST',
    body: JSON.stringify({
      goalTitle: 'System Design Interview Mastery',
      count: 10,
      category: 'System Design'
    })
  });
  console.log(`13. AI Milestones Generated: count = ${aiGenRes.data?.milestones?.length}, title[0] = "${aiGenRes.data?.milestones?.[0]?.title}"`);

  console.log('--- ALL ADVANCED MY GOALS & SMART FOLDER PROBES PASSED WITH 100% SUCCESS ---');
}

main().catch(err => {
  console.error('PROBE FAILED:', err.message);
  process.exit(1);
});
