import React, { useRef, useState } from 'react';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';

const { FiMic, FiSquare } = FiIcons;

function VoiceCommandButton({ disabled, onRecording, onError }) {
  const [recording, setRecording] = useState(false);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);

  const toggleRecording = async () => {
    if (recording) {
      recorderRef.current?.stop();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);

      chunksRef.current = [];
      recorderRef.current = recorder;

      recorder.addEventListener('dataavailable', (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      });

      recorder.addEventListener('stop', () => {
        const audio = new Blob(chunksRef.current, {
          type: recorder.mimeType || 'audio/webm'
        });

        stream.getTracks().forEach((track) => track.stop());
        setRecording(false);
        onRecording(audio);
      });

      recorder.start();
      setRecording(true);
    } catch {
      onError?.('Microphone permission is required for voice commands.');
    }
  };

  return (
    <button
      type="button"
      className={`voice-button ${recording ? 'recording' : ''}`}
      onClick={toggleRecording}
      disabled={disabled || !navigator.mediaDevices}
    >
      <span>
        <SafeIcon icon={recording ? FiSquare : FiMic} />
      </span>
      {recording ? 'Tap to send' : 'Hold the command line'}
    </button>
  );
}

export default VoiceCommandButton;