import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import setupData from '../../../../data/setup_data.json';

export const runtime = 'edge';

const SLOT_LABELS: Record<string, { ja: string; en: string; ko: string }> = {
  オプティック: { ja: 'オプティック', en: 'Optic', ko: '조준경' },
  バレル: { ja: 'バレル', en: 'Barrel', ko: '총열' },
  マガジン: { ja: 'マガジン', en: 'Magazine', ko: '탄창' },
  ストック: { ja: 'ストック', en: 'Stock', ko: '개머리판' },
  グリップ: { ja: 'グリップ', en: 'Grip', ko: '손잡이' },
  アンダーバレル: { ja: 'アンダーバレル', en: 'Underbarrel', ko: '하부 총열' },
  マズル: { ja: 'マズル', en: 'Muzzle', ko: '총구' },
  チップ: { ja: 'チップ改造パーツ', en: 'Chip Mod', ko: '칩 개조 부품' },
};

const SHELL_IMAGE_MAP: Record<string, string> = {
  shell_1: 'destroyer',
  shell_2: 'vandal',
  shell_3: 'recon',
  shell_4: 'assassin',
  shell_5: 'triage',
  shell_6: 'thief',
  shell_7: 'sentinel',
  shell_8: 'bishop',
};

function getItemDescription(item: unknown, lang: 'ja' | 'en' | 'ko'): string {
  if (!item || typeof item !== 'object') return '';
  const record = item as Record<string, unknown>;
  const rawDesc = record.desc ?? record.description ?? record.effect ?? record.detail;
  if (!rawDesc) return '';
  if (typeof rawDesc === 'string') return rawDesc;
  if (typeof rawDesc === 'object') {
    const langObj = rawDesc as Record<string, string>;
    return langObj[lang] || langObj.ja || langObj.en || '';
  }
  return '';
}

