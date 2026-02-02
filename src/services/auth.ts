import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  updateProfile,
  sendEmailVerification,
  GoogleAuthProvider,
  signInWithCredential,
  signInWithPopup
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

  // Google sign-in
  async signInWithGoogle(): Promise<UserProfile> {
    try {
      const auth = getAuth();
      const provider = new GoogleAuthProvider();
      
      const result = await signInWithPopup(auth, provider);
      const firebaseUser = result.user;

      // Check if user exists in Firestore, if not create profile
      let userProfile = await this.getUserProfile(firebaseUser.uid);
      
      if (!userProfile) {
        // Create new user profile for Google sign-in
        userProfile = await this.createGoogleUserProfile(firebaseUser);
      } else {
        // Update last login
        await this.updateLastLogin(firebaseUser.uid);
      }

      return userProfile;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Create user profile for Google sign-in
  private async createGoogleUserProfile(firebaseUser: FirebaseUser): Promise<UserProfile> {
    const name = firebaseUser.displayName || '';
    const nameParts = name.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    const userProfile: UserProfile = {
      uid: firebaseUser.uid,
      email: firebaseUser.email || '',
      displayName: name,
      roles: ['TENANT'], // Default role for Google sign-in (can be changed later)
      activeRole: 'TENANT',
      profile: {
        firstName,
        lastName,
        phone: '',
        company: ''
      },
      preferences: {
        notifications: true,
        currency: 'GBP',
        timezone: 'Europe/London'
      },
      createdAt: new Date(),
      lastLogin: new Date(),
      emailVerified: firebaseUser.emailVerified || false
    };

    await this.createUserProfile(firebaseUser.uid, userProfile);
    return userProfile;
  }
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
      const docRef = doc(firestore, 'users', uid);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return docSnap.data() as UserProfile;
      }
      return null;
    } catch (error) {
      console.error('Error getting user profile:', error);
      // If Firestore is offline, create a fallback profile from auth
      if (error instanceof Error && error.message.includes('offline')) {
        console.warn('Firestore is offline, creating fallback user profile');
        try {
          const auth = getAuth();
          const firebaseUser = auth.currentUser;
          
          if (firebaseUser) {
            // Check for admin override in localStorage (for testing)
            const adminOverride = localStorage.getItem('adminOverride');
            const isAdmin = adminOverride === firebaseUser.email;
            
            // Create minimal profile from Firebase Auth user
            const fallbackProfile: UserProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || firebaseUser.email || '',
              roles: isAdmin ? ['TENANT', 'LANDLORD', 'ADMINISTRATOR'] : ['TENANT'],
              activeRole: isAdmin ? 'ADMINISTRATOR' : 'TENANT',
              profile: {
                firstName: firebaseUser.displayName?.split(' ')[0] || '',
                lastName: firebaseUser.displayName?.split(' ').slice(1).join(' ') || '',
                phone: '',
                company: ''
              },
              preferences: {
                notifications: true,
                currency: 'GBP',
                timezone: 'Europe/London'
              },
              createdAt: new Date(),
              lastLogin: new Date(),
              emailVerified: firebaseUser.emailVerified || false
            };
            
            console.log('Created fallback profile:', fallbackProfile);
            if (isAdmin) {
              console.log('🔓 Admin override detected for:', firebaseUser.email);
            }
            return fallbackProfile;
          }
        } catch (authError) {
          console.error('Error creating fallback profile:', authError);
        }
      }
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
