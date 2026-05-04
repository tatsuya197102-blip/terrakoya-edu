import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';

const googleProvider = new GoogleAuthProvider();

// Firestoreにユーザードキュメントを初期作成（なければ作る）
async function ensureUserDoc(user: User) {
  const ref = doc(db, 'users', user.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      uid: user.uid,
      displayName: user.displayName || user.email?.split('@')[0] || 'ユーザー',
      email: user.email || '',
      photoURL: user.photoURL || '',
      enrolledCourses: [],
      completedLessons: {},
      activityDates: [],
      favorites: [],
      createdAt: serverTimestamp(),
      lastAccessedAt: serverTimestamp(),
    });
  }
}

// Google ログイン
export const signInWithGoogle = async () => {
  const result = await signInWithPopup(auth, googleProvider);
  await ensureUserDoc(result.user);
  return result;
};

// メール/パスワード ログイン
export const signInWithEmail = (email: string, password: string) => {
  return signInWithEmailAndPassword(auth, email, password);
};

// メール/パスワード 新規登録
export const signUpWithEmail = async (email: string, password: string) => {
  const result = await createUserWithEmailAndPassword(auth, email, password);
  await ensureUserDoc(result.user);
  return result;
};

// ログアウト
export const logout = () => {
  return signOut(auth);
};

// 認証状態の監視
export const onAuthChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};