export async function GET(req: NextRequest) {
  try {
    const reqUrl = new URL(req.url);
    const { searchParams, origin } = reqUrl;
    const rawLang = searchParams.get('lang');
    const lang: 'ja' | 'en' | 'ko' =
      rawLang === 'en' || rawLang === 'ko' ? rawLang : 'ja';

    const title = searchParams.get('title') || 'MARATHON // BUILD & SHARE CLASS SETUP';
    const userName = searchParams.get('user') || '';
    const comment = searchParams.get('comment') || '';
    const shellId = searchParams.get('shell') || 'all';
    const weaponId = searchParams.get('weapon') || 'w_1';
    const modsMap: Record<string, string> = {};

    searchParams.getAll('m').forEach((pair) => {
      const [slot, id] = pair.split(':');
      if (slot && id) modsMap[slot] = id;
    });

    const shell = setupData.shells.find((s) => s.id === shellId) || setupData.shells[0];
    const weapon = setupData.weapons.find((w) => w.id === weaponId) || setupData.weapons[0];

    const shellFileName = SHELL_IMAGE_MAP[shellId] || null;
    const shellImageUrl = shellFileName ? `${origin}/shells/${shellFileName}.png` : null;

    const modEntries = weapon.slots
      .map((slot) => {
        const mId = modsMap[slot];
        if (!mId) return null;
        const isChip = slot === 'チップ';
        const modItem = setupData.mods.find((m) => m.id === mId);
        const chipItem = setupData.chips.find((c) => c.id === mId);
        const item = isChip ? chipItem : modItem;
        if (!item) return null;

        const translatedSlot = SLOT_LABELS[slot]?.[lang] || slot;
        const descText = getItemDescription(item, lang);

        return {
          slot: translatedSlot,
          name: item.name[lang] || item.name.ja,
          desc: descText,
        };
      })
      .filter(Boolean) as { slot: string; name: string; desc: string }[];

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
            padding: '36px 48px',
            border: '6px solid #c8ff00',
            fontFamily: 'sans-serif',
          }}
        >
          {/* 上段：サイトタイトル ＋ シェル/武器バッジ */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <div style={{ display: 'flex', color: '#c8ff00', fontSize: 22, fontWeight: 800 }}>
              423 Club // MARATHON BUILD &amp; SHARE CLASS SETUP
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <div
                style={{
                  display: 'flex',
                  backgroundColor: '#1f2630',
                  color: '#c8ff00',
                  padding: '6px 16px',
                  borderRadius: '8px',
                  fontSize: 20,
                  fontWeight: 700,
                }}
              >
                {shell.name[lang] || shell.name.ja}
              </div>
              <div
                style={{
                  display: 'flex',
                  backgroundColor: '#1e2631',
                  color: '#d0d8e4',
                  padding: '6px 16px',
                  borderRadius: '8px',
                  fontSize: 20,
                  fontWeight: 700,
                }}
              >
                {weapon.name[lang] || weapon.name.ja}
              </div>
            </div>
          </div>

          {/* 中段：シェル画像 ＋ ビルド名・投稿者名・コメント */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px', width: '100%' }}>
            {shellImageUrl ? (
              <div
                style={{
                  display: 'flex',
                  width: '132px',
                  height: '132px',
                  borderRadius: '14px',
                  border: '3px solid #c8ff00',
                  overflow: 'hidden',
                  backgroundColor: '#161a20',
                  flexShrink: 0,
                }}
              >
                <img
                  src={shellImageUrl}
                  alt={shell.name[lang] || shell.name.ja}
                  width={132}
                  height={132}
                  style={{ width: '132px', height: '132px', objectFit: 'cover' }}
                />
              </div>
            ) : (
              <div
                style={{
                  display: 'flex',
                  width: '132px',
                  height: '132px',
                  borderRadius: '14px',
                  border: '3px solid #2e3744',
                  backgroundColor: '#161a20',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#5a6678',
                  fontSize: 56,
                  fontWeight: 800,
                  flexShrink: 0,
                }}
              >
                ×
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
              <div style={{ display: 'flex', fontSize: 42, fontWeight: 900, color: '#ffffff', lineHeight: 1.15 }}>
                {title}
              </div>
              {userName && (
                <div style={{ display: 'flex', fontSize: 22, fontWeight: 700, color: '#c8ff00' }}>
                  by {userName}
                </div>
              )}
              {comment && (
                <div
                  style={{
                    display: 'flex',
                    fontSize: 19,
                    color: '#a3b8cc',
                    marginTop: '2px',
                    lineHeight: 1.35,
                  }}
                >
                  {comment.length > 75 ? `${comment.slice(0, 75)}...` : comment}
                </div>
              )}
            </div>
          </div>

          {/* 下段：装着MOD・チップ一覧（効果詳細付き） */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', width: '100%' }}>
            {modEntries.length > 0 ? (
              modEntries.map((m, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    backgroundColor: '#161a20',
                    borderLeft: '5px solid #c8ff00',
                    padding: '10px 18px',
                    borderRadius: '6px',
                    width: modEntries.length <= 3 ? '352px' : '262px',
                    gap: '4px',
                  }}
                >
                  <div style={{ display: 'flex', fontSize: 14, color: '#8b9bb4', fontWeight: 600 }}>
                    {m.slot}
                  </div>
                  <div style={{ display: 'flex', fontSize: 21, fontWeight: 800, color: '#ffffff' }}>
                    {m.name}
                  </div>
                  {m.desc && (
                    <div
                      style={{
                        display: 'flex',
                        fontSize: 14,
                        color: '#b8c4d4',
                        lineHeight: 1.35,
                        marginTop: '2px',
                      }}
                    >
                      {m.desc.length > 52 ? `${m.desc.slice(0, 52)}...` : m.desc}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div style={{ display: 'flex', fontSize: 22, color: '#8b9bb4' }}>No Mods Equipped</div>
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