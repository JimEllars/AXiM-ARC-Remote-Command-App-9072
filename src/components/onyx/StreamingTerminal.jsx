import React, { useState } from 'react';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';
import CommandHistory from './CommandHistory';
import CommandTemplates from './CommandTemplates';
import VoiceCommandButton from './VoiceCommandButton';

const { FiArrowUp, FiCommand, FiLoader } = FiIcons;

function StreamingTerminal({ onyx, previewMode }) {
  const [prompt, setPrompt] = useState('');

  const busy = onyx.isStreaming || onyx.isTranscribing;

  const submit = (event) => {
    event.preventDefault();
    onyx.dispatchPrompt(prompt);
    setPrompt('');
  };

  const selectTemplate = (command) => {
    setPrompt(command);
  };

  const handleRecording = (audio) => {
    onyx.dispatchVoice(audio);
  };

  return (
    <>
      <section className="terminal">
        <div className="terminal-bar">
          <span><i /> ONYX EDGE BRIDGE</span>
          <small>
            {onyx.isTranscribing
              ? 'TRANSCRIBING'
              : onyx.isStreaming
                ? 'STREAMING'
                : 'READY'}
          </small>
        </div>

        <div className="terminal-output">
          <p className="terminal-system">
            ARC secure channel initialized.<br />
            Awaiting executive instruction<span className="cursor">_</span>
          </p>
          {onyx.tokens && <p className="terminal-response">{onyx.tokens}</p>}
          {onyx.error && <p className="terminal-error">{onyx.error}</p>}
        </div>

        <form className="command-form" onSubmit={submit}>
          <SafeIcon icon={FiCommand} />
          <input
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            placeholder="Enter a command…"
            aria-label="Command"
            disabled={busy}
          />
          <button
            type="submit"
            disabled={!prompt.trim() || busy}
            aria-label="Dispatch command"
          >
            <SafeIcon icon={onyx.isStreaming ? FiLoader : FiArrowUp} />
          </button>
        </form>

        <VoiceCommandButton
          disabled={previewMode || busy}
          onRecording={handleRecording}
          onError={onyx.setError}
        />
      </section>

      <CommandTemplates
        disabled={busy}
        onSelect={selectTemplate}
      />

      <CommandHistory
        history={onyx.history}
        onClear={onyx.clearHistory}
      />
    </>
  );
}

export default StreamingTerminal;