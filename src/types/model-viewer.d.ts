import type { DetailedHTMLProps, HTMLAttributes } from 'react';

/*
  <model-viewer> je web komponenta, pa je React ne poznaje sam od sebe.
  Ovdje su samo atributi koje stvarno koristimo — namjerno nije prepisana
  cijela dokumentacija, da se ne pravimo da podržavamo ono što nismo probali.
*/

type AtributiModela = DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
  src?: string;
  alt?: string;
  poster?: string;
  'camera-controls'?: boolean | '';
  'touch-action'?: string;
  'auto-rotate'?: boolean | '';
  'auto-rotate-delay'?: number | string;
  'rotation-per-second'?: string;
  'interaction-prompt'?: string;
  'shadow-intensity'?: number | string;
  'shadow-softness'?: number | string;
  'environment-image'?: string;
  exposure?: number | string;
  'camera-orbit'?: string;
  'field-of-view'?: string;
  'min-camera-orbit'?: string;
  'max-camera-orbit'?: string;
  autoplay?: boolean | '';
  'animation-name'?: string;
  'disable-zoom'?: boolean | '';
  loading?: string;
  reveal?: string;
};

/** Metode koje zovemo na elementu. */
export type ElementModela = HTMLElement & {
  resetTurntableRotation?: (ugao?: number) => void;
  availableAnimations?: string[];
  play?: (opcije?: { repetitions?: number }) => void;
  pause?: () => void;
  animationName?: string;
};

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': AtributiModela;
    }
  }
}
