import {
  doc,
  deleteDoc,
  setDoc,
  getDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { User } from 'firebase/auth';

// 郢晢ｽｦ郢晢ｽｼ郢ｧ・ｶ郢晢ｽｼ郢晏干ﾎ溽ｹ晁ｼ斐≦郢晢ｽｼ郢晢ｽｫ郢ｧ蜑・ｽｿ譎擾ｽｭ繝ｻ
export const saveUserProfile = async (user: User) => {
  const userRef = doc(db, 'users', user.uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    await setDoc(userRef, {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || '',
      photoURL: user.photoURL || '',
      createdAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
    });
  } else {
    await setDoc(userRef, {
      lastLoginAt: serverTimestamp(),
    }, { merge: true });
  }
};

// 郢晢ｽｦ郢晢ｽｼ郢ｧ・ｶ郢晢ｽｼ郢晏干ﾎ溽ｹ晁ｼ斐≦郢晢ｽｼ郢晢ｽｫ郢ｧ雋槫徐陟輔・
export const getUserProfile = async (uid: string) => {
  const userRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userRef);
  return userSnap.exists() ? userSnap.data() : null;
};

// 郢ｧ・ｳ郢晢ｽｼ郢ｧ・ｹ騾具ｽｻ鬪ｭ・ｲ
export const enrollCourse = async (uid: string, courseId: string) => {
  const enrollRef = doc(db, 'users', uid, 'enrollments', courseId);
  await setDoc(enrollRef, {
    courseId,
    enrolledAt: serverTimestamp(),
    progress: 0,
    completedLessons: [],
  });
};

// 騾具ｽｻ鬪ｭ・ｲ雋ょ現竏ｩ郢ｧ・ｳ郢晢ｽｼ郢ｧ・ｹ郢ｧ雋槫徐陟輔・
export const getEnrollments = async (uid: string) => {
  const { getDocs, collection } = await import('firebase/firestore');
  const enrollRef = collection(db, 'users', uid, 'enrollments');
  const snap = await getDocs(enrollRef);
  return snap.docs.map(d => d.data());
};

// 郢晢ｽｬ郢昴・縺帷ｹ晢ｽｳ陞ｳ蠕｡・ｺ繝ｻ・帝坎蛟ｬ鮖ｸ
export const completeLesson = async (
  uid: string,
  courseId: string,
  lessonId: number,
  totalLessons: number
) => {
  const enrollRef = doc(db, 'users', uid, 'enrollments', courseId);
  const snap = await getDoc(enrollRef);
  const data = snap.data();
  const completed = data?.completedLessons || [];

  if (!completed.includes(lessonId)) {
    completed.push(lessonId);
  }

  const progress = Math.round((completed.length / totalLessons) * 100);

  await setDoc(enrollRef, {
    completedLessons: completed,
    progress,
    lastAccessedAt: serverTimestamp(),
  }, { merge: true });

  return progress;
};

// 邵ｺ鬆托ｽｰ蜉ｱ竊楢怦・･郢ｧ鬘假ｽｿ・ｽ陷会｣ｰ/陷台ｼ∝求
export const toggleFavorite = async (uid: string, courseId: string) => {
  const favRef = doc(db, 'users', uid, 'favorites', courseId);
  const favSnap = await getDoc(favRef);

  if (favSnap.exists()) {
    await deleteDoc(favRef);
    return false;
  } else {
    await setDoc(favRef, {
      courseId,
      addedAt: serverTimestamp(),
    });
    return true;
  }
};

// 邵ｺ鬆托ｽｰ蜉ｱ竊楢怦・･郢ｧ雍具ｽｸﾂ髫包ｽｧ郢ｧ雋槫徐陟輔・
export const getFavorites = async (uid: string) => {
  const { getDocs, collection } = await import('firebase/firestore');
  const favRef = collection(db, 'users', uid, 'favorites');
  const snap = await getDocs(favRef);
  return snap.docs.map(d => d.data().courseId as string);
};