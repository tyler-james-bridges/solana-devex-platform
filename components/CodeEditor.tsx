'use client'

import React, { useState, useEffect, useRef } from 'react';
import { LANGUAGE_REGISTRY, getLanguageById, getLanguageByExtension } from '../lib/languages';
import { Play, Save, Download, Upload, Settings, Terminal, TestTube } from 'lucide-react';

interface CodeEditorProps {
  initialCode?: string;
  language?: string;
  filename?: string;
  onCodeChange?: (code: string) => void;
  onSave?: (code: string, filename: string) => void;
  readOnly?: boolean;
}

interface EditorState {
  code: string;
  language: string;
  filename: string;
  modified: boolean;
  cursorPosition: { line: number; column: number };
}

export function CodeEditor({
  initialCode = '',
  language = 'rust',
  filename = 'program.rs',
  onCodeChange,
  onSave,
  readOnly = false
}: CodeEditorProps) {
  const [state, setState] = useState<EditorState>({
    code: initialCode,
    language,
    filename,
    modified: false,
    cursorPosition: { line: 1, column: 1 }
  });

  const [showSnippets, setShowSnippets] = useState(false);
  const [showTools, setShowTools] = useState(false);
  const [output, setOutput] = useState<string>('');
  const [isRunning, setIsRunning] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentLanguageConfig = getLanguageById(state.language);

  // Update language when filename changes
  useEffect(() => {
    const extension = state.filename.split('.').pop() || '';
    const detectedLanguage = getLanguageByExtension(extension);
    if (detectedLanguage && detectedLanguage.id !== state.language) {
      setState(prev => ({ ...prev, language: detectedLanguage.id }));
    }
  }, [state.filename]);

  // Auto-save functionality
  useEffect(() => {
    if (state.modified && onSave) {
      const timer = setTimeout(() => {
        onSave(state.code, state.filename);
        setState(prev => ({ ...prev, modified: false }));
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [state.code, state.modified, onSave]);

  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newCode = e.target.value;
    setState(prev => ({ ...prev, code: newCode, modified: true }));
    onCodeChange?.(newCode);
  };

  const handleFilenameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setState(prev => ({ ...prev, filename: e.target.value }));
  };

  const insertSnippet = (snippet: any) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const snippetText = snippet.body.join('\n');
    
    const newCode = state.code.slice(0, start) + snippetText + state.code.slice(end);
    setState(prev => ({ ...prev, code: newCode, modified: true }));
    
    // Focus back to textarea
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + snippetText.length, start + snippetText.length);
    }, 0);
    
    setShowSnippets(false);
  };

  const runCode = async () => {
    if (!currentLanguageConfig) return;
    
    setIsRunning(true);
    setOutput('Running...\n');
    
    try {
      // Simulate code execution based on language
      const tool = currentLanguageConfig.tools.find(t => t.category === 'compiler' || t.category === 'tester');
      if (tool) {
        setOutput(`> ${tool.command}\n\n`);
        
        // Simulate compilation/execution
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        if (state.language === 'rust') {
          setOutput(prev => prev + 'Compiling program...\n✅ Build successful\n\nProgram ID: 9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM\n');
        } else if (state.language === 'typescript') {
          setOutput(prev => prev + 'Running tests...\n✅ All tests passed\n\nTransaction signature: 2ZE7SX2j...\n');
        } else {
          setOutput(prev => prev + '✅ Execution completed\n');
        }
      }
    } catch (error) {
      setOutput(prev => prev + `❌ Error: ${error}\n`);
    } finally {
      setIsRunning(false);
    }
  };

  const saveFile = () => {
    if (onSave) {
      onSave(state.code, state.filename);
      setState(prev => ({ ...prev, modified: false }));
    }
  };

  const downloadFile = () => {
    const blob = new Blob([state.code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = state.filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const uploadFile = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setState(prev => ({
        ...prev,
        code: content,
        filename: file.name,
        modified: true
      }));
    };
    reader.readAsText(file);
  };

  return (
    <div className="crypto-code-editor">
      <style jsx>{`
        .crypto-code-editor {
          display: flex;
          flex-direction: column;
          height: 100%;
          border: 1px solid #e5e7eb;
          border-radius: 0.75rem;
          overflow: hidden;
          background: #ffffff;
        }

        .editor-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.75rem 1rem;
          background: #f8fafc;
          border-bottom: 1px solid #e5e7eb;
          gap: 1rem;
        }

        .editor-controls {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .language-select {
          padding: 0.375rem 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 0.375rem;
          font-size: 0.875rem;
          background: white;
        }

        .filename-input {
          padding: 0.375rem 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 0.375rem;
          font-size: 0.875rem;
          min-width: 200px;
        }

        .editor-actions {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .editor-button {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          padding: 0.5rem 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 0.375rem;
          background: white;
          color: #374151;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .editor-button:hover {
          background: #f3f4f6;
          border-color: #9ca3af;
        }

        .editor-button.primary {
          background: #3b82f6;
          color: white;
          border-color: #2563eb;
        }

        .editor-button.primary:hover {
          background: #2563eb;
        }

        .editor-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .editor-body {
          display: flex;
          flex: 1;
          overflow: hidden;
        }

        .editor-main {
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .editor-textarea {
          flex: 1;
          padding: 1rem;
          border: none;
          outline: none;
          font-family: 'JetBrains Mono', 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
          font-size: 0.875rem;
          line-height: 1.6;
          resize: none;
          background: #fafafa;
          color: #1f2937;
          tab-size: 2;
        }

        .editor-textarea:focus {
          background: #ffffff;
        }

        .editor-sidebar {
          width: 300px;
          border-left: 1px solid #e5e7eb;
          background: #f8fafc;
          overflow-y: auto;
        }

        .sidebar-section {
          padding: 1rem;
          border-bottom: 1px solid #e5e7eb;
        }

        .sidebar-title {
          font-weight: 600;
          color: #111827;
          margin-bottom: 0.75rem;
          font-size: 0.875rem;
        }

        .snippet-item {
          padding: 0.5rem;
          border: 1px solid #e5e7eb;
          border-radius: 0.375rem;
          margin-bottom: 0.5rem;
          cursor: pointer;
          background: white;
          transition: all 0.2s;
        }

        .snippet-item:hover {
          border-color: #3b82f6;
          background: #f0f9ff;
        }

        .snippet-label {
          font-weight: 500;
          font-size: 0.8125rem;
          color: #111827;
          margin-bottom: 0.25rem;
        }

        .snippet-description {
          font-size: 0.75rem;
          color: #6b7280;
        }

        .editor-output {
          height: 200px;
          border-top: 1px solid #e5e7eb;
          background: #111827;
          color: #f3f4f6;
          font-family: 'JetBrains Mono', 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
          font-size: 0.8125rem;
          padding: 1rem;
          overflow-y: auto;
          white-space: pre-wrap;
        }

        .status-indicator {
          display: inline-flex;
          align-items: center;
          gap: 0.375rem;
          font-size: 0.75rem;
          color: #6b7280;
        }

        .status-modified {
          color: #f59e0b;
        }

        .hidden {
          display: none;
        }

        @media (max-width: 768px) {
          .editor-header {
            flex-direction: column;
            align-items: stretch;
            gap: 0.75rem;
          }
          
          .editor-controls {
            justify-content: space-between;
          }
          
          .filename-input {
            min-width: auto;
            flex: 1;
          }
          
          .editor-sidebar {
            width: 250px;
          }
        }
      `}</style>

      <div className="editor-header">
        <div className="editor-controls">
          <select 
            value={state.language}
            onChange={(e) => setState(prev => ({ ...prev, language: e.target.value }))}
            className="language-select"
          >
            {LANGUAGE_REGISTRY.map(lang => (
              <option key={lang.id} value={lang.id}>
                {lang.displayName}
              </option>
            ))}
          </select>
          
          <input
            type="text"
            value={state.filename}
            onChange={handleFilenameChange}
            className="filename-input"
            placeholder="filename.rs"
          />
          
          <div className="status-indicator">
            {state.modified && <span className="status-modified">● Modified</span>}
            {!state.modified && <span>Saved</span>}
          </div>
        </div>

        <div className="editor-actions">
          <button
            onClick={() => setShowSnippets(!showSnippets)}
            className="editor-button"
          >
            <Settings size={16} />
            Snippets
          </button>

          <button
            onClick={() => setShowTools(!showTools)}
            className="editor-button"
          >
            <Terminal size={16} />
            Tools
          </button>

          <button
            onClick={runCode}
            disabled={isRunning || readOnly}
            className="editor-button primary"
          >
            {isRunning ? <TestTube size={16} /> : <Play size={16} />}
            {isRunning ? 'Running...' : 'Run'}
          </button>

          <button
            onClick={saveFile}
            disabled={!state.modified || readOnly}
            className="editor-button"
          >
            <Save size={16} />
          </button>

          <button onClick={downloadFile} className="editor-button">
            <Download size={16} />
          </button>

          <button onClick={uploadFile} className="editor-button">
            <Upload size={16} />
          </button>
        </div>
      </div>

      <div className="editor-body">
        <div className="editor-main">
          <textarea
            ref={textareaRef}
            value={state.code}
            onChange={handleCodeChange}
            className="editor-textarea"
            placeholder={`Start writing ${currentLanguageConfig?.displayName || 'code'}...`}
            spellCheck={false}
            readOnly={readOnly}
          />
          
          {output && (
            <div className="editor-output">
              {output}
            </div>
          )}
        </div>

        {(showSnippets || showTools) && (
          <div className="editor-sidebar">
            {showSnippets && currentLanguageConfig && (
              <div className="sidebar-section">
                <div className="sidebar-title">Code Snippets</div>
                {currentLanguageConfig.snippets.map((snippet, index) => (
                  <div
                    key={index}
                    className="snippet-item"
                    onClick={() => insertSnippet(snippet)}
                  >
                    <div className="snippet-label">{snippet.label}</div>
                    <div className="snippet-description">{snippet.description}</div>
                  </div>
                ))}
              </div>
            )}

            {showTools && currentLanguageConfig && (
              <div className="sidebar-section">
                <div className="sidebar-title">Development Tools</div>
                {currentLanguageConfig.tools.map((tool, index) => (
                  <div key={index} className="snippet-item">
                    <div className="snippet-label">{tool.name}</div>
                    <div className="snippet-description">{tool.description}</div>
                    <code style={{ fontSize: '0.75rem', color: '#6b7280', display: 'block', marginTop: '0.25rem' }}>
                      {tool.command}
                    </code>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileUpload}
        accept=".rs,.ts,.tsx,.js,.jsx,.sol,.py,.move,.cairo,.toml,.yaml,.yml"
      />
    </div>
  );
}