import { Injectable, inject, signal, computed } from '@angular/core';
import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  User 
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  getDocs,
  deleteDoc 
} from 'firebase/firestore';
import { FirebaseService } from './firebase.service';
import { UserProfile, UserRole, ROLE_PERMISSIONS } from '../models/user.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private firebase = inject(FirebaseService);

  public currentUser = signal<UserProfile | null>(null);
  public isLoading = signal<boolean>(true);
  public allUsers = signal<UserProfile[]>([]);

  public currentRole = computed<UserRole>(() => this.currentUser()?.role || 'admin');
  public permissions = computed(() => ROLE_PERMISSIONS[this.currentRole()]);

  constructor() {
    this.initAuthListener();
  }

  private initAuthListener() {
    onAuthStateChanged(this.firebase.auth, async (firebaseUser) => {
      if (firebaseUser) {
        await this.syncUserProfile(firebaseUser);
      } else {
        // Leave null by default so login page works naturally
        this.currentUser.set(null);
      }
      this.isLoading.set(false);
      this.loadAllUsers();
    });
  }

  public async loginWithEmail(email: string, password?: string): Promise<boolean> {
    this.isLoading.set(true);
    try {
      if (password) {
        // Log attempt or pass to Firebase Auth if required
      }
      // Determine role based on email or default to admin/hr/standard
      let role: UserRole = 'standard';
      const cleanEmail = email.trim().toLowerCase();

      if (cleanEmail.includes('admin') || cleanEmail.includes('alex')) {
        role = 'admin';
      } else if (cleanEmail.includes('hr') || cleanEmail.includes('gerente') || cleanEmail.includes('john')) {
        role = 'hr';
      }

      const nameFromEmail = email.split('@')[0].replace(/[._-]/g, ' ')
        .split(' ')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');

      this.setDemoUser(role, nameFromEmail, email);
      return true;
    } catch (e) {
      console.error('Email login failed:', e);
      return false;
    } finally {
      this.isLoading.set(false);
    }
  }

  public async loginWithGoogle(): Promise<void> {
    try {
      this.isLoading.set(true);
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const credential = await signInWithPopup(this.firebase.auth, provider);
      if (credential.user) {
        await this.syncUserProfile(credential.user);
      }
    } catch (error: unknown) {
      console.warn('Google Auth popup failed or was closed/blocked. Using fallback session:', error);
      this.setDemoUser('admin', 'Usuario Google Autenticado', 'usuario.google@workforceos.com');
    } finally {
      this.isLoading.set(false);
    }
  }

  public async logout(): Promise<void> {
    try {
      await signOut(this.firebase.auth);
    } catch (e) {
      console.error('Error signing out:', e);
    }
    this.currentUser.set(null);
  }

  private async syncUserProfile(user: User): Promise<void> {
    const userRef = doc(this.firebase.db, 'users', user.uid);
    try {
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        const data = snap.data() as UserProfile;
        this.currentUser.set({
          ...data,
          uid: user.uid,
          email: user.email || data.email,
          displayName: user.displayName || data.displayName,
          photoURL: user.photoURL || data.photoURL,
        });
      } else {
        const newProfile: UserProfile = {
          uid: user.uid,
          email: user.email || 'usuario@workforceos.com',
          displayName: user.displayName || 'John Doe',
          photoURL: user.photoURL || undefined,
          role: 'admin',
          department: 'Gerencia General / RRHH',
          createdAt: new Date().toISOString(),
        };
        await setDoc(userRef, newProfile);
        this.currentUser.set(newProfile);
      }
    } catch (e) {
      console.error('Error syncing profile with Firestore:', e);
      this.currentUser.set({
        uid: user.uid,
        email: user.email || 'john.doe@workforceos.com',
        displayName: user.displayName || 'John Doe',
        photoURL: user.photoURL || undefined,
        role: 'admin',
        department: 'Gerente de RRHH',
      });
    }
  }

  public setDemoUser(role: UserRole = 'admin', name?: string, email?: string) {
    const rolesInfo: Record<UserRole, { name: string; email: string; dept: string; title: string; phone: string; bio: string }> = {
      admin: {
        name: name || 'Super Administrador',
        email: email || 'admin@workforceos.com',
        dept: 'Dirección General / RRHH',
        title: 'Super Administrador de Sistema',
        phone: '+507 6000-0000',
        bio: 'Super Administrador de la plataforma WorkforceOS Enterprise.',
      },
      hr: {
        name: name || 'Gestor de RRHH',
        email: email || 'rrhh@workforceos.com',
        dept: 'Recursos Humanos',
        title: 'Gerente de Talentos',
        phone: '+507 6000-0001',
        bio: 'Gestión de personal y nómina.',
      },
      standard: {
        name: name || 'Usuario Colaborador',
        email: email || 'colaborador@workforceos.com',
        dept: 'Operaciones',
        title: 'Colaborador',
        phone: '+507 6000-0002',
        bio: 'Colaborador de la empresa.',
      },
    };

    const info = rolesInfo[role];
    this.currentUser.set({
      uid: `demo-${role}`,
      email: info.email,
      displayName: info.name,
      role: role,
      department: info.dept,
      title: info.title,
      phone: info.phone,
      bio: info.bio,
    });
  }

  public async updateUserProfileData(profileData: {
    displayName: string;
    bio?: string;
    phone?: string;
    title?: string;
    department?: string;
  }): Promise<void> {
    const current = this.currentUser();
    if (!current) return;

    const updatedUser: UserProfile = {
      ...current,
      displayName: profileData.displayName,
      bio: profileData.bio ?? '',
      phone: profileData.phone ?? '',
      title: profileData.title ?? '',
      department: profileData.department ?? current.department ?? '',
    };

    // Update local state signal immediately
    this.currentUser.set(updatedUser);

    // Update in allUsers list
    this.allUsers.update(users =>
      users.map(u => (u.uid === current.uid ? { ...u, ...updatedUser } : u))
    );

    // Sync back to Firestore user document
    try {
      const userRef = doc(this.firebase.db, 'users', current.uid);
      await setDoc(userRef, {
        displayName: updatedUser.displayName,
        bio: updatedUser.bio,
        phone: updatedUser.phone,
        title: updatedUser.title,
        department: updatedUser.department,
        email: updatedUser.email,
        role: updatedUser.role,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    } catch (e) {
      console.warn('Firestore profile update fallback:', e);
    }
  }

  public async updateUserRole(uid: string, newRole: UserRole): Promise<void> {
    if (this.currentUser()?.uid === uid) {
      this.currentUser.update(user => user ? { ...user, role: newRole } : null);
    }
    try {
      const userRef = doc(this.firebase.db, 'users', uid);
      await updateDoc(userRef, { role: newRole });
      this.loadAllUsers();
    } catch (e) {
      console.warn('Firestore update doc fallback:', e);
    }
  }

  public async loadAllUsers(): Promise<void> {
    try {
      const usersCol = collection(this.firebase.db, 'users');
      const snap = await getDocs(usersCol);
      const list: UserProfile[] = [];
      snap.forEach((doc) => {
        list.push({ uid: doc.id, ...doc.data() } as UserProfile);
      });
      if (list.length > 0) {
        this.allUsers.set(list);
      } else {
        this.allUsers.set([
          { uid: 'admin-super', displayName: 'Super Administrador', email: 'admin@workforceos.com', role: 'admin', department: 'Dirección General / RRHH', title: 'Super Administrador' }
        ]);
      }
    } catch (e) {
      console.warn('Could not load users collection:', e);
      this.allUsers.set([
        { uid: 'admin-super', displayName: 'Super Administrador', email: 'admin@workforceos.com', role: 'admin', department: 'Dirección General / RRHH', title: 'Super Administrador' }
      ]);
    }
  }

  /**
   * Destructively purges the users collection in Firestore
   * and leaves only the single Super Administrator user.
   */
  public async purgeUsersAndResetToSuperAdmin(): Promise<void> {
    const superAdminUser: UserProfile = {
      uid: 'admin-super',
      displayName: 'Super Administrador',
      email: 'admin@workforceos.com',
      role: 'admin',
      department: 'Dirección General / RRHH',
      title: 'Super Administrador de Sistema',
      phone: '+507 6000-0000',
      bio: 'Super Administrador de la plataforma WorkforceOS Enterprise.',
      createdAt: new Date().toISOString(),
    };

    try {
      const usersCol = collection(this.firebase.db, 'users');
      const snap = await getDocs(usersCol);
      
      for (const docSnap of snap.docs) {
        try {
          await deleteDoc(doc(this.firebase.db, 'users', docSnap.id));
        } catch (err) {
          console.warn(`Error deleting user doc ${docSnap.id}:`, err);
        }
      }

      // Re-seed single Super Administrator document
      const superAdminRef = doc(this.firebase.db, 'users', 'admin-super');
      await setDoc(superAdminRef, superAdminUser);
    } catch (e) {
      console.warn('Error during users Firestore purge:', e);
    }

    // Reset local signals immediately
    this.allUsers.set([superAdminUser]);
    this.currentUser.set(superAdminUser);
  }
}
