import React, { useState } from 'react';
import CuteDoodle from './CuteDoodle';
import { 
  ArrowUp, 
  Paperclip, 
  FileText, 
  Image as ImageIcon, 
  Link as LinkIcon, 
  Sparkles,
  Plus
} from 'lucide-react';

export default function ChatInput({ 
  onSendMessage, 
  loading, 
  onOpenAddModal 
}) {
  const [input, setInput] = useState('');
  const [isHoveringDoodle, setIsHoveringDoodle] = useState(false);

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!input.trim() || loading) return;
    onSendMessage(input.trim());
    setInput('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="composer-outer">
      <div className="composer-container">
        
        {/* Cute Mascot Doodle Companion Peeking Above Composer */}
        <div 
          className="composer-doodle-anchor"
          onMouseEnter={() => setIsHoveringDoodle(true)}
          onMouseLeave={() => setIsHoveringDoodle(false)}
          title="Nixi: Your Multimodal AI Companion"
        >
          <CuteDoodle state={loading ? 'searching' : isHoveringDoodle ? 'happy' : 'idle'} size={52} />
        </div>

        {/* Main Attractive Composer Card */}
        <form onSubmit={handleSubmit} className="composer-card">
          
          {/* Quick Attach Button */}
          <button 
            type="button" 
            className="composer-attach-pill"
            onClick={onOpenAddModal}
            title="Attach a PDF, Image, or Web/YouTube Link"
          >
            <Plus size={15} style={{ color: 'var(--accent-primary)' }} />
            <span>Add Source</span>
          </button>

          {/* Input Field */}
          <input 
            type="text"
            className="composer-input"
            placeholder="Ask Nexus Intelligence anything about your PDFs, Images, or Links..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
          />

          {/* Send Button */}
          <button 
            type="submit" 
            className="composer-send-btn"
            disabled={!input.trim() || loading}
            title="Ask Nexus Intelligence"
          >
            <ArrowUp size={20} />
          </button>
        </form>

      </div>

      <div style={{ marginTop: '0.55rem', display: 'flex', alignItems: 'center', gap: '0.85rem', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
        <span>⚡ <strong>Gemini RAG Engine</strong></span>
        <span>•</span>
        <span>📄 PDFs</span>
        <span>•</span>
        <span>🖼️ Images (Vision OCR)</span>
        <span>•</span>
        <span>🔗 Web & YouTube Links</span>
      </div>
    </div>
  );
}
