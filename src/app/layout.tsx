import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '423 Club | MARATHON // BUILD & SHARE CLASS SETUP',
  description: 'Custom Runner & Weapon Loadout Builder for Marathon',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body style={{ backgroundColor: '#0d0f12', color: '#f0f4f8', margin: 0 }}>{children}</body>
    </html>
  );
}