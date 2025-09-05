import { useState, useEffect } from 'react';
import { organizationsApi } from '../services/api';

export const useOrganizations = (params = {}) => {
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOrganizations = async () => {
    try {
      setLoading(true);
      const response = await organizationsApi.getAll(params);
      // Handle paginated response from serverless endpoint
      const organizationsData = response.data.data || response.data.organizations || response.data;
      setOrganizations(Array.isArray(organizationsData) ? organizationsData : []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch organizations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizations();
  }, [JSON.stringify(params)]);

  const banOrganization = async (id, banData) => {
    try {
      const response = await organizationsApi.ban(id, banData);
      await fetchOrganizations();
      return response.data;
    } catch (err) {
      throw new Error(err.response?.data?.error || 'Failed to ban organization');
    }
  };

  const unbanOrganization = async (id) => {
    try {
      const response = await organizationsApi.unban(id);
      await fetchOrganizations();
      return response.data;
    } catch (err) {
      throw new Error(err.response?.data?.error || 'Failed to unban organization');
    }
  };

  const createOrganization = async (data) => {
    try {
      const response = await organizationsApi.create(data);
      await fetchOrganizations();
      return response.data;
    } catch (err) {
      throw new Error(err.response?.data?.error || 'Failed to create organization');
    }
  };

  const updateOrganization = async (id, data) => {
    try {
      const response = await organizationsApi.update(id, data);
      await fetchOrganizations();
      return response.data;
    } catch (err) {
      throw new Error(err.response?.data?.error || 'Failed to update organization');
    }
  };

  return {
    organizations,
    loading,
    error,
    refresh: fetchOrganizations,
    banOrganization,
    unbanOrganization,
    createOrganization,
    updateOrganization,
  };
};