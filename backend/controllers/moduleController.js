import ModuleProgress from '../models/ModuleProgress.js';

export const SYSTEM_MODULES = [
  // Milestone 1: Core Foundations & Algorithmic Complexity (1-5)
  {
    moduleNumber: 1,
    milestoneNumber: 1,
    title: 'Time & Space Complexity and Big-O Analysis',
    description: 'Asymptotic notation, worst/average/best cases, recursion tree analysis and space overhead.',
    estimatedHours: 4,
    category: 'Foundations'
  },
  {
    moduleNumber: 2,
    milestoneNumber: 1,
    title: 'Arrays & Memory Architecture',
    description: 'Dynamic arrays, contiguous memory allocation, amortized insertion complexity and cache locality.',
    estimatedHours: 4,
    category: 'Foundations'
  },
  {
    moduleNumber: 3,
    milestoneNumber: 1,
    title: 'Two-Pointer Techniques & Opposite Direction Patterns',
    description: 'Opposite-end pointer movements, two-sum on sorted collections, container with most water.',
    estimatedHours: 5,
    category: 'Techniques'
  },
  {
    moduleNumber: 4,
    milestoneNumber: 1,
    title: 'Sliding Window & Substring Algorithms',
    description: 'Fixed-size and dynamic-size sliding windows, minimum window substring, longest repeating substring.',
    estimatedHours: 5,
    category: 'Techniques'
  },
  {
    moduleNumber: 5,
    milestoneNumber: 1,
    title: 'Prefix Sums & Frequency Arrays',
    description: 'Range sum queries, subarray sum equals K, 2D prefix matrices and difference arrays.',
    estimatedHours: 4,
    category: 'Techniques'
  },

  // Milestone 2: Linear Data Structures & Storage (6-10)
  {
    moduleNumber: 6,
    milestoneNumber: 2,
    title: 'Singly & Doubly Linked Lists',
    description: 'Pointer manipulation, reversal in-place, middle finding, merging K sorted linked lists.',
    estimatedHours: 5,
    category: 'Data Structures'
  },
  {
    moduleNumber: 7,
    milestoneNumber: 2,
    title: 'Fast & Slow Pointer Cycle Detection (Floyd)',
    description: 'Cycle detection, finding cycle entry nodes, palindrome linked lists, intersection nodes.',
    estimatedHours: 4,
    category: 'Data Structures'
  },
  {
    moduleNumber: 8,
    milestoneNumber: 2,
    title: 'Stacks & Monotonic Stack Variations',
    description: 'Next greater element, daily temperatures, largest rectangle in histogram, valid parenthesis.',
    estimatedHours: 6,
    category: 'Data Structures'
  },
  {
    moduleNumber: 9,
    milestoneNumber: 2,
    title: 'Queues, Deques & Circular Buffers',
    description: 'Queue implementations, sliding window maximum, double-ended queues for monotonic ranges.',
    estimatedHours: 5,
    category: 'Data Structures'
  },
  {
    moduleNumber: 10,
    milestoneNumber: 2,
    title: 'Hash Tables & Collision Strategies',
    description: 'Hash functions, chaining vs open addressing, group anagrams, LRU cache foundations.',
    estimatedHours: 5,
    category: 'Data Structures'
  },

  // Milestone 3: Hierarchical Structures & Searching (11-15)
  {
    moduleNumber: 11,
    milestoneNumber: 3,
    title: 'Binary Search on Arrays & Answer Spaces',
    description: 'Rotated sorted arrays, median of two sorted arrays, binary search on continuous answer ranges.',
    estimatedHours: 6,
    category: 'Searching'
  },
  {
    moduleNumber: 12,
    milestoneNumber: 3,
    title: 'Binary Trees & Traversals (DFS/BFS)',
    description: 'Inorder/Preorder/Postorder traversals, level-order BFS, tree height, serialization.',
    estimatedHours: 6,
    category: 'Trees'
  },
  {
    moduleNumber: 13,
    milestoneNumber: 3,
    title: 'Binary Search Trees & Validation',
    description: 'BST invariants, insertion/deletion, kth smallest element, recovering binary search trees.',
    estimatedHours: 5,
    category: 'Trees'
  },
  {
    moduleNumber: 14,
    milestoneNumber: 3,
    title: 'Lowest Common Ancestor & Tree Diameters',
    description: 'LCA in binary trees, tree diameter, maximum path sum between arbitrary leaf nodes.',
    estimatedHours: 6,
    category: 'Trees'
  },
  {
    moduleNumber: 15,
    milestoneNumber: 3,
    title: 'Heaps, Priority Queues & Top-K Patterns',
    description: 'Binary heaps, heapify in O(N), Kth largest element, continuous median tracking in streams.',
    estimatedHours: 5,
    category: 'Heaps'
  },

  // Milestone 4: Graphs & Network Algorithms (16-20)
  {
    moduleNumber: 16,
    milestoneNumber: 4,
    title: 'Graph Representations & Connected Components',
    description: 'Adjacency list vs matrix representations, number of islands, clone graph, bipartite graphs.',
    estimatedHours: 6,
    category: 'Graphs'
  },
  {
    moduleNumber: 17,
    milestoneNumber: 4,
    title: 'Graph Traversals: Advanced BFS & DFS',
    description: 'Word ladder shortest mutations, 0/1 BFS, multi-source breadth first search patterns.',
    estimatedHours: 6,
    category: 'Graphs'
  },
  {
    moduleNumber: 18,
    milestoneNumber: 4,
    title: 'Cycle Detection & Topological Sort',
    description: 'Directed and undirected cycle detection, Kahn algorithm, Course Schedule dependencies.',
    estimatedHours: 6,
    category: 'Graphs'
  },
  {
    moduleNumber: 19,
    milestoneNumber: 4,
    title: 'Shortest Paths (Dijkstra & Bellman-Ford)',
    description: 'Non-negative edge shortest paths, min-heap Dijkstra, handling negative weight cycles.',
    estimatedHours: 7,
    category: 'Graphs'
  },
  {
    moduleNumber: 20,
    milestoneNumber: 4,
    title: 'Disjoint Set Union (Union-Find) & MST',
    description: 'Path compression, rank union, Kruskal minimum spanning tree, connected network graph.',
    estimatedHours: 6,
    category: 'Graphs'
  },

  // Milestone 5: Dynamic Programming & Optimization (21-25)
  {
    moduleNumber: 21,
    milestoneNumber: 5,
    title: '1D Dynamic Programming Foundations',
    description: 'Subproblem formulation, climbing stairs, house robber, decode ways, space optimization.',
    estimatedHours: 7,
    category: 'Dynamic Programming'
  },
  {
    moduleNumber: 22,
    milestoneNumber: 5,
    title: '2D Grid Dynamic Programming & Matrix Paths',
    description: 'Unique paths, minimum path sum in grid, triangle paths, cherry pickup state tracking.',
    estimatedHours: 7,
    category: 'Dynamic Programming'
  },
  {
    moduleNumber: 23,
    milestoneNumber: 5,
    title: '0/1 Knapsack & Subset Variations',
    description: 'Partition equal subset sum, target sum, coin change unbounded knapsack formulations.',
    estimatedHours: 7,
    category: 'Dynamic Programming'
  },
  {
    moduleNumber: 24,
    milestoneNumber: 5,
    title: 'Longest Common Subsequence & String DP',
    description: 'LCS recurrence, edit distance, longest palindromic subsequence, wildcard matching.',
    estimatedHours: 8,
    category: 'Dynamic Programming'
  },
  {
    moduleNumber: 25,
    milestoneNumber: 5,
    title: 'Dynamic Programming on Intervals & Partitions',
    description: 'Burst balloons, matrix chain multiplication, palindrome partitioning minimum cuts.',
    estimatedHours: 8,
    category: 'Dynamic Programming'
  },

  // Milestone 6: Advanced Paradigms & System Mastery (26-30)
  {
    moduleNumber: 26,
    milestoneNumber: 6,
    title: 'Greedy Strategies & Interval Scheduling',
    description: 'Non-overlapping intervals, meeting rooms II, gas station route completion.',
    estimatedHours: 5,
    category: 'Greedy'
  },
  {
    moduleNumber: 27,
    milestoneNumber: 6,
    title: 'Bitwise Manipulation & XOR Patterns',
    description: 'Single number I/II/III, counting set bits, bitmask dynamic programming subsets.',
    estimatedHours: 5,
    category: 'Bit Manipulation'
  },
  {
    moduleNumber: 28,
    milestoneNumber: 6,
    title: 'Trie (Prefix Trees) & Multi-String Lookup',
    description: 'Trie insert/search/startsWith, word search II with backtracking, maximum XOR pair.',
    estimatedHours: 6,
    category: 'Advanced'
  },
  {
    moduleNumber: 29,
    milestoneNumber: 6,
    title: 'Segment Trees & Binary Indexed Trees (BIT)',
    description: 'Range sum queries with point updates, lazy propagation, coordinate compression.',
    estimatedHours: 8,
    category: 'Advanced'
  },
  {
    moduleNumber: 30,
    milestoneNumber: 6,
    title: 'Comprehensive Mock Interview & Synthesis Challenge',
    description: 'Simulated 60-minute technical interview covering combined graph, DP and tree architectures.',
    estimatedHours: 8,
    category: 'Capstone'
  }
];

