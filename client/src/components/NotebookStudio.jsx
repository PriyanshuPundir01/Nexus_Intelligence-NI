import React, { useState, useEffect, useRef } from 'react';
import { 
  Headphones, 
  Radio,
  Video, 
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
  Maximize2, 
  Minimize2, 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  RotateCcw, 
  Shuffle, 
  CheckCircle2, 
  XCircle, 
  Info, 
  TrendingUp, 
  Award, 
  Download, 
  StickyNote, 
  X, 
  Plus, 
  Trash2, 
  Volume2, 
  Eye, 
  Lightbulb, 
  Share2,
  Copy
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

// 8 Official Studio Tools matching NotebookLM
const STUDIO_TOOLS = [
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
    id: 'video-overview',
    label: 'Video Overview',
    icon: Video,
    color: '#10b981',
    description: 'Cinematic video storyboard with camera angles and narration script.'
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
  const [activeTab, setActiveTab] = useState('audio-overview');
  const [loading, setLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [studioOutputs, setStudioOutputs] = useState({
    'audio-overview': null,
    'slide-deck': null,
    'video-overview': null,
    'mind-map': null,
    'reports': null,
    'flashcards': null,
    'quiz': null,
    'infographic': null
  });

  const [copied, setCopied] = useState(false);
  const [newNoteInput, setNewNoteInput] = useState('');
  const [newNoteTitle, setNewNoteTitle] = useState('');

  // Slide Deck State
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [showSpeakerNotes, setShowSpeakerNotes] = useState(false);

  // Flashcards State
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isCardFlipped, setIsCardFlipped] = useState(false);
  const [flashcardDeck, setFlashcardDeck] = useState([]);
  const [flashcardViewMode, setFlashcardViewMode] = useState('single'); // 'single' | 'grid'

  // Quiz State
  const [currentQuizQuestionIndex, setCurrentQuizQuestionIndex] = useState(0);
  const [userQuizAnswers, setUserQuizAnswers] = useState({}); // { [questionIdx]: selectedOptionIdx }
  const [quizScore, setQuizScore] = useState(0);

  // Video Overview State & Player
  const [activeSceneIndex, setActiveSceneIndex] = useState(0);
  const [isPlayingVideo, setIsPlayingVideo] = useState(false);
  const [isVideoPaused, setIsVideoPaused] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const [videoSpeed, setVideoSpeed] = useState(1);
  const videoSpeechRef = useRef(null);
  const videoProgressIntervalRef = useRef(null);

  // Mind Map State
  const [mindMapViewMode, setMindMapViewMode] = useState('visual'); // 'visual' | 'mermaid'

  // Audio Playback State for Audio Overview
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isPausedAudio, setIsPausedAudio] = useState(false);
  const [currentSpeakerTurn, setCurrentSpeakerTurn] = useState(-1);
  const [audioSpeed, setAudioSpeed] = useState(1);
  const speechUtteranceRef = useRef(null);

  const selectedCount = selectedSourceIds.length;
  const activeSourcesText = selectedCount > 0 
    ? `${selectedCount} of ${sources.length} sources selected`
    : `All ${sources.length} sources active`;

  // Parse podcast/audio dialogue into turns
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

  const audioTurns = studioOutputs['audio-overview'] ? getAudioTurns(studioOutputs['audio-overview'].content) : [];

  // Stop audio on unmount or tab switch
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Sync flashcards when generated
  useEffect(() => {
    if (studioOutputs['flashcards']?.parsedData?.cards) {
      setFlashcardDeck(studioOutputs['flashcards'].parsedData.cards);
      setCurrentCardIndex(0);
      setIsCardFlipped(false);
    }
  }, [studioOutputs['flashcards']]);

  // Sync quiz questions when generated
  useEffect(() => {
    if (studioOutputs['quiz']?.parsedData?.questions) {
      setCurrentQuizQuestionIndex(0);
      setUserQuizAnswers({});
      setQuizScore(0);
    }
  }, [studioOutputs['quiz']]);

  // Sync slide deck when generated
  useEffect(() => {
    if (studioOutputs['slide-deck']?.parsedData?.slides) {
      setCurrentSlideIndex(0);
      setShowSpeakerNotes(false);
    }
  }, [studioOutputs['slide-deck']]);

  // Sync video overview when generated
  useEffect(() => {
    if (studioOutputs['video-overview']?.parsedData?.scenes) {
      setActiveSceneIndex(0);
      setIsPlayingVideo(false);
      setIsVideoPaused(false);
      setVideoProgress(0);
    }
  }, [studioOutputs['video-overview']]);

  // Video Overview Audio Narration Playback
  const playSceneNarration = (sceneIdx, scenes) => {
    if (!('speechSynthesis' in window)) {
      alert('Speech synthesis is not supported in this browser.');
      return;
    }

    if (sceneIdx >= scenes.length) {
      setIsPlayingVideo(false);
      setIsVideoPaused(false);
      setActiveSceneIndex(0);
      setVideoProgress(100);
      return;
    }

    setActiveSceneIndex(sceneIdx);
    setVideoProgress(0);

    const scene = scenes[sceneIdx];
    const textToSpeak = scene.narration || scene.sceneTitle || '';
    if (!textToSpeak) {
      setTimeout(() => playSceneNarration(sceneIdx + 1, scenes), 3000);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    videoSpeechRef.current = utterance;
    utterance.rate = videoSpeed;
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const engVoices = voices.filter(v => v.lang.startsWith('en'));
    if (engVoices.length > 0) {
      utterance.voice = engVoices[0];
    }

    let pct = 0;
    clearInterval(videoProgressIntervalRef.current);
    videoProgressIntervalRef.current = setInterval(() => {
      pct += 2;
      if (pct <= 96) {
        setVideoProgress(pct);
      }
    }, 120);

    utterance.onend = () => {
      clearInterval(videoProgressIntervalRef.current);
      setVideoProgress(100);
      setTimeout(() => {
        playSceneNarration(sceneIdx + 1, scenes);
      }, 500);
    };

    utterance.onerror = () => {
      clearInterval(videoProgressIntervalRef.current);
      setIsPlayingVideo(false);
      setIsVideoPaused(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  const handleStartVideo = () => {
    const scenes = studioOutputs['video-overview']?.parsedData?.scenes;
    if (!scenes || scenes.length === 0) return;

    if (isVideoPaused) {
      window.speechSynthesis.resume();
      setIsVideoPaused(false);
      setIsPlayingVideo(true);
    } else {
      window.speechSynthesis.cancel();
      setIsPlayingVideo(true);
      setIsVideoPaused(false);
      playSceneNarration(activeSceneIndex, scenes);
    }
  };

  const handlePauseVideo = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.pause();
      setIsVideoPaused(true);
      setIsPlayingVideo(false);
    }
  };

  const handleStopVideo = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      clearInterval(videoProgressIntervalRef.current);
      setIsPlayingVideo(false);
      setIsVideoPaused(false);
      setVideoProgress(0);
    }
  };

  const handleGenerate = async (type) => {
    if (loading) return;
    setLoading(true);

    if (type === 'audio-overview' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
      setIsPausedAudio(false);
      setCurrentSpeakerTurn(-1);
    }

    try {
      const headers = { 'Content-Type': 'application/json' };
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
          parsedData: data.parsedData,
          timestamp: data.timestamp,
          sourceCount: data.sourceCount
        }
      }));
    } catch (err) {
      alert(`Notebook Studio Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Web Speech API Voice synthesis for Audio Overview
  const playSpeakerTurn = (index, parsedTurns) => {
    if (!('speechSynthesis' in window)) {
      alert('Web Speech API is not supported in this browser.');
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

  const handleCopyContent = (text) => {
    navigator.clipboard.writeText(typeof text === 'string' ? text : JSON.stringify(text, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveToNotesCurrent = (title, content) => {
    const formatted = typeof content === 'string' ? content : JSON.stringify(content, null, 2);
    onAddNote({
      id: `note_${Date.now()}`,
      title: title || 'Notebook Studio Artifact',
      content: formatted,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
    alert('Saved to your Research Notes!');
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

  // Flashcard Helpers
  const handleShuffleDeck = () => {
    if (!flashcardDeck.length) return;
    const shuffled = [...flashcardDeck].sort(() => Math.random() - 0.5);
    setFlashcardDeck(shuffled);
    setCurrentCardIndex(0);
    setIsCardFlipped(false);
  };

  // Quiz Answer Handler
  const handleSelectQuizOption = (questionIdx, optionIdx, correctIdx) => {
    if (userQuizAnswers[questionIdx] !== undefined) return; // already answered
    const isCorrect = optionIdx === correctIdx;
    setUserQuizAnswers(prev => ({ ...prev, [questionIdx]: optionIdx }));
    if (isCorrect) {
      setQuizScore(prev => prev + 1);
    }
  };

  const handleResetQuiz = () => {
    setUserQuizAnswers({});
    setCurrentQuizQuestionIndex(0);
    setQuizScore(0);
  };

  if (!isOpen) return null;

  const currentToolMeta = STUDIO_TOOLS.find(t => t.id === activeTab) || STUDIO_TOOLS[0];
  const currentOutput = studioOutputs[activeTab];

  return (
    <aside className="studio-panel" style={{
      width: isExpanded ? '640px' : '460px',
      maxWidth: '100vw',
      background: 'var(--bg-surface)',
      borderLeft: '1px solid var(--border-subtle)',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      position: 'relative',
      zIndex: 30,
      flexShrink: 0,
      transition: 'width 0.22s cubic-bezier(0.16, 1, 0.3, 1)'
    }}>
      {/* Studio Header */}
      <div style={{
        padding: '0.9rem 1.15rem',
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
            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              Studio
              <span style={{ fontSize: '0.68rem', background: 'rgba(99, 102, 241, 0.15)', color: 'var(--accent-primary)', padding: '0.1rem 0.4rem', borderRadius: '9999px', fontWeight: 700 }}>
                NotebookLM AI
              </span>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
              {activeSourcesText}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="composer-btn-icon"
            style={{ width: '28px', height: '28px' }}
            title={isExpanded ? 'Collapse width' : 'Expand width'}
          >
            {isExpanded ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </button>
          <button 
            onClick={onClose}
            className="composer-btn-icon"
            style={{ width: '28px', height: '28px' }}
            title="Close Studio Panel"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* 2-Column Pill Grid Matching NotebookLM Screenshot */}
      <div style={{
        padding: '0.85rem 1rem',
        background: 'var(--bg-app)',
        borderBottom: '1px solid var(--border-subtle)'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '0.55rem'
        }}>
          {STUDIO_TOOLS.map(tool => {
            const Icon = tool.icon;
            const isSelected = activeTab === tool.id;
            return (
              <button
                key={tool.id}
                onClick={() => setActiveTab(tool.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.55rem',
                  padding: '0.55rem 0.85rem',
                  borderRadius: '9999px',
                  border: isSelected 
                    ? `1.5px solid ${tool.color}` 
                    : '1px solid var(--border-subtle)',
                  background: isSelected 
                    ? `${tool.color}15` 
                    : 'var(--bg-surface)',
                  color: 'var(--text-primary)',
                  fontWeight: isSelected ? 700 : 500,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  transition: 'all 0.16s ease',
                  boxShadow: isSelected 
                    ? `0 2px 10px ${tool.color}25` 
                    : '0 1px 2px rgba(0,0,0,0.03)',
                  textAlign: 'left',
                  width: '100%',
                  position: 'relative'
                }}
              >
                <div style={{ color: tool.color, display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                  <Icon size={16} strokeWidth={2.2} />
                </div>
                <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {tool.label}
                </span>
                {tool.badge && (
                  <span style={{
                    fontSize: '0.62rem',
                    fontWeight: 700,
                    padding: '0.1rem 0.4rem',
                    borderRadius: '9999px',
                    background: 'rgba(148, 163, 184, 0.25)',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.2
                  }}>
                    {tool.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Secondary Navigation to Notes Board */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
          <button
            onClick={() => setActiveTab('notes')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              background: activeTab === 'notes' ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
              border: activeTab === 'notes' ? '1px solid var(--accent-primary)' : '1px solid transparent',
              borderRadius: 'var(--radius-sm)',
              padding: '0.2rem 0.55rem',
              fontSize: '0.72rem',
              fontWeight: 600,
              color: activeTab === 'notes' ? 'var(--accent-primary)' : 'var(--text-muted)',
              cursor: 'pointer'
            }}
          >
            <StickyNote size={12} /> Notes & Scratchpad ({notes.length})
          </button>
        </div>
      </div>

      {/* Main Studio Body Area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1.1rem' }}>

        {/* Empty Sources Notice */}
        {sources.length === 0 && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            borderRadius: 'var(--radius-md)',
            padding: '0.85rem 1rem',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem'
          }}>
            <Info size={16} style={{ color: '#ef4444', flexShrink: 0 }} />
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
              <strong style={{ color: 'var(--text-primary)' }}>No sources loaded:</strong> Please add at least one source (PDF, Image, or Website Link) using the Add Source buttons on the left to generate deep dive artifacts.
            </span>
          </div>
        )}

        {/* ============================================================== */}
        {/* 1. AUDIO OVERVIEW (PODCAST)                                    */}
        {/* ============================================================== */}
        {activeTab === 'audio-overview' && (
          <div>
            <div style={{
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.12) 0%, rgba(99, 102, 241, 0.08) 100%)',
              border: '1px solid rgba(59, 130, 246, 0.25)',
              borderRadius: 'var(--radius-md)',
              padding: '1rem',
              marginBottom: '1rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Radio size={18} style={{ color: '#3b82f6' }} />
                  <span style={{ fontWeight: 800, fontSize: '0.92rem' }}>Audio Deep Dive Overview</span>
                </div>
                <span style={{ fontSize: '0.7rem', background: 'rgba(59, 130, 246, 0.2)', color: '#38bdf8', padding: '0.15rem 0.45rem', borderRadius: 'var(--radius-full)', fontWeight: 700 }}>
                  2 Hosts • Alex & Jordan
                </span>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '0.85rem' }}>
                Generate an engaging, two-host audio conversation bringing your uploaded knowledge to life with voice playback.
              </p>

              <button
                className="btn-gradient"
                style={{ width: '100%', fontSize: '0.82rem', justifyContent: 'center', padding: '0.55rem' }}
                onClick={() => handleGenerate('audio-overview')}
                disabled={loading || sources.length === 0}
              >
                {loading ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <RefreshCw size={14} className="spin-animate" /> Synthesizing Audio Overview...
                  </span>
                ) : (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <Sparkles size={14} /> {currentOutput ? 'Regenerate Audio Overview' : 'Generate Audio Overview'}
                  </span>
                )}
              </button>
            </div>

            {/* Audio Player Controls */}
            {currentOutput && audioTurns.length > 0 && (
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
                      ? `Playing: ${audioTurns[currentSpeakerTurn]?.speaker || 'Host'} speaking...` 
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

            {/* Transcript */}
            {currentOutput && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                    TRANSCRIPT ({audioTurns.length} turns)
                  </span>
                  <div style={{ display: 'flex', gap: '0.35rem' }}>
                    <button
                      className="composer-btn-icon"
                      style={{ width: '26px', height: '26px' }}
                      title="Copy script"
                      onClick={() => handleCopyContent(currentOutput.content)}
                    >
                      {copied ? <Check size={13} style={{ color: '#10b981' }} /> : <Copy size={13} />}
                    </button>
                    <button
                      className="composer-btn-icon"
                      style={{ width: '26px', height: '26px' }}
                      title="Save to Notes"
                      onClick={() => handleSaveToNotesCurrent('Audio Overview Script', currentOutput.content)}
                    >
                      <StickyNote size={13} />
                    </button>
                  </div>
                </div>

                {audioTurns.map((turn, idx) => {
                  const isActive = currentSpeakerTurn === idx;
                  const isAlex = turn.speaker === 'Alex';
                  return (
                    <div 
                      key={idx}
                      style={{
                        padding: '0.75rem 0.85rem',
                        borderRadius: 'var(--radius-sm)',
                        background: isActive 
                          ? 'rgba(59, 130, 246, 0.2)' 
                          : isAlex 
                            ? 'var(--bg-surface-elevated)' 
                            : 'rgba(255, 255, 255, 0.03)',
                        border: isActive ? '1px solid #3b82f6' : '1px solid var(--border-subtle)',
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
                          <span style={{ fontSize: '0.68rem', color: '#38bdf8', fontWeight: 700 }}>
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

        {/* ============================================================== */}
        {/* 2. SLIDE DECK                                                  */}
        {/* ============================================================== */}
        {activeTab === 'slide-deck' && (
          <div>
            <div style={{
              background: 'linear-gradient(135deg, rgba(217, 70, 239, 0.12) 0%, rgba(139, 92, 246, 0.08) 100%)',
              border: '1px solid rgba(217, 70, 239, 0.25)',
              borderRadius: 'var(--radius-md)',
              padding: '1rem',
              marginBottom: '1rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Presentation size={18} style={{ color: '#d946ef' }} />
                  <span style={{ fontWeight: 800, fontSize: '0.92rem' }}>Slide Deck Presentation</span>
                </div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                  Grounded on {sources.length} sources
                </span>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '0.85rem' }}>
                Generate an executive presentation deck complete with key takeaways, visual concept suggestions, and speaker notes.
              </p>

              <button
                className="btn-gradient"
                style={{ width: '100%', fontSize: '0.82rem', justifyContent: 'center', padding: '0.55rem' }}
                onClick={() => handleGenerate('slide-deck')}
                disabled={loading || sources.length === 0}
              >
                {loading ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <RefreshCw size={14} className="spin-animate" /> Crafting Slide Deck...
                  </span>
                ) : (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <Sparkles size={14} /> {currentOutput ? 'Regenerate Slide Deck' : 'Generate Slide Deck'}
                  </span>
                )}
              </button>
            </div>

            {/* Slide Viewer */}
            {currentOutput?.parsedData?.slides && currentOutput.parsedData.slides.length > 0 ? (
              <div>
                {/* Header info & nav */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <div>
                    <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#d946ef' }}>
                      Slide {currentSlideIndex + 1} of {currentOutput.parsedData.slides.length}
                    </span>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      {currentOutput.parsedData.deckTitle || 'Presentation Deck'}
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                    <button
                      className="composer-btn-icon"
                      style={{ width: '28px', height: '28px' }}
                      disabled={currentSlideIndex === 0}
                      onClick={() => setCurrentSlideIndex(prev => Math.max(0, prev - 1))}
                      title="Previous Slide"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button
                      className="composer-btn-icon"
                      style={{ width: '28px', height: '28px' }}
                      disabled={currentSlideIndex === currentOutput.parsedData.slides.length - 1}
                      onClick={() => setCurrentSlideIndex(prev => Math.min(currentOutput.parsedData.slides.length - 1, prev + 1))}
                      title="Next Slide"
                    >
                      <ChevronRight size={16} />
                    </button>
                    <button
                      className="composer-btn-icon"
                      style={{ width: '28px', height: '28px' }}
                      title="Copy slide deck"
                      onClick={() => handleCopyContent(currentOutput.content)}
                    >
                      {copied ? <Check size={14} style={{ color: '#10b981' }} /> : <Copy size={14} />}
                    </button>
                    <button
                      className="composer-btn-icon"
                      style={{ width: '28px', height: '28px' }}
                      title="Save to Notes"
                      onClick={() => handleSaveToNotesCurrent(currentOutput.parsedData.deckTitle || 'Slide Deck', currentOutput.content)}
                    >
                      <StickyNote size={14} />
                    </button>
                  </div>
                </div>

                {/* Active Slide Canvas */}
                {(() => {
                  const slide = currentOutput.parsedData.slides[currentSlideIndex];
                  return (
                    <div style={{
                      background: 'var(--bg-surface-elevated)',
                      border: '1.5px solid rgba(217, 70, 239, 0.3)',
                      borderRadius: 'var(--radius-lg)',
                      padding: '1.25rem',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                      marginBottom: '1rem'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#d946ef', background: 'rgba(217, 70, 239, 0.15)', padding: '0.15rem 0.5rem', borderRadius: '9999px' }}>
                          SLIDE {slide.slideNumber || currentSlideIndex + 1}
                        </span>
                        {slide.visualConcept && (
                          <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <Eye size={12} style={{ color: 'var(--accent-cyan)' }} /> Visual concept included
                          </span>
                        )}
                      </div>

                      <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.9rem', lineHeight: 1.35 }}>
                        {slide.title}
                      </h3>

                      {/* Bullets */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1rem' }}>
                        {slide.bullets?.map((bullet, bIdx) => (
                          <div key={bIdx} style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start', fontSize: '0.86rem', lineHeight: 1.55 }}>
                            <span style={{ color: '#d946ef', fontWeight: 800, marginTop: '0.1rem' }}>✦</span>
                            <span style={{ color: 'var(--text-primary)' }}>{bullet}</span>
                          </div>
                        ))}
                      </div>

                      {/* Visual Concept Pill */}
                      {slide.visualConcept && (
                        <div style={{
                          background: 'rgba(56, 189, 248, 0.08)',
                          border: '1px solid rgba(56, 189, 248, 0.25)',
                          borderRadius: 'var(--radius-sm)',
                          padding: '0.6rem 0.75rem',
                          fontSize: '0.76rem',
                          color: 'var(--accent-cyan)',
                          marginBottom: '0.75rem',
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '0.45rem'
                        }}>
                          <Eye size={14} style={{ flexShrink: 0, marginTop: '0.1rem' }} />
                          <div>
                            <strong>Visual Concept: </strong> {slide.visualConcept}
                          </div>
                        </div>
                      )}

                      {/* Speaker Notes Toggle */}
                      {slide.speakerNotes && (
                        <div style={{ marginTop: '0.5rem' }}>
                          <button
                            onClick={() => setShowSpeakerNotes(!showSpeakerNotes)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--text-muted)',
                              fontSize: '0.74rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              padding: 0
                            }}
                          >
                            <Lightbulb size={13} style={{ color: '#f59e0b' }} />
                            {showSpeakerNotes ? 'Hide Speaker Script' : 'Show Speaker Script'}
                          </button>
                          {showSpeakerNotes && (
                            <div style={{
                              marginTop: '0.4rem',
                              padding: '0.65rem 0.75rem',
                              background: 'rgba(255,255,255,0.04)',
                              borderRadius: 'var(--radius-sm)',
                              fontSize: '0.78rem',
                              fontStyle: 'italic',
                              lineHeight: 1.5,
                              color: 'var(--text-secondary)'
                            }}>
                              "{slide.speakerNotes}"
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Slide Thumbnail Dots */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
                  {currentOutput.parsedData.slides.map((_, sIdx) => (
                    <button
                      key={sIdx}
                      onClick={() => setCurrentSlideIndex(sIdx)}
                      style={{
                        width: '28px',
                        height: '24px',
                        borderRadius: '4px',
                        border: currentSlideIndex === sIdx ? '1.5px solid #d946ef' : '1px solid var(--border-subtle)',
                        background: currentSlideIndex === sIdx ? '#d946ef' : 'var(--bg-surface)',
                        color: currentSlideIndex === sIdx ? '#fff' : 'var(--text-secondary)',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      {sIdx + 1}
                    </button>
                  ))}
                </div>
              </div>
            ) : currentOutput ? (
              <div style={{ background: 'var(--bg-surface-elevated)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                <StudioMarkdownViewer text={currentOutput.content} />
              </div>
            ) : null}
          </div>
        )}

        {/* ============================================================== */}
        {/* 3. VIDEO OVERVIEW                                              */}
        {/* ============================================================== */}
        {activeTab === 'video-overview' && (
          <div>
            <div style={{
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(6, 182, 212, 0.08) 100%)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              borderRadius: 'var(--radius-md)',
              padding: '1rem',
              marginBottom: '1rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Video size={18} style={{ color: '#10b981' }} />
                  <span style={{ fontWeight: 800, fontSize: '0.92rem' }}>Video Overview Storyboard</span>
                </div>
                <span style={{ fontSize: '0.7rem', background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', padding: '0.15rem 0.45rem', borderRadius: 'var(--radius-full)', fontWeight: 700 }}>
                  2-3 Min Cinematic
                </span>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '0.85rem' }}>
                Produce a scene-by-scene cinematic video overview storyboard with camera direction, visual b-roll, on-screen text, and voiceover narration.
              </p>

              <button
                className="btn-gradient"
                style={{ width: '100%', fontSize: '0.82rem', justifyContent: 'center', padding: '0.55rem' }}
                onClick={() => handleGenerate('video-overview')}
                disabled={loading || sources.length === 0}
              >
                {loading ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <RefreshCw size={14} className="spin-animate" /> Generating Video Storyboard...
                  </span>
                ) : (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <Sparkles size={14} /> {currentOutput ? 'Regenerate Video Storyboard' : 'Generate Video Overview'}
                  </span>
                )}
              </button>
            </div>

            {/* Interactive Video Player & Storyboard */}
            {currentOutput?.parsedData?.scenes && currentOutput.parsedData.scenes.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Video Header & Meta */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.2rem' }}>
                      {currentOutput.parsedData.videoTitle || 'Cinematic Video Overview'}
                    </h3>
                    <div style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: 600 }}>
                      Est. Duration: {currentOutput.parsedData.estimatedDuration || '2:30'} • {currentOutput.parsedData.scenes.length} Scenes
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.35rem' }}>
                    <button
                      className="composer-btn-icon"
                      style={{ width: '28px', height: '28px' }}
                      title="Copy storyboard script"
                      onClick={() => handleCopyContent(currentOutput.content)}
                    >
                      {copied ? <Check size={14} style={{ color: '#10b981' }} /> : <Copy size={14} />}
                    </button>
                    <button
                      className="composer-btn-icon"
                      style={{ width: '28px', height: '28px' }}
                      title="Save to Notes"
                      onClick={() => handleSaveToNotesCurrent(currentOutput.parsedData.videoTitle || 'Video Storyboard', currentOutput.content)}
                    >
                      <StickyNote size={14} />
                    </button>
                  </div>
                </div>

                {/* 16:9 Cinematic Video Frame */}
                {(() => {
                  const scenes = currentOutput.parsedData.scenes;
                  const scene = scenes[activeSceneIndex] || scenes[0];

                  return (
                    <div style={{
                      position: 'relative',
                      borderRadius: 'var(--radius-lg)',
                      overflow: 'hidden',
                      border: '1.5px solid rgba(16, 185, 129, 0.4)',
                      boxShadow: '0 8px 30px rgba(0, 0, 0, 0.35)',
                      background: 'linear-gradient(135deg, #051410 0%, #062e22 50%, #031c15 100%)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      minHeight: '260px'
                    }}>
                      {/* Top Overlay Bar */}
                      <div style={{
                        padding: '0.75rem 1rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        background: 'linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, transparent 100%)',
                        zIndex: 2
                      }}>
                        <span style={{
                          fontSize: '0.7rem',
                          fontWeight: 800,
                          color: '#34d399',
                          background: 'rgba(16, 185, 129, 0.25)',
                          padding: '0.2rem 0.55rem',
                          borderRadius: '9999px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem'
                        }}>
                          <Video size={13} /> SCENE {activeSceneIndex + 1} OF {scenes.length}
                        </span>
                        <span style={{ fontSize: '0.7rem', color: '#cbd5e1', fontWeight: 600 }}>
                          ⏱️ {scene.timestamp || `0:${(activeSceneIndex * 25).toString().padStart(2, '0')}`}
                        </span>
                      </div>

                      {/* Center Visual Canvas with Scene Concept */}
                      <div style={{
                        padding: '1.25rem 1.5rem',
                        textAlign: 'center',
                        zIndex: 2,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.65rem'
                      }}>
                        <h4 style={{
                          fontSize: '1.25rem',
                          fontWeight: 900,
                          color: '#f8fafc',
                          textShadow: '0 2px 10px rgba(0,0,0,0.8)',
                          lineHeight: 1.3,
                          margin: 0
                        }}>
                          {scene.sceneTitle}
                        </h4>

                        {scene.visualPrompt && (
                          <div style={{
                            background: 'rgba(0, 0, 0, 0.65)',
                            backdropFilter: 'blur(8px)',
                            border: '1px solid rgba(16, 185, 129, 0.3)',
                            borderRadius: 'var(--radius-md)',
                            padding: '0.6rem 0.85rem',
                            fontSize: '0.76rem',
                            color: '#94a3b8',
                            lineHeight: 1.45,
                            maxWidth: '92%'
                          }}>
                            <strong style={{ color: '#34d399' }}>Visual Direction: </strong>
                            {scene.visualPrompt}
                          </div>
                        )}
                      </div>

                      {/* Lower Third On-Screen Subtitle Banner */}
                      {scene.onScreenText && (
                        <div style={{
                          margin: '0 1rem 0.65rem 1rem',
                          padding: '0.45rem 0.85rem',
                          borderRadius: '6px',
                          background: 'rgba(6, 182, 212, 0.2)',
                          backdropFilter: 'blur(6px)',
                          border: '1px solid rgba(6, 182, 212, 0.4)',
                          color: '#67e8f9',
                          fontSize: '0.82rem',
                          fontWeight: 800,
                          textAlign: 'center',
                          zIndex: 2
                        }}>
                          📺 "{scene.onScreenText}"
                        </div>
                      )}

                      {/* Progress Line */}
                      <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.1)', position: 'relative' }}>
                        <div style={{
                          height: '100%',
                          background: 'linear-gradient(90deg, #10b981 0%, #34d399 100%)',
                          width: isPlayingVideo ? `${videoProgress}%` : `${((activeSceneIndex + 1) / scenes.length) * 100}%`,
                          transition: 'width 0.15s ease'
                        }} />
                      </div>
                    </div>
                  );
                })()}

                {/* Video Playback Controls Bar */}
                {(() => {
                  const scenes = currentOutput.parsedData.scenes;
                  return (
                    <div style={{
                      background: 'var(--bg-surface-elevated)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      padding: '0.85rem 1rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.65rem'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <Volume2 size={15} /> 
                          {isPlayingVideo 
                            ? `Playing & Narrating Scene ${activeSceneIndex + 1} of ${scenes.length}...` 
                            : isVideoPaused 
                              ? 'Video Paused' 
                              : 'Cinematic Voiceover Ready'}
                        </span>

                        {/* Speed Toggle */}
                        <div style={{ display: 'flex', gap: '0.2rem' }}>
                          {[1, 1.25, 1.5].map(s => (
                            <button
                              key={s}
                              onClick={() => setVideoSpeed(s)}
                              style={{
                                fontSize: '0.68rem',
                                padding: '0.1rem 0.35rem',
                                borderRadius: '4px',
                                border: videoSpeed === s ? '1px solid #10b981' : '1px solid var(--border-subtle)',
                                background: videoSpeed === s ? '#10b981' : 'transparent',
                                color: '#fff',
                                cursor: 'pointer'
                              }}
                            >
                              {s}x
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Control Buttons */}
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <button
                          className="composer-btn-icon"
                          style={{ width: '32px', height: '32px' }}
                          disabled={activeSceneIndex === 0}
                          onClick={() => {
                            if (window.speechSynthesis) window.speechSynthesis.cancel();
                            setIsPlayingVideo(false);
                            setActiveSceneIndex(prev => Math.max(0, prev - 1));
                          }}
                          title="Previous Scene"
                        >
                          <ChevronLeft size={16} />
                        </button>

                        {!isPlayingVideo ? (
                          <button
                            className="btn-gradient"
                            style={{ flex: 1, fontSize: '0.82rem', justifyContent: 'center', padding: '0.5rem', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
                            onClick={handleStartVideo}
                          >
                            <Play size={16} /> {isVideoPaused ? 'Resume Video' : 'Play Video Overview'}
                          </button>
                        ) : (
                          <button
                            className="btn-ghost"
                            style={{ flex: 1, fontSize: '0.82rem', justifyContent: 'center', padding: '0.5rem', borderColor: '#f59e0b', color: '#f59e0b' }}
                            onClick={handlePauseVideo}
                          >
                            <Pause size={16} /> Pause Video
                          </button>
                        )}

                        <button
                          className="btn-ghost"
                          style={{ width: '36px', height: '36px', justifyContent: 'center', padding: 0 }}
                          onClick={handleStopVideo}
                          title="Stop Video"
                        >
                          <Square size={14} />
                        </button>

                        <button
                          className="composer-btn-icon"
                          style={{ width: '32px', height: '32px' }}
                          disabled={activeSceneIndex === scenes.length - 1}
                          onClick={() => {
                            if (window.speechSynthesis) window.speechSynthesis.cancel();
                            setIsPlayingVideo(false);
                            setActiveSceneIndex(prev => Math.min(scenes.length - 1, prev + 1));
                          }}
                          title="Next Scene"
                        >
                          <ChevronRight size={16} />
                        </button>
                      </div>

                      {/* Scene Selector Scrubber Chips */}
                      <div style={{ display: 'flex', gap: '0.35rem', overflowX: 'auto', paddingTop: '0.2rem' }}>
                        {scenes.map((sc, scIdx) => (
                          <button
                            key={scIdx}
                            onClick={() => {
                              if (window.speechSynthesis) window.speechSynthesis.cancel();
                              setIsPlayingVideo(false);
                              setActiveSceneIndex(scIdx);
                            }}
                            style={{
                              padding: '0.25rem 0.55rem',
                              borderRadius: '4px',
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              whiteSpace: 'nowrap',
                              cursor: 'pointer',
                              border: activeSceneIndex === scIdx ? '1.5px solid #10b981' : '1px solid var(--border-subtle)',
                              background: activeSceneIndex === scIdx ? 'rgba(16, 185, 129, 0.2)' : 'var(--bg-app)',
                              color: activeSceneIndex === scIdx ? '#34d399' : 'var(--text-secondary)'
                            }}
                          >
                            Scene {scIdx + 1}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* Spoken Voiceover Narration Transcript of Active Scene */}
                {(() => {
                  const scenes = currentOutput.parsedData.scenes;
                  const scene = scenes[activeSceneIndex] || scenes[0];
                  return (
                    <div style={{
                      background: 'var(--bg-surface-elevated)',
                      border: '1px solid var(--border-subtle)',
                      borderLeft: '3px solid #10b981',
                      borderRadius: 'var(--radius-sm)',
                      padding: '0.85rem 1rem'
                    }}>
                      <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#10b981', textTransform: 'uppercase', marginBottom: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Volume2 size={13} /> Active Scene Narration Script
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontStyle: 'italic', lineHeight: 1.6 }}>
                        "{scene.narration || scene.sceneTitle}"
                      </div>
                    </div>
                  );
                })()}
              </div>
            ) : currentOutput ? (
              <div style={{ background: 'var(--bg-surface-elevated)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                <StudioMarkdownViewer text={currentOutput.content} />
              </div>
            ) : null}
          </div>
        )}

        {/* ============================================================== */}
        {/* 4. MIND MAP                                                    */}
        {/* ============================================================== */}
        {activeTab === 'mind-map' && (
          <div>
            <div style={{
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.12) 0%, rgba(217, 70, 239, 0.08) 100%)',
              border: '1px solid rgba(139, 92, 246, 0.25)',
              borderRadius: 'var(--radius-md)',
              padding: '1rem',
              marginBottom: '1rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Network size={18} style={{ color: '#8b5cf6' }} />
                  <span style={{ fontWeight: 800, fontSize: '0.92rem' }}>Knowledge Mind Map</span>
                </div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                  Interactive Node Graph
                </span>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '0.85rem' }}>
                Map out complex relationships, core branches, and subtopics with visual hierarchical nodes and Mermaid diagrams.
              </p>

              <button
                className="btn-gradient"
                style={{ width: '100%', fontSize: '0.82rem', justifyContent: 'center', padding: '0.55rem' }}
                onClick={() => handleGenerate('mind-map')}
                disabled={loading || sources.length === 0}
              >
                {loading ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <RefreshCw size={14} className="spin-animate" /> Mapping Knowledge Graph...
                  </span>
                ) : (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <Sparkles size={14} /> {currentOutput ? 'Regenerate Mind Map' : 'Generate Mind Map'}
                  </span>
                )}
              </button>
            </div>

            {/* Mind Map Tree */}
            {currentOutput?.parsedData?.branches ? (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                  <div style={{ display: 'flex', gap: '0.35rem' }}>
                    <button
                      onClick={() => setMindMapViewMode('visual')}
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '0.2rem 0.55rem',
                        borderRadius: '4px',
                        border: mindMapViewMode === 'visual' ? '1px solid #8b5cf6' : '1px solid var(--border-subtle)',
                        background: mindMapViewMode === 'visual' ? 'rgba(139, 92, 246, 0.2)' : 'transparent',
                        color: mindMapViewMode === 'visual' ? '#8b5cf6' : 'var(--text-secondary)',
                        cursor: 'pointer'
                      }}
                    >
                      Visual Map
                    </button>
                    {currentOutput.parsedData.mermaid && (
                      <button
                        onClick={() => setMindMapViewMode('mermaid')}
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          padding: '0.2rem 0.55rem',
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

                  <div style={{ display: 'flex', gap: '0.35rem' }}>
                    <button
                      className="composer-btn-icon"
                      style={{ width: '28px', height: '28px' }}
                      title="Copy Mind Map"
                      onClick={() => handleCopyContent(currentOutput.parsedData.mermaid || currentOutput.content)}
                    >
                      {copied ? <Check size={14} style={{ color: '#10b981' }} /> : <Copy size={14} />}
                    </button>
                    <button
                      className="composer-btn-icon"
                      style={{ width: '28px', height: '28px' }}
                      title="Save to Notes"
                      onClick={() => handleSaveToNotesCurrent('Knowledge Mind Map', currentOutput.content)}
                    >
                      <StickyNote size={14} />
                    </button>
                  </div>
                </div>

                {mindMapViewMode === 'visual' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {/* Central Node */}
                    <div style={{
                      background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.25) 0%, rgba(99, 102, 241, 0.2) 100%)',
                      border: '2px solid #8b5cf6',
                      borderRadius: 'var(--radius-md)',
                      padding: '0.85rem 1rem',
                      textAlign: 'center',
                      boxShadow: '0 4px 15px rgba(139, 92, 246, 0.2)'
                    }}>
                      <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        CENTRAL KNOWLEDGE TOPIC
                      </span>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0.25rem 0' }}>
                        {currentOutput.parsedData.centralTopic || 'Core Subject'}
                      </h3>
                      {currentOutput.parsedData.summary && (
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0 }}>
                          {currentOutput.parsedData.summary}
                        </p>
                      )}
                    </div>

                    {/* Branches */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                      {currentOutput.parsedData.branches.map((branch, bIdx) => (
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
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.35rem' }}>
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#8b5cf6' }} />
                            <h4 style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                              {branch.title}
                            </h4>
                          </div>

                          {branch.summary && (
                            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', lineHeight: 1.45 }}>
                              {branch.summary}
                            </p>
                          )}

                          {branch.subTopics && branch.subTopics.length > 0 && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                              {branch.subTopics.map((sub, sIdx) => (
                                <span
                                  key={sIdx}
                                  style={{
                                    fontSize: '0.72rem',
                                    padding: '0.2rem 0.5rem',
                                    borderRadius: '9999px',
                                    background: 'rgba(139, 92, 246, 0.1)',
                                    color: '#c4b5fd',
                                    border: '1px solid rgba(139, 92, 246, 0.2)'
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
                  /* Mermaid Code Tab */
                  <div style={{
                    background: 'var(--bg-app)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.85rem',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.78rem',
                    color: 'var(--text-primary)',
                    whiteSpace: 'pre-wrap',
                    overflowX: 'auto'
                  }}>
                    {currentOutput.parsedData.mermaid}
                  </div>
                )}
              </div>
            ) : currentOutput ? (
              <div style={{ background: 'var(--bg-surface-elevated)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                <StudioMarkdownViewer text={currentOutput.content} />
              </div>
            ) : null}
          </div>
        )}

        {/* ============================================================== */}
        {/* 5. REPORTS (NEW!)                                              */}
        {/* ============================================================== */}
        {activeTab === 'reports' && (
          <div>
            <div style={{
              background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.12) 0%, rgba(139, 92, 246, 0.08) 100%)',
              border: '1px solid rgba(236, 72, 153, 0.25)',
              borderRadius: 'var(--radius-md)',
              padding: '1rem',
              marginBottom: '1rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FileText size={18} style={{ color: '#ec4899' }} />
                  <span style={{ fontWeight: 800, fontSize: '0.92rem' }}>Comprehensive Research Report</span>
                </div>
                <span style={{ fontSize: '0.68rem', background: '#ec4899', color: '#fff', padding: '0.12rem 0.45rem', borderRadius: '9999px', fontWeight: 800 }}>
                  New!
                </span>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '0.85rem' }}>
                Synthesize publication-grade executive intelligence reports with background scope, evidence breakdown, risk implications, and strategic roadmaps.
              </p>

              <button
                className="btn-gradient"
                style={{ width: '100%', fontSize: '0.82rem', justifyContent: 'center', padding: '0.55rem' }}
                onClick={() => handleGenerate('reports')}
                disabled={loading || sources.length === 0}
              >
                {loading ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <RefreshCw size={14} className="spin-animate" /> Compiling Research Report...
                  </span>
                ) : (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <Sparkles size={14} /> {currentOutput ? 'Regenerate Research Report' : 'Generate Research Report'}
                  </span>
                )}
              </button>
            </div>

            {currentOutput && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Generated at {currentOutput.timestamp} • Grounded in {currentOutput.sourceCount || sources.length} sources
                  </span>
                  <div style={{ display: 'flex', gap: '0.35rem' }}>
                    <button
                      className="composer-btn-icon"
                      style={{ width: '28px', height: '28px' }}
                      title="Copy report"
                      onClick={() => handleCopyContent(currentOutput.content)}
                    >
                      {copied ? <Check size={14} style={{ color: '#10b981' }} /> : <Copy size={14} />}
                    </button>
                    <button
                      className="composer-btn-icon"
                      style={{ width: '28px', height: '28px' }}
                      title="Save to Notes"
                      onClick={() => handleSaveToNotesCurrent('Executive Research Report', currentOutput.content)}
                    >
                      <StickyNote size={14} />
                    </button>
                  </div>
                </div>

                <div style={{
                  background: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.25rem'
                }}>
                  <StudioMarkdownViewer text={currentOutput.content} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* 6. FLASHCARDS                                                  */}
        {/* ============================================================== */}
        {activeTab === 'flashcards' && (
          <div>
            <div style={{
              background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.12) 0%, rgba(245, 158, 11, 0.08) 100%)',
              border: '1px solid rgba(249, 115, 22, 0.25)',
              borderRadius: 'var(--radius-md)',
              padding: '1rem',
              marginBottom: '1rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Layers size={18} style={{ color: '#f97316' }} />
                  <span style={{ fontWeight: 800, fontSize: '0.92rem' }}>Interactive Study Flashcards</span>
                </div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                  3D Flippable Cards
                </span>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '0.85rem' }}>
                Turn your sources into a high-yield study deck with 3D flippable cards, category tagging, and shuffle practice.
              </p>

              <button
                className="btn-gradient"
                style={{ width: '100%', fontSize: '0.82rem', justifyContent: 'center', padding: '0.55rem' }}
                onClick={() => handleGenerate('flashcards')}
                disabled={loading || sources.length === 0}
              >
                {loading ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <RefreshCw size={14} className="spin-animate" /> Generating Flashcard Deck...
                  </span>
                ) : (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <Sparkles size={14} /> {currentOutput ? 'Regenerate Flashcards' : 'Generate Flashcards'}
                  </span>
                )}
              </button>
            </div>

            {/* Flashcards Deck */}
            {flashcardDeck.length > 0 ? (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <div>
                    <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#f97316' }}>
                      Card {currentCardIndex + 1} of {flashcardDeck.length}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginLeft: '0.45rem' }}>
                      ({flashcardDeck[currentCardIndex]?.category || 'Core Concept'})
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                    <button
                      onClick={handleShuffleDeck}
                      className="composer-btn-icon"
                      style={{ width: '28px', height: '28px' }}
                      title="Shuffle Deck"
                    >
                      <Shuffle size={14} />
                    </button>
                    <button
                      onClick={() => setFlashcardViewMode(prev => prev === 'single' ? 'grid' : 'single')}
                      className="composer-btn-icon"
                      style={{ width: '28px', height: '28px' }}
                      title={flashcardViewMode === 'single' ? 'View as Grid' : 'View Single Card'}
                    >
                      <Layers size={14} />
                    </button>
                    <button
                      className="composer-btn-icon"
                      style={{ width: '28px', height: '28px' }}
                      title="Save to Notes"
                      onClick={() => handleSaveToNotesCurrent('Study Flashcards', currentOutput.content)}
                    >
                      <StickyNote size={14} />
                    </button>
                  </div>
                </div>

                {flashcardViewMode === 'single' ? (
                  <div>
                    {/* 3D Flippable Card */}
                    <div 
                      onClick={() => setIsCardFlipped(!isCardFlipped)}
                      style={{
                        perspective: '1000px',
                        cursor: 'pointer',
                        marginBottom: '1rem',
                        userSelect: 'none'
                      }}
                    >
                      <div style={{
                        minHeight: '200px',
                        borderRadius: 'var(--radius-lg)',
                        background: isCardFlipped 
                          ? 'linear-gradient(135deg, rgba(249, 115, 22, 0.15) 0%, rgba(245, 158, 11, 0.1) 100%)' 
                          : 'var(--bg-surface-elevated)',
                        border: isCardFlipped 
                          ? '2px solid #f97316' 
                          : '1px solid var(--border-subtle)',
                        padding: '1.5rem',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
                        transition: 'transform 0.4s ease, border-color 0.3s ease',
                        transformStyle: 'preserve-3d',
                        position: 'relative'
                      }}>
                        {/* Top tag */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{
                            fontSize: '0.68rem',
                            fontWeight: 800,
                            padding: '0.15rem 0.5rem',
                            borderRadius: '9999px',
                            background: isCardFlipped ? '#f97316' : 'rgba(249, 115, 22, 0.15)',
                            color: isCardFlipped ? '#fff' : '#f97316'
                          }}>
                            {isCardFlipped ? 'ANSWER / INSIGHT' : 'QUESTION'}
                          </span>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                            Click to flip 🔄
                          </span>
                        </div>

                        {/* Card Content */}
                        <div style={{ margin: '1.25rem 0', textAlign: 'center' }}>
                          <div style={{
                            fontSize: isCardFlipped ? '0.92rem' : '1.05rem',
                            fontWeight: isCardFlipped ? 500 : 700,
                            lineHeight: 1.6,
                            color: 'var(--text-primary)'
                          }}>
                            {isCardFlipped 
                              ? flashcardDeck[currentCardIndex]?.back 
                              : flashcardDeck[currentCardIndex]?.front}
                          </div>
                        </div>

                        {/* Bottom Hint */}
                        <div style={{ textAlign: 'center', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          {isCardFlipped ? 'Click card to flip back to question' : 'Click card to reveal answer'}
                        </div>
                      </div>
                    </div>

                    {/* Navigation Controls */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <button
                        className="btn-ghost"
                        style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem' }}
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
                        style={{ fontSize: '0.8rem', padding: '0.45rem 1rem', background: '#f97316' }}
                        onClick={() => setIsCardFlipped(!isCardFlipped)}
                      >
                        <RotateCcw size={14} /> Flip Card
                      </button>

                      <button
                        className="btn-ghost"
                        style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem' }}
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
                  /* Grid view of all flashcards */
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.65rem' }}>
                    {flashcardDeck.map((card, cIdx) => (
                      <div
                        key={cIdx}
                        style={{
                          background: 'var(--bg-surface-elevated)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 'var(--radius-sm)',
                          padding: '0.75rem',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.4rem'
                        }}
                      >
                        <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#f97316' }}>
                          #{cIdx + 1} • {card.category}
                        </span>
                        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                          Q: {card.front}
                        </div>
                        <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', borderTop: '1px dashed var(--border-subtle)', paddingTop: '0.35rem' }}>
                          A: {card.back}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : currentOutput ? (
              <div style={{ background: 'var(--bg-surface-elevated)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                <StudioMarkdownViewer text={currentOutput.content} />
              </div>
            ) : null}
          </div>
        )}

        {/* ============================================================== */}
        {/* 7. QUIZ                                                        */}
        {/* ============================================================== */}
        {activeTab === 'quiz' && (
          <div>
            <div style={{
              background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.12) 0%, rgba(59, 130, 246, 0.08) 100%)',
              border: '1px solid rgba(6, 182, 212, 0.25)',
              borderRadius: 'var(--radius-md)',
              padding: '1rem',
              marginBottom: '1rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <HelpCircle size={18} style={{ color: '#06b6d4' }} />
                  <span style={{ fontWeight: 800, fontSize: '0.92rem' }}>Interactive Comprehension Quiz</span>
                </div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                  Real-time Scoring
                </span>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '0.85rem' }}>
                Test your mastery with interactive multiple-choice questions, instant feedback highlights, and evidence explanations.
              </p>

              <button
                className="btn-gradient"
                style={{ width: '100%', fontSize: '0.82rem', justifyContent: 'center', padding: '0.55rem' }}
                onClick={() => handleGenerate('quiz')}
                disabled={loading || sources.length === 0}
              >
                {loading ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <RefreshCw size={14} className="spin-animate" /> Building Knowledge Quiz...
                  </span>
                ) : (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <Sparkles size={14} /> {currentOutput ? 'Regenerate Quiz' : 'Generate Quiz'}
                  </span>
                )}
              </button>
            </div>

            {/* Quiz Game */}
            {currentOutput?.parsedData?.questions && currentOutput.parsedData.questions.length > 0 ? (
              <div>
                {/* Score & Progress */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '0.75rem',
                  padding: '0.5rem 0.75rem',
                  background: 'var(--bg-surface-elevated)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)'
                }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#06b6d4' }}>
                    Question {currentQuizQuestionIndex + 1} of {currentOutput.parsedData.questions.length}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      Score: <strong style={{ color: '#10b981' }}>{quizScore}</strong> / {Object.keys(userQuizAnswers).length}
                    </span>
                    <button
                      onClick={handleResetQuiz}
                      className="composer-btn-icon"
                      style={{ width: '24px', height: '24px' }}
                      title="Retake Quiz"
                    >
                      <RotateCcw size={12} />
                    </button>
                  </div>
                </div>

                {/* Active Question Card */}
                {(() => {
                  const q = currentOutput.parsedData.questions[currentQuizQuestionIndex];
                  const userAnswer = userQuizAnswers[currentQuizQuestionIndex];
                  const hasAnswered = userAnswer !== undefined;
                  const isCorrect = userAnswer === q.correctIndex;

                  return (
                    <div style={{
                      background: 'var(--bg-surface-elevated)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      padding: '1.15rem',
                      marginBottom: '1rem'
                    }}>
                      <h3 style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem', lineHeight: 1.45 }}>
                        {q.question}
                      </h3>

                      {/* Options */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                        {q.options?.map((option, optIdx) => {
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
                                gap: '0.65rem',
                                padding: '0.65rem 0.85rem',
                                borderRadius: 'var(--radius-sm)',
                                border: `1.5px solid ${btnBorder}`,
                                background: btnBg,
                                color: btnColor,
                                fontSize: '0.84rem',
                                textAlign: 'left',
                                cursor: hasAnswered ? 'default' : 'pointer',
                                transition: 'all 0.15s ease'
                              }}
                            >
                              <span style={{
                                width: '22px',
                                height: '22px',
                                borderRadius: '50%',
                                background: hasAnswered && isThisCorrect 
                                  ? '#10b981' 
                                  : hasAnswered && isSelected 
                                    ? '#ef4444' 
                                    : 'rgba(255,255,255,0.08)',
                                color: (hasAnswered && (isThisCorrect || isSelected)) ? '#fff' : 'var(--text-secondary)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.72rem',
                                fontWeight: 800,
                                flexShrink: 0
                              }}>
                                {String.fromCharCode(65 + optIdx)}
                              </span>
                              <span style={{ flex: 1 }}>{option}</span>
                              {hasAnswered && isThisCorrect && <CheckCircle2 size={16} style={{ color: '#10b981' }} />}
                              {hasAnswered && isSelected && !isThisCorrect && <XCircle size={16} style={{ color: '#ef4444' }} />}
                            </button>
                          );
                        })}
                      </div>

                      {/* Explanation Reveal */}
                      {hasAnswered && (
                        <div style={{
                          marginTop: '1rem',
                          padding: '0.75rem',
                          borderRadius: 'var(--radius-sm)',
                          background: isCorrect ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                          border: `1px solid ${isCorrect ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.3rem', fontSize: '0.8rem', fontWeight: 800, color: isCorrect ? '#10b981' : '#ef4444' }}>
                            {isCorrect ? <CheckCircle2 size={15} /> : <XCircle size={15} />}
                            {isCorrect ? 'Correct! Outstanding comprehension.' : 'Incorrect. Review the rationale below:'}
                          </div>
                          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                            {q.explanation}
                          </p>
                        </div>
                      )}

                      {/* Question Navigation */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.15rem' }}>
                        <button
                          className="btn-ghost"
                          style={{ fontSize: '0.78rem', padding: '0.4rem 0.75rem' }}
                          disabled={currentQuizQuestionIndex === 0}
                          onClick={() => setCurrentQuizQuestionIndex(prev => Math.max(0, prev - 1))}
                        >
                          <ChevronLeft size={15} /> Previous Question
                        </button>

                        <button
                          className="btn-gradient"
                          style={{ fontSize: '0.78rem', padding: '0.4rem 0.85rem' }}
                          disabled={currentQuizQuestionIndex === currentOutput.parsedData.questions.length - 1}
                          onClick={() => setCurrentQuizQuestionIndex(prev => Math.min(currentOutput.parsedData.questions.length - 1, prev + 1))}
                        >
                          Next Question <ChevronRight size={15} />
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>
            ) : currentOutput ? (
              <div style={{ background: 'var(--bg-surface-elevated)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                <StudioMarkdownViewer text={currentOutput.content} />
              </div>
            ) : null}
          </div>
        )}

        {/* ============================================================== */}
        {/* 8. INFOGRAPHIC                                                 */}
        {/* ============================================================== */}
        {activeTab === 'infographic' && (
          <div>
            <div style={{
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(234, 88, 12, 0.08) 100%)',
              border: '1px solid rgba(245, 158, 11, 0.25)',
              borderRadius: 'var(--radius-md)',
              padding: '1rem',
              marginBottom: '1rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <BarChart3 size={18} style={{ color: '#f59e0b' }} />
                  <span style={{ fontWeight: 800, fontSize: '0.92rem' }}>Visual Data Infographic</span>
                </div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                  Metrics & Pillars
                </span>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '0.85rem' }}>
                Distill your sources into an executive visual dashboard with stat counters, core pillars, and summary takeaways.
              </p>

              <button
                className="btn-gradient"
                style={{ width: '100%', fontSize: '0.82rem', justifyContent: 'center', padding: '0.55rem' }}
                onClick={() => handleGenerate('infographic')}
                disabled={loading || sources.length === 0}
              >
                {loading ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <RefreshCw size={14} className="spin-animate" /> Designing Infographic...
                  </span>
                ) : (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <Sparkles size={14} /> {currentOutput ? 'Regenerate Infographic' : 'Generate Infographic'}
                  </span>
                )}
              </button>
            </div>

            {/* Infographic Dashboard */}
            {currentOutput?.parsedData?.stats ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Header banner */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.2rem' }}>
                      {currentOutput.parsedData.title || 'Knowledge Infographic'}
                    </h3>
                    {currentOutput.parsedData.tagline && (
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0 }}>
                        {currentOutput.parsedData.tagline}
                      </p>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '0.35rem' }}>
                    <button
                      className="composer-btn-icon"
                      style={{ width: '28px', height: '28px' }}
                      title="Copy infographic"
                      onClick={() => handleCopyContent(currentOutput.content)}
                    >
                      {copied ? <Check size={14} style={{ color: '#10b981' }} /> : <Copy size={14} />}
                    </button>
                    <button
                      className="composer-btn-icon"
                      style={{ width: '28px', height: '28px' }}
                      title="Save to Notes"
                      onClick={() => handleSaveToNotesCurrent('Infographic Data', currentOutput.content)}
                    >
                      <StickyNote size={14} />
                    </button>
                  </div>
                </div>

                {/* Big Stat Metric Counters */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.65rem' }}>
                  {currentOutput.parsedData.stats.map((st, stIdx) => (
                    <div
                      key={stIdx}
                      style={{
                        background: 'var(--bg-surface-elevated)',
                        border: '1px solid rgba(245, 158, 11, 0.3)',
                        borderRadius: 'var(--radius-md)',
                        padding: '0.85rem 0.65rem',
                        textAlign: 'center',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                      }}
                    >
                      <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#f59e0b', lineHeight: 1.1 }}>
                        {st.value}
                      </div>
                      <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.3rem' }}>
                        {st.label}
                      </div>
                      {st.trend && (
                        <div style={{ fontSize: '0.65rem', color: '#10b981', marginTop: '0.2rem', fontWeight: 600 }}>
                          ↑ {st.trend}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Core Pillars */}
                {currentOutput.parsedData.pillars && currentOutput.parsedData.pillars.length > 0 && (
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      CORE ARCHITECTURAL PILLARS
                    </span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginTop: '0.45rem' }}>
                      {currentOutput.parsedData.pillars.map((pl, pIdx) => (
                        <div
                          key={pIdx}
                          style={{
                            background: 'var(--bg-surface-elevated)',
                            border: '1px solid var(--border-subtle)',
                            borderLeft: '3px solid #f59e0b',
                            borderRadius: 'var(--radius-sm)',
                            padding: '0.85rem'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                            <h4 style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                              {pl.title}
                            </h4>
                            {pl.badge && (
                              <span style={{ fontSize: '0.65rem', background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 700 }}>
                                {pl.badge}
                              </span>
                            )}
                          </div>
                          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                            {pl.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Key Takeaways */}
                {currentOutput.parsedData.takeaways && currentOutput.parsedData.takeaways.length > 0 && (
                  <div style={{
                    background: 'var(--bg-app)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.85rem'
                  }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--accent-primary)', textTransform: 'uppercase' }}>
                      ✦ KEY STRATEGIC TAKEAWAYS
                    </span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', marginTop: '0.45rem' }}>
                      {currentOutput.parsedData.takeaways.map((tk, tIdx) => (
                        <div key={tIdx} style={{ display: 'flex', gap: '0.5rem', fontSize: '0.8rem', lineHeight: 1.5 }}>
                          <span style={{ color: '#10b981', fontWeight: 800 }}>✓</span>
                          <span style={{ color: 'var(--text-primary)' }}>{tk}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : currentOutput ? (
              <div style={{ background: 'var(--bg-surface-elevated)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                <StudioMarkdownViewer text={currentOutput.content} />
              </div>
            ) : null}
          </div>
        )}

        {/* ============================================================== */}
        {/* 9. NOTES & SCRATCHPAD                                          */}
        {/* ============================================================== */}
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
