import { useState } from 'react';
import { useCommandHistory } from './useCommandHistory';
import { getLocalOnyxResponse } from '../services/localDemoData';

const ONYX_URL = import.meta.env.VITE_ONYX_BRIDGE_URL || 'https://onyx-bridge.axim.us.com';

function wait(milliseconds) {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}

async function streamLocalResponse(prompt, onToken) {
  const response = getLocalOnyxResponse(prompt);
  const words = response.split(' ');
  let output = '';

  for (const word of words) {
    output += `${output ? ' ' : ''}${word}`;
    onToken(output);
    await wait(18);
  }

  return output;
}

async function streamRemoteResponse(prompt, onToken) {
  const response = await fetch(`${ONYX_URL}/api/v1/stream`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt,
      source: 'remote_companion'
    })
  });

  if (!response.ok || !response.body) {
    throw new Error('Onyx command dispatch failed.');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let output = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    output += decoder.decode(value, { stream: true });
    onToken(output);
  }

  return output;
}

export function useOnyxStream(previewMode = false) {
  const [tokens, setTokens] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [error, setError] = useState('');
  const commandHistory = useCommandHistory();

  const dispatchPrompt = async (prompt) => {
    const cleanPrompt = prompt.trim();

    if (!cleanPrompt || isStreaming || isTranscribing) return;

    setTokens('');
    setError('');
    setIsStreaming(true);

    try {
      const output = previewMode
        ? await streamLocalResponse(cleanPrompt, setTokens)
        : await streamRemoteResponse(cleanPrompt, setTokens);

      commandHistory.addEntry({
        command: cleanPrompt,
        result: output,
        status: previewMode ? 'preview' : 'success'
      });
    } catch (streamError) {
      setError(streamError.message);
      commandHistory.addEntry({
        command: cleanPrompt,
        result: streamError.message,
        status: 'error'
      });
    } finally {
      setIsStreaming(false);
    }
  };

  const dispatchVoice = async (audioData) => {
    if (!audioData || isStreaming || isTranscribing) return;

    if (previewMode) {
      setTokens('Local mode: voice dispatch requires a connected Onyx Edge Bridge.');
      return;
    }

    if (typeof audioData === 'string') {
        // Fallback Web Speech API sent text directly
        return dispatchPrompt(audioData);
    }

    setTokens('');
    setError('');
    setIsTranscribing(true);

    try {
      const body = new FormData();
      body.append('audio', audioData, 'arc-command.webm');
      body.append('source', 'remote_companion');

      // The instruction specifies streaming audio directly to onyx-bridge,
      // but the existing code used /api/remote/voice/transcribe. Let's update it.
      const response = await fetch(`${ONYX_URL}/api/v1/transcribe`, {
        method: 'POST',
        credentials: 'include',
        body
      });

      if (!response.ok) {
        throw new Error('Voice transcription service is unavailable.');
      }

      const data = await response.json();
      const transcription = data.text?.trim();

      if (!transcription) {
        throw new Error('No command was detected in the recording.');
      }

      setIsTranscribing(false);
      await dispatchPrompt(transcription);
    } catch (voiceError) {
      setError(voiceError.message);
      setIsTranscribing(false);
    }
  };

  return {
    tokens,
    isStreaming,
    isTranscribing,
    error,
    setError,
    dispatchPrompt,
    dispatchVoice,
    history: commandHistory.history,
    clearHistory: commandHistory.clearHistory
  };
}
