import { useState, useEffect } from "react";
import { db, auth } from "../lib/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
import { checkUserCompany } from "../lib/firebase";
import GoogleLoginButton from "./GoogleLoginButton";

const Dashboard = () => {
  const [proyectos, setProyectos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [companyName, setCompanyName] = useState("");
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      const fetchData = async () => {
        setLoading(true);
        try {
          const companie_id = await checkUserCompany(user.email);

          if (companie_id) {
            const companyDoc = await getDoc(doc(db, "companies", companie_id));
            if (companyDoc.exists()) {
              setCompanyName(companyDoc.data().name);
            } else {
              throw new Error("La compañía asociada no existe.");
            }

            const proyectosRef = collection(db, "proyectos");
            const q = query(
              proyectosRef,
              where("companie_id", "==", companie_id)
            );
            const querySnapshot = await getDocs(q);

            const proyectosData = querySnapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }));
            setProyectos(proyectosData);
          } else {
            setError("No estás asociado a una compañía.");
          }
        } catch (err) {
          setError("Hubo un error al obtener los datos.");
          console.error(err);
        } finally {
          setLoading(false);
        }
      };

      fetchData();
    }
  }, [user]);

  const handleClickProyecto = (id) => {
    window.location.href = `/proyecto/${id}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mx-auto mb-4"></div>
          <p className="text-xl font-medium text-gray-700">Cargando datos...</p>
          <p className="text-sm text-gray-500 mt-2">
            Esto puede tomar unos segundos
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
        <p className="text-red-600 text-xl font-medium mb-4">
          No estás logueado. Por favor, inicia sesión para continuar.
        </p>
        <GoogleLoginButton />
      </div>
    );
  }

  if (error) {
    return <div className="text-center text-xl text-red-500 p-4">{error}</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-4xl font-semibold text-gray-800 mb-6">Dashboard</h1>

      <a
        href="/crear-proyecto"
        className="inline-block bg-blue-600 text-white py-2 px-6 rounded-lg shadow-md hover:bg-blue-700 hover:shadow-lg transition duration-300 mb-6"
      >
        Crear nuevo proyecto
      </a>
      <h2 className="text-3xl font-semibold text-gray-800 mb-6">
        Proyectos de {companyName}
      </h2>
      {proyectos.length === 0 ? (
        <p className="text-lg text-gray-600">
          No hay proyectos asociados a tu compañía.
        </p>
      ) : (
        <ul>
          {proyectos.map((proyecto) => (
            <li
              key={proyecto.id}
              onClick={() => handleClickProyecto(proyecto.id)}
              className="cursor-pointer mb-4"
            >
              <div className="bg-white shadow-md rounded-lg p-4 hover:shadow-xl transition-shadow duration-200">
                <h3 className="text-2xl font-semibold text-gray-800">
                  {proyecto.nombre}
                </h3>
                <p className="text-gray-600 mt-2">{proyecto.descripcion}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Dashboard;
