import React, { useState, useEffect, useRef } from 'react';
import { 
  Headphones, 
  Radio,
  FileText, 
  HelpCircle, 
  Presentation, 
  Network, 
  Layers, 
  BarChart3, 
  Sparkles, 
  RefreshCw, 
  Play, 
  Pause, 
  Square, 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  RotateCcw, 
  Shuffle, 
  CheckCircle2, 
  XCircle, 
  Info, 
  Award, 
  Download, 
  StickyNote, 
  X, 
  Plus, 
  Trash2, 
  Volume2, 
  Eye, 
  Lightbulb, 
  Copy,
  MessageSquare,
  ArrowRight,
  Maximize2
} from 'lucide-react';

export function escapeHtml(unsafe) {
  if (!unsafe) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function StudioMarkdownViewer({ text }) {
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

// 7 Official Active Studio Tools (Video Overview removed per user request)
export const STUDIO_TOOLS = [
  {
    id: 'audio-overview',
    label: 'Audio Overview',
    icon: Radio,
    color: '#3b82f6',
    description: 'Dynamic 2-host audio deep dive podcast with voice playback.'
  },
  {
    id: 'slide-deck',
    label: 'Slide deck',
    icon: Presentation,
    color: '#d946ef',
    description: 'Executive presentation deck with bullet points, visual ideas & speaker notes.'
  },
  {
    id: 'mind-map',
    label: 'Mind Map',
    icon: Network,
    color: '#8b5cf6',
    description: 'Hierarchical concept graph with interactive nodes and Mermaid diagram.'
  },
  {
    id: 'reports',
    label: 'Reports',
    icon: FileText,
    color: '#ec4899',
    badge: 'New!',
    description: 'Comprehensive research briefing document with verified citations.'
  },
  {
    id: 'flashcards',
    label: 'Flashcards',
    icon: Layers,
    color: '#f97316',
    description: 'Interactive 3D flippable study cards for rapid knowledge retention.'
  },
  {
    id: 'quiz',
    label: 'Quiz',
    icon: HelpCircle,
    color: '#06b6d4',
    description: 'Interactive comprehension assessment with instant feedback and score tracking.'
  },
  {
    id: 'infographic',
    label: 'Infographic',
    icon: BarChart3,
    color: '#f59e0b',
    description: 'Visual data dashboard with high-impact stat counters and core pillars.'
  }
];

// ---------------------------------------------------------------------------
// 1. RIGHT SLIDING PANEL: STUDIO OPTIONS DRAWER
// ---------------------------------------------------------------------------
export function StudioOptionsDrawer({
  width = 320,
  isOpen = true,
  onClose,
  activeTool = 'slide-deck',
  onSelectTool,
  onGenerate,
  loading = false,
  sources = [],
  selectedSourceIds = [],
  studioOutputs = {},
  notes = [],
  onAddNote,
  onDeleteNote,
  onOpenResultInCenter
}) {
  const [activeTab, setActiveTab] = useState(activeTool);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteInput, setNewNoteInput] = useState('');

  useEffect(() => {
    if (activeTool) setActiveTab(activeTool);
  }, [activeTool]);

  const selectedCount = selectedSourceIds.length;
  const activeSourcesText = selectedCount > 0 
    ? `${selectedCount} of ${sources.length} sources selected`
    : `All ${sources.length} sources active`;

  const currentToolMeta = STUDIO_TOOLS.find(t => t.id === activeTab) || STUDIO_TOOLS[1];
  const hasResult = !!studioOutputs[activeTab];

  const handleToolClick = (toolId) => {
    setActiveTab(toolId);
    if (onSelectTool) onSelectTool(toolId);
  };

  const handleCreateNote = (e) => {
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

  if (!isOpen) return null;

  return (
    <aside style={{
      width: `${width}px`,
      background: 'var(--bg-surface)',
      borderLeft: '1px solid var(--border-subtle)',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      position: 'relative',
      zIndex: 20,
      flexShrink: 0
    }}>
      {/* Header */}
      <div style={{
        padding: '0.85rem 1.1rem',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'var(--bg-surface-elevated)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--accent-gradient)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff'
          }}>
            <Sparkles size={14} />
          </div>
          <div>
            <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Studio Tools
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>
              {activeSourcesText}
            </div>
          </div>
        </div>

        <button 
          onClick={onClose}
          className="composer-btn-icon"
          style={{ width: '26px', height: '26px' }}
          title="Close Studio Options Drawer"
        >
          <X size={15} />
        </button>
      </div>

      {/* Main Options Scrollable Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0.85rem' }}>
        
        {/* Empty Sources Notice */}
        {sources.length === 0 && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            borderRadius: 'var(--radius-sm)',
            padding: '0.65rem 0.75rem',
            marginBottom: '0.75rem',
            fontSize: '0.74rem',
            color: 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem'
          }}>
            <Info size={14} style={{ color: '#ef4444', flexShrink: 0 }} />
            <span>Add at least 1 source on the left to activate studio tools.</span>
          </div>
        )}

        {/* 7 Tools Buttons List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', marginBottom: '1rem' }}>
          {STUDIO_TOOLS.map(tool => {
            const Icon = tool.icon;
            const isSelected = activeTab === tool.id;
            const isGenerated = !!studioOutputs[tool.id];

            return (
              <button
                key={tool.id}
                onClick={() => handleToolClick(tool.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.55rem',
                  padding: '0.55rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  border: isSelected ? `1.5px solid ${tool.color}` : '1px solid var(--border-subtle)',
                  background: isSelected ? `${tool.color}18` : 'var(--bg-surface-elevated)',
                  color: 'var(--text-primary)',
                  fontWeight: isSelected ? 700 : 500,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                  position: 'relative'
                }}
              >
                <div style={{ color: tool.color, display: 'flex', alignItems: 'center' }}>
                  <Icon size={16} />
                </div>
                <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {tool.label}
                </span>

                {isGenerated && (
                  <span style={{ fontSize: '0.62rem', background: '#10b981', color: '#fff', padding: '0.05rem 0.35rem', borderRadius: '4px', fontWeight: 800 }}>
                    Ready
                  </span>
                )}

                {tool.badge && !isGenerated && (
                  <span style={{ fontSize: '0.62rem', background: 'rgba(236, 72, 153, 0.2)', color: '#ec4899', padding: '0.05rem 0.35rem', borderRadius: '4px', fontWeight: 800 }}>
                    {tool.badge}
                  </span>
                )}
              </button>
            );
          })}

          {/* Notes Option Button */}
          <button
            onClick={() => handleToolClick('notes')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.55rem',
              padding: '0.55rem 0.75rem',
              borderRadius: 'var(--radius-sm)',
              border: activeTab === 'notes' ? '1.5px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
              background: activeTab === 'notes' ? 'rgba(99, 102, 241, 0.15)' : 'var(--bg-surface-elevated)',
              color: 'var(--text-primary)',
              fontWeight: activeTab === 'notes' ? 700 : 500,
              fontSize: '0.8rem',
              cursor: 'pointer',
              textAlign: 'left'
            }}
          >
            <StickyNote size={15} style={{ color: 'var(--accent-primary)' }} />
            <span style={{ flex: 1 }}>Notes & Scratchpad</span>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>({notes.length})</span>
          </button>
        </div>

        {/* Selected Tool Details & Trigger Card */}
        {activeTab !== 'notes' ? (
          <div style={{
            background: 'var(--bg-app)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '0.85rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.35rem' }}>
              <currentToolMeta.icon size={16} style={{ color: currentToolMeta.color }} />
              <span style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {currentToolMeta.label}
              </span>
            </div>

            <p style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.45, marginBottom: '0.75rem' }}>
              {currentToolMeta.description}
            </p>

            <button
              className="btn-gradient"
              style={{ width: '100%', fontSize: '0.78rem', justifyContent: 'center', padding: '0.45rem', marginBottom: '0.55rem' }}
              disabled={loading || sources.length === 0}
              onClick={() => onGenerate(activeTab)}
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <RefreshCw size={13} className="spin-animate" /> Generating with Groq (~1s)...
                </span>
              ) : (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Sparkles size={13} /> {hasResult ? `Regenerate ${currentToolMeta.label}` : `Generate ${currentToolMeta.label}`}
                </span>
              )}
            </button>

            {hasResult && (
              <button
                onClick={onOpenResultInCenter}
                className="btn-ghost"
                style={{ width: '100%', fontSize: '0.75rem', justifyContent: 'center', padding: '0.35rem', gap: '0.35rem', color: '#10b981', borderColor: '#10b981' }}
              >
                <span>View Result in Center Stage</span>
                <ArrowRight size={13} />
              </button>
            )}
          </div>
        ) : (
          /* Notes Creator in Right Panel */
          <div>
            <form onSubmit={handleCreateNote} style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', marginBottom: '0.75rem' }}>
              <input
                type="text"
                placeholder="Note Title..."
                value={newNoteTitle}
                onChange={e => setNewNoteTitle(e.target.value)}
                style={{
                  background: 'var(--bg-app)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.35rem 0.55rem',
                  fontSize: '0.76rem',
                  color: 'var(--text-primary)'
                }}
              />
              <textarea
                placeholder="Write a thought or finding..."
                rows={2}
                value={newNoteInput}
                onChange={e => setNewNoteInput(e.target.value)}
                style={{
                  background: 'var(--bg-app)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.35rem 0.55rem',
                  fontSize: '0.76rem',
                  color: 'var(--text-primary)',
                  resize: 'vertical'
                }}
              />
              <button
                type="submit"
                className="btn-gradient"
                style={{ fontSize: '0.74rem', padding: '0.35rem', justifyContent: 'center' }}
                disabled={!newNoteInput.trim()}
              >
                <Plus size={13} /> Add Note
              </button>
            </form>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
              {notes.map(n => (
                <div key={n.id} style={{ background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: '0.55rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                    <span style={{ fontSize: '0.76rem', fontWeight: 700 }}>{n.title}</span>
                    <button onClick={() => onDeleteNote(n.id)} className="composer-btn-icon" style={{ width: '20px', height: '20px', color: '#ef4444' }}>
                      <Trash2 size={11} />
                    </button>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>
                    {n.content}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </aside>
  );
}

// ---------------------------------------------------------------------------
// 2. CENTER STAGE: STUDIO RESULT CANVAS (OPENS IN CENTER ABOVE SEARCH BAR)
// ---------------------------------------------------------------------------
export function StudioResultCanvas({
  toolId = 'slide-deck',
  output = null,
  sources = [],
  onBackToChat,
  onSaveNote,
  onRegenerate,
  loading = false
}) {
  const [copied, setCopied] = useState(false);

  // Slide Deck State
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [showSpeakerNotes, setShowSpeakerNotes] = useState(false);

  // Flashcards State
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isCardFlipped, setIsCardFlipped] = useState(false);
  const [flashcardDeck, setFlashcardDeck] = useState([]);
  const [flashcardViewMode, setFlashcardViewMode] = useState('single');

  // Quiz State
  const [currentQuizQuestionIndex, setCurrentQuizQuestionIndex] = useState(0);
  const [userQuizAnswers, setUserQuizAnswers] = useState({});
  const [quizScore, setQuizScore] = useState(0);

  // Mind Map State
  const [mindMapViewMode, setMindMapViewMode] = useState('visual');

  // Audio Playback State for Audio Overview
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isPausedAudio, setIsPausedAudio] = useState(false);
  const [currentSpeakerTurn, setCurrentSpeakerTurn] = useState(-1);
  const [audioSpeed, setAudioSpeed] = useState(1);
  const speechUtteranceRef = useRef(null);

  // Sync state when output changes
  useEffect(() => {
    if (toolId === 'flashcards' && output?.parsedData?.cards) {
      setFlashcardDeck(output.parsedData.cards);
      setCurrentCardIndex(0);
      setIsCardFlipped(false);
    } else if (toolId === 'quiz' && output?.parsedData?.questions) {
      setCurrentQuizQuestionIndex(0);
      setUserQuizAnswers({});
      setQuizScore(0);
    } else if (toolId === 'slide-deck' && output?.parsedData?.slides) {
      setCurrentSlideIndex(0);
      setShowSpeakerNotes(false);
    }
  }, [toolId, output]);

  // Audio turns
  const getAudioTurns = (content) => {
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
        turns[turns.length - 1].text += ' ' + trimmed;
      }
    });

    return turns;
  };

  const audioTurns = toolId === 'audio-overview' && output ? getAudioTurns(output.content) : [];

  const handleCopy = (text) => {
    navigator.clipboard.writeText(typeof text === 'string' ? text : JSON.stringify(text, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Web Speech for Audio Overview
  const playSpeakerTurn = (index, parsedTurns) => {
    if (!('speechSynthesis' in window)) return;
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

    const voices = window.speechSynthesis.getVoices();
    const isAlex = turn.speaker === 'Alex';
    utterance.rate = audioSpeed;
    utterance.pitch = isAlex ? 0.95 : 1.15;

    if (voices.length > 0) {
      const engVoices = voices.filter(v => v.lang.startsWith('en'));
      if (engVoices.length > 1) {
        utterance.voice = isAlex ? engVoices[0] : engVoices[1];
      }
    }

    utterance.onend = () => playSpeakerTurn(index + 1, parsedTurns);
    utterance.onerror = () => {
      setIsPlayingAudio(false);
      setCurrentSpeakerTurn(-1);
    };

    window.speechSynthesis.speak(utterance);
  };

  const handleStartAudio = () => {
    if (!audioTurns || audioTurns.length === 0) return;
    if (isPausedAudio) {
      window.speechSynthesis.resume();
      setIsPausedAudio(false);
      setIsPlayingAudio(true);
    } else {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(true);
      setIsPausedAudio(false);
      playSpeakerTurn(0, audioTurns);
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

  // Flashcards Shuffle
  const handleShuffleDeck = () => {
    if (!flashcardDeck.length) return;
    setFlashcardDeck([...flashcardDeck].sort(() => Math.random() - 0.5));
    setCurrentCardIndex(0);
    setIsCardFlipped(false);
  };

  // Quiz Option Click
  const handleSelectQuizOption = (qIdx, optIdx, correctIdx) => {
    if (userQuizAnswers[qIdx] !== undefined) return;
    setUserQuizAnswers(prev => ({ ...prev, [qIdx]: optIdx }));
    if (optIdx === correctIdx) setQuizScore(prev => prev + 1);
  };

  const currentToolMeta = STUDIO_TOOLS.find(t => t.id === toolId) || STUDIO_TOOLS[1];

  if (!output) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', textAlign: 'center' }}>
        <div>
          <Sparkles size={36} style={{ color: 'var(--accent-primary)', opacity: 0.5, marginBottom: '0.75rem' }} />
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            No result generated yet for {currentToolMeta.label}
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.35rem', marginBottom: '1rem' }}>
            Click Generate in the right Studio panel or click below to synthesize this artifact.
          </p>
          <button
            onClick={onRegenerate}
            className="btn-gradient"
            disabled={loading}
            style={{ fontSize: '0.82rem', padding: '0.5rem 1rem' }}
          >
            {loading ? 'Generating with Groq (~1s)...' : `Generate ${currentToolMeta.label}`}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      overflow: 'hidden',
      background: 'transparent'
    }}>
      {/* Top Banner on Center Result */}
      <div style={{
        padding: '0.65rem 1.25rem',
        borderBottom: '1px solid var(--border-subtle)',
        background: 'var(--bg-surface-elevated)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
          <currentToolMeta.icon size={16} style={{ color: currentToolMeta.color }} />
          <span style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            {currentToolMeta.label} Result
          </span>
          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
            Generated at {output.timestamp || 'Just now'} • {output.sourceCount || sources.length} sources
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          <button
            className="composer-btn-icon"
            style={{ width: '28px', height: '28px' }}
            title="Copy Result"
            onClick={() => handleCopy(output.content)}
          >
            {copied ? <Check size={14} style={{ color: '#10b981' }} /> : <Copy size={14} />}
          </button>
          <button
            className="composer-btn-icon"
            style={{ width: '28px', height: '28px' }}
            title="Save to Notes"
            onClick={() => onSaveNote({
              id: `note_${Date.now()}`,
              title: `${currentToolMeta.label} Artifact`,
              content: typeof output.content === 'string' ? output.content : JSON.stringify(output.content, null, 2),
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            })}
          >
            <StickyNote size={14} />
          </button>
          <button
            onClick={onBackToChat}
            className="btn-ghost"
            style={{ fontSize: '0.74rem', padding: '0.25rem 0.6rem', gap: '0.35rem' }}
            title="Switch back to Chat View"
          >
            <MessageSquare size={13} /> View Chat
          </button>
        </div>
      </div>

      {/* Main Center Canvas Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem 1.5rem' }}>
        <div style={{ maxWidth: '920px', margin: '0 auto', width: '100%' }}>

          {/* ============================================================== */}
          {/* SLIDE DECK                                                     */}
          {/* ============================================================== */}
          {toolId === 'slide-deck' && (
            output?.parsedData?.slides?.length > 0 ? (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                  <div>
                    <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#d946ef' }}>
                      Slide {currentSlideIndex + 1} of {output.parsedData.slides.length}
                    </span>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                      {output.parsedData.deckTitle || 'Presentation Deck'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.35rem' }}>
                    <button
                      className="composer-btn-icon"
                      style={{ width: '32px', height: '32px' }}
                      disabled={currentSlideIndex === 0}
                      onClick={() => setCurrentSlideIndex(prev => Math.max(0, prev - 1))}
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button
                      className="composer-btn-icon"
                      style={{ width: '32px', height: '32px' }}
                      disabled={currentSlideIndex === output.parsedData.slides.length - 1}
                      onClick={() => setCurrentSlideIndex(prev => Math.min(output.parsedData.slides.length - 1, prev + 1))}
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>

                {(() => {
                  const slide = output.parsedData.slides[currentSlideIndex];
                  return (
                    <div style={{
                      background: 'var(--bg-surface-elevated)',
                      border: '1.5px solid rgba(217, 70, 239, 0.3)',
                      borderRadius: 'var(--radius-lg)',
                      padding: '1.5rem',
                      boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
                      marginBottom: '1rem'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#d946ef', background: 'rgba(217, 70, 239, 0.15)', padding: '0.15rem 0.55rem', borderRadius: '9999px' }}>
                          SLIDE {slide.slideNumber || currentSlideIndex + 1}
                        </span>
                        {slide.visualConcept && (
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <Eye size={13} style={{ color: 'var(--accent-cyan)' }} /> Visual Concept Included
                          </span>
                        )}
                      </div>

                      <h3 style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--text-primary)', marginBottom: '1.15rem' }}>
                        {slide.title}
                      </h3>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
                        {slide.bullets?.map((b, bIdx) => (
                          <div key={bIdx} style={{ display: 'flex', gap: '0.65rem', alignItems: 'flex-start', fontSize: '0.92rem', lineHeight: 1.6 }}>
                            <span style={{ color: '#d946ef', fontWeight: 800 }}>✦</span>
                            <span style={{ color: 'var(--text-primary)' }}>{b}</span>
                          </div>
                        ))}
                      </div>

                      {slide.visualConcept && (
                        <div style={{
                          background: 'rgba(56, 189, 248, 0.08)',
                          border: '1px solid rgba(56, 189, 248, 0.25)',
                          borderRadius: 'var(--radius-sm)',
                          padding: '0.65rem 0.85rem',
                          fontSize: '0.8rem',
                          color: 'var(--accent-cyan)',
                          marginBottom: '0.85rem',
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '0.45rem'
                        }}>
                          <Eye size={15} style={{ flexShrink: 0, marginTop: '0.1rem' }} />
                          <div><strong>Visual Idea: </strong>{slide.visualConcept}</div>
                        </div>
                      )}

                      {slide.speakerNotes && (
                        <div>
                          <button
                            onClick={() => setShowSpeakerNotes(!showSpeakerNotes)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--text-muted)',
                              fontSize: '0.76rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              padding: 0
                            }}
                          >
                            <Lightbulb size={13} style={{ color: '#f59e0b' }} />
                            {showSpeakerNotes ? 'Hide Speaker Notes' : 'Show Speaker Notes'}
                          </button>
                          {showSpeakerNotes && (
                            <div style={{
                              marginTop: '0.45rem',
                              padding: '0.75rem',
                              background: 'rgba(255,255,255,0.04)',
                              borderRadius: 'var(--radius-sm)',
                              fontSize: '0.82rem',
                              fontStyle: 'italic',
                              color: 'var(--text-secondary)',
                              lineHeight: 1.55
                            }}>
                              "{slide.speakerNotes}"
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Thumbnail dots */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.4rem' }}>
                  {output.parsedData.slides.map((_, sIdx) => (
                    <button
                      key={sIdx}
                      onClick={() => setCurrentSlideIndex(sIdx)}
                      style={{
                        width: '32px',
                        height: '28px',
                        borderRadius: '4px',
                        border: currentSlideIndex === sIdx ? '1.5px solid #d946ef' : '1px solid var(--border-subtle)',
                        background: currentSlideIndex === sIdx ? '#d946ef' : 'var(--bg-surface)',
                        color: currentSlideIndex === sIdx ? '#fff' : 'var(--text-secondary)',
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      {sIdx + 1}
                    </button>
                  ))}
                </div>
              </div>
            ) : <StudioMarkdownViewer text={output.content} />
          )}

          {/* ============================================================== */}
          {/* FLASHCARDS                                                     */}
          {/* ============================================================== */}
          {toolId === 'flashcards' && (
            flashcardDeck.length > 0 ? (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                  <div>
                    <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#f97316' }}>
                      Card {currentCardIndex + 1} of {flashcardDeck.length}
                    </span>
                    <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
                      ({flashcardDeck[currentCardIndex]?.category || 'Core Concept'})
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.35rem' }}>
                    <button onClick={handleShuffleDeck} className="composer-btn-icon" style={{ width: '28px', height: '28px' }} title="Shuffle Deck">
                      <Shuffle size={14} />
                    </button>
                    <button onClick={() => setFlashcardViewMode(prev => prev === 'single' ? 'grid' : 'single')} className="composer-btn-icon" style={{ width: '28px', height: '28px' }} title="Grid Mode">
                      <Layers size={14} />
                    </button>
                  </div>
                </div>

                {flashcardViewMode === 'single' ? (
                  <div>
                    {/* 3D Flippable Card */}
                    <div 
                      onClick={() => setIsCardFlipped(!isCardFlipped)}
                      style={{ perspective: '1000px', cursor: 'pointer', marginBottom: '1.25rem', userSelect: 'none' }}
                    >
                      <div style={{
                        minHeight: '220px',
                        borderRadius: 'var(--radius-lg)',
                        background: isCardFlipped 
                          ? 'linear-gradient(135deg, rgba(249, 115, 22, 0.15) 0%, rgba(245, 158, 11, 0.1) 100%)' 
                          : 'var(--bg-surface-elevated)',
                        border: isCardFlipped ? '2px solid #f97316' : '1px solid var(--border-subtle)',
                        padding: '1.75rem',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
                        transition: 'transform 0.4s ease'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{
                            fontSize: '0.7rem',
                            fontWeight: 800,
                            padding: '0.15rem 0.55rem',
                            borderRadius: '9999px',
                            background: isCardFlipped ? '#f97316' : 'rgba(249, 115, 22, 0.15)',
                            color: isCardFlipped ? '#fff' : '#f97316'
                          }}>
                            {isCardFlipped ? 'ANSWER' : 'QUESTION'}
                          </span>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Click anywhere to flip 🔄</span>
                        </div>

                        <div style={{ margin: '1.5rem 0', textAlign: 'center' }}>
                          <div style={{
                            fontSize: isCardFlipped ? '1rem' : '1.15rem',
                            fontWeight: isCardFlipped ? 500 : 700,
                            lineHeight: 1.6,
                            color: 'var(--text-primary)'
                          }}>
                            {isCardFlipped ? flashcardDeck[currentCardIndex]?.back : flashcardDeck[currentCardIndex]?.front}
                          </div>
                        </div>

                        <div style={{ textAlign: 'center', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                          {isCardFlipped ? 'Click card to flip back' : 'Click card to reveal answer'}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <button
                        className="btn-ghost"
                        style={{ fontSize: '0.82rem', padding: '0.5rem 1rem' }}
                        disabled={currentCardIndex === 0}
                        onClick={() => {
                          setCurrentCardIndex(prev => Math.max(0, prev - 1));
                          setIsCardFlipped(false);
                        }}
                      >
                        <ChevronLeft size={16} /> Prev
                      </button>

                      <button
                        className="btn-gradient"
                        style={{ fontSize: '0.82rem', padding: '0.5rem 1.25rem', background: '#f97316' }}
                        onClick={() => setIsCardFlipped(!isCardFlipped)}
                      >
                        <RotateCcw size={14} /> Flip Card
                      </button>

                      <button
                        className="btn-ghost"
                        style={{ fontSize: '0.82rem', padding: '0.5rem 1rem' }}
                        disabled={currentCardIndex === flashcardDeck.length - 1}
                        onClick={() => {
                          setCurrentCardIndex(prev => Math.min(flashcardDeck.length - 1, prev + 1));
                          setIsCardFlipped(false);
                        }}
                      >
                        Next <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '0.75rem' }}>
                    {flashcardDeck.map((card, cIdx) => (
                      <div key={cIdx} style={{ background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: '0.85rem' }}>
                        <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#f97316' }}>#{cIdx + 1} • {card.category}</span>
                        <div style={{ fontSize: '0.84rem', fontWeight: 700, margin: '0.4rem 0' }}>Q: {card.front}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', borderTop: '1px dashed var(--border-subtle)', paddingTop: '0.4rem' }}>A: {card.back}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : <StudioMarkdownViewer text={output.content} />
          )}

          {/* ============================================================== */}
          {/* QUIZ                                                           */}
          {/* ============================================================== */}
          {toolId === 'quiz' && (
            output?.parsedData?.questions?.length > 0 ? (
              <div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1rem',
                  padding: '0.65rem 1rem',
                  background: 'var(--bg-surface-elevated)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)'
                }}>
                  <div style={{ fontSize: '0.84rem', fontWeight: 800, color: '#06b6d4' }}>
                    Question {currentQuizQuestionIndex + 1} of {output.parsedData.questions.length}
                  </div>
                  <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Score: <strong style={{ color: '#10b981' }}>{quizScore}</strong> / {Object.keys(userQuizAnswers).length}
                  </div>
                </div>

                {(() => {
                  const q = output.parsedData.questions[currentQuizQuestionIndex];
                  const userAnswer = userQuizAnswers[currentQuizQuestionIndex];
                  const hasAnswered = userAnswer !== undefined;
                  const isCorrect = userAnswer === q.correctIndex;

                  return (
                    <div style={{ background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '1.25rem', marginBottom: '1rem' }}>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1.15rem', lineHeight: 1.5 }}>
                        {q.question}
                      </h3>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                        {q.options?.map((opt, optIdx) => {
                          const isSelected = userAnswer === optIdx;
                          const isThisCorrect = optIdx === q.correctIndex;

                          let btnBg = 'var(--bg-app)';
                          let btnBorder = 'var(--border-subtle)';
                          let btnColor = 'var(--text-primary)';

                          if (hasAnswered) {
                            if (isThisCorrect) {
                              btnBg = 'rgba(16, 185, 129, 0.2)';
                              btnBorder = '#10b981';
                              btnColor = '#10b981';
                            } else if (isSelected && !isThisCorrect) {
                              btnBg = 'rgba(239, 68, 68, 0.2)';
                              btnBorder = '#ef4444';
                              btnColor = '#ef4444';
                            }
                          }

                          return (
                            <button
                              key={optIdx}
                              disabled={hasAnswered}
                              onClick={() => handleSelectQuizOption(currentQuizQuestionIndex, optIdx, q.correctIndex)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                padding: '0.75rem 1rem',
                                borderRadius: 'var(--radius-sm)',
                                border: `1.5px solid ${btnBorder}`,
                                background: btnBg,
                                color: btnColor,
                                fontSize: '0.88rem',
                                textAlign: 'left',
                                cursor: hasAnswered ? 'default' : 'pointer'
                              }}
                            >
                              <span style={{
                                width: '24px',
                                height: '24px',
                                borderRadius: '50%',
                                background: hasAnswered && isThisCorrect ? '#10b981' : hasAnswered && isSelected ? '#ef4444' : 'rgba(255,255,255,0.08)',
                                color: '#fff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.74rem',
                                fontWeight: 800,
                                flexShrink: 0
                              }}>
                                {String.fromCharCode(65 + optIdx)}
                              </span>
                              <span style={{ flex: 1 }}>{opt}</span>
                              {hasAnswered && isThisCorrect && <CheckCircle2 size={18} style={{ color: '#10b981' }} />}
                              {hasAnswered && isSelected && !isThisCorrect && <XCircle size={18} style={{ color: '#ef4444' }} />}
                            </button>
                          );
                        })}
                      </div>

                      {hasAnswered && (
                        <div style={{
                          marginTop: '1rem',
                          padding: '0.85rem',
                          borderRadius: 'var(--radius-sm)',
                          background: isCorrect ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                          border: `1px solid ${isCorrect ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
                        }}>
                          <div style={{ fontSize: '0.82rem', fontWeight: 800, color: isCorrect ? '#10b981' : '#ef4444', marginBottom: '0.3rem' }}>
                            {isCorrect ? '✓ Correct! Great insight.' : '✗ Incorrect. Review the rationale below:'}
                          </div>
                          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                            {q.explanation}
                          </p>
                        </div>
                      )}

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.25rem' }}>
                        <button
                          className="btn-ghost"
                          style={{ fontSize: '0.82rem', padding: '0.45rem 0.85rem' }}
                          disabled={currentQuizQuestionIndex === 0}
                          onClick={() => setCurrentQuizQuestionIndex(prev => Math.max(0, prev - 1))}
                        >
                          <ChevronLeft size={16} /> Prev Question
                        </button>

                        <button
                          className="btn-gradient"
                          style={{ fontSize: '0.82rem', padding: '0.45rem 1rem' }}
                          disabled={currentQuizQuestionIndex === output.parsedData.questions.length - 1}
                          onClick={() => setCurrentQuizQuestionIndex(prev => Math.min(output.parsedData.questions.length - 1, prev + 1))}
                        >
                          Next Question <ChevronRight size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>
            ) : <StudioMarkdownViewer text={output.content} />
          )}

          {/* ============================================================== */}
          {/* MIND MAP                                                       */}
          {/* ============================================================== */}
          {toolId === 'mind-map' && (
            output?.parsedData?.branches ? (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                  <div style={{ display: 'flex', gap: '0.35rem' }}>
                    <button
                      onClick={() => setMindMapViewMode('visual')}
                      style={{
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        padding: '0.25rem 0.65rem',
                        borderRadius: '4px',
                        border: mindMapViewMode === 'visual' ? '1px solid #8b5cf6' : '1px solid var(--border-subtle)',
                        background: mindMapViewMode === 'visual' ? 'rgba(139, 92, 246, 0.2)' : 'transparent',
                        color: mindMapViewMode === 'visual' ? '#8b5cf6' : 'var(--text-secondary)',
                        cursor: 'pointer'
                      }}
                    >
                      Visual Map
                    </button>
                    {output.parsedData.mermaid && (
                      <button
                        onClick={() => setMindMapViewMode('mermaid')}
                        style={{
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          padding: '0.25rem 0.65rem',
                          borderRadius: '4px',
                          border: mindMapViewMode === 'mermaid' ? '1px solid #8b5cf6' : '1px solid var(--border-subtle)',
                          background: mindMapViewMode === 'mermaid' ? 'rgba(139, 92, 246, 0.2)' : 'transparent',
                          color: mindMapViewMode === 'mermaid' ? '#8b5cf6' : 'var(--text-secondary)',
                          cursor: 'pointer'
                        }}
                      >
                        Mermaid Code
                      </button>
                    )}
                  </div>
                </div>

                {mindMapViewMode === 'visual' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                    <div style={{
                      background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.25) 0%, rgba(99, 102, 241, 0.2) 100%)',
                      border: '2px solid #8b5cf6',
                      borderRadius: 'var(--radius-md)',
                      padding: '1rem',
                      textAlign: 'center'
                    }}>
                      <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#a78bfa', textTransform: 'uppercase' }}>
                        CENTRAL TOPIC
                      </span>
                      <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--text-primary)', margin: '0.25rem 0' }}>
                        {output.parsedData.centralTopic || 'Core Subject'}
                      </h3>
                      {output.parsedData.summary && (
                        <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0 }}>
                          {output.parsedData.summary}
                        </p>
                      )}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.75rem' }}>
                      {output.parsedData.branches.map((branch, bIdx) => (
                        <div
                          key={bIdx}
                          style={{
                            background: 'var(--bg-surface-elevated)',
                            border: '1px solid var(--border-subtle)',
                            borderLeft: '3px solid #8b5cf6',
                            borderRadius: 'var(--radius-sm)',
                            padding: '0.85rem'
                          }}
                        >
                          <h4 style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                            {branch.title}
                          </h4>
                          {branch.summary && (
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.45, marginBottom: '0.55rem' }}>
                              {branch.summary}
                            </p>
                          )}
                          {branch.subTopics && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                              {branch.subTopics.map((sub, sIdx) => (
                                <span
                                  key={sIdx}
                                  style={{
                                    fontSize: '0.74rem',
                                    padding: '0.2rem 0.55rem',
                                    borderRadius: '9999px',
                                    background: 'rgba(139, 92, 246, 0.1)',
                                    color: '#c4b5fd',
                                    border: '1px solid rgba(139, 92, 246, 0.25)'
                                  }}
                                >
                                  {sub}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <pre style={{
                    background: 'var(--bg-app)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '1rem',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.82rem',
                    color: 'var(--text-primary)',
                    whiteSpace: 'pre-wrap',
                    overflowX: 'auto'
                  }}>
                    {output.parsedData.mermaid}
                  </pre>
                )}
              </div>
            ) : <StudioMarkdownViewer text={output.content} />
          )}

          {/* ============================================================== */}
          {/* INFOGRAPHIC                                                    */}
          {/* ============================================================== */}
          {toolId === 'infographic' && (
            output?.parsedData?.stats ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--text-primary)', marginBottom: '0.3rem' }}>
                    {output.parsedData.title || 'Infographic Overview'}
                  </h3>
                  {output.parsedData.tagline && (
                    <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', margin: 0 }}>
                      {output.parsedData.tagline}
                    </p>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                  {output.parsedData.stats.map((st, stIdx) => (
                    <div
                      key={stIdx}
                      style={{
                        background: 'var(--bg-surface-elevated)',
                        border: '1px solid rgba(245, 158, 11, 0.35)',
                        borderRadius: 'var(--radius-md)',
                        padding: '1rem 0.85rem',
                        textAlign: 'center',
                        boxShadow: '0 4px 15px rgba(0,0,0,0.08)'
                      }}
                    >
                      <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#f59e0b', lineHeight: 1.1 }}>
                        {st.value}
                      </div>
                      <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.35rem' }}>
                        {st.label}
                      </div>
                      {st.trend && (
                        <div style={{ fontSize: '0.7rem', color: '#10b981', marginTop: '0.2rem', fontWeight: 600 }}>
                          ↑ {st.trend}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {output.parsedData.pillars && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      Core Pillars
                    </span>
                    {output.parsedData.pillars.map((pl, pIdx) => (
                      <div key={pIdx} style={{ background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)', borderLeft: '3px solid #f59e0b', borderRadius: 'var(--radius-sm)', padding: '0.9rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                          <h4 style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)' }}>{pl.title}</h4>
                          {pl.badge && (
                            <span style={{ fontSize: '0.68rem', background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', padding: '0.12rem 0.45rem', borderRadius: '4px', fontWeight: 700 }}>
                              {pl.badge}
                            </span>
                          )}
                        </div>
                        <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                          {pl.description}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : <StudioMarkdownViewer text={output.content} />
          )}

          {/* ============================================================== */}
          {/* REPORTS                                                        */}
          {/* ============================================================== */}
          {toolId === 'reports' && (
            <div style={{ background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '1.5rem' }}>
              <StudioMarkdownViewer text={output.content} />
            </div>
          )}

          {/* ============================================================== */}
          {/* AUDIO OVERVIEW                                                 */}
          {/* ============================================================== */}
          {toolId === 'audio-overview' && (
            <div>
              {audioTurns.length > 0 && (
                <div style={{
                  background: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem',
                  marginBottom: '1rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Volume2 size={16} /> 
                      {isPlayingAudio 
                        ? `Playing: ${audioTurns[currentSpeakerTurn]?.speaker || 'Host'} speaking...` 
                        : isPausedAudio ? 'Audio Paused' : 'Voice Playback Ready'}
                    </span>
                    <div style={{ display: 'flex', gap: '0.2rem' }}>
                      {[1, 1.25, 1.5].map(s => (
                        <button
                          key={s}
                          onClick={() => setAudioSpeed(s)}
                          style={{
                            fontSize: '0.7rem',
                            padding: '0.12rem 0.4rem',
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
                      <button className="btn-gradient" style={{ flex: 1, fontSize: '0.82rem', justifyContent: 'center', padding: '0.5rem' }} onClick={handleStartAudio}>
                        <Play size={16} /> {isPausedAudio ? 'Resume Dialogue' : 'Play Audio Overview'}
                      </button>
                    ) : (
                      <button className="btn-ghost" style={{ flex: 1, fontSize: '0.82rem', justifyContent: 'center', padding: '0.5rem', borderColor: 'var(--accent-amber)', color: 'var(--accent-amber)' }} onClick={handlePauseAudio}>
                        <Pause size={16} /> Pause
                      </button>
                    )}
                    <button className="btn-ghost" style={{ width: '36px', height: '36px', justifyContent: 'center', padding: 0 }} onClick={handleStopAudio} title="Stop Audio">
                      <Square size={14} />
                    </button>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {audioTurns.map((turn, idx) => {
                  const isActive = currentSpeakerTurn === idx;
                  const isAlex = turn.speaker === 'Alex';
                  return (
                    <div
                      key={idx}
                      style={{
                        padding: '0.85rem 1rem',
                        borderRadius: 'var(--radius-sm)',
                        background: isActive ? 'rgba(59, 130, 246, 0.2)' : isAlex ? 'var(--bg-surface-elevated)' : 'rgba(255, 255, 255, 0.03)',
                        border: isActive ? '1px solid #3b82f6' : '1px solid var(--border-subtle)'
                      }}
                    >
                      <span style={{
                        fontSize: '0.7rem',
                        fontWeight: 800,
                        padding: '0.12rem 0.45rem',
                        borderRadius: '4px',
                        background: isAlex ? 'rgba(56, 189, 248, 0.2)' : 'rgba(244, 114, 182, 0.2)',
                        color: isAlex ? '#38bdf8' : '#f472b6',
                        display: 'inline-block',
                        marginBottom: '0.35rem'
                      }}>
                        {turn.speaker}
                      </span>
                      <div style={{ fontSize: '0.88rem', lineHeight: 1.6, color: 'var(--text-primary)' }}>
                        {turn.text}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

// Default export wrapper
export default function NotebookStudio(props) {
  return <StudioOptionsDrawer {...props} />;
}
