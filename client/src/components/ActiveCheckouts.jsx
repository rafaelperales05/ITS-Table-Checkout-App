import React from 'react';
import { formatCheckoutDuration, getCheckoutStatus, getStatusColor, formatOverdueTime } from '../utils/dateUtils';
import { ClockIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline';

const CheckoutCard = ({ checkout, onReturnClick }) => {
  const status = getCheckoutStatus(
    checkout.checkoutTime,
    checkout.expectedReturnTime,
    checkout.actualReturnTime
  );
  
  const statusColor = getStatusColor(status);
  const overdueText = formatOverdueTime(checkout.expectedReturnTime);
  
  return (
    <div className={`card border-l-4 ${
      status === 'overdue' ? 'border-l-red-500' :
      status === 'due_soon' ? 'border-l-yellow-500' :
      'border-l-green-500'
    }`}>
      <div className="card-body">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <BuildingOfficeIcon className="w-5 h-5 text-gray-400" />
              <h3 className="font-semibold text-gray-900">
                {checkout.Organization?.officialName || 'Unknown Organization'}
              </h3>
            </div>
            
            <div className="mt-2 space-y-1">
              <p className="text-sm text-gray-600">
                Table {checkout.Table?.tableNumber || 'Unknown'}
                {checkout.Table?.location && ` • ${checkout.Table.location}`}
              </p>
              
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <span className="flex items-center space-x-1">
                  <ClockIcon className="w-4 h-4" />
                  <span>{formatCheckoutDuration(checkout.checkoutTime)}</span>
                </span>
                
                <span>
                  Due: {new Date(checkout.expectedReturnTime).toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true,
                  })}
                </span>
              </div>
              
              {checkout.checkedOutBy && (
                <p className="text-xs text-gray-500">
                  Checked out by: {checkout.checkedOutBy}
                </p>
              )}
              
              {checkout.notes && (
                <p className="text-sm text-gray-600 mt-2">
                  {checkout.notes}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex flex-col items-end space-y-2">
            <span className={`status-badge ${statusColor}`}>
              {status === 'overdue' && overdueText}
              {status === 'due_soon' && 'Due Soon'}
              {status === 'on_time' && 'On Time'}
            </span>
            
            <button
              onClick={() => onReturnClick(checkout)}
              className="btn-success text-sm"
            >
              Return
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ActiveCheckouts = ({ checkouts, overdueCheckouts, onReturnClick }) => {
  const allCheckouts = [...checkouts].sort((a, b) => {
    const aOverdue = new Date(a.expectedReturnTime) < new Date();
    const bOverdue = new Date(b.expectedReturnTime) < new Date();
    
    if (aOverdue && !bOverdue) return -1;
    if (!aOverdue && bOverdue) return 1;
    
    return new Date(a.expectedReturnTime) - new Date(b.expectedReturnTime);
  });
  
  return (
    <div className="card">
      <div className="card-header">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            Active Checkouts ({allCheckouts.length})
          </h2>
          {overdueCheckouts.length > 0 && (
            <span className="status-badge bg-red-100 text-red-800">
              {overdueCheckouts.length} Overdue
            </span>
          )}
        </div>
      </div>
      
      <div className="card-body p-0">
        {allCheckouts.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <ClockIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No active checkouts</p>
            <p className="text-sm mt-1">All tables are available</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {allCheckouts.map((checkout) => (
              <div key={checkout.id} className="p-4">
                <CheckoutCard
                  checkout={checkout}
                  onReturnClick={onReturnClick}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ActiveCheckouts;