import ollamaService from '../ai/ollamaService.js';
import modelService from '../ai/modelService.js';
import contextBuilder from '../ai/contextBuilder.js';
import { assistantTools, getRelevantTools } from './toolRegistry.js';
import { executeTool } from './toolExecutor.js';
import confirmationService from './confirmationService.js';
import Conversation from '../../models/Conversation.js';
import ConversationMessage from '../../models/ConversationMessage.js';
import AssistantSettings from '../../models/AssistantSettings.js';

/**
 * AssistantAgentService — Master Orchestrator for Local Ollama AI Assistant
 */

const MAX_TOOL_ITERATIONS = Number(process.env.OLLAMA_MAX_TOOL_ITERATIONS) || 5;

export const assistantAgentService = {
  /**
   * Process incoming user message (voice transcript or typed text)
   */
  async processMessage({
    userId,
    conversationId = null,
    message,
    audioUrl = null,
    clientTimezone = 'Asia/Kolkata'
  }) {
    if (!message || !message.trim()) {
      throw new Error('Message content is required');
    }

    const rawMessage = message.trim();

    // 1. Language detection (English, Hindi, Hinglish)
    const isHindiScript = /[\u0900-\u097F]/.test(rawMessage);
    const isHinglish = /\b(aaj|kal|subah|shaam|karna|hai|baje|padhna|khatam|kitne|kya|mujhe|kaise|batao|karo|banao|add karo|check karo)\b/i.test(rawMessage);
    let detectedLanguage = 'en';
    if (isHindiScript) detectedLanguage = 'hi';
    else if (isHinglish) detectedLanguage = 'hinglish';

    // 2. Fetch or create conversation thread
    let conversation = null;
    if (conversationId) {
      conversation = await Conversation.findOne({ _id: conversationId, user: userId });
    }
    if (!conversation) {
      const titleSnippet = rawMessage.slice(0, 32);
      conversation = await Conversation.create({
        user: userId,
        title: titleSnippet.length > 28 ? `${titleSnippet}...` : titleSnippet,
        summary: ''
      });
    }

    // 3. Save incoming user message
    await ConversationMessage.create({
      user: userId,
      conversationId: conversation._id,
      role: 'user',
      content: rawMessage,
      language: detectedLanguage,
      audioUrl
    });

    // 4. Resolve effective local Ollama model
    const { modelName, isInstalled, supportsTools } = await modelService.getEffectiveModel(userId);

    // 4b. Immediate Intent Interceptors: Affirmative Confirmations & Undo
    const trimmedLower = rawMessage.toLowerCase().trim();
    if (/^(yes|confirm|proceed|haan|ha|sure|sahi hai|kar do|kardo)\b/i.test(trimmedLower)) {
      const pending = confirmationService.getPendingForUser(userId);
      if (pending) {
        const execRes = await executeTool({
          userId,
          conversationId: conversation._id,
          toolName: 'confirm_pending_action',
          args: { confirmationToken: pending.token }
        });

        const reply = execRes.result?.message || `Confirmed and executed ${pending.action}.`;
        const assistantMessage = await ConversationMessage.create({
          user: userId,
          conversationId: conversation._id,
          role: 'assistant',
          content: reply,
          language: detectedLanguage,
          toolResults: [execRes]
        });
        conversation.updatedAt = new Date();
        await conversation.save();

        return {
          success: true,
          conversationId: conversation._id,
          messageId: assistantMessage._id,
          message: reply,
          reply,
          language: detectedLanguage,
          toolResults: [execRes],
          modelUsed: 'instant_handler',
          timestamp: new Date().toISOString()
        };
      }
    }

    if (/^(undo|revert|undo that|undo karo|pichla change undo karo|undo action)\b/i.test(trimmedLower)) {
      const execRes = await executeTool({
        userId,
        conversationId: conversation._id,
        toolName: 'undo_last_action',
        args: {}
      });

      const reply = execRes.result?.message || 'Reversed previous action.';
      const assistantMessage = await ConversationMessage.create({
        user: userId,
        conversationId: conversation._id,
        role: 'assistant',
        content: reply,
        language: detectedLanguage,
        toolResults: [execRes]
      });
      conversation.updatedAt = new Date();
      await conversation.save();

      return {
        success: true,
        conversationId: conversation._id,
        messageId: assistantMessage._id,
        message: reply,
        reply,
        language: detectedLanguage,
        toolResults: [execRes],
        modelUsed: 'instant_handler',
        timestamp: new Date().toISOString()
      };
    }

    // 5. Build bounded temporal and workspace context
    const { messages, temporal } = await contextBuilder.buildContext({
      userId,
      conversationId: conversation._id,
      userMessage: rawMessage,
      clientTimezone
    });

    // 6. Tool execution loop with Ollama (Domain-Aware Tool Slicing & Selective Thinking)
    const isComplexPlanning = /syllabus|curriculum|plan my (entire|60-day|month)|generate \d+ modules|deep analysis/i.test(rawMessage);
    const think = isComplexPlanning ? true : false;
    const activeTools = supportsTools ? getRelevantTools(rawMessage) : null;

    let currentMessages = [...messages];
    let executedToolResults = [];
    let finalAssistantContent = '';
    let iterations = 0;
    const executedToolSignatures = new Set();

    while (iterations < MAX_TOOL_ITERATIONS) {
      iterations++;

      // Send to Ollama
      const chatResponse = await ollamaService.chat({
        model: modelName,
        messages: currentMessages,
        tools: activeTools,
        think
      });

      if (!chatResponse.success) {
        // Return clear connection or runtime error
        finalAssistantContent = chatResponse.content;
        break;
      }

      const toolCalls = chatResponse.toolCalls || [];

      // If no tool calls requested, we have our final grounded response
      if (toolCalls.length === 0) {
        finalAssistantContent = chatResponse.content;

        // Check for fallback JSON tool call if model outputted markdown tool call
        const fallbackCalls = this.extractFallbackToolCalls(chatResponse.content);
        if (fallbackCalls.length > 0) {
          for (const fallbackCall of fallbackCalls) {
            if (!executedToolResults.some(r => r.toolName === fallbackCall.name)) {
              const execRes = await executeTool({
                userId,
                conversationId: conversation._id,
                toolName: fallbackCall.name,
                args: fallbackCall.args
              });
              executedToolResults.push(execRes);
            }
          }
          finalAssistantContent = executedToolResults.map(r => r.result?.message || `${r.toolName} completed`).join('. ');
        }
        break;
      }

      // Execute each tool requested by Ollama with duplicate submission prevention
      let newToolsExecuted = 0;
      for (const call of toolCalls) {
        const fnName = call.function?.name;
        let fnArgs = call.function?.arguments || {};
        if (typeof fnArgs === 'string') {
          try {
            fnArgs = JSON.parse(fnArgs);
          } catch (e) {
            fnArgs = {};
          }
        }

        const signature = `${fnName}:${JSON.stringify(fnArgs)}`;
        if (executedToolSignatures.has(signature)) {
          console.warn(`[AssistantAgent] Skipped duplicate tool invocation: ${signature}`);
          continue;
        }
        executedToolSignatures.add(signature);
        newToolsExecuted++;

        const toolResult = await executeTool({
          userId,
          conversationId: conversation._id,
          toolName: fnName,
          args: fnArgs
        });

        executedToolResults.push(toolResult);

        // Feed tool result back to model messages
        currentMessages.push({
          role: 'tool',
          content: JSON.stringify(toolResult.success ? toolResult.result : { error: toolResult.error })
        });
      }

      if (newToolsExecuted === 0) {
        break;
      }
    }

    // Fallback if loop exceeded or empty
    if (!finalAssistantContent && executedToolResults.length > 0) {
      const messagesSummary = executedToolResults.map(r => r.result?.message || `${r.toolName} completed`).join('. ');
      finalAssistantContent = messagesSummary;
    }

    if (!finalAssistantContent) {
      finalAssistantContent = "I've processed your request. Let me know what you'd like to do next!";
    }

    // 7. Persist assistant message in thread
    const assistantMessage = await ConversationMessage.create({
      user: userId,
      conversationId: conversation._id,
      role: 'assistant',
      content: finalAssistantContent,
      language: detectedLanguage,
      toolResults: executedToolResults
    });

    // 8. Update conversation timestamp
    conversation.updatedAt = new Date();
    await conversation.save();

    return {
      success: true,
      conversationId: conversation._id,
      messageId: assistantMessage._id,
      message: finalAssistantContent,
      reply: finalAssistantContent,
      language: detectedLanguage,
      toolResults: executedToolResults,
      modelUsed: modelName,
      timestamp: new Date().toISOString()
    };
  },

  /**
   * Helper to extract JSON tool calls if model wrote raw JSON in message content
   */
  extractFallbackToolCalls(content) {
    if (!content) return [];
    const calls = [];

    // 1. Array of tool calls: [ { "name": ... } ]
    const arrayMatch = content.match(/```(?:json)?\s*(\[[\s\S]*?\])\s*```/);
    if (arrayMatch) {
      try {
        const parsed = JSON.parse(arrayMatch[1]);
        if (Array.isArray(parsed)) {
          for (const item of parsed) {
            if (item.name) calls.push({ name: item.name, args: item.arguments || item.parameters || item.args || {} });
          }
        }
      } catch (e) {}
    }

    // 2. Single object or { "actions": [...] }
    const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/) || content.match(/(\{[\s\S]*"name"\s*:\s*"[a-z_]+"[\s\S]*\})/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[1]);
        if (Array.isArray(parsed.actions)) {
          for (const a of parsed.actions) {
            if (a.name) calls.push({ name: a.name, args: a.arguments || a.parameters || a.args || {} });
          }
        } else if (parsed.name) {
          calls.push({ name: parsed.name, args: parsed.arguments || parsed.parameters || parsed.args || {} });
        }
      } catch (e) {}
    }

    return calls;
  }
};

export default assistantAgentService;
