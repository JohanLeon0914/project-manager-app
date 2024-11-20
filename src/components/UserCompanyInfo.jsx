import { useState, useEffect } from "react";
import { auth, db } from "../lib/firebase";
import { collection, getDocs, doc, updateDoc, query, where } from "firebase/firestore";
import GoogleLoginButton from "./GoogleLoginButton";
import UserCompanySelector from "./UserCompanySelector";

const UserCompanyInfo = () => {
  const [user, setUser] = useState(null);
  const [authChecking, setAuthChecking] = useState(true); 
  const [companies, setCompanies] = useState([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState(null);
  const [companyInfo, setCompanyInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      setAuthChecking(false); 
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchUserAndCompanies = async () => {
      try {
        if (!user) return;

        setLoading(true);

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
          setSelectedCompanyId(null);
          setCompanyInfo(null);
          return;
        }

        const userCompany = userCompaniesSnapshot.docs[0].data();
        const initialCompanyId = userCompany.companie_id;

        setSelectedCompanyId(initialCompanyId);

        const initialCompany = companiesList.find((company) => company.id === initialCompanyId);
        if (initialCompany) {
          setCompanyInfo(initialCompany);
        }
      } catch (err) {
        console.error("Error al obtener datos:", err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndCompanies();
  }, [user]);

  const handleChangeCompany = async (e) => {
    try {
      const newCompanyId = e.target.value;
      setUpdating(true);

      const userCompaniesRef = collection(db, "users-companies");
      const userQuery = query(userCompaniesRef, where("user_email", "==", user.email));
      const userCompaniesSnapshot = await getDocs(userQuery);

      if (!userCompaniesSnapshot.empty) {
        const userCompanyDoc = userCompaniesSnapshot.docs[0];
        await updateDoc(doc(db, "users-companies", userCompanyDoc.id), {
          companie_id: newCompanyId,
        });
      }

      const newCompany = companies.find((company) => company.id === newCompanyId);
      setSelectedCompanyId(newCompanyId);
      setCompanyInfo(newCompany);

      alert("Compañía actualizada con éxito.");
    } catch (err) {
      console.error("Error al cambiar la compañía:", err.message);
    } finally {
      setUpdating(false);
    }
  };

  if (authChecking) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mx-auto mb-4"></div>
        <p className="text-xl font-medium text-gray-700">Cargando datos...</p>
        <p className="text-sm text-gray-500 mt-2">Verificando autenticación...</p>
      </div>
    </div>
    );
  }

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

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
        <p className="text-red-600 text-xl font-medium mb-4">
          No estás logueado. Por favor, inicia sesión para continuar.
        </p>
        <GoogleLoginButton />
      </div>
    );
  }

  if (!selectedCompanyId) {
    return <UserCompanySelector userEmail={user.email} />;
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
      {companyInfo && (
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
      )}
    </div>
  );
};

export default UserCompanyInfo;
