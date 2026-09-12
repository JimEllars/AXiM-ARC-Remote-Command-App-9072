import React, { useEffect, useRef, useState } from 'react';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';
import CommandHistory from './CommandHistory';
import CommandTemplates from './CommandTemplates';
import VoiceCommandButton from './VoiceCommandButton';

const { FiChevronRight, FiLoader, FiTerminal } = FiIcons;

function StreamingTerminal({ onyx, previewMode }) {
  const [prompt, setPrompt] = useState('');
  const terminalRef = useRef(null);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [onyx.tokens]);

  const handleSubmit = (event) => {
    event.preventDefault();
    onyx.dispatchPrompt(prompt);
    setPrompt('');
  };

  const handleTemplate = (template) => {
    setPrompt(template);
  };

  const handleVoice = (audioOrText) => {
    onyx.dispatchVoice(audioOrText);
  };

  return (
    <section className="onyx-terminal">
      <div className="terminal-display" ref={terminalRef}>
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
      </div>

      {onyx.error && <div className="inline-error">{onyx.error}</div>}

      <div className="terminal-controls">
        <form onSubmit={handleSubmit}>
          <SafeIcon icon={FiChevronRight} />
          <input
            type="text"
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
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
