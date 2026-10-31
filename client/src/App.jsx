import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import SourcesDrawer from './components/SourcesDrawer';
import ChatArea from './components/ChatArea';
import ChatInput from './components/ChatInput';
import SourceModal from './components/SourceModal';
import AuthModal from './components/AuthModal';
import SignInPage from './pages/SignInPage';
import SignUpPage from './pages/SignUpPage';

export default function App() {
  const [sources, setSources] = useState([]);
  const [totalChunks, setTotalChunks] = useState(0);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [theme, setTheme] = useState('dark');

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
        setSources(data.sources || []);
        setTotalChunks(data.totalChunks || 0);
      }
    } catch (err) {
      console.error('Error fetching sources:', err);
    }
  };

  useEffect(() => {
    loadSources(token);
  }, [token]);

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
    setMessages(prev => [
      ...prev,
      {
        id: `sys_${Date.now()}`,
        role: 'assistant',
        text: `Successfully ingested and indexed **"${newSource.name}"** (${newSource.type.toUpperCase()}) into your Knowledge Hub! You can now ask any question related to it.`,
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
        setTotalChunks(0);
        setMessages([]);
      }
    } catch (err) {
      console.error('Error clearing sources:', err);
    }
  };

  const handleSendMessage = async (queryText) => {
    if (!queryText || loading) return;

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
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onClearSources={handleClearSources}
        theme={theme}
        setTheme={setTheme}
        user={user}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
        onNavigate={navigate}
      />

      {/* Main Split Layout */}
      <div className="main-layout">
        
        {/* Knowledge Sources Drawer */}
        <SourcesDrawer 
          sources={sources}
          onDeleteSource={handleDeleteSource}
          onOpenAddModal={() => setIsAddModalOpen(true)}
        />

        {/* Chat Workspace */}
        <div className="chat-container">
          <ChatArea 
            messages={messages}
            loading={loading}
            sources={sources}
            totalChunks={totalChunks}
            onSelectPrompt={handleSendMessage}
            onOpenAddModal={() => setIsAddModalOpen(true)}
            user={user}
          />

          <ChatInput 
            onSendMessage={handleSendMessage}
            loading={loading}
            onOpenAddModal={() => setIsAddModalOpen(true)}
          />
        </div>

      </div>

      {/* Ingest Source Modal (PDF / Image / Link) */}
      <SourceModal 
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSourceAdded={handleSourceAdded}
        token={token}
        guestSessionId={guestSessionId}
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
