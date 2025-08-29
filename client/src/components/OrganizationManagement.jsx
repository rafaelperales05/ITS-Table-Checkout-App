import React, { useState, useEffect } from 'react';
import { useOrganizations } from '../hooks/useOrganizations';
import BanModal from './BanModal';
import UnbanModal from './UnbanModal';
import { ExclamationTriangleIcon, ShieldExclamationIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

const OrganizationManagement = () => {
  const { organizations, loading, error, banOrganization, unbanOrganization, refresh } = useOrganizations();
  const [banModalOpen, setBanModalOpen] = useState(false);
  const [unbanModalOpen, setUnbanModalOpen] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [filter, setFilter] = useState('all'); // all, active, banned
  const [searchTerm, setSearchTerm] = useState('');

  const handleBanClick = (org) => {
    setSelectedOrg(org);
    setBanModalOpen(true);
  };

  const handleUnbanClick = (org) => {
    setSelectedOrg(org);
    setUnbanModalOpen(true);
  };

  const handleBanSubmit = async (banData) => {
    try {
      await banOrganization(selectedOrg.id, banData);
      setBanModalOpen(false);
      setSelectedOrg(null);
      refresh();
    } catch (error) {
      throw error;
    }
  };

  const handleUnbanSubmit = async () => {
    try {
      await unbanOrganization(selectedOrg.id);
      setUnbanModalOpen(false);
      setSelectedOrg(null);
      refresh();
    } catch (error) {
      throw error;
    }
  };

  const getStatusBadge = (status) => {
    return status === 'banned' 
      ? 'bg-red-100 text-red-800 border border-red-200' 
      : 'bg-green-100 text-green-800 border border-green-200';
  };

  const getStatusIcon = (status) => {
    return status === 'banned' 
      ? <ShieldExclamationIcon className="w-4 h-4" />
      : <CheckCircleIcon className="w-4 h-4" />;
  };

  // Filter and search organizations
  const filteredOrgs = organizations.filter(org => {
    const matchesFilter = filter === 'all' || org.status === filter;
    const matchesSearch = org.officialName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Risk indicators based on checkout history
  const getRiskLevel = (org) => {
    // This would be enhanced with real checkout history data
    const overdueCount = Math.floor(Math.random() * 3); // Mock data
    const lateReturns = Math.floor(Math.random() * 5); // Mock data
    
    if (overdueCount > 1 || lateReturns > 3) return 'high';
    if (overdueCount > 0 || lateReturns > 1) return 'medium';
    return 'low';
  };

  const getRiskBadge = (risk) => {
    const badges = {
      high: 'bg-red-50 text-red-700 border border-red-200',
      medium: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
      low: 'bg-green-50 text-green-700 border border-green-200'
    };
    return badges[risk] || badges.low;
  };

  if (loading) return <div className="text-center py-8">Loading organizations...</div>;
  if (error) return <div className="text-red-600 py-8">Error: {error}</div>;

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Organization Management</h2>
          <button
            onClick={refresh}
            className="btn-secondary"
          >
            Refresh
          </button>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 text-sm rounded-md border ${filter === 'all' ? 'bg-blue-100 text-blue-800 border-blue-200' : 'bg-gray-100 text-gray-700 border-gray-200'}`}
            >
              All ({organizations.length})
            </button>
            <button
              onClick={() => setFilter('active')}
              className={`px-3 py-1 text-sm rounded-md border ${filter === 'active' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-gray-100 text-gray-700 border-gray-200'}`}
            >
              Active ({organizations.filter(o => o.status === 'active').length})
            </button>
            <button
              onClick={() => setFilter('banned')}
              className={`px-3 py-1 text-sm rounded-md border ${filter === 'banned' ? 'bg-red-100 text-red-800 border-red-200' : 'bg-gray-100 text-gray-700 border-gray-200'}`}
            >
              Banned ({organizations.filter(o => o.status === 'banned').length})
            </button>
          </div>
          
          <div className="flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search organizations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Organizations List */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Organization
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Risk Level
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ban Details
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredOrgs.map((org) => {
              const riskLevel = getRiskLevel(org);
              return (
                <tr key={org.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {org.officialName}
                      </div>
                      {org.aliases && org.aliases.length > 0 && (
                        <div className="text-xs text-gray-500">
                          Also known as: {org.aliases.slice(0, 3).join(', ')}
                          {org.aliases.length > 3 && ` +${org.aliases.length - 3} more`}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(org.status)}`}>
                      {getStatusIcon(org.status)}
                      <span className="ml-1 capitalize">{org.status}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${getRiskBadge(riskLevel)}`}>
                      {riskLevel === 'high' && <ExclamationTriangleIcon className="w-3 h-3 mr-1" />}
                      <span className="capitalize">{riskLevel} Risk</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {org.category || 'Not specified'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {org.status === 'banned' ? (
                      <div>
                        <div className="font-medium text-red-600">
                          {org.banReason || 'No reason specified'}
                        </div>
                        {org.banDate && (
                          <div className="text-xs">
                            Banned: {new Date(org.banDate).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {org.status === 'active' ? (
                      <button
                        onClick={() => handleBanClick(org)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Ban Organization
                      </button>
                    ) : (
                      <button
                        onClick={() => handleUnbanClick(org)}
                        className="text-green-600 hover:text-green-900"
                      >
                        Unban Organization
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {filteredOrgs.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          {searchTerm ? `No organizations found matching "${searchTerm}"` : 'No organizations found.'}
        </div>
      )}

      {/* Risk Level Legend */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
        <div className="text-sm text-gray-600">
          <span className="font-medium">Risk Levels:</span>
          <span className="ml-2 text-green-600">Low</span> - Good history, no issues
          <span className="ml-4 text-yellow-600">Medium</span> - Some late returns or minor issues
          <span className="ml-4 text-red-600">High</span> - Multiple overdue returns or equipment damage
        </div>
      </div>

      {/* Modals */}
      {banModalOpen && (
        <BanModal
          organization={selectedOrg}
          onClose={() => {
            setBanModalOpen(false);
            setSelectedOrg(null);
          }}
          onSubmit={handleBanSubmit}
        />
      )}

      {unbanModalOpen && (
        <UnbanModal
          organization={selectedOrg}
          onClose={() => {
            setUnbanModalOpen(false);
            setSelectedOrg(null);
          }}
          onSubmit={handleUnbanSubmit}
        />
      )}
    </div>
  );
};

export default OrganizationManagement;