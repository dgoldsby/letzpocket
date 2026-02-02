import React from 'react';
import { User, Building, Shield, Settings, ChevronDown } from 'lucide-react';
import { Button } from './ui/button';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from './ui/select';
import { useRole } from '../contexts/RoleContext';
import { UserRole } from '../types/auth';

const ROLE_CONFIG = {
  TENANT: {
    label: 'Tenant',
    icon: User,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    description: 'Managing your rental properties'
  },
  LANDLORD: {
    label: 'Landlord',
    icon: Building,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    description: 'Managing your property portfolio'
  },
  ADMINISTRATOR: {
    label: 'Administrator',
    icon: Settings,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    description: 'System administration'
  },
  OPERATOR: {
    label: 'Operator',
    icon: Shield,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    description: 'Processing documents and workflows'
  }
} as const;

export function RoleSwitcher() {
  const { activeRole, availableRoles, setActiveRole } = useRole();

  if (!activeRole || availableRoles.length <= 1) {
    return null;
  }

  const currentRoleConfig = ROLE_CONFIG[activeRole];
  const CurrentIcon = currentRoleConfig.icon;

  return (
    <div className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className={`p-2 rounded-lg ${currentRoleConfig.bgColor}`}>
        <CurrentIcon className={`h-5 w-5 ${currentRoleConfig.color}`} />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-900">
            {currentRoleConfig.label} Mode
          </span>
          {availableRoles.length > 1 && (
            <span className="text-xs text-gray-500">
              ({availableRoles.length} roles available)
            </span>
          )}
        </div>
        <p className="text-xs text-gray-600 truncate">
          {currentRoleConfig.description}
        </p>
      </div>

      {availableRoles.length > 1 && (
        <Select value={activeRole} onChange={(e) => setActiveRole(e.target.value as UserRole)}>
          {availableRoles.map((role) => {
            const roleConfig = ROLE_CONFIG[role];
            const RoleIcon = roleConfig.icon;
            
            return (
              <SelectItem key={role} value={role}>
                {roleConfig.label}
              </SelectItem>
            );
          })}
        </Select>
      )}
    </div>
  );
}

export function RoleBadge({ role }: { role: UserRole }) {
  const roleConfig = ROLE_CONFIG[role];
  const Icon = roleConfig.icon;

  return (
    <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${roleConfig.bgColor} ${roleConfig.color}`}>
      <Icon className="h-3 w-3" />
      <span>{roleConfig.label}</span>
    </div>
  );
}
