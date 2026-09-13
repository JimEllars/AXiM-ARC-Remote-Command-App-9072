import React, { useRef, useState, useEffect } from 'react';
import * as FiIcons from 'react-icons/fi';
import { triggerHaptic } from '../../utils/haptics';
import SafeIcon from '../../common/SafeIcon';

const { FiMic, FiSquare, FiLoader, FiAlertCircle } = FiIcons;

function VoiceCommandButton({ disabled, onRecording, onError }) {
  const [recording, setRecording] = useState(false);
  const [micState, setMicState] = useState('idle'); // idle, listening, processing, error
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
        setMicState('processing');
        const text = event.results[0][0].transcript;
        if (text && onRecording) {
            onRecording(text);
        }
        setRecording(false);
        setMicState('idle');
      };
      recognitionRef.current.onerror = (event) => {
          console.error("Speech recognition error", event.error);
          setRecording(false);
          setMicState('error');
          if(event.error === 'not-allowed') {
              onError?.('Microphone permission is required for voice commands.');
          } else {
              onError?.('Speech recognition failed.');
          }
          setTimeout(() => setMicState('idle'), 2000);
      }
    }
  }, [onRecording, onError]);

  const toggleRecording = async () => {
    triggerHaptic('warning');
    if (recording) {
      setMicState('processing');
      if (recorderRef.current && recorderRef.current.state !== 'inactive') {
          recorderRef.current.stop();
      }
      if (recognitionRef.current) {
          try { recognitionRef.current.stop(); } catch(e){ /* ignore */ }
      }
      return;
    }

    try {
      setMicState('listening');
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
            setMicState('idle');
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
      setRecording(false);
      setMicState('error');

      let msg = 'Could not start audio capture.';
      if (err.name === 'NotAllowedError' || err.name === 'SecurityError') {
          msg = 'Microphone permission is required for voice commands.';
      } else if (err.name === 'NotFoundError') {
          msg = 'No microphone found on this device.';
      }

      onError?.(msg);

      // Dispatch a toast event instead of just throwing error to onyx context
      window.dispatchEvent(new CustomEvent('arc-toast', {
         detail: { message: msg, tone: 'error' }
      }));

      setTimeout(() => setMicState('idle'), 2000);
    }
  };

  const getIcon = () => {
      if (micState === 'error') return FiAlertCircle;
      if (micState === 'processing') return FiLoader;
      return recording ? FiSquare : FiMic;
  };

  return (
    <button
      type="button"
      className={`voice-button ${recording ? 'recording' : ''} ${micState}`}
      onClick={toggleRecording}
      disabled={disabled || !navigator.mediaDevices || micState === 'processing'}
    >
      <span>
        <SafeIcon icon={getIcon()} className={micState === 'processing' ? 'spin' : ''} />
      </span>
      {micState === 'processing' ? 'Processing...' : recording ? 'Tap to send' : 'Hold the command line'}
    </button>
  );
}

export default VoiceCommandButton;
