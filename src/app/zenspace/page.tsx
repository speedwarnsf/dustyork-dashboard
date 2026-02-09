import { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'ZenSpace - AI Room Organization',
  description: 'Upload a photo of any messy room. Get a step-by-step plan and AI visualization.',
};

export default function ZenSpacePage() {
  redirect('https://zenspace-two.vercel.app');
}
