import { useState, useEffect } from 'react';
import { checkoutsApi } from '../services/api';

export const useCheckouts = (refresh = false) => {
  const [activeCheckouts, setActiveCheckouts] = useState([]);
  const [overdueCheckouts, setOverdueCheckouts] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [activeRes, overdueRes, statsRes] = await Promise.all([
        checkoutsApi.getActive(),
        checkoutsApi.getOverdue(),
        checkoutsApi.getStats(),
      ]);

      // Handle paginated response from serverless endpoints
      const activeData = activeRes.data.data || activeRes.data;
      const overdueData = overdueRes.data.data || overdueRes.data;
      
      setActiveCheckouts(Array.isArray(activeData) ? activeData : []);
      setOverdueCheckouts(Array.isArray(overdueData) ? overdueData : []);
      setStats(statsRes.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch checkout data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [refresh]);

  const createCheckout = async (data) => {
    try {
      const response = await checkoutsApi.create(data);
      await fetchData();
      return response.data;
    } catch (err) {
      throw new Error(err.response?.data?.error || 'Failed to create checkout');
    }
  };

  const returnCheckout = async (id, data = {}) => {
    try {
      const response = await checkoutsApi.returnCheckout(id, data);
      await fetchData();
      return response.data;
    } catch (err) {
      throw new Error(err.response?.data?.error || 'Failed to return checkout');
    }
  };

  return {
    activeCheckouts,
    overdueCheckouts,
    stats,
    loading,
    error,
    refresh: fetchData,
    createCheckout,
    returnCheckout,
  };
};