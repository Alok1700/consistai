import ollamaService from './ollamaService.js';
import AssistantSettings from '../../models/AssistantSettings.js';

/**
 * ModelService — Local Model Capability & Preference Resolver
 */

export const modelService = {
  /**
   * Get effective model for a user (checks user setting -> env -> installed models)
   */
  async getEffectiveModel(userId = null) {
    let preferredModel = null;
    if (userId) {
      try {
        const settings = await AssistantSettings.findOne({ user: userId });
        if (settings?.preferredModel) {
          preferredModel = settings.preferredModel;
        }
      } catch (e) {
        // Fall back to env
      }
    }

    if (!preferredModel) {
      preferredModel = process.env.OLLAMA_MODEL || 'qwen3.5:4b';
    }

    // Check if preferred model is actually installed
    const installed = await ollamaService.getInstalledModels();
    if (installed.length === 0) {
      return {
        modelName: preferredModel,
        isInstalled: false,
        supportsTools: true,
        installedModels: []
      };
    }

    const matched = installed.find((m) => m.name === preferredModel || m.model === preferredModel);
    if (matched) {
      return {
        modelName: matched.name,
        isInstalled: true,
        supportsTools: matched.supportsTools,
        installedModels: installed
      };
    }

    // Default to first installed model that supports tools, or first installed model
    const toolModel = installed.find((m) => m.supportsTools) || installed[0];
    return {
      modelName: toolModel.name,
      isInstalled: true,
      supportsTools: toolModel.supportsTools,
      installedModels: installed
    };
  },

  /**
   * Save user's preferred local model
   */
  async setUserPreferredModel(userId, modelName) {
    return AssistantSettings.findOneAndUpdate(
      { user: userId },
      { preferredModel: modelName },
      { upsert: true, new: true }
    );
  }
};

export default modelService;
