import { useState, useEffect } from 'react';
import { db, auth } from '../lib/firebase';
import { collection, getDocs, setDoc, doc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

const UserCompanySelector = () => {
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Obtener las compañías
    const fetchCompanies = async () => {
      try {
        const companiesCollection = collection(db, "companies");
        const querySnapshot = await getDocs(companiesCollection);
        const companiesList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setCompanies(companiesList);
      } catch (error) {
        console.error("Error al obtener compañías:", error);
      }
    };

    // Verificar si hay un usuario autenticado
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    fetchCompanies();

    return () => unsubscribe(); 
  }, []);

  const handleCompanySelect = async () => {
    if (!selectedCompany) {
      alert("Por favor, selecciona una compañía.");
      return;
    }

    if (user) {
      try {
        // Guardar la relación en Firestore
        await setDoc(doc(db, "users-companies", user.email), {
          user_email: user.email,
          companie_id: selectedCompany
        });

        window.location.href = '/dashboard'; 
      } catch (error) {
        console.error("Error al guardar la compañía:", error);
      }
    } else {
      alert("No estás autenticado.");
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-white shadow-lg rounded-lg">
  <h1 className="text-2xl font-semibold text-gray-800 mb-4">Selecciona una compañía</h1>
  
  {companies.length > 0 ? (
    <div>
      <p className="text-lg text-gray-700 mb-4">Por favor selecciona una compañía del siguiente listado:</p>
      
      <select
        onChange={(e) => setSelectedCompany(e.target.value)}
        value={selectedCompany}
        className="w-full p-3 mb-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">Seleccione una compañía</option>
        {companies.map((company) => (
          <option key={company.id} value={company.id}>
            {company.name}
          </option>
        ))}
      </select>
      
      <div>
        <button
          onClick={handleCompanySelect}
          className="w-full py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        >
          Continuar
        </button>
      </div>
    </div>
  ) : (
    <p className="text-lg text-gray-600">Cargando las compañías...</p>
  )}
</div>

  );
};

export default UserCompanySelector;
