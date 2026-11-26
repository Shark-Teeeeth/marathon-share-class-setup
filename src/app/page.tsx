import { Metadata } from 'next';
import { connection } from 'next/server';
import setupData from '../../data/setup_data.json';
import { supabase } from '../lib/supabase';
import BuilderClient from './BuilderClient';

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

const BASE_URL = 'https://marathon-share-class-setup.vercel.app';

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  await connection();
  const resolvedParams = await searchParams;
  const id = typeof resolvedParams.id === 'string' ? resolvedParams.id : undefined;
  const rawLang = typeof resolvedParams.lang === 'string' ? resolvedParams.lang : 'ja';
  const lang: 'ja' | 'en' | 'ko' =
    rawLang === 'en' || rawLang === 'ko' ? rawLang : 'ja';

  let title = typeof resolvedParams.title === 'string' ? resolvedParams.title : '';
  let shellId = typeof resolvedParams.shell === 'string' ? resolvedParams.shell : 'all';
  let weaponId = typeof resolvedParams.weapon === 'string' ? resolvedParams.weapon : 'w_1';
  let description = 'MARATHON // BUILD & SHARE CLASS SETUP';
  let modsMap: Record<string, string> = {};

  if (id) {
    const { data } = await supabase.from('builds').select('*').eq('id', id).single();
    if (data) {
      title = data.title || title;
      shellId = data.shell_id || shellId;
      weaponId = data.weapon_id || weaponId;
      if (data.comment) description = data.comment;
      if (data.mods && typeof data.mods === 'object') {
        modsMap = data.mods as Record<string, string>;
      }
    }
  } else {
    const mRaw = resolvedParams.m;
    if (Array.isArray(mRaw)) {
      mRaw.forEach((v) => {
        const [s, mId] = v.split(':');
        if (s && mId) modsMap[s] = mId;
      });
    } else if (typeof mRaw === 'string') {
      const [s, mId] = mRaw.split(':');
      if (s && mId) modsMap[s] = mId;
    }
  }

  const ogParams = new URLSearchParams();
  ogParams.set('lang', lang);
  if (title) ogParams.set('title', title);
  ogParams.set('shell', shellId);
  ogParams.set('weapon', weaponId);
  Object.entries(modsMap).forEach(([slot, mId]) => {
    if (mId) ogParams.append('m', `${slot}:${mId}`);
  });

  const shell = setupData.shells.find((s) => s.id === shellId) || setupData.shells[0];
  const weapon = setupData.weapons.find((w) => w.id === weaponId) || setupData.weapons[0];

  const pageTitle = title
    ? `${title} | 423 Club`
    : '423 Club // MARATHON // BUILD & SHARE CLASS SETUP';

  const fullDesc = `Shell: ${shell.name[lang]} / Weapon: ${weapon.name[lang]} - ${description}`;
  const ogImageUrl = `${BASE_URL}/api/og?${ogParams.toString()}`;

  return {
    title: pageTitle,
    description: fullDesc,
    openGraph: {
      title: pageTitle,
      description: fullDesc,
      type: 'website',
      url: id ? `${BASE_URL}/?id=${id}&lang=${lang}` : BASE_URL,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: pageTitle,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: pageTitle,
      description: fullDesc,
      images: [ogImageUrl],
    },
  };
}

export default function HomePage() {
  return <BuilderClient />;
}