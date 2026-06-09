import { db } from './firebase';
import { doc, getDoc, setDoc, increment, Timestamp } from 'firebase/firestore';

const DAILY_LIMITS = {
  free: 3,
  pro: 100,
};

export async function checkAndIncrementUsage(
  uid: string,
  tier: 'free' | 'pro' = 'free'
): Promise<{ allowed: boolean; remaining: number; limit: number }> {
  const today = new Date().toISOString().split('T')[0];
  const usageRef = doc(db, `usage/${uid}/daily/${today}`);

  try {
    const docSnap = await getDoc(usageRef);
    const currentCount = docSnap.exists() ? docSnap.data().count : 0;
    const limit = DAILY_LIMITS[tier];

    if (currentCount >= limit) {
      return { allowed: false, remaining: 0, limit };
    }

    await setDoc(usageRef, { count: increment(1), updatedAt: Timestamp.now() }, { merge: true });
    return { allowed: true, remaining: limit - currentCount - 1, limit };
  } catch (error) {
    console.error('Usage check error:', error);
    return { allowed: true, remaining: DAILY_LIMITS[tier], limit: DAILY_LIMITS[tier] };
  }
}
