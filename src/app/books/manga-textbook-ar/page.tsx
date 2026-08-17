// MARKER: TERRAKOYA_EDU_TEXTBOOK_AR_V3_TAKEDOWN
// 2026-08-16: 冊子デジタル版は一切出さない方針(紙の価格ラダー保護)。
// 復活時: page.tsx.bak_20260816 を戻し、_archive\manga-textbook-ar の画像を public\books\manga-textbook-ar に戻す。
import { redirect } from "next/navigation";

export default function MangaTextbookArPage() {
  redirect("/courses");
}
