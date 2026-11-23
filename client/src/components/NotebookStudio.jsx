import React, { useState, useEffect, useRef } from 'react';
import { 
  Headphones, 
  BookOpen, 
  HelpCircle, 
  Calendar, 
  FileText, 
  StickyNote, 
  Play, 
  Pause, 
  Square, 
  Copy, 
  Check, 
  Sparkles, 
  RefreshCw, 
  X, 
  Plus, 
  Trash2, 
  Download,
  Volume2,
  VolumeX,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

function escapeHtml(unsafe) {
  if (!unsafe) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function StudioMarkdownViewer({ text }) {
  if (!text) return null;
  const lines = text.split('\n');
  const elements = [];

  const formatInline = (t) => {
    return escapeHtml(t)
      .replace(/\*\*(.*?)\*\*/g, '<strong style="color: var(--accent-cyan); font-weight: 700;">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code style="background: rgba(255,255,255,0.08); padding: 0.15rem 0.35rem; border-radius: 4px; font-family: var(--font-mono); font-size: 0.85em; color: #f472b6;">$1</code>');
  };

  lines.forEach((line, i) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('# ')) {
      elements.push(
        <h2 key={i} style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: '1rem 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Sparkles size={16} style={{ color: 'var(--accent-primary)' }} />
          <span dangerouslySetInnerHTML={{ __html: formatInline(trimmed.replace(/^#\s*/, '')) }} />
        </h2>
      );
    } else if (trimmed.startsWith('## ')) {
      elements.push(
        <h3 key={i} style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0.85rem 0 0.35rem 0' }}>
          <span dangerouslySetInnerHTML={{ __html: formatInline(trimmed.replace(/^##\s*/, '')) }} />
        </h3>
      );
    } else if (trimmed.startsWith('### ')) {
      elements.push(
        <h4 key={i} style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--accent-primary)', margin: '0.7rem 0 0.25rem 0' }}>
          <span dangerouslySetInnerHTML={{ __html: formatInline(trimmed.replace(/^###\s*/, '')) }} />
        </h4>
      );
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      elements.push(
        <div key={i} style={{ display: 'flex', gap: '0.5rem', margin: '0.3rem 0', fontSize: '0.88rem', lineHeight: 1.6 }}>
          <span style={{ color: 'var(--accent-primary)', fontWeight: 700 }}>•</span>
          <span dangerouslySetInnerHTML={{ __html: formatInline(trimmed.replace(/^[-*]\s*/, '')) }} />
        </div>
      );
    } else if (/^\d+\.\s/.test(trimmed)) {
      elements.push(
        <div key={i} style={{ display: 'flex', gap: '0.5rem', margin: '0.35rem 0', fontSize: '0.88rem', lineHeight: 1.6 }}>
          <span style={{ color: 'var(--accent-cyan)', fontWeight: 700 }}>{trimmed.match(/^\d+\./)[0]}</span>
          <span dangerouslySetInnerHTML={{ __html: formatInline(trimmed.replace(/^\d+\.\s*/, '')) }} />
        </div>
      );
    } else if (trimmed === '') {
      elements.push(<div key={i} style={{ height: '0.45rem' }} />);
    } else {
      elements.push(
        <p key={i} style={{ margin: '0.3rem 0', fontSize: '0.88rem', lineHeight: 1.65, color: 'var(--text-secondary)' }}>
          <span dangerouslySetInnerHTML={{ __html: formatInline(trimmed) }} />
        </p>
      );
    }
  });

  return <div style={{ wordBreak: 'break-word' }}>{elements}</div>;
}

export default function NotebookStudio({ 
  isOpen, 
  onClose, 
  sources = [], 
  selectedSourceIds = [], 
  token = '', 
  guestSessionId = '',
  notes = [],
  onAddNote,
  onDeleteNote
}) {
  const [activeTab, setActiveTab] = useState('podcast'); // 'podcast', 'study-guide', 'faq', 'timeline', 'briefing', 'notes'
  const [loading, setLoading] = useState(false);
  const [studioOutputs, setStudioOutputs] = useState({
    podcast: null,
    'study-guide': null,
    faq: null,
    timeline: null,
    briefing: null
  });
  const [copied, setCopied] = useState(false);
  const [newNoteInput, setNewNoteInput] = useState('');
  const [newNoteTitle, setNewNoteTitle] = useState('');

  // Audio Playback State for Podcast
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isPausedAudio, setIsPausedAudio] = useState(false);
  const [currentSpeakerTurn, setCurrentSpeakerTurn] = useState(-1);
  const [audioSpeed, setAudioSpeed] = useState(1);
  const speechUtteranceRef = useRef(null);

  const selectedCount = selectedSourceIds.length;
  const activeSourcesText = selectedCount > 0 
    ? `${selectedCount} of ${sources.length} sources selected`
    : `All ${sources.length} sources active`;

  // Parse podcast lines into turns
  const getPodcastTurns = (content) => {
    if (!content) return [];
    const lines = content.split('\n').filter(l => l.trim().length > 0);
    const turns = [];

    lines.forEach((line) => {
      const trimmed = line.trim();
      if (/^Alex:\s*/i.test(trimmed)) {
        turns.push({ speaker: 'Alex', text: trimmed.replace(/^Alex:\s*/i, '') });
      } else if (/^Jordan:\s*/i.test(trimmed)) {
        turns.push({ speaker: 'Jordan', text: trimmed.replace(/^Jordan:\s*/i, '') });
      } else if (turns.length > 0) {
        // Append continuation to previous speaker
        turns[turns.length - 1].text += ' ' + trimmed;
      }
    });

    return turns;
  };

  const turns = studioOutputs.podcast ? getPodcastTurns(studioOutputs.podcast.content) : [];

  // Stop audio on unmount or tab switch
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleGenerate = async (type) => {
    if (loading) return;
    setLoading(true);

    // Stop existing audio if regenerating podcast
    if (type === 'podcast' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
      setIsPausedAudio(false);
      setCurrentSpeakerTurn(-1);
    }

    try {
      const headers = {
        'Content-Type': 'application/json'
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      } else if (guestSessionId) {
        headers['X-Guest-Session'] = guestSessionId;
      }

      const res = await fetch('/api/studio/generate', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          type,
          selectedSourceIds: selectedSourceIds.length > 0 ? selectedSourceIds : undefined
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate studio artifact');

      setStudioOutputs(prev => ({
        ...prev,
        [type]: {
          content: data.content,
          timestamp: data.timestamp,
          sourceCount: data.sourceCount
        }
      }));
    } catch (err) {
      alert(`NotebookLM Studio Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Web Speech API Voice synthesis for Podcast
  const playSpeakerTurn = (index, parsedTurns) => {
    if (!('speechSynthesis' in window)) {
      alert('Web Speech API is not supported in this browser for podcast playback.');
      return;
    }

    if (index >= parsedTurns.length) {
      setIsPlayingAudio(false);
      setIsPausedAudio(false);
      setCurrentSpeakerTurn(-1);
      return;
    }

    setCurrentSpeakerTurn(index);
    const turn = parsedTurns[index];
    const utterance = new SpeechSynthesisUtterance(turn.text);
    speechUtteranceRef.current = utterance;

    // Pick voices based on speaker identity
    const voices = window.speechSynthesis.getVoices();
    const isAlex = turn.speaker === 'Alex';

    utterance.rate = audioSpeed;
    utterance.pitch = isAlex ? 0.95 : 1.15; // Alex deeper, Jordan higher/crisper

    // Try finding nice English voices
    if (voices.length > 0) {
      const engVoices = voices.filter(v => v.lang.startsWith('en'));
      if (engVoices.length > 1) {
        utterance.voice = isAlex ? engVoices[0] : engVoices[1];
      }
    }

    utterance.onend = () => {
      playSpeakerTurn(index + 1, parsedTurns);
    };

    utterance.onerror = () => {
      setIsPlayingAudio(false);
      setCurrentSpeakerTurn(-1);
    };

    window.speechSynthesis.speak(utterance);
  };

  const handleStartAudio = () => {
    if (!turns || turns.length === 0) return;
    if (isPausedAudio) {
      window.speechSynthesis.resume();
      setIsPausedAudio(false);
      setIsPlayingAudio(true);
    } else {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(true);
      setIsPausedAudio(false);
      playSpeakerTurn(0, turns);
    }
  };

  const handlePauseAudio = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.pause();
      setIsPausedAudio(true);
      setIsPlayingAudio(false);
    }
  };

  const handleStopAudio = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
      setIsPausedAudio(false);
      setCurrentSpeakerTurn(-1);
    }
  };

  const handleCopyContent = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveToNotesCurrent = (title, content) => {
    onAddNote({
      id: `note_${Date.now()}`,
      title: title || 'NotebookLM Studio Artifact',
      content,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
    alert('Saved to your Notes Board!');
  };

  const handleCreateManualNote = (e) => {
    e.preventDefault();
    if (!newNoteInput.trim()) return;
    onAddNote({
      id: `note_${Date.now()}`,
      title: newNoteTitle.trim() || 'Quick Note',
      content: newNoteInput.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
    setNewNoteInput('');
    setNewNoteTitle('');
  };

  const handleExportNotes = () => {
    if (notes.length === 0) return;
    const markdown = `# Nexus Intelligence (NI) Research Notes\n\n` + 
      notes.map(n => `### ${n.title} (${n.timestamp})\n\n${n.content}\n\n---`).join('\n\n');
    
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `NI-Notes-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <aside className="studio-panel" style={{
      width: '420px',
      background: 'var(--bg-surface)',
      borderLeft: '1px solid var(--border-subtle)',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      position: 'relative',
      zIndex: 30,
      flexShrink: 0
    }}>
      {/* Studio Header */}
      <div style={{
        padding: '1.1rem 1.25rem',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'var(--bg-surface-elevated)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--accent-gradient)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 2px 8px rgba(99, 102, 241, 0.4)'
          }}>
            <Sparkles size={16} />
          </div>
          <div>
            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Notebook Studio
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
              {activeSourcesText}
            </div>
          </div>
        </div>

        <button 
          onClick={onClose}
          className="composer-btn-icon"
          style={{ width: '28px', height: '28px' }}
          title="Close Studio Panel"
        >
          <X size={16} />
        </button>
      </div>

      {/* Studio Nav Tabs */}
      <div style={{
        display: 'flex',
        overflowX: 'auto',
        padding: '0.5rem 0.75rem',
        gap: '0.35rem',
        borderBottom: '1px solid var(--border-subtle)',
        background: 'var(--bg-app)'
      }}>
        <button
          onClick={() => setActiveTab('podcast')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '0.35rem 0.65rem',
            borderRadius: 'var(--radius-sm)',
            border: activeTab === 'podcast' ? '1px solid var(--accent-primary)' : '1px solid transparent',
            background: activeTab === 'podcast' ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
            color: activeTab === 'podcast' ? 'var(--accent-primary)' : 'var(--text-secondary)',
            fontSize: '0.75rem',
            fontWeight: 700,
            cursor: 'pointer',
            whiteSpace: 'nowrap'
          }}
        >
          <Headphones size={13} /> Audio Overview
        </button>

        <button
          onClick={() => setActiveTab('study-guide')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '0.35rem 0.65rem',
            borderRadius: 'var(--radius-sm)',
            border: activeTab === 'study-guide' ? '1px solid var(--accent-primary)' : '1px solid transparent',
            background: activeTab === 'study-guide' ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
            color: activeTab === 'study-guide' ? 'var(--accent-primary)' : 'var(--text-secondary)',
            fontSize: '0.75rem',
            fontWeight: 700,
            cursor: 'pointer',
            whiteSpace: 'nowrap'
          }}
        >
          <BookOpen size={13} /> Study Guide
        </button>

        <button
          onClick={() => setActiveTab('faq')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '0.35rem 0.65rem',
            borderRadius: 'var(--radius-sm)',
            border: activeTab === 'faq' ? '1px solid var(--accent-primary)' : '1px solid transparent',
            background: activeTab === 'faq' ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
            color: activeTab === 'faq' ? 'var(--accent-primary)' : 'var(--text-secondary)',
            fontSize: '0.75rem',
            fontWeight: 700,
            cursor: 'pointer',
            whiteSpace: 'nowrap'
          }}
        >
          <HelpCircle size={13} /> FAQ
        </button>

        <button
          onClick={() => setActiveTab('timeline')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '0.35rem 0.65rem',
            borderRadius: 'var(--radius-sm)',
            border: activeTab === 'timeline' ? '1px solid var(--accent-primary)' : '1px solid transparent',
            background: activeTab === 'timeline' ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
            color: activeTab === 'timeline' ? 'var(--accent-primary)' : 'var(--text-secondary)',
            fontSize: '0.75rem',
            fontWeight: 700,
            cursor: 'pointer',
            whiteSpace: 'nowrap'
          }}
        >
          <Calendar size={13} /> Timeline
        </button>

        <button
          onClick={() => setActiveTab('briefing')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '0.35rem 0.65rem',
            borderRadius: 'var(--radius-sm)',
            border: activeTab === 'briefing' ? '1px solid var(--accent-primary)' : '1px solid transparent',
            background: activeTab === 'briefing' ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
            color: activeTab === 'briefing' ? 'var(--accent-primary)' : 'var(--text-secondary)',
            fontSize: '0.75rem',
            fontWeight: 700,
            cursor: 'pointer',
            whiteSpace: 'nowrap'
          }}
        >
          <FileText size={13} /> Briefing
        </button>

        <button
          onClick={() => setActiveTab('notes')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '0.35rem 0.65rem',
            borderRadius: 'var(--radius-sm)',
            border: activeTab === 'notes' ? '1px solid var(--accent-primary)' : '1px solid transparent',
            background: activeTab === 'notes' ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
            color: activeTab === 'notes' ? 'var(--accent-primary)' : 'var(--text-secondary)',
            fontSize: '0.75rem',
            fontWeight: 700,
            cursor: 'pointer',
            whiteSpace: 'nowrap'
          }}
        >
          <StickyNote size={13} /> Notes ({notes.length})
        </button>
      </div>

      {/* Main Studio Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1.1rem' }}>
        
        {/* PODCAST / AUDIO OVERVIEW TAB */}
        {activeTab === 'podcast' && (
          <div>
            <div style={{
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(139, 92, 246, 0.08) 100%)',
              border: '1px solid rgba(99, 102, 241, 0.25)',
              borderRadius: 'var(--radius-md)',
              padding: '1rem',
              marginBottom: '1rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Headphones size={20} style={{ color: 'var(--accent-primary)' }} />
                  <span style={{ fontWeight: 800, fontSize: '0.92rem' }}>Audio Deep Dive Podcast</span>
                </div>
                <span style={{ fontSize: '0.7rem', background: 'rgba(99, 102, 241, 0.2)', color: 'var(--accent-cyan)', padding: '0.15rem 0.45rem', borderRadius: 'var(--radius-full)', fontWeight: 700 }}>
                  2 Hosts • Alex & Jordan
                </span>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '0.85rem' }}>
                Generate an engaging, two-host conversation bringing your uploaded knowledge to life with voice playback.
              </p>

              <button
                className="btn-gradient"
                style={{ width: '100%', fontSize: '0.82rem', justifyContent: 'center', padding: '0.55rem' }}
                onClick={() => handleGenerate('podcast')}
                disabled={loading || sources.length === 0}
              >
                {loading ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <RefreshCw size={14} className="spin-animate" /> Synthesizing Audio Deep Dive...
                  </span>
                ) : (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <Sparkles size={14} /> {studioOutputs.podcast ? 'Regenerate Audio Overview' : 'Generate Audio Overview'}
                  </span>
                )}
              </button>
            </div>

            {/* Audio Player Controls */}
            {studioOutputs.podcast && turns.length > 0 && (
              <div style={{
                background: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '0.85rem 1rem',
                marginBottom: '1rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Volume2 size={15} /> 
                    {isPlayingAudio 
                      ? `Playing: ${turns[currentSpeakerTurn]?.speaker || 'Host'} speaking...` 
                      : isPausedAudio 
                        ? 'Audio Paused' 
                        : 'Interactive Voice Playback Ready'}
                  </span>
                  
                  {/* Speed toggle */}
                  <div style={{ display: 'flex', gap: '0.2rem' }}>
                    {[1, 1.25, 1.5].map(s => (
                      <button
                        key={s}
                        onClick={() => setAudioSpeed(s)}
                        style={{
                          fontSize: '0.68rem',
                          padding: '0.1rem 0.35rem',
                          borderRadius: '4px',
                          border: audioSpeed === s ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                          background: audioSpeed === s ? 'var(--accent-primary)' : 'transparent',
                          color: '#fff',
                          cursor: 'pointer'
                        }}
                      >
                        {s}x
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  {!isPlayingAudio ? (
                    <button
                      className="btn-gradient"
                      style={{ flex: 1, fontSize: '0.8rem', justifyContent: 'center', padding: '0.45rem' }}
                      onClick={handleStartAudio}
                    >
                      <Play size={15} /> {isPausedAudio ? 'Resume Dialogue' : 'Play Audio Overview'}
                    </button>
                  ) : (
                    <button
                      className="btn-ghost"
                      style={{ flex: 1, fontSize: '0.8rem', justifyContent: 'center', padding: '0.45rem', borderColor: 'var(--accent-amber)', color: 'var(--accent-amber)' }}
                      onClick={handlePauseAudio}
                    >
                      <Pause size={15} /> Pause
                    </button>
                  )}

                  <button
                    className="btn-ghost"
                    style={{ width: '36px', height: '36px', justifyContent: 'center', padding: 0 }}
                    onClick={handleStopAudio}
                    title="Stop Audio"
                  >
                    <Square size={14} />
                  </button>
                </div>
              </div>
            )}

            {/* Transcript Display */}
            {studioOutputs.podcast && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                    TRANSCRIPT ({turns.length} turns)
                  </span>
                  <div style={{ display: 'flex', gap: '0.35rem' }}>
                    <button
                      className="composer-btn-icon"
                      style={{ width: '26px', height: '26px' }}
                      title="Copy script"
                      onClick={() => handleCopyContent(studioOutputs.podcast.content)}
                    >
                      {copied ? <Check size={13} style={{ color: '#10b981' }} /> : <Copy size={13} />}
                    </button>
                    <button
                      className="composer-btn-icon"
                      style={{ width: '26px', height: '26px' }}
                      title="Save to Notes"
                      onClick={() => handleSaveToNotesCurrent('Audio Overview Script', studioOutputs.podcast.content)}
                    >
                      <StickyNote size={13} />
                    </button>
                  </div>
                </div>

                {turns.map((turn, idx) => {
                  const isActive = currentSpeakerTurn === idx;
                  const isAlex = turn.speaker === 'Alex';
                  return (
                    <div 
                      key={idx}
                      style={{
                        padding: '0.75rem 0.85rem',
                        borderRadius: 'var(--radius-sm)',
                        background: isActive 
                          ? 'rgba(99, 102, 241, 0.2)' 
                          : isAlex 
                            ? 'var(--bg-surface-elevated)' 
                            : 'rgba(255, 255, 255, 0.03)',
                        border: isActive ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.3rem' }}>
                        <span style={{
                          fontSize: '0.68rem',
                          fontWeight: 800,
                          padding: '0.1rem 0.4rem',
                          borderRadius: '4px',
                          background: isAlex ? 'rgba(56, 189, 248, 0.2)' : 'rgba(244, 114, 182, 0.2)',
                          color: isAlex ? '#38bdf8' : '#f472b6'
                        }}>
                          {turn.speaker}
                        </span>
                        {isActive && (
                          <span style={{ fontSize: '0.68rem', color: 'var(--accent-primary)', fontWeight: 700 }}>
                            Speaking now...
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.84rem', lineHeight: 1.55, color: 'var(--text-primary)' }}>
                        {turn.text}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* STUDY GUIDE, FAQ, TIMELINE, BRIEFING TABS */}
        {['study-guide', 'faq', 'timeline', 'briefing'].includes(activeTab) && (
          <div>
            <div style={{
              background: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '1rem',
              marginBottom: '1rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <span style={{ fontWeight: 800, fontSize: '0.92rem', textTransform: 'capitalize' }}>
                  {activeTab.replace('-', ' ')}
                </span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                  Grounded on {sources.length} sources
                </span>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '0.85rem' }}>
                {activeTab === 'study-guide' && 'Synthesize an in-depth study guide complete with core concepts, practice quiz, and glossary.'}
                {activeTab === 'faq' && 'Extract frequently asked questions with grounded answers based strictly on your source documents.'}
                {activeTab === 'timeline' && 'Construct a chronological timeline map detailing dates, phases, and milestones.'}
                {activeTab === 'briefing' && 'Generate a strategic executive briefing memo outlining key findings and actionable next steps.'}
              </p>

              <button
                className="btn-gradient"
                style={{ width: '100%', fontSize: '0.82rem', justifyContent: 'center', padding: '0.55rem' }}
                onClick={() => handleGenerate(activeTab)}
                disabled={loading || sources.length === 0}
              >
                {loading ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <RefreshCw size={14} className="spin-animate" /> Generating {activeTab.replace('-', ' ')}...
                  </span>
                ) : (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <Sparkles size={14} /> {studioOutputs[activeTab] ? `Regenerate ${activeTab.replace('-', ' ')}` : `Generate ${activeTab.replace('-', ' ')}`}
                  </span>
                )}
              </button>
            </div>

            {studioOutputs[activeTab] && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Generated at {studioOutputs[activeTab].timestamp}
                  </span>
                  <div style={{ display: 'flex', gap: '0.35rem' }}>
                    <button
                      className="composer-btn-icon"
                      style={{ width: '26px', height: '26px' }}
                      title="Copy to clipboard"
                      onClick={() => handleCopyContent(studioOutputs[activeTab].content)}
                    >
                      {copied ? <Check size={13} style={{ color: '#10b981' }} /> : <Copy size={13} />}
                    </button>
                    <button
                      className="composer-btn-icon"
                      style={{ width: '26px', height: '26px' }}
                      title="Save to Notes"
                      onClick={() => handleSaveToNotesCurrent(activeTab.toUpperCase(), studioOutputs[activeTab].content)}
                    >
                      <StickyNote size={13} />
                    </button>
                  </div>
                </div>

                <div style={{
                  background: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.25rem'
                }}>
                  <StudioMarkdownViewer text={studioOutputs[activeTab].content} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* NOTES & SCRATCHPAD TAB */}
        {activeTab === 'notes' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 800 }}>Research Notes ({notes.length})</span>
              {notes.length > 0 && (
                <button
                  onClick={handleExportNotes}
                  className="btn-ghost"
                  style={{ fontSize: '0.72rem', padding: '0.25rem 0.55rem', gap: '0.3rem' }}
                  title="Export notes as Markdown"
                >
                  <Download size={12} /> Export .md
                </button>
              )}
            </div>

            {/* Quick Note Creator */}
            <form onSubmit={handleCreateManualNote} style={{
              background: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '0.85rem',
              marginBottom: '1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem'
            }}>
              <input
                type="text"
                placeholder="Note Title (optional)..."
                value={newNoteTitle}
                onChange={e => setNewNoteTitle(e.target.value)}
                style={{
                  background: 'var(--bg-app)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.45rem 0.65rem',
                  fontSize: '0.82rem',
                  color: 'var(--text-primary)'
                }}
              />
              <textarea
                placeholder="Type your thought, hypothesis, or insight..."
                rows={3}
                value={newNoteInput}
                onChange={e => setNewNoteInput(e.target.value)}
                style={{
                  background: 'var(--bg-app)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.55rem 0.65rem',
                  fontSize: '0.82rem',
                  color: 'var(--text-primary)',
                  resize: 'vertical'
                }}
              />
              <button
                type="submit"
                className="btn-gradient"
                style={{ fontSize: '0.78rem', justifyContent: 'center', padding: '0.45rem' }}
                disabled={!newNoteInput.trim()}
              >
                <Plus size={14} /> Add Note
              </button>
            </form>

            {/* Notes List */}
            {notes.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)' }}>
                <StickyNote size={32} style={{ margin: '0 auto 0.5rem auto', opacity: 0.4 }} />
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>No Notes Yet</div>
                <p style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
                  Save answers from the chat or create custom notes to organize your insights.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {notes.map(note => (
                  <div
                    key={note.id}
                    style={{
                      background: 'var(--bg-surface-elevated)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      padding: '0.85rem'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.35rem' }}>
                      <span style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {note.title}
                      </span>
                      <button
                        onClick={() => onDeleteNote(note.id)}
                        className="composer-btn-icon"
                        style={{ width: '22px', height: '22px', color: '#ef4444' }}
                        title="Delete note"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                      {note.content}
                    </div>
                    <div style={{ marginTop: '0.45rem', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                      {note.timestamp}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </aside>
  );
}