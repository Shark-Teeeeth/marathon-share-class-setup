import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { texts, targetLang } = await req.json();
    if (!Array.isArray(texts) || !targetLang) {
      return NextResponse.json({ translations: [] });
    }

    const translations = await Promise.all(
      texts.map(async (text: string) => {
        if (!text || !text.trim()) return text;
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${encodeURIComponent(
          targetLang
        )}&dt=t&q=${encodeURIComponent(text)}`;
        const res = await fetch(url);
        if (!res.ok) return text;
        const data = await res.json();
        return Array.isArray(data?.[0]) ? data[0].map((seg: string[]) => seg[0]).join('') : text;
      })
    );

    return NextResponse.json({ translations });
  } catch {
    return NextResponse.json({ translations: [] }, { status: 500 });
  }
}