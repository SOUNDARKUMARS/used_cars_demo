import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Send,
  X,
  Minimize2,
  Maximize2,
  RotateCcw,
  Car,
  Database,
  ChevronDown,
  ChevronUp,
  MapPin,
  Calendar,
  Fuel,
  Gauge,
  ArrowRight,
  ShieldCheck,
  Bot,
  Clock
} from 'lucide-react';
import { streamChatMessage } from '../lib/agentApi';
import { BRAND_ACCENT, BRAND_NAME } from '../config/brand';
import { useAuth } from '../context/AuthContext';
import {
  saveChatMessage,
  fetchChatMessages,
  clearUserChatHistory,
  CHAT_PAGE_SIZE
} from '../lib/chatHistoryService';

const QUICK_PROMPTS = [
  'Petrol cars under ₹6 Lakhs',
  'Automatic hatchbacks in Tiruppur',
  'Cars with EMI under ₹10,000/mo',
  'What cars do you have in Coimbatore?',
  'Tell me about your Honda City'
];

const DEFAULT_WELCOME_MESSAGE = {
  id: 'welcome-1',
  role: 'assistant',
  content: `Hello! I'm your **${BRAND_NAME} AI Vehicle Specialist**.\n\nI can directly query our live inventory across **Tiruppur** and **Coimbatore** hubs to help you find the perfect pre-owned car.\n\nWhat kind of car, budget, or fuel type are you looking for today?`,
  cars: [],
  sqlQueries: [],
  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
};

