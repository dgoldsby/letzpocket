export type UserRole = 'TENANT' | 'LANDLORD' | 'ADMINISTRATOR' | 'OPERATOR';

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  roles: UserRole[];
  activeRole: UserRole;
  profile: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    company?: string;
  };
  preferences: {
    notifications: boolean;
    currency: string;
    timezone: string;
  };
  createdAt: Date;
  lastLogin: Date;
  emailVerified: boolean;
}

export interface RoleContext {
  activeRole: UserRole;
  availableRoles: UserRole[];
  setActiveRole: (role: UserRole) => void;
  hasRole: (role: UserRole) => boolean;
  hasPermission: (permission: string) => boolean;
}

export interface AuthState {
  user: UserProfile | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  roles: UserRole[];
  phone?: string;
  company?: string;
}

export const ROLE_PERMISSIONS = {
  TENANT: {
    canViewOwnTenancy: true,
    canSubmitDocuments: true,
    canViewReports: true,
    canManageProperties: false,
    canManageAllUsers: false,
    canAccessSystemSettings: false,
    canOverridePermissions: false,
    canViewAllData: false,
    canProcessDocuments: false,
    canManageWorkflows: false,
    canCommunicateWithUsers: false,
    canViewAssignedTasks: false,
    canViewOwnProperties: false,
    canManageTenancies: false,
    canGenerateReports: false,
    canViewAnalytics: false
  },
  LANDLORD: {
    canViewOwnTenancy: false,
    canSubmitDocuments: true,
    canViewReports: true,
    canManageProperties: true,
    canManageAllUsers: false,
    canAccessSystemSettings: false,
    canOverridePermissions: false,
    canViewAllData: false,
    canProcessDocuments: false,
    canManageWorkflows: false,
    canCommunicateWithUsers: false,
    canViewAssignedTasks: false,
    canViewOwnProperties: true,
    canManageTenancies: true,
    canGenerateReports: true,
    canViewAnalytics: true
  },
  ADMINISTRATOR: {
    canViewOwnTenancy: true,
    canSubmitDocuments: true,
    canViewReports: true,
    canManageProperties: true,
    canManageAllUsers: true,
    canAccessSystemSettings: true,
    canOverridePermissions: true,
    canViewAllData: true,
    canProcessDocuments: true,
    canManageWorkflows: true,
    canCommunicateWithUsers: true,
    canViewAssignedTasks: true,
    canViewOwnProperties: true,
    canManageTenancies: true,
    canGenerateReports: true,
    canViewAnalytics: true
  },
  OPERATOR: {
    canViewOwnTenancy: false,
    canSubmitDocuments: false,
    canViewReports: true,
    canManageProperties: false,
    canManageAllUsers: false,
    canAccessSystemSettings: false,
    canOverridePermissions: false,
    canViewAllData: false,
    canProcessDocuments: true,
    canManageWorkflows: true,
    canCommunicateWithUsers: true,
    canViewAssignedTasks: true,
    canViewOwnProperties: false,
    canManageTenancies: false,
    canGenerateReports: false,
    canViewAnalytics: false
  }
} as const;

export type Permission = keyof typeof ROLE_PERMISSIONS.TENANT;
