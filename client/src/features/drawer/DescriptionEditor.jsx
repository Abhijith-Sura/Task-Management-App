import React, { useState, useRef, useEffect } from 'react';
import { Bold, Italic, List, Code, Type, Maximize2, Minimize2, Eye, Edit3, Plus, Trash2, HelpCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Helper: Parse markdown string to structured JSON blocks
const parseMarkdownToBlocks = (markdownString) => {
  if (!markdownString) {
    return [{ id: 'block-0', type: 'paragraph', content: '' }];
  }
  const lines = markdownString.split('\n');
  const blocks = [];
  let inCodeBlock = false;
  let codeContent = '';
  
  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('```')) {
      if (inCodeBlock) {
        blocks.push({ id: `block-code-${idx}`, type: 'code', content: codeContent.trim() });
        codeContent = '';
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      return;
    }
    
    if (inCodeBlock) {
      codeContent += line + '\n';
      return;
    }
    
    if (line.startsWith('# ')) {
      blocks.push({ id: `block-h1-${idx}`, type: 'h1', content: line.slice(2).trim() });
    } else if (line.startsWith('## ')) {
      blocks.push({ id: `block-h2-${idx}`, type: 'h2', content: line.slice(3).trim() });
    } else if (line.startsWith('- ')) {
      blocks.push({ id: `block-bullet-${idx}`, type: 'bullet', content: line.slice(2).trim() });
    } else if (/^\d+\.\s/.test(line)) {
      const match = line.match(/^\d+\.\s/);
      blocks.push({ id: `block-number-${idx}`, type: 'number', content: line.slice(match[0].length).trim() });
    } else if (line.startsWith('> ')) {
      blocks.push({ id: `block-callout-${idx}`, type: 'callout', content: line.slice(2).trim() });
    } else if (trimmed === '') {
      blocks.push({ id: `block-empty-${idx}`, type: 'paragraph', content: '' });
    } else {
      blocks.push({ id: `block-p-${idx}`, type: 'paragraph', content: line.trim() });
    }
  });
  
  if (inCodeBlock && codeContent) {
    blocks.push({ id: `block-code-final`, type: 'code', content: codeContent.trim() });
  }

  const cleanedBlocks = blocks.filter((b, i) => {
    if (b.type === 'paragraph' && b.content === '') {
      return i === 0 || blocks[i - 1].type !== 'paragraph' || blocks[i - 1].content !== '';
    }
    return true;
  });

  return cleanedBlocks.length > 0 ? cleanedBlocks : [{ id: 'block-0', type: 'paragraph', content: '' }];
};

// Helper: Compile structured JSON blocks back to standard Markdown
const compileBlocksToMarkdown = (blocks) => {
  return blocks.map(block => {
    switch (block.type) {
      case 'h1':
        return `# ${block.content}`;
      case 'h2':
        return `## ${block.content}`;
      case 'bullet':
        return `- ${block.content}`;
      case 'number':
        return `1. ${block.content}`;
      case 'code':
        return `\`\`\`\n${block.content}\n\`\`\``;
      case 'callout':
        return `> ${block.content}`;
      case 'paragraph':
      default:
        return block.content;
    }
  }).join('\n\n');
};

