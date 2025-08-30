import React, { useState } from 'react';
import { XMarkIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

const BanModal = ({ organization, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    reason: '',
    customReason: '',
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const commonReasons = [
    'Repeatedly returned tables late',
    'Failed to return table (lost/stolen)',
    'Damaged table or equipment',
    'Violated checkout policies',
    'No-show for multiple reservations',
    'Misused table privileges',
    'Other (specify below)'
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const reason = formData.reason === 'Other (specify below)' 
      ? formData.customReason 
      : formData.reason;
    
    if (!reason) {
      setError('Please select or specify a reason for banning');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      await onSubmit({ reason });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <ExclamationTriangleIcon className="w-6 h-6 text-red-500" />
            <h2 className="text-xl font-semibold text-gray-900">
              Ban Organization
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex items-start space-x-2">
              <ExclamationTriangleIcon className="w-5 h-5 text-red-500 mt-0.5" />
              <div className="text-sm text-red-700">
                <p className="font-medium">You are about to ban: {organization?.officialName}</p>
                <p className="mt-1">This will prevent them from checking out tables until unbanned.</p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Reason for Ban *
            </label>
            <div className="space-y-2">
              {commonReasons.map((reason) => (
                <label key={reason} className="flex items-start space-x-2">
                  <input
                    type="radio"
                    name="reason"
                    value={reason}
                    checked={formData.reason === reason}
                    onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                    className="mt-1 text-red-600 focus:ring-red-500 focus:border-red-500"
                  />
                  <span className="text-sm text-gray-700">{reason}</span>
                </label>
              ))}
            </div>
          </div>

          {formData.reason === 'Other (specify below)' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Please specify the reason
              </label>
              <textarea
                value={formData.customReason}
                onChange={(e) => setFormData(prev => ({ ...prev, customReason: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                rows={3}
                placeholder="Describe the specific reason for banning this organization..."
                required
              />
            </div>
          )}
          
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
              {error}
            </div>
          )}
          
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Banning Organization...' : 'Ban Organization'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BanModal;