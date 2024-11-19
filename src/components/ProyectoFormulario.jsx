import { useState, useEffect } from 'react';
import { db, auth } from '../lib/firebase'; // Asegúrate de importar auth para obtener el usuario logueado
import { addDoc, collection } from 'firebase/firestore';
import { checkUserCompany } from '../lib/firebase'; // Importa tu función para obtener el companie_id

const ProyectoFormulario = () => {
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [loading, setLoading] = useState(false);
  const [companieId, setCompanieId] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // Estado de carga para esperar el companieId
  const [error, setError] = useState(null); // Para capturar errores y mostrarlos
  const [user, setUser] = useState(null); // Almacenamos el usuario

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      if (currentUser) {
        setUser(currentUser); // Establece el usuario cuando se ha autenticado
      } else {
        setError('No estás logueado. Inicia sesión primero.');
      }
      setIsLoading(false); // Al terminar la autenticación, cambiamos el estado de carga
    });

    return () => unsubscribe(); // Limpiamos la suscripción al componente desmontarse
  }, []);

  useEffect(() => {
    if (user) {
      const getCompanieId = async () => {
        try {
          const companie_id = await checkUserCompany(user.email);
          if (companie_id) {
            setCompanieId(companie_id);
          } else {
            setError('No estás asociado a una compañía.');
          }
        } catch (err) {
          setError('Hubo un error al obtener el companieId.');
          console.error(err);
        }
      };

      getCompanieId();
    }
  }, [user]); // Solo ejecutamos esto cuando el usuario se autentique

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!companieId) {
      alert('Debes estar asociado a una compañía para crear un proyecto.');
      return;
    }

    setLoading(true);

    try {
      // Crear el proyecto y asociarlo con la companie_id
      const proyectoRef = await addDoc(collection(db, 'proyectos'), {
        nombre,
        descripcion,
        companie_id: companieId, // Relacionar el proyecto con la compañía
      });

      alert('Proyecto creado exitosamente');
      window.location.href = '/dashboard'; // Redirigir al dashboard
    } catch (error) {
      console.error("Error al crear el proyecto: ", error);
      alert('Hubo un error al crear el proyecto.');
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return <div>Cargando...</div>; // Mientras esperamos la autenticación y el companieId, mostramos un mensaje de carga
  }

  if (error) {
    return <div>{error}</div>; // Mostrar errores si los hay
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white shadow-lg rounded-lg">
      <form onSubmit={handleSubmit}>
        <div className="mb-6">
          <label className="block text-lg font-semibold text-gray-700 mb-2">Nombre del Proyecto:</label>
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
  
        <div className="mb-6">
          <label className="block text-lg font-semibold text-gray-700 mb-2">Descripción del Proyecto:</label>
          <textarea
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            required
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
  
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {loading ? 'Creando...' : 'Crear Proyecto'}
        </button>
      </form>
    </div>
  );
};

export default ProyectoFormulario;
