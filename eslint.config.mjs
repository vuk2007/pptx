import coreWebVitals from 'eslint-config-next/core-web-vitals';
import typescript from 'eslint-config-next/typescript';

const konfiguracija = [
  ...coreWebVitals,
  ...typescript,
  { ignores: ['out/**', '.next/**', 'next-env.d.ts'] },
];

export default konfiguracija;
