const mongoose = require('../backend/node_modules/mongoose');

async function sync() {
  await mongoose.connect('mongodb://127.0.0.1:27017/consistai_ml');
  const users = await mongoose.connection.collection('users').find({ email: 'demo@consistai.edu' }).toArray();
  if (users.length === 0) {
    console.log('User not found');
    process.exit(1);
  }
  const user = users[0];
  const dsaGoals = await mongoose.connection.collection('goals').find({ user: user._id, title: 'Complete 200 DSA Problems' }).toArray();
  if (dsaGoals.length === 0) {
    console.log('DSA goal not found');
    process.exit(1);
  }
  const dsaGoal = dsaGoals[0];
  await mongoose.connection.collection('goals').updateOne({ _id: dsaGoal._id }, { $set: { isPrimaryGoal: true } });

  // Clear existing milestones and modules for this goal
  await mongoose.connection.collection('goalmilestones').deleteMany({ goal: dsaGoal._id });
  await mongoose.connection.collection('goalmodules').deleteMany({ goal: dsaGoal._id });

  const startDate = dsaGoal.startDate || new Date(Date.now() - 40 * 86400000);
  const ms1Res = await mongoose.connection.collection('goalmilestones').insertOne({
    goal: dsaGoal._id,
    user: user._id,
    title: 'Arrays & Sliding Window',
    description: 'Arrays, Two-Pointers, and Sliding Window algorithmic patterns',
    order: 1,
    sequenceNumber: 1,
    weight: 1.5,
    moduleCount: 30,
    completedModuleCount: 14,
    progressPercentage: 47,
    status: 'in_progress',
    createdAt: new Date(),
    updatedAt: new Date()
  });

  const ms1ModuleTitles = [
    'Module 01: Two Sum & Hash Lookup',
    'Module 02: Prefix Sum Basics',
    'Module 03: Subarray Sum Equals K',
    'Module 04: Two Pointers: Sorted Pair',
    'Module 05: Container With Most Water',
    'Module 06: Three Sum Triplets',
    'Module 07: Kadane Maximum Subarray',
    'Module 08: Best Time to Buy & Sell Stock',
    'Module 09: Sliding Window Maximum',
    'Module 10: Longest Substring Without Repeats',
    'Module 11: Minimum Window Substring',
    'Module 12: Permutation in String',
    'Module 13: Find All Anagrams in a String',
    'Module 14: Fruit Into Baskets',
    'Module 15: Longest Repeating Character Replacement',
    'Module 16: Subarrays with K Different Integers',
    'Module 17: Sliding Window Median',
    'Module 18: Maximum Sum of Distinct Subarrays With Length K',
    'Module 19: Maximum Points You Can Obtain from Cards',
    'Module 20: Count Number of Nice Subarrays',
    'Module 21: Replace the Substring for Balanced String',
    'Module 22: Max Consecutive Ones III',
    'Module 23: Binary Subarrays With Sum',
    'Module 24: Subarray Product Less Than K',
    'Module 25: Minimum Size Subarray Sum',
    'Module 26: Grumpy Bookstore Owner',
    'Module 27: Get Equal Substrings Within Budget',
    'Module 28: Frequency of the Most Frequent Element',
    'Module 29: Maximum Erasure Value',
    'Module 30: Take K of Each Character From Left and Right'
  ];

  const mods = ms1ModuleTitles.map((t, idx) => ({
    goal: dsaGoal._id,
    milestone: ms1Res.insertedId,
    user: user._id,
    title: t,
    order: idx + 1,
    isCompleted: idx < 14,
    status: idx < 14 ? 'completed' : 'not_started',
    completedAt: idx < 14 ? new Date(startDate.getTime() + idx * 86400000) : null,
    estimatedMinutes: 45,
    createdAt: new Date(),
    updatedAt: new Date()
  }));
  await mongoose.connection.collection('goalmodules').insertMany(mods);

  const ms2Res = await mongoose.connection.collection('goalmilestones').insertOne({
    goal: dsaGoal._id,
    user: user._id,
    title: 'Linked Lists & Two Pointers',
    description: 'Singly, Doubly, and Fast/Slow Pointer algorithms',
    order: 2,
    sequenceNumber: 2,
    weight: 1.0,
    moduleCount: 20,
    completedModuleCount: 8,
    progressPercentage: 40,
    status: 'in_progress',
    createdAt: new Date(),
    updatedAt: new Date()
  });

  const ms2ModuleTitles = [
    'Module 01: Reverse Linked List Iterative & Recursive',
    'Module 02: Detect Cycle & Floyd Cycle-Finding',
    'Module 03: Merge Two Sorted Lists',
    'Module 04: Remove Nth Node From End',
    'Module 05: Reorder List & Palindrome Linked List',
    'Module 06: Copy List with Random Pointer',
    'Module 07: Add Two Numbers as Lists',
    'Module 08: LRU Cache Design with Doubly Linked List',
    'Module 09: Merge K Sorted Lists',
    'Module 10: Reverse Nodes in k-Group',
    'Module 11: Sort List with Merge Sort',
    'Module 12: Intersection of Two Linked Lists',
    'Module 13: Rotate List by K Places',
    'Module 14: Partition List Around Pivot',
    'Module 15: Odd Even Linked List',
    'Module 16: Swap Nodes in Pairs',
    'Module 17: Flatten a Multilevel Doubly Linked List',
    'Module 18: Split Linked List in Parts',
    'Module 19: Design Circular Queue & Deque',
    'Module 20: LFU Cache Implementation'
  ];

  await mongoose.connection.collection('goalmodules').insertMany(ms2ModuleTitles.map((t, idx) => ({
    goal: dsaGoal._id,
    milestone: ms2Res.insertedId,
    user: user._id,
    title: t,
    order: idx + 1,
    isCompleted: idx < 8,
    status: idx < 8 ? 'completed' : 'not_started',
    completedAt: idx < 8 ? new Date(startDate.getTime() + (idx + 14) * 86400000) : null,
    estimatedMinutes: 45,
    createdAt: new Date(),
    updatedAt: new Date()
  })));

  console.log('Synced successfully for demo user!');
  process.exit(0);
}
sync();
