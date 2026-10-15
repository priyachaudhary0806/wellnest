import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

// Emergency contact with user's saved number and guardian email set as Primary!
const DEFAULT_EMERGENCY_CONTACTS = [
  { id: 'ec-primary', name: 'Primary Emergency Contact', relationship: 'Guardian / Personal', phone: '+91 9870623857', email: 'chaudharypriya9313@gmail.com', isPrimary: true },
  { id: 'ec-2', name: 'Dr. Michael Chen', relationship: 'Personal Doctor', phone: '+1 (555) 876-5432', email: '', isPrimary: false },
  { id: 'ec-3', name: 'Metro Care Ambulance', relationship: 'Local Dispatch', phone: '911', email: '', isPrimary: false }
];

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('aurasight_user');
    if (savedUser) {
      try { return JSON.parse(savedUser); } catch (e) { return null; }
    }
    return null;
  });

  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(() => {
    return localStorage.getItem('aurasight_onboarding') === 'true';
  });

  const [emergencyContacts, setEmergencyContacts] = useState(() => {
    const saved = localStorage.getItem('aurasight_emergency_contacts');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.length > 0) {
          parsed[0].phone = parsed[0].phone || '+91 9870623857';
          if (!parsed[0].email) parsed[0].email = 'chaudharypriya9313@gmail.com';
          return parsed;
        }
      } catch (e) {}
    }
    return DEFAULT_EMERGENCY_CONTACTS;
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('aurasight_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('aurasight_user');
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem('aurasight_emergency_contacts', JSON.stringify(emergencyContacts));
  }, [emergencyContacts]);

  const login = (email, password, rememberMe = true) => {
    const loggedUser = {
      id: 'usr-' + Date.now(),
      fullName: email.split('@')[0].replace('.', ' ').toUpperCase(),
      email: email,
      phone: '+91 9870623857',
      rememberMe
    };
    setUser(loggedUser);
    return loggedUser;
  };

  const signup = (userData) => {
    const newUser = {
      id: 'usr-' + Date.now(),
      fullName: userData.fullName,
      email: userData.email,
      phone: userData.phone || '+91 9870623857',
      rememberMe: true
    };
    setUser(newUser);
    return newUser;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('aurasight_user');
  };

  const completeOnboarding = () => {
    setHasCompletedOnboarding(true);
    localStorage.setItem('aurasight_onboarding', 'true');
  };

  const addEmergencyContact = (contact) => {
    const newContact = { id: 'ec-' + Date.now(), ...contact };
    setEmergencyContacts(prev => [...prev, newContact]);
  };

  const editEmergencyContact = (id, updatedData) => {
    setEmergencyContacts(prev => prev.map(c => c.id === id ? { ...c, ...updatedData } : c));
  };

  const deleteEmergencyContact = (id) => {
    setEmergencyContacts(prev => prev.filter(c => c.id !== id));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        hasCompletedOnboarding,
        completeOnboarding,
        login,
        signup,
        logout,
        emergencyContacts,
        addEmergencyContact,
        editEmergencyContact,
        deleteEmergencyContact
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
