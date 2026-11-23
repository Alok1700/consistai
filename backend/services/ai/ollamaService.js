import axios from 'axios';

/**
 * OllamaService — Authoritative Local AI Integration Client for ConsistAI
 * 
 * Interacts directly with native Ollama REST API endpoints:
 * - GET  /api/tags    - Discover installed models & capabilities
 * - POST /api/show    - Inspect model information & parameters
 * - POST /api/chat    - Conversational inference & tool execution
 * - POST /api/embed   - Semantic memory embeddings
 * - GET  /api/ps      - Inspect loaded models in GPU/CPU memory
 */

const getBaseUrl = () => {
  return (process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434').replace(/\/+$/, '');
};

const getDefaultModel = () => {
  return process.env.OLLAMA_MODEL || 'qwen3.5:4b';
};

const getTimeoutMs = () => {
  return Number(process.env.OLLAMA_TIMEOUT_MS) || 180000;
};

export const ollamaService = {
  /**
   * Check connection health to local Ollama server
   */
  async checkHealth() {
    const start = Date.now();
    const baseUrl = getBaseUrl();
    try {
      const res = await axios.get(`${baseUrl}/api/tags`, {
        timeout: 5000
      });
      const latencyMs = Date.now() - start;
      const models = res.data?.models || [];
      return {
        online: true,
        baseUrl,
        latencyMs,
        modelsCount: models.length,
        models: models.map(m => m.name),
        error: null
      };
    } catch (err) {
      return {
        online: false,
        baseUrl,
        latencyMs: null,
        modelsCount: 0,
        models: [],
        error: err.code === 'ECONNREFUSED'
          ? 'Your local AI server is unavailable. Start Ollama and try again.'
          : err.message
      };
    }
  },

  /**
   * Discover installed models and extract detailed metadata & capabilities
   */
  async getInstalledModels() {
    const baseUrl = getBaseUrl();
    try {
      const res = await axios.get(`${baseUrl}/api/tags`, {
        timeout: 10000
      });
      const rawModels = res.data?.models || [];

      return rawModels.map((m) => {
        const capabilities = m.capabilities || [];
        const supportsTools = capabilities.includes('tools') ||
          (m.name && (m.name.includes('qwen') || m.name.includes('gemma') || m.name.includes('llama3')));

        return {
          name: m.name,
          model: m.model || m.name,
          sizeBytes: m.size,
          sizeGb: (m.size / (1024 * 1024 * 1024)).toFixed(2),
          parameterSize: m.details?.parameter_size || 'Unknown',
          family: m.details?.family || 'Unknown',
          quantization: m.details?.quantization_level || 'Unknown',
          contextLength: m.details?.context_length || 32768,
          capabilities,
          supportsTools,
          supportsThinking: capabilities.includes('thinking'),
          supportsVision: capabilities.includes('vision'),
          modifiedAt: m.modified_at
        };
      });
    } catch (err) {
      console.warn('[OllamaService] Could not fetch installed models:', err.message);
      return [];
    }
  },

  /**
   * Inspect currently running/loaded models in RAM/VRAM
   */
  async getRunningModels() {
    const baseUrl = getBaseUrl();
    try {
      const res = await axios.get(`${baseUrl}/api/ps`, {
        timeout: 5000
      });
      return res.data?.models || [];
    } catch (err) {
      return [];
    }
  },

  /**
   * Inspect specific model information and capabilities
   */
  async inspectModel(modelName) {
    const baseUrl = getBaseUrl();
    const targetModel = modelName || getDefaultModel();
    try {
      const res = await axios.post(`${baseUrl}/api/show`, {
        name: targetModel
      }, { timeout: 10000 });
      return { success: true, data: res.data };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  /**
   * Conversational Chat with structured tools, think control, and cancellation
   */
  async chat({
    model,
    messages = [],
    tools = null,
    format = undefined,
    temperature = undefined,
    contextLength = undefined,
    think = undefined,
    signal = undefined,
    stream = false
  }) {
    const baseUrl = getBaseUrl();
    const selectedModel = model || getDefaultModel();
    const timeout = getTimeoutMs();

    const options = {
      temperature: temperature !== undefined ? Number(temperature) : Number(process.env.OLLAMA_TEMPERATURE || 0.2),
      num_ctx: contextLength !== undefined ? Number(contextLength) : Number(process.env.OLLAMA_CONTEXT_LENGTH || 8192)
    };

    if (think !== undefined) {
      options.think = Boolean(think);
    }

    const payload = {
      model: selectedModel,
      messages,
      stream,
      keep_alive: process.env.OLLAMA_KEEP_ALIVE || '5m',
      options
    };

    if (think !== undefined) {
      payload.think = Boolean(think);
    }

    if (tools && Array.isArray(tools) && tools.length > 0) {
      payload.tools = tools;
    }

    if (format === 'json') {
      payload.format = 'json';
    }

    const axiosConfig = {
      timeout,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    if (signal) {
      axiosConfig.signal = signal;
    }

    try {
      const res = await axios.post(`${baseUrl}/api/chat`, payload, axiosConfig);

      const message = res.data?.message || {};
      return {
        success: true,
        role: message.role || 'assistant',
        content: message.content || '',
        toolCalls: message.tool_calls || [],
        thinking: message.thinking || null,
        model: res.data?.model || selectedModel,
        totalDuration: res.data?.total_duration,
        evalCount: res.data?.eval_count,
        evalDuration: res.data?.eval_duration
      };
    } catch (err) {
      if (axios.isCancel(err) || err.name === 'CanceledError' || err.name === 'AbortError') {
        return {
          success: false,
          error: 'Request cancelled by user or timeout.',
          isCancelled: true,
          role: 'assistant',
          content: 'The request was cancelled.',
          toolCalls: []
        };
      }
      const isConnectionRefused = err.code === 'ECONNREFUSED' || (err.message && err.message.includes('ECONNREFUSED'));
      const errorMsg = isConnectionRefused
        ? 'Your local AI server is unavailable. Start Ollama and try again.'
        : (err.response?.data?.error || err.message || 'Ollama request failed');

      return {
        success: false,
        error: errorMsg,
        isConnectionError: isConnectionRefused,
        role: 'assistant',
        content: `I am currently unable to reach your local AI model (${selectedModel}). ${errorMsg}`,
        toolCalls: []
      };
    }
  },

  /**
   * Stream conversational chat chunks from Ollama
   */
  async chatStream({
    model,
    messages = [],
    tools = null,
    format = undefined,
    temperature = undefined,
    contextLength = undefined,
    think = undefined,
    signal = undefined,
    onChunk
  }) {
    const baseUrl = getBaseUrl();
    const selectedModel = model || getDefaultModel();
    const timeout = getTimeoutMs();

    const options = {
      temperature: temperature !== undefined ? Number(temperature) : Number(process.env.OLLAMA_TEMPERATURE || 0.2),
      num_ctx: contextLength !== undefined ? Number(contextLength) : Number(process.env.OLLAMA_CONTEXT_LENGTH || 8192)
    };

    if (think !== undefined) {
      options.think = Boolean(think);
    }

    const payload = {
      model: selectedModel,
      messages,
      stream: true,
      keep_alive: process.env.OLLAMA_KEEP_ALIVE || '5m',
      options
    };

    if (think !== undefined) {
      payload.think = Boolean(think);
    }
    if (tools && Array.isArray(tools) && tools.length > 0) {
      payload.tools = tools;
    }
    if (format === 'json') {
      payload.format = 'json';
    }

    const res = await axios.post(`${baseUrl}/api/chat`, payload, {
      timeout,
      responseType: 'stream',
      headers: { 'Content-Type': 'application/json' },
      signal
    });

    return new Promise((resolve, reject) => {
      let accumulatedContent = '';
      let toolCalls = [];

      res.data.on('data', (chunk) => {
        const lines = chunk.toString().split('\n').filter(Boolean);
        for (const line of lines) {
          try {
            const parsed = JSON.parse(line);
            if (parsed.message?.content) {
              accumulatedContent += parsed.message.content;
              if (onChunk) onChunk(parsed.message.content);
            }
            if (parsed.message?.tool_calls) {
              toolCalls.push(...parsed.message.tool_calls);
            }
          } catch (e) {}
        }
      });

      res.data.on('end', () => {
        resolve({
          success: true,
          content: accumulatedContent,
          toolCalls
        });
      });

      res.data.on('error', (err) => {
        reject(err);
      });
    });
  },

  /**
   * Generate vector embeddings for semantic memory
   */
  async generateEmbedding({ input, model }) {
    const baseUrl = getBaseUrl();
    const embeddingModel = model || process.env.OLLAMA_EMBEDDING_MODEL || getDefaultModel();

    try {
      // 1. Try modern /api/embed endpoint
      const res = await axios.post(`${baseUrl}/api/embed`, {
        model: embeddingModel,
        input
      }, { timeout: 15000 });

      if (res.data?.embeddings && res.data.embeddings[0]) {
        return res.data.embeddings[0];
      }
    } catch (embedErr) {
      // 2. Try legacy /api/embeddings endpoint
      try {
        const legacyRes = await axios.post(`${baseUrl}/api/embeddings`, {
          model: embeddingModel,
          prompt: typeof input === 'string' ? input : input[0]
        }, { timeout: 15000 });

        if (legacyRes.data?.embedding) {
          return legacyRes.data.embedding;
        }
      } catch (legacyErr) {
        // Embeddings not supported on this Ollama server build; fallback gracefully
        return null;
      }
    }

    return null;
  },

  /**
   * Test Connection with lightweight ping
   */
  async testConnection(modelName) {
    const start = Date.now();
    const targetModel = modelName || getDefaultModel();
    const chatResult = await this.chat({
      model: targetModel,
      messages: [{ role: 'user', content: 'Respond with the single word: "READY"' }],
      temperature: 0.1
    });

    const latencyMs = Date.now() - start;
    if (chatResult.success) {
      return {
        success: true,
        model: targetModel,
        latencyMs,
        response: chatResult.content.trim(),
        message: `Successfully connected to local model ${targetModel} in ${latencyMs}ms.`
      };
    } else {
      return {
        success: false,
        model: targetModel,
        latencyMs,
        error: chatResult.error,
        message: chatResult.error
      };
    }
  }
};

export default ollamaService;
