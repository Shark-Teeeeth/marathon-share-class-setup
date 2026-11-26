import json
import os
import re
import pandas as pd


def split_items(text):
    if not text:
        return []
    # 半角カンマ、全角カンマ、読点のどれでも分割できるようにする
    return [x.strip() for x in re.split(r"[,、，]", str(text)) if x.strip()]


def convert_excel_to_json():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    excel_path = os.path.join(base_dir, "Marathonクラスセットアップ.xlsx")
    output_path = os.path.join(base_dir, "setup_data.json")

    xls = pd.ExcelFile(excel_path)

    # 1. シェル（先頭に「全シェル対応」を自動付与）
    df_shells = pd.read_excel(xls, "シェル").fillna("")
    shells = [
        {
            "id": "all",
            "name": {
                "ja": "全シェル対応",
                "en": "All Shells",
                "ko": "모든 쉘 대응",
            },
        }
    ]
    for idx, row in df_shells.iterrows():
        shells.append({
            "id": f"shell_{idx+1}",
            "name": {
                "ja": str(row["名称"]).strip(),
                "en": str(row.get("名称_en") or row["名称"]).strip(),
                "ko": str(row.get("名称_ko") or row["名称"]).strip(),
            },
        })

    # 2. 武器
    df_weapons = pd.read_excel(xls, "武器").fillna("")
    weapons = []
    weapon_name_to_id = {}
    for idx, row in df_weapons.iterrows():
        w_id = f"w_{idx+1}"
        w_name_ja = str(row["名称"]).strip()
        weapon_name_to_id[w_name_ja] = w_id
        slots = split_items(row.get("装備スロット", ""))

        weapons.append({
            "id": w_id,
            "category": {
                "ja": str(row["種類"]).strip(),
                "en": str(row.get("種類_en") or row["種類"]).strip(),
                "ko": str(row.get("種類_ko") or row["種類"]).strip(),
            },
            "name": {
                "ja": w_name_ja,
                "en": str(row.get("名称_en") or w_name_ja).strip(),
                "ko": str(row.get("名称_ko") or w_name_ja).strip(),
            },
            "desc": {
                "ja": str(row["詳細"]).strip(),
                "en": str(row.get("詳細_en") or row["詳細"]).strip(),
                "ko": str(row.get("詳細_ko") or row["詳細"]).strip(),
            },
            "slots": slots,
        })

    # 3. チップ改造パーツ
    df_chips = pd.read_excel(xls, "チップ改造パーツ").fillna("")
    chips = []
    for idx, row in df_chips.iterrows():
        chips.append({
            "id": f"chip_{idx+1}",
            "slot": "チップ",
            "name": {
                "ja": str(row["名称"]).strip(),
                "en": str(row.get("名称_en") or row["名称"]).strip(),
                "ko": str(row.get("名称_ko") or row["名称"]).strip(),
            },
            "desc": {
                "ja": str(row["詳細"]).strip(),
                "en": str(row.get("詳細_en") or row["詳細"]).strip(),
                "ko": str(row.get("詳細_ko") or row["詳細"]).strip(),
            },
        })

    # 4. 改造パーツ
    df_mods = pd.read_excel(xls, "改造パーツ").fillna("")
    mods = []
    for idx, row in df_mods.iterrows():
        compat_names = split_items(row.get("対応武器名", ""))
        compat_ids = []
        for w_name in compat_names:
            if w_name in weapon_name_to_id:
                compat_ids.append(weapon_name_to_id[w_name])
            else:
                print(
                    f"【警告】改造パーツ「{row['名称']}」の対応武器「{w_name}」が武器シートに見つかりません！"
                )

        mods.append({
            "id": f"mod_{idx+1}",
            "slot": str(row["種類"]).strip(),
            "slot_label": {
                "ja": str(row["種類"]).strip(),
                "en": str(row.get("種類_en") or row["種類"]).strip(),
                "ko": str(row.get("種類_ko") or row["種類"]).strip(),
            },
            "compatible_weapons": compat_ids,
            "name": {
                "ja": str(row["名称"]).strip(),
                "en": str(row.get("名称_en") or row["名称"]).strip(),
                "ko": str(row.get("名称_ko") or row["名称"]).strip(),
            },
            "desc": {
                "ja": str(row["詳細"]).strip(),
                "en": str(row.get("詳細_en") or row["詳細"]).strip(),
                "ko": str(row.get("詳細_ko") or row["詳細"]).strip(),
            },
        })

    data = {
        "shells": shells,
        "weapons": weapons,
        "chips": chips,
        "mods": mods,
    }
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"✅ 変換完了！ {output_path} を出力しました。")


if __name__ == "__main__":
    convert_excel_to_json()