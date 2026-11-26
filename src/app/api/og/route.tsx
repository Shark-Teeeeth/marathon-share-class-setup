import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import setupData from '../../../../data/setup_data.json';

export const runtime = 'edge';

const CHIP_LABELS = {
  ja: 'チップ改造パーツ',
  en: 'Chip Mod',
  ko: '칩 개조 부품',
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const buildId = searchParams.get('id');
    const rawLang = searchParams.get('lang');
    const lang: 'ja' | 'en' | 'ko' =
      rawLang === 'en' || rawLang === 'ko' ? rawLang : 'ja';

    let title = searchParams.get('title') || 'MARATHON // BUILD & SHARE CLASS SETUP';
    let shellId = searchParams.get('shell') || 'all';
    let weaponId = searchParams.get('weapon') || 'w_1';
    let modsMap: Record<string, string> = {};

    if (buildId) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (supabaseUrl && supabaseKey) {
        const cleanUrl = supabaseUrl.replace(/\/$/, '');
        const res = await fetch(
          `${cleanUrl}/rest/v1/builds?id=eq.${buildId}&select=*`,
          {
            cache: 'no-store',
            headers: {
              apikey: supabaseKey,
              Authorization: `Bearer ${supabaseKey}`,
              Accept: 'application/json',
            },
          }
        );
        if (res.ok) {
          const rows = await res.json();
          const data = Array.isArray(rows) ? rows[0] : null;
          if (data) {
            title = data.title || title;
            shellId = data.shell_id || shellId;
            weaponId = data.weapon_id || weaponId;
            modsMap = typeof data.mods === 'object' && data.mods !== null ? data.mods : {};
          }
        }
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
        const modItem = setupData.mods.find((m) => m.id === mId);
        const chipItem = setupData.chips.find((c) => c.id === mId);
        const item = isChip ? chipItem : modItem;
        if (!item) return null;

        const translatedSlot = isChip
          ? CHIP_LABELS[lang]
          : modItem?.slot_label?.[lang] || slot;

        return { slot: translatedSlot, name: item.name[lang] || item.name.ja };
      })
      .filter(Boolean) as { slot: string; name: string }[];

    const imgRes = new ImageResponse(
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <div style={{ display: 'flex', color: '#c8ff00', fontSize: 28, fontWeight: 800 }}>
              423 Club // MARATHON BUILD &amp; SHARE CLASS SETUP
            </div>
            <div
              style={{
                display: 'flex',
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

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
            <div style={{ display: 'flex', fontSize: 52, fontWeight: 900, color: '#ffffff' }}>
              {title}
            </div>
            <div style={{ display: 'flex', fontSize: 36, fontWeight: 700, color: '#c8ff00' }}>
              WEAPON: {weapon.name[lang] || weapon.name.ja}
            </div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', width: '100%' }}>
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
                  <div style={{ display: 'flex', fontSize: 18, color: '#8b9bb4' }}>{m.slot}</div>
                  <div style={{ display: 'flex', fontSize: 26, fontWeight: 700, color: '#f0f4f8' }}>{m.name}</div>
                </div>
              ))
            ) : (
              <div style={{ display: 'flex', fontSize: 24, color: '#8b9bb4' }}>No Mods Equipped</div>
            )}
          </div>
        </div>
      ),
      { width: 1200, height: 630 }
    );

    const pngBuffer = await imgRes.arrayBuffer();
    return new Response(pngBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=60',
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? `${e.message}\n${e.stack}` : String(e);
    return new Response(`OG Image Error:\n${msg}`, {
      status: 500,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }
}