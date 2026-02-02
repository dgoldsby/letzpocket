import React, { useState, useEffect } from 'react';
import { Shield, Users, Settings, FileText, Building, ChevronRight, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useAuth } from '../contexts/AuthContext';
import { useRole } from '../contexts/RoleContext';
import { UserRole } from '../types/auth';
import { adminService } from '../services/admin';

interface UserManagementProps {
  onClose: () => void;
}

export function UserManagement({ onClose }: UserManagementProps) {
  const { hasPermission } = useRole();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const [foundUser, setFoundUser] = useState<any>(null);

  const canManageUsers = hasPermission('canManageAllUsers');

  const handleSearchUser = async () => {
    if (!email.trim()) return;

    setLoading(true);
    setMessage('');
    
    try {
      const user = await adminService.getUserByEmail(email.trim());
      setFoundUser(user);
    } catch (error) {
      setMessage('User not found');
      setMessageType('error');
      setFoundUser(null);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRoles = async (roles: UserRole[], activeRole: UserRole) => {
    if (!foundUser) return;

    setLoading(true);
    setMessage('');

    try {
      await adminService.updateUserRole(foundUser.uid, roles, activeRole);
      setMessage(`User roles updated successfully`);
      setMessageType('success');
      setFoundUser({ ...foundUser, roles, activeRole });
    } catch (error) {
      setMessage('Failed to update user roles');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const toggleRole = (role: UserRole) => {
    if (!foundUser) return;

    const newRoles = foundUser.roles.includes(role)
      ? foundUser.roles.filter((r: UserRole) => r !== role)
      : [...foundUser.roles, role];

    const newActiveRole = newRoles.includes(foundUser.activeRole) ? foundUser.activeRole : newRoles[0];
    handleUpdateRoles(newRoles, newActiveRole);
  };

  if (!canManageUsers) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            Access Denied
          </CardTitle>
          <CardDescription>
            You don't have permission to manage users.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={onClose}>Go Back</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            User Management
          </CardTitle>
          <CardDescription>
            Search for users and manage their roles and permissions.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="user-email">User Email</Label>
              <Input
                id="user-email"
                type="email"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleSearchUser} disabled={loading}>
                {loading ? 'Searching...' : 'Search'}
              </Button>
            </div>
          </div>

          {message && (
            <div className={`flex items-center gap-2 p-3 rounded-lg ${
              messageType === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
              {messageType === 'success' ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
              <span className="text-sm">{message}</span>
            </div>
          )}

          {foundUser && (
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader>
                <CardTitle className="text-lg">{foundUser.displayName || foundUser.email}</CardTitle>
                <CardDescription>{foundUser.email}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Current Roles</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {foundUser.roles.map((role: UserRole) => (
                      <span
                        key={role}
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          role === 'ADMINISTRATOR' ? 'bg-purple-100 text-purple-700' :
                          role === 'OPERATOR' ? 'bg-orange-100 text-orange-700' :
                          role === 'LANDLORD' ? 'bg-green-100 text-green-700' :
                          'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {role}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">Manage Roles</Label>
                  <div className="space-y-2 mt-2">
                    {(['TENANT', 'LANDLORD', 'ADMINISTRATOR', 'OPERATOR'] as UserRole[]).map((role) => (
                      <div key={role} className="flex items-center justify-between p-2 border rounded">
                        <span className="text-sm font-medium">{role}</span>
                        <Button
                          variant={foundUser.roles.includes(role) ? "default" : "outline"}
                          size="sm"
                          onClick={() => toggleRole(role)}
                          disabled={loading}
                        >
                          {foundUser.roles.includes(role) ? 'Remove' : 'Add'}
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function AdminPanel() {
  const { user } = useAuth();
  const { hasPermission, activeRole } = useRole();

  const canAccessAdmin = hasPermission('canManageAllUsers') || hasPermission('canAccessSystemSettings');

  if (!canAccessAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader className="text-center">
            <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You don't have permission to access the admin panel.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => window.history.back()}>
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
          <p className="text-gray-600 mt-2">
            Manage users, roles, and system settings
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                User Management
              </CardTitle>
              <CardDescription>
                Manage user roles and permissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">
                Manage Users
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer opacity-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Content Management
              </CardTitle>
              <CardDescription>
                Manage website content and pages
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" disabled>
                Coming Soon
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer opacity-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                System Settings
              </CardTitle>
              <CardDescription>
                Configure system-wide settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" disabled>
                Coming Soon
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8">
          <UserManagement onClose={() => {}} />
        </div>
      </div>
    </div>
  );
}
