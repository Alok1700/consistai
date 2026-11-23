import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  X,
  Send,
  Sparkles,
  Bot,
  User,
  CheckCircle2,
  Maximize2,
  Clock,
  Target,
  Brain,
  Bell,
  Languages,
  History,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  MessageSquare
} from 'lucide-react';
import { LocalAIStatus } from '../../features/assistant/components/LocalAIStatus';
import { ActionCard } from '../../features/assistant/components/ActionCard';

type AssistantStatus = 'ready' | 'listening' | 'processing' | 'performing_action' | 'speaking' | 'error';

interface MessageItem {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  language?: string;
  toolResults?: any[];
  timestamp: string;
}

export const GlobalVoiceAssistant: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [status, setStatus] = useState<AssistantStatus>('ready');
  const [messages, setMessages] = useState<MessageItem[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Hello! I am ConsistAI Voice Assistant. You can speak to me in English, Hindi, or Hinglish to create habits, set goals, manage tasks, or check your schedule.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const transcriptRef = useRef<string>('');
  const isSubmittingVoiceRef = useRef<boolean>(false);
  const isOpenRef = useRef<boolean>(isOpen);

  // Fetch Health & Active Local Model
  const { data: healthData, refetch: refetchHealth, isFetching: isFetchingHealth } = useQuery({
    queryKey: ['assistant-health'],
    queryFn: async () => {
      const res = await api.get('/assistant/health');
      return res.data;
    },
    refetchInterval: 20000
  });

  // Fetch Conversation Threads for quick opening
  const { data: convData, refetch: refetchConversations } = useQuery<{
    conversations: { _id: string; title: string; updatedAt: string }[];
  }>({
    queryKey: ['assistant-conversations'],
    queryFn: async () => {
      const res = await api.get('/assistant/conversations');
      return res.data;
    }
  });

  const conversations = convData?.conversations || [];

  // Synchronize isOpenRef and cancel speech when closed
  useEffect(() => {
    isOpenRef.current = isOpen;
    if (!isOpen) {
      stopSpeaking();
      if (recognitionRef.current && status === 'listening') {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
        setStatus('ready');
      }
    }
  }, [isOpen]);

  // Clean up speech synthesis on component unmount
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, status, showHistory]);

  // Speech Recognition Setup (Web Speech API)
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-IN'; // Multi-lingual Indian English / Hindi context

      recognition.onstart = () => {
        setStatus('listening');
        setErrorMessage(null);
        transcriptRef.current = '';
        isSubmittingVoiceRef.current = false;
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        transcriptRef.current = transcript;
        setInputText(transcript);
      };

      recognition.onerror = (event: any) => {
        console.warn('[ConsistAI Voice] Recognition error:', event.error);
        if (event.error !== 'no-speech') {
          setErrorMessage(`Mic error: ${event.error}`);
        }
        setStatus('ready');
      };

      recognition.onend = () => {
        if (status === 'listening') {
          setStatus('ready');
          const spokenText = transcriptRef.current.trim();
          if (spokenText && !isSubmittingVoiceRef.current) {
            isSubmittingVoiceRef.current = true;
            transcriptRef.current = '';
            handleSendMessage(spokenText);
          }
        }
      };

      recognitionRef.current = recognition;
    }
  }, [status, inputText]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      setErrorMessage('Speech recognition not supported in this browser. Please type below.');
      return;
    }

    // Always ensure conversation drawer is open when using voice
    setIsOpen(true);
    setShowHistory(false);

    if (status === 'listening') {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      setStatus('ready');
      const spokenText = (transcriptRef.current || inputText).trim();
      if (spokenText && !isSubmittingVoiceRef.current) {
        isSubmittingVoiceRef.current = true;
        transcriptRef.current = '';
        handleSendMessage(spokenText);
      }
    } else {
      try {
        transcriptRef.current = '';
        isSubmittingVoiceRef.current = false;
        recognitionRef.current.start();
      } catch (e) {
        console.warn('Recognition start error:', e);
      }
    }
  };

  const stopSpeaking = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setStatus('ready');
  };

  const handleCloseDrawer = () => {
    stopSpeaking();
    if (recognitionRef.current && status === 'listening') {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      setStatus('ready');
    }
    setIsOpen(false);
    setShowHistory(false);
  };

  const handleSpeakText = (text: string) => {
    if (!isOpenRef.current || !voiceEnabled || !window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      setStatus('speaking');
      utterance.onend = () => setStatus('ready');
      utterance.onerror = () => setStatus('ready');
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('TTS error:', e);
      setStatus('ready');
    }
  };

  const handleSelectConversation = async (convId: string) => {
    stopSpeaking();
    setActiveConversationId(convId);
    setShowHistory(false);
    try {
      const res = await api.get(`/assistant/conversations/${convId}`);
      if (res.data?.messages) {
        setMessages(
          res.data.messages.map((m: any) => ({
            id: m._id,
            role: m.role,
            content: m.content,
            language: m.language,
            toolResults: m.toolCalls,
            timestamp: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }))
        );
      }
    } catch (e) {
      console.warn('Failed to load conversation:', e);
    }
  };

  const handleDeleteConversation = async (e: React.MouseEvent, convId: string) => {
    e.stopPropagation();
    stopSpeaking();
    try {
      await api.delete(`/assistant/conversations/${convId}`);
      if (activeConversationId === convId) {
        handleNewConversation();
      }
      refetchConversations();
    } catch (e) {
      console.warn('Delete conversation failed:', e);
    }
  };

  const handleNewConversation = () => {
    stopSpeaking();
    setActiveConversationId(null);
    setShowHistory(false);
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: 'assistant',
        content: 'New conversation started. How can I support your productivity today?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const prompt = (textToSend || inputText).trim();
    if (!prompt) return;

    // Ensure conversation panel is opened and visible when sending
    setIsOpen(true);
    setShowHistory(false);

    setInputText('');
    setErrorMessage(null);

    const userMsg: MessageItem = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: prompt,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages((prev) => [...prev, userMsg]);
    setStatus('processing');

    try {
      const res = await api.post('/assistant/chat', {
        message: prompt,
        conversationId: activeConversationId
      });

      const data = res.data;
      if (data.conversationId) {
        setActiveConversationId(data.conversationId);
        refetchConversations();
      }

      const replyContent = data.reply || data.message || data.spokenText || 'Request completed.';

      const assistantMsg: MessageItem = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: replyContent,
        language: data.language,
        toolResults: data.toolResults || data.toolCalls || [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, assistantMsg]);
      setStatus('ready');

      // Invalidate relevant queries if tools mutated data or to update workspace
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['tasks-today'] });
      queryClient.invalidateQueries({ queryKey: ['overview-stats'] });
      queryClient.invalidateQueries({ queryKey: ['assistant-today-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['assistant-goals'] });
      queryClient.invalidateQueries({ queryKey: ['assistant-reminders'] });
      queryClient.invalidateQueries({ queryKey: ['assistant-conversations'] });
      queryClient.invalidateQueries({ queryKey: ['assistant-action-history'] });

      // Auto-speak response ONLY if drawer is still open and voice is enabled
      if (replyContent && isOpenRef.current && voiceEnabled) {
        handleSpeakText(replyContent);
      }
    } catch (err: any) {
      console.error('[ConsistAI Assistant] Chat failure:', err);
      setStatus('error');
      setErrorMessage(err.response?.data?.message || 'Failed to process request. Please try again.');
      setTimeout(() => setStatus('ready'), 3000);
    }
  };

  const handleUndoAction = async (executionId?: string) => {
    try {
      setStatus('processing');
      let res;
      if (executionId) {
        res = await api.post(`/assistant/actions/${executionId}/undo`);
      } else {
        res = await api.post('/assistant/chat', {
          message: 'undo',
          conversationId: activeConversationId
        });
      }
      const msgText = res.data?.result?.message || res.data?.message || 'Previous action undone successfully.';
      setMessages((prev) => [
        ...prev,
        {
          id: `undo-${Date.now()}`,
          role: 'assistant',
          content: msgText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);

      queryClient.invalidateQueries({ queryKey: ['habits'] });
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['tasks-today'] });
      queryClient.invalidateQueries({ queryKey: ['overview-stats'] });
      queryClient.invalidateQueries({ queryKey: ['assistant-today-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['assistant-goals'] });
      queryClient.invalidateQueries({ queryKey: ['assistant-reminders'] });
      queryClient.invalidateQueries({ queryKey: ['assistant-action-history'] });

      setStatus('ready');
      if (isOpenRef.current && voiceEnabled) handleSpeakText(msgText);
    } catch (err: any) {
      setStatus('ready');
      setErrorMessage(err.response?.data?.message || 'Failed to undo action.');
      setTimeout(() => setErrorMessage(null), 3000);
    }
  };

  const handleConfirmAction = async (token: string) => {
    try {
      setStatus('processing');
      const res = await api.post('/assistant/actions/confirm', { confirmationToken: token });
      const msgText = res.data?.result?.message || res.data?.message || 'Action confirmed and executed successfully.';
      setMessages((prev) => [
        ...prev,
        {
          id: `confirm-${Date.now()}`,
          role: 'assistant',
          content: msgText,
          toolResults: [res.data],
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);

      queryClient.invalidateQueries({ queryKey: ['habits'] });
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['tasks-today'] });
      queryClient.invalidateQueries({ queryKey: ['overview-stats'] });
      queryClient.invalidateQueries({ queryKey: ['assistant-today-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['assistant-goals'] });
      queryClient.invalidateQueries({ queryKey: ['assistant-reminders'] });
      queryClient.invalidateQueries({ queryKey: ['assistant-action-history'] });

      setStatus('ready');
      if (isOpenRef.current && voiceEnabled) handleSpeakText(msgText);
    } catch (err: any) {
      setStatus('ready');
      setErrorMessage(err.response?.data?.message || 'Failed to confirm action.');
      setTimeout(() => setErrorMessage(null), 3000);
    }
  };

  const promptSuggestions = [
    "Add habit: Morning 30 mins LeetCode",
    "Create goal: Master Web Development",
    "What's my schedule today?",
    "Start a 25-minute focus session",
    "How is my consistency progress?"
  ];

  return (
    <>
      {/* FLOATING ACTION MIC BUTTON (ALWAYS VISIBLE BOTTOM-RIGHT) */}
      <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3">
        {status === 'speaking' && (
          <button
            type="button"
            onClick={stopSpeaking}
            className="px-3 py-1.5 rounded-full bg-[#161E2E] border border-[#263247] text-xs font-semibold text-[#EF4444] shadow-lg flex items-center gap-1.5 hover:bg-[#1C2638] cursor-pointer"
          >
            <VolumeX className="w-3.5 h-3.5" />
            <span>Stop Speaking</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => {
            if (isOpen) {
              handleCloseDrawer();
            } else {
              setIsOpen(true);
            }
          }}
          className={`relative p-4 rounded-full shadow-2xl transition-all cursor-pointer flex items-center justify-center ${
            isOpen
              ? 'bg-[#8B5CF6] text-white shadow-purple-600/50 scale-105'
              : status === 'listening'
              ? 'bg-[#EF4444] text-white ring-4 ring-[#EF4444]/40 animate-pulse'
              : 'bg-gradient-to-tr from-[#7C3AED] to-[#8B5CF6] text-white hover:scale-105 hover:shadow-purple-600/40'
          }`}
          title="ConsistAI Voice Assistant"
        >
          {status === 'listening' ? (
            <Mic className="w-6 h-6 animate-bounce" />
          ) : isOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Sparkles className="w-6 h-6" />
          )}

          {/* Active Status Beacon */}
          <span
            className={`absolute top-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-[#0B0F19] ${
              status === 'listening'
                ? 'bg-[#EF4444] animate-ping'
                : status === 'processing'
                ? 'bg-[#38BDF8] animate-pulse'
                : status === 'speaking'
                ? 'bg-[#10B981]'
                : 'bg-[#8B5CF6]'
            }`}
          />
        </button>
      </div>

      {/* EXPANDABLE CONVERSATION DRAWER / PANEL */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-[92vw] sm:w-[420px] max-h-[640px] h-[82vh] bg-[#111827] border border-[#263247] rounded-3xl shadow-2xl z-50 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-200">
          {/* Header */}
          <div className="p-4 bg-[#161E2E] border-b border-[#263247] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-[#8B5CF6]/15 text-[#8B5CF6] border border-[#8B5CF6]/30">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h3 className="text-sm font-bold text-white">ConsistAI Voice</h3>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#8B5CF6]/20 text-[#8B5CF6] border border-[#8B5CF6]/30">
                    AI Agent
                  </span>
                  <LocalAIStatus
                    online={Boolean(healthData?.online ?? (healthData?.status === 'ok'))}
                    modelName={healthData?.activeModel || 'qwen3.5:4b'}
                    latencyMs={healthData?.latencyMs}
                    isLoading={isFetchingHealth}
                    onRefresh={() => refetchHealth()}
                  />
                </div>
                <div className="flex items-center gap-2 text-[11px] text-[#94A3B8]">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      status === 'listening'
                        ? 'bg-[#EF4444] animate-pulse'
                        : status === 'processing'
                        ? 'bg-[#38BDF8] animate-spin'
                        : status === 'speaking'
                        ? 'bg-[#10B981]'
                        : 'bg-[#10B981]'
                    }`}
                  />
                  <span className="capitalize">{status.replace('_', ' ')}</span>
                  <span>·</span>
                  <span>EN / HI / Hinglish</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {(status === 'listening' || status === 'speaking') && (
                <div className="flex items-center gap-0.5 px-2 py-1 rounded-lg bg-[#0B0F19] border border-[#263247] h-6 mr-1">
                  <span className={`w-1 rounded-full animate-bounce [animation-delay:-0.3s] h-2.5 ${status === 'listening' ? 'bg-red-400' : 'bg-emerald-400'}`} />
                  <span className={`w-1 rounded-full animate-bounce [animation-delay:-0.15s] h-4 ${status === 'listening' ? 'bg-red-400' : 'bg-emerald-400'}`} />
                  <span className={`w-1 rounded-full animate-bounce h-2 ${status === 'listening' ? 'bg-red-400' : 'bg-emerald-400'}`} />
                  <span className={`w-1 rounded-full animate-bounce [animation-delay:-0.2s] h-4.5 ${status === 'listening' ? 'bg-red-400' : 'bg-emerald-400'}`} />
                  <span className={`w-1 rounded-full animate-bounce [animation-delay:-0.4s] h-3 ${status === 'listening' ? 'bg-red-400' : 'bg-emerald-400'}`} />
                </div>
              )}
              {/* Toggle Conversation History */}
              <button
                type="button"
                onClick={() => setShowHistory(!showHistory)}
                className={`p-2 rounded-xl border text-xs transition cursor-pointer ${
                  showHistory
                    ? 'bg-[#8B5CF6]/25 text-[#8B5CF6] border-[#8B5CF6]/50'
                    : 'bg-[#1C2638] text-[#94A3B8] border-[#263247] hover:text-white'
                }`}
                title={showHistory ? 'Return to Conversation' : 'Past Conversations'}
              >
                <History className="w-4 h-4" />
              </button>

              {/* Start Fresh Conversation */}
              <button
                type="button"
                onClick={handleNewConversation}
                className="p-2 rounded-xl bg-[#1C2638] border border-[#263247] text-[#94A3B8] hover:text-white hover:border-[#8B5CF6]/40 transition cursor-pointer"
                title="New Conversation"
              >
                <Plus className="w-4 h-4" />
              </button>

              {/* Speech Voice Output Toggle */}
              <button
                type="button"
                onClick={() => {
                  if (voiceEnabled) stopSpeaking();
                  setVoiceEnabled(!voiceEnabled);
                }}
                className={`p-2 rounded-xl border text-xs transition cursor-pointer ${
                  voiceEnabled
                    ? 'bg-[#8B5CF6]/20 text-[#8B5CF6] border-[#8B5CF6]/40'
                    : 'bg-[#1C2638] text-[#94A3B8] border-[#263247]'
                }`}
                title={voiceEnabled ? 'Mute Assistant Voice' : 'Enable Assistant Voice'}
              >
                {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>

              {/* Maximize to full page */}
              <button
                type="button"
                onClick={() => {
                  handleCloseDrawer();
                  navigate('/assistant');
                }}
                className="p-2 rounded-xl bg-[#1C2638] border border-[#263247] text-[#94A3B8] hover:text-white transition cursor-pointer"
                title="Open Fullscreen Assistant"
              >
                <Maximize2 className="w-4 h-4" />
              </button>

              {/* Close Drawer Button */}
              <button
                type="button"
                onClick={handleCloseDrawer}
                className="p-2 rounded-xl bg-[#1C2638] border border-[#263247] text-[#94A3B8] hover:text-white transition cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Body Area: Conversation History OR Live Messages */}
          {showHistory ? (
            <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-[#0B0F19]/40">
              <div className="flex items-center justify-between pb-2 border-b border-[#263247]/60 mb-2">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5 text-[#8B5CF6]" />
                  <span>Recent Conversations</span>
                </span>
                <button
                  type="button"
                  onClick={handleNewConversation}
                  className="text-[11px] font-semibold text-[#8B5CF6] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>New Chat</span>
                </button>
              </div>

              {conversations.length === 0 ? (
                <div className="p-8 text-center text-xs text-[#64748B]">
                  No previous conversations found.
                </div>
              ) : (
                conversations.map((c) => (
                  <div
                    key={c._id}
                    onClick={() => handleSelectConversation(c._id)}
                    className={`group p-3 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
                      activeConversationId === c._id
                        ? 'bg-[#8B5CF6]/20 text-white border-[#8B5CF6]/50 font-semibold'
                        : 'bg-[#161E2E] text-[#94A3B8] border-[#263247] hover:text-white hover:border-[#8B5CF6]/40'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate flex-1 pr-2">
                      <MessageSquare className="w-4 h-4 text-[#8B5CF6] shrink-0" />
                      <div className="truncate">
                        <p className="text-xs font-medium truncate text-[#F8FAFC]">
                          {c.title || 'Conversation'}
                        </p>
                        <p className="text-[10px] text-[#64748B]">
                          {c.updatedAt
                            ? new Date(c.updatedAt).toLocaleDateString([], {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })
                            : 'Recent'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => handleDeleteConversation(e, c._id)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-[#64748B] hover:text-red-400 transition cursor-pointer"
                        title="Delete conversation"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <ChevronRight className="w-3.5 h-3.5 text-[#64748B]" />
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            /* Messages Scroll Area */
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-[#0B0F19]/40">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-7 h-7 rounded-xl bg-[#8B5CF6]/20 text-[#8B5CF6] border border-[#8B5CF6]/30 flex items-center justify-center shrink-0 mt-0.5">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                  )}

                  <div
                    className={`max-w-[82%] rounded-2xl p-3 text-xs leading-relaxed space-y-2 ${
                      msg.role === 'user'
                        ? 'bg-[#8B5CF6] text-white shadow-md rounded-tr-sm'
                        : 'bg-[#161E2E] text-[#F8FAFC] border border-[#263247] rounded-tl-sm'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>

                    {/* Tool Execution Results Banner */}
                    {msg.toolResults && msg.toolResults.length > 0 && (
                      <div className="pt-2 border-t border-[#263247] space-y-2">
                        {msg.toolResults.map((tr: any, idx: number) => (
                          <ActionCard
                            key={idx}
                            toolResult={tr}
                            onUndo={handleUndoAction}
                            onConfirm={handleConfirmAction}
                          />
                        ))}
                      </div>
                    )}

                    <div
                      className={`text-[10px] text-right font-mono ${
                        msg.role === 'user' ? 'text-purple-200' : 'text-[#64748B]'
                      }`}
                    >
                      {msg.timestamp}
                    </div>
                  </div>

                  {msg.role === 'user' && (
                    <div className="w-7 h-7 rounded-xl bg-[#1C2638] text-white border border-[#263247] flex items-center justify-center shrink-0 mt-0.5">
                      <User className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
              ))}

              {status === 'processing' && (
                <div className="flex items-center gap-2 text-xs text-[#94A3B8] p-2 rounded-xl bg-[#161E2E] border border-[#263247] w-fit">
                  <Sparkles className="w-4 h-4 text-[#8B5CF6] animate-spin" />
                  <span>ConsistAI is thinking & coordinating tools...</span>
                </div>
              )}

              {errorMessage && (
                <div className="p-2.5 rounded-xl bg-red-950/40 border border-red-800/40 text-xs text-red-300">
                  {errorMessage}
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}

          {/* Quick Suggestion Chips */}
          <div className="px-3 py-2 bg-[#111827] border-t border-[#263247] overflow-x-auto no-scrollbar flex items-center gap-1.5">
            {promptSuggestions.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendMessage(p)}
                className="whitespace-nowrap px-2.5 py-1 rounded-lg bg-[#161E2E] border border-[#263247] text-[11px] text-[#94A3B8] hover:text-white hover:border-[#8B5CF6]/40 transition cursor-pointer"
              >
                {p}
              </button>
            ))}
          </div>

          {/* Input & Voice Controls Footer */}
          <div className="p-3 bg-[#161E2E] border-t border-[#263247] space-y-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleListening}
                className={`p-2.5 rounded-xl border transition cursor-pointer shrink-0 ${
                  status === 'listening'
                    ? 'bg-[#EF4444] text-white border-[#EF4444] animate-pulse ring-2 ring-[#EF4444]/40'
                    : 'bg-[#1C2638] text-[#8B5CF6] border-[#263247] hover:bg-[#8B5CF6]/15 hover:border-[#8B5CF6]/40'
                }`}
                title={status === 'listening' ? 'Stop Listening' : 'Speak to Assistant'}
              >
                {status === 'listening' ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSendMessage();
                }}
                placeholder={status === 'listening' ? 'Listening...' : 'Type or speak a command...'}
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#111827] border border-[#263247] text-xs text-[#F8FAFC] placeholder-[#64748B] focus:outline-none focus:border-[#8B5CF6]"
              />

              <button
                type="button"
                onClick={() => handleSendMessage()}
                disabled={!inputText.trim()}
                className="p-2.5 rounded-xl bg-[#8B5CF6] text-white hover:bg-[#7C3AED] disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
