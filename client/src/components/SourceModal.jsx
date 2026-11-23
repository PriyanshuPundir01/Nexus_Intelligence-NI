import React, { useState, useRef, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  X, 
  FileText, 
  Image as ImageIcon, 
  Link as LinkIcon, 
  UploadCloud, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle,
  FileCode,
  Video,
  Globe,
  Sparkles
} from 'lucide-react';

export default function SourceModal({ isOpen, onClose, onSourceAdded, token, guestSessionId }) {
  const [activeTab, setActiveTab] = useState('pdf'); // 'pdf' | 'image' | 'link' | 'text'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [linkInput, setLinkInput] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // Raw text / code note state
  const [textTitle, setTextTitle] = useState('');
  const [textContent, setTextContent] = useState('');
  const [textType, setTextType] = useState('text'); // 'text' | 'code'

  const fileInputRef = useRef(null);

  // Support pasting image directly from clipboard (Ctrl+V) anywhere while modal is open
  useEffect(() => {
    if (!isOpen) return;

    const handlePaste = (e) => {
      if (e.clipboardData && e.clipboardData.items) {
        for (const item of e.clipboardData.items) {
          if (item.type.indexOf('image') !== -1) {
            const file = item.getAsFile();
            if (file) {
              setActiveTab('image');
              setSelectedFile(file);
              setError('');
              const reader = new FileReader();
              reader.onload = (event) => setImagePreview(event.target.result);
              reader.readAsDataURL(file);
              break;
            }
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isOpen]);

  if (!isOpen) return null;

  const getSessionHeaders = (extraHeaders = {}) => {
    const headers = { ...extraHeaders };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    } else if (guestSessionId) {
      headers['X-Guest-Session'] = guestSessionId;
    }
    return headers;
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSelectedFile(file);
    setError('');

    if (activeTab === 'image') {
      const reader = new FileReader();
      reader.onload = (event) => setImagePreview(event.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleUploadPDF = async () => {
    if (!selectedFile) {
      setError('Please select a PDF file to upload.');
      return;
    }

    setLoading(true);
    setError('');
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const headers = getSessionHeaders();

      const res = await fetch('/api/ingest-pdf', {
        method: 'POST',
        headers,
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to upload PDF');

      try { confetti({ particleCount: 50, spread: 50 }); } catch (_) {}
      onSourceAdded(data.source);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadImage = async () => {
    if (!selectedFile) {
      setError('Please select an image file to upload.');
      return;
    }

    setLoading(true);
    setError('');
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const headers = getSessionHeaders();

      const res = await fetch('/api/ingest-image', {
        method: 'POST',
        headers,
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to analyze image');

      try { confetti({ particleCount: 50, spread: 50 }); } catch (_) {}
      onSourceAdded(data.source);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleIngestLink = async (e) => {
    e.preventDefault();
    let url = linkInput.trim();
    if (!url) {
      setError('Please enter a web page or YouTube link.');
      return;
    }

    if (!/^https?:\/\//i.test(url)) {
      url = 'https://' + url;
    }

    setLoading(true);
    setError('');

    try {
      const headers = getSessionHeaders({ 'Content-Type': 'application/json' });

      const res = await fetch('/api/ingest-link', {
        method: 'POST',
        headers,
        body: JSON.stringify({ url })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to ingest link');

      try { confetti({ particleCount: 50, spread: 50 }); } catch (_) {}
      onSourceAdded(data.source);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleIngestText = async (e) => {
    e.preventDefault();
    if (!textContent.trim()) {
      setError('Please paste text or code content to index.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const headers = getSessionHeaders({ 'Content-Type': 'application/json' });

      const res = await fetch('/api/ingest-text', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          title: textTitle.trim() || (textType === 'code' ? 'Code Snippet' : 'Note'),
          text: textContent.trim(),
          type: textType
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to index text');

      try { confetti({ particleCount: 50, spread: 50 }); } catch (_) {}
      onSourceAdded(data.source);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: '580px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Add Knowledge Source</h3>
          <button className="btn-ghost" style={{ padding: '0.4rem' }} onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Source Type Tabs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.4rem', marginBottom: '1.25rem' }}>
          <button 
            type="button"
            className={`btn-ghost ${activeTab === 'pdf' ? 'primary' : ''}`}
            style={{ 
              justifyContent: 'center', 
              fontSize: '0.8rem',
              padding: '0.5rem 0.3rem',
              background: activeTab === 'pdf' ? 'var(--accent-primary)' : 'var(--bg-app)',
              color: activeTab === 'pdf' ? '#fff' : 'var(--text-secondary)',
              borderColor: activeTab === 'pdf' ? 'var(--accent-primary)' : 'var(--border-subtle)'
            }}
            onClick={() => { setActiveTab('pdf'); setSelectedFile(null); setImagePreview(null); setError(''); }}
          >
            <FileText size={14} /> PDF
          </button>

          <button 
            type="button"
            className={`btn-ghost ${activeTab === 'image' ? 'primary' : ''}`}
            style={{ 
              justifyContent: 'center', 
              fontSize: '0.8rem',
              padding: '0.5rem 0.3rem',
              background: activeTab === 'image' ? 'var(--accent-primary)' : 'var(--bg-app)',
              color: activeTab === 'image' ? '#fff' : 'var(--text-secondary)',
              borderColor: activeTab === 'image' ? 'var(--accent-primary)' : 'var(--border-subtle)'
            }}
            onClick={() => { setActiveTab('image'); setSelectedFile(null); setImagePreview(null); setError(''); }}
          >
            <ImageIcon size={14} /> Image
          </button>

          <button 
            type="button"
            className={`btn-ghost ${activeTab === 'link' ? 'primary' : ''}`}
            style={{ 
              justifyContent: 'center', 
              fontSize: '0.8rem',
              padding: '0.5rem 0.3rem',
              background: activeTab === 'link' ? 'var(--accent-primary)' : 'var(--bg-app)',
              color: activeTab === 'link' ? '#fff' : 'var(--text-secondary)',
              borderColor: activeTab === 'link' ? 'var(--accent-primary)' : 'var(--border-subtle)'
            }}
            onClick={() => { setActiveTab('link'); setSelectedFile(null); setImagePreview(null); setError(''); }}
          >
            <LinkIcon size={14} /> Link / YT
          </button>

          <button 
            type="button"
            className={`btn-ghost ${activeTab === 'text' ? 'primary' : ''}`}
            style={{ 
              justifyContent: 'center', 
              fontSize: '0.8rem',
              padding: '0.5rem 0.3rem',
              background: activeTab === 'text' ? 'var(--accent-primary)' : 'var(--bg-app)',
              color: activeTab === 'text' ? '#fff' : 'var(--text-secondary)',
              borderColor: activeTab === 'text' ? 'var(--accent-primary)' : 'var(--border-subtle)'
            }}
            onClick={() => { setActiveTab('text'); setSelectedFile(null); setImagePreview(null); setError(''); }}
          >
            <FileCode size={14} /> Notes / Code
          </button>
        </div>

        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 'var(--radius-sm)', color: '#f87171', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {/* TAB 1: PDF */}
        {activeTab === 'pdf' && (
          <div>
            <div 
              className="dropzone"
              onClick={() => fileInputRef.current?.click()}
            >
              <UploadCloud size={38} style={{ color: 'var(--accent-primary)', margin: '0 auto 0.75rem auto' }} />
              <div style={{ fontWeight: 600, fontSize: '0.92rem', marginBottom: '0.3rem' }}>
                {selectedFile ? selectedFile.name : 'Click to select or drop a PDF file'}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                {selectedFile ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB • Ready to ingest` : 'Supports up to 25 MB • Multi-page text, tables & technical documents'}
              </div>
              <input 
                ref={fileInputRef}
                type="file" 
                accept=".pdf,application/pdf" 
                style={{ display: 'none' }} 
                onChange={handleFileChange}
              />
            </div>

            <button 
              className="btn-gradient" 
              style={{ width: '100%', marginTop: '1.25rem', justifyContent: 'center' }}
              disabled={loading || !selectedFile}
              onClick={handleUploadPDF}
            >
              {loading ? (
                <>
                  <RefreshCw size={16} className="animate-spin" /> Ingesting & Chunking PDF...
                </>
              ) : (
                'Process & Index PDF'
              )}
            </button>
          </div>
        )}

        {/* TAB 2: IMAGE */}
        {activeTab === 'image' && (
          <div>
            <div 
              className="dropzone"
              onClick={() => fileInputRef.current?.click()}
            >
              {imagePreview ? (
                <div style={{ maxHeight: '180px', overflow: 'hidden', borderRadius: 'var(--radius-sm)', marginBottom: '0.5rem' }}>
                  <img src={imagePreview} alt="Preview" style={{ maxHeight: '180px', width: 'auto', objectFit: 'contain' }} />
                </div>
              ) : (
                <UploadCloud size={38} style={{ color: 'var(--accent-primary)', margin: '0 auto 0.75rem auto' }} />
              )}
              <div style={{ fontWeight: 600, fontSize: '0.92rem', marginBottom: '0.3rem' }}>
                {selectedFile ? selectedFile.name : 'Click to select, drop image, or paste with Ctrl+V'}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                Supports PNG, JPG, WebP, GIF, BMP • Gemini Vision OCR extracts text, diagrams & charts
              </div>
              <input 
                ref={fileInputRef}
                type="file" 
                accept="image/png,image/jpeg,image/webp,image/gif,image/bmp,image/*" 
                style={{ display: 'none' }} 
                onChange={handleFileChange}
              />
            </div>

            <button 
              className="btn-gradient" 
              style={{ width: '100%', marginTop: '1.25rem', justifyContent: 'center' }}
              disabled={loading || !selectedFile}
              onClick={handleUploadImage}
            >
              {loading ? (
                <>
                  <RefreshCw size={16} className="animate-spin" /> Running Gemini Multimodal Vision Analysis...
                </>
              ) : (
                'Analyze & Index Image'
              )}
            </button>
          </div>
        )}

        {/* TAB 3: LINK / YOUTUBE / APPS */}
        {activeTab === 'link' && (
          <form onSubmit={handleIngestLink}>
            <div style={{ marginBottom: '0.75rem' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                URL to Ingest:
              </label>
              <input 
                type="text"
                required
                className="form-input"
                style={{
                  width: '100%',
                  background: 'var(--bg-app)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.75rem 1rem',
                  color: 'var(--text-primary)',
                  fontSize: '0.9rem',
                  outline: 'none'
                }}
                placeholder="youtube.com/watch?v=... or wikipedia.org/... or github.com/..."
                value={linkInput}
                onChange={(e) => setLinkInput(e.target.value)}
              />
            </div>

            {/* Quick App Badges */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1rem' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.74rem', background: 'rgba(239, 68, 68, 0.12)', color: '#f87171', padding: '0.2rem 0.55rem', borderRadius: 'var(--radius-full)' }}>
                <Video size={12} /> YouTube Transcripts
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.74rem', background: 'rgba(56, 189, 248, 0.12)', color: '#38bdf8', padding: '0.2rem 0.55rem', borderRadius: 'var(--radius-full)' }}>
                <Globe size={12} /> Web Articles & Blogs
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.74rem', background: 'rgba(52, 211, 153, 0.12)', color: '#34d399', padding: '0.2rem 0.55rem', borderRadius: 'var(--radius-full)' }}>
                <Sparkles size={12} /> Documentation & Wikis
              </span>
            </div>

            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', lineHeight: 1.5, background: 'var(--bg-app)', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-sm)' }}>
              🎥 <strong>YouTube:</strong> Fetches verified transcripts and video breakdowns automatically.<br/>
              🌐 <strong>Web Pages & Apps:</strong> Cleans scripts and scrapes main content for RAG indexing.
            </div>

            <button 
              type="submit"
              className="btn-gradient" 
              style={{ width: '100%', justifyContent: 'center' }}
              disabled={loading || !linkInput.trim()}
            >
              {loading ? (
                <>
                  <RefreshCw size={16} className="animate-spin" /> Fetching & Indexing Link Content...
                </>
              ) : (
                'Scrape & Index Link'
              )}
            </button>
          </form>
        )}

        {/* TAB 4: RAW TEXT / CODE / NOTES */}
        {activeTab === 'text' && (
          <form onSubmit={handleIngestText}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Title / Subject:
                </label>
                <input 
                  type="text"
                  className="form-input"
                  style={{
                    width: '100%',
                    background: 'var(--bg-app)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.65rem 0.85rem',
                    color: 'var(--text-primary)',
                    fontSize: '0.88rem',
                    outline: 'none'
                  }}
                  placeholder="e.g. Architecture Overview, Meeting Notes"
                  value={textTitle}
                  onChange={(e) => setTextTitle(e.target.value)}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Format:
                </label>
                <select
                  value={textType}
                  onChange={(e) => setTextType(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'var(--bg-app)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.65rem 0.85rem',
                    color: 'var(--text-primary)',
                    fontSize: '0.88rem',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <option value="text">📝 Notes / Markdown</option>
                  <option value="code">💻 Code / Script</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                Content to Index:
              </label>
              <textarea 
                required
                rows={6}
                className="form-input"
                style={{
                  width: '100%',
                  background: 'var(--bg-app)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.75rem 0.85rem',
                  color: 'var(--text-primary)',
                  fontSize: '0.88rem',
                  fontFamily: textType === 'code' ? 'var(--font-mono)' : 'inherit',
                  outline: 'none',
                  resize: 'vertical'
                }}
                placeholder={textType === 'code' ? "Paste source code, SQL, config, JSON, or scripts here..." : "Paste meeting notes, emails, Notion content, documentation, or study notes..."}
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
              />
            </div>

            <button 
              type="submit"
              className="btn-gradient" 
              style={{ width: '100%', justifyContent: 'center' }}
              disabled={loading || !textContent.trim()}
            >
              {loading ? (
                <>
                  <RefreshCw size={16} className="animate-spin" /> Chunking & Indexing Content...
                </>
              ) : (
                'Index Notes & Code'
              )}
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
