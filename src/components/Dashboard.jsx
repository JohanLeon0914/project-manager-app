import { useState, useEffect } from 'react';
import { db, auth } from '../lib/firebase'; // Asegúrate de importar auth y db
import { collection, query, where, getDocs } from 'firebase/firestore';
import { checkUserCompany } from '../lib/firebase'; // Importa la función para obtener el companie_id

const Dashboard = () => {
  const [proyectos, setProyectos] = useState([]); // Almacenamos los proyectos
  const [loading, setLoading] = useState(true); // Estado de carga
  const [error, setError] = useState(null); // Para manejar errores
  const [user, setUser] = useState(null); // Para almacenar el usuario autenticado

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      if (currentUser) {
        setUser(currentUser); // Establece el usuario cuando se ha autenticado
      } else {
        setError('No estás logueado. Inicia sesión primero.');
      }
    });

    return () => unsubscribe(); // Limpiamos la suscripción cuando el componente se desmonta
  }, []);

  useEffect(() => {
    if (user) {
      const getProyectos = async () => {
        try {
          const companie_id = await checkUserCompany(user.email); // Obtén el companie_id

          if (companie_id) {
            const proyectosRef = collection(db, 'proyectos');
            const q = query(proyectosRef, where('companie_id', '==', companie_id));
            const querySnapshot = await getDocs(q);

            const proyectosData = querySnapshot.docs.map(doc => ({
              id: doc.id,  // Añadimos el id del documento
              ...doc.data()
            }));
            setProyectos(proyectosData); // Guardamos los proyectos en el estado
          } else {
            setError('No estás asociado a una compañía.');
          }
        } catch (err) {
          setError('Hubo un error al obtener los proyectos.');
          console.error(err);
        } finally {
          setLoading(false);
        }
      };

      getProyectos();
    }
  }, [user]); // Solo ejecutamos esto cuando el usuario esté autenticado

  const handleClickProyecto = (id) => {
    // Redirigir al usuario a la página del proyecto con el id correspondiente
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
      <h2 className="text-3xl font-semibold text-gray-800 mb-6">Proyectos</h2>
      {proyectos.length === 0 ? (
        <p className="text-lg text-gray-600">No hay proyectos asociados a tu compañía.</p>
      ) : (
        <ul>
          {proyectos.map((proyecto) => (
            <li key={proyecto.id} onClick={() => handleClickProyecto(proyecto.id)} className="cursor-pointer mb-4">
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
