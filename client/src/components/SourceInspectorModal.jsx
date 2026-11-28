import React, { useState, useEffect } from 'react';
import {
  X,
  FileText,
  Image as ImageIcon,
  Link as LinkIcon,
  FileCode,
  Copy,
  Check,
  ExternalLink
} from 'lucide-react';

function isSafeHttpUrl(url) {
  return typeof url === 'string' && /^https?:\/\//i.test(url.trim());
}

export default function SourceInspectorModal({ 
  isOpen, 
  onClose, 
  source, 
  token, 
  guestSessionId 
}) {
  const [chunks, setChunks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);

  useEffect(() => {
    if (!isOpen || !source) {
      return;
    }

    const fetchChunks = async () => {
      setLoading(true);
      try {
        const headers = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;
        else if (guestSessionId) headers['X-Guest-Session'] = guestSessionId;

        const res = await fetch(`/api/sources/${source.id}/chunks`, { headers });
        if (res.ok) {
          const data = await res.json();
          setChunks(data.chunks || []);
        }
      } catch {
        setChunks([]);
      } finally {
        setLoading(false);
      }
    };

    fetchChunks();
  }, [isOpen, source, token, guestSessionId]);

  if (!isOpen || !source) return null;

  const handleCopyChunk = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 60 }}>
      <div 
        className="modal-card" 
        onClick={e => e.stopPropagation()} 
        style={{ maxWidth: '680px', width: '92%', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}
      >
        {/* Header */}
        <div className="modal-header" style={{ paddingBottom: '0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', overflow: 'hidden' }}>
            <span className={`source-badge ${source.type}`}>
              {source.type === 'pdf' && <FileText size={12} />}
              {source.type === 'image' && <ImageIcon size={12} />}
              {source.type === 'link' && <LinkIcon size={12} />}
              {(source.type === 'text' || source.type === 'code') && <FileCode size={12} />}
              {source.type.toUpperCase()}
            </span>
            <div style={{ overflow: 'hidden' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {source.name}
              </h3>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                {source.chunkCount} vector chunks • Added {source.timestamp}
              </div>
            </div>
          </div>
          <button className="composer-btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* URL / Origin link if available */}
        {isSafeHttpUrl(source.url) && (
          <div style={{ padding: '0.5rem 1.5rem', background: 'var(--bg-app)', borderBottom: '1px solid var(--border-subtle)', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Origin URL:</span>
            <a href={source.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-cyan)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {source.url} <ExternalLink size={12} />
            </a>
          </div>
        )}

        {/* Chunks List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Loading indexed passages from vector store...
            </div>
          ) : chunks.length === 0 ? (
            <div style={{ padding: '1rem', background: 'var(--bg-app)', borderRadius: 'var(--radius-sm)', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              <em>Preview: "{source.preview || 'No excerpt available'}"</em>
            </div>
          ) : (
            chunks.map((c, i) => (
              <div 
                key={c.id || i}
                style={{
                  background: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.85rem'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent-primary)', background: 'rgba(99, 102, 241, 0.12)', padding: '0.15rem 0.5rem', borderRadius: '4px' }}>
                    Vector Chunk #{i + 1}
                  </span>
                  <button
                    className="composer-btn-icon"
                    style={{ width: '24px', height: '24px' }}
                    onClick={() => handleCopyChunk(c.text, i)}
                    title="Copy passage text"
                  >
                    {copiedIndex === i ? <Check size={12} style={{ color: '#10b981' }} /> : <Copy size={12} />}
                  </button>
                </div>
                <div style={{ fontSize: '0.82rem', lineHeight: 1.6, color: 'var(--text-primary)', whiteSpace: 'pre-wrap', fontFamily: source.type === 'code' ? 'var(--font-mono)' : 'inherit' }}>
                  {c.text}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '0.85rem 1.5rem', borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-app)', display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn-ghost" onClick={onClose} style={{ fontSize: '0.82rem' }}>
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
}