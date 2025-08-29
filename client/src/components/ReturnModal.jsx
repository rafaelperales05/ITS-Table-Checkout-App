import React, { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { formatCheckoutDuration, formatOverdueTime } from '../utils/dateUtils';

const ReturnModal = ({ checkout, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    returnedBy: '',
    notes: '',
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    setLoading(true);
    setError('');
    
    try {
      await onSubmit(formData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const isOverdue = new Date() > new Date(checkout.expectedReturnTime);
  const overdueText = formatOverdueTime(checkout.expectedReturnTime);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Return Table
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-6">
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-600">Organization:</span>
                <span className="text-sm text-gray-900">
                  {checkout.Organization.officialName}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-600">Table:</span>
                <span className="text-sm text-gray-900">
                  {checkout.Table.tableNumber}
                  {checkout.Table.location && ` (${checkout.Table.location})`}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-600">Duration:</span>
                <span className="text-sm text-gray-900">
                  {formatCheckoutDuration(checkout.checkoutTime)}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-600">Status:</span>
                <span className={`text-sm font-medium ${
                  isOverdue ? 'text-red-600' : 'text-green-600'
                }`}>
                  {isOverdue ? overdueText : 'On Time'}
                </span>
              </div>
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Returned By
              </label>
              <input
                type="text"
                value={formData.returnedBy}
                onChange={(e) => setFormData(prev => ({ ...prev, returnedBy: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Your name..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Return Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                rows={3}
                placeholder="Optional notes about the return..."
              />
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
                className="btn-success disabled:opacity-50"
              >
                {loading ? 'Processing Return...' : 'Confirm Return'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ReturnModal;