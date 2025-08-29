import { useState, useEffect } from 'react';
import { tablesApi } from '../services/api';

export const useTables = (params = {}) => {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTables = async () => {
    try {
      setLoading(true);
      const response = await tablesApi.getAll(params);
      setTables(response.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch tables');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTables();
  }, [JSON.stringify(params)]);

  const createTable = async (data) => {
    try {
      const response = await tablesApi.create(data);
      await fetchTables();
      return response.data;
    } catch (err) {
      throw new Error(err.response?.data?.error || 'Failed to create table');
    }
  };

  const updateTable = async (id, data) => {
    try {
      const response = await tablesApi.update(id, data);
      await fetchTables();
      return response.data;
    } catch (err) {
      throw new Error(err.response?.data?.error || 'Failed to update table');
    }
  };

  const deleteTable = async (id) => {
    try {
      await tablesApi.delete(id);
      await fetchTables();
    } catch (err) {
      throw new Error(err.response?.data?.error || 'Failed to delete table');
    }
  };

  return {
    tables,
    loading,
    error,
    refresh: fetchTables,
    createTable,
    updateTable,
    deleteTable,
  };
};