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

function normalizeGlyphs(text: string): string {
  return text
    .replace(/＋/g, '+')
    .replace(/－/g, '-')
    .replace(/％/g, '%')
    .replace(/／/g, '/');
}

function getItemDescription(item: unknown, lang: 'ja' | 'en' | 'ko'): string {
  if (!item || typeof item !== 'object') return '';
  const record = item as Record<string, unknown>;
  const rawDesc = record.desc ?? record.description ?? record.effect ?? record.detail;
  if (!rawDesc) return '';
  if (typeof rawDesc === 'string') return normalizeGlyphs(rawDesc);
  if (typeof rawDesc === 'object') {
    const langObj = rawDesc as Record<string, string>;
    return normalizeGlyphs(langObj[lang] || langObj.ja || langObj.en || '');
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

    const title = normalizeGlyphs(
      searchParams.get('title') || 'MARATHON // BUILD & SHARE CLASS SETUP'
    );
    const userName = normalizeGlyphs(searchParams.get('user') || '');
    const comment = normalizeGlyphs(searchParams.get('comment') || '');
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
          slot: normalizeGlyphs(translatedSlot),
          name: normalizeGlyphs(item.name[lang] || item.name.ja),
          desc: descText,
        };
      })
      .filter(Boolean) as { slot: string; name: string; desc: string }[];

    const isFewMods = modEntries.length <= 2;

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
            padding: '26px 36px',
            border: '6px solid #c8ff00',
            fontFamily: 'sans-serif',
          }}
        >
          {/* 最上段：サイトブランドヘッダー */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <div style={{ display: 'flex', color: '#c8ff00', fontSize: 21, fontWeight: 800, letterSpacing: '0.06em' }}>
              423 Club // MARATHON BUILD &amp; SHARE CLASS SETUP
            </div>
            {userName && (
              <div style={{ display: 'flex', fontSize: 23, fontWeight: 800, color: '#c8ff00' }}>
                by {userName}
              </div>
            )}
          </div>

          {/* 中段：シェル顔画像 ＋ 大きなシェル名・武器名 ＋ ビルドタイトル・コメント */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '26px', width: '100%' }}>
            {shellImageUrl ? (
              <div
                style={{
                  display: 'flex',
                  width: '164px',
                  height: '164px',
                  borderRadius: '16px',
                  border: '4px solid #c8ff00',
                  overflow: 'hidden',
                  backgroundColor: '#161a20',
                  flexShrink: 0,
                }}
              >
                <img
                  src={shellImageUrl}
                  alt={shell.name[lang] || shell.name.ja}
                  width={164}
                  height={164}
                  style={{ width: '164px', height: '164px', objectFit: 'cover' }}
                />
              </div>
            ) : (
              <div
                style={{
                  display: 'flex',
                  width: '164px',
                  height: '164px',
                  borderRadius: '16px',
                  border: '4px solid #2e3744',
                  backgroundColor: '#161a20',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#5a6678',
                  fontSize: 68,
                  fontWeight: 800,
                  flexShrink: 0,
                }}
              >
                ×
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
              {/* シェル名 & 武器名（大サイズ・高コントラスト） */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
                <div
                  style={{
                    display: 'flex',
                    backgroundColor: '#c8ff00',
                    color: '#0d0f12',
                    padding: '6px 18px',
                    borderRadius: '8px',
                    fontSize: 30,
                    fontWeight: 900,
                  }}
                >
                  {normalizeGlyphs(shell.name[lang] || shell.name.ja)}
                </div>
                <div
                  style={{
                    display: 'flex',
                    backgroundColor: '#1e2631',
                    border: '2px solid #3c4859',
                    color: '#ffffff',
                    padding: '6px 20px',
                    borderRadius: '8px',
                    fontSize: 30,
                    fontWeight: 900,
                  }}
                >
                  {normalizeGlyphs(weapon.name[lang] || weapon.name.ja)}
                </div>
              </div>

              {/* ビルドタイトル */}
              <div style={{ display: 'flex', fontSize: 44, fontWeight: 900, color: '#ffffff', lineHeight: 1.12 }}>
                {title.length > 22 ? `${title.slice(0, 22)}...` : title}
              </div>

              {/* コメント */}
              {comment && (
                <div
                  style={{
                    display: 'flex',
                    fontSize: 22,
                    color: '#cbd5e1',
                    lineHeight: 1.3,
                  }}
                >
                  {comment.length > 52 ? `${comment.slice(0, 52)}...` : comment}
                </div>
              )}
            </div>
          </div>

          {/* 下段：装着MOD・チップ一覧（ワイド2列で大きく表示） */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', width: '100%' }}>
            {modEntries.length > 0 ? (
              modEntries.slice(0, 4).map((m, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    backgroundColor: '#161a20',
                    borderLeft: '6px solid #c8ff00',
                    padding: '12px 20px',
                    borderRadius: '8px',
                    width: isFewMods ? '1116px' : '551px',
                    gap: '4px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: 17, color: '#9aa8bc', fontWeight: 700 }}>
                      [{m.slot}]
                    </span>
                    <span style={{ fontSize: 26, fontWeight: 800, color: '#ffffff' }}>
                      {m.name}
                    </span>
                  </div>
                  {m.desc && (
                    <div
                      style={{
                        display: 'flex',
                        fontSize: 19,
                        color: '#cbd5e1',
                        lineHeight: 1.3,
                      }}
                    >
                      {m.desc.length > 56 ? `${m.desc.slice(0, 56)}...` : m.desc}
                    </div>
                  )}
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