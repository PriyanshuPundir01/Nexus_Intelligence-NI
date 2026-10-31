import React, { useState, useRef } from 'react';
import confetti from 'canvas-confetti';
import { 
  X, 
  FileText, 
  Image as ImageIcon, 
  Link as LinkIcon, 
  UploadCloud, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle
} from 'lucide-react';


export default function SourceModal({ isOpen, onClose, onSourceAdded, token, guestSessionId }) {
  const [activeTab, setActiveTab] = useState('pdf'); // 'pdf' | 'image' | 'link'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [linkInput, setLinkInput] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const fileInputRef = useRef(null);

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
    if (!linkInput.trim()) {
      setError('Please enter a web or YouTube link.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const headers = getSessionHeaders({ 'Content-Type': 'application/json' });

      const res = await fetch('/api/ingest-link', {
        method: 'POST',
        headers,
        body: JSON.stringify({ url: linkInput.trim() })
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


  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Add Knowledge Source</h3>
          <button className="btn-ghost" style={{ padding: '0.4rem' }} onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Source Type Tabs */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', marginBottom: '1.5rem' }}>
          <button 
            type="button"
            className={`btn-ghost ${activeTab === 'pdf' ? 'primary' : ''}`}
            style={{ 
              justifyContent: 'center', 
              background: activeTab === 'pdf' ? 'var(--accent-primary)' : 'var(--bg-app)',
              color: activeTab === 'pdf' ? '#fff' : 'var(--text-secondary)',
              borderColor: activeTab === 'pdf' ? 'var(--accent-primary)' : 'var(--border-subtle)'
            }}
            onClick={() => { setActiveTab('pdf'); setSelectedFile(null); setImagePreview(null); setError(''); }}
          >
            <FileText size={16} /> PDF Document
          </button>

          <button 
            type="button"
            className={`btn-ghost ${activeTab === 'image' ? 'primary' : ''}`}
            style={{ 
              justifyContent: 'center', 
              background: activeTab === 'image' ? 'var(--accent-primary)' : 'var(--bg-app)',
              color: activeTab === 'image' ? '#fff' : 'var(--text-secondary)',
              borderColor: activeTab === 'image' ? 'var(--accent-primary)' : 'var(--border-subtle)'
            }}
            onClick={() => { setActiveTab('image'); setSelectedFile(null); setImagePreview(null); setError(''); }}
          >
            <ImageIcon size={16} /> Image / Diagram
          </button>

          <button 
            type="button"
            className={`btn-ghost ${activeTab === 'link' ? 'primary' : ''}`}
            style={{ 
              justifyContent: 'center', 
              background: activeTab === 'link' ? 'var(--accent-primary)' : 'var(--bg-app)',
              color: activeTab === 'link' ? '#fff' : 'var(--text-secondary)',
              borderColor: activeTab === 'link' ? 'var(--accent-primary)' : 'var(--border-subtle)'
            }}
            onClick={() => { setActiveTab('link'); setSelectedFile(null); setImagePreview(null); setError(''); }}
          >
            <LinkIcon size={16} /> Web / YouTube
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
              <UploadCloud size={40} style={{ color: 'var(--accent-primary)', margin: '0 auto 0.75rem auto' }} />
              <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '0.3rem' }}>
                {selectedFile ? selectedFile.name : 'Click to select or drop PDF file'}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                {selectedFile ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB • Ready to ingest` : 'Supports up to 100 MB • Multi-page text & tables'}
              </div>
              <input 
                ref={fileInputRef}
                type="file" 
                accept=".pdf" 
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
                <UploadCloud size={40} style={{ color: 'var(--accent-primary)', margin: '0 auto 0.75rem auto' }} />
              )}
              <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '0.3rem' }}>
                {selectedFile ? selectedFile.name : 'Select or drop an image, screenshot or diagram'}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                Gemini Vision will extract all OCR text, diagrams, and visual details into the vector store
              </div>
              <input 
                ref={fileInputRef}
                type="file" 
                accept="image/*" 
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

        {/* TAB 3: LINK / YOUTUBE */}
        {activeTab === 'link' && (
          <form onSubmit={handleIngestLink}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                URL to Ingest:
              </label>
              <input 
                type="url"
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
                placeholder="https://en.wikipedia.org/... or https://youtube.com/watch?v=..."
                value={linkInput}
                onChange={(e) => setLinkInput(e.target.value)}
              />
            </div>

            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', lineHeight: 1.5, background: 'var(--bg-app)', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-sm)' }}>
              💡 <strong>YouTube Links:</strong> Transcripts are extracted and semantic chunks are indexed into the knowledge base.<br/>
              🌐 <strong>Web Pages:</strong> HTML articles, documentation, and blog posts are scraped and indexed.
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

      </div>
    </div>
  );
}
