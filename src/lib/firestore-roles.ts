'use client';

import { doc, updateDoc, runTransaction } from 'firebase/firestore';
import { db } from './firebase';
import type { UserRole } from '@/context/AuthContext';

/**
 * 招待コード不要のロール (student/other) を自己選択で設定。
 * Firestore Rules により teacher/parent はここでは弾かれる。
 */
export async function setSelfSelectedRole(
  uid: string,
  role: Extract<UserRole, 'student' | 'other'>
): Promise<void> {
  await updateDoc(doc(db, 'users', uid), {
    role,
    roleVerifiedAt: Date.now(),
    updatedAt: Date.now(),
  });
}

/**
 * 招待コードを使って teacher/parent を確定。
 * トランザクションで「コード未使用 → 使用済み化」と「user に role 付与」を原子化。
 */
export async function claimInviteCode(params: {
  uid: string;
  code: string;
}): Promise<
  | { ok: true; role: 'teacher' | 'parent' }
  | { ok: false; reason: string }
> {
  const code = params.code.trim().toUpperCase();
  const codeRef = doc(db, 'invite_codes', code);
  const userRef = doc(db, 'users', params.uid);

  type CodeData = {
    role: 'teacher' | 'parent';
    usedBy: string | null;
    expiresAt: number;
    schoolId?: string;
    studentLinkUid?: string;
  };

  try {
    const result = await runTransaction(db, async (tx) => {
      const codeSnap = await tx.get(codeRef);
      if (!codeSnap.exists()) throw new Error('CODE_NOT_FOUND');
      const codeData = codeSnap.data() as CodeData;

      if (codeData.usedBy && codeData.usedBy !== params.uid) {
        throw new Error('CODE_ALREADY_USED');
      }
      if (codeData.expiresAt < Date.now()) {
        throw new Error('CODE_EXPIRED');
      }

      const now = Date.now();
      tx.update(codeRef, { usedBy: params.uid, usedAt: now });
      tx.update(userRef, {
        role: codeData.role,
        schoolId: codeData.schoolId ?? null,
        studentLinkUid: codeData.studentLinkUid ?? null,
        inviteCodeUsed: code,
        roleVerifiedAt: now,
        updatedAt: now,
      });
      return { role: codeData.role };
    });
    return { ok: true, role: result.role };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'UNKNOWN';
    const reasonMap: Record<string, string> = {
      CODE_NOT_FOUND: 'コードが見つかりません',
      CODE_ALREADY_USED: '使用済みコードです',
      CODE_EXPIRED: '期限切れのコードです',
    };
    return { ok: false, reason: reasonMap[msg] ?? `エラー: ${msg}` };
  }
}
