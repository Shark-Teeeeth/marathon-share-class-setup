'use client';

import React, { useState, useEffect, useMemo } from 'react';
import setupData from '../../data/setup_data.json';
import { supabase } from '../lib/supabase';

type Lang = 'ja' | 'en' | 'ko';

const SITE_URL = 'https://marathon-share-class-setup.vercel.app';
const TERMS_STORAGE_KEY = '423club_marathon_terms_accepted_v1';
const MY_PINS_STORAGE_KEY = '423club_marathon_my_pins_v1';

interface SavedBuild {
  id: string;
  title: string;
  shell_id: string;
  weapon_id: string;
  mods: Record<string, string>;
  comment: string | null;
  created_at: string;
}

const UI_TEXT = {
  ja: {
    titlePlaceholder: 'ビルド名を入力（例：対人近距離特化カスタム）',
    shellLabel: '1. シェルを選択',
    weaponLabel: '2. 武器を選択',
    modsLabel: '3. 装着パーツ・チップを選択',
    commentPlaceholder: '立ち回りメモ・コメント（任意）',
    pinLabel: '削除用4桁パスコード（任意）',
    pinPlaceholder: '例: 1234',
    saveBtn: 'ビルドを保存してURL発行',
    savingBtn: '保存中...',
    copyParamBtn: '構成URLをコピー（DB保存なし）',
    copiedMsg: 'コピーしました！Discord等に貼り付けて共有できます',
    listTitle: 'みんなの投稿ビルド一覧',
    filterShell: 'シェルで絞り込み：',
    filterWeapon: '武器で絞り込み：',
    allOption: 'すべて表示',
    loadBtn: 'この構成を読み込む',
    shareBtn: 'Discord共有URLコピー',
    deleteBtn: '削除',
    deleteModalTitle: 'ビルドの削除',
    deleteModalDesc: '作成時に設定した4桁のパスコードを入力してください。',
    deleteConfirmBtn: '削除を実行',
    deleteCancelBtn: 'キャンセル',
    deleteSuccess: 'ビルドを削除しました。',
    deleteFail: 'パスコードが一致しないか、削除パスコードが未設定の投稿です。',
    pinInvalidAlert: '削除用パスコードは半角数字4桁で入力してください（空欄も可）。',
    noBuilds: 'まだ投稿されたビルドがありません。最初のビルドを作成してみましょう！',
    chipSlot: 'チップ改造パーツ',
    emptySlot: '-- 未装着 --',
    alertNoTitle: 'ビルド名を入力してください',
    termsTitle: 'ご利用にあたって（利用規約・注意事項）',
    termsIntro:
      '本サイト「423 Club // MARATHON // BUILD & SHARE CLASS SETUP」は、世界中のプレイヤーが自由にビルド構成を作成・共有できるコミュニティツールです。以下のルールに同意のうえご利用ください。',
    termsRules: [
      '個人情報（本名・住所・電話番号・メールアドレス・SNSアカウント等の特定につながる情報）の投稿を禁止します。',
      '他者への誹謗中傷、差別的表現、暴力的・わいせつな内容、その他公序良俗に反する記載を禁止します。',
      'スパム行為、荒らし行為、サイト運営を妨害する不正アクセスや自動投稿を禁止します。',
      '上記に違反する投稿、または不適切と判断された投稿は、管理者権限により予告なく削除します。',
      '誤って投稿した場合は、作成時に設定した4桁のパスコードを使用してご自身で削除できます。',
    ],
    termsAgreeBtn: '上記規約に同意してサイトを利用する',
    aboutTitle: 'About This Tool / FAQ',
    aboutDesc:
      '423 Club Marathon Build & Share Class Setup は、Bungie の PvPvE 脱出シューター『Marathon』向けの無料カスタムビルド共有ツールです。ランナーシェル、武器、各種MOD、チップ改造パーツを組み合わせて保存し、Discord に貼るだけで構成カード画像を自動展開できます。',
  },
  en: {
    titlePlaceholder: 'Enter Build Title (e.g., Close-Range PvP Shredder)',
    shellLabel: '1. Select Runner Shell',
    weaponLabel: '2. Select Weapon',
    modsLabel: '3. Select Mods & Chip Upgrades',
    commentPlaceholder: 'Playstyle notes / comments (Optional)',
    pinLabel: '4-Digit Delete PIN (Optional)',
    pinPlaceholder: 'e.g. 1234',
    saveBtn: 'Save Build & Generate Share URL',
    savingBtn: 'Saving...',
    copyParamBtn: 'Copy Stateless URL (No DB Save)',
    copiedMsg: 'Copied! Paste it into Discord to preview your build card.',
    listTitle: 'Community Builds',
    filterShell: 'Filter by Shell:',
    filterWeapon: 'Filter by Weapon:',
    allOption: 'All',
    loadBtn: 'Load Setup',
    shareBtn: 'Copy Discord URL',
    deleteBtn: 'Delete',
    deleteModalTitle: 'Delete Build',
    deleteModalDesc: 'Enter the 4-digit PIN you set when creating this build.',
    deleteConfirmBtn: 'Confirm Delete',
    deleteCancelBtn: 'Cancel',
    deleteSuccess: 'Build deleted successfully.',
    deleteFail: 'Incorrect PIN or no delete PIN was set for this build.',
    pinInvalidAlert: 'Please enter a 4-digit numeric PIN (or leave it blank).',
    noBuilds: 'No builds submitted yet. Be the first to share your setup!',
    chipSlot: 'Chip Mod',
    emptySlot: '-- None --',
    alertNoTitle: 'Please enter a build title.',
    termsTitle: 'Terms of Use & Community Guidelines',
    termsIntro:
      'Welcome to "423 Club // MARATHON // BUILD & SHARE CLASS SETUP", a global community tool for sharing Marathon loadouts. Please read and agree to the following rules before entering:',
    termsRules: [
      'Do NOT post personal information (real names, addresses, phone numbers, emails, or private account details).',
      'Harassment, hate speech, discriminatory remarks, NSFW content, or anything offensive to public order and morals is strictly prohibited.',
      'Spamming, trolling, automated scraping, or any activity that disrupts the service is prohibited.',
      'Any content violating these guidelines will be removed by administrators without prior notice.',
      'If you post by mistake, you can delete your own build using the 4-digit PIN set during creation.',
    ],
    termsAgreeBtn: 'I Agree to the Terms & Enter Site',
    aboutTitle: 'About This Tool / FAQ',
    aboutDesc:
      '423 Club Marathon Build & Share Class Setup is a free multilingual loadout builder for Bungie’s PvPvE extraction shooter Marathon. Customize Runner Shells, weapons, mods, and chip upgrades, and share auto-generated visual loadout cards directly on Discord.',
  },
  ko: {
    titlePlaceholder: '빌드 이름 입력 (예: 근거리 PvP 특화 세팅)',
    shellLabel: '1. 쉘 선택',
    weaponLabel: '2. 무기 선택',
    modsLabel: '3. 장착 부품 및 칩 선택',
    commentPlaceholder: '운용 팁 / 코멘트 (선택 사항)',
    pinLabel: '삭제용 4자리 비밀번호 (선택)',
    pinPlaceholder: '예: 1234',
    saveBtn: '빌드 저장 및 공유 URL 발급',
    savingBtn: '저장 중...',
    copyParamBtn: '구성 URL 복사 (DB 저장 안 함)',
    copiedMsg: '복사되었습니다! Discord 등에 붙여넣어 공유하세요.',
    listTitle: '커뮤니티 빌드 목록',
    filterShell: '쉘 필터:',
    filterWeapon: '무기 필터:',
    allOption: '전체 보기',
    loadBtn: '이 구성 불러오기',
    shareBtn: 'Discord 공유 URL 복사',
    deleteBtn: '삭제',
    deleteModalTitle: '빌드 삭제',
    deleteModalDesc: '빌드 생성 시 설정한 4자리 비밀번호를 입력하세요.',
    deleteConfirmBtn: '삭제 실행',
    deleteCancelBtn: '취소',
    deleteSuccess: '빌드가 삭제되었습니다.',
    deleteFail: '비밀번호가 일치하지 않거나 삭제 비밀번호가 설정되지 않은 게시물입니다.',
    pinInvalidAlert: '삭제용 비밀번호는 숫자 4자리로 입력해 주세요 (비워두기 가능).',
    noBuilds: '아직 등록된 빌드가 없습니다. 첫 번째 빌드를 만들어 보세요!',
    chipSlot: '칩 개조 부품',
    emptySlot: '-- 미장착 --',
    alertNoTitle: '빌드 이름을 입력해 주세요.',
    termsTitle: '이용약관 및 주의사항',
    termsIntro:
      '"423 Club // MARATHON // BUILD & SHARE CLASS SETUP"은 전 세계 플레이어가 자유롭게 빌드 구성을 만들고 공유하는 커뮤니티 도구입니다. 아래 규칙에 동의한 후 이용해 주세요.',
    termsRules: [
      '개인정보(실명, 주소, 전화번호, 이메일, 개인 계정 등 식별 가능한 정보) 게시를 금지합니다.',
      '타인에 대한 비방, 차별적 표현, 폭력적·음란한 내용 및 미풍양속에 반하는 게시물 작성을 금지합니다.',
      '스팸, 도배, 서비스 운영을 방해하는 부정 접근 및 자동 게시를 금지합니다.',
      '위 규정을 위반하거나 부적절하다고 판단되는 게시물은 관리자 권한으로 예고 없이 삭제됩니다.',
      '실수로 게시한 경우, 생성 시 설정한 4자리 비밀번호를 입력하여 직접 삭제할 수 있습니다.',
    ],
    termsAgreeBtn: '위 약관에 동의하고 사이트 이용하기',
    aboutTitle: 'About This Tool / FAQ',
    aboutDesc:
      '423 Club Marathon Build & Share Class Setup은 Bungie의 PvPvE 익스트랙션 슈터 Marathon을 위한 다국어 로드아웃 빌더입니다. 러너 쉘, 무기, 모드, 칩 업그레이드를 조합해 저장하고 Discord에서 자동으로 빌드 카드를 공유할 수 있습니다.',
  },
};

