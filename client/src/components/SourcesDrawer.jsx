import React, { useState } from 'react';
import { 
  FileText, 
  Image as ImageIcon, 
  Link as LinkIcon, 
  Trash2, 
  ChevronRight, 
  Layers, 
  Sparkles, 
  ExternalLink,
  BookOpen
} from 'lucide-react';

export default function SourcesDrawer({ 
  sources = [], 
  onDeleteSource, 
  onOpenAddModal 
}) {
  const [expandedId, setExpandedId] = useState(null);

  return (
    <aside className="sources-sidebar">
      <div className="sources-sidebar-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Layers size={18} style={{ color: 'var(--accent-primary)' }} />
          <span style={{ fontSize: '0.92rem', fontWeight: 700 }}>Knowledge Sources</span>
        </div>
        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', background: 'var(--bg-app)', padding: '0.2rem 0.5rem', borderRadius: 'var(--radius-full)', border: '1px solid var(--border-subtle)' }}>
          {sources.length} Total
        </span>
      </div>

      <div className="sources-list">
        {sources.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
            <BookOpen size={36} style={{ margin: '0 auto 0.75rem auto', opacity: 0.5 }} />
            <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
              No Knowledge Loaded
            </div>
            <p style={{ fontSize: '0.78rem', lineHeight: 1.5, marginBottom: '1.25rem' }}>
              Add a PDF, upload an image, or paste a link to start querying your data.
            </p>
            <button 
              className="btn-gradient" 
              style={{ width: '100%', fontSize: '0.8rem', justifyContent: 'center' }}
              onClick={onOpenAddModal}
            >
              + Add First Source
            </button>
          </div>
        ) : (
          sources.map((src) => {
            const isExpanded = expandedId === src.id;
            return (
              <div key={src.id} className="source-item-card">
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
                    <span className={`source-badge ${src.type}`}>
                      {src.type === 'pdf' && <FileText size={11} />}
                      {src.type === 'image' && <ImageIcon size={11} />}
                      {src.type === 'link' && <LinkIcon size={11} />}
                      {src.type}
                    </span>
                    <span 
                      style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', cursor: 'pointer' }}
                      title={src.name}
                      onClick={() => setExpandedId(isExpanded ? null : src.id)}
                    >
                      {src.name}
                    </span>
                  </div>

                  <button 
                    className="composer-btn-icon" 
                    style={{ width: '26px', height: '26px', color: '#ef4444' }}
                    title="Remove from knowledge base"
                    onClick={() => onDeleteSource(src.id)}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                  <span>{src.chunkCount} vector chunks</span>
                  <span>{src.timestamp}</span>
                </div>

                {isExpanded && src.preview && (
                  <div style={{ marginTop: '0.65rem', paddingTop: '0.65rem', borderTop: '1px dashed var(--border-subtle)', fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.2rem' }}>Indexed Preview:</div>
                    <em>"{src.preview}"</em>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <div style={{ padding: '0.85rem 1.25rem', borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-app)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
        <span>Retrieval: <strong>top-k=4 chunks</strong></span>
        <span>Model: <strong>Gemini Flash</strong></span>
      </div>
    </aside>
  );
}
