import React, { useState, useEffect, useRef } from 'react';
import {
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
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  TrendingUp,
  DollarSign,
  Target,
  PieChart,
  Zap,
  PenTool
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

export function getMindMapData(output) {
  if (!output) return null;
  let data = output.parsedData;

  // 1. Try parsing JSON from content if parsedData is null or invalid
  if (!data && output.content && typeof output.content === 'string') {
    try {
      let clean = output.content.trim().replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
      const codeMatch = clean.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (codeMatch) clean = codeMatch[1].trim();
      data = JSON.parse(clean);
    } catch {
      const fb = output.content.indexOf('{');
      const lb = output.content.lastIndexOf('}');
      if (fb !== -1 && lb > fb) {
        try {
          data = JSON.parse(output.content.substring(fb, lb + 1));
        } catch { /* ignore fallback parse error */ }
      }
    }
  }

  // 2. If data is an object with branches (or keys like topics, nodes, concepts)
  if (data && typeof data === 'object') {
    const centralTopic = data.centralTopic || data.topic || data.title || data.coreSubject || 'Central Topic';
    const summary = data.summary || data.description || '';
    const rawBranches = data.branches || data.nodes || data.topics || data.themes || data.categories || [];

    if (Array.isArray(rawBranches) && rawBranches.length > 0) {
      const normalizedBranches = rawBranches.map((b, idx) => {
        const title = typeof b === 'string' ? b : (b.title || b.name || `Branch ${idx + 1}`);
        const branchSummary = typeof b === 'object' ? (b.summary || b.description || '') : '';
        const icon = (typeof b === 'object' && b.icon) ? b.icon : ['💡', '🎯', '⚙️', '🚀', '📚', '🔬'][idx % 6];
        const side = (typeof b === 'object' && b.side) ? b.side : (idx % 2 === 0 ? 'left' : 'right');
        const color = (typeof b === 'object' && b.color) ? b.color : ['yellow', 'blue', 'teal', 'orange', 'purple', 'green'][idx % 6];
        const quadrant = (typeof b === 'object' && b.quadrant) ? b.quadrant : (['top-left', 'bottom-left', 'top-right', 'bottom-right'][idx % 4]);
        const rawSubs = typeof b === 'object' ? (b.subTopics || b.subtopics || b.children || b.sub_points || b.points || []) : [];
        const subTopics = Array.isArray(rawSubs) ? rawSubs.map(st => {
          if (typeof st === 'string') return { title: st, detail: '', leafPoints: [] };
          const leafPoints = Array.isArray(st.leafPoints) ? st.leafPoints : (Array.isArray(st.points) ? st.points : (Array.isArray(st.evidence) ? st.evidence : []));
          return {
            title: st.title || st.name || st.point || '',
            detail: st.detail || st.desc || st.description || '',
            leafPoints: leafPoints.filter(Boolean)
          };
        }).filter(st => st.title) : [];

        return {
          level: (typeof b === 'object' && b.level) ? b.level : 1,
          quadrant,
          color,
          title,
          summary: branchSummary,
          icon,
          side,
          subTopics
        };
      });

      return {
        centralTopic,
        summary,
        branches: normalizedBranches,
        mermaid: data.mermaid || ''
      };
    }
  }

  // 3. Fallback: Parse markdown headings and bullet points from output.content
  if (output.content && typeof output.content === 'string') {
    const cleanContent = output.content.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
    const lines = cleanContent.split('\n');
    let centralTopic = 'Core Subject';
    const branches = [];
    let currentBranch = null;

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;

      if ((line.startsWith('# ') || line.startsWith('Title:')) && centralTopic === 'Core Subject') {
        centralTopic = line.replace(/^(#+|Title:)\s*/, '').replace(/[*_]/g, '').trim();
      } else if (line.startsWith('## ') || line.startsWith('### ') || line.match(/^\d+\.\s+\*\*/)) {
        if (currentBranch) branches.push(currentBranch);
        const title = line.replace(/^[#\d.*\s]+/, '').replace(/\*\*.*$/, '').replace(/[:*]/g, '').trim() || `Theme ${branches.length + 1}`;
        currentBranch = {
          title,
          summary: '',
          icon: ['💡', '🎯', '⚙️', '🚀', '📚', '🔬'][branches.length % 6],
          side: branches.length % 2 === 0 ? 'left' : 'right',
          subTopics: []
        };
      } else if (currentBranch && (line.startsWith('- ') || line.startsWith('* ') || line.startsWith('• ') || line.match(/^\d+\.\s+/))) {
        const sub = line.replace(/^([-*•]|\d+\.)\s*/, '').trim();
        if (sub) {
          const parts = sub.split(/:\s+/);
          if (parts.length > 1) {
            currentBranch.subTopics.push({ title: parts[0].replace(/\*\*/g, '').trim(), detail: parts.slice(1).join(': ').trim() });
          } else {
            currentBranch.subTopics.push({ title: sub.replace(/\*\*/g, '').trim() });
          }
        }
      } else if (currentBranch && !currentBranch.summary && line.length > 15 && !line.startsWith('```')) {
        currentBranch.summary = line.substring(0, 100);
      }
    }
    if (currentBranch) branches.push(currentBranch);

    if (branches.length > 0) {
      return {
        centralTopic,
        summary: '',
        branches,
        mermaid: ''
      };
    }
  }

  return null;
}

export function getInfographicData(output) {
  if (!output) return null;
  let data = output.parsedData;

  if (!data && output.content && typeof output.content === 'string') {
    try {
      let clean = output.content.trim().replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
      const codeMatch = clean.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (codeMatch) clean = codeMatch[1].trim();
      data = JSON.parse(clean);
    } catch {
      const fb = output.content.indexOf('{');
      const lb = output.content.lastIndexOf('}');
      if (fb !== -1 && lb > fb) {
        try {
          data = JSON.parse(output.content.substring(fb, lb + 1));
        } catch { /* ignore fallback parse error */ }
      }
    }
  }

  if (data && typeof data === 'object') {
    return data;
  }
  return null;
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

  // Mind Map State ('notebooklm' | 'pastel' | 'doodle' | 'mermaid') & Hierarchical Interactive Controls
  const [mindMapViewMode, setMindMapViewMode] = useState('notebooklm');
  const [collapsedPillars, setCollapsedPillars] = useState(new Set());
  const togglePillarCollapse = (idx, e) => {
    if (e) e.stopPropagation();
    setCollapsedPillars(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };
  const [mindMapZoom, setMindMapZoom] = useState(1);
  const [isMindMapExpanded, setIsMindMapExpanded] = useState(false);
  const [isFullWidth, setIsFullWidth] = useState(false);
  const [selectedBranchIdx, setSelectedBranchIdx] = useState(null);
  const [exploredNodes, setExploredNodes] = useState(new Set());
  const [userDoodleNotes, setUserDoodleNotes] = useState([]);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [newNoteText, setNewNoteText] = useState('');
  const [hierarchyDepth, setHierarchyDepth] = useState('all'); // 'all' | 'pillars' | 'subtopics'

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
            onClick={() => setIsFullWidth(prev => !prev)}
            className="btn-ghost"
            style={{
              fontSize: '0.74rem',
              padding: '0.25rem 0.6rem',
              gap: '0.35rem',
              color: isFullWidth ? 'var(--accent-primary)' : 'var(--text-secondary)',
              border: isFullWidth ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
              background: isFullWidth ? 'rgba(99, 102, 241, 0.12)' : 'transparent'
            }}
            title={isFullWidth ? "Switch to Centered Standard Width" : "Expand to Full Center Width"}
          >
            {isFullWidth ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
            <span>{isFullWidth ? "Standard Fit" : "Full Width"}</span>
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
      <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem clamp(0.75rem, 2vw, 1.5rem)' }}>
        <div style={{
          maxWidth: isFullWidth ? '100%' : ((toolId === 'mind-map' || toolId === 'infographic') ? '1180px' : '920px'),
          margin: '0 auto',
          width: '100%',
          boxSizing: 'border-box',
          transition: 'max-width 0.25s ease'
        }}>

          {/* ============================================================== */}
          {/* SLIDE DECK                                                     */}
          {/* ============================================================== */}
          {toolId === 'slide-deck' && (
            output?.parsedData?.slides?.length > 0 ? (
              <div>
                {/* Header without top-right buttons per user request */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                  <div>
                    <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#d946ef' }}>
                      Slide {currentSlideIndex + 1} of {output.parsedData.slides.length}
                    </span>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                      {output.parsedData.deckTitle || 'Presentation Deck'}
                    </div>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#d946ef', background: 'rgba(217, 70, 239, 0.12)', border: '1px solid rgba(217, 70, 239, 0.25)', padding: '0.2rem 0.65rem', borderRadius: 'var(--radius-full)', fontWeight: 700 }}>
                    Executive Keynote
                  </div>
                </div>

                {(() => {
                  const slide = output.parsedData.slides[currentSlideIndex];
                  return (
                    <div style={{
                      background: 'var(--bg-surface-elevated)',
                      border: '1.5px solid rgba(217, 70, 239, 0.35)',
                      borderRadius: 'var(--radius-lg)',
                      padding: '1.75rem clamp(2.4rem, 5vw, 3.5rem)',
                      boxShadow: '0 8px 30px rgba(0,0,0,0.18)',
                      marginBottom: '1rem',
                      position: 'relative',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      minHeight: '340px'
                    }}>
                      {/* Left and Right Side Edge Navigation Arrows directly inside slide */}
                      {currentSlideIndex > 0 && (
                        <button
                          type="button"
                          onClick={() => setCurrentSlideIndex(prev => Math.max(0, prev - 1))}
                          className="slide-edge-nav prev"
                          title="Previous Slide"
                        >
                          <ChevronLeft size={22} />
                        </button>
                      )}
                      {currentSlideIndex < output.parsedData.slides.length - 1 && (
                        <button
                          type="button"
                          onClick={() => setCurrentSlideIndex(prev => Math.min(output.parsedData.slides.length - 1, prev + 1))}
                          className="slide-edge-nav next"
                          title="Next Slide"
                        >
                          <ChevronRight size={22} />
                        </button>
                      )}

                      <div>
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

                      {/* In-Slide Previous & Next Navigation Buttons */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingTop: '1.25rem',
                        marginTop: '1.5rem',
                        borderTop: '1px solid rgba(217, 70, 239, 0.2)',
                        gap: '0.75rem'
                      }}>
                        <button
                          type="button"
                          className="btn-ghost"
                          disabled={currentSlideIndex === 0}
                          onClick={() => setCurrentSlideIndex(prev => Math.max(0, prev - 1))}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            fontSize: '0.84rem',
                            fontWeight: 700,
                            padding: '0.55rem 1.15rem',
                            borderRadius: 'var(--radius-sm)',
                            borderColor: currentSlideIndex === 0 ? 'var(--border-subtle)' : 'rgba(217, 70, 239, 0.45)',
                            color: currentSlideIndex === 0 ? 'var(--text-muted)' : 'var(--text-primary)',
                            cursor: currentSlideIndex === 0 ? 'not-allowed' : 'pointer',
                            background: currentSlideIndex === 0 ? 'transparent' : 'rgba(217, 70, 239, 0.08)'
                          }}
                        >
                          <ChevronLeft size={18} />
                          <span>Previous Slide</span>
                        </button>

                        <div style={{
                          fontSize: '0.78rem',
                          fontWeight: 800,
                          color: '#d946ef',
                          background: 'rgba(217, 70, 239, 0.12)',
                          padding: '0.3rem 0.85rem',
                          borderRadius: '9999px',
                          letterSpacing: '0.04em'
                        }}>
                          Slide {currentSlideIndex + 1} of {output.parsedData.slides.length}
                        </div>

                        <button
                          type="button"
                          className="btn-gradient"
                          disabled={currentSlideIndex === output.parsedData.slides.length - 1}
                          onClick={() => setCurrentSlideIndex(prev => Math.min(output.parsedData.slides.length - 1, prev + 1))}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            fontSize: '0.84rem',
                            fontWeight: 700,
                            padding: '0.55rem 1.25rem',
                            borderRadius: 'var(--radius-sm)',
                            background: currentSlideIndex === output.parsedData.slides.length - 1 ? 'var(--bg-surface)' : 'linear-gradient(135deg, #d946ef 0%, #a855f7 100%)',
                            color: currentSlideIndex === output.parsedData.slides.length - 1 ? 'var(--text-muted)' : '#ffffff',
                            border: currentSlideIndex === output.parsedData.slides.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                            cursor: currentSlideIndex === output.parsedData.slides.length - 1 ? 'not-allowed' : 'pointer',
                            boxShadow: currentSlideIndex === output.parsedData.slides.length - 1 ? 'none' : '0 4px 14px rgba(217, 70, 239, 0.4)'
                          }}
                        >
                          <span>Next Slide</span>
                          <ChevronRight size={18} />
                        </button>
                      </div>

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
                    {/* True 3D Flippable Card with Spring Animation */}
                    <div
                      onClick={() => setIsCardFlipped(!isCardFlipped)}
                      className="flashcard-3d-scene"
                    >
                      <div className={`flashcard-3d-card ${isCardFlipped ? 'flipped' : ''}`}>

                        {/* FRONT FACE (Question) */}
                        <div className="flashcard-face flashcard-front">
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{
                              fontSize: '0.72rem',
                              fontWeight: 800,
                              padding: '0.2rem 0.65rem',
                              borderRadius: '9999px',
                              background: 'rgba(249, 115, 22, 0.15)',
                              color: '#f97316',
                              border: '1px solid rgba(249, 115, 22, 0.3)'
                            }}>
                              QUESTION
                            </span>
                            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                              <RotateCcw size={12} /> Click anywhere to flip
                            </span>
                          </div>

                          <div style={{ margin: '1.75rem 0', textAlign: 'center' }}>
                            <div style={{
                              fontSize: '1.2rem',
                              fontWeight: 700,
                              lineHeight: 1.6,
                              color: 'var(--text-primary)'
                            }}>
                              {flashcardDeck[currentCardIndex]?.front}
                            </div>
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                            <span>Topic: <strong style={{ color: 'var(--text-secondary)' }}>{flashcardDeck[currentCardIndex]?.category || 'Core Concept'}</strong></span>
                            <span style={{ color: '#f97316', fontWeight: 600 }}>Click to reveal answer 🔄</span>
                          </div>
                        </div>

                        {/* BACK FACE (Answer) */}
                        <div className="flashcard-face flashcard-back">
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{
                              fontSize: '0.72rem',
                              fontWeight: 800,
                              padding: '0.2rem 0.65rem',
                              borderRadius: '9999px',
                              background: '#f97316',
                              color: '#ffffff',
                              boxShadow: '0 2px 8px rgba(249, 115, 22, 0.4)'
                            }}>
                              ANSWER
                            </span>
                            <span style={{ fontSize: '0.74rem', color: 'rgba(249, 115, 22, 0.85)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                              <RotateCcw size={12} /> Click to flip back
                            </span>
                          </div>

                          <div style={{ margin: '1.75rem 0', textAlign: 'center' }}>
                            <div style={{
                              fontSize: '1.1rem',
                              fontWeight: 500,
                              lineHeight: 1.65,
                              color: 'var(--text-primary)'
                            }}>
                              {flashcardDeck[currentCardIndex]?.back}
                            </div>
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                            <span>Card {currentCardIndex + 1} of {flashcardDeck.length}</span>
                            <span style={{ color: 'var(--text-secondary)' }}>Click to see question</span>
                          </div>
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
          {/* MIND MAP (Creative Radial & Notebook Doodle Styles)            */}
          {/* ============================================================== */}
          {toolId === 'mind-map' && (() => {
            const mindMapData = getMindMapData(output);
            if (!mindMapData) return <StudioMarkdownViewer text={output.content} />;

            return (
              <div>
                {/* Switcher & View Controls */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.65rem' }}>
                  <div style={{ display: 'flex', gap: '0.45rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => setMindMapViewMode('notebooklm')}
                      style={{
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        padding: '0.35rem 0.85rem',
                        borderRadius: 'var(--radius-sm)',
                        border: mindMapViewMode === 'notebooklm' ? '2px solid #2563eb' : '1px solid var(--border-subtle)',
                        background: mindMapViewMode === 'notebooklm' ? 'rgba(37, 99, 235, 0.18)' : 'transparent',
                        color: mindMapViewMode === 'notebooklm' ? '#2563eb' : 'var(--text-secondary)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <Network size={14} />
                      <span>✨ NotebookLM Radial</span>
                    </button>

                    <button
                      onClick={() => setMindMapViewMode('doodle')}
                      style={{
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        padding: '0.35rem 0.85rem',
                        borderRadius: 'var(--radius-sm)',
                        border: mindMapViewMode === 'doodle' ? '2px solid #ea580c' : '1px solid var(--border-subtle)',
                        background: mindMapViewMode === 'doodle' ? 'rgba(234, 88, 12, 0.18)' : 'transparent',
                        color: mindMapViewMode === 'doodle' ? '#ea580c' : 'var(--text-secondary)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <PenTool size={14} />
                      <span>📒 Ruled Notebook (Hand-Drawn)</span>
                    </button>

                    <button
                      onClick={() => setMindMapViewMode('pastel')}
                      style={{
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        padding: '0.35rem 0.85rem',
                        borderRadius: 'var(--radius-sm)',
                        border: mindMapViewMode === 'pastel' ? '1.5px solid #8b5cf6' : '1px solid var(--border-subtle)',
                        background: mindMapViewMode === 'pastel' ? 'rgba(139, 92, 246, 0.18)' : 'transparent',
                        color: mindMapViewMode === 'pastel' ? '#8b5cf6' : 'var(--text-secondary)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <Sparkles size={14} />
                      <span>🎨 Pastel Studio</span>
                    </button>

                    {mindMapData.mermaid && (
                      <button
                        onClick={() => setMindMapViewMode('mermaid')}
                        style={{
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          padding: '0.35rem 0.8rem',
                          borderRadius: 'var(--radius-sm)',
                          border: mindMapViewMode === 'mermaid' ? '1.5px solid var(--accent-cyan)' : '1px solid var(--border-subtle)',
                          background: mindMapViewMode === 'mermaid' ? 'rgba(6, 182, 212, 0.2)' : 'transparent',
                          color: mindMapViewMode === 'mermaid' ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        Mermaid Code
                      </button>
                    )}
                  </div>

                  {/* Hierarchy Level Switcher & Controls */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: '0.15rem' }}>
                      <button
                        onClick={() => setHierarchyDepth('all')}
                        style={{
                          fontSize: '0.72rem',
                          padding: '0.2rem 0.55rem',
                          borderRadius: '3px',
                          border: 'none',
                          background: hierarchyDepth === 'all' ? '#ea580c' : 'transparent',
                          color: hierarchyDepth === 'all' ? '#ffffff' : 'var(--text-secondary)',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                        title="Show all hierarchy tiers: Pillars, Subtopics, and Leaf Evidence"
                      >
                        All Tiers (L1-L3)
                      </button>
                      <button
                        onClick={() => setHierarchyDepth('pillars')}
                        style={{
                          fontSize: '0.72rem',
                          padding: '0.2rem 0.55rem',
                          borderRadius: '3px',
                          border: 'none',
                          background: hierarchyDepth === 'pillars' ? '#ea580c' : 'transparent',
                          color: hierarchyDepth === 'pillars' ? '#ffffff' : 'var(--text-secondary)',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                        title="Show Level 1 Pillars only for executive overview"
                      >
                        Level 1 Pillars
                      </button>
                      <button
                        onClick={() => setHierarchyDepth('subtopics')}
                        style={{
                          fontSize: '0.72rem',
                          padding: '0.2rem 0.55rem',
                          borderRadius: '3px',
                          border: 'none',
                          background: hierarchyDepth === 'subtopics' ? '#ea580c' : 'transparent',
                          color: hierarchyDepth === 'subtopics' ? '#ffffff' : 'var(--text-secondary)',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                        title="Show Level 1 Pillars + Level 2 Subtopics"
                      >
                        L1 + L2
                      </button>
                    </div>

                    <button
                      onClick={() => setIsAddingNote(prev => !prev)}
                      className="btn-ghost"
                      style={{ fontSize: '0.74rem', padding: '0.3rem 0.65rem', gap: '0.35rem', color: '#ea580c', borderColor: 'rgba(234, 88, 12, 0.4)' }}
                      title="Stick a personal doodle note on this mind map"
                    >
                      <StickyNote size={13} /> {isAddingNote ? 'Cancel Note' : '+ Add Note'}
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: '0.15rem' }}>
                      <button
                        onClick={() => setMindMapZoom(prev => Math.max(0.65, Number((prev - 0.1).toFixed(2))))}
                        className="composer-btn-icon"
                        style={{ width: '26px', height: '26px' }}
                        title="Zoom Out"
                      >
                        <ZoomOut size={13} />
                      </button>
                      <button
                        onClick={() => setMindMapZoom(1)}
                        className="btn-ghost"
                        style={{ fontSize: '0.72rem', padding: '0.15rem 0.5rem', border: 'none', fontWeight: 700 }}
                        title="Reset Zoom to 100% Fit"
                      >
                        {Math.round(mindMapZoom * 100)}% Fit
                      </button>
                      <button
                        onClick={() => setMindMapZoom(prev => Math.min(1.35, Number((prev + 0.1).toFixed(2))))}
                        className="composer-btn-icon"
                        style={{ width: '26px', height: '26px' }}
                        title="Zoom In"
                      >
                        <ZoomIn size={13} />
                      </button>
                    </div>

                    <button
                      onClick={() => setIsMindMapExpanded(true)}
                      className="btn-ghost"
                      style={{ fontSize: '0.74rem', padding: '0.3rem 0.65rem', gap: '0.35rem' }}
                      title="Open Fullscreen Mind Map Overlay"
                    >
                      <Maximize2 size={13} /> Fullscreen
                    </button>
                  </div>
                </div>

                {/* Inline Sticky Note Creator */}
                {isAddingNote && (
                  <div style={{
                    background: '#fef08a',
                    border: '2px solid #ca8a04',
                    borderRadius: '8px',
                    padding: '0.85rem 1rem',
                    marginBottom: '1rem',
                    boxShadow: '4px 4px 0px #1f2937',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    color: '#713f12'
                  }}>
                    <span style={{ fontSize: '1.2rem' }}>📌</span>
                    <input
                      type="text"
                      placeholder="Write your personal observation or key reminder here..."
                      value={newNoteText}
                      onChange={e => setNewNoteText(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && newNoteText.trim()) {
                          setUserDoodleNotes(prev => [
                            ...prev,
                            { id: Date.now(), text: newNoteText.trim(), color: ['#fef08a', '#bae6fd', '#fed7aa', '#bbf7d0'][prev.length % 4], tilt: prev.length % 2 === 0 ? '-1.5deg' : '1.5deg' }
                          ]);
                          setNewNoteText('');
                          setIsAddingNote(false);
                        }
                      }}
                      style={{
                        flex: 1,
                        background: 'transparent',
                        border: 'none',
                        borderBottom: '1.5px dashed #ca8a04',
                        padding: '0.3rem 0.4rem',
                        fontSize: '0.86rem',
                        fontWeight: 600,
                        color: '#713f12',
                        outline: 'none'
                      }}
                      autoFocus
                    />
                    <button
                      onClick={() => {
                        if (newNoteText.trim()) {
                          setUserDoodleNotes(prev => [
                            ...prev,
                            { id: Date.now(), text: newNoteText.trim(), color: ['#fef08a', '#bae6fd', '#fed7aa', '#bbf7d0'][prev.length % 4], tilt: prev.length % 2 === 0 ? '-1.5deg' : '1.5deg' }
                          ]);
                          setNewNoteText('');
                          setIsAddingNote(false);
                        }
                      }}
                      className="btn-primary"
                      style={{ fontSize: '0.74rem', padding: '0.35rem 0.85rem', background: '#ea580c', borderColor: '#ea580c', color: '#fff', borderRadius: '4px', fontWeight: 800 }}
                    >
                      Pin Note
                    </button>
                  </div>
                )}

                {/* Explicit Hierarchy Guide & Progress Banner */}
                {(() => {
                  const branches = mindMapData.branches || [];
                  const totalSubtopics = branches.reduce((acc, b) => acc + (b.subTopics?.length || 0), 0);
                  const totalLeaves = branches.reduce((acc, b) => acc + (b.subTopics?.reduce((sAcc, s) => sAcc + (s.leafPoints?.length || 1), 0) || 0), 0);
                  const exploredCount = exploredNodes.size;

                  return (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: 'rgba(234, 88, 12, 0.08)',
                      border: '1.5px solid rgba(234, 88, 12, 0.3)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '0.5rem 0.95rem',
                      marginBottom: '1.25rem',
                      fontSize: '0.78rem',
                      flexWrap: 'wrap',
                      gap: '0.65rem'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', color: '#ea580c', fontWeight: 800 }}>
                        <Award size={16} />
                        <span>🌳 Knowledge Hierarchy: [L0 Core Theme] ➔ [L1 4 Pillars] ➔ [L2 {totalSubtopics} Subtopics] ➔ [L3 {totalLeaves} Leaf Points]</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                          Mastered: {exploredCount} items
                        </span>
                        <div style={{ width: '100px', height: '7px', background: 'rgba(0,0,0,0.1)', borderRadius: '9999px', overflow: 'hidden' }}>
                          <div style={{ width: `${Math.min(100, Math.round((exploredCount / Math.max(1, branches.length + totalSubtopics)) * 100))}%`, height: '100%', background: '#ea580c', borderRadius: '9999px', transition: 'width 0.3s ease' }} />
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {mindMapViewMode !== 'mermaid' ? (
                  (() => {
                    const branches = mindMapData.branches || [];

                    // Group into the 4 true radial quadrants
                    const qTL = branches.find(b => b.quadrant === 'top-left') || branches[0];
                    const qTR = branches.find(b => b.quadrant === 'top-right') || branches[2] || branches[1];
                    const qBL = branches.find(b => b.quadrant === 'bottom-left') || branches[1] || branches[2];
                    const qBR = branches.find(b => b.quadrant === 'bottom-right') || branches[3] || branches[branches.length - 1];

                    // Diagonal hand-drawn green-fill sketched long arrows physically bridging Center Hub to 4 Quadrants
                    const renderRadialGuideArrow = (quadrant) => (
                      <svg width="105" height="74" viewBox="0 0 105 74" style={{ overflow: 'visible', filter: 'drop-shadow(2px 3px 0px rgba(0,0,0,0.22))' }}>
                        {quadrant === 'top-left' && (
                          <g>
                            {/* Long double-lined sketched arrow with pastel green fill bridging Center Oval to Idea 1 */}
                            <path 
                              d="M 98 67 C 76 54, 56 40, 28 22 L 32 10 L 6 12 L 18 38 L 24 27 C 50 44, 72 58, 90 73 Z" 
                              fill="#bbf7d0" 
                              stroke="#1f2937" 
                              strokeWidth="2.6" 
                              strokeLinejoin="round" 
                            />
                            {/* Inner sketched accent line */}
                            <path d="M 92 70 C 70 56, 50 42, 26 26" fill="none" stroke="#1f2937" strokeWidth="1.2" strokeDasharray="3 3" opacity="0.65" />
                          </g>
                        )}
                        {quadrant === 'top-right' && (
                          <g>
                            {/* Long double-lined sketched arrow bridging Center Oval to Idea 3 */}
                            <path 
                              d="M 7 67 C 29 54, 49 40, 77 22 L 73 10 L 99 12 L 87 38 L 81 27 C 55 44, 33 58, 15 73 Z" 
                              fill="#bbf7d0" 
                              stroke="#1f2937" 
                              strokeWidth="2.6" 
                              strokeLinejoin="round" 
                            />
                            <path d="M 13 70 C 35 56, 55 42, 79 26" fill="none" stroke="#1f2937" strokeWidth="1.2" strokeDasharray="3 3" opacity="0.65" />
                          </g>
                        )}
                        {quadrant === 'bottom-left' && (
                          <g>
                            {/* Long double-lined sketched arrow bridging Center Oval to Idea 2 */}
                            <path 
                              d="M 98 7 C 76 20, 56 34, 28 52 L 32 64 L 6 62 L 18 36 L 24 47 C 50 30, 72 16, 90 1 Z" 
                              fill="#bbf7d0" 
                              stroke="#1f2937" 
                              strokeWidth="2.6" 
                              strokeLinejoin="round" 
                            />
                            <path d="M 92 4 C 70 18, 50 32, 26 48" fill="none" stroke="#1f2937" strokeWidth="1.2" strokeDasharray="3 3" opacity="0.65" />
                          </g>
                        )}
                        {quadrant === 'bottom-right' && (
                          <g>
                            {/* Long double-lined sketched arrow bridging Center Oval to Idea 4 */}
                            <path 
                              d="M 7 7 C 29 20, 49 34, 77 52 L 73 64 L 99 62 L 87 36 L 81 47 C 55 30, 33 16, 15 1 Z" 
                              fill="#bbf7d0" 
                              stroke="#1f2937" 
                              strokeWidth="2.6" 
                              strokeLinejoin="round" 
                            />
                            <path d="M 13 4 C 35 18, 55 32, 79 48" fill="none" stroke="#1f2937" strokeWidth="1.2" strokeDasharray="3 3" opacity="0.65" />
                          </g>
                        )}
                      </svg>
                    );

                    const toggleMastered = (id, e) => {
                      if (e) e.stopPropagation();
                      setExploredNodes(prev => {
                        const next = new Set(prev);
                        if (next.has(id)) next.delete(id);
                        else next.add(id);
                        return next;
                      });
                    };

                    // PASTEL COLOR THEMES & ORGANIC SHAPES (Matching User Reference Image 1)
                    const PASTEL_THEMES = [
                      {
                        name: 'Peach Squircle',
                        cardBg: '#ffe4e6',
                        cardBorder: '#fecdd3',
                        text: '#9f1239',
                        badgeBg: '#f43f5e',
                        borderRadius: '24px',
                        subBg: '#ecfdf5',
                        subBorder: '#a7f3d0',
                        subText: '#065f46',
                        subRadius: '16px'
                      },
                      {
                        name: 'Mint Rounded',
                        cardBg: '#ecfdf5',
                        cardBorder: '#a7f3d0',
                        text: '#065f46',
                        badgeBg: '#10b981',
                        borderRadius: '16px',
                        subBg: '#ffe4e6',
                        subBorder: '#fecdd3',
                        subText: '#9f1239',
                        subRadius: '20px'
                      },
                      {
                        name: 'Apricot Squircle',
                        cardBg: '#ffedd5',
                        cardBorder: '#fed7aa',
                        text: '#9a3412',
                        badgeBg: '#ea580c',
                        borderRadius: '24px',
                        subBg: '#f3e8ff',
                        subBorder: '#ddd6fe',
                        subText: '#581c87',
                        subRadius: '9999px'
                      },
                      {
                        name: 'Lavender Oval',
                        cardBg: '#f3e8ff',
                        cardBorder: '#ddd6fe',
                        text: '#581c87',
                        badgeBg: '#8b5cf6',
                        borderRadius: '9999px',
                        subBg: '#ffedd5',
                        subBorder: '#fed7aa',
                        subText: '#9a3412',
                        subRadius: '20px'
                      },
                      {
                        name: 'Sage Mint Rounded',
                        cardBg: '#ecfdf5',
                        cardBorder: '#a7f3d0',
                        text: '#065f46',
                        badgeBg: '#059669',
                        borderRadius: '16px',
                        subBg: '#fee2e2',
                        subBorder: '#fca5a5',
                        subText: '#991b1b',
                        subRadius: '20px'
                      },
                      {
                        name: 'Butter Gold Squircle',
                        cardBg: '#fef9c3',
                        cardBorder: '#fef08a',
                        text: '#854d0e',
                        badgeBg: '#eab308',
                        borderRadius: '22px',
                        subBg: '#e0f2fe',
                        subBorder: '#bae6fd',
                        subText: '#075985',
                        subRadius: '9999px'
                      }
                    ];

                    // Short curved branching arrow helper for Pastel Studio layout
                    const getShortBranchArrow = (sIdx, total, isLeft) => {
                      if (total <= 1) {
                        return {
                          path: isLeft ? "M 32 14 L 6 14" : "M 4 14 L 30 14",
                          points: isLeft ? "2 14, 9 9, 9 19" : "34 14, 27 9, 27 19"
                        };
                      }
                      if (total === 2) {
                        if (sIdx === 0) {
                          return {
                            path: isLeft ? "M 32 22 C 22 22, 16 8, 6 8" : "M 4 22 C 14 22, 20 8, 30 8",
                            points: isLeft ? "2 8, 9 3, 9 13" : "34 8, 27 3, 27 13"
                          };
                        }
                        return {
                          path: isLeft ? "M 32 6 C 22 6, 16 20, 6 20" : "M 4 6 C 14 6, 20 20, 30 20",
                          points: isLeft ? "2 20, 9 15, 9 25" : "34 20, 27 15, 27 25"
                        };
                      }
                      // total >= 3
                      if (sIdx === 0) {
                        return {
                          path: isLeft ? "M 32 24 C 22 24, 15 6, 6 6" : "M 4 24 C 14 24, 21 6, 30 6",
                          points: isLeft ? "2 6, 9 1, 9 11" : "34 6, 27 1, 27 11"
                        };
                      }
                      if (sIdx === total - 1) {
                        return {
                          path: isLeft ? "M 32 4 C 22 4, 15 22, 6 22" : "M 4 4 C 14 4, 21 22, 30 22",
                          points: isLeft ? "2 22, 9 17, 9 27" : "34 22, 27 17, 27 27"
                        };
                      }
                      return {
                        path: isLeft ? "M 32 14 L 6 14" : "M 4 14 L 30 14",
                        points: isLeft ? "2 14, 9 9, 9 19" : "34 14, 27 9, 27 19"
                      };
                    };

                    // 1. RENDER DOODLE QUADRANT BRANCH (4 Distinct Sketched Hierarchy Styles)
                    const renderDoodleQuadrantBranch = (branch, globalIdx, quadrant) => {
                      if (!branch) return null;
                      const branchId = `b_${globalIdx}`;
                      const isMastered = exploredNodes.has(branchId);
                      const isSelected = selectedBranchIdx === globalIdx;
                      const subtopics = branch.subTopics || [];
                      const showLevel2 = hierarchyDepth !== 'pillars';
                      const showLevel3 = hierarchyDepth === 'all';
                      const allLeafPoints = subtopics.flatMap(st => (st.leafPoints && st.leafPoints.length > 0) ? st.leafPoints : []);

                      // QUADRANT 1 (TOP-LEFT): Idea 1 - Yellow Isometric 3D Note with corner fold & Speech Bubble
                      if (quadrant === 'top-left') {
                        return (
                          <div 
                            key={globalIdx} 
                            style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', alignItems: 'flex-end', maxWidth: '370px', width: '100%' }}
                          >
                            {/* Curved handwritten arrow pointing UP from Idea 1 to Level 3 Leaf Notes */}
                            {showLevel3 && allLeafPoints.length > 0 && (
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', width: '100%', marginBottom: '0.25rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
                                  <svg width="34" height="22" viewBox="0 0 34 22" style={{ overflow: 'visible' }}>
                                    <path d="M 4 20 C 10 6, 20 4, 30 4" fill="none" stroke="#1f2937" strokeWidth="2.4" strokeLinecap="round" />
                                    <polygon points="34 4, 26 1, 27 8" fill="#1f2937" />
                                  </svg>
                                  <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', color: '#854d0e', letterSpacing: '0.04em' }}>
                                    Leaf Evidence [L3]
                                  </span>
                                </div>
                                <div style={{ fontSize: '0.74rem', color: '#4b5563', fontStyle: 'italic', display: 'flex', flexDirection: 'column', gap: '0.2rem', textAlign: 'right', background: 'rgba(254, 240, 138, 0.45)', borderLeft: '2.5px solid #ca8a04', padding: '0.35rem 0.65rem', borderRadius: '4px' }}>
                                  {allLeafPoints.map((lp, idx) => (
                                    <div key={idx} onClick={() => setSelectedBranchIdx(globalIdx)} style={{ cursor: 'pointer', lineHeight: 1.4 }}>
                                      - {lp}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Level 1 Pillar Card (Yellow Sticky Note) */}
                            <div 
                              onClick={() => setSelectedBranchIdx(isSelected ? null : globalIdx)}
                              className={`doodle-isometric-card ${isSelected ? 'selected' : ''}`}
                              style={{
                                background: '#fef08a',
                                borderRadius: '4px',
                                padding: '1rem 1.15rem',
                                color: '#1f2937',
                                width: '100%',
                                boxSizing: 'border-box'
                              }}
                            >
                              <div style={{ position: 'absolute', top: -5, left: -5, width: 14, height: 14, borderTop: '2.5px solid #1f2937', borderLeft: '2.5px solid #1f2937' }} />
                              
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.35rem' }}>
                                <span style={{ fontSize: '0.72rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.06em', background: '#1f2937', color: '#fef08a', padding: '0.12rem 0.5rem', borderRadius: '3px' }}>
                                  [L1] IDEA 1: FOUNDATION
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => toggleMastered(branchId, e)}
                                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                                  title={isMastered ? "Mark as reviewing" : "Mark as mastered"}
                                >
                                  {isMastered ? <CheckCircle2 size={18} color="#16a34a" /> : <span style={{ fontSize: '0.82rem', opacity: 0.6 }}>○</span>}
                                </button>
                              </div>

                              <h4 style={{ fontSize: '1rem', fontWeight: 900, margin: '0 0 0.35rem 0', color: '#1f2937', letterSpacing: '-0.01em' }}>
                                {branch.icon || '💡'} {branch.title}
                              </h4>
                              {branch.summary && (
                                <p style={{ fontSize: '0.78rem', color: '#4b5563', margin: 0, lineHeight: 1.5 }}>
                                  {branch.summary}
                                </p>
                              )}
                            </div>

                            {/* Downward Dashed Arrow pointing to Sub Idea Speech Bubble */}
                            {showLevel2 && subtopics.length > 0 && (
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', gap: '0.35rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                                  <svg width="20" height="24" viewBox="0 0 20 24">
                                    <line x1="10" y1="2" x2="10" y2="16" stroke="#1f2937" strokeWidth="2.4" strokeDasharray="4 3" strokeLinecap="round" />
                                    <polygon points="10 22, 6 14, 14 14" fill="#1f2937" />
                                  </svg>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem', alignItems: 'flex-end', width: '100%', paddingRight: '0.5rem' }}>
                                  {subtopics.map((st, idx) => {
                                    const isLastSpeechBubble = idx === subtopics.length - 1;
                                    if (isLastSpeechBubble) {
                                      return (
                                        <div 
                                          key={idx}
                                          onClick={() => setSelectedBranchIdx(globalIdx)}
                                          className="doodle-speech-bubble"
                                          style={{ textAlign: 'left', maxWidth: '300px' }}
                                        >
                                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 800 }}>
                                            <span>💬 [L2]</span>
                                            <span>{typeof st === 'string' ? st : st.title}</span>
                                          </div>
                                          {typeof st === 'object' && st.detail && (
                                            <div style={{ fontSize: '0.72rem', marginTop: '0.2rem', opacity: 0.9, lineHeight: 1.4 }}>
                                              {st.detail}
                                            </div>
                                          )}
                                        </div>
                                      );
                                    }

                                    return (
                                      <div 
                                        key={idx}
                                        onClick={() => setSelectedBranchIdx(globalIdx)}
                                        style={{
                                          fontSize: '0.76rem',
                                          color: '#713f12',
                                          background: 'rgba(254, 240, 138, 0.75)',
                                          border: '1.5px solid #ca8a04',
                                          borderRadius: '6px',
                                          padding: '0.45rem 0.75rem',
                                          cursor: 'pointer',
                                          textAlign: 'right',
                                          maxWidth: '310px'
                                        }}
                                      >
                                        <div style={{ fontWeight: 800 }}>
                                          [L2] {typeof st === 'string' ? st : st.title}
                                        </div>
                                        {typeof st === 'object' && st.detail && (
                                          <div style={{ fontSize: '0.72rem', color: '#854d0e', marginTop: '0.2rem', lineHeight: 1.4, fontWeight: 500 }}>
                                            {st.detail}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      }

                      // QUADRANT 2 (TOP-RIGHT): Idea 3 - Circular Cog Badge with Gear Doodles & Curly Bracket
                      if (quadrant === 'top-right') {
                        return (
                          <div 
                            key={globalIdx} 
                            style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', alignItems: 'flex-start', maxWidth: '370px', width: '100%' }}
                          >
                            {/* Level 1 Pillar Card (Circular Cog Badge) */}
                            <div 
                              onClick={() => setSelectedBranchIdx(isSelected ? null : globalIdx)}
                              className={`doodle-circle-node ${isSelected ? 'selected' : ''}`}
                              style={{
                                background: '#fef3c7',
                                padding: '1.15rem 1.35rem',
                                color: '#1f2937',
                                width: '100%',
                                boxSizing: 'border-box'
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '1.2rem' }}>
                                  <span>⚙️</span>
                                  <span>⚙️</span>
                                </div>
                                <span style={{ fontSize: '0.72rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#d97706' }}>
                                  [L1] IDEA 3: ARCHITECTURE
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => toggleMastered(branchId, e)}
                                  style={{ background: 'none', border: 'none', cursor: 'padding', padding: 0 }}
                                >
                                  {isMastered ? <CheckCircle2 size={18} color="#16a34a" /> : <span style={{ fontSize: '0.82rem', opacity: 0.6 }}>○</span>}
                                </button>
                              </div>

                              <h4 style={{ fontSize: '1rem', fontWeight: 900, margin: '0 0 0.35rem 0', color: '#1f2937' }}>
                                {branch.title}
                              </h4>
                              {branch.summary && (
                                <p style={{ fontSize: '0.78rem', color: '#4b5563', margin: 0, lineHeight: 1.5 }}>
                                  {branch.summary}
                                </p>
                              )}
                            </div>

                            {/* Short arrow connecting Idea 3 to its Subtopics */}
                            {showLevel2 && subtopics.length > 0 && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', paddingLeft: '0.75rem' }}>
                                <svg width="20" height="20" viewBox="0 0 20 20">
                                  <path d="M 10 2 L 10 13" fill="none" stroke="#1f2937" strokeWidth="2.4" strokeLinecap="round" />
                                  <polygon points="10 18, 5 11, 15 11" fill="#1f2937" />
                                </svg>
                                <span style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', color: '#92400e', letterSpacing: '0.04em' }}>
                                  Components [L2]
                                </span>
                              </div>
                            )}

                            {/* Level 2 Subtopics & Level 3 Curly Bracket Grouping */}
                            {showLevel2 && subtopics.length > 0 && (
                              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem', width: '100%', paddingLeft: '0.4rem' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.78rem', color: '#374151', flex: 1 }}>
                                  {subtopics.map((st, idx) => (
                                    <div key={idx} onClick={() => setSelectedBranchIdx(globalIdx)} style={{ cursor: 'pointer', background: 'rgba(254, 243, 199, 0.6)', border: '1px solid #fde68a', borderRadius: '4px', padding: '0.35rem 0.55rem' }}>
                                      <div style={{ fontWeight: 800, color: '#92400e' }}>
                                        • [L2] {typeof st === 'string' ? st : st.title}
                                      </div>
                                      {typeof st === 'object' && st.detail && (
                                        <div style={{ fontSize: '0.72rem', color: '#78350f', marginTop: '0.15rem', lineHeight: 1.4 }}>
                                          {st.detail}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>

                                {/* Hand-drawn Curly Bracket SVG & Synthesis Takeaway */}
                                {showLevel3 && allLeafPoints.length > 0 && (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0, maxWidth: '140px' }}>
                                    <svg width="18" height="74" viewBox="0 0 18 74" style={{ flexShrink: 0 }}>
                                      <path d="M 2 4 C 8 4, 8 26, 15 37 C 8 48, 8 70, 2 70" fill="none" stroke="#1f2937" strokeWidth="2.5" strokeLinecap="round" />
                                    </svg>
                                    <div style={{ fontSize: '0.72rem', color: '#b45309', fontWeight: 800, fontStyle: 'italic', lineHeight: 1.35 }}>
                                      {allLeafPoints[0]}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      }

                      // QUADRANT 3 (BOTTOM-LEFT): Idea 2 - Tilted Blue Board with Yellow Highlighter Smear
                      if (quadrant === 'bottom-left') {
                        return (
                          <div 
                            key={globalIdx} 
                            style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', alignItems: 'flex-end', maxWidth: '370px', width: '100%' }}
                          >
                            {/* Level 1 Pillar Card (Tilted Blue Board) */}
                            <div 
                              onClick={() => setSelectedBranchIdx(isSelected ? null : globalIdx)}
                              className={`doodle-isometric-card ${isSelected ? 'selected' : ''}`}
                              style={{
                                background: '#bae6fd',
                                borderRadius: '4px',
                                padding: '1rem 1.15rem',
                                color: '#1f2937',
                                transform: 'rotate(-1.5deg)',
                                width: '100%',
                                boxSizing: 'border-box'
                              }}
                            >
                              <div style={{ position: 'absolute', top: -5, left: -5, width: 14, height: 14, borderTop: '2.5px solid #1f2937', borderLeft: '2.5px solid #1f2937' }} />
                              
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.35rem' }}>
                                <span style={{ fontSize: '0.72rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.06em', background: '#0284c7', color: '#ffffff', padding: '0.12rem 0.5rem', borderRadius: '3px' }}>
                                  [L1] IDEA 2: METHODOLOGY
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => toggleMastered(branchId, e)}
                                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                                >
                                  {isMastered ? <CheckCircle2 size={18} color="#16a34a" /> : <span style={{ fontSize: '0.82rem', opacity: 0.6 }}>○</span>}
                                </button>
                              </div>

                              <h4 style={{ fontSize: '1rem', fontWeight: 900, margin: '0 0 0.35rem 0', color: '#1f2937' }}>
                                {branch.icon || '🎯'} {branch.title}
                              </h4>
                              {branch.summary && (
                                <p style={{ fontSize: '0.78rem', color: '#334155', margin: 0, lineHeight: 1.5 }}>
                                  {branch.summary}
                                </p>
                              )}
                            </div>

                            {/* Level 2 Radiating Subtopics on Highlighter Smear with Branching Lines */}
                            {showLevel2 && subtopics.length > 0 && (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem', alignItems: 'flex-end', width: '100%' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', width: '100%', justifyContent: 'flex-end' }}>
                                  <div className="doodle-highlighter" style={{ textAlign: 'right', maxWidth: '300px' }}>
                                    <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#854d0e', marginBottom: '0.25rem', fontWeight: 800 }}>
                                      HIGHLIGHTED SUB-IDEAS [L2]
                                    </div>
                                    {subtopics.map((st, idx) => (
                                      <div key={idx} onClick={() => setSelectedBranchIdx(globalIdx)} style={{ fontSize: '0.78rem', color: '#713f12', fontWeight: 800, cursor: 'pointer', padding: '0.15rem 0', borderBottom: idx < subtopics.length - 1 ? '1px dashed rgba(180, 83, 9, 0.25)' : 'none' }}>
                                        <div>{idx + 1}. {typeof st === 'string' ? st : st.title}</div>
                                        {typeof st === 'object' && st.detail && (
                                          <div style={{ fontSize: '0.72rem', fontWeight: 500, color: '#854d0e', lineHeight: 1.4, marginTop: '0.1rem' }}>
                                            {st.detail}
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                  {/* 3-way branching pitchfork line directly bridging Idea 2 to the 3 highlighted subtopics */}
                                  <svg width="28" height="52" viewBox="0 0 28 52" style={{ flexShrink: 0 }}>
                                    <path d="M 26 26 L 14 26 M 14 26 L 4 10 M 14 26 L 4 26 M 14 26 L 4 42" fill="none" stroke="#1f2937" strokeWidth="2.5" strokeLinecap="round" />
                                    <polygon points="2 10, 8 7, 7 14" fill="#1f2937" />
                                    <polygon points="2 26, 8 22, 8 30" fill="#1f2937" />
                                    <polygon points="2 42, 8 38, 7 45" fill="#1f2937" />
                                  </svg>
                                </div>

                                {/* Level 3 Star Evidence Bullets */}
                                {showLevel3 && allLeafPoints.length > 0 && (
                                  <div style={{ fontSize: '0.74rem', color: '#475569', display: 'flex', flexDirection: 'column', gap: '0.25rem', textAlign: 'right', maxWidth: '330px', paddingRight: '0.5rem' }}>
                                    {allLeafPoints.map((lp, idx) => (
                                      <div key={idx} onClick={() => setSelectedBranchIdx(globalIdx)} style={{ cursor: 'pointer', lineHeight: 1.4 }}>
                                        ★ {lp}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      }

                      // QUADRANT 4 (BOTTOM-RIGHT): Idea 4 - 3D Coral Block with Lightbulb Doodle & Tree Diagram
                      if (quadrant === 'bottom-right') {
                        return (
                          <div 
                            key={globalIdx} 
                            style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', alignItems: 'flex-start', maxWidth: '370px', width: '100%' }}
                          >
                            {/* Level 1 Pillar Card (3D Coral Block) */}
                            <div 
                              onClick={() => setSelectedBranchIdx(isSelected ? null : globalIdx)}
                              className={`doodle-isometric-card ${isSelected ? 'selected' : ''}`}
                              style={{
                                background: '#fed7aa',
                                borderRadius: '4px',
                                padding: '1rem 1.15rem',
                                color: '#1f2937',
                                width: '100%',
                                boxSizing: 'border-box'
                              }}
                            >
                              <div style={{
                                position: 'absolute',
                                top: '-22px',
                                right: '22px',
                                background: '#fef08a',
                                border: '2px solid #1f2937',
                                borderRadius: '50% 50% 40% 40%',
                                width: '34px',
                                height: '34px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '2px 2px 0px #1f2937',
                                fontSize: '1.15rem'
                              }}>
                                💡
                              </div>

                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.35rem' }}>
                                <span style={{ fontSize: '0.72rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.06em', background: '#ea580c', color: '#ffffff', padding: '0.12rem 0.5rem', borderRadius: '3px' }}>
                                  [L1] IDEA 4: OUTCOMES
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => toggleMastered(branchId, e)}
                                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                                >
                                  {isMastered ? <CheckCircle2 size={18} color="#16a34a" /> : <span style={{ fontSize: '0.82rem', opacity: 0.6 }}>○</span>}
                                </button>
                              </div>

                              <h4 style={{ fontSize: '1rem', fontWeight: 900, margin: '0 0 0.35rem 0', color: '#1f2937' }}>
                                {branch.icon || '🚀'} {branch.title}
                              </h4>
                              {branch.summary && (
                                <p style={{ fontSize: '0.78rem', color: '#431407', margin: 0, lineHeight: 1.5 }}>
                                  {branch.summary}
                                </p>
                              )}
                            </div>

                            {/* Short arrow connecting Idea 4 to the Tree Diagram */}
                            {showLevel2 && subtopics.length > 0 && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', paddingLeft: '0.75rem' }}>
                                <svg width="20" height="20" viewBox="0 0 20 20">
                                  <path d="M 10 2 L 10 13" fill="none" stroke="#ea580c" strokeWidth="2.4" strokeLinecap="round" />
                                  <polygon points="10 18, 5 11, 15 11" fill="#ea580c" />
                                </svg>
                                <span style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', color: '#c2410c', letterSpacing: '0.04em' }}>
                                  Outcomes Tree [L2]
                                </span>
                              </div>
                            )}

                            {/* Level 2 & Level 3 Tree Diagram with Dashed Lines */}
                            {showLevel2 && subtopics.length > 0 && (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', width: '100%', paddingLeft: '0.5rem', fontFamily: 'monospace' }}>
                                {subtopics.map((st, idx) => (
                                  <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                    <div 
                                      onClick={() => setSelectedBranchIdx(globalIdx)}
                                      style={{ fontSize: '0.78rem', color: '#431407', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                                    >
                                      <span style={{ opacity: 0.6 }}>{idx === subtopics.length - 1 ? '└──' : '├──'}</span>
                                      <span>[L2] {typeof st === 'string' ? st : st.title}</span>
                                    </div>
                                    {typeof st === 'object' && st.detail && (
                                      <div style={{ paddingLeft: '1.75rem', fontSize: '0.72rem', color: '#7c2d12', opacity: 0.9, lineHeight: 1.4 }}>
                                        {st.detail}
                                      </div>
                                    )}
                                    {showLevel3 && st.leafPoints && st.leafPoints.length > 0 && (
                                      <div style={{ paddingLeft: '1.75rem', display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                                        {st.leafPoints.map((lp, lpIdx) => (
                                          <div key={lpIdx} style={{ fontSize: '0.72rem', color: '#ea580c', fontWeight: 600 }}>
                                            • {lp}
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      }

                      return null;
                    };

                    // 2. RENDER PASTEL STUDIO LAYOUT (Matching User Reference Image 1)
                    const renderPastelStudioLayout = (inModal = false) => {
                      const leftGroup = [];
                      const rightGroup = [];

                      branches.forEach((b, idx) => {
                        if (b.quadrant === 'top-left' || b.quadrant === 'bottom-left' || b.side === 'left') {
                          leftGroup.push({ branch: b, globalIdx: idx });
                        } else if (b.quadrant === 'top-right' || b.quadrant === 'bottom-right' || b.side === 'right') {
                          rightGroup.push({ branch: b, globalIdx: idx });
                        } else if (idx % 2 === 0) {
                          leftGroup.push({ branch: b, globalIdx: idx });
                        } else {
                          rightGroup.push({ branch: b, globalIdx: idx });
                        }
                      });

                      if (leftGroup.length === 0 && rightGroup.length > 1) {
                        leftGroup.push(...rightGroup.splice(0, Math.ceil(rightGroup.length / 2)));
                      } else if (rightGroup.length === 0 && leftGroup.length > 1) {
                        rightGroup.push(...leftGroup.splice(Math.ceil(leftGroup.length / 2)));
                      }

                      const renderPastelBranchCard = (item, isLeft) => {
                        const { branch, globalIdx } = item;
                        const branchId = `b_${globalIdx}`;
                        const isMastered = exploredNodes.has(branchId);
                        const isSelected = selectedBranchIdx === globalIdx;
                        const theme = PASTEL_THEMES[globalIdx % PASTEL_THEMES.length];
                        const subtopics = branch.subTopics || [];
                        const showLevel2 = hierarchyDepth !== 'pillars';
                        const showLevel3 = hierarchyDepth === 'all';

                        return (
                          <div 
                            key={globalIdx}
                            style={{
                              display: 'flex',
                              flexDirection: isLeft ? 'row' : 'row-reverse',
                              alignItems: 'center',
                              gap: '0.45rem',
                              width: '100%',
                              boxSizing: 'border-box'
                            }}
                          >
                            {/* Subtopics Stack (Level 2 & Level 3) with Attached Short Branching Arrows */}
                            {showLevel2 && subtopics.length > 0 && (
                              <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.65rem',
                                flex: 1,
                                minWidth: '190px',
                                maxWidth: '270px',
                                alignItems: isLeft ? 'flex-end' : 'flex-start'
                              }}>
                                {subtopics.map((st, sIdx) => {
                                  const title = typeof st === 'string' ? st : st.title;
                                  const detail = typeof st === 'object' ? st.detail : '';
                                  const leafPoints = typeof st === 'object' ? (st.leafPoints || []) : [];
                                  const arrowInfo = getShortBranchArrow(sIdx, subtopics.length, isLeft);

                                  return (
                                    <div
                                      key={sIdx}
                                      style={{
                                        display: 'flex',
                                        flexDirection: isLeft ? 'row' : 'row-reverse',
                                        alignItems: 'center',
                                        gap: '0.35rem',
                                        width: '100%'
                                      }}
                                    >
                                      {/* Subtopic Capsule */}
                                      <div
                                        onClick={() => setSelectedBranchIdx(globalIdx)}
                                        className="pastel-subtopic-capsule"
                                        style={{
                                          background: theme.subBg,
                                          border: `1.5px solid ${theme.subBorder}`,
                                          color: theme.subText,
                                          borderRadius: theme.subRadius || '16px',
                                          textAlign: isLeft ? 'right' : 'left',
                                          flex: 1,
                                          boxSizing: 'border-box',
                                          padding: '0.65rem 0.85rem'
                                        }}
                                      >
                                        <div style={{ fontSize: '0.78rem', fontWeight: 800 }}>
                                          [L2] {title}
                                        </div>
                                        {detail && (
                                          <div style={{ fontSize: '0.72rem', opacity: 0.92, lineHeight: 1.4, marginTop: '0.15rem' }}>
                                            {detail}
                                          </div>
                                        )}
                                        {showLevel3 && leafPoints.length > 0 && (
                                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginTop: '0.35rem', justifyContent: isLeft ? 'flex-end' : 'flex-start' }}>
                                            {leafPoints.map((lp, lpIdx) => (
                                              <span 
                                                key={lpIdx} 
                                                style={{ 
                                                  fontSize: '0.66rem', 
                                                  fontWeight: 700, 
                                                  background: 'rgba(255, 255, 255, 0.85)', 
                                                  padding: '0.12rem 0.45rem', 
                                                  borderRadius: '9999px',
                                                  border: `1px solid ${theme.subBorder}`,
                                                  color: theme.subText
                                                }}
                                              >
                                                • {lp}
                                              </span>
                                            ))}
                                          </div>
                                        )}
                                      </div>

                                      {/* Dedicated Short Curved Branching Arrow connecting Category Card to this Subtopic */}
                                      <div style={{ flexShrink: 0, color: theme.badgeBg, display: 'flex', alignItems: 'center' }}>
                                        <svg width="34" height="28" viewBox="0 0 34 28" style={{ overflow: 'visible' }}>
                                          <path 
                                            d={arrowInfo.path} 
                                            fill="none" 
                                            stroke="currentColor" 
                                            strokeWidth="2.6" 
                                            strokeLinecap="round" 
                                          />
                                          <polygon points={arrowInfo.points} fill="currentColor" />
                                        </svg>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {/* Category Pillar Card (Level 1) */}
                            <div
                              onClick={() => setSelectedBranchIdx(isSelected ? null : globalIdx)}
                              className={`pastel-category-card ${isSelected ? 'selected' : ''}`}
                              style={{
                                background: theme.cardBg,
                                border: `2px solid ${theme.cardBorder}`,
                                color: theme.text,
                                borderRadius: theme.borderRadius || '20px',
                                width: '210px',
                                flexShrink: 0,
                                boxShadow: isSelected ? `0 0 0 3px ${theme.badgeBg}` : '0 4px 18px rgba(0, 0, 0, 0.05)'
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                                <span style={{ fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.06em', background: theme.badgeBg, color: '#ffffff', padding: '0.12rem 0.5rem', borderRadius: '9999px' }}>
                                  [L1] PILLAR {globalIdx + 1}
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => toggleMastered(branchId, e)}
                                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                                >
                                  {isMastered ? <CheckCircle2 size={16} color="#16a34a" /> : <span style={{ opacity: 0.5, fontSize: '0.78rem' }}>○</span>}
                                </button>
                              </div>

                              <h4 style={{ fontSize: '0.96rem', fontWeight: 900, margin: '0 0 0.35rem 0', color: theme.text, lineHeight: 1.3 }}>
                                {branch.icon || '🌸'} {branch.title}
                              </h4>

                              {branch.summary && (
                                <p style={{ fontSize: '0.74rem', margin: 0, opacity: 0.9, lineHeight: 1.45 }}>
                                  {branch.summary}
                                </p>
                              )}
                            </div>

                            {/* Long Connector Arrow physically bridging Level 0 Center Hub to Level 1 Category Card */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, width: '60px', color: theme.badgeBg }}>
                              <svg width="60" height="28" viewBox="0 0 60 28" style={{ overflow: 'visible', width: '60px', height: '28px' }}>
                                <path 
                                  d={isLeft ? "M 58 14 C 38 14, 22 14, 8 14" : "M 2 14 C 22 14, 38 14, 52 14"} 
                                  fill="none" 
                                  stroke="currentColor" 
                                  strokeWidth="3.2" 
                                  strokeLinecap="round" 
                                />
                                <polygon points={isLeft ? "2 14, 11 8, 11 20" : "58 14, 49 8, 49 20"} fill="currentColor" />
                                <circle cx={isLeft ? 57 : 3} cy="14" r="3" fill="currentColor" />
                              </svg>
                            </div>
                          </div>
                        );
                      };

                      return (
                        <div 
                          className="mindmap-canvas-wrapper mindmap-pastel-theme"
                          style={{
                            padding: inModal ? '2.5rem' : '1.75rem',
                            transform: inModal ? 'none' : `scale(${mindMapZoom})`,
                            transformOrigin: 'top center',
                            transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                            width: '100%',
                            boxSizing: 'border-box'
                          }}
                        >
                          <div style={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            gap: 'clamp(0.75rem, 1.8vw, 2.2rem)',
                            maxWidth: inModal ? '1280px' : '100%',
                            margin: '0 auto',
                            flexWrap: 'wrap'
                          }}>
                            {/* Left Branches Column */}
                            <div style={{
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '1.75rem',
                              flex: 1,
                              minWidth: '310px',
                              maxWidth: '460px',
                              alignItems: 'flex-end'
                            }}>
                              {leftGroup.map(item => renderPastelBranchCard(item, true))}
                            </div>

                            {/* Level 0 Center Hub Capsule */}
                            <div style={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              flexShrink: 0,
                              width: '270px',
                              zIndex: 10
                            }}>
                              <div className="pastel-hub-capsule">
                                <span style={{ fontSize: '0.72rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.14em', opacity: 0.9 }}>
                                  LEVEL 0 • CORE THEME
                                </span>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: 900, margin: '0.4rem 0', letterSpacing: '-0.02em', lineHeight: 1.25 }}>
                                  {mindMapData.centralTopic || 'Core Subject'}
                                </h3>
                                {mindMapData.summary && (
                                  <p style={{ fontSize: '0.76rem', margin: 0, opacity: 0.95, lineHeight: 1.5 }}>
                                    {mindMapData.summary}
                                  </p>
                                )}
                              </div>
                              <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', marginTop: '0.75rem' }}>
                                🌸 Pastel Studio Radial • Click nodes to explore
                              </span>
                            </div>

                            {/* Right Branches Column */}
                            <div style={{
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '1.75rem',
                              flex: 1,
                              minWidth: '310px',
                              maxWidth: '460px',
                              alignItems: 'flex-start'
                            }}>
                              {rightGroup.map(item => renderPastelBranchCard(item, false))}
                            </div>
                          </div>

                          {/* User Interactive Pinned Sticky Notes Row */}
                          {userDoodleNotes.length > 0 && (
                            <div style={{ marginTop: '2.5rem', paddingTop: '1.25rem', borderTop: '2px dashed rgba(0,0,0,0.15)' }}>
                              <div style={{ fontSize: '0.76rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#8b5cf6', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                <span>📌</span>
                                <span>My Personal Study Notes & Brainstorms</span>
                              </div>
                              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                {userDoodleNotes.map(n => (
                                  <div 
                                    key={n.id} 
                                    className="doodle-user-note"
                                    style={{
                                      background: n.color,
                                      transform: `rotate(${n.tilt})`,
                                      maxWidth: '240px',
                                      color: '#1f2937'
                                    }}
                                  >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.25rem' }}>
                                      <span style={{ fontSize: '0.7rem', fontWeight: 800, opacity: 0.7 }}>NOTE</span>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setUserDoodleNotes(prev => prev.filter(item => item.id !== n.id));
                                        }}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.6, padding: 0 }}
                                        title="Remove Note"
                                      >
                                        ✕
                                      </button>
                                    </div>
                                    <div style={{ fontSize: '0.82rem', fontWeight: 600, lineHeight: 1.45 }}>
                                      {n.text}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    };

                    // 3. RENDER NOTEBOOK DOODLE LAYOUT (Matching User Reference Image 2)
                    const renderNotebookDoodleLayout = (inModal = false) => (
                      <div 
                        className="mindmap-canvas-wrapper mindmap-doodle-theme"
                        style={{
                          padding: inModal ? '2.5rem' : '1.75rem',
                          transform: inModal ? 'none' : `scale(${mindMapZoom})`,
                          transformOrigin: 'top center',
                          transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                          width: '100%',
                          boxSizing: 'border-box'
                        }}
                      >
                        {/* 4-Quadrant 2x2 Radial Grid around Level 0 Center Hub */}
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'minmax(300px, 1fr) minmax(220px, 260px) minmax(300px, 1fr)',
                          gridTemplateRows: 'auto auto',
                          gap: '2.5rem 1.5rem',
                          alignItems: 'center',
                          maxWidth: inModal ? '1280px' : '100%',
                          margin: '0 auto'
                        }}>
                          {/* TOP-LEFT QUADRANT (Idea 1 / Foundations) */}
                          <div style={{ gridColumn: '1', gridRow: '1', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                            {renderDoodleQuadrantBranch(qTL, 0, 'top-left')}
                          </div>

                          {/* CENTER HUB: LEVEL 0 ROOT TOPIC (Spanning both rows in Column 2) */}
                          <div style={{
                            gridColumn: '2',
                            gridRow: '1 / span 2',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            position: 'relative',
                            textAlign: 'center',
                            zIndex: 10
                          }}>
                            {/* TOP-LEFT ARROW: emerges from Center Hub pointing diagonally UP-LEFT towards Idea 1 */}
                            <div style={{ position: 'absolute', top: '-36px', left: '-82px', zIndex: 15, pointerEvents: 'none' }}>
                              {renderRadialGuideArrow('top-left')}
                            </div>

                            {/* TOP-RIGHT ARROW: emerges from Center Hub pointing diagonally UP-RIGHT towards Idea 3 */}
                            <div style={{ position: 'absolute', top: '-36px', right: '-82px', zIndex: 15, pointerEvents: 'none' }}>
                              {renderRadialGuideArrow('top-right')}
                            </div>

                            {/* BOTTOM-LEFT ARROW: emerges from Center Hub pointing diagonally DOWN-LEFT towards Idea 2 */}
                            <div style={{ position: 'absolute', bottom: '-36px', left: '-82px', zIndex: 15, pointerEvents: 'none' }}>
                              {renderRadialGuideArrow('bottom-left')}
                            </div>

                            {/* BOTTOM-RIGHT ARROW: emerges from Center Hub pointing diagonally DOWN-RIGHT towards Idea 4 */}
                            <div style={{ position: 'absolute', bottom: '-36px', right: '-82px', zIndex: 15, pointerEvents: 'none' }}>
                              {renderRadialGuideArrow('bottom-right')}
                            </div>

                            <div 
                              className="mindmap-hub-node doodle-hub"
                              style={{
                                background: '#f472b6',
                                border: '3.5px solid #1f2937',
                                boxShadow: '6px 7px 0px #1f2937',
                                borderRadius: '50% 50% 48% 52% / 60% 58% 62% 60%',
                                padding: '1.35rem 1.6rem',
                                maxWidth: '250px',
                                width: '100%',
                                boxSizing: 'border-box'
                              }}
                            >
                              <span style={{ fontSize: '0.74rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.12em', opacity: 0.95, color: '#ffffff' }}>
                                MIND MAP
                              </span>
                              <h3 style={{ fontSize: '1.25rem', fontWeight: 900, margin: '0.35rem 0', letterSpacing: '-0.02em', color: '#ffffff', lineHeight: 1.25 }}>
                                {mindMapData.centralTopic || 'Core Subject'}
                              </h3>
                              {mindMapData.summary && (
                                <p style={{ fontSize: '0.76rem', margin: 0, opacity: 0.95, lineHeight: 1.45, color: '#fdf2f8' }}>
                                  {mindMapData.summary}
                                </p>
                              )}
                            </div>
                            <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#6b7280', marginTop: '0.65rem' }}>
                              ⚡ 4 Radial Foundations • Click cards to drill down
                            </span>
                          </div>

                          {/* TOP-RIGHT QUADRANT (Idea 3 / Architecture) */}
                          <div style={{ gridColumn: '3', gridRow: '1', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                            {renderDoodleQuadrantBranch(qTR, 2, 'top-right')}
                          </div>

                          {/* BOTTOM-LEFT QUADRANT (Idea 2 / Methodologies) */}
                          <div style={{ gridColumn: '1', gridRow: '2', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                            {renderDoodleQuadrantBranch(qBL, 1, 'bottom-left')}
                          </div>

                          {/* BOTTOM-RIGHT QUADRANT (Idea 4 / Strategic Results) */}
                          <div style={{ gridColumn: '3', gridRow: '2', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                            {renderDoodleQuadrantBranch(qBR, 3, 'bottom-right')}
                          </div>
                        </div>

                        {/* User Interactive Pinned Sticky Notes Row */}
                        {userDoodleNotes.length > 0 && (
                          <div style={{ marginTop: '2.5rem', paddingTop: '1.25rem', borderTop: '2px dashed rgba(0,0,0,0.15)' }}>
                            <div style={{ fontSize: '0.76rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#ea580c', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                              <span>📌</span>
                              <span>My Personal Study Notes & Brainstorms</span>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                              {userDoodleNotes.map(n => (
                                <div 
                                  key={n.id} 
                                  className="doodle-user-note"
                                  style={{
                                    background: n.color,
                                    transform: `rotate(${n.tilt})`,
                                    maxWidth: '240px',
                                    color: '#1f2937'
                                  }}
                                >
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.25rem' }}>
                                    <span style={{ fontSize: '0.7rem', fontWeight: 800, opacity: 0.7 }}>NOTE</span>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setUserDoodleNotes(prev => prev.filter(item => item.id !== n.id));
                                      }}
                                      style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.6, padding: 0 }}
                                      title="Remove Note"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                  <div style={{ fontSize: '0.82rem', fontWeight: 600, lineHeight: 1.45 }}>
                                    {n.text}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );

                    // 4. RENDER NOTEBOOKLM OFFICIAL RADIAL LAYOUT (Matching Google NotebookLM Design)
                    const renderNotebookLMRadialLayout = (inModal = false) => {
                      const leftGroup = [];
                      const rightGroup = [];

                      branches.forEach((b, idx) => {
                        if (b.quadrant === 'top-left' || b.quadrant === 'bottom-left' || b.side === 'left') {
                          leftGroup.push({ branch: b, globalIdx: idx });
                        } else if (b.quadrant === 'top-right' || b.quadrant === 'bottom-right' || b.side === 'right') {
                          rightGroup.push({ branch: b, globalIdx: idx });
                        } else if (idx % 2 === 0) {
                          leftGroup.push({ branch: b, globalIdx: idx });
                        } else {
                          rightGroup.push({ branch: b, globalIdx: idx });
                        }
                      });

                      if (leftGroup.length === 0 && rightGroup.length > 1) {
                        leftGroup.push(...rightGroup.splice(0, Math.ceil(rightGroup.length / 2)));
                      } else if (rightGroup.length === 0 && leftGroup.length > 1) {
                        rightGroup.push(...leftGroup.splice(Math.ceil(leftGroup.length / 2)));
                      }

                      // Helper for smooth cubic bezier curves from Center Hub to Level 1 Pillar
                      const getNLMConnectorCurve = (idx, total, isLeft) => {
                        if (total <= 1) {
                          return {
                            path: isLeft ? "M 66 16 L 4 16" : "M 2 16 L 64 16",
                            dot: isLeft ? { cx: 4, cy: 16 } : { cx: 64, cy: 16 }
                          };
                        }
                        if (total === 2) {
                          if (idx === 0) {
                            return {
                              path: isLeft ? "M 66 26 C 44 26, 26 8, 4 8" : "M 2 26 C 24 26, 42 8, 64 8",
                              dot: isLeft ? { cx: 4, cy: 8 } : { cx: 64, cy: 8 }
                            };
                          }
                          return {
                            path: isLeft ? "M 66 6 C 44 6, 26 24, 4 24" : "M 2 6 C 24 6, 42 24, 64 24",
                            dot: isLeft ? { cx: 4, cy: 24 } : { cx: 64, cy: 24 }
                          };
                        }
                        // total >= 3
                        if (idx === 0) {
                          return {
                            path: isLeft ? "M 66 28 C 45 28, 25 6, 4 6" : "M 2 28 C 23 28, 43 6, 64 6",
                            dot: isLeft ? { cx: 4, cy: 6 } : { cx: 64, cy: 6 }
                          };
                        }
                        if (idx === total - 1) {
                          return {
                            path: isLeft ? "M 66 4 C 45 4, 25 26, 4 26" : "M 2 4 C 23 4, 43 26, 64 26",
                            dot: isLeft ? { cx: 4, cy: 26 } : { cx: 64, cy: 26 }
                          };
                        }
                        return {
                          path: isLeft ? "M 66 16 L 4 16" : "M 2 16 L 64 16",
                          dot: isLeft ? { cx: 4, cy: 16 } : { cx: 64, cy: 16 }
                        };
                      };

                      // Helper for secondary smooth cubic bezier curves from Level 1 Pillar to Level 2 Subtopics
                      const getNLMSubtopicCurve = (sIdx, total, isLeft) => {
                        if (total <= 1) {
                          return {
                            path: isLeft ? "M 36 14 L 4 14" : "M 2 14 L 34 14",
                            dot: isLeft ? { cx: 4, cy: 14 } : { cx: 34, cy: 14 }
                          };
                        }
                        if (total === 2) {
                          if (sIdx === 0) {
                            return {
                              path: isLeft ? "M 36 22 C 24 22, 16 8, 4 8" : "M 2 22 C 14 22, 22 8, 34 8",
                              dot: isLeft ? { cx: 4, cy: 8 } : { cx: 34, cy: 8 }
                            };
                          }
                          return {
                            path: isLeft ? "M 36 6 C 24 6, 16 20, 4 20" : "M 2 6 C 14 6, 22 20, 34 20",
                            dot: isLeft ? { cx: 4, cy: 20 } : { cx: 34, cy: 20 }
                          };
                        }
                        // total >= 3
                        if (sIdx === 0) {
                          return {
                            path: isLeft ? "M 36 24 C 24 24, 15 6, 4 6" : "M 2 24 C 14 24, 23 6, 34 6",
                            dot: isLeft ? { cx: 4, cy: 6 } : { cx: 34, cy: 6 }
                          };
                        }
                        if (sIdx === total - 1) {
                          return {
                            path: isLeft ? "M 36 4 C 24 4, 15 22, 4 22" : "M 2 4 C 14 4, 23 22, 34 22",
                            dot: isLeft ? { cx: 4, cy: 22 } : { cx: 34, cy: 22 }
                          };
                        }
                        return {
                          path: isLeft ? "M 36 14 L 4 14" : "M 2 14 L 34 14",
                          dot: isLeft ? { cx: 4, cy: 14 } : { cx: 34, cy: 14 }
                        };
                      };

                      const renderNLMBranchCard = (item, isLeft, groupIdx, totalInGroup) => {
                        const { branch, globalIdx } = item;
                        const branchId = `b_${globalIdx}`;
                        const isMastered = exploredNodes.has(branchId);
                        const isSelected = selectedBranchIdx === globalIdx;
                        const isCollapsed = collapsedPillars.has(globalIdx);
                        const subtopics = branch.subTopics || [];
                        const showLevel2 = hierarchyDepth !== 'pillars' && !isCollapsed;
                        const showLevel3 = hierarchyDepth === 'all' && !isCollapsed;
                        const connector = getNLMConnectorCurve(groupIdx, totalInGroup, isLeft);

                        return (
                          <div 
                            key={globalIdx}
                            style={{
                              display: 'flex',
                              flexDirection: isLeft ? 'row' : 'row-reverse',
                              alignItems: 'center',
                              gap: '0.45rem',
                              width: '100%',
                              boxSizing: 'border-box'
                            }}
                          >
                            {/* Level 2 Subtopics Column (Expanded / Collapsible) */}
                            {showLevel2 && subtopics.length > 0 && (
                              <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.55rem',
                                flex: 1,
                                minWidth: '200px',
                                maxWidth: '280px',
                                alignItems: isLeft ? 'flex-end' : 'flex-start'
                              }}>
                                {subtopics.map((st, sIdx) => {
                                  const title = typeof st === 'string' ? st : st.title;
                                  const detail = typeof st === 'object' ? st.detail : '';
                                  const leafPoints = typeof st === 'object' ? (st.leafPoints || []) : [];
                                  const subCurve = getNLMSubtopicCurve(sIdx, subtopics.length, isLeft);

                                  return (
                                    <div
                                      key={sIdx}
                                      style={{
                                        display: 'flex',
                                        flexDirection: isLeft ? 'row' : 'row-reverse',
                                        alignItems: 'center',
                                        gap: '0.35rem',
                                        width: '100%'
                                      }}
                                    >
                                      {/* Subtopic Pill Capsule */}
                                      <div
                                        onClick={() => setSelectedBranchIdx(globalIdx)}
                                        className="nlm-subtopic-pill"
                                        style={{
                                          textAlign: isLeft ? 'right' : 'left',
                                          flex: 1,
                                          boxSizing: 'border-box'
                                        }}
                                      >
                                        <div style={{ fontSize: '0.78rem', fontWeight: 800 }}>
                                          [L2] {title}
                                        </div>
                                        {detail && (
                                          <div style={{ fontSize: '0.72rem', opacity: 0.9, lineHeight: 1.4, marginTop: '0.15rem' }}>
                                            {detail}
                                          </div>
                                        )}
                                        {showLevel3 && leafPoints.length > 0 && (
                                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginTop: '0.35rem', justifyContent: isLeft ? 'flex-end' : 'flex-start' }}>
                                            {leafPoints.map((lp, lpIdx) => (
                                              <span 
                                                key={lpIdx} 
                                                style={{ 
                                                  fontSize: '0.66rem', 
                                                  fontWeight: 700, 
                                                  background: 'rgba(59, 130, 246, 0.1)', 
                                                  color: '#2563eb',
                                                  padding: '0.12rem 0.45rem', 
                                                  borderRadius: '9999px',
                                                  border: '1px solid rgba(59, 130, 246, 0.25)'
                                                }}
                                              >
                                                • {lp}
                                              </span>
                                            ))}
                                          </div>
                                        )}
                                      </div>

                                      {/* Secondary Bezier Curve to Subtopic */}
                                      <div style={{ flexShrink: 0, color: '#3b82f6', display: 'flex', alignItems: 'center' }}>
                                        <svg width="36" height="28" viewBox="0 0 36 28" style={{ overflow: 'visible' }}>
                                          <path 
                                            d={subCurve.path} 
                                            fill="none" 
                                            stroke="#3b82f6" 
                                            strokeWidth="2.2" 
                                            strokeLinecap="round" 
                                          />
                                          <circle cx={subCurve.dot.cx} cy={subCurve.dot.cy} r="3" fill="#2563eb" />
                                        </svg>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {/* Level 1 Pillar Capsule */}
                            <div
                              onClick={() => setSelectedBranchIdx(isSelected ? null : globalIdx)}
                              className={`nlm-pillar-capsule ${isSelected ? 'selected' : ''}`}
                              style={{
                                width: '230px',
                                flexShrink: 0
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                                <span style={{ fontSize: '0.68rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.06em', background: '#2563eb', color: '#ffffff', padding: '0.12rem 0.5rem', borderRadius: '9999px' }}>
                                  [L1] PILLAR {globalIdx + 1}
                                </span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                  {subtopics.length > 0 && (
                                    <button
                                      type="button"
                                      onClick={(e) => togglePillarCollapse(globalIdx, e)}
                                      style={{
                                        background: 'rgba(59, 130, 246, 0.15)',
                                        border: '1px solid rgba(59, 130, 246, 0.3)',
                                        color: '#2563eb',
                                        borderRadius: '50%',
                                        width: '20px',
                                        height: '20px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                        fontSize: '0.74rem',
                                        fontWeight: 900,
                                        padding: 0
                                      }}
                                      title={isCollapsed ? "Expand Subtopics" : "Collapse Subtopics"}
                                    >
                                      {isCollapsed ? '+' : '−'}
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={(e) => toggleMastered(branchId, e)}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                                  >
                                    {isMastered ? <CheckCircle2 size={16} color="#16a34a" /> : <span style={{ opacity: 0.5, fontSize: '0.78rem' }}>○</span>}
                                  </button>
                                </div>
                              </div>

                              <h4 style={{ fontSize: '0.94rem', fontWeight: 900, margin: '0 0 0.3rem 0', lineHeight: 1.3 }}>
                                {branch.icon || '🔷'} {branch.title}
                              </h4>

                              {branch.summary && (
                                <p style={{ fontSize: '0.74rem', margin: 0, opacity: 0.9, lineHeight: 1.45 }}>
                                  {branch.summary}
                                </p>
                              )}
                            </div>

                            {/* Primary Smooth Cubic Bezier Connector Line to Center Hub */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, width: '68px', color: '#3b82f6' }}>
                              <svg width="68" height="32" viewBox="0 0 68 32" style={{ overflow: 'visible', width: '68px', height: '32px' }}>
                                <path 
                                  d={connector.path} 
                                  fill="none" 
                                  stroke="#3b82f6" 
                                  strokeWidth="2.8" 
                                  strokeLinecap="round" 
                                />
                                <circle cx={connector.dot.cx} cy={connector.dot.cy} r="3.5" fill="#2563eb" />
                              </svg>
                            </div>
                          </div>
                        );
                      };

                      return (
                        <div 
                          className="mindmap-canvas-wrapper mindmap-notebooklm-theme"
                          style={{
                            padding: inModal ? '2.5rem' : '1.75rem',
                            transform: inModal ? 'none' : `scale(${mindMapZoom})`,
                            transformOrigin: 'top center',
                            transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                            width: '100%',
                            boxSizing: 'border-box'
                          }}
                        >
                          <div style={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            gap: 'clamp(0.5rem, 1.2vw, 1.5rem)',
                            maxWidth: inModal ? '1320px' : '100%',
                            margin: '0 auto',
                            flexWrap: 'wrap'
                          }}>
                            {/* Left Pillars Column */}
                            <div style={{
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '1.5rem',
                              flex: 1,
                              minWidth: '340px',
                              maxWidth: '520px',
                              alignItems: 'flex-end'
                            }}>
                              {leftGroup.map((item, idx) => renderNLMBranchCard(item, true, idx, leftGroup.length))}
                            </div>

                            {/* Level 0 Center Circular Hub with Glowing Aura & Tree Icon */}
                            <div style={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              flexShrink: 0,
                              zIndex: 10
                            }}>
                              <div className="nlm-hub-circle">
                                {/* Google NotebookLM Branching Tree Emblem */}
                                <div style={{ marginBottom: '0.35rem' }}>
                                  <svg width="36" height="36" viewBox="0 0 44 44" fill="none">
                                    <rect x="4" y="17" width="10" height="10" rx="2" fill="#3b82f6" />
                                    <line x1="14" y1="22" x2="22" y2="22" stroke="#3b82f6" strokeWidth="3" />
                                    <line x1="22" y1="11" x2="22" y2="33" stroke="#3b82f6" strokeWidth="3" />
                                    <line x1="22" y1="11" x2="30" y2="11" stroke="#3b82f6" strokeWidth="3" />
                                    <line x1="22" y1="33" x2="30" y2="33" stroke="#3b82f6" strokeWidth="3" />
                                    <rect x="30" y="6" width="10" height="10" rx="2" fill="#3b82f6" />
                                    <rect x="30" y="28" width="10" height="10" rx="2" fill="#3b82f6" />
                                  </svg>
                                </div>
                                <span style={{ fontSize: '0.64rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#2563eb' }}>
                                  LEVEL 0 • CORE
                                </span>
                                <h3 style={{ fontSize: '1.05rem', fontWeight: 900, margin: '0.25rem 0', letterSpacing: '-0.02em', lineHeight: 1.25 }}>
                                  {mindMapData.centralTopic || 'Core Subject'}
                                </h3>
                                {mindMapData.summary && (
                                  <p style={{ fontSize: '0.68rem', margin: 0, opacity: 0.85, lineHeight: 1.35, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                    {mindMapData.summary}
                                  </p>
                                )}
                              </div>
                              <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', marginTop: '0.75rem' }}>
                                ✨ NotebookLM Radial • Click nodes to explore
                              </span>
                            </div>

                            {/* Right Pillars Column */}
                            <div style={{
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '1.5rem',
                              flex: 1,
                              minWidth: '340px',
                              maxWidth: '520px',
                              alignItems: 'flex-start'
                            }}>
                              {rightGroup.map((item, idx) => renderNLMBranchCard(item, false, idx, rightGroup.length))}
                            </div>
                          </div>
                        </div>
                      );
                    };

                    const renderMindMapContent = (inModal = false) => {
                      if (mindMapViewMode === 'notebooklm') {
                        return renderNotebookLMRadialLayout(inModal);
                      }
                      if (mindMapViewMode === 'pastel') {
                        return renderPastelStudioLayout(inModal);
                      }
                      return renderNotebookDoodleLayout(inModal);
                    };

                    return (
                      <>
                        {renderMindMapContent(false)}

                        {/* Interactive Detail Inspector Dock (Displays when any node is clicked) */}
                        {selectedBranchIdx !== null && branches[selectedBranchIdx] && (() => {
                          const sel = branches[selectedBranchIdx];
                          const branchId = `b_${selectedBranchIdx}`;
                          const isMastered = exploredNodes.has(branchId);

                          return (
                            <div className="mindmap-inspector-dock">
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                                  <span style={{ fontSize: '1.35rem' }}>{sel.icon || '💡'}</span>
                                  <div>
                                    <div style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', color: '#ea580c', letterSpacing: '0.06em' }}>
                                      HIERARCHY INSPECTOR: [L0 {mindMapData.centralTopic || 'Root'}] ➔ [L1 Pillar {selectedBranchIdx + 1}]
                                    </div>
                                    <h3 style={{ fontSize: '1.15rem', fontWeight: 900, color: 'var(--text-primary)', margin: '0.1rem 0' }}>
                                      {sel.title}
                                    </h3>
                                  </div>
                                </div>
                                <button
                                  onClick={() => setSelectedBranchIdx(null)}
                                  className="btn-ghost"
                                  style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                                >
                                  <X size={15} /> Close Inspector
                                </button>
                              </div>

                              <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1rem' }}>
                                {sel.summary || 'Core concept extracted and synthesized from your knowledge sources.'}
                              </p>

                              {/* Concrete Subtopics Breakdown */}
                              {sel.subTopics && sel.subTopics.length > 0 && (
                                <div style={{ marginBottom: '1.25rem' }}>
                                  <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                                    Level 2 Subtopics & Level 3 Leaf Evidence:
                                  </div>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                                    {sel.subTopics.map((st, stIdx) => {
                                      const title = typeof st === 'string' ? st : st.title;
                                      const detail = typeof st === 'object' ? st.detail : null;
                                      const leafPoints = typeof st === 'object' ? st.leafPoints : null;

                                      return (
                                        <div key={stIdx} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '6px', padding: '0.65rem 0.95rem' }}>
                                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.84rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                                            <span style={{ fontSize: '0.7rem', background: 'rgba(234, 88, 12, 0.15)', color: '#ea580c', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                                              L2 Subtopic {stIdx + 1}
                                            </span>
                                            <span>{title}</span>
                                          </div>
                                          {detail && (
                                            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.25rem', lineHeight: 1.5 }}>
                                              {detail}
                                            </div>
                                          )}
                                          {leafPoints && leafPoints.length > 0 && (
                                            <div style={{ marginTop: '0.45rem', paddingLeft: '0.5rem', borderLeft: '2px solid rgba(234, 88, 12, 0.4)' }}>
                                              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#ea580c', marginBottom: '0.2rem' }}>
                                                Level 3 Supporting Leaf Points:
                                              </div>
                                              {leafPoints.map((lp, lpIdx) => (
                                                <div key={lpIdx} style={{ fontSize: '0.74rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
                                                  • {lp}
                                                </div>
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}

                              {/* Interactive Actions */}
                              <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                <button
                                  type="button"
                                  onClick={(e) => toggleMastered(branchId, e)}
                                  className="btn-primary"
                                  style={{
                                    fontSize: '0.78rem',
                                    padding: '0.4rem 0.9rem',
                                    background: isMastered ? '#16a34a' : '#ea580c',
                                    borderColor: isMastered ? '#16a34a' : '#ea580c',
                                    color: '#ffffff',
                                    fontWeight: 700,
                                    borderRadius: '6px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.35rem'
                                  }}
                                >
                                  <Check size={14} />
                                  <span>{isMastered ? 'Concept Mastered ✓' : 'Mark as Explored'}</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleCopy(`${sel.title}\n${sel.summary || ''}`)}
                                  className="btn-ghost"
                                  style={{ fontSize: '0.78rem', padding: '0.4rem 0.85rem', gap: '0.35rem' }}
                                >
                                  <Copy size={13} /> Copy Insight
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setUserDoodleNotes(prev => [
                                      ...prev,
                                      { id: Date.now(), text: `Review: ${sel.title}`, color: '#fef08a', tilt: '1.5deg' }
                                    ]);
                                  }}
                                  className="btn-ghost"
                                  style={{ fontSize: '0.78rem', padding: '0.4rem 0.85rem', gap: '0.35rem' }}
                                >
                                  📌 Pin to Notebook
                                </button>
                              </div>
                            </div>
                          );
                        })()}

                        {/* Fullscreen Overlay Modal when user clicks Fullscreen */}
                        {isMindMapExpanded && (
                          <div style={{
                            position: 'fixed',
                            inset: 0,
                            zIndex: 9999,
                            background: 'rgba(10, 15, 26, 0.94)',
                            backdropFilter: 'blur(16px)',
                            display: 'flex',
                            flexDirection: 'column',
                            padding: '1.25rem'
                          }}>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '0.75rem 1.25rem',
                              background: 'var(--bg-surface-elevated)',
                              borderRadius: 'var(--radius-md)',
                              border: '1px solid var(--border-subtle)',
                              marginBottom: '1rem',
                              color: 'var(--text-primary)'
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                                <Network size={20} style={{ color: 'var(--accent-cyan)' }} />
                                <span style={{ fontWeight: 800, fontSize: '1.05rem' }}>
                                  {mindMapData.centralTopic || 'Mind Map'} • Fullscreen Hierarchical Notebook
                                </span>
                              </div>
                              <button
                                onClick={() => setIsMindMapExpanded(false)}
                                className="btn-ghost"
                                style={{ padding: '0.4rem 0.85rem', gap: '0.4rem', fontSize: '0.84rem' }}
                              >
                                <X size={16} /> Close Fullscreen
                              </button>
                            </div>
                            <div style={{ flex: 1, overflow: 'auto', display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
                              {renderMindMapContent(true)}
                            </div>
                          </div>
                        )}
                      </>
                    );
                  })()
                ) : (
                  <pre style={{
                    background: 'var(--bg-app)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '1.25rem',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.84rem',
                    color: 'var(--text-primary)',
                    whiteSpace: 'pre-wrap',
                    overflowX: 'auto'
                  }}>
                    {mindMapData.mermaid}
                  </pre>
                )}
              </div>
            );
          })()}

          {/* ============================================================== */}
          {/* INFOGRAPHIC (Data-Rich Poster with Shapes & Gauges)            */}
          {/* ============================================================== */}
          {toolId === 'infographic' && (() => {
            const infographicData = getInfographicData(output);
            if (!infographicData) {
              return <StudioMarkdownViewer text={output.content} />;
            }

            return (
              <div className="infographic-poster-wrapper">

                {/* 1. TOP GRAPHIC RIBBON HEADER (Matching User Image 2) */}
                <div className="infographic-ribbon-banner">
                  <h2>{infographicData.title || 'Infographic Report'}</h2>
                  {infographicData.tagline && (
                    <div style={{ fontSize: '0.84rem', fontWeight: 600, marginTop: '0.35rem', opacity: 0.92 }}>
                      {infographicData.tagline}
                    </div>
                  )}
                </div>

                {/* 2. HERO FOCAL STAT CARD (Matching User Image 1 top) */}
                {(() => {
                  const hero = infographicData.heroStat || (infographicData.stats && infographicData.stats[0]);
                  if (!hero) return null;
                  return (
                    <div style={{
                      background: 'radial-gradient(circle at top left, rgba(245, 158, 11, 0.15) 0%, var(--bg-surface) 70%)',
                      border: '1.5px solid rgba(245, 158, 11, 0.4)',
                      borderRadius: 'var(--radius-md)',
                      padding: '1.5rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '1.25rem',
                      boxShadow: '0 8px 24px rgba(245, 158, 11, 0.12)'
                    }}>
                      <div style={{ flex: 1, minWidth: '220px' }}>
                        <div style={{ fontSize: '0.74rem', fontWeight: 800, textTransform: 'uppercase', color: '#f59e0b', letterSpacing: '0.06em', marginBottom: '0.25rem' }}>
                          PRIMARY FOCAL BENCHMARK
                        </div>
                        <div style={{ fontSize: 'clamp(2rem, 5vw, 2.8rem)', fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1.1, letterSpacing: '-0.02em', wordBreak: 'break-word' }}>
                          {hero.value}
                        </div>
                        <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.35rem' }}>
                          {hero.label}
                        </div>
                        {hero.subtext && (
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem', lineHeight: 1.45 }}>
                            {hero.subtext}
                          </div>
                        )}
                      </div>

                      {/* Visual Icon Badge */}
                      <div style={{
                        width: '72px',
                        height: '72px',
                        borderRadius: '20px',
                        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#ffffff',
                        boxShadow: '0 8px 24px rgba(245, 158, 11, 0.4)',
                        flexShrink: 0
                      }}>
                        <BarChart3 size={36} />
                      </div>
                    </div>
                  );
                })()}

                {/* 3. CIRCULAR PERCENTAGE DONUT GAUGES (Matching User Image 1 middle) */}
                <div>
                  <div className="infographic-section-title">
                    <span>Demographics & Key Proportions</span>
                    <PieChart size={16} />
                  </div>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                    gap: '1rem'
                  }}>
                    {(() => {
                      const gauges = (Array.isArray(infographicData.gaugeMetrics) && infographicData.gaugeMetrics.length > 0)
                        ? infographicData.gaugeMetrics
                        : [
                          { label: 'Primary Adoption', percentage: 62, description: 'Core user engagement' },
                          { label: 'Retention Rate', percentage: 88, description: 'Recurring consistency' },
                          { label: 'Multi-Factor Users', percentage: 45, description: 'Cross-functional participation' },
                          { label: 'Target Demographics', percentage: 51, description: 'Balanced target distribution' }
                        ];

                      const GAUGE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899'];

                      return gauges.map((g, idx) => {
                        const pct = Math.min(100, Math.max(0, parseInt(g.percentage, 10) || 50));
                        const color = GAUGE_COLORS[idx % GAUGE_COLORS.length];
                        const radius = 34;
                        const circumference = 2 * Math.PI * radius;
                        const offset = circumference * (1 - pct / 100);

                        return (
                          <div key={idx} className="infographic-gauge-card">
                            <div style={{ position: 'relative', width: '84px', height: '84px', marginBottom: '0.75rem' }}>
                              <svg width="84" height="84" viewBox="0 0 84 84">
                                <circle cx="42" cy="42" r={radius} stroke="rgba(255,255,255,0.08)" strokeWidth="8" fill="none" />
                                <circle
                                  cx="42"
                                  cy="42"
                                  r={radius}
                                  stroke={color}
                                  strokeWidth="8"
                                  fill="none"
                                  strokeDasharray={circumference}
                                  strokeDashoffset={offset}
                                  strokeLinecap="round"
                                  transform="rotate(-90 42 42)"
                                />
                              </svg>
                              <div style={{
                                position: 'absolute',
                                inset: 0,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '1.05rem',
                                fontWeight: 900,
                                color: 'var(--text-primary)'
                              }}>
                                {pct}%
                              </div>
                            </div>
                            <div style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.2rem', wordBreak: 'break-word' }}>
                              {g.label}
                            </div>
                            {g.description && (
                              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.35, wordBreak: 'break-word' }}>
                                {g.description}
                              </div>
                            )}
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>

                {/* 4. COMPARISON BAR CHARTS (Matching User Image 1 right & Image 2) */}
                <div>
                  <div className="infographic-section-title">
                    <span>Comparative Breakdown & Scale</span>
                    <TrendingUp size={16} />
                  </div>

                  <div style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '1.25rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem',
                    width: '100%',
                    boxSizing: 'border-box'
                  }}>
                    {(() => {
                      const bars = (Array.isArray(infographicData.comparisonBars) && infographicData.comparisonBars.length > 0)
                        ? infographicData.comparisonBars
                        : [
                          { label: 'Leading Category', value: '88%', percentage: 88, color: '#3b82f6' },
                          { label: 'Secondary Benchmark', value: '64%', percentage: 64, color: '#10b981' },
                          { label: 'Alternative Approach', value: '42%', percentage: 42, color: '#f59e0b' },
                          { label: 'Emerging Pattern', value: '24%', percentage: 24, color: '#ec4899' }
                        ];

                      return bars.map((b, idx) => (
                        <div key={idx} style={{ width: '100%', boxSizing: 'border-box' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.35rem', gap: '0.5rem' }}>
                            <span style={{ color: 'var(--text-primary)', wordBreak: 'break-word' }}>{b.label}</span>
                            <span style={{ color: b.color || '#3b82f6', fontWeight: 800, flexShrink: 0 }}>{b.value || `${b.percentage}%`}</span>
                          </div>
                          <div className="infographic-bar-track">
                            <div
                              className="infographic-bar-fill"
                              style={{
                                width: `${Math.min(100, Math.max(8, b.percentage || 50))}%`,
                                background: b.color || '#3b82f6'
                              }}
                            >
                              {b.value || `${b.percentage}%`}
                            </div>
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                </div>

                {/* 5. STRATEGIC TREND CARDS (Matching User Image 1 bottom) */}
                <div>
                  <div className="infographic-section-title">
                    <span>Industry & Concept Trends</span>
                    <Zap size={16} />
                  </div>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                    gap: '1rem'
                  }}>
                    {(() => {
                      const trends = (Array.isArray(infographicData.trends) && infographicData.trends.length > 0)
                        ? infographicData.trends
                        : [
                          { metric: '+21.0% CAGR', label: 'Expected Growth', detail: 'Consistent upward trajectory recorded in research', icon: 'TrendingUp' },
                          { metric: '62% of Users', label: 'Primary Preference', detail: 'Prefer visual and interactive digests over text', icon: 'Eye' },
                          { metric: '$55.5B Value', label: 'Economic Reach', detail: 'Cumulative market scale identified in sources', icon: 'DollarSign' }
                        ];

                      const ICONS_MAP = {
                        TrendingUp: TrendingUp,
                        Eye: Eye,
                        DollarSign: DollarSign,
                        BarChart3: BarChart3
                      };

                      return trends.map((tr, idx) => {
                        const IconComp = ICONS_MAP[tr.icon] || TrendingUp;
                        return (
                          <div
                            key={idx}
                            style={{
                              background: 'var(--bg-surface)',
                              border: '1px solid var(--border-subtle)',
                              borderRadius: 'var(--radius-md)',
                              padding: '1.15rem',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '0.65rem',
                              boxSizing: 'border-box'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)' }}>{tr.label}</span>
                              <div style={{ color: 'var(--accent-primary)' }}>
                                <IconComp size={18} />
                              </div>
                            </div>
                            <div style={{ fontSize: 'clamp(1.2rem, 3vw, 1.5rem)', fontWeight: 900, color: '#f59e0b', letterSpacing: '-0.02em', wordBreak: 'break-word' }}>
                              {tr.metric}
                            </div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.45, wordBreak: 'break-word' }}>
                              {tr.detail}
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>

                {/* 6. CORE PILLARS & TAKEAWAYS */}
                {infographicData.pillars && infographicData.pillars.length > 0 && (
                  <div>
                    <div className="infographic-section-title">
                      <span>Foundational Pillars & Key Insights</span>
                      <Target size={16} />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {infographicData.pillars.map((pl, pIdx) => (
                        <div key={pIdx} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderLeft: '3.5px solid #f59e0b', borderRadius: 'var(--radius-sm)', padding: '0.95rem 1.15rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <h4 style={{ fontSize: '0.94rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{pl.title}</h4>
                            {pl.badge && (
                              <span style={{ fontSize: '0.68rem', background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', padding: '0.15rem 0.5rem', borderRadius: '4px', fontWeight: 700 }}>
                                {pl.badge}
                              </span>
                            )}
                          </div>
                          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.55, wordBreak: 'break-word' }}>
                            {pl.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Takeaways List */}
                {infographicData.takeaways && infographicData.takeaways.length > 0 && (
                  <div style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '1.25rem'
                  }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <CheckCircle2 size={16} color="#10b981" />
                      <span>Executive Key Takeaways</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {infographicData.takeaways.map((item, tIdx) => (
                        <div key={tIdx} style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start', fontSize: '0.86rem', lineHeight: 1.55 }}>
                          <span style={{ color: '#f59e0b', fontWeight: 800, flexShrink: 0 }}>•</span>
                          <span style={{ color: 'var(--text-primary)', wordBreak: 'break-word' }}>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            );
          })()}

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
