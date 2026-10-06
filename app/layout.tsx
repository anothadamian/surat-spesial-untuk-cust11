import type { Metadata } from 'next';
import './journey.css';

const productionHost = process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? (productionHost ? `https://${productionHost}` : 'http://localhost:3004');

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: 'For You, BB 💙',
  description: 'A birthday and anniversary surprise made with love by Anggesti for BB.',
  openGraph: { title: 'For You, BB 💙', description: 'A birthday and anniversary surprise from Anggesti.', images: ['/customer/photos/bb-01.jpeg'] },
  twitter: { card: 'summary_large_image', title: 'For You, BB 💙', description: 'A birthday and anniversary surprise from Anggesti.', images: ['/customer/photos/bb-01.jpeg'] },
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="id"><body>{children}</body></html>; }
