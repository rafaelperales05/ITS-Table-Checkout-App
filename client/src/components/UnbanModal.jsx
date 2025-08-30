import React, { useState } from 'react';
import { XMarkIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

const UnbanModal = ({ organization, onClose, onSubmit }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    setLoading(true);
    setError('');
    
    try {
      await onSubmit();
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
            <CheckCircleIcon className="w-6 h-6 text-green-500" />
            <h2 className="text-xl font-semibold text-gray-900">
              Unban Organization
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
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex items-start space-x-2">
              <CheckCircleIcon className="w-5 h-5 text-green-500 mt-0.5" />
              <div className="text-sm text-green-700">
                <p className="font-medium">You are about to unban: {organization?.officialName}</p>
                <p className="mt-1">This will restore their ability to check out tables.</p>
              </div>
            </div>
          </div>

          {organization?.banReason && (
            <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
              <h4 className="font-medium text-gray-900 mb-2">Original Ban Reason:</h4>
              <p className="text-sm text-gray-700">{organization.banReason}</p>
              {organization.banDate && (
                <p className="text-xs text-gray-500 mt-2">
                  Banned on: {new Date(organization.banDate).toLocaleDateString()}
                </p>
              )}
            </div>
          )}

          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <div className="text-sm text-yellow-800">
              <p className="font-medium">Before unbanning, please ensure:</p>
              <ul className="mt-2 space-y-1 list-disc list-inside">
                <li>The issues that led to the ban have been resolved</li>
                <li>The organization has been contacted about proper table usage</li>
                <li>Any outstanding equipment or fees have been addressed</li>
              </ul>
            </div>
          </div>
          
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
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Unbanning Organization...' : 'Unban Organization'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UnbanModal;