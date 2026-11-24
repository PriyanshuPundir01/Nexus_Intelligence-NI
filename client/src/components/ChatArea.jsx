import React, { useState } from 'react';
import CuteDoodle from './CuteDoodle';
import GeminiSearchingLoader from './GeminiSearchingLoader';
import { 
  Bot, 
  User, 
  FileText, 
  Image as ImageIcon, 
  Link as LinkIcon, 
  ChevronDown, 
  ChevronUp, 
  Copy, 
  Check, 
  Sparkles, 
  Zap, 
  CheckCircle2, 
  MessageSquare,
  RotateCcw,
  StickyNote,
  Headphones,
  BookOpen
} from 'lucide-react';

// Lightweight, clean Markdown renderer for structured, easily readable responses with XSS Sanitization
function escapeHtml(unsafe) {
  if (!unsafe) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function FormattedResponse({ content }) {
  if (!content) return null;

  const lines = content.split('\n');
  const elements = [];
  let currentList = [];

  const flushList = (keyPrefix) => {
    if (currentList.length > 0) {
      elements.push(
        <ul key={`${keyPrefix}_list`} style={{ margin: '0.6rem 0 0.85rem 0', paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          {currentList.map((item, idx) => (
            <li key={idx} style={{ lineHeight: '1.6', fontSize: '0.92rem' }}>
              <span dangerouslySetInnerHTML={{ __html: formatInline(item) }} />
            </li>
          ))}
        </ul>
      );
      currentList = [];
    }
  };

  const formatInline = (text) => {
    if (!text) return '';
    // XSS Sanitization: escape HTML tags and special characters before converting markdown tokens
    const safeText = escapeHtml(text);
    return safeText
      .replace(/\*\*(.*?)\*\*/g, '<strong style="color: var(--accent-cyan); font-weight: 700;">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code style="background: rgba(255,255,255,0.08); padding: 0.15rem 0.4rem; border-radius: 4px; font-family: var(--font-mono); font-size: 0.85em; color: #f472b6;">$1</code>');
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    if (trimmed.startsWith('### ') || trimmed.startsWith('## ') || trimmed.startsWith('# ')) {
      flushList(`flush_${index}`);
      const headingText = trimmed.replace(/^#+\s*/, '');
      elements.push(
        <h3 key={index} style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: index === 0 ? 0 : '1.1rem', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Sparkles size={14} style={{ color: 'var(--accent-primary)' }} />
          <span dangerouslySetInnerHTML={{ __html: formatInline(headingText) }} />
        </h3>
      );
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.startsWith('• ')) {
      const listItem = trimmed.replace(/^[-*•]\s*/, '');
      currentList.push(listItem);
    } else if (/^\d+\.\s/.test(trimmed)) {
      flushList(`flush_${index}`);
      const itemText = trimmed.replace(/^\d+\.\s*/, '');
      elements.push(
        <div key={index} style={{ display: 'flex', gap: '0.5rem', margin: '0.35rem 0', fontSize: '0.92rem', lineHeight: '1.6' }}>
          <span style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>•</span>
          <span dangerouslySetInnerHTML={{ __html: formatInline(itemText) }} />
        </div>
      );
    } else if (trimmed === '') {
      flushList(`flush_${index}`);
    } else {
      flushList(`flush_${index}`);
      elements.push(
        <p key={index} style={{ marginBottom: '0.65rem', lineHeight: '1.65', fontSize: '0.93rem' }}>
          <span dangerouslySetInnerHTML={{ __html: formatInline(trimmed) }} />
        </p>
      );
    }
  });

  flushList('final_flush');
  return <div className="response-content">{elements}</div>;
}

export default function ChatArea({ 
  messages = [], 
  loading = false, 
  sources = [], 
  totalChunks = 0, 
  onSelectPrompt,
  onOpenAddModal,
  onOpenStudio,
  onSaveNote,
  user
}) {
  const [copiedId, setCopiedId] = useState(null);
  const [expandedCitations, setExpandedCitations] = useState({});

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleCitations = (msgId) => {
    setExpandedCitations(prev => ({
      ...prev,
      [msgId]: !prev[msgId]
    }));
  };

  const quickPrompts = [
    {
      title: '🎯 Direct Summary',
      desc: 'Get key insights without filler or fluff',
      query: 'Give me a direct, crystal-clear summary of the most important concepts and findings from my uploaded sources.'
    },
    {
      title: '⚙️ Architecture & Flow',
      desc: 'Understand methodology, diagrams, or workflows',
      query: 'Explain the technical methodology, architecture diagrams, and system workflow described in my files.'
    },
    {
      title: '📊 Key Data & Numbers',
      desc: 'Extract benchmarks, metrics, and quantitative facts',
      query: 'What specific metrics, statistics, benchmarks, and experimental figures are present in the documents?'
    },
    {
      title: '🔍 Critical Review & Insights',
      desc: 'Identify strengths, limitations, and future scope',
      query: 'What are the main advantages, limitations, and practical takeaways mentioned across the sources?'
    }
  ];

  return (
    <div className="chat-messages-scroll">
      {messages.length === 0 ? (
        <div className="hero-welcome">
          
          {/* Centered Cute Animated Doodle Mascot */}
          <div style={{ marginBottom: '0.75rem' }}>
            <CuteDoodle state="idle" size={90} />
          </div>

          <div className="hero-icon-cluster" style={{ marginBottom: '1rem' }}>
            <button 
              type="button"
              className="hero-icon-pill" 
              title="Upload PDF Document"
              onClick={() => onOpenAddModal('pdf')}
              style={{ cursor: 'pointer', border: '1px solid var(--border-subtle)' }}
            >
              <FileText size={22} color="#f87171" />
            </button>
            <button 
              type="button"
              className="hero-icon-pill" 
              title="Upload Image & Diagram (Vision OCR)"
              onClick={() => onOpenAddModal('image')}
              style={{ cursor: 'pointer', border: '1px solid var(--border-subtle)' }}
            >
              <ImageIcon size={22} color="#34d399" />
            </button>
            <button 
              type="button"
              className="hero-icon-pill" 
              title="Add Web & YouTube Links"
              onClick={() => onOpenAddModal('link')}
              style={{ cursor: 'pointer', border: '1px solid var(--border-subtle)' }}
            >
              <LinkIcon size={22} color="#22d3ee" />
            </button>
          </div>

          <h2>NI: Nexus Intelligence</h2>
          <p>
            Chat with <strong>PDFs</strong>. Drop a <strong>YouTube link</strong>. Upload <strong>Images</strong>. Stay in one thread.
          </p>

          <div className="stats-banner">
            <button 
              type="button"
              className="stat-pill clickable"
              onClick={() => onOpenAddModal('pdf')}
              title="Add or manage PDFs"
            >
              <FileText size={15} color="#f87171" />
              <span>PDFs: <strong>{sources.filter(s => s.type === 'pdf').length}</strong></span>
            </button>
            <button 
              type="button"
              className="stat-pill clickable"
              onClick={() => onOpenAddModal('image')}
              title="Add or manage Images"
            >
              <ImageIcon size={15} color="#34d399" />
              <span>Images: <strong>{sources.filter(s => s.type === 'image').length}</strong></span>
            </button>
            <button 
              type="button"
              className="stat-pill clickable"
              onClick={() => onOpenAddModal('link')}
              title="Add or manage Links"
            >
              <LinkIcon size={15} color="#22d3ee" />
              <span>Links: <strong>{sources.filter(s => s.type === 'link').length}</strong></span>
            </button>
            <button 
              type="button"
              className="stat-pill clickable"
              onClick={() => onOpenAddModal('pdf')}
              title="Manage knowledge base"
            >
              <Sparkles size={15} color="var(--accent-primary)" />
              <span>Knowledge Chunks: <strong>{totalChunks}</strong></span>
            </button>
          </div>

          {sources.length === 0 ? (
            <button 
              className="btn-gradient"
              style={{ padding: '0.75rem 1.6rem', fontSize: '0.95rem', marginBottom: '2rem' }}
              onClick={onOpenAddModal}
            >
              + Upload PDF, Image, or Link
            </button>
          ) : (
            <>
              {onOpenStudio && (
                <div style={{ marginBottom: '1.25rem', display: 'flex', justifyContent: 'center' }}>
                  <button 
                    onClick={onOpenStudio}
                    className="btn-gradient"
                    style={{ padding: '0.65rem 1.25rem', fontSize: '0.86rem', display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 4px 18px rgba(99, 102, 241, 0.4)' }}
                  >
                    <Headphones size={16} /> Open Notebook Studio (Audio Overview & Study Guide)
                  </button>
                </div>
              )}

              <div className="quick-prompts-grid">
                {quickPrompts.map((p, idx) => (
                  <button 
                    key={idx} 
                    className="quick-prompt-btn"
                    onClick={() => onSelectPrompt(p.query)}
                  >
                    <div className="quick-prompt-title">{p.title}</div>
                    <div>{p.desc}</div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      ) : (
        messages.map((msg) => {
          if (msg.role === 'user') {
            return (
              <div key={msg.id} className="message-row user">
                {/* Glowing Avatar Ring */}
                <div 
                  className="message-avatar user" 
                  title={user?.name ? `${user.name} (${user.email || ''})` : 'You'}
                >
                  {user?.name ? (
                    <span style={{ fontSize: '0.85rem', fontWeight: 800 }}>
                      {user.name.trim().charAt(0).toUpperCase()}
                    </span>
                  ) : (
                    <User size={17} />
                  )}
                </div>

                {/* User Bubble & Meta */}
                <div className="user-bubble-wrapper">
                  <div className="message-bubble user-bubble">
                    <div className="user-bubble-text">
                      {msg.text}
                    </div>
                  </div>

                  <div className="user-bubble-meta">
                    <span className="user-bubble-author">
                      {user?.name ? user.name.split(' ')[0] : 'You'}
                    </span>
                    <span className="user-bubble-dot">•</span>
                    <span className="user-bubble-time">
                      {msg.timestamp || 'Just now'}
                    </span>

                    <button 
                      className="user-bubble-action-btn"
                      onClick={() => handleCopy(msg.text, msg.id)}
                      title="Copy question text"
                    >
                      {copiedId === msg.id ? (
                        <>
                          <Check size={11} color="#10b981" />
                          <span style={{ color: '#10b981' }}>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy size={11} />
                          <span>Copy</span>
                        </>
                      )}
                    </button>

                    {onSelectPrompt && (
                      <button 
                        className="user-bubble-action-btn"
                        onClick={() => onSelectPrompt(msg.text)}
                        title="Re-run or edit question"
                      >
                        <RotateCcw size={11} />
                        <span>Re-ask</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          }

          // Assistant Message
          return (
            <div key={msg.id} className="message-row assistant">
              <div className="message-avatar assistant">
                <Zap size={18} />
              </div>

              <div className="message-bubble assistant-bubble">
                <div className="assistant-bubble-header">
                  <span className="assistant-bubble-badge">
                    <Zap size={12} /> Nexus Intelligence (NI)
                  </span>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    {onSaveNote && (
                      <button 
                        className="composer-btn-icon" 
                        style={{ width: '26px', height: '26px' }}
                        onClick={() => {
                          onSaveNote({
                            id: `note_${Date.now()}`,
                            title: 'Saved Chat Insight',
                            content: msg.text,
                            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          });
                        }}
                        title="Save response to Notes"
                      >
                        <StickyNote size={13} />
                      </button>
                    )}
                    <button 
                      className="composer-btn-icon" 
                      style={{ width: '26px', height: '26px' }}
                      onClick={() => handleCopy(msg.text, msg.id)}
                      title="Copy response"
                    >
                      {copiedId === msg.id ? <Check size={13} color="#10b981" /> : <Copy size={13} />}
                    </button>
                  </div>
                </div>

                {/* Formatted Content */}
                <FormattedResponse content={msg.text} />

                {/* Citations Drawer */}
                {msg.citations && msg.citations.length > 0 && (
                  <div className="citations-box">
                    <div 
                      className="citations-header"
                      onClick={() => toggleCitations(msg.id)}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <CheckCircle2 size={13} style={{ color: 'var(--accent-emerald)' }} />
                        Verified Source Passages ({msg.citations.length} Citations)
                      </span>
                      {expandedCitations[msg.id] ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                    </div>

                    {expandedCitations[msg.id] && (
                      <div className="citations-list">
                        {msg.citations.map((c, cIdx) => (
                          <div key={cIdx} className="citation-card">
                            <div className="citation-source-name">
                              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                <span className={`source-badge ${c.type}`}>{c.type}</span>
                                {c.sourceName}
                              </span>
                              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                Relevance: {c.score}
                              </span>
                            </div>
                            <div className="citation-text">
                              "{c.text}"
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })
      )}

      {/* Signature Gemini Searching Animation */}
      {loading && (
        <div className="message-row assistant">
          <div className="message-avatar assistant">
            <Zap size={18} />
          </div>
          <GeminiSearchingLoader />
        </div>
      )}
    </div>
  );
}
