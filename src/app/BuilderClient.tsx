'use client';

import React, { useEffect, useState } from 'react';
import setupData from '../../data/setup_data.json';
import { supabase, SavedBuild } from '../lib/supabase';

type Lang = 'ja' | 'en' | 'ko';

const UI = {
  ja: {
    tabCreate: 'ビルド作成・保存',
    tabBrowse: 'みんなのビルド一覧',
    titlePlaceholder: 'ビルドタイトル（例：近距離特化デモリッションHMG）',
    authorPlaceholder: '作成者名（任意）',
    commentPlaceholder: '立ち回りメモ・コンセプト（任意）',
    shell: '1. シェル選択',
    weapon: '2. 武器選択',
    slots: '3. スロット構成（武器専用）',
    none: '-- なし --',
    chipLabel: 'チップ改造パーツ',
    saveDb: 'データベースに保存＆公開',
    copyUrl: '現在の構成URLをコピー',
    filterShell: 'シェルで絞り込み（すべて）',
    filterWeapon: '武器で絞り込み（すべて）',
    searchPlaceholder: 'タイトル・コメント検索...',
    loadToBuilder: 'ビルダーに読み込む',
    shareBuild: 'Discord共有URLコピー',
    toastSaved: 'データベースに保存しました！共有URLもコピー済みです。',
    toastCopied: 'URLをクリップボードにコピーしました！Discordに貼り付けられます。',
    translating: '翻訳中...',
  },
  en: {
    tabCreate: 'Create & Save',
    tabBrowse: 'Community Builds',
    titlePlaceholder: 'Build Title (e.g. Close-Range Demolition HMG)',
    authorPlaceholder: 'Author Name (Optional)',
    commentPlaceholder: 'Playstyle notes / concept (Optional)',
    shell: '1. Select Shell',
    weapon: '2. Select Weapon',
    slots: '3. Weapon Mod Slots',
    none: '-- None --',
    chipLabel: 'Chip Mod',
    saveDb: 'Save & Publish Build',
    copyUrl: 'Copy Current Setup URL',
    filterShell: 'Filter by Shell (All)',
    filterWeapon: 'Filter by Weapon (All)',
    searchPlaceholder: 'Search title or notes...',
    loadToBuilder: 'Load into Builder',
    shareBuild: 'Copy Discord Share URL',
    toastSaved: 'Saved to database & Share URL copied!',
    toastCopied: 'Share URL copied! Paste it directly into Discord.',
    translating: 'Translating...',
  },
  ko: {
    tabCreate: '빌드 생성 및 저장',
    tabBrowse: '커뮤니티 빌드 목록',
    titlePlaceholder: '빌드 제목 (예: 근거리 특화 데몰리션 HMG)',
    authorPlaceholder: '작성자 이름 (선택 사항)',
    commentPlaceholder: '운용 팁 / 콘셉트 (선택 사항)',
    shell: '1. 쉘 선택',
    weapon: '2. 무기 선택',
    slots: '3. 무기 개조 슬롯',
    none: '-- 없음 --',
    chipLabel: '칩 개조 부품',
    saveDb: 'DB에 저장 및 공개',
    copyUrl: '현재 구성 URL 복사',
    filterShell: '쉘 필터 (전체)',
    filterWeapon: '무기 필터 (전체)',
    searchPlaceholder: '제목 및 메모 검색...',
    loadToBuilder: '빌더로 불러오기',
    shareBuild: 'Discord 공유 URL 복사',
    toastSaved: '저장되었습니다! 공유 URL도 복사되었습니다.',
    toastCopied: 'URL이 복사되었습니다! Discord에 붙여넣으세요.',
    translating: '번역 중...',
  },
};

