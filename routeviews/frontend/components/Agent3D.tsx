'use client';

import { useEffect, useRef, useState } from 'react';

let loadPromise: Promise<void> | null = null;

function ensureRuntime(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-agent-3d-runtime]');
    if (existing) { resolve(); return; }
    
    const s = document.createElement('script');
    s.type = 'module';
    s.src = 'https://three.ws/agent-3d/1.5.2/agent-3d.js';
    s.dataset.agent3dRuntime = '';
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Failed to load three.ws agent'));
    document.head.appendChild(s);
  });
  return loadPromise;
}

export default function Agent3D({ 
  agentId, 
  onReady 
}: { 
  agentId: string; 
  onReady?: (agentElement: any) => void;
}) {
  const [mounted, setMounted] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    setMounted(true);
    ensureRuntime().then(() => {
      const el = ref.current;
      if (!el) return;
      
      // Let the parent component know the avatar is ready to be controlled
      el.addEventListener('agent:ready', () => {
        if (onReady) onReady(el);
      });
    }).catch(console.error);
  }, [onReady]);

  if (!mounted) {
    return <div className="w-full h-full flex items-center justify-center text-slate-500">Loading Avatar...</div>;
  }

  return (
    <agent-3d
      ref={ref as any}
      agent-id={agentId}
      mode="inline"
      background="transparent"
      style={{ display: 'block', width: '100%', height: '100%' }}
    />
  );
}