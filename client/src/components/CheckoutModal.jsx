import React, { useState, useEffect } from 'react';
import { XMarkIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { organizationsApi } from '../services/api';
import { isValidOrganization, findSimilarOrganizations } from '../data/utOrganizations';

const CheckoutModal = ({ table, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    organizationName: '',
    organizationId: '',
    expectedReturnTime: '',
    notes: '',
    checkedOutBy: '',
  });
  
  const [validation, setValidation] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);

  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(17, 0, 0, 0);
    
    setFormData(prev => ({
      ...prev,
      expectedReturnTime: tomorrow.toISOString().slice(0, 16),
    }));
  }, []);

  const handleOrgNameChange = async (value) => {
    setFormData(prev => ({ ...prev, organizationName: value, organizationId: '' }));
    setValidation(null);
    setMatches([]);
    setShowConfirmation(false);
    
    if (value.length >= 2) {
      // Check if organization is in our UT orgs list
      const isValid = isValidOrganization(value);
      const suggestions = findSimilarOrganizations(value);
      
      if (isValid) {
        // Exact match found in UT orgs list
        setValidation({ allowed: true, message: 'Valid UT organization' });
        
        // Still check backend for existing checkout validation and ban status
        try {
          const response = await organizationsApi.validateCheckout(value);
          if (!response.data.allowed) {
            setValidation(response.data);
          } else if (response.data.confirmedOrganization?.status === 'banned') {
            setValidation({ 
              allowed: false, 
              message: `Organization is banned: ${response.data.confirmedOrganization.banReason || 'Policy violation'}`,
              bannedOrganization: response.data.confirmedOrganization
            });
          }
        } catch (err) {
          console.error('Backend validation error:', err);
        }
      } else if (suggestions.length > 0) {
        // Show UT org suggestions
        setMatches(suggestions.map(name => ({ 
          organization: { officialName: name, id: null, category: 'UT Organization' }, 
          score: 85 
        })));
        setValidation({ 
          allowed: false, 
          message: 'Organization not found in UT directory. Please select from suggestions or verify the name.' 
        });
      } else if (value.length >= 3) {
        // No UT org match, but check backend for existing orgs
        try {
          const response = await organizationsApi.validateCheckout(value);
          setValidation(response.data);
          
          if (response.data.matches) {
            setMatches(response.data.matches);
          }
          
          if (response.data.confirmedOrganization) {
            setFormData(prev => ({
              ...prev,
              organizationId: response.data.confirmedOrganization.id,
            }));
          }
          
          if (response.data.requireConfirmation) {
            setShowConfirmation(true);
          }
        } catch (err) {
          console.error('Validation error:', err);
          setValidation({ 
            allowed: false, 
            message: 'Organization not found in UT directory. Please verify the organization name.' 
          });
        }
      }
    }
  };

  const handleSelectOrganization = (org) => {
    setFormData(prev => ({
      ...prev,
      organizationName: org.officialName,
      organizationId: org.id,
    }));
    setValidation(null);
    setMatches([]);
    setShowConfirmation(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.organizationName || !formData.expectedReturnTime) {
      setError('Organization name and expected return time are required');
      return;
    }
    
    if (validation && !validation.allowed) {
      setError(validation.message);
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      await onSubmit(formData);
    } catch (err) {
      console.error('Checkout error:', err);
      setError(err.message || err.toString() || 'Failed to create checkout');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmNewOrganization = () => {
    setShowConfirmation(false);
    setValidation({ allowed: true });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Checkout Table {table?.tableNumber}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Organization Name *
            </label>
            <input
              type="text"
              value={formData.organizationName}
              onChange={(e) => handleOrgNameChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Enter organization name..."
              required
            />
            
            {validation && !validation.allowed && (
              <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md">
                <div className="flex items-start space-x-2">
                  <ExclamationTriangleIcon className="w-5 h-5 text-red-500 mt-0.5" />
                  <div className="text-sm text-red-700">
                    {validation.bannedOrganization && (
                      <div className="mb-2">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                          BANNED ORGANIZATION
                        </span>
                      </div>
                    )}
                    {validation.message}
                    {validation.activere && (
                      <div className="mt-1">
                        Currently has Table {validation.activeCheckout.Table?.tableNumber} checked out.
                      </div>
                    )}
                    {validation.bannedOrganization?.banDate && (
                      <div className="mt-1 text-xs">
                        Banned on: {new Date(validation.bannedOrganization.banDate).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {matches.length > 0 && !showConfirmation && (
              <div className="mt-2 border border-gray-200 rounded-md">
                <div className="p-3 bg-gray-50 border-b border-gray-200">
                  <p className="text-sm font-medium text-gray-900">
                    Similar organizations found:
                  </p>
                </div>
                <div className="max-h-32 overflow-y-auto">
                  {matches.slice(0, 5).map((match) => (
                    <button
                      key={match.organization.id}
                      type="button"
                      onClick={() => handleSelectOrganization(match.organization)}
                      className="w-full p-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                    >
                      <div className="font-medium text-gray-900">
                        {match.organization.officialName}
                      </div>
                      <div className="text-sm text-gray-600">
                        {match.organization.category} • Match: {match.score}%
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {showConfirmation && (
              <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <div className="flex items-start space-x-2">
                  <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500 mt-0.5" />
                  <div className="text-sm text-yellow-700">
                    <p className="font-medium">Create new organization?</p>
                    <p className="mt-1">
                      We found similar organizations. Confirm this is a new organization.
                    </p>
                    <button
                      type="button"
                      onClick={handleConfirmNewOrganization}
                      className="mt-2 btn btn-warning text-xs"
                    >
                      Yes, create new organization
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Expected Return Time *
            </label>
            <input
              type="datetime-local"
              value={formData.expectedReturnTime}
              onChange={(e) => setFormData(prev => ({ ...prev, expectedReturnTime: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Checked Out By
            </label>
            <input
              type="text"
              value={formData.checkedOutBy}
              onChange={(e) => setFormData(prev => ({ ...prev, checkedOutBy: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Your name..."
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              rows={3}
              placeholder="Optional notes about the checkout..."
            />
          </div>
          
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
              {error}
            </div>
          )}
          
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || (validation && !validation.allowed) || showConfirmation}
              className="btn-primary disabled:opacity-50"
            >
              {loading ? 'Creating Checkout...' : 'Checkout Table'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CheckoutModal;