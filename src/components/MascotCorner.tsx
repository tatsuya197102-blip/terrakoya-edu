"use client";
/*
 * <MascotCorner/> — 画面の隅にふわっと出る常駐マスコット。
 * layout.tsx に1回置くだけで全ページに出ます。
 * - ページごとにキャラと出る隅が変わる（seed=パス）
 * - pointer-events:none なので下のボタン等のクリックを邪魔しない
 * - 一部ページ（全画面キャンバス等）では自動で非表示
 * - スマホでは少し小さく
 */

import { usePathname } from "next/navigation";
import Mascot from "@/components/Mascot";

// 出したくないページ（前方一致）
const HIDE_ON = ["/paint", "/auto-animate"];

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export default function MascotCorner() {
  const pathname = usePathname() || "/";
  if (pathname === "/" || HIDE_ON.some((p) => pathname.startsWith(p))) return null;

  // ページごとに四隅のどれかへ安定配置
  const corners: React.CSSProperties[] = [
    { bottom: 10, right: 10 },
    { bottom: 10, left: 10 },
  ];
  const pos = corners[hash(pathname) % corners.length];

  return (
    <div aria-hidden className="mc-wrap" style={{ position: "fixed", zIndex: 30, pointerEvents: "none", ...pos }}>
      <div className="mc-float">
        <Mascot seed={pathname} size={96} alt="" />
      </div>
      <style>{`
        .mc-float{
          animation: mcFloat 3.2s ease-in-out infinite;
          filter: drop-shadow(0 6px 12px rgba(0,0,0,.35));
          opacity:.97;
        }
        @keyframes mcFloat{
          0%,100%{ transform: translateY(0) }
          50%{ transform: translateY(-8px) }
        }
        @media (max-width: 640px){
          .mc-wrap{ transform: scale(.62); transform-origin: bottom; }
        }
      `}</style>
    </div>
  );
}
