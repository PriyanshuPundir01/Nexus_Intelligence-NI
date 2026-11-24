import React, { useState, useEffect } from 'react';
import { MessageSquare, Sparkles, X, ChevronLeft, ChevronRight, Layers } from 'lucide-react';
import Navbar from './components/Navbar';
import SourcesDrawer from './components/SourcesDrawer';
import ChatArea from './components/ChatArea';
import ChatInput from './components/ChatInput';
import SourceModal from './components/SourceModal';
import AuthModal from './components/AuthModal';
import { StudioOptionsDrawer, StudioResultCanvas, STUDIO_TOOLS } from './components/NotebookStudio';
import SourceInspectorModal from './components/SourceInspectorModal';
import SignInPage from './pages/SignInPage';
import SignUpPage from './pages/SignUpPage';

export default function App() {
  const [sources, setSources] = useState([]);
  const [selectedSourceIds, setSelectedSourceIds] = useState([]);
  const [totalChunks, setTotalChunks] = useState(0);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [modalInitialTab, setModalInitialTab] = useState('pdf');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Resizable sliding panel state (Left Sources & Right Studio)
  const [leftWidth, setLeftWidth] = useState(() => {
    try {
      const saved = localStorage.getItem('ni_left_width');
      return saved ? Math.max(200, Math.min(500, parseInt(saved, 10))) : 280;
    } catch {
      return 280;
    }
  });
  const [isLeftCollapsed, setIsLeftCollapsed] = useState(false);

  const [rightWidth, setRightWidth] = useState(() => {
    try {
      const saved = localStorage.getItem('ni_right_width');
      return saved ? Math.max(240, Math.min(550, parseInt(saved, 10))) : 320;
    } catch {
      return 320;
    }
  });
  const [isStudioOpen, setIsStudioOpen] = useState(true);

  // Center Stage Workspace: 'chat' | 'studio'
  const [activeCenterView, setActiveCenterView] = useState('chat');
  const [activeStudioTool, setActiveStudioTool] = useState('slide-deck');

  // Studio generated outputs cache
  const [studioOutputs, setStudioOutputs] = useState({
    'audio-overview': null,
    'slide-deck': null,
    'mind-map': null,
    'reports': null,
    'flashcards': null,
    'quiz': null,
    'infographic': null
  });
  const [studioLoading, setStudioLoading] = useState(false);

  // Left Panel Drag Resize Handler
  const handleLeftResizeStart = (e) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = leftWidth;

    const onMouseMove = (moveEvent) => {
      const delta = moveEvent.clientX - startX;
      const newWidth = Math.max(200, Math.min(500, startWidth + delta));
      setLeftWidth(newWidth);
      localStorage.setItem('ni_left_width', String(newWidth));
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  // Right Panel Drag Resize Handler
  const handleRightResizeStart = (e) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = rightWidth;

    const onMouseMove = (moveEvent) => {
      const delta = startX - moveEvent.clientX; // dragging left expands right panel
      const newWidth = Math.max(240, Math.min(550, startWidth + delta));
      setRightWidth(newWidth);
      localStorage.setItem('ni_right_width', String(newWidth));
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  const [inspectedSource, setInspectedSource] = useState(null);
  const [theme, setTheme] = useState('dark');

  const handleOpenAddModal = (tab = 'pdf') => {
    if (typeof tab === 'string' && ['pdf', 'image', 'link'].includes(tab)) {
      setModalInitialTab(tab);
    } else {
      setModalInitialTab('pdf');
    }
    setIsAddModalOpen(true);
  };

  // NotebookLM Notes State (Synced with localStorage)
  const [notes, setNotes] = useState(() => {
    try {
      const savedNotes = localStorage.getItem('ni_notes');
      return savedNotes ? JSON.parse(savedNotes) : [];
    } catch {
      return [];
    }
  });

  const handleAddNote = (newNote) => {
    setNotes(prev => {
      const updated = [newNote, ...prev];
      localStorage.setItem('ni_notes', JSON.stringify(updated));
      return updated;
    });
  };

  const handleDeleteNote = (noteId) => {
    setNotes(prev => {
      const updated = prev.filter(n => n.id !== noteId);
      localStorage.setItem('ni_notes', JSON.stringify(updated));
      return updated;
    });
  };

  // Client-side URL Routing State (/signin, /signup, /)
  const [currentRoute, setCurrentRoute] = useState(() => {
    const path = window.location.pathname.toLowerCase();
    if (path === '/signin' || path === '/login') return '/signin';
    if (path === '/signup' || path === '/register') return '/signup';
    return '/';
  });

  const navigate = (path) => {
    window.history.pushState({}, '', path);
    setCurrentRoute(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.toLowerCase();
      if (path === '/signin' || path === '/login') setCurrentRoute('/signin');
      else if (path === '/signup' || path === '/register') setCurrentRoute('/signup');
      else setCurrentRoute('/');
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // User Auth State
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('ni_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem('ni_token') || '';
  });

  // Persistent anonymous session identifier for guest users
  const [guestSessionId] = useState(() => {
    let gid = localStorage.getItem('ni_guest_session');
    if (!gid) {
      gid = 'g_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
      localStorage.setItem('ni_guest_session', gid);
    }
    return gid;
  });

  const getAuthHeaders = (activeToken = token) => {
    const headers = {};
    if (activeToken) {
      headers['Authorization'] = `Bearer ${activeToken}`;
    } else if (guestSessionId) {
      headers['X-Guest-Session'] = guestSessionId;
    }
    return headers;
  };

  // Sync theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Validate existing token on boot
  useEffect(() => {
    if (token) {
      fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => {
        if (!res.ok) {
          // Token expired or invalid
          handleLogout();
        }
      })
      .catch(() => {});
    }
  }, []);

  // Fetch sources list from server (scoped to authenticated user or guest session)
  const loadSources = async (activeToken = token) => {
    try {
      const headers = getAuthHeaders(activeToken);

      const res = await fetch('/api/sources', { headers });
      if (res.ok) {
        const data = await res.json();
        const incomingSources = data.sources || [];
        setSources(incomingSources);
        setTotalChunks(data.totalChunks || 0);
        setSelectedSourceIds(prev => {
          if (prev.length === 0) return incomingSources.map(s => s.id);
          const existingValid = prev.filter(id => incomingSources.some(s => s.id === id));
          return existingValid.length > 0 ? existingValid : incomingSources.map(s => s.id);
        });
      }
    } catch (err) {
      console.error('Error fetching sources:', err);
    }
  };

  useEffect(() => {
    loadSources(token);
  }, [token]);

  const handleToggleSelectSource = (sourceId) => {
    setSelectedSourceIds(prev => 
      prev.includes(sourceId)
        ? prev.filter(id => id !== sourceId)
        : [...prev, sourceId]
    );
  };

  const handleSelectAllSources = () => {
    setSelectedSourceIds(sources.map(s => s.id));
  };

  const handleClearSelection = () => {
    setSelectedSourceIds([]);
  };

  const handleAuthSuccess = (authenticatedUser, authToken) => {
    setUser(authenticatedUser);
    setToken(authToken);
    loadSources(authToken);
    setMessages(prev => [
      ...prev,
      {
        id: `sys_${Date.now()}`,
        role: 'assistant',
        text: `Welcome back, **${authenticatedUser.name}**! You are authenticated. Your personal knowledge base and chat history are active.`,
        citations: []
      }
    ]);
  };

  const handleLogout = () => {
    localStorage.removeItem('ni_token');
    localStorage.removeItem('ni_user');
    setUser(null);
    setToken('');
    loadSources('');
    setMessages(prev => [
      ...prev,
      {
        id: `sys_${Date.now()}`,
        role: 'assistant',
        text: 'You have logged out. Any questions asked will now operate in guest mode.',
        citations: []
      }
    ]);
  };

  const handleSourceAdded = (newSource) => {
    loadSources(token);
    setSelectedSourceIds(prev => [...prev, newSource.id]);
    setMessages(prev => [
      ...prev,
      {
        id: `sys_${Date.now()}`,
        role: 'assistant',
        text: `Successfully ingested and indexed **"${newSource.name}"** (${newSource.type.toUpperCase()}) into your Knowledge Hub! You can now query it or generate Audio Overviews & Study Guides.`,
        citations: []
      }
    ]);
  };

  const handleDeleteSource = async (sourceId) => {
    try {
      const headers = getAuthHeaders(token);

      const res = await fetch(`/api/sources/${sourceId}`, { 
        method: 'DELETE',
        headers
      });
      if (res.ok) {
        setSelectedSourceIds(prev => prev.filter(id => id !== sourceId));
        loadSources(token);
      }
    } catch (err) {
      console.error('Error deleting source:', err);
    }
  };

  const handleClearSources = async () => {
    if (!window.confirm('Are you sure you want to clear all documents, images, and links from the Knowledge Hub?')) {
      return;
    }
    try {
      const headers = getAuthHeaders(token);

      const res = await fetch('/api/clear', { 
        method: 'POST',
        headers
      });
      if (res.ok) {
        setSources([]);
        setSelectedSourceIds([]);
        setTotalChunks(0);
        setMessages([]);
      }
    } catch (err) {
      console.error('Error clearing sources:', err);
    }
  };

  const handleGenerateStudio = async (toolId) => {
    if (!toolId || studioLoading) return;
    setStudioLoading(true);
    setActiveStudioTool(toolId);
    setActiveCenterView('studio');

    try {
      const headers = {
        'Content-Type': 'application/json',
        ...getAuthHeaders(token)
      };

      const res = await fetch('/api/studio/generate', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          tool: toolId,
          selectedSourceIds: selectedSourceIds.length > 0 ? selectedSourceIds : undefined
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Studio generation failed');

      setStudioOutputs(prev => ({
        ...prev,
        [toolId]: {
          content: data.content,
          parsedData: data.parsedData || null,
          sourceCount: data.sourceCount || sources.length,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      }));
    } catch (err) {
      console.error('Studio generation error:', err);
      alert(`Studio generation error: ${err.message}`);
    } finally {
      setStudioLoading(false);
    }
  };

  const handleSendMessage = async (queryText) => {
    if (!queryText || loading) return;

    // Detect Studio Task triggers to generate studio artifact in center above search bar
    const lower = queryText.toLowerCase().trim();
    if (lower.includes('flashcard') || lower.includes('flash cards')) {
      setIsStudioOpen(true);
      handleGenerateStudio('flashcards');
      return;
    } else if (lower.includes('quiz') || lower.includes('practice test') || lower.includes('assessment')) {
      setIsStudioOpen(true);
      handleGenerateStudio('quiz');
      return;
    } else if (lower.includes('slide deck') || lower.includes('presentation') || lower.includes('slides')) {
      setIsStudioOpen(true);
      handleGenerateStudio('slide-deck');
      return;
    } else if (lower.includes('mind map') || lower.includes('concept map')) {
      setIsStudioOpen(true);
      handleGenerateStudio('mind-map');
      return;
    } else if (lower.includes('infographic') || lower.includes('stats dashboard')) {
      setIsStudioOpen(true);
      handleGenerateStudio('infographic');
      return;
    } else if (lower.includes('audio overview') || lower.includes('podcast') || lower.includes('deep dive')) {
      setIsStudioOpen(true);
      handleGenerateStudio('audio-overview');
      return;
    } else if (lower.includes('report') || lower.includes('briefing doc')) {
      setIsStudioOpen(true);
      handleGenerateStudio('reports');
      return;
    } else if (lower === '/studio' || lower === 'studio' || lower === 'open studio') {
      setIsStudioOpen(true);
      return;
    }

    // Regular Chat: switch center stage back to Chat workspace
    if (activeCenterView !== 'chat') {
      setActiveCenterView('chat');
    }

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg = {
      id: `usr_${Date.now()}`,
      role: 'user',
      text: queryText,
      timestamp: timeStr
    };

    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const historyPayload = messages.map(m => ({ role: m.role, text: m.text }));
      const headers = {
        'Content-Type': 'application/json',
        ...getAuthHeaders(token)
      };

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          query: queryText,
          selectedSourceIds: selectedSourceIds.length > 0 ? selectedSourceIds : undefined,
          conversationHistory: historyPayload
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Server error occurred');

      const assistantMsg = {
        id: `ast_${Date.now()}`,
        role: 'assistant',
        text: data.answer || 'No response generated.',
        citations: data.citedPassages || [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      const errorMsg = {
        id: `err_${Date.now()}`,
        role: 'assistant',
        text: `⚠️ Query Error: ${err.message}`,
        citations: []
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  // Render Dedicated Sign In Page
  if (currentRoute === '/signin') {
    return (
      <SignInPage 
        onNavigate={navigate}
        onAuthSuccess={handleAuthSuccess}
        theme={theme}
        setTheme={setTheme}
        user={user}
        onLogout={handleLogout}
      />
    );
  }

  // Render Dedicated Sign Up Page
  if (currentRoute === '/signup') {
    return (
      <SignUpPage 
        onNavigate={navigate}
        onAuthSuccess={handleAuthSuccess}
        theme={theme}
        setTheme={setTheme}
        user={user}
        onLogout={handleLogout}
      />
    );
  }

  return (
    <div className="app-shell">
      <div className="ambient-glow" />

      {/* Navigation Header */}
      <Navbar 
        sources={sources}
        totalChunks={totalChunks}
        onOpenAddModal={handleOpenAddModal}
        onClearSources={handleClearSources}
        theme={theme}
        setTheme={setTheme}
        user={user}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
        onNavigate={navigate}
        isStudioOpen={isStudioOpen}
        onToggleStudio={() => setIsStudioOpen(!isStudioOpen)}
      />

      {/* Main Split Layout with Resizable Sliding Panels on Both Sides */}
      <div className="main-layout" style={{ position: 'relative' }}>
        
        {/* 1. LEFT SLIDING PANEL: Knowledge Sources Drawer */}
        <SourcesDrawer 
          width={leftWidth}
          isCollapsed={isLeftCollapsed}
          onToggleCollapse={() => setIsLeftCollapsed(!isLeftCollapsed)}
          sources={sources}
          selectedSourceIds={selectedSourceIds}
          onToggleSelectSource={handleToggleSelectSource}
          onSelectAllSources={handleSelectAllSources}
          onClearSelection={handleClearSelection}
          onDeleteSource={handleDeleteSource}
          onOpenAddModal={handleOpenAddModal}
          onInspectSource={src => setInspectedSource(src)}
        />

        {/* Floating pill to uncollapse left panel if collapsed */}
        {isLeftCollapsed && (
          <button
            onClick={() => setIsLeftCollapsed(false)}
            className="panel-toggle-pill left"
            title="Expand Sources Panel"
          >
            <Layers size={13} />
            <span>Sources ({sources.length})</span>
            <ChevronRight size={12} />
          </button>
        )}

        {/* Left Resizer Drag Handle */}
        {!isLeftCollapsed && (
          <div
            className="resizer-handle vertical-resizer left-resizer"
            onMouseDown={handleLeftResizeStart}
            title="Drag to resize Sources Panel"
          >
            <div className="resizer-line" />
          </div>
        )}

        {/* 2. CENTER STAGE: Studio Results Canvas or Chat Area, directly above Search Bar */}
        <div className="chat-container">
          
          {/* Central Workspace Switcher Tabs */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.45rem 1.25rem',
            borderBottom: '1px solid var(--border-subtle)',
            background: 'var(--bg-app)',
            flexShrink: 0
          }}>
            <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => setActiveCenterView('chat')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.35rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  border: activeCenterView === 'chat' ? '1px solid var(--accent-primary)' : '1px solid transparent',
                  background: activeCenterView === 'chat' ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                  color: activeCenterView === 'chat' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <MessageSquare size={14} />
                <span>Chat Workspace {messages.length > 0 && `(${messages.length})`}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveCenterView('studio');
                  if (!isStudioOpen) setIsStudioOpen(true);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.35rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  border: activeCenterView === 'studio' ? '1px solid #10b981' : '1px solid transparent',
                  background: activeCenterView === 'studio' ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                  color: activeCenterView === 'studio' ? '#10b981' : 'var(--text-secondary)',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <Sparkles size={14} />
                <span>Studio Result: {STUDIO_TOOLS.find(t => t.id === activeStudioTool)?.label || 'Slide deck'}</span>
                {studioOutputs[activeStudioTool] && (
                  <span style={{ fontSize: '0.62rem', background: '#10b981', color: '#fff', padding: '0.05rem 0.35rem', borderRadius: '4px', fontWeight: 800 }}>
                    Ready
                  </span>
                )}
              </button>
            </div>

            {/* If Studio Options Drawer on right is closed, allow opening it */}
            {!isStudioOpen && (
              <button
                type="button"
                onClick={() => setIsStudioOpen(true)}
                className="btn-ghost"
                style={{ fontSize: '0.72rem', padding: '0.25rem 0.55rem', gap: '0.3rem', color: 'var(--accent-primary)', borderColor: 'var(--border-glow)' }}
                title="Open Studio Tools Panel"
              >
                <Sparkles size={13} /> Studio Tools (7) →
              </button>
            )}
          </div>

          {/* Center Stage Body: Renders either Studio Result or Chat */}
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative' }}>
            {activeCenterView === 'studio' ? (
              <StudioResultCanvas 
                toolId={activeStudioTool}
                output={studioOutputs[activeStudioTool]}
                sources={sources}
                onBackToChat={() => setActiveCenterView('chat')}
                onSaveNote={handleAddNote}
                onRegenerate={() => handleGenerateStudio(activeStudioTool)}
                loading={studioLoading}
              />
            ) : (
              <ChatArea 
                messages={messages}
                loading={loading}
                sources={sources}
                totalChunks={totalChunks}
                onSelectPrompt={handleSendMessage}
                onOpenAddModal={handleOpenAddModal}
                onOpenStudio={(toolId) => {
                  if (toolId && typeof toolId === 'string') {
                    setActiveStudioTool(toolId);
                    setIsStudioOpen(true);
                    if (studioOutputs[toolId]) {
                      setActiveCenterView('studio');
                    } else {
                      handleGenerateStudio(toolId);
                    }
                  }
                }}
                onSaveNote={handleAddNote}
                user={user}
              />
            )}
          </div>

          {/* Central Search Bar / Prompt Input at Bottom */}
          <ChatInput 
            onSendMessage={handleSendMessage}
            loading={loading}
            onOpenAddModal={handleOpenAddModal}
          />
        </div>

        {/* Right Resizer Drag Handle */}
        {isStudioOpen && (
          <div
            className="resizer-handle vertical-resizer right-resizer"
            onMouseDown={handleRightResizeStart}
            title="Drag to resize Studio Tools Panel"
          >
            <div className="resizer-line" />
          </div>
        )}

        {/* 3. RIGHT SLIDING PANEL: Studio Options Drawer (7 Tools & Notes) */}
        <StudioOptionsDrawer 
          width={rightWidth}
          isOpen={isStudioOpen}
          onClose={() => setIsStudioOpen(false)}
          activeTool={activeStudioTool}
          onSelectTool={(toolId) => {
            setActiveStudioTool(toolId);
            if (studioOutputs[toolId]) {
              setActiveCenterView('studio');
            }
          }}
          onGenerate={handleGenerateStudio}
          loading={studioLoading}
          sources={sources}
          selectedSourceIds={selectedSourceIds}
          studioOutputs={studioOutputs}
          notes={notes}
          onAddNote={handleAddNote}
          onDeleteNote={handleDeleteNote}
          onOpenResultInCenter={() => setActiveCenterView('studio')}
        />

      </div>

      {/* Source Inspector Modal */}
      <SourceInspectorModal 
        isOpen={!!inspectedSource}
        onClose={() => setInspectedSource(null)}
        source={inspectedSource}
        token={token}
        guestSessionId={guestSessionId}
      />

      {/* Ingest Source Modal (PDF / Image / Link) */}
      <SourceModal 
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSourceAdded={handleSourceAdded}
        token={token}
        guestSessionId={guestSessionId}
        initialTab={modalInitialTab}
      />

      {/* Authentication & Authorization Modal */}
      <AuthModal 
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />
    </div>
  );
}
