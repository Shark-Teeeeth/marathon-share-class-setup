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
  let userName = typeof resolvedParams.user === 'string' ? resolvedParams.user : '';
  let shellId = typeof resolvedParams.shell === 'string' ? resolvedParams.shell : 'all';
  let weaponId = typeof resolvedParams.weapon === 'string' ? resolvedParams.weapon : 'w_1';
  let rawComment = typeof resolvedParams.comment === 'string' ? resolvedParams.comment : '';
  let description =
    'Bungie新作PvPvE脱出シューター『Marathon（マラソン）』のシェル・武器・MOD・チップ改造パーツ構成を作成・保存・Discordで画像カード共有できるビルドシミュレーター（日・英・韓対応）。';
  let modsMap: Record<string, string> = {};

  if (id) {
    const { data } = await supabase.from('builds').select('*').eq('id', id).single();
    if (data) {
      title = data.title || title;
      userName = data.user_name || userName;
      shellId = data.shell_id || shellId;
      weaponId = data.weapon_id || weaponId;
      if (data.comment) {
        rawComment = data.comment;
        description = data.comment;
      }
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
  ogParams.set('v', '7');
  ogParams.set('lang', lang);
  if (title) ogParams.set('title', title);
  if (userName) ogParams.set('user', userName);
  if (rawComment) ogParams.set('comment', rawComment);
  ogParams.set('shell', shellId);
  ogParams.set('weapon', weaponId);
  Object.entries(modsMap).forEach(([slot, mId]) => {
    if (mId) ogParams.append('m', `${slot}:${mId}`);
  });

  const shell = setupData.shells.find((s) => s.id === shellId) || setupData.shells[0];
  const weapon = setupData.weapons.find((w) => w.id === weaponId) || setupData.weapons[0];

  const pageTitle = title
    ? `${title}${userName ? ` (by ${userName})` : ''} | 423 Club`
    : '423 Club // MARATHON // BUILD & SHARE CLASS SETUP | マラソン 武器・MODビルド構成共有ツール';

  const fullDesc = title
    ? `Shell: ${shell.name[lang]} / Weapon: ${weapon.name[lang]}${rawComment ? ` - ${rawComment}` : ''}`
    : description;

  const ogImageUrl = `${BASE_URL}/api/og?${ogParams.toString()}`;

  return {
    title: pageTitle,
    description: fullDesc,
    keywords: [
      'Marathon',
      'Bungie',
      'マラソン',
      'ビルド',
      '武器構成',
      'カスタム',
      'MOD',
      'Class Setup',
      'Loadout Builder',
      '423 Club',
      '마라톤',
      '빌드',
    ],
    alternates: {
      canonical: id ? `${BASE_URL}/?id=${id}&lang=${lang}` : BASE_URL,
      languages: {
        ja: `${BASE_URL}/?lang=ja`,
        en: `${BASE_URL}/?lang=en`,
        ko: `${BASE_URL}/?lang=ko`,
      },
    },
    robots: {
      index: true,
      follow: true,
    },
    openGraph: {
      title: pageTitle,
      description: fullDesc,
      type: 'website',
      siteName: '423 Club // MARATHON BUILD & SHARE CLASS SETUP',
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
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: '423 Club // MARATHON // BUILD & SHARE CLASS SETUP',
    url: BASE_URL,
    applicationCategory: 'GameApplication',
    operatingSystem: 'Web',
    inLanguage: ['ja', 'en', 'ko'],
    description:
      'A multilingual loadout and class setup builder for Bungie’s PvPvE extraction shooter Marathon. Customize Runner Shells, weapons, mods, and chip upgrades, save builds, and share rich OGP cards on Discord.',
    about: {
      '@type': 'VideoGame',
      name: 'Marathon',
      author: {
        '@type': 'Organization',
        name: 'Bungie',
      },
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <BuilderClient />
    </>
  );
}