import React, { useState, useEffect, useMemo } from 'react';
import {
  fetchAgentAnalyticsSummary,
  fetchAgentAnalyticsMessages,
  fetchAgentAnalyticsSessions,
  fetchAgentAnalyticsSummaries,
  triggerAgentCompaction,
  fetchInstagramStatus,
  simulateInstagramMessage,
  AGENT_SQL_SETUP_SCRIPT
} from '../lib/agentApi.js';
import { supabase } from '../lib/supabase.js';

export default function AdminAgentAnalyticsView() {
  const [summary, setSummary] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all' | 'sql_only' | 'multi_turn'
  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'highest_cost' | 'most_messages'
  const [expandedSessions, setExpandedSessions] = useState({});
  const [expandedSqlTurn, setExpandedSqlTurn] = useState({});
  const [expandedFullText, setExpandedFullText] = useState({});
  const [sessionSummaries, setSessionSummaries] = useState({});
  const [showSqlModal, setShowSqlModal] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [tableExists, setTableExists] = useState(true);

  // Instagram DM connection & simulation state
  const [instagramStatus, setInstagramStatus] = useState(null);
  const [simPrompt, setSimPrompt] = useState('Show me automatic hatchbacks in Tiruppur');
  const [isSimulating, setIsSimulating] = useState(false);
  const [simResult, setSimResult] = useState(null);
  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const [showIgSimulator, setShowIgSimulator] = useState(false);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sumRes, msgRes, summariesRes, igRes] = await Promise.all([
        fetchAgentAnalyticsSummary(),
        fetchAgentAnalyticsMessages(200),
        fetchAgentAnalyticsSummaries(),
        fetchInstagramStatus()
      ]);

      if (igRes) {
        setInstagramStatus(igRes);
      }

      if (sumRes) {
        setSummary(sumRes);
        if (sumRes.tableExists === false) setTableExists(false);
      }

      if (msgRes && Array.isArray(msgRes.messages)) {
        setMessages(msgRes.messages);
        if (msgRes.tableExists === false) setTableExists(false);
      } else {
        // Fallback directly via Supabase client
        const { data: directMsgs, error: directErr } = await supabase
          .from('agent_messages')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(200);

        if (directErr) {
          if (directErr.code === 'PGRST205' || directErr.message?.includes('does not exist')) {
            setTableExists(false);
          }
        } else if (directMsgs) {
          setMessages(directMsgs);
          setTableExists(true);
        }
      }

      // Group summaries by session_id
      const rawSummaries = summariesRes?.summaries || [];
      const grouped = {};
      for (const s of rawSummaries) {
        if (!grouped[s.session_id]) grouped[s.session_id] = [];
        grouped[s.session_id].push(s);
      }
      setSessionSummaries(grouped);
    } catch (err) {
      console.warn('Analytics loading error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(AGENT_SQL_SETUP_SCRIPT);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2500);
  };

  const handleRunSimulation = async () => {
    if (!simPrompt.trim() || isSimulating) return;
    setIsSimulating(true);
    setSimResult(null);
    try {
      const res = await simulateInstagramMessage(simPrompt.trim());
      setSimResult(res);
    } catch (err) {
      setSimResult({ success: false, error: err.message });
    } finally {
      setIsSimulating(false);
    }
  };

  // Toggle individual session accordion
  const toggleSession = (sessionId) => {
    setExpandedSessions((prev) => ({
      ...prev,
      [sessionId]: !prev[sessionId]
    }));
  };

  // Toggle SQL drawer for a specific message
  const toggleSql = (msgId) => {
    setExpandedSqlTurn((prev) => ({
      ...prev,
      [msgId]: !prev[msgId]
    }));
  };

  // Toggle full text response preview
  const toggleFullText = (msgId) => {
    setExpandedFullText((prev) => ({
      ...prev,
      [msgId]: !prev[msgId]
    }));
  };

  // Group messages by User / Session ID into folded conversation objects
  const groupedSessions = useMemo(() => {
    const map = {};

    for (const msg of messages) {
      const sid = msg.session_id || 'guest_session';
      if (!map[sid]) {
        map[sid] = {
          sessionId: sid,
          messages: [],
          totalMessages: 0,
          totalCostUsd: 0,
          totalCostInr: 0,
          totalTokens: 0,
          totalInputTokens: 0,
          totalOutputTokens: 0,
          hasSqlTools: false,
          firstMessageAt: msg.created_at,
          lastMessageAt: msg.created_at,
          latestPrompt: msg.user_prompt || '',
          latestResponse: msg.assistant_response || '',
          model: msg.model || 'deepseek/deepseek-v4.1-flash'
        };
      }

      map[sid].messages.push(msg);
      map[sid].totalMessages += 1;
      map[sid].totalCostUsd += Number(msg.cost_usd) || 0;
      map[sid].totalCostInr += Number(msg.cost_inr) || 0;
      map[sid].totalTokens += Number(msg.total_tokens) || 0;
      map[sid].totalInputTokens += Number(msg.input_tokens) || 0;
      map[sid].totalOutputTokens += Number(msg.output_tokens) || 0;

      if (msg.tool_calls && Array.isArray(msg.tool_calls) && msg.tool_calls.length > 0) {
        map[sid].hasSqlTools = true;
      }

      if (new Date(msg.created_at) > new Date(map[sid].lastMessageAt)) {
        map[sid].lastMessageAt = msg.created_at;
        map[sid].latestPrompt = msg.user_prompt || '';
        map[sid].latestResponse = msg.assistant_response || '';
      }
      if (new Date(msg.created_at) < new Date(map[sid].firstMessageAt)) {
        map[sid].firstMessageAt = msg.created_at;
      }
    }

    // Sort messages inside each session chronologically (Turn 1, Turn 2...)
    Object.values(map).forEach((s) => {
      s.messages.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    });

    return Object.values(map);
  }, [messages]);

  // Filter and sort the folded session list
  const filteredSessions = useMemo(() => {
    return groupedSessions
      .filter((s) => {
        // Filter by type
        if (filterType === 'sql_only' && !s.hasSqlTools) return false;
        if (filterType === 'multi_turn' && s.totalMessages < 2) return false;

        // Filter by search
        if (!searchTerm) return true;
        const q = searchTerm.toLowerCase().trim();
        const matchSession = s.sessionId?.toLowerCase().includes(q);
        const matchLatest = s.latestPrompt?.toLowerCase().includes(q);
        const matchAnyMsg = s.messages.some(
          (m) =>
            m.user_prompt?.toLowerCase().includes(q) ||
            m.assistant_response?.toLowerCase().includes(q)
        );
        return matchSession || matchLatest || matchAnyMsg;
      })
      .sort((a, b) => {
        if (sortBy === 'highest_cost') return b.totalCostUsd - a.totalCostUsd;
        if (sortBy === 'most_messages') return b.totalMessages - a.totalMessages;
        return new Date(b.lastMessageAt) - new Date(a.lastMessageAt);
      });
  }, [groupedSessions, filterType, sortBy, searchTerm]);

  // Overall KPI totals
  const totalCostUsd = summary?.totalCostUsd ?? messages.reduce((acc, m) => acc + (Number(m.cost_usd) || 0), 0);
  const totalCostInr = summary?.totalCostInr ?? messages.reduce((acc, m) => acc + (Number(m.cost_inr) || 0), 0);
  const totalMsgCount = summary?.totalMessages ?? messages.length;
  const totalTokens = summary?.totalTokens ?? messages.reduce((acc, m) => acc + (Number(m.total_tokens) || 0), 0);
  const totalSessionsCount = groupedSessions.length;
  const avgCostPerSessionUsd = totalSessionsCount ? totalCostUsd / totalSessionsCount : 0;
  const avgCostPerSessionInr = totalSessionsCount ? totalCostInr / totalSessionsCount : 0;

  // Bulk expand / collapse
  const handleToggleExpandAll = () => {
    const allExpanded = filteredSessions.every((s) => expandedSessions[s.sessionId]);
    const next = {};
    if (!allExpanded) {
      filteredSessions.forEach((s) => {
        next[s.sessionId] = true;
      });
    }
    setExpandedSessions(next);
  };

  return (
    <div className="space-y-4">
      {/* 1. Header with Title & Action Menu */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-3">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <h1 className="h4 mb-0 fw-bold d-flex align-items-center gap-2">
              <i className="bi bi-robot text-danger"></i>
              <span>AI Agent Cost & Usage Control</span>
            </h1>
            <span className="badge bg-danger-subtle text-danger border border-danger-subtle small">
              Live Cloud DB
            </span>
          </div>
          <p className="text-muted small mb-0">
            Clean conversation overview, real-time token spend in <strong>$ (USD)</strong> & <strong>₹ (INR)</strong>, and on-demand tool audits.
          </p>
        </div>

        <div className="d-flex flex-wrap align-items-center gap-2">
          <button
            type="button"
            onClick={() => setShowSqlModal(true)}
            className="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-1.5 shadow-xs"
            title="View database schema SQL for Supabase"
          >
            <i className="bi bi-code-slash"></i>
            <span>SQL Setup Query</span>
          </button>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing || loading}
            className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-1.5 shadow-xs"
          >
            <i className={`bi bi-arrow-clockwise ${refreshing ? 'spin-icon' : ''}`}></i>
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* 2. Setup Required Alert if tables missing in Supabase */}
      {!tableExists && (
        <div className="alert alert-warning border border-warning-subtle shadow-sm rounded-3 p-3 mb-4">
          <div className="d-flex align-items-start gap-3">
            <div className="p-2 bg-warning bg-opacity-25 rounded-2 text-warning-emphasis">
              <i className="bi bi-database-exclamation fs-4"></i>
            </div>
            <div className="flex-grow-1">
              <h6 className="alert-heading fw-bold mb-1">
                Database Tables Missing in Supabase Cloud
              </h6>
              <p className="small mb-2 text-dark">
                To enable persistent message and parallel cost logging, run the provided SQL setup script once in your Supabase project SQL Editor.
              </p>
              <div className="d-flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setShowSqlModal(true)}
                  className="btn btn-sm btn-warning text-dark fw-bold d-inline-flex align-items-center gap-1"
                >
                  <i className="bi bi-terminal"></i>
                  <span>View & Copy SQL Script</span>
                </button>
                <a
                  href="https://supabase.com/dashboard/project/qkriofsteqxccheavuot/editor"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-sm btn-outline-dark d-inline-flex align-items-center gap-1"
                >
                  <i className="bi bi-box-arrow-up-right"></i>
                  <span>Open Supabase SQL Editor</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Top KPI Metric Summary Cards (Clean & Compact) */}
      <div className="row g-3 mb-3">
        {/* Total Cost */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card h-100 border rounded-3 p-3 shadow-xs bg-white">
            <div className="d-flex justify-content-between align-items-start mb-2">
              <span className="small text-muted fw-semibold text-uppercase tracking-wider">Total AI Spend</span>
              <div className="p-1.5 bg-danger-subtle rounded-2 text-danger">
                <i className="bi bi-currency-dollar fs-5"></i>
              </div>
            </div>
            <div className="d-flex align-items-baseline gap-2 mb-1">
              <span className="fs-4 fw-bold text-dark font-monospace">
                ${totalCostUsd.toFixed(4)}
              </span>
              <span className="fs-5 fw-bold text-success font-monospace">
                / ₹{totalCostInr.toFixed(2)}
              </span>
            </div>
            <p className="text-muted small mb-0">
              Avg per session: <strong className="text-dark">${avgCostPerSessionUsd.toFixed(4)} (₹{avgCostPerSessionInr.toFixed(2)})</strong>
            </p>
          </div>
        </div>

        {/* Total User Sessions */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card h-100 border rounded-3 p-3 shadow-xs bg-white">
            <div className="d-flex justify-content-between align-items-start mb-2">
              <span className="small text-muted fw-semibold text-uppercase tracking-wider">User Sessions</span>
              <div className="p-1.5 bg-primary-subtle rounded-2 text-primary">
                <i className="bi bi-people fs-5"></i>
              </div>
            </div>
            <div className="d-flex align-items-baseline gap-2 mb-1">
              <span className="fs-3 fw-bold text-dark font-monospace">
                {totalSessionsCount}
              </span>
              <span className="text-muted small">conversations</span>
            </div>
            <p className="text-muted small mb-0">
              Generated <strong>{totalMsgCount}</strong> total AI responses
            </p>
          </div>
        </div>

        {/* Total Tokens Consumed */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card h-100 border rounded-3 p-3 shadow-xs bg-white">
            <div className="d-flex justify-content-between align-items-start mb-2">
              <span className="small text-muted fw-semibold text-uppercase tracking-wider">Tokens Consumed</span>
              <div className="p-1.5 bg-warning-subtle rounded-2 text-warning">
                <i className="bi bi-cpu fs-5"></i>
              </div>
            </div>
            <div className="d-flex align-items-baseline gap-2 mb-1">
              <span className="fs-3 fw-bold text-dark font-monospace">
                {totalTokens.toLocaleString()}
              </span>
              <span className="text-muted small">tokens</span>
            </div>
            <p className="text-muted small mb-0">
              Cost rate: <strong>$0.14/1M</strong> in • <strong>$0.28/1M</strong> out
            </p>
          </div>
        </div>

        {/* Model & Economy */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card h-100 border rounded-3 p-3 shadow-xs bg-white">
            <div className="d-flex justify-content-between align-items-start mb-2">
              <span className="small text-muted fw-semibold text-uppercase tracking-wider">Active Model</span>
              <div className="p-1.5 bg-success-subtle rounded-2 text-success">
                <i className="bi bi-check-circle fs-5"></i>
              </div>
            </div>
            <div className="d-flex align-items-baseline gap-1 mb-1">
              <span className="fs-6 fw-bold text-dark text-truncate" title="deepseek/deepseek-v4.1-flash">
                DeepSeek V4.1 Flash
              </span>
            </div>
            <p className="text-muted small mb-0">
              Average cost per message: <strong className="text-success font-monospace">~₹0.07</strong>
            </p>
          </div>
        </div>
      </div>

      {/* 3b. Instagram DM AI Assistant Integration Card */}
      <div className="card border rounded-3 p-3 mb-3 shadow-xs bg-white">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3">
          <div className="d-flex align-items-center gap-3">
            <div
              className="d-flex align-items-center justify-content-center rounded-3 text-white shadow-xs"
              style={{
                width: '42px',
                height: '42px',
                background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)'
              }}
            >
              <i className="bi bi-instagram fs-4"></i>
            </div>
            <div>
              <div className="d-flex align-items-center gap-2">
                <h6 className="mb-0 fw-bold">Instagram DM Vehicle Specialist</h6>
                {instagramStatus?.connected ? (
                  <span className="badge bg-success-subtle text-success border border-success-subtle small">
                    <i className="bi bi-check-circle-fill me-1"></i> Connected
                  </span>
                ) : (
                  <span className="badge bg-warning-subtle text-warning border border-warning-subtle small">
                    <i className="bi bi-exclamation-triangle-fill me-1"></i> Token Not Set
                  </span>
                )}
              </div>
              <p className="text-muted small mb-0 mt-0.5">
                Automatically answers Instagram DMs with live inventory, transparent pricing & test drive links.
              </p>
            </div>
          </div>

          <div className="d-flex flex-wrap align-items-center gap-2">
            <button
              type="button"
              onClick={() => setShowIgSimulator(!showIgSimulator)}
              className="btn btn-sm btn-outline-danger d-inline-flex align-items-center gap-1.5"
            >
              <i className="bi bi-play-circle"></i>
              <span>{showIgSimulator ? 'Hide Test Simulator' : 'Test Instagram Bot'}</span>
            </button>
          </div>
        </div>

        {/* Integration Details / Webhook Info */}
        <div className="mt-3 pt-3 border-top row g-2 align-items-center">
          <div className="col-12 col-md-6">
            <div className="p-2 bg-light rounded-2 border">
              <span className="text-muted text-uppercase" style={{ fontSize: '10px', letterSpacing: '0.5px' }}>
                Meta Webhook Callback URL
              </span>
              <div className="d-flex align-items-center justify-content-between mt-0.5">
                <code className="text-dark small text-truncate pe-2">
                  {window.location.origin}/api/v1/instagram/webhook
                </code>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/api/v1/instagram/webhook`);
                    setCopiedWebhook(true);
                    setTimeout(() => setCopiedWebhook(false), 2000);
                  }}
                  className="btn btn-link p-0 text-decoration-none text-primary small shrink-0"
                >
                  <i className={`bi ${copiedWebhook ? 'bi-check-lg text-success' : 'bi-clipboard'}`}></i>
                  <span className="ms-1">{copiedWebhook ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>
          </div>

          <div className="col-12 col-md-6">
            <div className="p-2 bg-light rounded-2 border">
              <span className="text-muted text-uppercase" style={{ fontSize: '10px', letterSpacing: '0.5px' }}>
                Verify Token & Meta Field
              </span>
              <div className="d-flex align-items-center justify-content-between mt-0.5">
                <code className="text-dark small">
                  {instagramStatus?.verifyToken || 'harsha_ig_verify_token_2026'} (field: messages)
                </code>
                <span className="badge bg-secondary-subtle text-secondary small">
                  Graph API v21.0
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Expandable Live Interactive Test Simulator */}
        {showIgSimulator && (
          <div className="mt-3 p-3 bg-light rounded-3 border">
            <h6 className="fw-bold small mb-2 d-flex align-items-center gap-1.5">
              <i className="bi bi-chat-dots-fill text-danger"></i>
              <span>Simulate Customer Instagram DM</span>
            </h6>
            <div className="input-group input-group-sm mb-2">
              <input
                type="text"
                className="form-control"
                placeholder="Type sample message as an Instagram customer..."
                value={simPrompt}
                onChange={(e) => setSimPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleRunSimulation()}
              />
              <button
                type="button"
                onClick={handleRunSimulation}
                disabled={isSimulating || !simPrompt.trim()}
                className="btn btn-danger d-inline-flex align-items-center gap-1"
              >
                {isSimulating ? (
                  <>
                    <span className="spinner-border spinner-border-sm"></span>
                    <span>Querying DB...</span>
                  </>
                ) : (
                  <>
                    <i className="bi bi-send-fill"></i>
                    <span>Send Query</span>
                  </>
                )}
              </button>
            </div>

            {simResult && (
              <div className="p-2.5 bg-white rounded-2 border mt-2">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <span className="badge bg-primary-subtle text-primary small">
                    AI Reply Sent to Instagram User
                  </span>
                  {simResult.matchedCarsCount > 0 && (
                    <span className="badge bg-success-subtle text-success small">
                      {simResult.matchedCarsCount} Cars Matched
                    </span>
                  )}
                </div>
                <pre
                  className="mb-0 text-dark small"
                  style={{
                    whiteSpace: 'pre-wrap',
                    fontFamily: 'inherit',
                    lineHeight: '1.5'
                  }}
                >
                  {simResult.formattedInstagramReply || simResult.error}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 4. Folded Conversations Table with Dropdown Filters */}
      <div className="card border rounded-3 shadow-xs overflow-hidden bg-white">
        {/* Table Top Controls & Filter Bar */}
        <div className="card-header bg-white border-bottom p-3">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3">
            <div className="d-flex align-items-center gap-2">
              <h5 className="h6 mb-0 fw-bold d-flex align-items-center gap-2">
                <i className="bi bi-chat-square-quote text-primary"></i>
                <span>Customer Conversations ({filteredSessions.length})</span>
              </h5>
              <span className="badge bg-secondary-subtle text-secondary small">
                Folded View
              </span>
            </div>

            {/* Filter and Search Controls */}
            <div className="d-flex flex-wrap align-items-center gap-2 w-100 w-md-auto">
              {/* Search Bar */}
              <div className="input-group input-group-sm" style={{ maxWidth: '240px' }}>
                <span className="input-group-text bg-light border-end-0">
                  <i className="bi bi-search text-muted"></i>
                </span>
                <input
                  type="text"
                  className="form-control border-start-0"
                  placeholder="Filter sessions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button
                    className="btn btn-outline-secondary"
                    type="button"
                    onClick={() => setSearchTerm('')}
                  >
                    ×
                  </button>
                )}
              </div>

              {/* Filter Dropdown */}
              <div className="dropdown">
                <button
                  className="btn btn-sm btn-outline-secondary dropdown-toggle d-inline-flex align-items-center gap-1"
                  type="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  <i className="bi bi-funnel"></i>
                  <span>
                    {filterType === 'all'
                      ? 'All Chats'
                      : filterType === 'sql_only'
                      ? 'SQL Tool Calls'
                      : 'Multi-turn (>1)'}
                  </span>
                </button>
                <ul className="dropdown-menu dropdown-menu-end shadow-sm">
                  <li>
                    <button
                      className={`dropdown-item small ${filterType === 'all' ? 'active' : ''}`}
                      onClick={() => setFilterType('all')}
                    >
                      All Conversations
                    </button>
                  </li>
                  <li>
                    <button
                      className={`dropdown-item small ${filterType === 'sql_only' ? 'active' : ''}`}
                      onClick={() => setFilterType('sql_only')}
                    >
                      Conversations with SQL Queries
                    </button>
                  </li>
                  <li>
                    <button
                      className={`dropdown-item small ${filterType === 'multi_turn' ? 'active' : ''}`}
                      onClick={() => setFilterType('multi_turn')}
                    >
                      Multi-message Chats ({'>'}1 Turn)
                    </button>
                  </li>
                </ul>
              </div>

              {/* Sort Dropdown */}
              <div className="dropdown">
                <button
                  className="btn btn-sm btn-outline-secondary dropdown-toggle d-inline-flex align-items-center gap-1"
                  type="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  <i className="bi bi-sort-down"></i>
                  <span>
                    {sortBy === 'newest'
                      ? 'Newest'
                      : sortBy === 'highest_cost'
                      ? 'Highest Cost'
                      : 'Most Messages'}
                  </span>
                </button>
                <ul className="dropdown-menu dropdown-menu-end shadow-sm">
                  <li>
                    <button
                      className={`dropdown-item small ${sortBy === 'newest' ? 'active' : ''}`}
                      onClick={() => setSortBy('newest')}
                    >
                      Newest Interaction First
                    </button>
                  </li>
                  <li>
                    <button
                      className={`dropdown-item small ${sortBy === 'highest_cost' ? 'active' : ''}`}
                      onClick={() => setSortBy('highest_cost')}
                    >
                      Highest Spend ($ / ₹)
                    </button>
                  </li>
                  <li>
                    <button
                      className={`dropdown-item small ${sortBy === 'most_messages' ? 'active' : ''}`}
                      onClick={() => setSortBy('most_messages')}
                    >
                      Most Messages First
                    </button>
                  </li>
                </ul>
              </div>

              {/* Expand All / Collapse All Toggle */}
              {filteredSessions.length > 0 && (
                <button
                  type="button"
                  onClick={handleToggleExpandAll}
                  className="btn btn-sm btn-outline-dark d-inline-flex align-items-center gap-1"
                  title="Expand or collapse all conversation drawers"
                >
                  <i className="bi bi-arrows-expand"></i>
                  <span>
                    {filteredSessions.every((s) => expandedSessions[s.sessionId])
                      ? 'Fold All'
                      : 'Expand All'}
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Sessions List Content */}
        {loading ? (
          <div className="p-5 text-center text-muted">
            <div className="spinner-border spinner-border-sm text-primary mb-2" role="status"></div>
            <p className="small mb-0">Loading conversation sessions from Supabase Cloud...</p>
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="p-5 text-center text-muted">
            <i className="bi bi-chat-square-dots fs-3 mb-2 d-block text-secondary"></i>
            <h6 className="fw-bold mb-1">No Conversations Found</h6>
            <p className="small mb-3">
              {searchTerm || filterType !== 'all'
                ? 'No sessions matched your selected filters.'
                : 'Start a conversation using the "Ask Harsha AI" button on the site to see clean session records appear here!'}
            </p>
            {!tableExists && (
              <button
                type="button"
                onClick={() => setShowSqlModal(true)}
                className="btn btn-sm btn-primary"
              >
                Run SQL Setup Script
              </button>
            )}
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.85rem' }}>
              <thead className="table-light text-muted fw-semibold">
                <tr>
                  <th style={{ width: '40px' }}></th>
                  <th style={{ width: '190px' }}>User / Session</th>
                  <th style={{ width: '110px' }} className="text-center">Messages</th>
                  <th style={{ width: '130px' }}>Last Activity</th>
                  <th>Latest User Inquiry</th>
                  <th style={{ width: '100px' }} className="text-end">Tokens</th>
                  <th style={{ width: '140px' }} className="text-end">Total Cost</th>
                  <th style={{ width: '120px' }} className="text-end">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredSessions.map((session, sIdx) => {
                  const isExpanded = Boolean(expandedSessions[session.sessionId]);
                  const lastTimeFormatted = session.lastMessageAt
                    ? new Date(session.lastMessageAt).toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                    : 'Recent';
                  const lastDateFormatted = session.lastMessageAt
                    ? new Date(session.lastMessageAt).toLocaleDateString('en-IN', {
                        month: 'short',
                        day: 'numeric'
                      })
                    : '';

                  return (
                    <React.Fragment key={session.sessionId}>
                      <tr
                        onClick={() => toggleSession(session.sessionId)}
                        className={`cursor-pointer transition ${isExpanded ? 'table-active' : ''}`}
                        style={{ cursor: 'pointer' }}
                      >
                        {/* Caret icon */}
                        <td className="text-center text-muted px-2">
                          <i
                            className={`bi bi-chevron-${isExpanded ? 'down' : 'right'} transition`}
                            style={{ fontSize: '0.8rem' }}
                          ></i>
                        </td>

                        {/* User / Session */}
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <div className="w-7 h-7 rounded-circle bg-primary bg-opacity-10 text-primary d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: '28px', height: '28px' }}>
                              <i className="bi bi-person-fill" style={{ fontSize: '0.85rem' }}></i>
                            </div>
                            <div className="min-w-0">
                              <span
                                className="fw-bold text-dark font-monospace text-truncate d-block"
                                style={{ maxWidth: '140px' }}
                                title={session.sessionId}
                              >
                                {session.sessionId}
                              </span>
                              <span className="text-muted" style={{ fontSize: '0.72rem' }}>
                                {session.model?.split('/')[1] || session.model}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Message Count */}
                        <td className="text-center">
                          <span
                            className={`badge rounded-pill ${
                              session.totalMessages > 1
                                ? 'bg-primary-subtle text-primary border border-primary-subtle'
                                : 'bg-secondary-subtle text-secondary'
                            }`}
                          >
                            {session.totalMessages} {session.totalMessages === 1 ? 'msg' : 'msgs'}
                          </span>
                        </td>

                        {/* Last Active */}
                        <td>
                          <div className="fw-semibold text-dark">{lastTimeFormatted}</div>
                          <div className="text-muted" style={{ fontSize: '0.72rem' }}>
                            {lastDateFormatted}
                          </div>
                        </td>

                        {/* Latest Inquiry (Clean 1-line truncation) */}
                        <td>
                          <div className="d-flex align-items-center gap-1.5">
                            <span className="badge bg-light text-secondary border flex-shrink-0" style={{ fontSize: '0.68rem' }}>
                              Last Prompt
                            </span>
                            <span
                              className="text-truncate text-dark fw-medium"
                              style={{ maxWidth: '340px' }}
                              title={session.latestPrompt}
                            >
                              "{session.latestPrompt}"
                            </span>
                          </div>
                          {session.hasSqlTools && (
                            <div className="mt-1">
                              <span className="badge bg-info-subtle text-info border border-info-subtle" style={{ fontSize: '0.68rem' }}>
                                <i className="bi bi-database me-1"></i>
                                Used SQL Tool
                              </span>
                            </div>
                          )}
                        </td>

                        {/* Tokens */}
                        <td className="text-end">
                          <span className="font-monospace fw-semibold text-dark">
                            {session.totalTokens.toLocaleString()}
                          </span>
                        </td>

                        {/* Total Cost ($ / ₹) */}
                        <td className="text-end">
                          <div className="font-monospace fw-bold text-dark">
                            ${session.totalCostUsd.toFixed(5)}
                          </div>
                          <div className="font-monospace fw-bold text-success" style={{ fontSize: '0.78rem' }}>
                            ₹{session.totalCostInr.toFixed(3)}
                          </div>
                        </td>

                        {/* Action Dropdown / Toggle Button */}
                        <td className="text-end">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleSession(session.sessionId);
                            }}
                            className={`btn btn-xs d-inline-flex align-items-center gap-1 ${
                              isExpanded ? 'btn-primary' : 'btn-outline-primary'
                            }`}
                            style={{ fontSize: '0.75rem', padding: '3px 8px' }}
                          >
                            <span>{isExpanded ? 'Fold' : `View (${session.totalMessages})`}</span>
                            <i className={`bi bi-chevron-${isExpanded ? 'up' : 'down'}`}></i>
                          </button>
                        </td>
                      </tr>

                      {/* ====================================================
                          EXPANDED DRAWER: CLEAN TURN-BY-TURN CONVERSATION
                      ==================================================== */}
                      {isExpanded && (
                        <tr className="bg-light bg-opacity-75">
                          <td colSpan={8} className="p-3 p-md-4 border-top border-bottom">
                            <div className="bg-white rounded-3 border p-3 shadow-xs">
                              {/* Session Drawer Header */}
                              <div className="d-flex flex-wrap justify-content-between align-items-center pb-2 mb-3 border-bottom gap-2">
                                <div className="d-flex align-items-center gap-2">
                                  <span className="badge bg-primary text-white fw-semibold">
                                    Conversation Thread
                                  </span>
                                  <span className="font-monospace small text-muted">
                                    {session.sessionId}
                                  </span>
                                  <span className="text-muted small">•</span>
                                  <span className="small text-muted">
                                    {session.totalMessages} {session.totalMessages === 1 ? 'Interaction' : 'Interactions'}
                                  </span>
                                </div>

                                <div className="d-flex align-items-center gap-3">
                                  <span className="small text-muted font-monospace">
                                    Session Spend: <strong className="text-dark">${session.totalCostUsd.toFixed(5)}</strong> (<strong className="text-success">₹{session.totalCostInr.toFixed(3)}</strong>)
                                  </span>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleSession(session.sessionId);
                                    }}
                                    className="btn btn-sm btn-outline-secondary py-0 px-2"
                                    style={{ fontSize: '0.75rem' }}
                                  >
                                    Fold Thread ▴
                                  </button>
                                </div>
                              </div>

                              {/* Compacted Conversation Memory Block (500 tokens limit) */}
                              {sessionSummaries[session.sessionId] && sessionSummaries[session.sessionId].length > 0 && (
                                <div className="alert alert-info border-info-subtle mb-3 p-3 rounded-3">
                                  <div className="d-flex align-items-center justify-content-between mb-2">
                                    <div className="d-flex align-items-center gap-2">
                                      <i className="bi bi-cpu-fill text-info fs-6"></i>
                                      <strong className="text-info-emphasis small">
                                        Compacted Memory Summaries ({sessionSummaries[session.sessionId].length} {sessionSummaries[session.sessionId].length === 1 ? 'Row' : 'Rows'} | 500-Token Cap)
                                      </strong>
                                    </div>
                                    <span className="badge bg-info text-white" style={{ fontSize: '0.7rem' }}>
                                      Auto-Compacted
                                    </span>
                                  </div>
                                  <div className="d-flex flex-column gap-2">
                                    {sessionSummaries[session.sessionId].map((sum, sIdx) => (
                                      <div key={sum.id || sIdx} className="bg-white p-2.5 rounded-2 border border-info-subtle small shadow-xs">
                                        <div className="d-flex justify-content-between align-items-center text-muted mb-1 pb-1 border-bottom border-light" style={{ fontSize: '0.72rem' }}>
                                          <span className="fw-semibold text-dark">
                                            Summary Row #{sIdx + 1} • {sum.message_count || 0} Messages Compacted
                                          </span>
                                          <div className="d-flex align-items-center gap-2">
                                            <span className={`badge ${sum.is_sealed ? 'bg-secondary' : 'bg-primary-subtle text-primary'} border`} style={{ fontSize: '0.65rem' }}>
                                              {sum.is_sealed ? 'Sealed (Full)' : 'Open (Accumulating)'}
                                            </span>
                                            <span className="font-monospace fw-bold text-primary">
                                              {sum.token_count || 0} / 500 tokens
                                            </span>
                                          </div>
                                        </div>
                                        <div className="text-dark mt-1" style={{ whiteSpace: 'pre-wrap', fontSize: '0.8rem', lineHeight: '1.4' }}>
                                          {sum.summary}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Turns List */}
                              <div className="space-y-3">
                                {session.messages.map((turn, tIdx) => {
                                  const hasSql = turn.tool_calls && Array.isArray(turn.tool_calls) && turn.tool_calls.length > 0;
                                  const isSqlExpanded = Boolean(expandedSqlTurn[turn.id]);
                                  const isTextExpanded = Boolean(expandedFullText[turn.id]);
                                  const isCompacted = Boolean(turn.is_compacted);
                                  const turnTime = turn.created_at
                                    ? new Date(turn.created_at).toLocaleTimeString('en-IN', {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        second: '2-digit'
                                      })
                                    : '';

                                  return (
                                    <div
                                      key={turn.id || tIdx}
                                      className="border rounded-3 p-3 bg-light bg-opacity-25"
                                    >
                                      {/* Turn Sub-header */}
                                      <div className="d-flex flex-wrap justify-content-between align-items-center pb-2 mb-2 border-bottom border-light gap-2">
                                        <div className="d-flex align-items-center gap-2">
                                          <span className="badge bg-secondary-subtle text-secondary small">
                                            Turn #{tIdx + 1}
                                          </span>
                                          {isCompacted ? (
                                            <span className="badge bg-secondary-subtle text-secondary border small" title="Folded into compacted summary row">
                                              <i className="bi bi-archive me-1"></i>Compacted
                                            </span>
                                          ) : (
                                            <span className="badge bg-success-subtle text-success border small" title="Active recent message in active context">
                                              <i className="bi bi-lightning-charge me-1"></i>Active
                                            </span>
                                          )}
                                          <span className="text-muted small">{turnTime}</span>
                                          {turn.duration_ms > 0 && (
                                            <span className="badge bg-light text-muted border small">
                                              {turn.duration_ms}ms
                                            </span>
                                          )}
                                        </div>

                                        <div className="d-flex align-items-center gap-2">
                                          {hasSql && (
                                            <button
                                              type="button"
                                              onClick={() => toggleSql(turn.id)}
                                              className={`btn btn-xs d-inline-flex align-items-center gap-1 font-monospace ${
                                                isSqlExpanded ? 'btn-dark' : 'btn-outline-dark'
                                              }`}
                                              style={{ fontSize: '0.72rem', padding: '2px 7px' }}
                                            >
                                              <i className="bi bi-terminal"></i>
                                              <span>{turn.tool_calls.length} SQL {turn.tool_calls.length === 1 ? 'Query' : 'Queries'}</span>
                                              <i className={`bi bi-chevron-${isSqlExpanded ? 'up' : 'down'}`}></i>
                                            </button>
                                          )}

                                          <span className="font-monospace small text-muted">
                                            {turn.total_tokens?.toLocaleString()} tokens
                                          </span>
                                          <span className="badge bg-success-subtle text-success font-monospace" style={{ fontSize: '0.72rem' }}>
                                            ${Number(turn.cost_usd || 0).toFixed(5)} (₹{Number(turn.cost_inr || 0).toFixed(3)})
                                          </span>
                                        </div>
                                      </div>

                                      {/* Customer Prompt */}
                                      <div className="mb-2">
                                        <div className="d-flex items-center gap-1 mb-1">
                                          <span className="badge bg-primary text-white" style={{ fontSize: '0.68rem' }}>
                                            User Asked
                                          </span>
                                        </div>
                                        <div className="bg-white p-2.5 rounded-2 border text-dark fw-medium" style={{ fontSize: '0.85rem' }}>
                                          {turn.user_prompt}
                                        </div>
                                      </div>

                                      {/* AI Synthesized Response (Foldable preview if long) */}
                                      <div className="mb-2">
                                        <div className="d-flex items-center justify-content-between mb-1">
                                          <span className="badge bg-secondary text-white" style={{ fontSize: '0.68rem' }}>
                                            AI Response
                                          </span>
                                          {turn.assistant_response && turn.assistant_response.length > 250 && (
                                            <button
                                              type="button"
                                              onClick={() => toggleFullText(turn.id)}
                                              className="btn btn-link p-0 text-primary small text-decoration-none"
                                              style={{ fontSize: '0.75rem' }}
                                            >
                                              {isTextExpanded ? 'Show Less ▴' : 'Show Full Response ▾'}
                                            </button>
                                          )}
                                        </div>
                                        <div
                                          className="bg-white p-2.5 rounded-2 border text-dark whitespace-pre-wrap"
                                          style={{
                                            fontSize: '0.83rem',
                                            maxHeight: isTextExpanded ? 'none' : '110px',
                                            overflowY: isTextExpanded ? 'visible' : 'hidden'
                                          }}
                                        >
                                          {turn.assistant_response}
                                        </div>
                                      </div>

                                      {/* Matched Cars (if any) */}
                                      {turn.matched_cars && turn.matched_cars.length > 0 && (
                                        <div className="d-flex flex-wrap align-items-center gap-1.5 mt-2">
                                          <span className="small text-muted me-1" style={{ fontSize: '0.72rem' }}>
                                            Matched Vehicles ({turn.matched_cars.length}):
                                          </span>
                                          {turn.matched_cars.map((c, cIdx) => (
                                            <span
                                              key={cIdx}
                                              className="badge bg-white text-dark border shadow-2xs"
                                              style={{ fontSize: '0.72rem' }}
                                            >
                                              🚗 {c.title} ({c.priceFormatted || `₹ ${c.price}`})
                                            </span>
                                          ))}
                                        </div>
                                      )}

                                      {/* Unfolded SQL Box */}
                                      {isSqlExpanded && hasSql && (
                                        <div className="mt-3 bg-dark text-white p-3 rounded-3 font-monospace shadow-inner" style={{ fontSize: '0.78rem' }}>
                                          <div className="d-flex justify-content-between align-items-center mb-2 pb-1 border-bottom border-secondary">
                                            <span className="text-success fw-bold d-flex align-items-center gap-1.5">
                                              <i className="bi bi-database-check"></i>
                                              <span>Executed Read-Only PostgreSQL Query</span>
                                            </span>
                                            <button
                                              type="button"
                                              onClick={() => {
                                                const queries = turn.tool_calls.map((tc) => tc.query).join('\n\n');
                                                navigator.clipboard.writeText(queries);
                                              }}
                                              className="btn btn-xs btn-outline-light py-0 px-2"
                                              style={{ fontSize: '0.7rem' }}
                                            >
                                              Copy SQL
                                            </button>
                                          </div>
                                          {turn.tool_calls.map((tc, qIdx) => (
                                            <pre key={qIdx} className="mb-2 text-warning whitespace-pre-wrap leading-relaxed">
                                              {tc.query}
                                            </pre>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 5. SQL Setup Modal */}
      {showSqlModal && (
        <div
          className="modal fade show d-block"
          style={{ backgroundColor: 'rgba(0,0,0,0.65)', zIndex: 1060 }}
          tabIndex="-1"
        >
          <div className="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable">
            <div className="modal-content shadow-lg border-0 rounded-4">
              <div className="modal-header border-bottom bg-light">
                <div>
                  <h5 className="modal-title fw-bold text-dark d-flex align-items-center gap-2">
                    <i className="bi bi-database-fill-gear text-primary"></i>
                    <span>Supabase Cloud SQL Setup Script</span>
                  </h5>
                  <p className="text-muted small mb-0">
                    Run this SQL script in your Supabase project to create the <code>agent_messages</code> and <code>agent_conversations</code> tables.
                  </p>
                </div>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowSqlModal(false)}
                  aria-label="Close"
                ></button>
              </div>

              <div className="modal-body p-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="small text-muted font-monospace">
                    schema/agent_cost_analytics.sql
                  </span>
                  <div className="d-flex gap-2">
                    <a
                      href="https://supabase.com/dashboard/project/qkriofsteqxccheavuot/editor"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-1"
                    >
                      <i className="bi bi-box-arrow-up-right"></i>
                      <span>Open SQL Editor</span>
                    </a>
                    <button
                      type="button"
                      onClick={handleCopySql}
                      className="btn btn-sm btn-primary d-inline-flex align-items-center gap-1"
                    >
                      <i className="bi bi-clipboard"></i>
                      <span>{copySuccess ? 'Copied to Clipboard!' : 'Copy SQL Script'}</span>
                    </button>
                  </div>
                </div>

                <pre
                  className="bg-dark text-success p-3 rounded-3 font-monospace overflow-auto"
                  style={{ maxHeight: '380px', fontSize: '0.78rem' }}
                >
                  {AGENT_SQL_SETUP_SCRIPT}
                </pre>
              </div>

              <div className="modal-footer border-top bg-light">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setShowSqlModal(false)}
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={handleCopySql}
                  className="btn btn-primary btn-sm d-inline-flex align-items-center gap-1"
                >
                  <i className="bi bi-clipboard-check"></i>
                  <span>{copySuccess ? 'Copied!' : 'Copy SQL'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
