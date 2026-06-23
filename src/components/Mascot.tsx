"use client";
/*
 * <Mascot/> — 寺子屋マスコット（うさぎ / ねこ / とり）を1行でどこにでも置けるコンポーネント。
 * 画像は public/mascots/{name}_{size}.png を参照（透過PNG）。デザインは不変。
 *
 * 使い方の例:
 *   <Mascot name="cat" size={32} />                  // キャラ固定
 *   <Mascot seed="contest" size={28} />              // 場所ごとに固定（同じseedなら常に同じキャラ）
 *   <Mascot seed={user.uid} size={40} rounded />     // プロフィール初期アバター（丸）
 *   <Mascot size={80} />                             // ランダム（装飾用）
 */

import { useEffect, useState } from "react";

export const MASCOTS = ["rabbit", "cat", "bird"] as const;
export type MascotName = (typeof MASCOTS)[number];

const ASSET_SIZES = [96, 128, 256, 512];

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}
// 表示サイズに対し2倍以上の素材を選ぶ（Retina対応）。無ければ最大512。
function assetFor(size: number): number {
  return ASSET_SIZES.find((s) => s >= size * 2) ?? 512;
}

export default function Mascot({
  size = 64,
  name,
  seed,
  rounded = false,
  alt = "",
  className,
  style,
  onClick,
}: {
  size?: number;
  name?: MascotName;
  seed?: string | number;
  rounded?: boolean;
  alt?: string;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}) {
  // 固定（name指定 or seed指定）はSSR/CSRで一致 → ハイドレーション安全。
  const stable: MascotName | null =
    name ?? (seed != null ? MASCOTS[hashStr(String(seed)) % MASCOTS.length] : null);

  // ランダム指定時のみ、マウント後にクライアント側で抽選（不一致警告回避）。
  const [pick, setPick] = useState<MascotName>(stable ?? "cat");
  useEffect(() => {
    if (!stable) setPick(MASCOTS[Math.floor(Math.random() * MASCOTS.length)]);
  }, [stable]);

  const asset = assetFor(size);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/mascots/${pick}_${asset}.png`}
      width={size}
      height={size}
      alt={alt}
      onClick={onClick}
      className={className}
      style={{
        width: size,
        height: size,
        objectFit: "contain",
        display: "inline-block",
        borderRadius: rounded ? "50%" : undefined,
        cursor: onClick ? "pointer" : undefined,
        ...style,
      }}
    />
  );
}