export default function BuilderClient() {
  const [lang, setLang] = useState<Lang>('ja');
  const t = UI_TEXT[lang];

  // 利用規約同意状態（初期値は true にしてマウント後に判定、未同意なら即ロック）
  const [termsAccepted, setTermsAccepted] = useState<boolean>(true);
  const [isMounted, setIsMounted] = useState<boolean>(false);

  const [title, setTitle] = useState('');
  const [selectedShell, setSelectedShell] = useState<string>('all');
  const [selectedWeapon, setSelectedWeapon] = useState<string>(setupData.weapons[0]?.id || 'w_1');
  const [selectedMods, setSelectedMods] = useState<Record<string, string>>({});
  const [comment, setComment] = useState('');
  const [deletePin, setDeletePin] = useState('');

  const [builds, setBuilds] = useState<SavedBuild[]>([]);
  const [filterShell, setFilterShell] = useState<string>('all_filter');
  const [filterWeapon, setFilterWeapon] = useState<string>('all_filter');
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // 削除モーダル用ステート
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [inputDeletePin, setInputDeletePin] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    try {
      const accepted = localStorage.getItem(TERMS_STORAGE_KEY);
      setTermsAccepted(accepted === 'true');
    } catch {
      setTermsAccepted(false);
    }

    const params = new URLSearchParams(window.location.search);
    const urlLang = params.get('lang') as Lang;
    if (urlLang && ['ja', 'en', 'ko'].includes(urlLang)) {
      setLang(urlLang);
    }

    const buildId = params.get('id');
    if (buildId) {
      fetchSingleBuild(buildId);
    } else {
      const pTitle = params.get('title');
      const pShell = params.get('shell');
      const pWeapon = params.get('weapon');
      const pMods = params.getAll('m');
      if (pTitle) setTitle(pTitle);
      if (pShell) setSelectedShell(pShell);
      if (pWeapon) setSelectedWeapon(pWeapon);
      if (pMods.length > 0) {
        const parsedMods: Record<string, string> = {};
        pMods.forEach((pair) => {
          const [slot, mId] = pair.split(':');
          if (slot && mId) parsedMods[slot] = mId;
        });
        setSelectedMods(parsedMods);
      }
    }

    fetchBuilds();
  }, []);

  const handleAcceptTerms = () => {
    try {
      localStorage.setItem(TERMS_STORAGE_KEY, 'true');
    } catch {
      // ignore storage errors
    }
    setTermsAccepted(true);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchBuilds = async () => {
    const { data, error } = await supabase
      .from('builds')
      .select('id, title, shell_id, weapon_id, mods, comment, created_at')
      .order('created_at', { ascending: false })
      .limit(50);
    if (!error && data) {
      setBuilds(data as SavedBuild[]);
    }
  };

  const fetchSingleBuild = async (id: string) => {
    const { data, error } = await supabase
      .from('builds')
      .select('id, title, shell_id, weapon_id, mods, comment, created_at')
      .eq('id', id)
      .single();
    if (!error && data) {
      setTitle(data.title);
      setSelectedShell(data.shell_id);
      setSelectedWeapon(data.weapon_id);
      setSelectedMods(data.mods || {});
      setComment(data.comment || '');
    }
  };

  const currentWeapon = useMemo(() => {
    return setupData.weapons.find((w) => w.id === selectedWeapon) || setupData.weapons[0];
  }, [selectedWeapon]);

  const handleWeaponChange = (newWeaponId: string) => {
    setSelectedWeapon(newWeaponId);
    setSelectedMods({});
  };

  const getOptionsForSlot = (slotName: string) => {
    if (!currentWeapon) return [];
    if (slotName === 'チップ') {
      return setupData.chips.filter((c) => c.weapon_type === currentWeapon.type);
    }
    return setupData.mods.filter(
      (m) => m.weapon_type === currentWeapon.type && m.slot === slotName
    );
  };

  const handleSaveAndShare = async () => {
    if (!title.trim()) {
      alert(t.alertNoTitle);
      return;
    }
    const trimmedPin = deletePin.trim();
    if (trimmedPin !== '' && !/^\d{4}$/.test(trimmedPin)) {
      alert(t.pinInvalidAlert);
      return;
    }

    setIsSaving(true);
    const { data, error } = await supabase
      .from('builds')
      .insert([
        {
          title: title.trim(),
          shell_id: selectedShell,
          weapon_id: selectedWeapon,
          mods: selectedMods,
          comment: comment.trim() || null,
          delete_pin: trimmedPin || null,
        },
      ])
      .select('id')
      .single();

    setIsSaving(false);

    if (!error && data) {
      if (trimmedPin) {
        try {
          const existing = JSON.parse(localStorage.getItem(MY_PINS_STORAGE_KEY) || '{}');
          existing[data.id] = trimmedPin;
          localStorage.setItem(MY_PINS_STORAGE_KEY, JSON.stringify(existing));
        } catch {
          // ignore
        }
      }

      const shareUrl = `${SITE_URL}/?id=${data.id}&lang=${lang}`;
      await navigator.clipboard.writeText(shareUrl);
      showToast(t.copiedMsg);
      fetchBuilds();
    } else {
      alert('Save failed. Please check Supabase configuration.');
    }
  };

  const handleCopyStatelessUrl = async () => {
    const params = new URLSearchParams();
    params.set('lang', lang);
    if (title.trim()) params.set('title', title.trim());
    params.set('shell', selectedShell);
    params.set('weapon', selectedWeapon);
    Object.entries(selectedMods).forEach(([slot, mId]) => {
      if (mId) params.append('m', `${slot}:${mId}`);
    });
    const shareUrl = `${SITE_URL}/?${params.toString()}`;
    await navigator.clipboard.writeText(shareUrl);
    showToast(t.copiedMsg);
  };

  const openDeleteModal = (buildId: string) => {
    setDeleteTargetId(buildId);
    try {
      const savedPins = JSON.parse(localStorage.getItem(MY_PINS_STORAGE_KEY) || '{}');
      setInputDeletePin(savedPins[buildId] || '');
    } catch {
      setInputDeletePin('');
    }
  };

  const handleExecuteDelete = async () => {
    if (!deleteTargetId) return;
    if (!/^\d{4}$/.test(inputDeletePin.trim())) {
      alert(t.pinInvalidAlert);
      return;
    }

    setIsDeleting(true);
    const { data, error } = await supabase.rpc('delete_build_with_pin', {
      target_id: deleteTargetId,
      input_pin: inputDeletePin.trim(),
    });
    setIsDeleting(false);

    if (!error && data === true) {
      setDeleteTargetId(null);
      setInputDeletePin('');
      showToast(t.deleteSuccess);
      fetchBuilds();
    } else {
      alert(t.deleteFail);
    }
  };

  const filteredBuilds = useMemo(() => {
    return builds.filter((b) => {
      if (filterShell !== 'all_filter' && b.shell_id !== filterShell) return false;
      if (filterWeapon !== 'all_filter' && b.weapon_id !== filterWeapon) return false;
      return true;
    });
  }, [builds, filterShell, filterWeapon]);

  return (
    <div style={styles.container}>
      {/* 初回アクセス時の利用規約同意モーダル */}
      {isMounted && !termsAccepted && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalBox}>
            <div style={styles.modalLangRow}>
              {(['ja', 'en', 'ko'] as Lang[]).map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  style={{
                    ...styles.langBtn,
                    ...(lang === l ? styles.langBtnActive : {}),
                  }}
                >
                  {l.toUpperCase()}
                </button>
              ))}
            </div>
            <h2 style={styles.modalTitle}>{t.termsTitle}</h2>
            <p style={styles.modalIntro}>{t.termsIntro}</p>
            <ul style={styles.termsList}>
              {t.termsRules.map((rule, idx) => (
                <li key={idx} style={styles.termsItem}>
                  {rule}
                </li>
              ))}
            </ul>
            <button onClick={handleAcceptTerms} style={styles.primaryBtn}>
              {t.termsAgreeBtn}
            </button>
          </div>
        </div>
      )}

      {/* パスコード削除モーダル */}
      {deleteTargetId && (
        <div style={styles.modalOverlay}>
          <div style={{ ...styles.modalBox, maxWidth: '420px' }}>
            <h3 style={styles.modalTitle}>{t.deleteModalTitle}</h3>
            <p style={styles.modalIntro}>{t.deleteModalDesc}</p>
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={inputDeletePin}
              onChange={(e) => setInputDeletePin(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="0000"
              style={{ ...styles.input, textAlign: 'center', fontSize: '20px', letterSpacing: '0.3em', marginBottom: '16px' }}
            />
            <div style={styles.actionRow}>
              <button
                onClick={handleExecuteDelete}
                disabled={isDeleting}
                style={styles.dangerConfirmBtn}
              >
                {t.deleteConfirmBtn}
              </button>
              <button
                onClick={() => setDeleteTargetId(null)}
                style={styles.secondaryBtn}
              >
                {t.deleteCancelBtn}
              </button>
            </div>
          </div>
        </div>
      )}

      {toastMessage && <div style={styles.toast}>{toastMessage}</div>}

      <header style={styles.header}>
        <div style={styles.brandBlock}>
          <img
            src="/logo.png"
            alt="423 Club"
            style={styles.logo}
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          <div>
            <h1 style={styles.brandTitle}>423 Club</h1>
            <p style={styles.brandSub}>MARATHON // BUILD &amp; SHARE CLASS SETUP</p>
          </div>
        </div>

        <div style={styles.langSwitch}>
          {(['ja', 'en', 'ko'] as Lang[]).map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              style={{
                ...styles.langBtn,
                ...(lang === l ? styles.langBtnActive : {}),
              }}
            >
              {l.toUpperCase()}
            </button>
          ))}
        </div>
      </header>

      <main style={styles.main}>
        <section style={styles.card}>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t.titlePlaceholder}
            style={styles.input}
          />

          <div style={styles.gridTwo}>
            <div>
              <label style={styles.label}>{t.shellLabel}</label>
              <select
                value={selectedShell}
                onChange={(e) => setSelectedShell(e.target.value)}
                style={styles.select}
              >
                {setupData.shells.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name[lang]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={styles.label}>{t.weaponLabel}</label>
              <select
                value={selectedWeapon}
                onChange={(e) => handleWeaponChange(e.target.value)}
                style={styles.select}
              >
                {setupData.weapons.map((w) => (
                  <option key={w.id} value={w.id}>
                    [{w.type_label[lang]}] {w.name[lang]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={styles.slotsSection}>
            <label style={styles.label}>{t.modsLabel}</label>
            <div style={styles.slotsGrid}>
              {currentWeapon?.slots.map((slotName, idx) => {
                const options = getOptionsForSlot(slotName);
                const slotDisplay =
                  slotName === 'チップ'
                    ? t.chipSlot
                    : options[0]?.slot_label?.[lang] || slotName;

                return (
                  <div key={`${slotName}-${idx}`} style={styles.slotBox}>
                    <span style={styles.slotTitle}>{slotDisplay}</span>
                    <select
                      value={selectedMods[slotName] || ''}
                      onChange={(e) =>
                        setSelectedMods((prev) => ({
                          ...prev,
                          [slotName]: e.target.value,
                        }))
                      }
                      style={styles.select}
                    >
                      <option value="">{t.emptySlot}</option>
                      {options.map((opt) => (
                        <option key={opt.id} value={opt.id}>
                          {opt.name[lang]}
                        </option>
                      ))}
                    </select>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={styles.gridCommentPin}>
            <input
              type="text"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={t.commentPlaceholder}
              style={styles.input}
            />
            <div>
              <label style={styles.pinLabel}>{t.pinLabel}</label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={4}
                value={deletePin}
                onChange={(e) => setDeletePin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder={t.pinPlaceholder}
                style={styles.input}
              />
            </div>
          </div>

          <div style={styles.actionRow}>
            <button
              onClick={handleSaveAndShare}
              disabled={isSaving}
              style={styles.primaryBtn}
            >
              {isSaving ? t.savingBtn : t.saveBtn}
            </button>
            <button onClick={handleCopyStatelessUrl} style={styles.secondaryBtn}>
              {t.copyParamBtn}
            </button>
          </div>
        </section>

        <section style={styles.listSection}>
          <div style={styles.listHeader}>
            <h2 style={styles.sectionTitle}>{t.listTitle}</h2>
            <div style={styles.filterRow}>
              <select
                value={filterShell}
                onChange={(e) => setFilterShell(e.target.value)}
                style={styles.filterSelect}
              >
                <option value="all_filter">{t.filterShell} {t.allOption}</option>
                {setupData.shells.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name[lang]}
                  </option>
                ))}
              </select>

              <select
                value={filterWeapon}
                onChange={(e) => setFilterWeapon(e.target.value)}
                style={styles.filterSelect}
              >
                <option value="all_filter">{t.filterWeapon} {t.allOption}</option>
                {setupData.weapons.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name[lang]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {filteredBuilds.length === 0 ? (
            <p style={styles.emptyText}>{t.noBuilds}</p>
          ) : (
            <div style={styles.buildGrid}>
              {filteredBuilds.map((b) => {
                const shellObj = setupData.shells.find((s) => s.id === b.shell_id);
                const weaponObj = setupData.weapons.find((w) => w.id === b.weapon_id);
                return (
                  <div key={b.id} style={styles.buildCard}>
                    <div style={styles.buildCardTop}>
                      <span style={styles.badge}>
                        {shellObj ? shellObj.name[lang] : b.shell_id}
                      </span>
                      <span style={styles.weaponBadge}>
                        {weaponObj ? weaponObj.name[lang] : b.weapon_id}
                      </span>
                    </div>
                    <h3 style={styles.buildTitle}>{b.title}</h3>
                    {b.comment && <p style={styles.buildComment}>{b.comment}</p>}
                    <div style={styles.modTags}>
                      {Object.entries(b.mods || {}).map(([slot, mId]) => {
                        if (!mId) return null;
                        const modItem =
                          setupData.mods.find((m) => m.id === mId) ||
                          setupData.chips.find((c) => c.id === mId);
                        return (
                          <span key={slot} style={styles.modTag}>
                            {modItem ? modItem.name[lang] : mId}
                          </span>
                        );
                      })}
                    </div>
                    <div style={styles.cardActions}>
                      <button
                        onClick={() => {
                          setTitle(b.title);
                          setSelectedShell(b.shell_id);
                          setSelectedWeapon(b.weapon_id);
                          setSelectedMods(b.mods || {});
                          setComment(b.comment || '');
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        style={styles.smallBtn}
                      >
                        {t.loadBtn}
                      </button>
                      <button
                        onClick={async () => {
                          const url = `${SITE_URL}/?id=${b.id}&lang=${lang}`;
                          await navigator.clipboard.writeText(url);
                          showToast(t.copiedMsg);
                        }}
                        style={styles.smallBtnAccent}
                      >
                        {t.shareBtn}
                      </button>
                      <button
                        onClick={() => openDeleteModal(b.id)}
                        style={styles.smallBtnDanger}
                      >
                        {t.deleteBtn}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* SEO / AIO 向けツール概要フッター */}
        <footer style={styles.footer}>
          <h2 style={styles.footerTitle}>{t.aboutTitle}</h2>
          <p style={styles.footerDesc}>{t.aboutDesc}</p>
        </footer>
      </main>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#0d0f12',
    color: '#f0f4f8',
    fontFamily: '"Inter", "Noto Sans JP", "Noto Sans KR", sans-serif',
    paddingBottom: '64px',
  },
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.88)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2000,
    padding: '16px',
  },
  modalBox: {
    backgroundColor: '#161a20',
    border: '2px solid #c8ff00',
    borderRadius: '12px',
    padding: '28px',
    maxWidth: '580px',
    width: '100%',
    boxShadow: '0 20px 50px rgba(0,0,0,0.8)',
  },
  modalLangRow: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '6px',
    marginBottom: '12px',
  },
  modalTitle: {
    margin: '0 0 12px 0',
    fontSize: '20px',
    fontWeight: 800,
    color: '#c8ff00',
  },
  modalIntro: {
    margin: '0 0 14px 0',
    fontSize: '14px',
    lineHeight: 1.6,
    color: '#d0d8e4',
  },
  termsList: {
    margin: '0 0 20px 0',
    paddingLeft: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    fontSize: '13px',
    lineHeight: 1.6,
    color: '#f0f4f8',
  },
  termsItem: {
    color: '#e2e8f0',
  },
  toast: {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    backgroundColor: '#c8ff00',
    color: '#0d0f12',
    padding: '12px 20px',
    borderRadius: '6px',
    fontWeight: 700,
    zIndex: 1000,
    boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 32px',
    borderBottom: '1px solid #232933',
    backgroundColor: '#12151a',
    flexWrap: 'wrap',
    gap: '16px',
  },
  brandBlock: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  logo: {
    width: '48px',
    height: '48px',
    objectFit: 'contain',
  },
  brandTitle: {
    margin: 0,
    fontSize: '22px',
    fontWeight: 800,
    letterSpacing: '0.08em',
    color: '#c8ff00',
  },
  brandSub: {
    margin: '2px 0 0 0',
    fontSize: '11px',
    letterSpacing: '0.16em',
    color: '#8b9bb4',
  },
  langSwitch: {
    display: 'flex',
    gap: '8px',
  },
  langBtn: {
    backgroundColor: '#1c2129',
    color: '#8b9bb4',
    border: '1px solid #2c3440',
    padding: '6px 12px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '12px',
  },
  langBtnActive: {
    backgroundColor: '#c8ff00',
    color: '#0d0f12',
    borderColor: '#c8ff00',
  },
  main: {
    maxWidth: '1040px',
    margin: '32px auto 0',
    padding: '0 20px',
  },
  card: {
    backgroundColor: '#161a20',
    border: '1px solid #252c37',
    borderRadius: '10px',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  input: {
    width: '100%',
    backgroundColor: '#0d0f12',
    border: '1px solid #2e3744',
    color: '#f0f4f8',
    padding: '12px 14px',
    borderRadius: '6px',
    fontSize: '15px',
    boxSizing: 'border-box',
  },
  gridTwo: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: '16px',
  },
  gridCommentPin: {
    display: 'grid',
    gridTemplateColumns: '1fr 220px',
    gap: '16px',
    alignItems: 'end',
  },
  label: {
    display: 'block',
    fontSize: '13px',
    fontWeight: 700,
    color: '#c8ff00',
    marginBottom: '8px',
    letterSpacing: '0.04em',
  },
  pinLabel: {
    display: 'block',
    fontSize: '11px',
    fontWeight: 700,
    color: '#8b9bb4',
    marginBottom: '6px',
  },
  select: {
    width: '100%',
    backgroundColor: '#0d0f12',
    border: '1px solid #2e3744',
    color: '#f0f4f8',
    padding: '10px 12px',
    borderRadius: '6px',
    fontSize: '14px',
  },
  slotsSection: {
    borderTop: '1px solid #232933',
    paddingTop: '16px',
  },
  slotsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
    gap: '12px',
  },
  slotBox: {
    backgroundColor: '#111419',
    border: '1px solid #232933',
    padding: '12px',
    borderRadius: '6px',
  },
  slotTitle: {
    display: 'block',
    fontSize: '12px',
    color: '#8b9bb4',
    marginBottom: '6px',
    fontWeight: 600,
  },
  actionRow: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
  },
  primaryBtn: {
    flex: 1,
    minWidth: '220px',
    backgroundColor: '#c8ff00',
    color: '#0d0f12',
    border: 'none',
    padding: '14px 20px',
    borderRadius: '6px',
    fontWeight: 800,
    fontSize: '15px',
    cursor: 'pointer',
    width: '100%',
  },
  secondaryBtn: {
    backgroundColor: '#232933',
    color: '#f0f4f8',
    border: '1px solid #384152',
    padding: '14px 20px',
    borderRadius: '6px',
    fontWeight: 600,
    fontSize: '14px',
    cursor: 'pointer',
  },
  dangerConfirmBtn: {
    flex: 1,
    backgroundColor: '#e53e3e',
    color: '#ffffff',
    border: 'none',
    padding: '12px 16px',
    borderRadius: '6px',
    fontWeight: 700,
    fontSize: '14px',
    cursor: 'pointer',
  },
  listSection: {
    marginTop: '48px',
  },
  listHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '12px',
    marginBottom: '20px',
  },
  sectionTitle: {
    margin: 0,
    fontSize: '18px',
    fontWeight: 700,
  },
  filterRow: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap',
  },
  filterSelect: {
    backgroundColor: '#161a20',
    border: '1px solid #2e3744',
    color: '#f0f4f8',
    padding: '8px 12px',
    borderRadius: '6px',
    fontSize: '13px',
  },
  emptyText: {
    color: '#8b9bb4',
    textAlign: 'center',
    padding: '32px',
    backgroundColor: '#161a20',
    borderRadius: '8px',
  },
  buildGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '16px',
  },
  buildCard: {
    backgroundColor: '#161a20',
    border: '1px solid #252c37',
    borderRadius: '8px',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  buildCardTop: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '8px',
    fontSize: '12px',
  },
  badge: {
    backgroundColor: '#232933',
    color: '#c8ff00',
    padding: '3px 8px',
    borderRadius: '4px',
    fontWeight: 700,
  },
  weaponBadge: {
    backgroundColor: '#1e2631',
    color: '#a3b8cc',
    padding: '3px 8px',
    borderRadius: '4px',
    fontWeight: 600,
  },
  buildTitle: {
    margin: 0,
    fontSize: '16px',
    fontWeight: 700,
  },
  buildComment: {
    margin: 0,
    fontSize: '13px',
    color: '#9aa8bc',
  },
  modTags: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
    marginTop: '4px',
  },
  modTag: {
    fontSize: '11px',
    backgroundColor: '#0d0f12',
    border: '1px solid #2c3440',
    padding: '3px 7px',
    borderRadius: '4px',
    color: '#d0d8e4',
  },
  cardActions: {
    display: 'flex',
    gap: '8px',
    marginTop: 'auto',
    paddingTop: '10px',
  },
  smallBtn: {
    flex: 1,
    backgroundColor: '#232933',
    color: '#f0f4f8',
    border: 'none',
    padding: '8px',
    borderRadius: '4px',
    fontSize: '12px',
    cursor: 'pointer',
  },
  smallBtnAccent: {
    flex: 1,
    backgroundColor: 'rgba(200, 255, 0, 0.15)',
    color: '#c8ff00',
    border: '1px solid #c8ff00',
    padding: '8px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: 700,
    cursor: 'pointer',
  },
  smallBtnDanger: {
    backgroundColor: 'rgba(229, 62, 62, 0.15)',
    color: '#fc8181',
    border: '1px solid #e53e3e',
    padding: '8px 10px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  footer: {
    marginTop: '56px',
    paddingTop: '24px',
    borderTop: '1px solid #232933',
    color: '#8b9bb4',
  },
  footerTitle: {
    margin: '0 0 8px 0',
    fontSize: '14px',
    fontWeight: 700,
    color: '#a3b8cc',
  },
  footerDesc: {
    margin: 0,
    fontSize: '13px',
    lineHeight: 1.6,
  },
};