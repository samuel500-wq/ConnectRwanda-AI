import React from 'react';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'agent-3d': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        'agent-id'?: string;
        width?: string;
        height?: string;
        mode?: 'inline' | 'floating' | 'section' | 'fullscreen';
        position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
        background?: 'transparent' | 'dark' | 'light';
        name?: string;
        voice?: string;
      };
    }
  }
}

export {};