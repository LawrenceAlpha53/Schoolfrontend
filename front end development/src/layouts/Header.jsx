// src/components/Header.jsx
import React from 'react';
import { useAppSettings } from '../Components/AppSettingsContext';

const Header = () => {
  const { settings } = useAppSettings();

  return (
    <header className="bg-white shadow-sm px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-bold text-gray-800">
          {settings.schoolName || 'School Management'}
        </h1>
        <span className="text-sm text-gray-500">
          {settings.currentTerm} - {settings.currentAcademicYear}
        </span>
      </div>
      <div className="text-sm text-gray-600">
        {/* other header content like user info, logout, etc. */}
      </div>
    </header>
  );
};

export default Header;