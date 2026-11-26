import type { Metadata } from 'next';
import { connection } from 'next/server';
import { Suspense } from 'react';
import setupData from '../../data/setup_data.json';
import { supabase } from '../lib/supabase';
import BuilderClient from './BuilderClient';

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const resolvedParams = (await searchParams) || {};
  const id = typeof resolvedParams.id === 'string' ? resolvedParams.id : undefined;
  const lang = (typeof resolvedParams.lang === 'string' ? resolvedParams.lang : 'ja') as 'ja' | 'en' | 'ko';

  let title = typeof resolvedParams.title === 'string' ? resolvedParams.title : '423 Club | MARATHON // BUILD & SHARE CLASS SETUP';
  let description = 'Custom Runner & Weapon Loadout Builder for Marathon';
  const ogParams = new URLSearchParams();

  if (id) {
    ogParams.set('id', id);
    ogParams.set('lang', lang);
    const { data } = await supabase.from('builds').select('*').eq('id', id).single();
    if (data) {
      const weapon = setupData.weapons.find((w) => w.id === data.weapon_id);
      const shell = setupData.shells.find((s) => s.id === data.shell_id);
      title = `${data.title} | 423 Club`;
      description = `Shell: ${shell?.name[lang] || ''} / Weapon: ${weapon?.name[lang] || ''} ${data.comment ? `- ${data.comment}` : ''}`;
    }
  } else {
    Object.entries(resolvedParams).forEach(([k, v]) => {
      if (Array.isArray(v)) v.forEach((item) => ogParams.append(k, item));
      else if (v) ogParams.set(k, v);
    });
  }

  const ogImageUrl = `/api/og?${ogParams.toString()}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: ogImageUrl, width: 1200, height: 630 }],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImageUrl],
    },
  };
}

async function DynamicMarker() {
  await connection();
  return null;
}

export default function Page() {
  return (
    <>
      <Suspense fallback={null}>
        <DynamicMarker />
      </Suspense>
      <BuilderClient />
    </>
  );
}