import { useState, useEffect } from 'react';
import { db, auth } from '../lib/firebase'; 
import { addDoc, collection } from 'firebase/firestore';
import { checkUserCompany } from '../lib/firebase'; 

const HistoriaFormulario = ({ project_id }) => {
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [ticketDescripcion, setTicketDescripcion] = useState('');
  const [ticketEstado, setTicketEstado] = useState('Activo');
  const [loading, setLoading] = useState(false);
  const [companieId, setCompanieId] = useState(null);
  const [isLoading, setIsLoading] = useState(true); 
  const [error, setError] = useState(null); 
  const [user, setUser] = useState(null); 

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      if (currentUser) {
        setUser(currentUser); 
      } else {
        setError('No estás logueado. Inicia sesión primero.');
      }
      setIsLoading(false); 
    });

    return () => unsubscribe(); 
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
  }, [user]); 

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!companieId) {
      alert('Debes estar asociado a una compañía para crear una historia de usuario.');
      return;
    }

    setLoading(true);

    try {
      const historiaRef = await addDoc(collection(db, 'historias-de-usuario'), {
        titulo,
        descripcion,
        project_id,
        companie_id: companieId, 
        tickets: [
          {
            descripcion: ticketDescripcion,
            estado: ticketEstado,
            comentarios: [],
          },
        ],
      });

      alert('Historia de usuario creada exitosamente');
      window.location.href = '/dashboard'; 
    } catch (error) {
      console.error("Error al crear la historia de usuario: ", error);
      alert('Hubo un error al crear la historia de usuario.');
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return <div>Cargando...</div>; 
  }

  if (error) {
    return <div>{error}</div>; 
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white shadow-lg rounded-lg">
      <form onSubmit={handleSubmit}>
        <div className="mb-6">
          <label className="block text-lg font-semibold text-gray-700 mb-2">Título de la historia de usuario:</label>
          <input
            type="text"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            required
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
  
        <div className="mb-6">
          <label className="block text-lg font-semibold text-gray-700 mb-2">Descripción de la historia de usuario:</label>
          <textarea
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            required
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
  
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Primer ticket asociado</h3>
        
        <div className="mb-6">
          <label className="block text-lg font-semibold text-gray-700 mb-2">Descripción del ticket:</label>
          <textarea
            value={ticketDescripcion}
            onChange={(e) => setTicketDescripcion(e.target.value)}
            required
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
  
        <div className="mb-6">
          <label className="block text-lg font-semibold text-gray-700 mb-2">Estado del ticket:</label>
          <select
            value={ticketEstado}
            onChange={(e) => setTicketEstado(e.target.value)}
            required
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="Activo">Activo</option>
            <option value="En Proceso">En Proceso</option>
            <option value="Finalizado">Finalizado</option>
          </select>
        </div>
  
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {loading ? 'Creando...' : 'Crear Historia de Usuario'}
        </button>
      </form>
    </div>
  );
};

export default HistoriaFormulario;
