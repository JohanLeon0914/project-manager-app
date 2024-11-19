import { useState, useEffect } from 'react';
import { db, auth } from '../lib/firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { checkUserCompany } from '../lib/firebase';

const Dashboard = () => {
  const [proyectos, setProyectos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [companyName, setCompanyName] = useState('');

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        setError('No estás logueado. Inicia sesión primero.');
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      const fetchData = async () => {
        try {
          const companie_id = await checkUserCompany(user.email);

          if (companie_id) {
            // Obtener el nombre de la compañía
            const companyDoc = await getDoc(doc(db, 'companies', companie_id));
            if (companyDoc.exists()) {
              setCompanyName(companyDoc.data().name);
            } else {
              throw new Error('La compañía asociada no existe.');
            }

            // Obtener los proyectos asociados a la compañía
            const proyectosRef = collection(db, 'proyectos');
            const q = query(proyectosRef, where('companie_id', '==', companie_id));
            const querySnapshot = await getDocs(q);

            const proyectosData = querySnapshot.docs.map((doc) => ({
              id: doc.id, // Añadimos el id del documento
              ...doc.data(),
            }));
            setProyectos(proyectosData);
          } else {
            setError('No estás asociado a una compañía.');
          }
        } catch (err) {
          setError('Hubo un error al obtener los datos.');
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
          <p className="text-sm text-gray-500 mt-2">Esto puede tomar unos segundos</p>
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="text-center text-xl text-red-500">{error}</div>;
  }

  return (
    <div className="p-6">
      <h2 className="text-3xl font-semibold text-gray-800 mb-6">
        Proyectos de {companyName}
      </h2>
      {proyectos.length === 0 ? (
        <p className="text-lg text-gray-600">No hay proyectos asociados a tu compañía.</p>
      ) : (
        <ul>
          {proyectos.map((proyecto) => (
            <li
              key={proyecto.id}
              onClick={() => handleClickProyecto(proyecto.id)}
              className="cursor-pointer mb-4"
            >
              <div className="bg-white shadow-md rounded-lg p-4 hover:shadow-xl transition-shadow duration-200">
                <h3 className="text-2xl font-semibold text-gray-800">{proyecto.nombre}</h3>
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
