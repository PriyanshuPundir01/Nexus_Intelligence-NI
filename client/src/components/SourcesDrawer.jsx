import React, { useState } from 'react';
import { 
  FileText, 
  Image as ImageIcon, 
  Link as LinkIcon, 
  FileCode,
  Trash2, 
  CheckSquare,
  Square,
  Eye,
  Layers, 
  Sparkles, 
  ExternalLink,
  BookOpen,
  Plus,
  Check
} from 'lucide-react';

export default function SourcesDrawer({ 
  sources = [], 
  selectedSourceIds = [],
  onToggleSelectSource,
  onSelectAllSources,
  onClearSelection,
  onDeleteSource, 
  onOpenAddModal,
  onInspectSource
}) {
  const [expandedId, setExpandedId] = useState(null);

  return (
    <aside className="sources-sidebar">
      {/* Sidebar Header */}
      <div className="sources-sidebar-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Layers size={18} style={{ color: 'var(--accent-primary)' }} />
          <span style={{ fontSize: '0.92rem', fontWeight: 800 }}>Sources</span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <button
            onClick={onOpenAddModal}
            className="btn-ghost"
            style={{ padding: '0.25rem 0.55rem', fontSize: '0.75rem', gap: '0.25rem' }}
            title="Add new PDF, image, link, or note"
          >
            <Plus size={13} /> Add
          </button>
          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', background: 'var(--bg-app)', padding: '0.2rem 0.5rem', borderRadius: 'var(--radius-full)', border: '1px solid var(--border-subtle)' }}>
            {sources.length} Total
          </span>
        </div>
      </div>

      {/* Sources Selection Controls & Stats */}
      {sources.length > 0 && (
        <div style={{
          padding: '0.65rem 1.1rem',
          background: 'var(--bg-app)',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.75rem'
        }}>
          <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>
            <strong style={{ color: selectedSourceIds.length > 0 ? 'var(--accent-cyan)' : 'var(--text-muted)' }}>
              {selectedSourceIds.length}
            </strong> of {sources.length} active
          </span>

          <div style={{ display: 'flex', gap: '0.4rem' }}>
            <button
              onClick={onSelectAllSources}
              className="btn-ghost"
              style={{ padding: '0.15rem 0.45rem', fontSize: '0.7rem' }}
              title="Select all sources for querying"
            >
              Select All
            </button>
            <button
              onClick={onClearSelection}
              className="btn-ghost"
              style={{ padding: '0.15rem 0.45rem', fontSize: '0.7rem' }}
              title="Deselect all sources"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Sources List */}
      <div className="sources-list">
        {sources.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
            <BookOpen size={36} style={{ margin: '0 auto 0.75rem auto', opacity: 0.5 }} />
            <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
              No Knowledge Loaded
            </div>
            <p style={{ fontSize: '0.78rem', lineHeight: 1.5, marginBottom: '1.25rem' }}>
              Add a PDF, upload an image, or paste a link to start querying your data in NotebookLM style.
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
            const isSelected = selectedSourceIds.includes(src.id);
            const isExpanded = expandedId === src.id;

            return (
              <div 
                key={src.id} 
                className="source-item-card"
                style={{
                  border: isSelected ? '1px solid var(--border-glow)' : '1px solid var(--border-subtle)',
                  background: isSelected ? 'var(--bg-surface-elevated)' : 'rgba(255, 255, 255, 0.02)',
                  opacity: isSelected ? 1 : 0.65,
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
                  
                  {/* Selection Checkbox & Name */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', overflow: 'hidden', flex: 1 }}>
                    <button
                      type="button"
                      onClick={() => onToggleSelectSource(src.id)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 0,
                        display: 'flex',
                        alignItems: 'center',
                        color: isSelected ? 'var(--accent-primary)' : 'var(--text-muted)'
                      }}
                      title={isSelected ? 'Deselect this source' : 'Select this source for queries'}
                    >
                      {isSelected ? <CheckSquare size={17} /> : <Square size={17} />}
                    </button>

                    <span className={`source-badge ${src.type}`} style={{ flexShrink: 0 }}>
                      {src.type === 'pdf' && <FileText size={11} />}
                      {src.type === 'image' && <ImageIcon size={11} />}
                      {src.type === 'link' && <LinkIcon size={11} />}
                      {(src.type === 'text' || src.type === 'code') && <FileCode size={11} />}
                      {src.type}
                    </span>

                    <span 
                      style={{ 
                        fontSize: '0.84rem', 
                        fontWeight: 600, 
                        color: isSelected ? 'var(--text-primary)' : 'var(--text-muted)', 
                        whiteSpace: 'nowrap', 
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis', 
                        cursor: 'pointer' 
                      }}
                      title={`Inspect ${src.name}`}
                      onClick={() => onInspectSource(src)}
                    >
                      {src.name}
                    </span>
                  </div>

                  {/* Quick Actions (Inspect & Delete) */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                    <button 
                      className="composer-btn-icon" 
                      style={{ width: '26px', height: '26px' }}
                      title="Inspect extracted chunks"
                      onClick={() => onInspectSource(src)}
                    >
                      <Eye size={13} />
                    </button>

                    <button 
                      className="composer-btn-icon" 
                      style={{ width: '26px', height: '26px', color: '#ef4444' }}
                      title="Remove from knowledge base"
                      onClick={() => onDeleteSource(src.id)}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                  <span>{src.chunkCount} vector chunks</span>
                  <span 
                    style={{ cursor: 'pointer', textDecoration: 'underline' }}
                    onClick={() => setExpandedId(isExpanded ? null : src.id)}
                  >
                    {isExpanded ? 'Hide' : 'Quick preview'}
                  </span>
                </div>

                {isExpanded && src.preview && (
                  <div style={{ marginTop: '0.55rem', paddingTop: '0.55rem', borderTop: '1px dashed var(--border-subtle)', fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.2rem' }}>Indexed Preview:</div>
                    <em>"{src.preview}"</em>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer Info */}
      <div style={{ padding: '0.85rem 1.25rem', borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-app)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
        <span>Selection: <strong>{selectedSourceIds.length} active</strong></span>
        <span>Mode: <strong>NotebookLM Grounded</strong></span>
      </div>
    </aside>
  );
}