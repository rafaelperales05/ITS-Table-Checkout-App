import React, { useState, useEffect } from 'react';
import { useCheckouts } from '../hooks/useCheckouts';
import { useTables } from '../hooks/useTables';
import ActiveCheckouts from './ActiveCheckouts';
import AvailableTables from './AvailableTables';
import StatsPanel from './StatsPanel';
import CheckoutModal from './CheckoutModal';
import ReturnModal from './ReturnModal';
import AddTableModal from './AddTableModal';
import EditTableModal from './EditTableModal';
import OrganizationManagement from './OrganizationManagement';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [addTableModalOpen, setAddTableModalOpen] = useState(false);
  const [editTableModalOpen, setEditTableModalOpen] = useState(false);
  const [selectedTable, setSelectedTable] = useState(null);
  const [selectedCheckout, setSelectedCheckout] = useState(null);
  const [editingTable, setEditingTable] = useState(null);
  
  const { activeCheckouts, overdueCheckouts, stats, loading: checkoutsLoading, error: checkoutsError, refresh: refreshCheckouts, createCheckout, returnCheckout } = useCheckouts(refreshTrigger);
  
  const { tables, loading: tablesLoading, error: tablesError, refresh: refreshTables, createTable, updateTable } = useTables({ available: false });

  const availableTables = Array.isArray(tables) ? tables.filter(table => table.status === 'available') : [];

  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshTrigger(prev => prev + 1);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleQuickCheckout = (table) => {
    setSelectedTable(table);
    setCheckoutModalOpen(true);
  };

  const handleReturnClick = (checkout) => {
    setSelectedCheckout(checkout);
    setReturnModalOpen(true);
  };

  const handleEditTableClick = (table) => {
    setEditingTable(table);
    setEditTableModalOpen(true);
  };

  const handleCheckoutSubmit = async (checkoutData) => {
    try {
      await createCheckout({
        ...checkoutData,
        tableId: selectedTable.id,
      });
      setCheckoutModalOpen(false);
      setSelectedTable(null);
      refreshTables();
    } catch (error) {
      throw error;
    }
  };

  const handleReturnSubmit = async (returnData) => {
    try {
      await returnCheckout(selectedCheckout.id, returnData);
      setReturnModalOpen(false);
      setSelectedCheckout(null);
      refreshTables();
    } catch (error) {
      throw error;
    }
  };

  const handleAddTableSubmit = async (tableData) => {
    try {
      await createTable(tableData);
      setAddTableModalOpen(false);
      refreshTables();
    } catch (error) {
      throw error;
    }
  };

  const handleEditTableSubmit = async (tableData) => {
    try {
      await updateTable(editingTable.id, tableData);
      setEditTableModalOpen(false);
      setEditingTable(null);
      refreshTables();
    } catch (error) {
      throw error;
    }
  };

  if (checkoutsLoading || tablesLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (checkoutsError || tablesError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">Error Loading Dashboard</div>
          <div className="text-gray-600 mb-4">
            {checkoutsError || tablesError}
          </div>
          <button
            onClick={() => {
              refreshCheckouts();
              refreshTables();
            }}
            className="btn-primary"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Table Checkout Dashboard
              </h1>
              <p className="text-gray-600 mt-1">
                Monitor and manage table checkouts in real-time
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500">
                Last updated: {new Date().toLocaleTimeString()}
              </div>
              <button
                onClick={() => setRefreshTrigger(prev => prev + 1)}
                className="btn-secondary"
              >
                Refresh
              </button>
              <button
                onClick={() => setAddTableModalOpen(true)}
                className="btn-primary"
              >
                Add Table
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'dashboard'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('organizations')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'organizations'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Organization Management
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'dashboard' && (
          <>
            <StatsPanel stats={stats} />
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
              <div>
                <ActiveCheckouts
                  checkouts={activeCheckouts}
                  overdueCheckouts={overdueCheckouts}
                  onReturnClick={handleReturnClick}
                />
              </div>
              
              <div>
                <AvailableTables
                  tables={availableTables}
                  onQuickCheckout={handleQuickCheckout}
                  onEditTable={handleEditTableClick}
                />
              </div>
            </div>
          </>
        )}

        {activeTab === 'organizations' && (
          <OrganizationManagement />
        )}
      </div>

      {checkoutModalOpen && (
        <CheckoutModal
          table={selectedTable}
          onClose={() => {
            setCheckoutModalOpen(false);
            setSelectedTable(null);
          }}
          onSubmit={handleCheckoutSubmit}
        />
      )}

      {returnModalOpen && (
        <ReturnModal
          checkout={selectedCheckout}
          onClose={() => {
            setReturnModalOpen(false);
            setSelectedCheckout(null);
          }}
          onSubmit={handleReturnSubmit}
        />
      )}

      {addTableModalOpen && (
        <AddTableModal
          onClose={() => setAddTableModalOpen(false)}
          onSubmit={handleAddTableSubmit}
        />
      )}

      {editTableModalOpen && (
        <EditTableModal
          table={editingTable}
          onClose={() => {
            setEditTableModalOpen(false);
            setEditingTable(null);
          }}
          onSubmit={handleEditTableSubmit}
        />
      )}
    </div>
  );
};

export default Dashboard;