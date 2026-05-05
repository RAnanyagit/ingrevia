import React, { createContext, useState, useEffect, useCallback } from 'react';
import { API_URL } from '../config';

export const AllergyContext = createContext();

export const AllergyProvider = ({ children, userEmail }) => {
  const [allergies, setAllergies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAllergies = useCallback(async () => {
    if (!userEmail) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/get-allergies?user_email=${userEmail}`);
      if (!response.ok) throw new Error('Failed to fetch allergies');
      const data = await response.json();
      setAllergies(data);
    } catch (err) {
      console.error('Allergy fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userEmail]);

  useEffect(() => {
    fetchAllergies();
  }, [fetchAllergies]);

  return (
    <AllergyContext.Provider value={{ allergies, loading, error, refreshAllergies: fetchAllergies }}>
      {children}
    </AllergyContext.Provider>
  );
};
