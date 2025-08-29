import React from 'react';
import { ClockIcon, TableCellsIcon, ExclamationTriangleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

const StatCard = ({ title, value, subtitle, icon: Icon, color = 'primary' }) => {
  const colorClasses = {
    primary: 'text-primary-600 bg-primary-50',
    green: 'text-green-600 bg-green-50',
    red: 'text-red-600 bg-red-50',
    yellow: 'text-yellow-600 bg-yellow-50',
    blue: 'text-blue-600 bg-blue-50',
  };

  return (
    <div className="card">
      <div className="card-body">
        <div className="flex items-center">
          <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
            <Icon className="w-6 h-6" />
          </div>
          <div className="ml-4">
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            {subtitle && (
              <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const StatsPanel = ({ stats }) => {
  const {
    totalActive = 0,
    totalOverdue = 0,
    todayCheckouts = 0,
    totalTables = 0,
    availableTables = 0,
    checkedOutTables = 0,
    averageCheckoutDurationHours = 0,
  } = stats;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard
        title="Active Checkouts"
        value={totalActive}
        subtitle={`${totalOverdue} overdue`}
        icon={ClockIcon}
        color="blue"
      />
      
      <StatCard
        title="Available Tables"
        value={availableTables}
        subtitle={`${checkedOutTables} checked out`}
        icon={TableCellsIcon}
        color="green"
      />
      
      <StatCard
        title="Overdue Returns"
        value={totalOverdue}
        subtitle={totalOverdue > 0 ? 'Needs attention' : 'All on time'}
        icon={ExclamationTriangleIcon}
        color={totalOverdue > 0 ? 'red' : 'green'}
      />
      
      <StatCard
        title="Today's Activity"
        value={todayCheckouts}
        subtitle={`Avg: ${averageCheckoutDurationHours.toFixed(1)}h`}
        icon={CheckCircleIcon}
        color="primary"
      />
    </div>
  );
};

export default StatsPanel;