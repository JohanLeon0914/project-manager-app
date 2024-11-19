import React, { useEffect, useState } from 'react';
import { db } from '../lib/firebase'; // Importamos la configuración de Firebase
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';

const HistoriaUsuario = ({ historiaId }) => {
  const [historia, setHistoria] = useState(null);
  const [ticketsEditados, setTicketsEditados] = useState([]);
  const [nuevoTicket, setNuevoTicket] = useState({
    descripcion: '',
    comentarios: '',
    estado: 'Activo',
  });
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [loading, setLoading] = useState(false);  // Estado de carga
  const [successMessage, setSuccessMessage] = useState(''); // Mensaje de éxito
  const [error, setError] = useState(null);

  useEffect(() => {
    const obtenerHistoria = async () => {
      try {
        const historiaRef = doc(db, 'historias-de-usuario', historiaId);
        const docSnap = await getDoc(historiaRef);

        if (docSnap.exists()) {
          setHistoria(docSnap.data());
          setTicketsEditados(docSnap.data().tickets || []);
        } else {
          setError('Historia de usuario no encontrada');
        }
      } catch (err) {
        setError('Hubo un error al obtener la historia');
      }
    };

    obtenerHistoria();
  }, [historiaId]);

  const handleTicketChange = (index, field, value) => {
    const updatedTickets = [...ticketsEditados];
    updatedTickets[index] = {
      ...updatedTickets[index],
      [field]: value,
    };
    setTicketsEditados(updatedTickets);
  };

  const handleNuevoTicketChange = (field, value) => {
    setNuevoTicket({
      ...nuevoTicket,
      [field]: value,
    });
  };

  const guardarCambios = async (index) => {
    setLoading(true);  // Mostrar el estado de carga
    try {
      const ticketEditado = ticketsEditados[index];
      const historiaRef = doc(db, 'historias-de-usuario', historiaId);
      const updatedTickets = [...historia.tickets];
      updatedTickets[index] = ticketEditado;

      await updateDoc(historiaRef, { tickets: updatedTickets });

      setHistoria((prevState) => ({
        ...prevState,
        tickets: updatedTickets,
      }));

      // Mensaje de éxito
      setSuccessMessage('Ticket actualizado correctamente!');
    } catch (err) {
      setError('No se pudo guardar los cambios');
    } finally {
      setLoading(false);  // Terminar el estado de carga
      setTimeout(() => setSuccessMessage(''), 3000); // Ocultar el mensaje después de 3 segundos
    }
  };

  const eliminarTicket = async (index) => {
    setLoading(true);  // Mostrar el estado de carga
    try {
      const historiaRef = doc(db, 'historias-de-usuario', historiaId);
      const updatedTickets = [...historia.tickets];
      updatedTickets.splice(index, 1);

      await updateDoc(historiaRef, { tickets: updatedTickets });

      setHistoria((prevState) => ({
        ...prevState,
        tickets: updatedTickets,
      }));

      setTicketsEditados(updatedTickets);
      setSuccessMessage('Ticket eliminado correctamente!');
    } catch (err) {
      setError('Hubo un error al eliminar el ticket');
    } finally {
      setLoading(false);  // Terminar el estado de carga
      setTimeout(() => setSuccessMessage(''), 3000); // Ocultar el mensaje después de 3 segundos
    }
  };

  const confirmarEliminacion = (index) => {
    const ticket = ticketsEditados[index];

    if (ticket.estado === 'Activo') {
      if (window.confirm('¿Estás seguro de que deseas cancelar este ticket? Esto lo eliminará permanentemente.')) {
        eliminarTicket(index);
      }
    } else {
      alert('Solo los tickets activos pueden ser cancelados.');
    }
  };

  const agregarNuevoTicket = async (e) => {
    e.preventDefault();
    setLoading(true);  // Mostrar el estado de carga

    try {
      const historiaRef = doc(db, 'historias-de-usuario', historiaId);
      const updatedTickets = [...historia.tickets, nuevoTicket];

      await updateDoc(historiaRef, {
        tickets: updatedTickets,
      });

      setTicketsEditados(updatedTickets);

      setSuccessMessage('Nuevo ticket creado exitosamente!');
      setNuevoTicket({ descripcion: '', comentarios: '', estado: 'Activo' });
      setMostrarFormulario(false);
    } catch (err) {
      setError('Hubo un error al agregar el ticket');
    } finally {
      setLoading(false);  // Terminar el estado de carga
      setTimeout(() => setSuccessMessage(''), 3000); // Ocultar el mensaje después de 3 segundos
    }
  };

  const toggleFormulario = () => {
    setMostrarFormulario((prev) => !prev);
    if (mostrarFormulario) {
      setNuevoTicket({ descripcion: '', comentarios: '', estado: 'Activo' });
    }
  };

  return (
    <div className="p-6 bg-white shadow-md rounded-lg max-w-4xl mx-auto mt-10">
      {loading && (
        <div className="flex justify-center items-center space-x-2 mb-4">
          <div className="animate-spin rounded-full border-4 border-t-4 border-gray-200 h-8 w-8"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      )}
      {successMessage && (
        <div className="bg-green-500 text-white p-4 rounded-lg mb-4">
          {successMessage}
        </div>
      )}
      {error && (
        <div className="bg-red-500 text-white p-4 rounded-lg mb-4">
          {error}
        </div>
      )}

      {historia ? (
        <div>
          <h2 className="text-3xl font-semibold text-gray-800 mb-4">{historia.titulo}</h2>
          <p className="text-lg text-gray-600 mb-6">{historia.descripcion}</p>

          <h3 className="text-2xl font-semibold text-gray-800 mb-4">Tickets asociados:</h3>

          <button
            onClick={toggleFormulario}
            className={`px-4 py-2 rounded-lg focus:outline-none focus:ring-2 mb-4 ${
              mostrarFormulario
                ? 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-500'
                : 'bg-green-500 text-white hover:bg-green-600 focus:ring-green-500'
            }`}
          >
            {mostrarFormulario ? 'Cancelar' : 'Crear nuevo ticket'}
          </button>

          {mostrarFormulario && (
            <form onSubmit={agregarNuevoTicket} className="space-y-4 mb-6">
              <div className="flex flex-col">
                <label className="font-medium text-gray-700">Descripción:</label>
                <input
                  type="text"
                  value={nuevoTicket.descripcion}
                  onChange={(e) => handleNuevoTicketChange('descripcion', e.target.value)}
                  className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                  disabled={loading}
                />
              </div>
              <div className="flex flex-col">
                <label className="font-medium text-gray-700">Comentarios:</label>
                <textarea
                  value={nuevoTicket.comentarios}
                  onChange={(e) => handleNuevoTicketChange('comentarios', e.target.value)}
                  className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                  disabled={loading}
                />
              </div>
              <div className="flex flex-col">
                <label className="font-medium text-gray-700">Estado:</label>
                <select
                  value={nuevoTicket.estado}
                  onChange={(e) => handleNuevoTicketChange('estado', e.target.value)}
                  className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                  disabled={loading}
                >
                  <option value="Activo">Activo</option>
                  <option value="En Proceso">En Proceso</option>
                  <option value="Finalizado">Finalizado</option>
                </select>
              </div>
              <button
                type="submit"
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                disabled={loading}
              >
                Crear Ticket
              </button>
            </form>
          )}

          {historia.tickets && historia.tickets.length > 0 ? (
            <ul>
              {ticketsEditados.map((ticket, index) => (
                <li key={index} className="mb-4">
                  <form onSubmit={(e) => { e.preventDefault(); guardarCambios(index); }} className="space-y-4">
                    <div className="flex flex-col">
                      <label className="font-medium text-gray-700">Descripción:</label>
                      <input
                        type="text"
                        value={ticket.descripcion}
                        onChange={(e) => handleTicketChange(index, 'descripcion', e.target.value)}
                        className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        readOnly={loading}
                      />
                    </div>
                    <div className="flex flex-col">
                      <label className="font-medium text-gray-700">Comentarios:</label>
                      <textarea
                        value={ticket.comentarios}
                        onChange={(e) => handleTicketChange(index, 'comentarios', e.target.value)}
                        className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        readOnly={loading}
                      />
                    </div>
                    <div className="flex flex-col">
                      <label className="font-medium text-gray-700">Estado:</label>
                      <select
                        value={ticket.estado}
                        onChange={(e) => handleTicketChange(index, 'estado', e.target.value)}
                        className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        disabled={loading}
                      >
                        <option value="Activo">Activo</option>
                        <option value="En Proceso">En Proceso</option>
                        <option value="Finalizado">Finalizado</option>
                      </select>
                    </div>
                    <div className="flex justify-between mt-4">
                      <button
                        type="submit"
                        className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                        disabled={loading}
                      >
                        Guardar cambios
                      </button>
                      <button
                        type="button"
                        onClick={() => confirmarEliminacion(index)}
                        className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                        disabled={loading}
                      >
                        Eliminar
                      </button>
                    </div>
                  </form>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-600">No hay tickets asociados a esta historia de usuario.</p>
          )}
        </div>
      ) : (
        <p className="text-red-600">Historia no encontrada.</p>
      )}
    </div>
  );
};

export default HistoriaUsuario;