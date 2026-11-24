import React, { useState } from 'react';
import { 
  Zap, 
  Layers, 
  Plus, 
  Sun, 
  Moon, 
  Trash2, 
  FileText, 
  Image as ImageIcon, 
  Link as LinkIcon,
  FileCode,
  User as UserIcon,
  LogIn,
  LogOut,
  UserPlus,
  ShieldCheck,
  ChevronDown,
  Headphones
} from 'lucide-react';

export default function Navbar({ 
  sources = [], 
  totalChunks = 0, 
  onOpenAddModal, 
  onClearSources, 
  theme, 
  setTheme,
  user,
  onOpenAuthModal,
  onLogout,
  onNavigate,
  isStudioOpen,
  onToggleStudio
}) {
  const [showUserMenu, setShowUserMenu] = useState(false);

  const pdfCount = sources.filter(s => s.type === 'pdf').length;
  const imgCount = sources.filter(s => s.type === 'image').length;
  const linkCount = sources.filter(s => s.type === 'link').length;
  const noteCount = sources.filter(s => s.type === 'text' || s.type === 'code').length;

  const getInitials = (name) => {
    if (!name) return 'NI';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <header className="app-navbar">
      <div className="brand-section">
        <div className="brand-badge-icon" style={{ fontWeight: 900, fontSize: '1rem', letterSpacing: '0.05em' }}>
          NI
        </div>
        <div className="brand-titles">
          <h1>
            Nexus Intelligence
            <span className="brand-tag">NI • MULTIMODAL</span>
          </h1>
          <div className="brand-sub">
            AI Knowledge Engine • PDFs • Images • Links & YouTube • Notes
          </div>
        </div>
      </div>

      {/* Sources Quick Indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--bg-surface-elevated)', padding: '0.35rem 0.85rem', borderRadius: 'var(--radius-full)', border: '1px solid var(--border-subtle)', fontSize: '0.8rem' }}>
          <button 
            type="button"
            onClick={() => onOpenAddModal('pdf')}
            style={{ background: 'transparent', border: 'none', display: 'flex', alignItems: 'center', gap: '0.35rem', color: pdfCount > 0 ? '#f87171' : 'var(--text-muted)', cursor: 'pointer', padding: 0, font: 'inherit' }}
            title="Click to add or manage PDFs"
          >
            <FileText size={14} /> {pdfCount} PDFs
          </button>
          <span style={{ color: 'var(--border-subtle)' }}>•</span>
          <button 
            type="button"
            onClick={() => onOpenAddModal('image')}
            style={{ background: 'transparent', border: 'none', display: 'flex', alignItems: 'center', gap: '0.35rem', color: imgCount > 0 ? '#34d399' : 'var(--text-muted)', cursor: 'pointer', padding: 0, font: 'inherit' }}
            title="Click to add or manage Images"
          >
            <ImageIcon size={14} /> {imgCount} Images
          </button>
          <span style={{ color: 'var(--border-subtle)' }}>•</span>
          <button 
            type="button"
            onClick={() => onOpenAddModal('link')}
            style={{ background: 'transparent', border: 'none', display: 'flex', alignItems: 'center', gap: '0.35rem', color: linkCount > 0 ? '#22d3ee' : 'var(--text-muted)', cursor: 'pointer', padding: 0, font: 'inherit' }}
            title="Click to add or manage Links"
          >
            <LinkIcon size={14} /> {linkCount} Links
          </button>
          {noteCount > 0 && (
            <>
              <span style={{ color: 'var(--border-subtle)' }}>•</span>
              <button 
                type="button"
                onClick={() => onOpenAddModal('text')}
                style={{ background: 'transparent', border: 'none', display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#a78bfa', cursor: 'pointer', padding: 0, font: 'inherit' }}
                title="Click to add or manage Notes"
              >
                <FileCode size={14} /> {noteCount} Notes
              </button>
            </>
          )}
          <span style={{ color: 'var(--border-subtle)' }}>•</span>
          <span style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>
            {totalChunks} Chunks
          </span>
        </div>
      </div>

      <div className="nav-actions">
        <button 
          className={isStudioOpen ? "btn-gradient" : "btn-ghost"}
          onClick={onToggleStudio}
          title="NotebookLM Studio (Podcast Audio Overview, Study Guides, FAQs & Notes)"
          style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}
        >
          <Headphones size={15} />
          <span>Studio</span>
        </button>

        <button 
          className="btn-gradient" 
          onClick={onOpenAddModal}
        >
          <Plus size={16} />
          <span>Add Knowledge</span>
        </button>

        {sources.length > 0 && (
          <button 
            className="btn-ghost" 
            onClick={onClearSources}
            title="Clear all indexed documents and chat history"
          >
            <Trash2 size={15} />
            <span>Reset Hub</span>
          </button>
        )}

        {/* User Auth Section */}
        {user ? (
          <div style={{ position: 'relative' }}>
            <button 
              className="btn-ghost"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.35rem 0.75rem', borderColor: 'var(--border-glow)' }}
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              <div style={{ 
                width: '26px', 
                height: '26px', 
                borderRadius: '50%', 
                background: 'var(--accent-gradient)', 
                color: '#fff', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                fontWeight: 800, 
                fontSize: '0.72rem' 
              }}>
                {getInitials(user.name)}
              </div>
              <span style={{ fontSize: '0.82rem', fontWeight: 600, maxWidth: '110px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.name}
              </span>
              <ChevronDown size={14} />
            </button>

            {/* Dropdown Menu */}
            {showUserMenu && (
              <div 
                style={{
                  position: 'absolute',
                  right: 0,
                  top: '120%',
                  background: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.85rem',
                  boxShadow: 'var(--shadow-md)',
                  width: '220px',
                  zIndex: 100,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem'
                }}
              >
                <div style={{ paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                    {user.name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {user.email}
                  </div>
                </div>

                <div style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <ShieldCheck size={14} /> Authenticated & Authorized
                </div>

                <button 
                  className="btn-ghost" 
                  style={{ width: '100%', justifyContent: 'flex-start', color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.25)', marginTop: '0.25rem' }}
                  onClick={() => {
                    setShowUserMenu(false);
                    onLogout();
                  }}
                >
                  <LogOut size={14} /> Log Out
                </button>
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button 
              className="btn-ghost"
              style={{ 
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-primary)',
                fontWeight: 600,
                fontSize: '0.84rem',
                padding: '0.45rem 0.85rem'
              }}
              onClick={() => onNavigate ? onNavigate('/signin') : onOpenAuthModal?.()}
              title="Sign in to your account"
            >
              <LogIn size={15} />
              <span>Sign In</span>
            </button>

            <button 
              className="btn-gradient"
              style={{ 
                fontWeight: 700,
                fontSize: '0.84rem',
                padding: '0.45rem 0.95rem'
              }}
              onClick={() => onNavigate ? onNavigate('/signup') : onOpenAuthModal?.()}
              title="Create a new account"
            >
              <UserPlus size={15} />
              <span>Sign Up</span>
            </button>
          </div>
        )}

        <button 
          className="btn-ghost"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          title="Toggle Light/Dark theme"
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>
    </header>
  );
}
