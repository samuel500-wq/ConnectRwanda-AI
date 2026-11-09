'use client';
import { useCallback, useEffect, useRef, useState } from 'react';

export type VoiceLang = 'en' | 'rw';

export function useVoice(opts: { onTranscript?: (text: string) => void } = {}) {
  const [recognizing, setRecognizing] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [recognitionAvailable, setRecognitionAvailable] = useState(false);
  const [ttsAvailable, setTtsAvailable] = useState(false);
  const [rwVoiceAvailable, setRwVoiceAvailable] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  const recogRef = useRef<any>(null);
  const onTranscriptRef = useRef(opts.onTranscript);
  onTranscriptRef.current = opts.onTranscript;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setRecognitionAvailable(!!SR);
    if ('speechSynthesis' in window) {
      setTtsAvailable(true);
      const check = () => {
        const voices = window.speechSynthesis.getVoices();
        setRwVoiceAvailable(voices.some((v) => v.lang.toLowerCase().startsWith('rw')));
      };
      check();
      window.speechSynthesis.addEventListener('voiceschanged', check);
      return () => window.speechSynthesis.removeEventListener('voiceschanged', check);
    }
  }, []);

  const startListening = useCallback((lang: VoiceLang = 'en') => {
    setError(null);
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { setError('Speech recognition is not supported in this browser.'); return; }
    if (recogRef.current) { try { recogRef.current.stop(); } catch {} }
    const recog = new SR();
    recog.lang = lang === 'rw' ? 'rw-RW' : 'en-US';
    recog.interimResults = false;
    recog.continuous = false;
    recog.onstart = () => setRecognizing(true);
    recog.onerror = (e: any) => { setRecognizing(false); setError(e?.error ? `Speech error: ${e.error}` : 'Speech recognition failed.'); };
    recog.onend = () => setRecognizing(false);
    recog.onresult = (e: any) => {
      const text = Array.from(e.results).map((r: any) => r[0].transcript).join(' ').trim();
      if (text) onTranscriptRef.current?.(text);
    };
    try { recog.start(); recogRef.current = recog; }
    catch { setError('Could not start microphone.'); setRecognizing(false); }
  }, []);

  const stopListening = useCallback(() => {
    if (recogRef.current) { try { recogRef.current.stop(); } catch {} recogRef.current = null; }
    setRecognizing(false);
  }, []);

  const speak = useCallback((text: string, lang: VoiceLang = 'en') => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setError('Text-to-speech is not supported in this browser.');
      return;
    }
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = lang === 'rw' ? 'rw-RW' : 'en-US';
    utter.rate = 1.0;
    utter.onstart = () => setSpeaking(true);
    utter.onend = () => setSpeaking(false);
    utter.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utter);
  }, []);

  const stopSpeaking = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel();
    setSpeaking(false);
  }, []);

  return {
    recognizing, speaking, recognitionAvailable, ttsAvailable, rwVoiceAvailable,
    error, startListening, stopListening, speak, stopSpeaking,
  };
}