export default function BuilderClient() {
  const [lang, setLang] = useState<Lang>('ja');
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [comment, setComment] = useState('');
  const [shellId, setShellId] = useState('all');
  const [weaponId, setWeaponId] = useState(setupData.weapons[0]?.id || 'w_1');
  const [selectedMods, setSelectedMods] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const [builds, setBuilds] = useState<SavedBuild[]>([]);
  const [filterShell, setFilterShell] = useState('');
  const [filterWeapon, setFilterWeapon] = useState('');
  const [searchText, setSearchText] = useState('');
  const [toast, setToast] = useState('');

  // ビルドID × 言語ごとの翻訳キャッシュ
  const [translatedMap, setTranslatedMap] = useState<Record<string, Record<string, { title: string; comment: string }>>>({});
  const [isTranslating, setIsTranslating] = useState(false);

  const t = UI[lang];
  const currentWeapon = setupData.weapons.find((w) => w.id === weaponId) || setupData.weapons[0];

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const fetchBuilds = async () => {
    let query = supabase.from('builds').select('*').order('created_at', { ascending: false }).limit(50);
    if (filterShell) query = query.eq('shell_id', filterShell);
    if (filterWeapon) query = query.eq('weapon_id', filterWeapon);
    const { data } = await query;
    if (data) setBuilds(data as SavedBuild[]);
  };

  useEffect(() => {
    fetchBuilds();
  }, [filterShell, filterWeapon]);

  // 言語または一覧データが変わったときに未翻訳のタイトル・コメントを自動翻訳
  useEffect(() => {
    if (builds.length === 0) return;

    const untranslated = builds.filter((b) => !translatedMap[b.id]?.[lang]);
    if (untranslated.length === 0) return;

    let cancelled = false;
    const runTranslate = async () => {
      setIsTranslating(true);
      try {
        const textsToTranslate: string[] = [];
        untranslated.forEach((b) => {
          textsToTranslate.push(b.title || '');
          textsToTranslate.push(b.comment || '');
        });

        const res = await fetch('/api/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ texts: textsToTranslate, targetLang: lang }),
        });

        if (res.ok && !cancelled) {
          const { translations } = await res.json();
          if (Array.isArray(translations) && translations.length === textsToTranslate.length) {
            setTranslatedMap((prev) => {
              const next = { ...prev };
              untranslated.forEach((b, idx) => {
                next[b.id] = {
                  ...(next[b.id] || {}),
                  [lang]: {
                    title: translations[idx * 2] || b.title,
                    comment: translations[idx * 2 + 1] || b.comment,
                  },
                };
              });
              return next;
            });
          }
        }
      } finally {
        if (!cancelled) setIsTranslating(false);
      }
    };

    runTranslate();
    return () => {
      cancelled = true;
    };
  }, [lang, builds]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const qLang = params.get('lang') as Lang;
    if (qLang && UI[qLang]) setLang(qLang);

    const id = params.get('id');
    if (id) {
      supabase
        .from('builds')
        .select('*')
        .eq('id', id)
        .single()
        .then(({ data }) => {
          if (data) applyBuildToBuilder(data as SavedBuild);
        });
      return;
    }

    if (params.get('title')) setTitle(params.get('title')!);
    if (params.get('shell')) setShellId(params.get('shell')!);
    if (params.get('weapon')) setWeaponId(params.get('weapon')!);
    const modsFromUrl: Record<string, string> = {};
    params.getAll('m').forEach((pair) => {
      const [s, mId] = pair.split(':');
      if (s && mId) modsFromUrl[s] = mId;
    });
    if (Object.keys(modsFromUrl).length > 0) setSelectedMods(modsFromUrl);
  }, []);

  const applyBuildToBuilder = (b: SavedBuild) => {
    const tr = translatedMap[b.id]?.[lang];
    setTitle(tr?.title || b.title);
    setAuthor(b.author || '');
    setComment(tr?.comment ?? (b.comment || ''));
    setShellId(b.shell_id);
    setWeaponId(b.weapon_id);
    setSelectedMods(b.mods || {});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleWeaponChange = (newWeaponId: string) => {
    setWeaponId(newWeaponId);
    setSelectedMods({});
  };

  const handleSaveBuild = async () => {
    const finalTitle = title.trim() || `${currentWeapon.name[lang]} Setup`;
    setSaving(true);
    const { data, error } = await supabase
      .from('builds')
      .insert([
        {
          title: finalTitle,
          author: author.trim() || 'Runner',
          shell_id: shellId,
          weapon_id: weaponId,
          mods: selectedMods,
          comment: comment.trim(),
        },
      ])
      .select()
      .single();

    setSaving(false);
    if (!error && data) {
      const shareUrl = `${window.location.origin}/?id=${data.id}&lang=${lang}`;
      navigator.clipboard.writeText(shareUrl);
      showToast(t.toastSaved);
      fetchBuilds();
    } else if (error) {
      alert('保存エラー: ' + error.message);
    }
  };

  const handleCopyParamUrl = () => {
    const params = new URLSearchParams();
    params.set('lang', lang);
    params.set('shell', shellId);
    params.set('weapon', weaponId);
    if (title.trim()) params.set('title', title.trim());
    Object.entries(selectedMods).forEach(([slot, mId]) => {
      if (mId) params.append('m', `${slot}:${mId}`);
    });
    navigator.clipboard.writeText(`${window.location.origin}/?${params.toString()}`);
    showToast(t.toastCopied);
  };

  const handleLike = async (b: SavedBuild) => {
    await supabase.from('builds').update({ likes: b.likes + 1 }).eq('id', b.id);
    setBuilds((prev) => prev.map((item) => (item.id === b.id ? { ...item, likes: item.likes + 1 } : item)));
  };

  const filteredBuilds = builds.filter((b) => {
    const tr = translatedMap[b.id]?.[lang];
    const displayTitle = tr?.title || b.title;
    const displayComment = tr?.comment ?? (b.comment || '');
    const q = searchText.toLowerCase();
    return (
      b.title.toLowerCase().includes(q) ||
      displayTitle.toLowerCase().includes(q) ||
      (b.comment && b.comment.toLowerCase().includes(q)) ||
      displayComment.toLowerCase().includes(q)
    );
  });

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '24px 16px', fontFamily: 'sans-serif' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #2a313c', paddingBottom: 16, marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <img
            src="/logo.png"
            alt="423 Club Logo"
            style={{ height: 56, width: 'auto', objectFit: 'contain', borderRadius: 6 }}
          />
          <div>
            <h1 style={{ margin: 0, color: '#c8ff00', fontSize: '2.4rem', fontWeight: 900, letterSpacing: '0.04em', lineHeight: 1.1 }}>
              423 Club
            </h1>
            <div style={{ color: '#c8ff00', fontSize: '0.9rem', fontWeight: 700, letterSpacing: '0.12em', marginTop: 4, opacity: 0.9 }}>
              MARATHON // BUILD &amp; SHARE CLASS SETUP
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {(['ja', 'en', 'ko'] as Lang[]).map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              style={{
                padding: '6px 12px',
                borderRadius: 4,
                border: '1px solid #2a313c',
                background: lang === l ? '#c8ff00' : '#161a20',
                color: lang === l ? '#000' : '#f0f4f8',
                fontWeight: lang === l ? 'bold' : 'normal',
                cursor: 'pointer',
              }}
            >
              {l === 'ja' ? '日本語' : l === 'en' ? 'EN' : '한국어'}
            </button>
          ))}
        </div>
      </header>

      <section style={{ background: '#161a20', border: '1px solid #2a313c', borderRadius: 8, padding: 20, marginBottom: 32 }}>
        <h2 style={{ marginTop: 0, color: '#c8ff00', fontSize: '1.1rem' }}>{t.tabCreate}</h2>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12, marginBottom: 12 }}>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t.titlePlaceholder}
            style={inputStyle}
          />
          <input
            type="text"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder={t.authorPlaceholder}
            style={inputStyle}
          />
        </div>
        <input
          type="text"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={t.commentPlaceholder}
          style={{ ...inputStyle, marginBottom: 18 }}
        />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 18 }}>
          <div>
            <label style={labelStyle}>{t.shell}</label>
            <select value={shellId} onChange={(e) => setShellId(e.target.value)} style={inputStyle}>
              {setupData.shells.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name[lang]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>{t.weapon}</label>
            <select value={weaponId} onChange={(e) => handleWeaponChange(e.target.value)} style={inputStyle}>
              {setupData.weapons.map((w) => (
                <option key={w.id} value={w.id}>
                  [{w.category[lang]}] {w.name[lang]}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div style={{ fontSize: '0.85rem', color: '#8b9bb4', marginBottom: 18 }}>{currentWeapon?.desc[lang]}</div>

        <label style={labelStyle}>{t.slots}</label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14, marginTop: 8 }}>
          {currentWeapon?.slots.map((slotKey, idx) => {
            const isChip = slotKey === 'チップ';
            const candidates = isChip
              ? setupData.chips
              : setupData.mods.filter((m) => m.slot === slotKey && m.compatible_weapons.includes(weaponId));
            const slotTitle = isChip ? t.chipLabel : candidates[0]?.slot_label[lang] || slotKey;
            const currentVal = selectedMods[slotKey] || '';
            const selectedItem = candidates.find((c) => c.id === currentVal);

            return (
              <div key={slotKey} style={{ borderLeft: '3px solid #c8ff00', paddingLeft: 12, background: '#0d0f12', padding: 12, borderRadius: 6 }}>
                <div style={{ fontSize: '0.8rem', color: '#8b9bb4', marginBottom: 4 }}>
                  SLOT {idx + 1}: {slotTitle}
                </div>
                <select
                  value={currentVal}
                  onChange={(e) => setSelectedMods({ ...selectedMods, [slotKey]: e.target.value })}
                  style={inputStyle}
                >
                  <option value="">{t.none}</option>
                  {candidates.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name[lang]}
                    </option>
                  ))}
                </select>
                {selectedItem && <div style={{ fontSize: '0.8rem', color: '#8b9bb4', marginTop: 6 }}>{selectedItem.desc[lang]}</div>}
              </div>
            );
          })}
        </div>

        <div style={{ display: 'flex', gap: 12, marginTop: 22, flexWrap: 'wrap' }}>
          <button onClick={handleSaveBuild} disabled={saving} style={primaryBtnStyle}>
            {saving ? 'Saving...' : t.saveDb}
          </button>
          <button onClick={handleCopyParamUrl} style={secondaryBtnStyle}>
            {t.copyUrl}
          </button>
        </div>
      </section>

      <section>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <h2 style={{ color: '#c8ff00', fontSize: '1.1rem', margin: 0 }}>{t.tabBrowse}</h2>
          {isTranslating && <span style={{ fontSize: '0.8rem', color: '#8b9bb4' }}>{t.translating}</span>}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.5fr', gap: 10, marginBottom: 18 }}>
          <select value={filterShell} onChange={(e) => setFilterShell(e.target.value)} style={inputStyle}>
            <option value="">{t.filterShell}</option>
            {setupData.shells.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name[lang]}
              </option>
            ))}
          </select>
          <select value={filterWeapon} onChange={(e) => setFilterWeapon(e.target.value)} style={inputStyle}>
            <option value="">{t.filterWeapon}</option>
            {setupData.weapons.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name[lang]}
              </option>
            ))}
          </select>
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder={t.searchPlaceholder}
            style={inputStyle}
          />
        </div>

        <div style={{ display: 'grid', gap: 14 }}>
          {filteredBuilds.map((b) => {
            const shell = setupData.shells.find((s) => s.id === b.shell_id);
            const weapon = setupData.weapons.find((w) => w.id === b.weapon_id);
            const tr = translatedMap[b.id]?.[lang];
            const displayTitle = tr?.title || b.title;
            const displayComment = tr?.comment ?? b.comment;

            return (
              <div key={b.id} style={{ background: '#161a20', border: '1px solid #2a313c', borderRadius: 8, padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                  <div>
                    <div style={{ fontSize: '1.15rem', fontWeight: 'bold', color: '#fff' }}>{displayTitle}</div>
                    <div style={{ fontSize: '0.85rem', color: '#c8ff00', marginTop: 4 }}>
                      SHELL: {shell?.name[lang]} ｜ WEAPON: {weapon?.name[lang]}
                      <span style={{ color: '#8b9bb4', marginLeft: 12 }}>by {b.author}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleLike(b)}
                    style={{ background: '#232933', color: '#c8ff00', border: '1px solid #2a313c', padding: '6px 12px', borderRadius: 6, cursor: 'pointer' }}
                  >
                    ▲ {b.likes}
                  </button>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
                  {Object.entries(b.mods || {}).map(([slot, mId]) => {
                    if (!mId) return null;
                    const isChip = slot === 'チップ';
                    const item = isChip
                      ? setupData.chips.find((c) => c.id === mId)
                      : setupData.mods.find((m) => m.id === mId);
                    if (!item) return null;

                    const translatedSlot = isChip
                      ? t.chipLabel
                      : ('slot_label' in item && item.slot_label?.[lang]) || slot;

                    return (
                      <span key={slot} style={{ background: '#0d0f12', border: '1px solid #2a313c', padding: '4px 10px', borderRadius: 4, fontSize: '0.8rem' }}>
                        <span style={{ color: '#8b9bb4' }}>{translatedSlot}: </span>
                        <strong style={{ color: '#f0f4f8' }}>{item.name[lang]}</strong>
                      </span>
                    );
                  })}
                </div>

                {displayComment && <p style={{ fontSize: '0.85rem', color: '#b0bec5', margin: '10px 0 0' }}>{displayComment}</p>}

                <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
                  <button onClick={() => applyBuildToBuilder(b)} style={smallBtnStyle}>
                    {t.loadToBuilder}
                  </button>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/?id=${b.id}&lang=${lang}`);
                      showToast(t.toastCopied);
                    }}
                    style={smallBtnStyle}
                  >
                    {t.shareBuild}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {toast && (
        <div style={{ position: 'fixed', bottom: 20, right: 20, background: '#c8ff00', color: '#000', padding: '12px 20px', borderRadius: 6, fontWeight: 'bold' }}>
          {toast}
        </div>
      )}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px',
  background: '#0d0f12',
  color: '#f0f4f8',
  border: '1px solid #2a313c',
  borderRadius: 6,
  fontSize: '0.95rem',
  boxSizing: 'border-box',
};
const labelStyle: React.CSSProperties = { display: 'block', fontSize: '0.85rem', color: '#c8ff00', fontWeight: 'bold', marginBottom: 6 };
const primaryBtnStyle: React.CSSProperties = { background: '#c8ff00', color: '#000', border: 'none', padding: '12px 20px', fontWeight: 'bold', borderRadius: 6, cursor: 'pointer', flex: 1 };
const secondaryBtnStyle: React.CSSProperties = { background: '#232933', color: '#f0f4f8', border: '1px solid #2a313c', padding: '12px 20px', borderRadius: 6, cursor: 'pointer', flex: 1 };
const smallBtnStyle: React.CSSProperties = { background: '#232933', color: '#f0f4f8', border: '1px solid #2a313c', padding: '6px 12px', borderRadius: 4, fontSize: '0.8rem', cursor: 'pointer' };