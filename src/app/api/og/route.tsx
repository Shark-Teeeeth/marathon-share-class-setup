import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import setupData from '../../../../data/setup_data.json';
import { supabase } from '../../../lib/supabase';

export const runtime = 'edge';

const CHIP_LABELS = {
  ja: 'チップ改造パーツ',
  en: 'Chip Mod',
  ko: '칩 개조 부품',
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const buildId = searchParams.get('id');
  const lang = (searchParams.get('lang') as 'ja' | 'en' | 'ko') || 'ja';

  let title = searchParams.get('title') || 'MARATHON // BUILD & SHARE CLASS SETUP';
  let shellId = searchParams.get('shell') || 'all';
  let weaponId = searchParams.get('weapon') || 'w_1';
  let modsMap: Record<string, string> = {};

  if (buildId) {
    const { data } = await supabase.from('builds').select('*').eq('id', buildId).single();
    if (data) {
      title = data.title;
      shellId = data.shell_id;
      weaponId = data.weapon_id;
      modsMap = data.mods || {};
    }
  } else {
    searchParams.getAll('m').forEach((pair) => {
      const [slot, id] = pair.split(':');
      if (slot && id) modsMap[slot] = id;
    });
  }

  const shell = setupData.shells.find((s) => s.id === shellId) || setupData.shells[0];
  const weapon = setupData.weapons.find((w) => w.id === weaponId) || setupData.weapons[0];

  const modEntries = weapon.slots
    .map((slot) => {
      const mId = modsMap[slot];
      if (!mId) return null;
      const isChip = slot === 'チップ';
      const item = isChip
        ? setupData.chips.find((c) => c.id === mId)
        : setupData.mods.find((m) => m.id === mId);
      if (!item) return null;

      const translatedSlot = isChip
        ? CHIP_LABELS[lang]
        : ('slot_label' in item && item.slot_label?.[lang]) || slot;

      return { slot: translatedSlot, name: item.name[lang] || item.name.ja };
    })
    .filter(Boolean) as { slot: string; name: string }[];

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          backgroundColor: '#0d0f12',
          color: '#f0f4f8',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '48px 56px',
          border: '6px solid #c8ff00',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ color: '#c8ff00', fontSize: 28, fontWeight: 800, letterSpacing: '0.1em' }}>
            423 Club // MARATHON BUILD &amp; SHARE CLASS SETUP
          </div>
          <div
            style={{
              backgroundColor: '#1f2630',
              color: '#c8ff00',
              padding: '8px 20px',
              borderRadius: '8px',
              fontSize: 24,
              fontWeight: 700,
            }}
          >
            SHELL: {shell.name[lang] || shell.name.ja}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ fontSize: 52, fontWeight: 900, color: '#ffffff' }}>{title}</div>
          <div style={{ fontSize: 36, fontWeight: 700, color: '#c8ff00' }}>
            WEAPON: {weapon.name[lang] || weapon.name.ja}
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
          {modEntries.length > 0 ? (
            modEntries.map((m, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  backgroundColor: '#161a20',
                  borderLeft: '5px solid #c8ff00',
                  padding: '14px 24px',
                  borderRadius: '6px',
                  minWidth: '250px',
                }}
              >
                <span style={{ fontSize: 18, color: '#8b9bb4' }}>{m.slot}</span>
                <span style={{ fontSize: 26, fontWeight: 700, color: '#f0f4f8' }}>{m.name}</span>
              </div>
            ))
          ) : (
            <div style={{ fontSize: 24, color: '#8b9bb4' }}>No Mods Equipped</div>
          )}
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}