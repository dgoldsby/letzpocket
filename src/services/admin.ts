import { getFunctions, httpsCallable } from 'firebase/functions';
import { UserProfile, UserRole } from '../types/auth';

export class AdminService {
  private functions = getFunctions();

  async updateUserRole(targetUserId: string, roles: UserRole[], activeRole: UserRole): Promise<{ success: boolean; message: string }> {
    try {
      const updateRole = httpsCallable(this.functions, 'updateUserRole');
      const result = await updateRole({ targetUserId, roles, activeRole });
      return result.data as { success: boolean; message: string };
    } catch (error) {
      console.error('Error updating user role:', error);
      throw error;
    }
  }

  async getUserByEmail(email: string): Promise<UserProfile> {
    try {
      const getUser = httpsCallable(this.functions, 'getUserByEmail');
      const result = await getUser({ email });
      return result.data as UserProfile;
    } catch (error) {
      console.error('Error getting user by email:', error);
      throw error;
    }
  }

  async getAllUsers(): Promise<UserProfile[]> {
    // This would need to be implemented with a separate function
    // For now, we can use client-side queries if needed
    throw new Error('Not implemented yet');
  }
}

export const adminService = new AdminService();
