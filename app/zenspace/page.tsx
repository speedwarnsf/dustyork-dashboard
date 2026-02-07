import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ZenSpace - Ambient Focus Environment',
  description: 'Immersive ambient environments for focus and relaxation',
};

export default function ZenSpacePage() {
  return (
    <iframe
      src="https://zenspace-two.vercel.app"
      style={{
        width: '100vw',
        height: '100vh',
        border: 'none',
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 9999,
      }}
      allow="autoplay; fullscreen"
    />
  );
}