export const getSystemModules = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const userProgressRecords = await ModuleProgress.find({ user: userId });
    const progressMap = {};
    userProgressRecords.forEach((p) => {
      progressMap[p.moduleNumber] = p;
    });

    const modulesWithStatus = SYSTEM_MODULES.map((m) => {
      const userRecord = progressMap[m.moduleNumber];
      return {
        ...m,
        id: `mod_${m.moduleNumber}`,
        isCompleted: userRecord ? userRecord.isCompleted : false,
        completedAt: userRecord?.completedAt || null,
        notes: userRecord?.notes || ''
      };
    });

    // Group into 6 Milestone blocks
    const milestones = [
      { milestoneNumber: 1, title: 'Milestone 1: Core Foundations & Algorithmic Complexity', modules: [] },
      { milestoneNumber: 2, title: 'Milestone 2: Linear Data Structures & Storage', modules: [] },
      { milestoneNumber: 3, title: 'Milestone 3: Hierarchical Structures & Searching', modules: [] },
      { milestoneNumber: 4, title: 'Milestone 4: Graphs & Network Algorithms', modules: [] },
      { milestoneNumber: 5, title: 'Milestone 5: Dynamic Programming & Optimization', modules: [] },
      { milestoneNumber: 6, title: 'Milestone 6: Advanced Paradigms & System Mastery', modules: [] }
    ];

    modulesWithStatus.forEach((m) => {
      const group = milestones.find((g) => g.milestoneNumber === m.milestoneNumber);
      if (group) group.modules.push(m);
    });

    const completedCount = modulesWithStatus.filter((m) => m.isCompleted).length;
    const completionPercentage = Number(((completedCount / 30) * 100).toFixed(1));

    res.json({
      success: true,
      totalModules: 30,
      completedCount,
      completionPercentage,
      milestones,
      modules: modulesWithStatus
    });
  } catch (err) {
    next(err);
  }
};

export const toggleModuleComplete = async (req, res, next) => {
  try {
    const moduleNumber = parseInt(req.params.moduleNumber, 10);
    if (isNaN(moduleNumber) || moduleNumber < 1 || moduleNumber > 30) {
      return res.status(400).json({ success: false, message: 'Invalid module number (1-30 required)' });
    }

    const userId = req.user.id;
    const moduleId = `mod_${moduleNumber}`;

    let record = await ModuleProgress.findOne({ user: userId, moduleNumber });
    if (!record) {
      record = await ModuleProgress.create({
        user: userId,
        moduleId,
        moduleNumber,
        isCompleted: true,
        completedAt: new Date()
      });
    } else {
      record.isCompleted = !record.isCompleted;
      record.completedAt = record.isCompleted ? new Date() : null;
      await record.save();
    }

    const completedCount = await ModuleProgress.countDocuments({ user: userId, isCompleted: true });
    const completionPercentage = Number(((completedCount / 30) * 100).toFixed(1));

    res.json({
      success: true,
      moduleNumber,
      isCompleted: record.isCompleted,
      completedCount,
      completionPercentage,
      record
    });
  } catch (err) {
    next(err);
  }
};

