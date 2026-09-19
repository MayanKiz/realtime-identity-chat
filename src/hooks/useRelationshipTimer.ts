import { useState, useEffect } from 'react';

const RELATIONSHIP_START = new Date('2025-12-30');

export const useRelationshipTimer = () => {
  const [days, setDays] = useState(0);

  useEffect(() => {
    const calculateDays = () => {
      const now = new Date();
      const diff = now.getTime() - RELATIONSHIP_START.getTime();
      const daysDiff = Math.floor(diff / (1000 * 60 * 60 * 24));
      setDays(Math.max(0, daysDiff));
    };

    calculateDays();
    const interval = setInterval(calculateDays, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  return { days, startDate: RELATIONSHIP_START };
};