export const DescriptionEditor = ({ value, onChange, onSave, isViewer }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [blocks, setBlocks] = useState([]);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Sync initial blocks
  useEffect(() => {
    setBlocks(parseMarkdownToBlocks(value));
  }, [value]);

  const handleUpdateBlockContent = (id, newContent) => {
    const updated = blocks.map(b => b.id === id ? { ...b, content: newContent } : b);
    setBlocks(updated);
    if (onChange) {
      onChange(compileBlocksToMarkdown(updated));
    }
  };

  const handleUpdateBlockType = (id, newType) => {
    const updated = blocks.map(b => b.id === id ? { ...b, type: newType } : b);
    setBlocks(updated);
    if (onChange) {
      onChange(compileBlocksToMarkdown(updated));
    }
  };

  const handleAddBlockBelow = (idx) => {
    const newBlock = {
      id: `block-new-${Date.now()}`,
      type: 'paragraph',
      content: ''
    };
    const updated = [...blocks];
    updated.splice(idx + 1, 0, newBlock);
    setBlocks(updated);
    if (onChange) {
      onChange(compileBlocksToMarkdown(updated));
    }
  };

  const handleDeleteBlock = (id) => {
    if (blocks.length === 1) {
      // Keep at least one empty block
      setBlocks([{ id: 'block-0', type: 'paragraph', content: '' }]);
      if (onChange) onChange('');
      return;
    }
    const updated = blocks.filter(b => b.id !== id);
    setBlocks(updated);
    if (onChange) {
      onChange(compileBlocksToMarkdown(updated));
    }
  };

  const handleSaveBlocks = () => {
    const finalMarkdown = compileBlocksToMarkdown(blocks);
    if (onSave) {
      onSave(finalMarkdown);
    }
    setIsEditing(false);
  };

  const containerClasses = isFullscreen 
    ? "fixed inset-10 z-[1000] bg-[#09090B]/95 border border-white/[0.05] shadow-[0_0_50px_rgba(0,0,0,0.9)] rounded-3xl flex flex-col"
    : "relative border border-white/[0.05] rounded-3xl bg-white/[0.01] hover:bg-white/[0.02] transition-all overflow-hidden";

  return (
    <div className={containerClasses}>
      {/* Notion Editor Header Status Tool bar */}
      <div className="flex items-center justify-between p-4 border-b border-white/[0.03] bg-white/[0.01] backdrop-blur-md">
        <div className="flex items-center gap-3">
          <span className="text-sm">📝</span>
          <span className="font-mono text-[0.6rem] uppercase tracking-widest text-[#A1A1AA] font-bold">
            {isEditing ? "Notion Blocks Workspace" : "Read-Only Preview Mode"}
          </span>
        </div>
        
        <div className="flex items-center gap-3">
          {!isViewer && (
            <button 
              onClick={() => setIsEditing(!isEditing)}
              className={`flex items-center gap-2 px-4 py-2 border rounded-2xl font-mono text-[0.6rem] uppercase tracking-widest transition-all active:scale-95 duration-200 ${
                isEditing 
                  ? 'bg-accent-blue/15 border-accent-blue text-accent-blue' 
                  : 'bg-white/[0.01] border-white/[0.05] text-[#A1A1AA] hover:bg-white/[0.03]'
              }`}
            >
              {isEditing ? <><Edit3 size={12} /> Blocks Editor</> : <><Eye size={12} /> Live Preview</>}
            </button>
          )}
          <button 
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 border border-white/[0.05] rounded-xl hover:bg-white/[0.03] text-slate-400 hover:text-white transition-colors active:scale-95"
            title="Focus Mode"
          >
            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
        </div>
      </div>

      {/* Main Blocks Workspace / Content Area */}
      <div className={`overflow-y-auto ${isFullscreen ? 'flex-1 p-12' : 'max-h-[500px]'}`}>
        {isEditing && !isViewer ? (
          <div className="flex flex-col gap-4 p-6 min-h-[300px]">
            {blocks.map((block, idx) => (
              <div 
                key={block.id} 
                className="group flex items-start gap-3 px-2 py-2 rounded-xl hover:bg-white/[0.02] transition-all border border-transparent hover:border-white/[0.05]"
              >
                {/* Left side action panel - Gutter controls (Triggered on Hover) */}
                <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity w-32 flex-shrink-0 pt-0.5">
                  <button
                    onClick={() => handleAddBlockBelow(idx)}
                    className="w-5 h-5 flex items-center justify-center rounded-md bg-white/[0.03] border border-white/[0.05] hover:bg-accent-blue/20 hover:text-accent-blue text-slate-500 transition-all active:scale-90"
                    title="Add Block Below"
                  >
                    <Plus size={10} />
                  </button>
                  
                  {/* Premium Styled Block Selector Dropdown */}
                  <div className="relative flex items-center flex-1">
                    <select
                      value={block.type}
                      onChange={(e) => handleUpdateBlockType(block.id, e.target.value)}
                      className="appearance-none w-full bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.05] rounded-md text-[0.55rem] font-bold text-slate-300 pl-2 pr-5 py-1 outline-none cursor-pointer focus:border-accent-blue/50 transition-all uppercase tracking-wider"
                    >
                      <option value="paragraph" className="bg-[#09090B] text-slate-400">TEXT</option>
                      <option value="h1" className="bg-[#09090B] text-slate-400">H1</option>
                      <option value="h2" className="bg-[#09090B] text-slate-400">H2</option>
                      <option value="bullet" className="bg-[#09090B] text-slate-400">BULLET</option>
                      <option value="number" className="bg-[#09090B] text-slate-400">NUMBER</option>
                      <option value="code" className="bg-[#09090B] text-slate-400">CODE</option>
                      <option value="callout" className="bg-[#09090B] text-slate-400">CALLOUT</option>
                    </select>
                    <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[0.45rem] text-slate-500">
                      ▼
                    </div>
                  </div>
                </div>

                {/* Left indicators for bullet/number lists */}
                {block.type === 'bullet' && (
                  <div className="w-1.5 h-1.5 rounded-full bg-accent-blue mt-2.5 flex-shrink-0" />
                )}
                {block.type === 'number' && (
                  <span className="font-mono text-[0.65rem] font-bold text-accent-blue mt-1.5 flex-shrink-0">{idx + 1}.</span>
                )}

                {/* Resizing Block Content Input area */}
                <div className="flex-1 min-w-0">
                  {block.type === 'code' ? (
                    <textarea
                      value={block.content}
                      onChange={(e) => {
                        handleUpdateBlockContent(block.id, e.target.value);
                        e.target.style.height = 'auto';
                        e.target.style.height = e.target.scrollHeight + 'px';
                      }}
                      placeholder="/* Type code snippet here... */"
                      className="w-full min-h-[90px] bg-[#050505] border border-white/[0.05] rounded-lg p-3 font-mono text-xs text-[#E4E4E7] placeholder-slate-600 outline-none focus:border-accent-blue/40 focus:ring-2 focus:ring-accent-blue/20 resize-none leading-relaxed"
                    />
                  ) : block.type === 'callout' ? (
                    <div className="w-full bg-accent-blue/[0.03] border border-accent-blue/15 rounded-xl p-3 flex gap-3 items-center">
                      <span className="text-sm flex-shrink-0 leading-none">💡</span>
                      <textarea
                        rows={1}
                        value={block.content}
                        onChange={(e) => {
                          handleUpdateBlockContent(block.id, e.target.value);
                          e.target.style.height = 'auto';
                          e.target.style.height = e.target.scrollHeight + 'px';
                        }}
                        placeholder="Type callout/quote summary here..."
                        className="w-full bg-transparent border-none outline-none font-mono text-[0.7rem] italic text-accent-blue/90 placeholder-accent-blue/30 resize-none leading-relaxed py-0.5"
                        style={{ height: 'auto' }}
                      />
                    </div>
                  ) : (
                    <textarea
                      rows={1}
                      value={block.content}
                      onChange={(e) => {
                        handleUpdateBlockContent(block.id, e.target.value);
                        e.target.style.height = 'auto';
                        e.target.style.height = e.target.scrollHeight + 'px';
                      }}
                      placeholder={
                        block.type === 'h1' ? "HEADING 1" :
                        block.type === 'h2' ? "Heading 2" :
                        "Press '/' or type block details..."
                      }
                      style={{ height: 'auto' }}
                      className={`w-full bg-transparent border-none outline-none resize-none leading-relaxed py-1.5 ${
                        block.type === 'h1' 
                          ? 'text-[#FAFAFA] font-bold text-lg uppercase tracking-wider placeholder-[#FAFAFA]/20' 
                          : block.type === 'h2' 
                          ? 'text-[#FAFAFA] font-semibold text-base placeholder-[#FAFAFA]/20' 
                          : 'text-[#E4E4E7] text-[0.75rem] placeholder-slate-600'
                      }`}
                    />
                  )}
                </div>

                {/* Delete button (Hover triggered) */}
                <button
                  onClick={() => handleDeleteBlock(block.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded-md border border-transparent hover:border-red-500/20 hover:bg-red-500/10 text-slate-500 hover:text-red-500 transition-all self-start mt-1 flex-shrink-0"
                  title="Delete Block"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}

            {/* Glowing Action Buttons to commit edits */}
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-white/[0.05]">
              <button 
                onClick={() => {
                  setBlocks(parseMarkdownToBlocks(value));
                  setIsEditing(false);
                }}
                className="px-4 py-2 border border-white/[0.08] text-[#A1A1AA] hover:text-white hover:bg-white/[0.05] font-mono text-[0.6rem] font-bold rounded-lg uppercase tracking-widest transition-all active:scale-95 duration-200"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveBlocks}
                className="px-6 py-2 bg-accent-blue hover:bg-indigo-600 text-white font-mono text-[0.6rem] font-bold rounded-lg uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(59,130,246,0.3)] hover:shadow-[0_0_20px_rgba(59,130,246,0.5)] active:scale-95 duration-200"
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          /* Live Markdown Preview Mode */
          <div 
            className={`p-8 prose prose-invert prose-sm max-w-none min-h-[300px] leading-relaxed ${isViewer ? 'cursor-default' : 'cursor-text hover:bg-white/[0.01] transition-all rounded-3xl'}`}
            onClick={() => !isViewer && setIsEditing(true)}
          >
            {value ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {value}
              </ReactMarkdown>
            ) : (
              <div className="flex flex-col items-center justify-center p-12 bg-white/[0.01] border border-dashed border-white/[0.05] rounded-3xl text-center">
                <span className="text-2xl mb-3">📝</span>
                <span className="text-slate-500 text-[0.65rem] font-mono uppercase tracking-widest font-bold">
                  {isViewer ? 'No Description Drafted' : 'No description provided. Click to begin drafting.'}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {isFullscreen && (
        <div className="p-4 border-t border-white/[0.03] bg-[#09090B] flex justify-end">
          <button 
            onClick={() => setIsFullscreen(false)}
            className="px-6 py-2.5 bg-accent-blue text-white font-mono text-xs font-bold rounded-2xl uppercase tracking-widest shadow-glow hover:bg-indigo-600 transition-all"
          >
            Close Focus Mode
          </button>
        </div>
      )}
    </div>
  );
};
