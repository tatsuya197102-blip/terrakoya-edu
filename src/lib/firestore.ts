import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { User } from 'firebase/auth';

// ユーザープロフィールを保存
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

// ユーザープロフィールを取得
export const getUserProfile = async (uid: string) => {
  const userRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userRef);
  return userSnap.exists() ? userSnap.data() : null;
};

// コース登録
export const enrollCourse = async (uid: string, courseId: string) => {
  const enrollRef = doc(db, 'users', uid, 'enrollments', courseId);
  await setDoc(enrollRef, {
    courseId,
    enrolledAt: serverTimestamp(),
    progress: 0,
    completedLessons: [],
  });
};

// 登録済みコースを取得
export const getEnrollments = async (uid: string) => {
  const { getDocs, collection } = await import('firebase/firestore');
  const enrollRef = collection(db, 'users', uid, 'enrollments');
  const snap = await getDocs(enrollRef);
  return snap.docs.map(d => d.data());
};

// レッスン完了を記録
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