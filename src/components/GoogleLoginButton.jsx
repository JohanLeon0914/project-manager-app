import React, { useState, useEffect } from "react";
import { auth, loginWithGoogle } from "../lib/firebase";
import { signOut, onAuthStateChanged } from "firebase/auth";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";

const GoogleAuthButton = () => {
  const [user, setUser] = useState(null);

  const db = getFirestore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  const checkUserCompany = async (email) => {
    const usersCompaniesRef = collection(db, "users-companies");
    const q = query(usersCompaniesRef, where("user_email", "==", email));
    const querySnapshot = await getDocs(q);

    return querySnapshot.empty
      ? null
      : querySnapshot.docs[0].data().companie_id;
  };

  const handleLogin = async () => {
    try {
      const result = await loginWithGoogle();
      const companyId = await checkUserCompany(result.email);
      console.log(companyId);

      if (!companyId) {
        window.location.href = "/user_companie";
      }
    } catch (error) {
      console.error("Error al iniciar sesión:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  return (
    <div className="mx-auto p-6 bg-white shadow-lg rounded-lg">
      {user ? (
        <div className="text-center space-y-4">
          <p className="text-lg text-gray-800">
            Bienvenido, {user.displayName}
          </p>
          <button
            onClick={handleLogout}
            className="w-full py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            Cerrar sesión
          </button>
          <button
            onClick={() => { window.location.href = "/dashboard" }}
            className="py-2 px-6 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Ver Proyectos
          </button>
        </div>
      ) : (
        <div className="flex justify-center">
          <button
            onClick={handleLogin}
            className="py-2 px-6 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Iniciar sesión con Google
          </button>
        </div>
      )}
    </div>
  );
  
};

export default GoogleAuthButton;
