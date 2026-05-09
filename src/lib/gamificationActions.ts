// XP・バッジの付与ロジック（Firestore更新）
import { doc, getDoc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { XP_REWARDS, BADGES, BadgeId } from './gamification';

export async function addXP(userId: string, amount: number): Promise<number> {
  const ref = doc(db, 'users', userId);
  const snap = await getDoc(ref);
  const current = snap.exists() ? (snap.data().xp || 0) : 0;
  const newXP = current + amount;
  await updateDoc(ref, { xp: newXP });
  return newXP;
}

export async function awardBadge(userId: string, badgeId: BadgeId): Promise<boolean> {
  const ref = doc(db, 'users', userId);
  const snap = await getDoc(ref);
  const badges: string[] = snap.exists() ? (snap.data().badges || []) : [];
  if (badges.includes(badgeId)) return false; // 既に持っている
  const badge = BADGES.find(b => b.id === badgeId);
  await updateDoc(ref, { badges: [...badges, badgeId] });
  if (badge && badge.xp > 0) await addXP(userId, badge.xp);
  return true;
}

export async function recordLogin(userId: string): Promise<{ xpGained: number; newBadges: string[]; streak: number }> {
  const ref = doc(db, 'users', userId);
  const snap = await getDoc(ref);
  const data = snap.exists() ? snap.data() : {};

  const today = new Date().toDateString();
  const lastLogin = data.lastLoginDate || '';
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  
  if (lastLogin === today) return { xpGained: 0, newBadges: [], streak: data.streak || 1 };

  const newStreak = lastLogin === yesterday ? (data.streak || 0) + 1 : 1;
  let xpGained = XP_REWARDS.login;
  const newBadges: string[] = [];

  await updateDoc(ref, { lastLoginDate: today, streak: newStreak });

  // 初ログインバッジ
  if (!data.badges?.includes('first_login')) {
    await awardBadge(userId, 'first_login');
    newBadges.push('first_login');
  }

  // ストリークボーナス
  if (newStreak === 3) {
    xpGained += XP_REWARDS.streak3;
    const isNew = await awardBadge(userId, 'streak3');
    if (isNew) newBadges.push('streak3');
  }
  if (newStreak === 7) {
    xpGained += XP_REWARDS.streak7;
    const isNew = await awardBadge(userId, 'streak7');
    if (isNew) newBadges.push('streak7');
  }
  if (newStreak === 30) {
    xpGained += XP_REWARDS.streak30;
    const isNew = await awardBadge(userId, 'streak30');
    if (isNew) newBadges.push('streak30');
  }

  await addXP(userId, xpGained);
  return { xpGained, newBadges, streak: newStreak };
}

export async function recordSubmission(userId: string, submissionCount: number): Promise<{ xpGained: number; newBadges: string[] }> {
  const xpGained = XP_REWARDS.submission;
  const newBadges: string[] = [];
  await addXP(userId, xpGained);

  if (submissionCount === 1) {
    const isNew = await awardBadge(userId, 'first_post');
    if (isNew) newBadges.push('first_post');
  }
  if (submissionCount >= 5) {
    const isNew = await awardBadge(userId, 'posts5');
    if (isNew) newBadges.push('posts5');
  }
  if (submissionCount >= 10) {
    const isNew = await awardBadge(userId, 'posts10');
    if (isNew) newBadges.push('posts10');
  }
  return { xpGained, newBadges };
}

export async function recordContestEntry(userId: string): Promise<{ xpGained: number; newBadges: string[] }> {
  const xpGained = XP_REWARDS.contestEntry;
  const newBadges: string[] = [];
  await addXP(userId, xpGained);
  const isNew = await awardBadge(userId, 'contest_entry');
  if (isNew) newBadges.push('contest_entry');
  return { xpGained, newBadges };
}
