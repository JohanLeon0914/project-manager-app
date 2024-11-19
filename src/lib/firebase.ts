import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { getFirestore, collection, query, where, getDocs } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyAIJnE8SQCMbKooqmrftJZaOlKnrRvwTGE",
    authDomain: "ticket-app-a6fc8.firebaseapp.com",
    projectId: "ticket-app-a6fc8",
    storageBucket: "ticket-app-a6fc8.firebasestorage.app",
    messagingSenderId: "30772147052",
    appId: "1:30772147052:web:3b8595179d156362e4b949"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const db = getFirestore();

export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error) {
    console.error("Error al iniciar sesión:", error);
    throw error;
  }
};

export const checkUserCompany = async (email: string) => {
  const usersCompaniesRef = collection(db, "users-companies");
  const q = query(usersCompaniesRef, where("user_email", "==", email));
  const querySnapshot = await getDocs(q);

  return querySnapshot.empty ? null : querySnapshot.docs[0].data().companie_id;
};