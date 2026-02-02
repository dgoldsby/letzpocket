import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  updateProfile,
  sendEmailVerification
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { firestore } from './firebase';
import { 
  UserProfile, 
  UserRole, 
  LoginCredentials, 
  RegisterData,
  AuthState,
  ROLE_PERMISSIONS,
  Permission
} from '../types/auth';

export class AuthService {
  private auth = getAuth();

  // Listen to auth state changes
  onAuthStateChange(callback: (user: UserProfile | null) => void) {
    return onAuthStateChanged(this.auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        const userProfile = await this.getUserProfile(firebaseUser.uid);
        callback(userProfile);
      } else {
        callback(null);
      }
    });
  }

  // User login
  async login(credentials: LoginCredentials): Promise<UserProfile> {
    try {
      const userCredential = await signInWithEmailAndPassword(
        this.auth, 
        credentials.email, 
        credentials.password
      );

      const firebaseUser = userCredential.user;
      
      // Update last login
      await this.updateLastLogin(firebaseUser.uid);

      // Get user profile
      const userProfile = await this.getUserProfile(firebaseUser.uid);
      
      if (!userProfile) {
        throw new Error('User profile not found');
      }

      return userProfile;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // User registration
  async register(data: RegisterData): Promise<UserProfile> {
    try {
      // Create Firebase auth user
      const userCredential = await createUserWithEmailAndPassword(
        this.auth,
        data.email,
        data.password
      );

      const firebaseUser = userCredential.user;

      // Update display name
      await updateProfile(firebaseUser, {
        displayName: `${data.firstName} ${data.lastName}`
      });

      // Send email verification
      await sendEmailVerification(firebaseUser);

      // Create user profile in Firestore
      const userProfile: UserProfile = {
        uid: firebaseUser.uid,
        email: data.email,
        displayName: `${data.firstName} ${data.lastName}`,
        roles: data.roles,
        activeRole: data.roles[0], // Set first role as active
        profile: {
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
          company: data.company
        },
        preferences: {
          notifications: true,
          currency: 'GBP',
          timezone: 'Europe/London'
        },
        createdAt: new Date(),
        lastLogin: new Date(),
        emailVerified: false
      };

      await this.createUserProfile(firebaseUser.uid, userProfile);

      return userProfile;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // User logout
  async logout(): Promise<void> {
    try {
      await signOut(this.auth);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Switch active role
  async switchActiveRole(uid: string, newRole: UserRole): Promise<void> {
    try {
      const userRef = doc(firestore, 'users', uid);
      await updateDoc(userRef, {
        activeRole: newRole,
        lastLogin: serverTimestamp()
      });
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get user profile from Firestore
  async getUserProfile(uid: string): Promise<UserProfile | null> {
    try {
      const userDoc = await getDoc(doc(firestore, 'users', uid));
      
      if (!userDoc.exists()) {
        return null;
      }

      const data = userDoc.data();
      return {
        ...data,
        createdAt: data.createdAt?.toDate(),
        lastLogin: data.lastLogin?.toDate()
      } as UserProfile;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Check if user has specific role
  hasRole(userRoles: UserRole[], role: UserRole): boolean {
    return userRoles.includes(role);
  }

  // Check if user has specific permission
  hasPermission(userRoles: UserRole[], permission: Permission): boolean {
    return userRoles.some(role => ROLE_PERMISSIONS[role][permission]);
  }

  // Get available permissions for user roles
  getUserPermissions(userRoles: UserRole[]): Permission[] {
    const permissions = new Set<Permission>();
    
    userRoles.forEach(role => {
      Object.keys(ROLE_PERMISSIONS[role]).forEach(permission => {
        if (ROLE_PERMISSIONS[role][permission as Permission]) {
          permissions.add(permission as Permission);
        }
      });
    });

    return Array.from(permissions);
  }

  // Private helper methods
  private async createUserProfile(uid: string, profile: UserProfile): Promise<void> {
    const userRef = doc(firestore, 'users', uid);
    await setDoc(userRef, {
      ...profile,
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp()
    });
  }

  private async updateLastLogin(uid: string): Promise<void> {
    const userRef = doc(firestore, 'users', uid);
    await updateDoc(userRef, {
      lastLogin: serverTimestamp()
    });
  }

  private handleError(error: any): Error {
    console.error('Auth error:', error);
    
    if (error.code) {
      switch (error.code) {
        case 'auth/user-not-found':
          return new Error('User not found. Please check your email or sign up.');
        case 'auth/wrong-password':
          return new Error('Incorrect password. Please try again.');
        case 'auth/email-already-in-use':
          return new Error('Email already in use. Please use a different email or login.');
        case 'auth/weak-password':
          return new Error('Password is too weak. Please choose a stronger password.');
        case 'auth/invalid-email':
          return new Error('Invalid email address. Please check and try again.');
        case 'auth/user-disabled':
          return new Error('This account has been disabled. Please contact support.');
        case 'auth/too-many-requests':
          return new Error('Too many failed attempts. Please try again later.');
        default:
          return new Error(`Authentication error: ${error.message}`);
      }
    }
    
    return new Error(`An error occurred: ${error.message}`);
  }

  // Get current authenticated user
  getCurrentUser(): FirebaseUser | null {
    return this.auth.currentUser;
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return this.auth.currentUser !== null;
  }

  // Refresh user profile
  async refreshUserProfile(uid: string): Promise<UserProfile | null> {
    return this.getUserProfile(uid);
  }
}

export const authService = new AuthService();
