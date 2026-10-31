import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Zap,
  RefreshCw,
  FileText,
  Image as ImageIcon,
  Link as LinkIcon,
  ShieldCheck,
  Sparkles,
  Sun,
  Moon,
  UserPlus
} from 'lucide-react';

export default function SignInPage({
  onNavigate,
  onAuthSuccess,
  theme,
  setTheme,
  user,
  onLogout
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email.trim() || !password) {
      setError('Please provide both your email address and password.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          password
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Invalid credentials. Please verify and try again.');
      }

      // Persist auth tokens
      localStorage.setItem('ni_token', data.token);
      localStorage.setItem('ni_user', JSON.stringify(data.user));

      setSuccess('Signed in successfully! Redirecting to Knowledge Hub...');

      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (_) {}

      setTimeout(() => {
        onAuthSuccess(data.user, data.token);
        onNavigate('/');
      }, 700);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = () => {
    setEmail('demo@nexus.ai');
    setPassword('DemoUser2026!');
    setError('');
  };

  return (
    <div className="auth-page-root">
      <div className="ambient-glow" />

      {/* Top Utility Header */}
      <header className="auth-topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            type="button"
            className="btn-ghost"
            style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.85rem' }}
            onClick={() => onNavigate('/')}
            title="Return to Knowledge Hub"
          >
            <ArrowLeft size={16} />
            <span>Back to Hub</span>
          </button>

          <div
            style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', cursor: 'pointer' }}
            onClick={() => onNavigate('/')}
          >
            <div className="brand-badge-icon" style={{ width: '32px', height: '32px', fontSize: '0.85rem' }}>
              NI
            </div>
            <div style={{ fontWeight: 800, fontSize: '1.05rem', letterSpacing: '-0.01em' }}>
              Nexus Intelligence
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            type="button"
            className="btn-ghost"
            style={{ fontSize: '0.84rem' }}
            onClick={() => onNavigate('/signup')}
          >
            <UserPlus size={15} />
            <span>Create Account</span>
          </button>

          <button
            type="button"
            className="btn-ghost"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            title="Toggle theme"
            style={{ padding: '0.45rem' }}
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="auth-content-container">
        <div className="auth-layout-grid">

          {/* Left Showcase Hero */}
          <div className="auth-hero-showcase">
            <div className="auth-badge-pill">
              <Sparkles size={14} /> Nexus Intelligence • Secure Sign In
            </div>

            <h1 className="auth-hero-title">
              Sign in to your Multimodal Knowledge Vault
            </h1>

            <p className="auth-hero-desc">
              Access your indexed PDFs, analyzed diagrams, and indexed YouTube transcripts. Your personal knowledge base is synchronized and protected with military-grade encryption.
            </p>

            <div className="auth-feature-cards">
              <div className="auth-feature-item">
                <div className="auth-feature-icon-box" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171' }}>
                  <FileText size={20} />
                </div>
                <div>
                  <div className="auth-feature-title">PDF Document Synthesis</div>
                  <div className="auth-feature-desc">Ingest dense research papers, whitepapers, and manuals with instant passage citations.</div>
                </div>
              </div>

              <div className="auth-feature-item">
                <div className="auth-feature-icon-box" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
                  <ImageIcon size={20} />
                </div>
                <div>
                  <div className="auth-feature-title">Diagram & Visual OCR Analysis</div>
                  <div className="auth-feature-desc">Query technical architecture charts, screenshots, and infographics using Gemini Multimodal Vision.</div>
                </div>
              </div>

              <div className="auth-feature-item">
                <div className="auth-feature-icon-box" style={{ background: 'rgba(6, 182, 212, 0.15)', color: '#22d3ee' }}>
                  <LinkIcon size={20} />
                </div>
                <div>
                  <div className="auth-feature-title">YouTube & Web Intelligence</div>
                  <div className="auth-feature-desc">Extract complete video transcripts and web content for instant semantic question-answering.</div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.5rem' }}>
              <ShieldCheck size={16} color="var(--accent-emerald)" />
              <span>Session encrypted with BCrypt hashing and secure JWT authentication.</span>
            </div>
          </div>

          {/* Right Sign In Form Card */}
          <div className="auth-card-panel">
            {/* If user is already authenticated */}
            {user ? (
              <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                <div style={{ 
                  width: '54px', 
                  height: '54px', 
                  borderRadius: '50%', 
                  background: 'var(--accent-gradient)', 
                  color: '#fff', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  fontWeight: 800, 
                  fontSize: '1.25rem',
                  margin: '0 auto 1rem'
                }}>
                  {user.name ? user.name[0].toUpperCase() : 'U'}
                </div>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '0.35rem' }}>
                  You are already signed in
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '1.5rem' }}>
                  Signed in as <strong>{user.name}</strong> ({user.email})
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <button
                    type="button"
                    className="btn-gradient"
                    style={{ justifyContent: 'center', padding: '0.85rem' }}
                    onClick={() => onNavigate('/')}
                  >
                    Continue to Knowledge Hub
                  </button>
                  <button
                    type="button"
                    className="btn-ghost"
                    style={{ justifyContent: 'center', color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                    onClick={onLogout}
                  >
                    Switch Account / Sign Out
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="auth-form-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-primary)', marginBottom: '0.4rem', fontWeight: 700, fontSize: '0.82rem' }}>
                    <LogIn size={16} /> SECURE LOGIN
                  </div>
                  <h2>Sign in to Nexus Intelligence</h2>
                  <p>Enter your email and password to access your knowledge hub.</p>
                </div>

                {/* Alerts */}
                {error && (
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.55rem', 
                    padding: '0.75rem 0.95rem', 
                    background: 'rgba(239, 68, 68, 0.15)', 
                    border: '1px solid rgba(239, 68, 68, 0.35)', 
                    borderRadius: 'var(--radius-sm)', 
                    color: '#f87171', 
                    fontSize: '0.84rem', 
                    marginBottom: '1.25rem' 
                  }}>
                    <AlertCircle size={17} style={{ flexShrink: 0 }} />
                    <span>{error}</span>
                  </div>
                )}

                {success && (
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.55rem', 
                    padding: '0.75rem 0.95rem', 
                    background: 'rgba(16, 185, 129, 0.15)', 
                    border: '1px solid rgba(16, 185, 129, 0.35)', 
                    borderRadius: 'var(--radius-sm)', 
                    color: '#34d399', 
                    fontSize: '0.84rem', 
                    marginBottom: '1.25rem' 
                  }}>
                    <CheckCircle2 size={17} style={{ flexShrink: 0 }} />
                    <span>{success}</span>
                  </div>
                )}

                {/* Form */}
                <form onSubmit={handleSignIn} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                  
                  {/* Email */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                      Email Address
                    </label>
                    <div className="auth-input-field-wrap">
                      <Mail size={17} className="auth-input-icon" />
                      <input
                        type="email"
                        required
                        autoComplete="email"
                        placeholder="name@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="auth-input-styled"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                      <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                        Password
                      </label>
                      <span 
                        style={{ fontSize: '0.76rem', color: 'var(--accent-primary)', cursor: 'pointer' }}
                        onClick={() => alert('For password resets in local mode, you can sign up with a new account or use Quick Demo.')}
                      >
                        Forgot password?
                      </span>
                    </div>

                    <div className="auth-input-field-wrap">
                      <Lock size={17} className="auth-input-icon" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        autoComplete="current-password"
                        placeholder="••••••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="auth-input-styled"
                        style={{ paddingRight: '2.5rem' }}
                      />
                      <button
                        type="button"
                        className="auth-input-toggle-btn"
                        onClick={() => setShowPassword(!showPassword)}
                        title={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Remember Me Checkbox */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                    <input
                      type="checkbox"
                      id="rememberMe"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      style={{ cursor: 'pointer', accentColor: 'var(--accent-primary)' }}
                    />
                    <label htmlFor="rememberMe" style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                      Keep me signed in for 7 days
                    </label>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    className="btn-gradient"
                    style={{ width: '100%', padding: '0.85rem', justifyContent: 'center', fontWeight: 700, fontSize: '0.95rem', marginTop: '0.4rem' }}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <RefreshCw size={17} className="animate-spin" />
                        <span>Verifying Credentials...</span>
                      </>
                    ) : (
                      <>
                        <LogIn size={17} />
                        <span>Sign In to Nexus</span>
                      </>
                    )}
                  </button>
                </form>

                {/* Quick Demo Autofill */}
                <div style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'center' }}>
                  <button
                    type="button"
                    className="btn-ghost"
                    style={{ fontSize: '0.78rem', color: 'var(--accent-cyan)', borderColor: 'rgba(6, 182, 212, 0.35)', padding: '0.35rem 0.85rem' }}
                    onClick={handleQuickDemo}
                  >
                    <Zap size={14} /> Quick Fill Demo Credentials
                  </button>
                </div>

                {/* Divider */}
                <div className="auth-divider-line">
                  <span>Don't have an account yet?</span>
                </div>

                {/* Switch to Sign Up */}
                <button
                  type="button"
                  className="btn-ghost"
                  style={{ width: '100%', justifyContent: 'center', padding: '0.75rem', fontWeight: 600, fontSize: '0.88rem' }}
                  onClick={() => onNavigate('/signup')}
                >
                  <UserPlus size={16} />
                  <span>Create a New NI Account</span>
                </button>
              </>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}
