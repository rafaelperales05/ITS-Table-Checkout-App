import React from 'react';
import { TableCellsIcon, MapPinIcon, UsersIcon, PencilIcon } from '@heroicons/react/24/outline';

const TableCard = ({ table, onQuickCheckout, onEditTable }) => {
  return (
    <div className="card hover:shadow-lg transition-shadow">
      <div className="card-body">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <TableCellsIcon className="w-5 h-5 text-gray-400" />
              <h3 className="font-semibold text-gray-900">
                Table {table.tableNumber}
              </h3>
              <span className="status-available">Available</span>
            </div>
            
            <div className="mt-2 space-y-1">
              {table.location && (
                <p className="text-sm text-gray-600 flex items-center space-x-1">
                  <MapPinIcon className="w-4 h-4" />
                  <span>{table.location}</span>
                </p>
              )}
              
              {table.capacity && (
                <p className="text-sm text-gray-600 flex items-center space-x-1">
                  <UsersIcon className="w-4 h-4" />
                  <span>Capacity: {table.capacity} people</span>
                </p>
              )}
              
              {table.notes && (
                <p className="text-sm text-gray-500 mt-2">
                  {table.notes}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={() => onEditTable(table)}
              className="btn-secondary text-sm flex items-center"
              title="Edit table"
            >
              <PencilIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => onQuickCheckout(table)}
              className="btn-primary text-sm"
            >
              Quick Checkout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const AvailableTables = ({ tables, onQuickCheckout, onEditTable }) => {
  return (
    <div className="card">
      <div className="card-header">
        <h2 className="text-lg font-semibold text-gray-900">
          Available Tables ({tables.length})
        </h2>
      </div>
      
      <div className="card-body p-0">
        {tables.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <TableCellsIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No tables available</p>
            <p className="text-sm mt-1">All tables are currently checked out</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {tables.map((table) => (
              <div key={table.id} className="p-4">
                <TableCard
                  table={table}
                  onQuickCheckout={onQuickCheckout}
                  onEditTable={onEditTable}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AvailableTables;