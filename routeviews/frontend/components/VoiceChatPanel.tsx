'use client';
import { useState } from 'react';
import { AiAvatar, AvatarState } from './AiAvatar';
import { Button } from './ui/Button';
import { Alert } from './ui/Alert';
import { useVoice } from '@/lib/voice';
import { api } from '@/lib/api';
import { useI18n } from '@/lib/i18n';

interface Msg { role: 'user' | 'assistant'; text: string; at: number; }

export function VoiceChatPanel() {
  const { lang } = useI18n();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [avatarState, setAvatarState] = useState<AvatarState>('idle');
  const [autoSpeak, setAutoSpeak] = useState(false);
  const [aiStatus, setAiStatus] = useState<'unknown' | 'ok' | 'unavailable'>('unknown');

  const voice = useVoice({ onTranscript: (text) => { setInput(text); setAvatarState('idle'); } });

  const checkAiStatus = async () => {
    try {
      const r: any = await (api as any).aiStatus?.();
      const ok = r?.configured ?? r?.ok ?? false;
      setAiStatus(ok ? 'ok' : 'unavailable');
      return ok;
    } catch { setAiStatus('unavailable'); return false; }
  };

  const send = async () => {
    const text = input.trim();
    if (!text || busy) return;
    if (aiStatus === 'unknown') await checkAiStatus();
    setMessages((m) => [...m, { role: 'user', text, at: Date.now() }]);
    setInput('');
    setBusy(true);
    setAvatarState('processing');
    try {
      const res: any = await (api as any).aiChat?.({ message: text, locale: lang });
      const reply: string = res?.reply ?? res?.message ?? res?.answer ?? '';
      if (!reply) throw new Error('Empty AI response');
      setMessages((m) => [...m, { role: 'assistant', text: reply, at: Date.now() }]);
      setAvatarState('speaking');
      if (autoSpeak) voice.speak(reply, lang === 'rw' ? 'rw' : 'en');
      else setTimeout(() => setAvatarState('idle'), 1200);
    } catch (err: any) {
      setMessages((m) => [...m, { role: 'assistant', text: `Error: ${err?.message || 'AI unavailable'}`, at: Date.now() }]);
      setAvatarState('error');
      setTimeout(() => setAvatarState('idle'), 2000);
    } finally { setBusy(false); }
  };

  const onMic = () => {
    if (voice.recognizing) { voice.stopListening(); setAvatarState('idle'); }
    else { voice.startListening(lang === 'rw' ? 'rw' : 'en'); setAvatarState('listening'); }
  };

  if (!open) {
    return (
      <button
        onClick={() => { setOpen(true); checkAiStatus(); }}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-pill bg-teal text-white shadow-lift px-5 py-3 font-medium hover:bg-teal-600 transition"
        aria-label="Open ConnectRwanda AI assistant"
      >
        <AiAvatar state="idle" size={26} />
        <span className="hidden sm:inline">Ask ConnectRwanda AI</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 left-4 sm:left-auto z-50 sm:w-[min(440px,92vw)] bg-surface border border-border rounded-card shadow-lift flex flex-col max-h-[85vh] sm:max-h-[80vh]">
      <div className="flex items-center gap-3 p-4 border-b border-border">
        <AiAvatar state={avatarState} size={44} />
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-ink truncate">ConnectRwanda AI</div>
          <div className="text-xs text-ink-100">
            {aiStatus === 'ok' && 'Connected'}
            {aiStatus === 'unavailable' && 'AI service not configured'}
            {aiStatus === 'unknown' && 'Checking…'}
          </div>
        </div>
        <button
          onClick={() => { setOpen(false); voice.stopSpeaking(); voice.stopListening(); }}
          className="text-ink-100 hover:text-ink text-xl leading-none px-2"
          aria-label="Close assistant"
        >×</button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-sm text-ink-100 leading-relaxed">
            Ask about routes, fares, nearby stops, arrivals, or accessibility. Voice works reliably in English; Kinyarwanda voice depends on your browser.
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`text-sm rounded-card px-3.5 py-2.5 leading-relaxed ${m.role === 'user' ? 'bg-electric text-white ml-8' : 'bg-canvas text-ink mr-8'}`}>
            {m.text}
          </div>
        ))}
        {busy && <div className="text-xs text-ink-100">Thinking…</div>}
      </div>

      {voice.error && <div className="px-4 pb-2"><Alert tone="warning">{voice.error}</Alert></div>}
      {!voice.recognitionAvailable && <div className="px-4 pb-2 text-xs text-ink-100">Microphone not supported in this browser — typing still works.</div>}

      <div className="border-t border-border p-3 flex items-center gap-2">
        <button
          onClick={onMic}
          disabled={busy || !voice.recognitionAvailable}
          className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center border transition ${voice.recognizing ? 'bg-electric text-white border-electric' : 'bg-surface text-ink border-border hover:bg-canvas'} disabled:opacity-40`}
          aria-label={voice.recognizing ? 'Stop listening' : 'Start voice input'}
        >{voice.recognizing ? '■' : '🎤'}</button>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
          placeholder="Ask about transport…"
          className="flex-1 bg-canvas border border-border rounded-pill px-3.5 py-2 text-sm focus:outline-none focus:shadow-focus"
          disabled={busy}
        />
        <Button variant="ai" size="sm" onClick={send} disabled={busy || !input.trim()}>Send</Button>
      </div>

      <div className="border-t border-border px-3 py-2 flex items-center justify-between text-xs text-ink-100">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={autoSpeak} onChange={(e) => setAutoSpeak(e.target.checked)} disabled={!voice.ttsAvailable} />
          Read aloud
          {voice.rwVoiceAvailable === false && lang === 'rw' && <span className="text-amber-600">(no rw voice)</span>}
        </label>
        {voice.speaking && <button onClick={voice.stopSpeaking} className="text-danger font-medium">Stop</button>}
      </div>
    </div>
  );
}