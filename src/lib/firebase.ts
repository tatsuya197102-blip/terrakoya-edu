import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };

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