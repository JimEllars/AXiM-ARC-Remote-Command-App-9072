import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';
import CommandHistory from './CommandHistory';
import CommandTemplates from './CommandTemplates';
import VoiceCommandButton from './VoiceCommandButton';

const { FiChevronRight, FiLoader, FiTerminal, FiArrowDown } = FiIcons;

function StreamingTerminal({ onyx, previewMode }) {
  const [prompt, setPrompt] = useState('');
  const terminalRef = useRef(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const scrollToBottom = useCallback(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    if (autoScroll) {
      scrollToBottom();
    }
  }, [onyx.tokens, autoScroll, scrollToBottom]);

  const handleScroll = () => {
    if (!terminalRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = terminalRef.current;

    // If the user scrolls up, disable autoScroll.
    // If they scroll to the very bottom, enable it.
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 10;
    if (isAtBottom && !autoScroll) {
      setAutoScroll(true);
    } else if (!isAtBottom && autoScroll) {
      setAutoScroll(false);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onyx.dispatchPrompt(prompt);
    setPrompt('');
    setHistoryIndex(-1);
    setAutoScroll(true);
  };

  const handleKeyDown = (event) => {
    if (onyx.history.length === 0) return;

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      const nextIndex = historyIndex < onyx.history.length - 1 ? historyIndex + 1 : historyIndex;
      setHistoryIndex(nextIndex);
      if (nextIndex >= 0 && nextIndex < onyx.history.length) {
          setPrompt(onyx.history[nextIndex].prompt);
      }
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      const prevIndex = historyIndex > -1 ? historyIndex - 1 : -1;
      setHistoryIndex(prevIndex);
      if (prevIndex === -1) {
          setPrompt('');
      } else {
          setPrompt(onyx.history[prevIndex].prompt);
      }
    }
  };

  const handleTemplate = (template) => {
    setPrompt(template);
  };

  const handleVoice = (audioOrText) => {
    onyx.dispatchVoice(audioOrText);
    setAutoScroll(true);
  };

  return (
    <section className="onyx-terminal">
      <div
        className="terminal-display"
        ref={terminalRef}
        onScroll={handleScroll}
        style={{ position: 'relative' }}
      >
        {!onyx.tokens && !onyx.isStreaming && !onyx.isTranscribing ? (
          <div className="terminal-empty">
            <SafeIcon icon={FiTerminal} />
            <span>Onyx is listening. Issue a command or select a template.</span>
          </div>
        ) : (
          <div className="terminal-stream">
            {onyx.isTranscribing && (
              <span className="transcribing-indicator">
                <SafeIcon icon={FiLoader} className="spin" /> Transcribing audio...
              </span>
            )}
            {onyx.tokens}
            {onyx.isStreaming && <i className="cursor" />}
          </div>
        )}

        {!autoScroll && (onyx.isStreaming || onyx.tokens) && (
          <button
             type="button"
             className="auto-scroll-btn"
             onClick={() => {
                setAutoScroll(true);
                scrollToBottom();
             }}
             aria-label="Scroll to bottom"
             style={{
                position: 'absolute',
                bottom: '10px',
                right: '10px',
                background: 'rgba(20, 25, 35, 0.8)',
                border: '1px solid #334155',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                cursor: 'pointer',
                zIndex: 10
             }}
          >
            <SafeIcon icon={FiArrowDown} />
          </button>
        )}
      </div>

      <div className="terminal-controls">
        <form onSubmit={handleSubmit}>
          <SafeIcon icon={FiChevronRight} />
          <input
            type="text"
            value={prompt}
            onChange={(event) => { setPrompt(event.target.value); setHistoryIndex(-1); }}
            onKeyDown={handleKeyDown}
            placeholder="Instruct Onyx..."
            disabled={onyx.isStreaming || onyx.isTranscribing}
            autoComplete="off"
            aria-label="Onyx command input"
          />
        </form>

        <VoiceCommandButton
          disabled={onyx.isStreaming || onyx.isTranscribing}
          onRecording={handleVoice}
          onError={onyx.setError}
        />
      </div>

      <CommandTemplates onSelect={handleTemplate} />

      {onyx.history.length > 0 && (
        <CommandHistory
          history={onyx.history}
          onClear={onyx.clearHistory}
        />
      )}
    </section>
  );
}

export default StreamingTerminal;
