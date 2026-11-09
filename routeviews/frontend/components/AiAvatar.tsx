'use client';

export type AvatarState = 'idle' | 'listening' | 'processing' | 'speaking' | 'error';

const colorMap: Record<AvatarState, string> = {
  idle:       '#0F9D91',
  listening:  '#2563EB',
  processing: '#F59E0B',
  speaking:   '#0F9D91',
  error:      '#DC2626',
};

const labelMap: Record<AvatarState, string> = {
  idle:       'ConnectRwanda AI is ready',
  listening:  'ConnectRwanda AI is listening',
  processing: 'ConnectRwanda AI is thinking',
  speaking:   'ConnectRwanda AI is speaking',
  error:      'ConnectRwanda AI error',
};

export function AiAvatar({ state = 'idle', size = 96 }: { state?: AvatarState; size?: number }) {
  const color = colorMap[state];
  const isActive = state !== 'idle';
  const blurPx = Math.round(size * 0.16);

  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
      role="img"
      aria-label={labelMap[state]}
    >
      {/* Aura glow */}
      <div
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          background: color,
          opacity: isActive ? 0.32 : 0.14,
          filter: `blur(${blurPx}px)`,
          transform: 'scale(1.18)',
          transition: 'opacity 0.35s, background 0.35s',
        }}
      />

      {/* Pulse rings */}
      {(state === 'listening' || state === 'speaking') && (
        <>
          <span
            className="absolute inset-0 rounded-full animate-ping"
            style={{ backgroundColor: color, opacity: 0.22 }}
          />
          <span
            className="absolute inset-0 rounded-full animate-ping"
            style={{ backgroundColor: color, opacity: 0.14, animationDelay: '0.55s' }}
          />
        </>
      )}

      {/* Main orb */}
      <div
        className="relative w-full h-full rounded-full flex items-center justify-center overflow-hidden"
        style={{
          background: `radial-gradient(circle at 30% 25%, ${color} 0%, #14213D 88%)`,
          boxShadow: `0 0 ${size * 0.3}px ${color}33, 0 ${size * 0.05}px ${size * 0.16}px rgba(0,0,0,0.18)`,
          transition: 'box-shadow 0.35s',
        }}
      >
        {/* Highlight overlay */}
        <div
          className="absolute pointer-events-none rounded-full"
          style={{
            top: '10%',
            left: '20%',
            width: '40%',
            height: '40%',
            background: 'radial-gradient(circle, rgba(255,255,255,0.35) 0%, transparent 70%)',
            filter: 'blur(6px)',
          }}
        />

        <svg viewBox="0 0 100 100" className="relative w-3/4 h-3/4" aria-hidden="true">
          {/* Eyes (with blink) */}
          <ellipse cx="35" cy="45" rx="5" ry="5" fill="#FFFFFF">
            <animate attributeName="ry" values="5;5;0.5;5;5" dur="5s" repeatCount="indefinite" />
          </ellipse>
          <ellipse cx="65" cy="45" rx="5" ry="5" fill="#FFFFFF">
            <animate attributeName="ry" values="5;5;0.5;5;5" dur="5s" begin="0.08s" repeatCount="indefinite" />
          </ellipse>

          {/* Pupils that subtly look around */}
          {state === 'idle' && (
            <>
              <circle cx="35" cy="45" r="2" fill="#0D1730" opacity="0.55">
                <animate attributeName="cx" values="35;36.5;35;33.5;35" dur="9s" repeatCount="indefinite" />
              </circle>
              <circle cx="65" cy="45" r="2" fill="#0D1730" opacity="0.55">
                <animate attributeName="cx" values="65;66.5;65;63.5;65" dur="9s" repeatCount="indefinite" />
              </circle>
            </>
          )}

          {/* Mouth */}
          {state === 'speaking' && (
            <ellipse cx="50" cy="66" rx="9" ry="5" fill="#FFFFFF">
              <animate attributeName="ry" values="2;9;3;8;2;9;4" dur="0.9s" repeatCount="indefinite" />
              <animate attributeName="rx" values="7;10;8;9;7;10;8" dur="0.9s" repeatCount="indefinite" />
            </ellipse>
          )}

          {state === 'processing' && (
            <>
              <circle cx="42" cy="66" r="2.2" fill="#FFFFFF">
                <animate attributeName="opacity" values="1;0.2;1" dur="1.05s" begin="0s" repeatCount="indefinite" />
              </circle>
              <circle cx="50" cy="66" r="2.2" fill="#FFFFFF">
                <animate attributeName="opacity" values="1;0.2;1" dur="1.05s" begin="0.2s" repeatCount="indefinite" />
              </circle>
              <circle cx="58" cy="66" r="2.2" fill="#FFFFFF">
                <animate attributeName="opacity" values="1;0.2;1" dur="1.05s" begin="0.4s" repeatCount="indefinite" />
              </circle>
            </>
          )}

          {state === 'error' && (
            <path
              d="M 42 68 Q 50 61 58 68"
              stroke="#FFFFFF"
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="round"
            />
          )}

          {state === 'idle' && (
            <path
              d="M 42 65 Q 50 70 58 65"
              stroke="#FFFFFF"
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="round"
            />
          )}

          {state === 'listening' && (
            <ellipse cx="50" cy="66" rx="6" ry="3" fill="#FFFFFF" />
          )}
        </svg>
      </div>
    </div>
  );
}