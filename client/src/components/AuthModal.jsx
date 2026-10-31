import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  X,
  Mail,
  Lock,
  User,
  ShieldCheck,
  LogIn,
  UserPlus,
  AlertCircle,
  RefreshCw,
  Sparkles,
  Zap
} from 'lucide-react';

export default function AuthModal({
  isOpen,
  onClose,
  onAuthSuccess
}) {
  const [mode, setMode] = useState('signin'); // 'signin' or 'signup'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (mode === 'signup') {
      if (!name.trim()) {
        setError('Please enter your full name.');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters long.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
    }

    setLoading(true);

    try {
      const endpoint = mode === 'signup' ? '/api/auth/signup' : '/api/auth/signin';
      const payload = mode === 'signup'
        ? { name: name.trim(), email: email.trim(), password }
        : { email: email.trim(), password };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      // Store in localStorage
      localStorage.setItem('ni_token', data.token);
      localStorage.setItem('ni_user', JSON.stringify(data.user));

      try {
        confetti({
          particleCount: 60,
          spread: 60,
          origin: { y: 0.6 }
        });
      } catch (_) { }

      onAuthSuccess(data.user, data.token);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = () => {
    setName('Nexus Demo User');
    setEmail('demo@nexus.ai');
    setPassword('DemoUser2026!');
    setConfirmPassword('DemoUser2026!');
    setError('');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div className="brand-badge-icon" style={{ width: '32px', height: '32px', fontSize: '0.85rem' }}>
              NI
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>
                {mode === 'signin' ? 'Sign In to Nexus Intelligence' : 'Create NI Account'}
              </h3>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                {mode === 'signin' ? 'Access your private multimodal knowledge vault' : 'Start chatting with PDFs, Images, and Links'}
              </div>
            </div>
          </div>

          <button className="btn-ghost" style={{ padding: '0.35rem' }} onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {/* Mode Switch Tabs */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem', background: 'var(--bg-app)', padding: '0.3rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.25rem', border: '1px solid var(--border-subtle)' }}>
          <button
            type="button"
            className="btn-ghost"
            style={{
              justifyContent: 'center',
              background: mode === 'signin' ? 'var(--accent-primary)' : 'transparent',
              color: mode === 'signin' ? '#fff' : 'var(--text-secondary)',
              border: 'none',
              fontWeight: 600
            }}
            onClick={() => { setMode('signin'); setError(''); }}
          >
            <LogIn size={15} /> Sign In
          </button>

          <button
            type="button"
            className="btn-ghost"
            style={{
              justifyContent: 'center',
              background: mode === 'signup' ? 'var(--accent-primary)' : 'transparent',
              color: mode === 'signup' ? '#fff' : 'var(--text-secondary)',
              border: 'none',
              fontWeight: 600
            }}
            onClick={() => { setMode('signup'); setError(''); }}
          >
            <UserPlus size={15} /> Sign Up
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 0.85rem', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 'var(--radius-sm)', color: '#f87171', fontSize: '0.82rem', marginBottom: '1rem' }}>
            <AlertCircle size={15} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>

          {/* Full Name for Sign Up */}
          {mode === 'signup' && (
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                Full Name
              </label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  required
                  placeholder="e.g. Priyanshu Pundir"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'var(--bg-app)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.65rem 0.85rem 0.65rem 2.4rem',
                    color: 'var(--text-primary)',
                    fontSize: '0.88rem',
                    outline: 'none'
                  }}
                />
              </div>
            </div>
          )}

          {/* Email */}
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
              Email Address
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: '100%',
                  background: 'var(--bg-app)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.65rem 0.85rem 0.65rem 2.4rem',
                  color: 'var(--text-primary)',
                  fontSize: '0.88rem',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  background: 'var(--bg-app)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.65rem 0.85rem 0.65rem 2.4rem',
                  color: 'var(--text-primary)',
                  fontSize: '0.88rem',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          {/* Confirm Password for Sign Up */}
          {mode === 'signup' && (
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                Confirm Password
              </label>
              <div style={{ position: 'relative' }}>
                <ShieldCheck size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'var(--bg-app)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.65rem 0.85rem 0.65rem 2.4rem',
                    color: 'var(--text-primary)',
                    fontSize: '0.88rem',
                    outline: 'none'
                  }}
                />
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className="btn-gradient"
            style={{ width: '100%', padding: '0.75rem', justifyContent: 'center', marginTop: '0.5rem', fontWeight: 700 }}
            disabled={loading}
          >
            {loading ? (
              <>
                <RefreshCw size={16} className="animate-spin" /> Authenticating...
              </>
            ) : mode === 'signin' ? (
              <>
                <LogIn size={16} /> Sign In to Nexus Intelligence
              </>
            ) : (
              <>
                <UserPlus size={16} /> Create Account
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Fill Helper */}
        <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button
            type="button"
            className="btn-ghost"
            style={{ fontSize: '0.76rem', padding: '0.3rem 0.65rem', color: 'var(--accent-cyan)' }}
            onClick={handleQuickDemo}
          >
            <Zap size={13} /> Quick Fill Demo Credentials
          </button>

          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            BCrypt + JWT Secured
          </span>
        </div>

      </div>
    </div>
  );
}
