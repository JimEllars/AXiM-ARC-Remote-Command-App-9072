import React, { useRef, useState, useEffect } from 'react';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';

const { FiMic, FiSquare } = FiIcons;

function VoiceCommandButton({ disabled, onRecording, onError }) {
  const [recording, setRecording] = useState(false);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const recognitionRef = useRef(null);

  useEffect(() => {
    // Initialize Web Speech API fallback if available
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.onresult = (event) => {
        const text = event.results[0][0].transcript;
        if (text && onRecording) {
            onRecording(text); // Can pass text or audio. We can let the parent handle both.
        }
      };
      recognitionRef.current.onerror = (event) => {
          console.error("Speech recognition error", event.error);
          if(event.error === 'not-allowed') {
              onError?.('Microphone permission is required for voice commands.');
          }
      }
    }
  }, [onRecording, onError]);

  const toggleRecording = async () => {
    if (recording) {
      if (recorderRef.current && recorderRef.current.state !== 'inactive') {
          recorderRef.current.stop();
      }
      if (recognitionRef.current) {
          try { recognitionRef.current.stop(); } catch(e){ /* ignore */ }
      }
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      try {
          const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
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
      } catch (mediaErr) {
          // Fallback to webkit speech if mediarecorder fails with mime type or something
          if (recognitionRef.current) {
              setRecording(true);
              recognitionRef.current.start();
          } else {
              throw mediaErr;
          }
      }

    } catch (err) {
      if (err.name === 'NotAllowedError' || err.name === 'SecurityError') {
          onError?.('Microphone permission is required for voice commands.');
      } else if (err.name === 'NotFoundError') {
          onError?.('No microphone found on this device.');
      } else {
          onError?.('Could not start audio capture.');
      }
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
