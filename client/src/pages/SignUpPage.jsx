import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  UserPlus,
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
  LogIn,
  Check
} from 'lucide-react';

export default function SignUpPage({
  onNavigate,
  onAuthSuccess,
  theme,
  setTheme,
  user,
  onLogout
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Password strength calculation
  const calculateStrength = (pass) => {
    if (!pass) return { score: 0, label: 'None', color: 'transparent', width: '0%' };
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 10) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass) || /[A-Z]/.test(pass)) score += 1;

    switch (score) {
      case 1:
        return { score: 1, label: 'Weak (min 6 chars)', color: '#f87171', width: '25%' };
      case 2:
        return { score: 2, label: 'Fair', color: '#fbbf24', width: '50%' };
      case 3:
        return { score: 3, label: 'Good', color: '#22d3ee', width: '75%' };
      case 4:
        return { score: 4, label: 'Strong & Secure', color: '#34d399', width: '100%' };
      default:
        return { score: 0, label: 'Too short', color: '#f87171', width: '15%' };
    }
  };

  const strength = calculateStrength(password);
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;
  const passwordsMismatch = confirmPassword.length > 0 && password !== confirmPassword;

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!name.trim()) {
      setError('Please enter your full name.');
      return;
    }

    if (!email.trim()) {
      setError('Please provide a valid email address.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-type your password.');
      return;
    }

    if (!agreeTerms) {
      setError('Please accept the Terms of Service to create an account.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Registration failed. Please try again.');
      }

      // Persist auth tokens
      localStorage.setItem('ni_token', data.token);
      localStorage.setItem('ni_user', JSON.stringify(data.user));

      setSuccess(`Welcome to Nexus Intelligence, ${data.user.name}! Account created.`);

      try {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 }
        });
      } catch (_) {}

      setTimeout(() => {
        onAuthSuccess(data.user, data.token);
        onNavigate('/');
      }, 800);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = () => {
    setName('Demo Explorer');
    setEmail(`explorer_${Math.floor(Math.random() * 8999 + 1000)}@nexus.ai`);
    setPassword('demoPass123!');
    setConfirmPassword('demoPass123!');
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
            onClick={() => onNavigate('/signin')}
          >
            <LogIn size={15} />
            <span>Sign In</span>
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
              <Sparkles size={14} /> Join Nexus Intelligence • Free Account
            </div>

            <h1 className="auth-hero-title">
              Supercharge your research with Multimodal AI
            </h1>

            <p className="auth-hero-desc">
              Create your account to unlock high-capacity document indexing, OCR visual reasoning, and instant YouTube transcript search powered by Google Gemini AI.
            </p>

            <div className="auth-feature-cards">
              <div className="auth-feature-item">
                <div className="auth-feature-icon-box" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' }}>
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <div className="auth-feature-title">Private & Scoped Knowledge Hub</div>
                  <div className="auth-feature-desc">All uploaded PDFs, images, and links are isolated and accessible only to your authenticated session.</div>
                </div>
              </div>

              <div className="auth-feature-item">
                <div className="auth-feature-icon-box" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
                  <Sparkles size={20} />
                </div>
                <div>
                  <div className="auth-feature-title">Accurate Citations & Passages</div>
                  <div className="auth-feature-desc">Every AI response includes exact chunk citations so you can verify sources instantly.</div>
                </div>
              </div>

              <div className="auth-feature-item">
                <div className="auth-feature-icon-box" style={{ background: 'rgba(244, 63, 94, 0.15)', color: '#f43f5e' }}>
                  <Zap size={20} />
                </div>
                <div>
                  <div className="auth-feature-title">Sub-second Vector Search</div>
                  <div className="auth-feature-desc">Smart chunking and TF-IDF similarity ranking matches your queries in milliseconds.</div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.5rem' }}>
              <CheckCircle2 size={16} color="var(--accent-emerald)" />
              <span>No credit card required. Instant account activation.</span>
            </div>
          </div>

          {/* Right Sign Up Form Card */}
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
                  You are currently logged in as <strong>{user.name}</strong> ({user.email}).
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <button
                    type="button"
                    className="btn-gradient"
                    style={{ justifyContent: 'center', padding: '0.85rem' }}
                    onClick={() => onNavigate('/')}
                  >
                    Go to Knowledge Hub
                  </button>
                  <button
                    type="button"
                    className="btn-ghost"
                    style={{ justifyContent: 'center', color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                    onClick={onLogout}
                  >
                    Create Another Account / Sign Out
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="auth-form-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-primary)', marginBottom: '0.4rem', fontWeight: 700, fontSize: '0.82rem' }}>
                    <UserPlus size={16} /> REGISTRATION
                  </div>
                  <h2>Create Your Account</h2>
                  <p>Start chatting with your documents, diagrams, and links in seconds.</p>
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
                <form onSubmit={handleSignUp} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  
                  {/* Full Name */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                      Full Name
                    </label>
                    <div className="auth-input-field-wrap">
                      <User size={17} className="auth-input-icon" />
                      <input
                        type="text"
                        required
                        autoComplete="name"
                        placeholder="e.g. Priyanshu Pundir"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="auth-input-styled"
                      />
                    </div>
                  </div>

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
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                      Create Password
                    </label>
                    <div className="auth-input-field-wrap">
                      <Lock size={17} className="auth-input-icon" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        autoComplete="new-password"
                        placeholder="At least 6 characters"
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

                    {/* Password Strength Meter */}
                    {password && (
                      <div className="auth-strength-container">
                        <div className="auth-strength-track">
                          <div 
                            className="auth-strength-indicator" 
                            style={{ width: strength.width, backgroundColor: strength.color }}
                          />
                        </div>
                        <div className="auth-strength-label">
                          <span>Strength: <strong style={{ color: strength.color }}>{strength.label}</strong></span>
                          <span>Min 6 characters</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                      <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                        Confirm Password
                      </label>
                      {passwordsMatch && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                          <Check size={12} /> Passwords match
                        </span>
                      )}
                      {passwordsMismatch && (
                        <span style={{ fontSize: '0.75rem', color: '#f87171' }}>
                          Passwords do not match
                        </span>
                      )}
                    </div>

                    <div className="auth-input-field-wrap">
                      <ShieldCheck size={17} className="auth-input-icon" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        autoComplete="new-password"
                        placeholder="Re-type password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="auth-input-styled"
                        style={{
                          borderColor: passwordsMatch ? 'var(--accent-emerald)' : passwordsMismatch ? '#f87171' : undefined
                        }}
                      />
                    </div>
                  </div>

                  {/* Terms Checkbox */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.55rem', marginTop: '0.2rem' }}>
                    <input
                      type="checkbox"
                      id="agreeTerms"
                      checked={agreeTerms}
                      onChange={(e) => setAgreeTerms(e.target.checked)}
                      style={{ cursor: 'pointer', accentColor: 'var(--accent-primary)', marginTop: '0.25rem' }}
                    />
                    <label htmlFor="agreeTerms" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', cursor: 'pointer', lineHeight: 1.45 }}>
                      I agree to the Nexus Intelligence terms of service, multimodal indexing policies, and local data isolation protocols.
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
                        <span>Creating Account...</span>
                      </>
                    ) : (
                      <>
                        <UserPlus size={17} />
                        <span>Create NI Account</span>
                      </>
                    )}
                  </button>
                </form>

                {/* Quick Demo Autofill */}
                <div style={{ marginTop: '1.15rem', display: 'flex', justifyContent: 'center' }}>
                  <button
                    type="button"
                    className="btn-ghost"
                    style={{ fontSize: '0.78rem', color: 'var(--accent-cyan)', borderColor: 'rgba(6, 182, 212, 0.35)', padding: '0.35rem 0.85rem' }}
                    onClick={handleQuickDemo}
                  >
                    <Zap size={14} /> Quick Fill Demo Registration
                  </button>
                </div>

                {/* Divider */}
                <div className="auth-divider-line">
                  <span>Already have an account?</span>
                </div>

                {/* Switch to Sign In */}
                <button
                  type="button"
                  className="btn-ghost"
                  style={{ width: '100%', justifyContent: 'center', padding: '0.75rem', fontWeight: 600, fontSize: '0.88rem' }}
                  onClick={() => onNavigate('/signin')}
                >
                  <LogIn size={16} />
                  <span>Sign In to Existing Account</span>
                </button>
              </>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}
