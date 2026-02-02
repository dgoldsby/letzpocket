import React, { useState } from 'react';
import { X, User, Building, Settings } from 'lucide-react';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Checkbox } from './ui/checkbox';
import { UserRole, UserProfile } from '../types/auth';
import { useAuth } from '../contexts/AuthContext';

interface RoleCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
}

export function RoleCollectionModal({ isOpen, onClose, user }: RoleCollectionModalProps) {
  const { updateUserRoles } = useAuth();
  const [selectedRoles, setSelectedRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(false);

  const handleRoleChange = (role: UserRole, checked: boolean) => {
    setSelectedRoles(prev => 
      checked 
        ? [...prev, role]
        : prev.filter(r => r !== role)
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedRoles.length === 0) {
      return;
    }

    setLoading(true);
    try {
      await updateUserRoles(user.uid, selectedRoles);
      onClose();
    } catch (error) {
      console.error('Error updating roles:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Welcome to LetzPocket!</CardTitle>
              <CardDescription>
                Hi {user.displayName || user.email}! Please tell us about yourself so we can set up your account.
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>What best describes you?</Label>
              <p className="text-sm text-gray-600 mb-3">
                You can select multiple roles if applicable
              </p>
              <div className="space-y-2">
                {[
                  { 
                    value: 'TENANT' as UserRole, 
                    label: 'A tenant', 
                    description: 'I rent properties',
                    icon: User
                  },
                  { 
                    value: 'LANDLORD' as UserRole, 
                    label: 'A landlord', 
                    description: 'I own/let properties',
                    icon: Building
                  },
                  { 
                    value: 'ADMINISTRATOR' as UserRole, 
                    label: 'An administrator', 
                    description: 'I manage the system',
                    icon: Settings
                  }
                ].map(role => {
                  const Icon = role.icon;
                  return (
                    <div key={role.value} className="flex items-start space-x-2">
                      <Checkbox
                        id={role.value}
                        checked={selectedRoles.includes(role.value)}
                        onCheckedChange={(checked: boolean) => handleRoleChange(role.value, checked)}
                      />
                      <div className="flex-1">
                        <Label htmlFor={role.value} className="text-sm font-medium flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          {role.label}
                        </Label>
                        <p className="text-xs text-gray-500">{role.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              {selectedRoles.length === 0 && (
                <p className="text-sm text-red-600">Please select at least one role</p>
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading || selectedRoles.length === 0}
            >
              {loading ? 'Setting up your account...' : 'Continue'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
