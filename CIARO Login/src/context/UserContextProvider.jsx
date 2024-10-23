import React, { useState } from "react";
import UserContext from "./UserContext";

export default function USerContextProvider({ children }) {
  const [superAdminUsername, setSuperAdminUsername] = useState(null);
  const [superAdminEmail, setSuperAdminEmail] = useState(null);
  const [firstName, setFirstName] = useState(null);
  const [empEmail, setEmpEmail] = useState(null);
  const [orgID, setOrgID] = useState(null);
  const [isSA, setIsSA] = useState(null);
  const [genrateQR, setGenrateQR] = useState(null);

  return (
    <UserContext.Provider
      value={{
        superAdminUsername,
        setSuperAdminUsername,
        firstName,
        setFirstName,
        superAdminEmail,
        setSuperAdminEmail,
        empEmail,
        setEmpEmail,
        orgID,
        setOrgID,
        isSA,
        setIsSA,
        genrateQR,
        setGenrateQR,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}
