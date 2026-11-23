import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Send,
  Sparkles,
  Bot,
  User,
  CheckCircle2,
  Plus,
  Trash2,
  Brain,
  Bell,
  Clock,
  Target,
  ChevronRight,
  Flame,
  Languages,
  RotateCcw,
  History
} from 'lucide-react';
import { LocalAIStatus } from '../features/assistant/components/LocalAIStatus';
import { ActionCard } from '../features/assistant/components/ActionCard';

interface Conversation {
  _id: string;
  title: string;
  lastMessageAt: string;
}

interface MessageItem {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  language?: string;
  toolResults?: any[];
  timestamp: string;
}

export const AssistantPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Namaste & Welcome! I am your ConsistAI Personal Secretary and Coach. Speak to me in English, Hindi, or Hinglish. Ask me about your tasks, ask me to record notes or start a focus session!',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [status, setStatus] = useState<'ready' | 'listening' | 'processing' | 'speaking' | 'error'>('ready');
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [sidebarTab, setSidebarTab] = useState<'workspace' | 'history'>('workspace');

  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const transcriptRef = useRef<string>('');
  const isSubmittingVoiceRef = useRef<boolean>(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, status]);

  // Clean up speech synthesis when component unmounts
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Fetch Health & Active Local Model
  const { data: healthData, refetch: refetchHealth, isFetching: isFetchingHealth } = useQuery({
    queryKey: ['assistant-health'],
    queryFn: async () => {
      const res = await api.get('/assistant/health');
      return res.data;
    },
    refetchInterval: 20000
  });

  // Fetch Conversation Threads
  const { data: convData, refetch: refetchConversations } = useQuery<{ conversations: Conversation[] }>({
    queryKey: ['assistant-conversations'],
    queryFn: async () => {
      const res = await api.get('/assistant/conversations');
      return res.data;
    }
  });

  const conversations = convData?.conversations || [];

  // Fetch Today's Tasks for Context Panel
  const { data: todayTasksData } = useQuery({
    queryKey: ['assistant-today-tasks'],
    queryFn: async () => {
      const res = await api.get('/tasks/today');
      return res.data;
    }
  });

  // Fetch Active Goals for Context Panel
  const { data: goalsData } = useQuery({
    queryKey: ['assistant-goals'],
    queryFn: async () => {
      const res = await api.get('/goals');
      return res.data;
    }
  });

  // Fetch Reminders
  const { data: remindersData } = useQuery({
    queryKey: ['assistant-reminders'],
    queryFn: async () => {
      const res = await api.get('/assistant/reminders');
      return res.data;
    }
  });

  // Fetch Action History for Context Panel
  const { data: actionHistoryData, refetch: refetchActionHistory, isFetching: isFetchingHistory } = useQuery({
    queryKey: ['assistant-action-history'],
    queryFn: async () => {
      const res = await api.get('/assistant/actions/history?limit=25');
      return res.data;
    }
  });

  // Speech Recognition Setup
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-IN';

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
        if (event.error !== 'no-speech') {
          setErrorMessage(`Mic notice: ${event.error}`);
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
      setErrorMessage('Speech recognition is not supported in this browser. Please type.');
      return;
    }

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
      } catch (e) {}
    }
  };

  const stopSpeaking = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setStatus('ready');
  };

  const handleSpeakText = (text: string) => {
    if (!voiceEnabled || !window.speechSynthesis) return;
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
      setStatus('ready');
    }
  };

  const handleSelectConversation = async (convId: string) => {
    if (activeConversationId === convId) return;
    stopSpeaking();
    setActiveConversationId(convId);
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
      console.warn('Failed to delete conversation:', e);
    }
  };

  const handleNewConversation = () => {
    stopSpeaking();
    setActiveConversationId(null);
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: 'assistant',
        content: 'New conversation started. How can I support your productivity today?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  const handleSendMessage = async (customPrompt?: string) => {
    const prompt = (customPrompt || inputText).trim();
    if (!prompt) return;

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

      // Invalidate relevant queries if tools mutated data
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['assistant-goals'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['tasks-today'] });
      queryClient.invalidateQueries({ queryKey: ['assistant-today-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['assistant-reminders'] });
      queryClient.invalidateQueries({ queryKey: ['assistant-action-history'] });
      queryClient.invalidateQueries({ queryKey: ['overview-stats'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });

      if (replyContent) {
        handleSpeakText(replyContent);
      }
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err.response?.data?.message || 'Failed to reach assistant server.');
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
      queryClient.invalidateQueries({ queryKey: ['assistant-goals'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['tasks-today'] });
      queryClient.invalidateQueries({ queryKey: ['assistant-today-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['assistant-reminders'] });
      queryClient.invalidateQueries({ queryKey: ['assistant-action-history'] });
      queryClient.invalidateQueries({ queryKey: ['overview-stats'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });

      setStatus('ready');
      if (voiceEnabled) handleSpeakText(msgText);
    } catch (err: any) {
      setStatus('ready');
      setErrorMessage(err.response?.data?.message || 'Failed to undo action.');
      setTimeout(() => setErrorMessage(null), 3500);
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
      queryClient.invalidateQueries({ queryKey: ['assistant-goals'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['tasks-today'] });
      queryClient.invalidateQueries({ queryKey: ['assistant-today-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['assistant-reminders'] });
      queryClient.invalidateQueries({ queryKey: ['assistant-action-history'] });
      queryClient.invalidateQueries({ queryKey: ['overview-stats'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });

      setStatus('ready');
      if (voiceEnabled) handleSpeakText(msgText);
    } catch (err: any) {
      setStatus('ready');
      setErrorMessage(err.response?.data?.message || 'Failed to confirm action.');
      setTimeout(() => setErrorMessage(null), 3500);
    }
  };

  const promptSuggestions = [
    "What have I done today?",
    "What did I forget?",
    "Add habit: Drink 2L water daily",
    "Create goal: Master Full Stack System Design",
    "Start a 25-minute focus session",
    "Remind me to review DSA at 8pm"
  ];

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col lg:flex-row gap-4 pb-4">
      {/* PANEL 1: CONVERSATIONS LIST (LEFT) */}
      <div className="w-full lg:w-64 bg-[#161E2E] border border-[#263247] rounded-2xl flex flex-col overflow-hidden shrink-0">
        <div className="p-3.5 border-b border-[#263247] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-[#8B5CF6]" />
            <span className="text-xs font-bold text-white">Conversations</span>
          </div>
          <button
            type="button"
            onClick={handleNewConversation}
            className="p-1.5 rounded-lg bg-[#8B5CF6]/15 text-[#8B5CF6] hover:bg-[#8B5CF6]/30 border border-[#8B5CF6]/30 transition cursor-pointer"
            title="Start New Thread"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {conversations.length === 0 ? (
            <div className="p-4 text-center text-xs text-[#64748B]">No past threads.</div>
          ) : (
            conversations.map((c) => (
              <div
                key={c._id}
                onClick={() => handleSelectConversation(c._id)}
                className={`group p-2.5 rounded-xl text-xs transition cursor-pointer flex items-center justify-between ${
                  activeConversationId === c._id
                    ? 'bg-[#8B5CF6]/20 text-white border border-[#8B5CF6]/40 font-semibold'
                    : 'text-[#94A3B8] hover:bg-[#1C2638] hover:text-[#F8FAFC]'
                }`}
              >
                <span className="truncate flex-1 pr-2">{c.title || 'Conversation'}</span>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={(e) => handleDeleteConversation(e, c._id)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition"
                    title="Delete thread"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <ChevronRight className="w-3 h-3 opacity-60" />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Memory & Settings Navigation Button */}
        <div className="p-3 border-t border-[#263247] space-y-1.5 bg-[#111827]">
          <button
            type="button"
            onClick={() => navigate('/assistant/memory')}
            className="w-full py-2 px-3 rounded-xl bg-[#1C2638] hover:bg-[#202B3D] border border-[#263247] text-xs font-semibold text-[#8B5CF6] flex items-center gap-2 transition cursor-pointer"
          >
            <Brain className="w-3.5 h-3.5" />
            <span>Memory Manager</span>
          </button>
        </div>
      </div>

      {/* PANEL 2: MAIN VOICE & CHAT INTERFACE (CENTER) */}
      <div className="flex-1 bg-[#111827] border border-[#263247] rounded-2xl flex flex-col overflow-hidden shadow-xl">
        {/* Assistant Header & Status Orb */}
        <div className="p-4 bg-[#161E2E] border-b border-[#263247] flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Animated Orb */}
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${
                status === 'listening'
                  ? 'bg-red-500/20 text-red-400 border border-red-500/40 ring-4 ring-red-500/20 animate-pulse'
                  : status === 'processing'
                  ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40 animate-spin'
                  : status === 'speaking'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 animate-pulse'
                  : 'bg-[#8B5CF6]/20 text-[#8B5CF6] border border-[#8B5CF6]/30'
              }`}
            >
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm font-extrabold text-white">ConsistAI Voice Assistant</h2>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#8B5CF6]/20 text-[#8B5CF6] border border-[#8B5CF6]/30">
                  Multilingual AI
                </span>
                <LocalAIStatus
                  online={Boolean(healthData?.online ?? (healthData?.status === 'ok'))}
                  modelName={healthData?.activeModel || 'qwen3.5:4b'}
                  latencyMs={healthData?.latencyMs}
                  isLoading={isFetchingHealth}
                  onRefresh={() => refetchHealth()}
                />
              </div>
              <p className="text-[11px] text-[#94A3B8]">
                Status: <strong className="text-[#F8FAFC] capitalize">{status.replace('_', ' ')}</strong> · Speaks English, Hindi, Hinglish
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {(status === 'listening' || status === 'speaking') && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#111827] border border-[#263247]">
                <span className="text-[10px] font-mono text-[#94A3B8] hidden sm:inline">
                  {status === 'listening' ? 'Listening' : 'Speaking'}
                </span>
                <div className="flex items-center gap-0.5 h-4">
                  <span className={`w-1 rounded-full animate-bounce [animation-delay:-0.3s] h-3 ${status === 'listening' ? 'bg-red-400' : 'bg-emerald-400'}`} />
                  <span className={`w-1 rounded-full animate-bounce [animation-delay:-0.15s] h-4 ${status === 'listening' ? 'bg-red-400' : 'bg-emerald-400'}`} />
                  <span className={`w-1 rounded-full animate-bounce h-2 ${status === 'listening' ? 'bg-red-400' : 'bg-emerald-400'}`} />
                  <span className={`w-1 rounded-full animate-bounce [animation-delay:-0.2s] h-5 ${status === 'listening' ? 'bg-red-400' : 'bg-emerald-400'}`} />
                  <span className={`w-1 rounded-full animate-bounce [animation-delay:-0.4s] h-3 ${status === 'listening' ? 'bg-red-400' : 'bg-emerald-400'}`} />
                </div>
              </div>
            )}

            {status === 'speaking' && (
              <button
                type="button"
                onClick={stopSpeaking}
                className="px-3 py-1.5 rounded-xl bg-[#1C2638] border border-red-500/40 text-xs font-semibold text-red-400 flex items-center gap-1.5 hover:bg-red-950/30 transition cursor-pointer"
              >
                <VolumeX className="w-3.5 h-3.5" />
                <span>Stop Speaking</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                if (voiceEnabled) {
                  stopSpeaking();
                }
                setVoiceEnabled(!voiceEnabled);
              }}
              className={`p-2 rounded-xl border text-xs transition cursor-pointer ${
                voiceEnabled
                  ? 'bg-[#8B5CF6]/20 text-[#8B5CF6] border-[#8B5CF6]/40'
                  : 'bg-[#1C2638] text-[#94A3B8] border-[#263247]'
              }`}
              title={voiceEnabled ? 'Mute Speech Output' : 'Enable Speech Output'}
            >
              {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-[#0B0F19]/50">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-xl bg-[#8B5CF6]/20 text-[#8B5CF6] border border-[#8B5CF6]/30 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[78%] rounded-2xl p-4 text-xs leading-relaxed space-y-2.5 ${
                  msg.role === 'user'
                    ? 'bg-[#8B5CF6] text-white shadow-md rounded-tr-sm'
                    : 'bg-[#161E2E] text-[#F8FAFC] border border-[#263247] rounded-tl-sm'
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>

                {/* Tool executions confirmation */}
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
                <div className="w-8 h-8 rounded-xl bg-[#1C2638] text-white border border-[#263247] flex items-center justify-center shrink-0 mt-0.5">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {status === 'processing' && (
            <div className="flex items-center gap-2.5 text-xs text-[#94A3B8] p-3 rounded-xl bg-[#161E2E] border border-[#263247] w-fit">
              <Sparkles className="w-4 h-4 text-[#8B5CF6] animate-spin" />
              <span>Analyzing intent and executing verified database tools...</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-950/40 border border-red-800/40 text-xs text-red-300">
              {errorMessage}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggestion Chips */}
        <div className="px-4 py-2.5 bg-[#161E2E] border-t border-[#263247] overflow-x-auto no-scrollbar flex items-center gap-2">
          {promptSuggestions.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSendMessage(p)}
              className="whitespace-nowrap px-3 py-1.5 rounded-xl bg-[#111827] border border-[#263247] text-xs text-[#94A3B8] hover:text-white hover:border-[#8B5CF6]/50 transition cursor-pointer"
            >
              {p}
            </button>
          ))}
        </div>

        {/* Voice and Text Input Area */}
        <div className="p-4 bg-[#161E2E] border-t border-[#263247] flex items-center gap-3">
          <button
            type="button"
            onClick={toggleListening}
            className={`p-3.5 rounded-2xl border transition cursor-pointer shrink-0 ${
              status === 'listening'
                ? 'bg-[#EF4444] text-white border-[#EF4444] animate-pulse ring-4 ring-[#EF4444]/30'
                : 'bg-[#1C2638] text-[#8B5CF6] border-[#263247] hover:bg-[#8B5CF6]/20 hover:border-[#8B5CF6]/50'
            }`}
            title={status === 'listening' ? 'Stop Listening' : 'Speak (Push-to-Talk)'}
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
            placeholder={status === 'listening' ? 'Listening to your voice...' : 'Type instructions or click the microphone to speak...'}
            className="flex-1 px-4 py-3 rounded-xl bg-[#111827] border border-[#263247] text-xs sm:text-sm text-[#F8FAFC] placeholder-[#64748B] focus:outline-none focus:border-[#8B5CF6]"
          />

          <button
            type="button"
            onClick={() => handleSendMessage()}
            disabled={!inputText.trim()}
            className="px-5 py-3 rounded-xl bg-[#8B5CF6] text-white hover:bg-[#7C3AED] disabled:opacity-40 disabled:cursor-not-allowed font-semibold text-xs transition cursor-pointer flex items-center gap-2 shrink-0"
          >
            <span>Send</span>
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* PANEL 3: CONTEXTUAL PRODUCTIVITY SIDEBAR (RIGHT) */}
      <div className="w-full lg:w-80 bg-[#161E2E] border border-[#263247] rounded-2xl flex flex-col overflow-hidden shrink-0">
        {/* Sidebar Tab Header */}
        <div className="p-2.5 bg-[#111827] border-b border-[#263247] flex items-center gap-1">
          <button
            type="button"
            onClick={() => setSidebarTab('workspace')}
            className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 ${
              sidebarTab === 'workspace'
                ? 'bg-[#8B5CF6] text-white shadow-md'
                : 'text-[#94A3B8] hover:text-white hover:bg-[#1C2638]'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Workspace</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setSidebarTab('history');
              refetchActionHistory();
            }}
            className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 ${
              sidebarTab === 'history'
                ? 'bg-[#8B5CF6] text-white shadow-md'
                : 'text-[#94A3B8] hover:text-white hover:bg-[#1C2638]'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Action Log</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-4">
          {sidebarTab === 'workspace' ? (
            <>
              <div>
                <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider block mb-2 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
                  <span>Today's Task Queue</span>
                </span>
                <div className="space-y-1.5">
                  {(todayTasksData?.tasks || []).slice(0, 4).map((t: any) => (
                    <div
                      key={t._id}
                      className="p-2.5 rounded-xl bg-[#111827] border border-[#263247] text-xs flex items-center justify-between"
                    >
                      <span className={`truncate ${t.status === 'completed' ? 'line-through text-[#64748B]' : 'text-white'}`}>
                        {t.title}
                      </span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                        t.status === 'completed' ? 'bg-emerald-950/60 text-emerald-400' : 'bg-slate-800 text-slate-300'
                      }`}>
                        {t.status}
                      </span>
                    </div>
                  ))}
                  {(!todayTasksData?.tasks || todayTasksData.tasks.length === 0) && (
                    <div className="text-xs text-[#64748B] italic">No tasks scheduled today.</div>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-[#263247]">
                <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider block mb-2 flex items-center gap-1.5">
                  <Bell className="w-3.5 h-3.5 text-[#38BDF8]" />
                  <span>Upcoming Reminders</span>
                </span>
                <div className="space-y-1.5">
                  {(remindersData?.reminders || []).slice(0, 3).map((r: any) => (
                    <div
                      key={r._id}
                      className="p-2.5 rounded-xl bg-[#111827] border border-[#263247] text-xs space-y-1"
                    >
                      <div className="text-white font-medium truncate">{r.title}</div>
                      <div className="text-[10px] text-[#38BDF8] font-mono">
                        {new Date(r.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  ))}
                  {(!remindersData?.reminders || remindersData.reminders.length === 0) && (
                    <div className="text-xs text-[#64748B] italic">No pending reminders.</div>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-[#263247]">
                <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider block mb-2 flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-[#8B5CF6]" />
                  <span>Active Goal Progress</span>
                </span>
                <div className="space-y-2">
                  {(goalsData?.goals || []).slice(0, 3).map((g: any) => (
                    <div key={g._id} className="p-2.5 rounded-xl bg-[#111827] border border-[#263247] text-xs space-y-1.5">
                      <div className="flex items-center justify-between text-white font-semibold">
                        <span className="truncate">{g.title}</span>
                        <span className="text-[#8B5CF6] font-mono">{g.currentProgressPercentage || 0}%</span>
                      </div>
                      <div className="w-full bg-[#1C2638] h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-[#8B5CF6] h-full rounded-full transition-all"
                          style={{ width: `${g.currentProgressPercentage || 0}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between pb-1">
                <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">
                  Recent Executed Actions
                </span>
                <button
                  type="button"
                  onClick={() => refetchActionHistory()}
                  className="text-[10px] text-violet-400 hover:underline cursor-pointer flex items-center gap-1"
                >
                  <RotateCcw className="w-2.5 h-2.5" />
                  <span>Refresh</span>
                </button>
              </div>

              {(!actionHistoryData?.history || actionHistoryData.history.length === 0) ? (
                <div className="p-6 text-center text-xs text-[#64748B]">
                  No AI actions executed yet.
                </div>
              ) : (
                actionHistoryData.history.map((act: any) => (
                  <div
                    key={act.id}
                    className="p-2.5 rounded-xl bg-[#111827] border border-[#263247] text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white truncate max-w-[150px]">
                        {act.toolName.replace(/_/g, ' ')}
                      </span>
                      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-semibold ${
                        act.isUndone
                          ? 'bg-slate-800 text-slate-400 border border-slate-700'
                          : act.executionStatus === 'success'
                          ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/30'
                          : 'bg-rose-950/60 text-rose-400 border border-rose-500/30'
                      }`}>
                        {act.isUndone ? 'Undone' : act.executionStatus}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-300 line-clamp-2">
                      {act.result?.message || act.arguments?.title || act.arguments?.goalTitle || act.arguments?.habitTitle || act.errorMessage || JSON.stringify(act.arguments)}
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[10px] text-[#64748B]">
                      <span>{new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      {act.canUndo && (
                        <button
                          type="button"
                          onClick={() => handleUndoAction(act.id)}
                          className="text-violet-400 hover:text-violet-300 flex items-center gap-1 font-semibold cursor-pointer transition"
                        >
                          <RotateCcw className="w-2.5 h-2.5" />
                          <span>Undo</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
