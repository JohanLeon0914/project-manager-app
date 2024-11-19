import { useState, useEffect } from "react";
import { auth, db } from "../lib/firebase";
import { collection, getDocs, doc, getDoc, updateDoc, query, where } from "firebase/firestore";

const UserCompanySelector = () => {
  const [user, setUser] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState(null);
  const [companyInfo, setCompanyInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserAndCompanies = async () => {
      try {
        if (!user) return;

        setLoading(true);
        setError(null);

        const companiesCollection = collection(db, "companies");
        const querySnapshot = await getDocs(companiesCollection);
        const companiesList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setCompanies(companiesList);

        const userCompaniesRef = collection(db, "users-companies");
        const userQuery = query(userCompaniesRef, where("user_email", "==", user.email));
        const userCompaniesSnapshot = await getDocs(userQuery);

        if (userCompaniesSnapshot.empty) {
          throw new Error("No se encontró ninguna compañía asociada al usuario.");
        }

        const userCompany = userCompaniesSnapshot.docs[0].data();
        const initialCompanyId = userCompany.companie_id;

        setSelectedCompanyId(initialCompanyId);

        const initialCompany = companiesList.find((company) => company.id === initialCompanyId);
        if (initialCompany) {
          setCompanyInfo(initialCompany);
        } else {
          throw new Error("La compañía asociada al usuario no existe en la lista de compañías.");
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndCompanies();
  }, [user]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  const handleChangeCompany = async (e) => {
    try {
      const newCompanyId = e.target.value;
      setUpdating(true);
      setError(null);

      const userCompaniesRef = collection(db, "users-companies");
      const userQuery = query(userCompaniesRef, where("user_email", "==", user.email));
      const userCompaniesSnapshot = await getDocs(userQuery);

      if (!userCompaniesSnapshot.empty) {
        const userCompanyDoc = userCompaniesSnapshot.docs[0];
        await updateDoc(doc(db, "users-companies", userCompanyDoc.id), {
          companie_id: newCompanyId,
        });
      }

      // Actualizar la información de la nueva compañía seleccionada
      const newCompany = companies.find((company) => company.id === newCompanyId);
      setSelectedCompanyId(newCompanyId);
      setCompanyInfo(newCompany);

      // Notificar al usuario
      alert("Compañía actualizada con éxito.");
    } catch (err) {
      setError("Error al cambiar la compañía: " + err.message);
    } finally {
      setUpdating(false);
    }
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
    return <div className="text-red-600 text-center py-6">{error}</div>;
  }

  return (
    <div className="max-w-lg mx-auto p-6 bg-white shadow-lg rounded-lg">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Selecciona tu Compañía</h2>
      <div className="mb-6">
        <label htmlFor="company-selector" className="block text-gray-700 font-semibold mb-2">
          Compañía:
        </label>
        <select
          id="company-selector"
          value={selectedCompanyId || ""}
          onChange={handleChangeCompany}
          className="w-full border border-gray-300 rounded-lg p-2"
          disabled={updating}
        >
          {companies.map((company) => (
            <option key={company.id} value={company.id}>
              {company.name}
            </option>
          ))}
        </select>
        {updating && (
          <div className="mt-2 text-blue-500 text-sm">
            Actualizando compañía, por favor espera...
          </div>
        )}
      </div>
      <h3 className="text-xl font-semibold text-gray-800 mb-4">Información de la Compañía</h3>
      {companyInfo ? (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-700">Nombre:</h3>
            <p className="text-gray-600">{companyInfo.name}</p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-700">NIT:</h3>
            <p className="text-gray-600">{companyInfo.nit}</p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-700">Teléfono:</h3>
            <p className="text-gray-600">{companyInfo.phone}</p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-700">Dirección:</h3>
            <p className="text-gray-600">{companyInfo.address}</p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-700">Correo Electrónico:</h3>
            <p className="text-gray-600">{companyInfo.email}</p>
          </div>
        </div>
      ) : (
        <p className="text-gray-600">No se encontró información de la compañía.</p>
      )}
    </div>
  );
};

export default UserCompanySelector;