export default function HarshaAgentChat({
  isOpen: controlledIsOpen,
  onOpen: controlledOnOpen,
  onClose: controlledOnClose,
  onSelectCar,
  onBookTestDrive
}) {
  const { user } = useAuth();
  const userId = user?.sub || user?.id || (user?.email ? user.email.toLowerCase().trim() : null);

  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isControlled = controlledIsOpen !== undefined;
  const isOpen = isControlled ? controlledIsOpen : internalIsOpen;

  const handleOpen = () => {
    if (typeof controlledOnOpen === 'function') {
      controlledOnOpen();
    }
    setInternalIsOpen(true);
  };

  const handleClose = () => {
    if (typeof controlledOnClose === 'function') {
      controlledOnClose();
    }
    setInternalIsOpen(false);
  };

  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [interimStatus, setInterimStatus] = useState(null);
  const [expandedSql, setExpandedSql] = useState({});

  // Pagination & history states for logged-in user
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMoreOlder, setHasMoreOlder] = useState(false);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const inputRef = useRef(null);

  // Persistent guest session ID or authenticated session ID
  const [guestSessionId] = useState(() => {
    try {
      let saved = localStorage.getItem('harsha_agent_session_id');
      if (!saved) {
        saved = `harsha_sess_${Math.random().toString(36).slice(2, 9)}_${Date.now().toString(36)}`;
        localStorage.setItem('harsha_agent_session_id', saved);
      }
      return saved;
    } catch {
      return `harsha_sess_${Date.now()}`;
    }
  });

  const sessionId = userId ? `harsha_user_${userId.replace(/[^a-zA-Z0-9_-]/g, '_')}` : guestSessionId;

  // Initialize messages state
  const [messages, setMessages] = useState(() => {
    if (!userId) {
      try {
        const saved = localStorage.getItem('harsha_guest_chat_history');
        if (saved) return JSON.parse(saved);
      } catch (_) {}
    }
    return [DEFAULT_WELCOME_MESSAGE];
  });

  // Load chat messages: from database for logged in user (last 15 messages), or from localStorage for guest
  useEffect(() => {
    if (!userId) {
      // Guest user: load from localStorage
      try {
        const saved = localStorage.getItem('harsha_guest_chat_history');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setMessages(parsed);
            setHasMoreOlder(false);
            return;
          }
        }
      } catch (_) {}
      setMessages([DEFAULT_WELCOME_MESSAGE]);
      setHasMoreOlder(false);
      return;
    }

    // Logged-in user: Fetch last 15 messages from Supabase DB
    let isMounted = true;
    setIsLoadingHistory(true);

    fetchChatMessages({ userId, page: 0, pageSize: CHAT_PAGE_SIZE })
      .then((res) => {
        if (!isMounted) return;
        if (res.messages && res.messages.length > 0) {
          setMessages(res.messages);
          setHasMoreOlder(res.hasMore);
          setCurrentPage(0);
        } else {
          // If no messages stored in DB yet, check if there's local cache or start fresh
          try {
            const saved = localStorage.getItem(`harsha_chat_history_${sessionId}`);
            if (saved) {
              const parsed = JSON.parse(saved);
              if (Array.isArray(parsed) && parsed.length > 0) {
                setMessages(parsed);
                setHasMoreOlder(false);
                return;
              }
            }
          } catch (_) {}
          setMessages([DEFAULT_WELCOME_MESSAGE]);
          setHasMoreOlder(false);
        }
      })
      .catch((err) => {
        console.warn('Error loading chat history from DB:', err);
        setMessages([DEFAULT_WELCOME_MESSAGE]);
      })
      .finally(() => {
        if (isMounted) setIsLoadingHistory(false);
      });

    return () => {
      isMounted = false;
    };
  }, [userId, sessionId]);

  // Sync to localStorage as local fallback
  useEffect(() => {
    if (!userId) {
      try {
        localStorage.setItem('harsha_guest_chat_history', JSON.stringify(messages));
      } catch (_) {}
    } else {
      try {
        localStorage.setItem(`harsha_chat_history_${sessionId}`, JSON.stringify(messages));
      } catch (_) {}
    }
  }, [messages, userId, sessionId]);

  // Auto-scroll to bottom on new message or status change (unless loading older messages)
  useEffect(() => {
    if (isOpen && !isLoadingOlder) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, interimStatus, isOpen, isLoadingOlder]);

  // Auto focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 250);
    }
  }, [isOpen]);

  const toggleSqlExpand = (msgId) => {
    setExpandedSql((prev) => ({
      ...prev,
      [msgId]: !prev[msgId]
    }));
  };

  // Page-wise on-demand fetch of older messages
  const handleLoadMoreOlder = async () => {
    if (!userId || isLoadingOlder || !hasMoreOlder) return;

    const nextPage = currentPage + 1;
    setIsLoadingOlder(true);

    const scrollContainer = messagesContainerRef.current;
    const prevScrollHeight = scrollContainer?.scrollHeight || 0;
    const prevScrollTop = scrollContainer?.scrollTop || 0;

    try {
      const res = await fetchChatMessages({ userId, page: nextPage, pageSize: CHAT_PAGE_SIZE });
      if (res.messages && res.messages.length > 0) {
        setMessages((prev) => [...res.messages, ...prev]);
        setCurrentPage(nextPage);
        setHasMoreOlder(res.hasMore);

        // Keep scroll anchored to previous position so it doesn't jump
        requestAnimationFrame(() => {
          if (scrollContainer) {
            const newScrollHeight = scrollContainer.scrollHeight;
            scrollContainer.scrollTop = newScrollHeight - prevScrollHeight + prevScrollTop;
          }
        });
      } else {
        setHasMoreOlder(false);
      }
    } catch (err) {
      console.warn('Failed to load older messages from database:', err);
    } finally {
      setIsLoadingOlder(false);
    }
  };

  const handleClearChat = async () => {
    const welcome = [
      {
        id: `welcome-${Date.now()}`,
        role: 'assistant',
        content: `Chat cleared! How can I assist you with your car search today?`,
        cars: [],
        sqlQueries: [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ];
    setMessages(welcome);
    setHasMoreOlder(false);
    setCurrentPage(0);

    if (userId) {
      clearUserChatHistory(userId);
      try {
        localStorage.removeItem(`harsha_chat_history_${sessionId}`);
      } catch (_) {}
    } else {
      try {
        localStorage.removeItem('harsha_guest_chat_history');
      } catch (_) {}
    }
  };

  const handleSend = async (textToSend) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isLoading) return;

    const userMsgId = `user_${Date.now()}`;
    const userMsg = {
      id: userMsgId,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsLoading(true);
    setInterimStatus('Connecting to Harsha Cars database...');

    // If logged in, persist user message to Supabase database
    if (userId) {
      saveChatMessage({
        userId,
        sessionId,
        role: 'user',
        content: text
      });
    }

    // Collect recent conversation context (last 8 messages) to pass to LLM
    const contextHistory = messages
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .slice(-8)
      .map((m) => ({
        role: m.role,
        content: m.content
      }));

    let streamingText = '';
    let collectedCars = [];
    const collectedSql = [];

    try {
      const result = await streamChatMessage({
        prompt: text,
        sessionId,
        userId: userId || undefined,
        customerName: user?.name || null,
        history: contextHistory,
        onStatus: (status) => setInterimStatus(status),
        onInterim: (interim) => setInterimStatus(interim),
        onSql: (sql) => {
          collectedSql.push(sql);
        },
        onCars: (cars) => {
          collectedCars = cars;
        },
        onTextDelta: (delta) => {
          streamingText += delta;
        }
      });

      const assistantMsg = {
        id: `assistant_${Date.now()}`,
        role: 'assistant',
        content: result.text || streamingText || 'I have checked our inventory.',
        cars: result.cars || collectedCars || [],
        sqlQueries: result.sqlQueries || collectedSql || [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, assistantMsg]);

      // If logged in, persist assistant message (with matched cars & SQL queries) to database
      if (userId) {
        saveChatMessage({
          userId,
          sessionId,
          role: 'assistant',
          content: assistantMsg.content,
          cars: assistantMsg.cars,
          sqlQueries: assistantMsg.sqlQueries
        });
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `error_${Date.now()}`,
          role: 'assistant',
          content: `Sorry, I ran into an issue connecting to the inventory server (${err.message}). Please ensure the agent server is running or try again.`,
          cars: [],
          sqlQueries: [],
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsLoading(false);
      setInterimStatus(null);
    }
  };

  return (
    <>
      {/* 1. FLOATING LAUNCHER BUTTON (Temporarily commented out) */}
      {/*
      {!isOpen && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleOpen}
          className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-700 hover:to-rose-800 text-white rounded-full shadow-2xl shadow-red-500/30 border border-white/20 transition-all duration-300 group cursor-pointer active:scale-95"
          aria-label="Open Harsha Cars AI Assistant"
        >
          <div className="relative">
            <Sparkles className="w-5 h-5 text-yellow-300 animate-pulse" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-red-600" />
          </div>
          <span className="font-bold text-sm tracking-wide pr-1">Ask Harsha AI</span>
        </motion.button>
      )}
      */}

      {/* 2. CHAT WINDOW / MODAL */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="fixed bottom-2 sm:bottom-6 right-2 sm:right-6 w-[calc(100vw-16px)] sm:w-[440px] h-[calc(100vh-80px)] sm:h-[650px] max-h-[85vh] z-50 bg-white shadow-2xl rounded-2xl border border-slate-200 overflow-hidden flex flex-col transition-all duration-200"
          >
            {/* Header */}
            <div className="bg-slate-900 text-white px-4 py-3.5 flex items-center justify-between select-none border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-red-600 to-rose-500 flex items-center justify-center text-white shadow-md relative">
                  <Bot className="w-5 h-5" />
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 rounded-full ring-2 ring-slate-900" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-bold text-sm text-white leading-tight">Harsha AI Assistant</h3>
                    <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-red-600/30 text-red-300 border border-red-500/30">
                      Live SQL
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-tight">
                    Direct inventory query • Tiruppur & Coimbatore
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 text-slate-400">
                <button
                  type="button"
                  onClick={handleClearChat}
                  title="Clear chat history"
                  className="p-1.5 hover:text-white hover:bg-slate-800 rounded-lg transition"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  title="Close chat"
                  className="p-1.5 hover:text-white hover:bg-slate-800 rounded-lg transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Messages Scroll Area */}
            <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-3.5 space-y-3.5 bg-slate-50/60">
              {/* Load Earlier Messages Button (On-demand page-wise fetching for logged-in user) */}
              {hasMoreOlder && (
                <div className="flex justify-center pt-1 pb-1">
                  <button
                    type="button"
                    onClick={handleLoadMoreOlder}
                    disabled={isLoadingOlder}
                    className="px-3.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/90 rounded-full text-xs font-semibold shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                  >
                    {isLoadingOlder ? (
                      <>
                        <RotateCcw className="w-3.5 h-3.5 animate-spin text-red-600" />
                        <span>Loading earlier messages...</span>
                      </>
                    ) : (
                      <>
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        <span>Load earlier messages</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {isLoadingHistory && (
                <div className="flex items-center justify-center py-6 text-xs text-slate-500 gap-2">
                  <Sparkles className="w-4 h-4 text-red-600 animate-spin" />
                  <span>Loading your chat history...</span>
                </div>
              )}
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm leading-relaxed shadow-sm ${
                          msg.role === 'user'
                            ? 'bg-red-600 text-white rounded-tr-none'
                            : 'bg-white text-slate-800 border border-slate-200/80 rounded-tl-none'
                        }`}
                      >
                        {/* Message Text with Simple Markdown Line Breaks & Formatting */}
                        <div className="space-y-1.5">
                          {msg.content
                            .replace(/!\[.*?\]\(.*?\)/g, '')
                            .split('\n')
                            .map((line, idx) => {
                            if (!line.trim()) return <div key={idx} className="h-1.5" />;
                            // Bold check
                            const parts = line.split(/(\*\*.*?\*\*)/g);
                            return (
                              <p key={idx} className="leading-snug">
                                {parts.map((p, pIdx) => {
                                  if (p.startsWith('**') && p.endsWith('**')) {
                                    return <strong key={pIdx}>{p.slice(2, -2)}</strong>;
                                  }
                                  return p;
                                })}
                              </p>
                            );
                          })}
                        </div>

                        {/* SQL Audit Pill (for transparency) */}
                        {msg.sqlQueries && msg.sqlQueries.length > 0 && (
                          <div className="mt-2.5 pt-2 border-t border-slate-100">
                            <button
                              type="button"
                              onClick={() => toggleSqlExpand(msg.id)}
                              className="flex items-center gap-1.5 text-[11px] font-mono font-medium text-slate-500 hover:text-slate-800 transition"
                            >
                              <Database className="w-3.5 h-3.5 text-indigo-500" />
                              <span>{expandedSql[msg.id] ? 'Hide SQL Query' : 'View Executed SQL'}</span>
                              {expandedSql[msg.id] ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            </button>
                            {expandedSql[msg.id] && (
                              <pre className="mt-1.5 p-2 bg-slate-900 text-emerald-400 text-[10px] font-mono rounded-lg overflow-x-auto whitespace-pre-wrap leading-tight">
                                {msg.sqlQueries.join('\n\n')}
                              </pre>
                            )}
                          </div>
                        )}

                        <span
                          className={`block text-[10px] mt-1 text-right ${
                            msg.role === 'user' ? 'text-red-200' : 'text-slate-400'
                          }`}
                        >
                          {msg.timestamp}
                        </span>
                      </div>

                      {/* Interactive Vehicle Cards Attached to Assistant Message */}
                      {msg.cars && msg.cars.length > 0 && (
                        <div className="w-full mt-2.5 space-y-2">
                          <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 uppercase tracking-wider pl-1">
                            <Car className="w-3.5 h-3.5 text-red-600" />
                            <span>Matched Inventory ({msg.cars.length})</span>
                          </div>

                          <div className="grid grid-cols-1 gap-2">
                            {msg.cars.slice(0, 4).map((car) => (
                              <div
                                key={car.id}
                                className="bg-white rounded-xl border border-slate-200/90 p-2.5 shadow-sm hover:shadow-md transition flex gap-3 items-center"
                              >
                                {car.image && (
                                  <img
                                    src={car.image}
                                    alt={car.title}
                                    className="w-20 h-16 object-cover rounded-lg bg-slate-100 flex-shrink-0"
                                    onError={(e) => {
                                      e.target.style.display = 'none';
                                    }}
                                  />
                                )}
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                                    {car.title}
                                  </h4>
                                  <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                                    <span className="font-semibold text-red-600">{car.priceFormatted}</span>
                                    {car.listingStatus && car.listingStatus !== 'Available' && (
                                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                        car.listingStatus === 'Sold'
                                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                          : 'bg-blue-100 text-blue-800 border border-blue-300'
                                      }`}>
                                        {car.listingStatus}
                                      </span>
                                    )}
                                    <span>•</span>
                                    <span>{car.km}</span>
                                    <span>•</span>
                                    <span>{car.fuel}</span>
                                    <span>•</span>
                                    <span>{car.transmission}</span>
                                  </div>
                                  {car.location && (
                                    <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-0.5 truncate">
                                      <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0" />
                                      <span className="truncate">{car.location}</span>
                                    </div>
                                  )}
                                </div>

                                <div className="flex flex-col gap-1 flex-shrink-0">
                                  {onSelectCar && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        onSelectCar(car);
                                        handleClose();
                                      }}
                                      className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-semibold rounded-lg transition flex items-center gap-1 shadow-sm cursor-pointer"
                                    >
                                      <span>View</span>
                                      <ArrowRight className="w-3 h-3" />
                                    </button>
                                  )}
                                  {onBookTestDrive && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        onBookTestDrive(car);
                                        handleClose();
                                      }}
                                      className="px-2.5 py-1 text-slate-600 hover:text-red-600 text-[10px] font-medium transition cursor-pointer text-center"
                                    >
                                      Test Drive
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Real-Time Typing & Interim Loading Status */}
                  {isLoading && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex flex-col gap-1.5 items-start max-w-[90%]"
                    >
                      {/* Typing Indicator Bubble with 3 Bouncing Dots */}
                      <div className="flex items-center gap-2 px-3.5 py-2.5 bg-white border border-slate-200/90 rounded-2xl rounded-tl-none shadow-xs">
                        <div className="flex items-center gap-1 py-0.5">
                          <span
                            className="w-2 h-2 rounded-full bg-red-600 animate-bounce"
                            style={{ animationDelay: '0ms', animationDuration: '900ms' }}
                          />
                          <span
                            className="w-2 h-2 rounded-full bg-red-600 animate-bounce"
                            style={{ animationDelay: '200ms', animationDuration: '900ms' }}
                          />
                          <span
                            className="w-2 h-2 rounded-full bg-red-600 animate-bounce"
                            style={{ animationDelay: '400ms', animationDuration: '900ms' }}
                          />
                        </div>
                        <span className="text-[11px] text-slate-500 font-medium">
                          typing...
                        </span>
                      </div>

                      {/* Process/Interim Status Pill */}
                      {interimStatus && (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50/90 border border-red-100 text-slate-700 rounded-xl text-[11px] shadow-xs">
                          <Sparkles className="w-3.5 h-3.5 text-red-600 animate-spin flex-shrink-0" />
                          <span className="font-medium text-red-900 animate-pulse">
                            {interimStatus}
                          </span>
                        </div>
                      )}
                    </motion.div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Quick Prompts Bar */}
                {messages.length <= 2 && (
                  <div className="p-2 bg-white border-t border-slate-100 overflow-x-auto flex gap-1.5 scrollbar-none">
                    {QUICK_PROMPTS.map((promptText) => (
                      <button
                        key={promptText}
                        type="button"
                        onClick={() => handleSend(promptText)}
                        className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-red-50 hover:text-red-600 text-[11px] font-medium text-slate-600 transition whitespace-nowrap border border-slate-200/60 cursor-pointer"
                      >
                        {promptText}
                      </button>
                    ))}
                  </div>
                )}

                {/* Input Bar */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSend();
                  }}
                  className="p-2.5 bg-white border-t border-slate-200 flex items-center gap-2"
                >
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Ask about cars, budget, fuel, EMI..."
                    disabled={isLoading}
                    className="flex-1 bg-slate-100 text-slate-900 placeholder:text-slate-400 text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-transparent focus:border-red-500 focus:bg-white focus:outline-none transition"
                  />
                  <button
                    type="submit"
                    disabled={!inputMessage.trim() || isLoading}
                    className="p-2.5 bg-red-600 hover:bg-red-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl transition shadow-sm cursor-pointer"
                    aria-label="Send message"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
