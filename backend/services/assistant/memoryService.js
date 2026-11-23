import AssistantMemory from '../../models/AssistantMemory.js';
import ollamaService from '../ai/ollamaService.js';

/**
 * MemoryService — Persistent Personal Memory for ConsistAI Voice & Ollama Assistant
 */

export const memoryService = {
  /**
   * Search memory using semantic similarity if embedding available, or keyword search
   */
  async searchMemories(userId, queryText, limit = 5) {
    if (!queryText || !queryText.trim()) {
      return AssistantMemory.find({ user: userId }).sort({ createdAt: -1 }).limit(limit);
    }

    const cleanQuery = queryText.trim();

    // 1. Check if semantic embedding can be generated
    const queryEmbedding = await ollamaService.generateEmbedding({ input: cleanQuery });

    if (queryEmbedding && Array.isArray(queryEmbedding)) {
      const memories = await AssistantMemory.find({
        user: userId,
        embedding: { $exists: true, $ne: [] }
      });

      if (memories.length > 0) {
        // Compute cosine similarity
        const scored = memories.map((m) => {
          const sim = cosineSimilarity(queryEmbedding, m.embedding);
          return { memory: m, score: sim };
        });

        scored.sort((a, b) => b.score - a.score);
        return scored.slice(0, limit).map(s => s.memory);
      }
    }

    // 2. Keyword regex fallback
    return AssistantMemory.find({
      user: userId,
      content: new RegExp(cleanQuery, 'i')
    })
      .sort({ importance: -1, createdAt: -1 })
      .limit(limit);
  },

  /**
   * Save a memory with optional vector embedding
   */
  async saveMemory({ userId, content, category = 'fact', importance = 'medium' }) {
    if (!content || !content.trim()) throw new Error('Content is required');

    let embedding = [];
    try {
      embedding = await ollamaService.generateEmbedding({ input: content.trim() }) || [];
    } catch (e) {
      // Embedding optional
    }

    return AssistantMemory.create({
      user: userId,
      content: content.trim(),
      category,
      importance,
      embedding
    });
  }
};

function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  let dotProduct = 0;
  let mA = 0;
  let mB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    mA += vecA[i] * vecA[i];
    mB += vecB[i] * vecB[i];
  }
  mA = Math.sqrt(mA);
  mB = Math.sqrt(mB);
  if (mA === 0 || mB === 0) return 0;
  return dotProduct / (mA * mB);
}

export default memoryService;
