import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useAuth } from '../contexts/AuthContext';
import { 
  propertyDataAdmin, 
  QUOTA_PLANS 
} from '../services/propertyDataQuota';
import { 
  UserApiQuota,
  ApiUsageLog 
} from '../types/property';

interface PropertyDataAdminProps {
  className?: string;
}

const PropertyDataAdmin: React.FC<PropertyDataAdminProps> = ({ className = '' }) => {
  const { user, isAuthenticated } = useAuth();
  const [adminData, setAdminData] = useState<any>(null);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [bulkPlanId, setBulkPlanId] = useState<string>('professional');
  const [bonusCredits, setBonusCredits] = useState<string>('');
  const [bonusReason, setBonusReason] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // Check if user is authenticated and has ADMINISTRATOR role
  const isAdmin = isAuthenticated && user?.roles?.includes('ADMINISTRATOR');

  useEffect(() => {
    if (isAdmin) {
      loadAdminData();
    }
  }, [isAdmin]);

  // Redirect non-admin users
  if (!isAdmin) {
    return (
      <div className={`min-h-screen bg-gray-50 flex items-center justify-center ${className}`}>
        <div className="text-center p-8">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
            <h2 className="text-lg font-semibold mb-2">Access Denied</h2>
            <p className="text-red-600">
              You need administrator privileges to access the PropertyData API administration panel.
            </p>
            <p className="text-sm text-red-500 mt-2">
              Contact your system administrator if you believe this is an error.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const data = await propertyDataAdmin.getAdminDashboard();
      setAdminData(data);
    } catch (error) {
      console.error('Failed to load admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserPlanUpdate = async (userId: string, newPlanId: string) => {
    if (!window.confirm(`Change user ${userId} to plan ${newPlanId}?`)) {
      return;
    }

    setLoading(true);
    try {
      await propertyDataAdmin.updateUserPlan(userId, newPlanId, 'current_admin');
      await loadAdminData(); // Refresh data
    } catch (error) {
      console.error('Failed to update user plan:', error);
      alert('Failed to update user plan');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkPlanUpdate = async () => {
    if (selectedUsers.length === 0) {
      alert('Please select users to update');
      return;
    }

    if (!window.confirm(`Update ${selectedUsers.length} users to plan ${bulkPlanId}?`)) {
      return;
    }

    setLoading(true);
    try {
      const updates = selectedUsers.map(userId => ({ userId, planId: bulkPlanId }));
      await propertyDataAdmin.bulkUpdatePlans(updates, 'current_admin');
      setSelectedUsers([]);
      await loadAdminData(); // Refresh data
    } catch (error) {
      console.error('Failed to bulk update plans:', error);
      alert('Failed to update user plans');
    } finally {
      setLoading(false);
    }
  };

  const handleBonusCredits = async () => {
    if (selectedUsers.length === 0 || !bonusCredits || !bonusReason) {
      alert('Please select users and enter bonus credits with reason');
      return;
    }

    const credits = parseInt(bonusCredits);
    if (isNaN(credits) || credits <= 0) {
      alert('Please enter valid credit amount');
      return;
    }

    if (!window.confirm(`Grant ${credits} bonus credits to ${selectedUsers.length} users?`)) {
      return;
    }

    setLoading(true);
    try {
      for (const userId of selectedUsers) {
        await propertyDataAdmin.grantBonusCredits(userId, credits, bonusReason, 'current_admin');
      }
      setBonusCredits('');
      setBonusReason('');
      setSelectedUsers([]);
      await loadAdminData(); // Refresh data
    } catch (error) {
      console.error('Failed to grant bonus credits:', error);
      alert('Failed to grant bonus credits');
    } finally {
      setLoading(false);
    }
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const getPlanColor = (planId: string) => {
    const colors = {
      free: 'bg-gray-100 text-gray-800',
      professional: 'bg-blue-100 text-blue-800',
      enterprise: 'bg-purple-100 text-purple-800',
      trial: 'bg-green-100 text-green-800'
    };
    return colors[planId as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getUsagePercentage = (used: number, total: number) => {
    return total > 0 ? Math.round((used / total) * 100) : 0;
  };

  if (loading) {
    return (
      <div className={`min-h-screen bg-gray-50 flex items-center justify-center ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lp-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gray-50 p-6 ${className}`}>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">PropertyData API Administration</h1>
          <p className="text-gray-600">Manage user quotas and monitor API usage</p>
        </div>

        {/* Quick Stats */}
        {adminData && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle>Total Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-lp-blue-600">
                  {adminData.quotaStats?.totalUsers || 0}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Active Plans</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(adminData.quotaStats?.planDistribution || {}).map(([plan, count]) => (
                    <div key={plan} className="flex justify-between items-center">
                      <span className="capitalize">{plan}</span>
                      <span className="font-semibold">{String(count)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Credits Used</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-lp-orange-600">
                  {adminData.quotaStats?.totalCreditsUsed || 0}
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  of {adminData.quotaStats?.totalCreditsAllocated || 0} allocated
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Health</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>API Status</span>
                    <span className="text-green-600 font-semibold">
                      {String(adminData.systemHealth?.apiStatus || 'Unknown')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cache Hit Rate</span>
                    <span className="text-blue-600 font-semibold">
                      {Math.round((adminData.systemHealth?.cacheHitRate || 0) * 100)}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* User Management */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Individual User Update */}
          <Card>
            <CardHeader>
              <CardTitle>Update User Plan</CardTitle>
              <CardDescription>
                Change individual user subscription plans
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="user-select">User ID</Label>
                  <Input
                    id="user-select"
                    type="text"
                    placeholder="Enter user ID or email"
                    className="w-full"
                  />
                </div>
                <div>
                  <Label htmlFor="plan-select">New Plan</Label>
                  <select
                    id="plan-select"
                    value={bulkPlanId}
                    onChange={(e) => setBulkPlanId(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    {QUOTA_PLANS.map(plan => (
                      <option key={plan.id} value={plan.id}>
                        {plan.name} ({plan.price})
                      </option>
                    ))}
                  </select>
                </div>
                <Button 
                  onClick={() => {
                    const userId = (document.getElementById('user-select') as HTMLInputElement)?.value;
                    if (userId) handleUserPlanUpdate(userId, bulkPlanId);
                  }}
                  className="w-full"
                  disabled={loading}
                >
                  Update Plan
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Bulk Operations */}
          <Card>
            <CardHeader>
              <CardTitle>Bulk Operations</CardTitle>
              <CardDescription>
                Update multiple users at once
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="bulk-plan">Bulk Plan Update</Label>
                  <select
                    id="bulk-plan"
                    value={bulkPlanId}
                    onChange={(e) => setBulkPlanId(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    {QUOTA_PLANS.map(plan => (
                      <option key={plan.id} value={plan.id}>
                        {plan.name} ({plan.price})
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <Label htmlFor="bonus-credits">Bonus Credits</Label>
                  <Input
                    id="bonus-credits"
                    type="number"
                    placeholder="Enter credit amount"
                    value={bonusCredits}
                    onChange={(e) => setBonusCredits(e.target.value)}
                    className="w-full"
                  />
                </div>
                
                <div>
                  <Label htmlFor="bonus-reason">Reason</Label>
                  <Input
                    id="bonus-reason"
                    type="text"
                    placeholder="Reason for bonus credits"
                    value={bonusReason}
                    onChange={(e) => setBonusReason(e.target.value)}
                    className="w-full"
                  />
                </div>

                <div className="flex space-x-2">
                  <Button 
                    onClick={handleBulkPlanUpdate}
                    disabled={loading || selectedUsers.length === 0}
                    className="flex-1"
                  >
                    Update Plans ({selectedUsers.length})
                  </Button>
                  
                  <Button 
                    onClick={handleBonusCredits}
                    disabled={loading || selectedUsers.length === 0 || !bonusCredits || !bonusReason}
                    className="flex-1"
                    variant="outline"
                  >
                    Grant Bonus
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Plan Information */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Available Plans</CardTitle>
            <CardDescription>
              Current PropertyData API subscription plans
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {QUOTA_PLANS.map(plan => (
                <div 
                  key={plan.id} 
                  className={`p-4 rounded-lg border-2 ${getPlanColor(plan.id)}`}
                >
                  <h3 className="font-semibold text-lg mb-2">{plan.name}</h3>
                  <p className="text-2xl font-bold mb-2">{plan.price}</p>
                  <p className="text-sm text-gray-600 mb-3">{plan.monthlyCredits} credits/month</p>
                  <ul className="text-sm space-y-1">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-green-600 mr-2">✓</span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PropertyDataAdmin;
