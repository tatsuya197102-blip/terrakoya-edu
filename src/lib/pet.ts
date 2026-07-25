// src/lib/pet.ts
// 学校ペット: 給餌ロジック(Phase 1で同梱、Phase 2で各活動から呼ぶ)
// 前提: '@/lib/firebase' が { db } を export していること(パスが違う場合は要修正)

import { db } from "@/lib/firebase";
import {
  doc,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";

export const PET_DOC = "pets/school";
export const DAILY_USER_CAP = 3;

export type PetMood = "sleeping" | "happy" | "delighted" | "satisfied";

export function todayStr(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function moodFor(todayHearts: number, dailyGoal: number): PetMood {
  if (todayHearts <= 0) return "sleeping";
  if (dailyGoal > 0 && todayHearts >= dailyGoal) return "satisfied";
  if (dailyGoal > 0 && todayHearts >= dailyGoal * 0.5) return "delighted";
  return "happy";
}

/**
 * ペットに♥を1あげる。
 * - pets/school が無ければ既定値で作成(セットアップ0)
 * - 日付が変わっていれば todayHearts をリセット
 * - 1人1日3回まで(超過時は { fed:false, reason:"cap" })
 * 戻り値: { fed, userToday, todayHearts }
 */
export async function feedPet(
  uid: string
): Promise<{ fed: boolean; reason?: string; userToday: number; todayHearts: number }> {
  const today = todayStr();
  const petRef = doc(db, "pets", "school");
  const feedRef = doc(db, "pets", "school", "feeds", today);
  const userRef = doc(db, "users", uid);

  return runTransaction(db, async (tx) => {
    const petSnap = await tx.get(petRef);
    const feedSnap = await tx.get(feedRef);
    const userSnap = await tx.get(userRef);

    // --- pets/school の現在値(無ければ既定値) ---
    let pet = petSnap.exists()
      ? (petSnap.data() as any)
      : {
          character: "cat",
          dailyGoal: 20,
          todayDate: today,
          todayHearts: 0,
          termHearts: 0,
          termStartDate: today,
        };

    // --- 日次リセット ---
    if (pet.todayDate !== today) {
      pet.todayDate = today;
      pet.todayHearts = 0;
    }

    // --- 個人上限チェック ---
    const feeds = feedSnap.exists() ? (feedSnap.data() as any) : { total: 0, byUser: {} };
    const userToday = feeds.byUser?.[uid] ?? 0;
    if (userToday >= DAILY_USER_CAP) {
      return { fed: false, reason: "cap", userToday, todayHearts: pet.todayHearts };
    }

    // --- 加算 ---
    pet.todayHearts += 1;
    pet.termHearts = (pet.termHearts ?? 0) + 1;

    tx.set(petRef, { ...pet, updatedAt: serverTimestamp() }, { merge: true });
    tx.set(
      feedRef,
      {
        total: (feeds.total ?? 0) + 1,
        byUser: { ...(feeds.byUser ?? {}), [uid]: userToday + 1 },
      },
      { merge: true }
    );

    // --- users/{uid} 側の記録(Studyとキー名統一: lastActiveDay) ---
    const u = userSnap.exists() ? (userSnap.data() as any) : {};
    tx.set(
      userRef,
      {
        lastActiveDay: today,
        termHearts: (u.termHearts ?? 0) + 1,
      },
      { merge: true }
    );

    return { fed: true, userToday: userToday + 1, todayHearts: pet.todayHearts };
  });
}
