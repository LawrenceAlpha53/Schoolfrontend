import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/axios';

const SchoolContext = createContext();

export const useSchool = () => {
  const context = useContext(SchoolContext);
  if (!context) {
    throw new Error('useSchool must be used within a SchoolProvider');
  }
  return context;
};

export const SchoolProvider = ({ children }) => {
  // ✅ Load from localStorage first so it works for ALL roles even if API fails
  const [schoolName, setSchoolName] = useState(
    () => localStorage.getItem('schoolName') || ''
  );
  const [schoolData, setSchoolData] = useState({});
  const [loading, setLoading] = useState(true);

  const fetchSchoolSettings = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) return;
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const response = await api.get('/settings/school', config);

      if (response.data.success) {
        const data = response.data.data;
        setSchoolData(data);
        const name = data.schoolName || '';
        setSchoolName(name);
        localStorage.setItem('schoolName', name);
      }
    } catch (error) {
      // Silently ignore – we already have the name from localStorage
      console.warn('Could not fetch school settings – using cached name');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchSchoolSettings();
    } else {
      setLoading(false);
    }
  }, [fetchSchoolSettings]);

  // Manual update – used by admin after saving
  const updateSchoolName = (newName) => {
    setSchoolName(newName);
    localStorage.setItem('schoolName', newName);
  };

  return (
    <SchoolContext.Provider
      value={{
        schoolName,
        schoolData,
        loading,
        refreshSchoolSettings: fetchSchoolSettings,
        updateSchoolName,
      }}
    >
      {children}
    </SchoolContext.Provider>
  );
};