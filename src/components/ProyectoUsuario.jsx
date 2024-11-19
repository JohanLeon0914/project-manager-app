import React, { useEffect, useState } from 'react';
import { db } from '../lib/firebase'; 
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';

const ProyectoUsuario = ({ projectId }) => {
  const [proyecto, setProyecto] = useState(null);
  const [historias, setHistorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const obtenerDatos = async () => {
      try {
        const proyectoRef = doc(db, 'proyectos', projectId);
        const proyectoSnap = await getDoc(proyectoRef);

        if (proyectoSnap.exists()) {
          setProyecto(proyectoSnap.data());
        } else {
          setError('Proyecto no encontrado');
        }

        // Obtener las historias de usuario asociadas al proyecto
        const historiasRef = collection(db, 'historias-de-usuario');
        const q = query(historiasRef, where('project_id', '==', projectId));
        const historiasSnap = await getDocs(q);

        if (!historiasSnap.empty) {
          const historiasData = historiasSnap.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          }));
          setHistorias(historiasData);
        } else {
          setHistorias([]);  
        }
      } catch (err) {
        setError('Hubo un error al obtener los datos');
      } finally {
        setLoading(false);
      }
    };

    obtenerDatos();
  }, [projectId]);

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
    return <p className="text-red-600">{error}</p>;
  }

  const redirigirAHistoria = (id) => {
    window.location.href = `/historiaUsuario/${id}`;
  };

  const redirigirACrearHistoria = () => {
    window.location.href = `/crear-historia/${projectId}`;
  };

  return (
    <div className="p-6 bg-white shadow-md rounded-lg max-w-4xl mx-auto mt-10">
      {proyecto ? (
        <>
          <h2 className="text-3xl font-semibold text-gray-800 mb-4">Proyecto: {proyecto?.nombre}</h2>

          <h3 className="text-2xl font-semibold text-gray-800 mb-4">Historias de usuario:</h3>

          {/* Botón para crear una nueva historia de usuario */}
          <button
            onClick={redirigirACrearHistoria}
            className="bg-green-500 text-white px-4 py-2 rounded-lg mb-6 hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            Crear nueva historia
          </button>

          {historias.length > 0 ? (
            <ul className="space-y-4">
              {historias.map((historia) => (
                <li
                  key={historia.id}
                  className="bg-gray-100 p-4 rounded-lg shadow-sm cursor-pointer"
                  onClick={() => redirigirAHistoria(historia.id)} 
                >
                  <h4 className="text-xl font-semibold text-gray-800">{historia.titulo}</h4>
                  <p className="text-lg text-gray-600 mb-2">{historia.descripcion}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-600">No hay historias de usuario asociadas a este proyecto.</p>
          )}
        </>
      ) : (
        <p className="text-gray-600">No se encontró el proyecto.</p>
      )}
    </div>
  );
};

export default ProyectoUsuario;
