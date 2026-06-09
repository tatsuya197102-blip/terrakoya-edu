/**
 * TERRAKOYA-edu ユーザーロール定義
 * 先生・保護者・生徒・その他の4区分
 */

export const USER_ROLES = ['teacher', 'parent', 'student', 'other'] as const;
export type UserRole = (typeof USER_ROLES)[number];

/** 招待コードによる検証が必要なロール (なりすまし防止) */
export const VERIFIED_ROLES: readonly UserRole[] = ['teacher', 'parent'];

/** 招待コード不要 (自己申告で OK) */
export const SELF_SELECT_ROLES: readonly UserRole[] = ['student', 'other'];

export function requiresInviteCode(role: UserRole): boolean {
  return VERIFIED_ROLES.includes(role);
}

/** UI 表示用ラベル (i18n キーに使う想定) */
export const ROLE_LABEL_KEY: Record<UserRole, string> = {
  teacher: 'role.teacher', // 先生 / Teacher / المعلم
  parent: 'role.parent',   // 保護者 / Parent / ولي الأمر
  student: 'role.student', // 生徒 / Student / الطالب
  other: 'role.other',     // その他 / Other / آخر
};

/** ロール別のデフォルト遷移先 */
export const ROLE_HOME_PATH: Record<UserRole, string> = {
  teacher: '/teacher',
  parent: '/parent',
  student: '/learn',
  other: '/learn',
};

/** Firestore ドキュメント形 */
export interface UserDoc {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole | null;       // null = 未選択 → /onboarding に強制
  schoolId?: string;            // teacher 用
  studentLinkUid?: string;      // parent → 子の uid
  inviteCodeUsed?: string;      // 監査用
  roleVerifiedAt?: number;      // ms timestamp
  createdAt: number;
  updatedAt: number;
}

export interface InviteCodeDoc {
  code: string;                 // ドキュメント ID と同じ
  role: 'teacher' | 'parent';
  schoolId?: string;
  studentLinkUid?: string;      // parent コード用
  usedBy: string | null;        // 使用済みなら uid
  usedAt: number | null;
  expiresAt: number;            // ms
  createdBy: string;            // 発行 admin uid
  createdAt: number;
  note?: string;                // 「カイロ第3校 校長配布」など
}
