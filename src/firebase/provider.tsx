'use client';

import React, { DependencyList, createContext, useContext, ReactNode, useMemo, useState, useEffect } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore } from 'firebase/firestore';
import { Auth, User, onAuthStateChanged } from 'firebase/auth';
import { FirebaseStorage } from 'firebase/storage';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener'

import { supabase } from '@/lib/supabase/client';
import { getCachedAuth, setCachedAuth, clearCachedAuth } from '@/lib/cache/auth-cache';

interface FirebaseProviderProps {
  children: ReactNode;
  firebaseApp: FirebaseApp | null;
  firestore: Firestore | null;
  auth: Auth | null;
  storage: FirebaseStorage | null;
}

// Internal state for user authentication
interface UserAuthState {
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
}

// Combined state for the Firebase context
export interface FirebaseContextState {
  areServicesAvailable: boolean; // True if core services (app, firestore, auth instance) are provided
  firebaseApp: FirebaseApp | null;
  firestore: Firestore | null;
  auth: Auth | null; // The Auth service instance
  storage: FirebaseStorage | null;
  // User authentication state
  user: User | null;
  isUserLoading: boolean; // True during initial auth check
  userError: Error | null; // Error from auth listener
}

// Return type for useFirebase()
export interface FirebaseServicesAndUser {
  firebaseApp: FirebaseApp | null;
  firestore: Firestore | null;
  auth: Auth | null;
  storage: FirebaseStorage | null;
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
}

// Return type for useUser() - specific to user auth state
export interface UserHookResult { // Renamed from UserAuthHookResult for consistency if desired, or keep as UserAuthHookResult
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
}

// React Context
export const FirebaseContext = createContext<FirebaseContextState | undefined>(undefined);

/**
 * FirebaseProvider manages and provides Firebase services and user authentication state.
 */
export const FirebaseProvider: React.FC<FirebaseProviderProps> = ({
  children,
  firebaseApp,
  firestore,
  auth,
  storage
}) => {
  const [userAuthState, setUserAuthState] = useState<UserAuthState>({
    user: null,
    isUserLoading: true, // Start loading until first auth event
    userError: null,
  });

  // Subscribe to Supabase and Firebase auth state changes
  useEffect(() => {
    let isMounted = true;

    // Fast-sync from cached auth on client mount
    const cached = getCachedAuth();
    if (cached.user && isMounted) {
      setUserAuthState({
        user: cached.user as any,
        isUserLoading: false,
        userError: null,
      });
    }

    const getStoredAdmin = () => {
      try {
        if (typeof window !== 'undefined') {
          const raw = localStorage.getItem('polaris_admin_session');
          if (raw) return JSON.parse(raw);
        }
      } catch (e) {
        // ignore
      }
      return null;
    };

    // Check existing Supabase session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isMounted) return;
      if (session?.user) {
        const su = session.user;
        const mappedUser = {
          uid: su.id,
          id: su.id,
          email: su.email || null,
          displayName: su.user_metadata?.first_name 
            ? `${su.user_metadata.first_name} ${su.user_metadata.last_name || ''}`.trim()
            : (su.email?.split('@')[0] || null),
          phoneNumber: su.user_metadata?.phone || null,
          user_metadata: su.user_metadata,
          role: su.user_metadata?.role || 'customer',
        } as any;

        setCachedAuth(mappedUser);
        setUserAuthState({
          user: mappedUser,
          isUserLoading: false,
          userError: null,
        });
      } else {
        const storedAdmin = getStoredAdmin();
        if (storedAdmin) {
          const adminUser = {
            uid: storedAdmin.id,
            id: storedAdmin.id,
            email: storedAdmin.email || null,
            displayName: storedAdmin.name || (storedAdmin.email?.split('@')[0] || 'Admin'),
            role: 'admin',
            isAdmin: true,
          } as any;
          setCachedAuth(adminUser, 'admin');
          setUserAuthState({
            user: adminUser,
            isUserLoading: false,
            userError: null,
          });
        } else {
          clearCachedAuth();
          setUserAuthState({ user: null, isUserLoading: false, userError: null });
        }
      }
    }).catch(err => {
      console.warn("Supabase session get warning:", err);
      const storedAdmin = getStoredAdmin();
      if (storedAdmin && isMounted) {
        setUserAuthState({
          user: {
            uid: storedAdmin.id,
            id: storedAdmin.id,
            email: storedAdmin.email || null,
            displayName: storedAdmin.name || 'Admin',
            role: 'admin',
            isAdmin: true,
          } as any,
          isUserLoading: false,
          userError: null,
        });
      } else if (!auth && isMounted) {
        setUserAuthState({ user: null, isUserLoading: false, userError: null });
      }
    });

    // Listen for custom admin auth change events
    const handleAdminAuthEvent = () => {
      if (!isMounted) return;
      const cached = getCachedAuth();
      if (cached.user) {
        setUserAuthState({
          user: cached.user as any,
          isUserLoading: false,
          userError: null,
        });
      } else {
        setUserAuthState({ user: null, isUserLoading: false, userError: null });
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('polaris_admin_auth_changed', handleAdminAuthEvent);
      window.addEventListener('polaris_auth_changed', handleAdminAuthEvent);
      window.addEventListener('storage', handleAdminAuthEvent);
    }

    // Subscribe to Supabase auth events
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;
      if (event === 'SIGNED_OUT' || (!session?.user && !getStoredAdmin())) {
        clearCachedAuth();
        setUserAuthState({ user: null, isUserLoading: false, userError: null });
        return;
      }

      if (session?.user) {
        const su = session.user;
        const mappedUser = {
          uid: su.id,
          id: su.id,
          email: su.email || null,
          displayName: su.user_metadata?.first_name 
            ? `${su.user_metadata.first_name} ${su.user_metadata.last_name || ''}`.trim()
            : (su.email?.split('@')[0] || null),
          phoneNumber: su.user_metadata?.phone || null,
          user_metadata: su.user_metadata,
          role: su.user_metadata?.role || 'customer',
        } as any;

        setCachedAuth(mappedUser);
        setUserAuthState({
          user: mappedUser,
          isUserLoading: false,
          userError: null,
        });
      } else {
        const storedAdmin = getStoredAdmin();
        if (storedAdmin) {
          setUserAuthState({
            user: {
              uid: storedAdmin.id,
              id: storedAdmin.id,
              email: storedAdmin.email || null,
              displayName: storedAdmin.name || (storedAdmin.email?.split('@')[0] || 'Admin'),
              role: 'admin',
              isAdmin: true,
            } as any,
            isUserLoading: false,
            userError: null,
          });
        } else {
          clearCachedAuth();
          setUserAuthState({ user: null, isUserLoading: false, userError: null });
        }
      }
    });

    // Fallback to Firebase auth if available
    let fbUnsubscribe: (() => void) | null = null;
    if (auth) {
      fbUnsubscribe = onAuthStateChanged(
        auth,
        (firebaseUser) => {
          if (!isMounted) return;
          if (firebaseUser) {
            setUserAuthState({ user: firebaseUser, isUserLoading: false, userError: null });
          }
        },
        (error) => {
          console.error("Firebase onAuthStateChanged error:", error);
        }
      );
    }

    return () => {
      isMounted = false;
      if (typeof window !== 'undefined') {
        window.removeEventListener('polaris_admin_auth_changed', handleAdminAuthEvent);
        window.removeEventListener('storage', handleAdminAuthEvent);
      }
      subscription.unsubscribe();
      if (fbUnsubscribe) fbUnsubscribe();
    };
  }, [auth]);

  // Memoize the context value
  const contextValue = useMemo((): FirebaseContextState => {
    const servicesAvailable = !!(firebaseApp && firestore && auth && storage);
    return {
      areServicesAvailable: servicesAvailable,
      firebaseApp: servicesAvailable ? firebaseApp : null,
      firestore: servicesAvailable ? firestore : null,
      auth: servicesAvailable ? auth : null,
      storage: servicesAvailable ? storage : null,
      user: userAuthState.user,
      isUserLoading: userAuthState.isUserLoading,
      userError: userAuthState.userError,
    };
  }, [firebaseApp, firestore, auth, storage, userAuthState]);

  return (
    <FirebaseContext.Provider value={contextValue}>
      <FirebaseErrorListener />
      {children}
    </FirebaseContext.Provider>
  );
};

/**
 * Hook to access core Firebase services and user authentication state.
 * Throws error if core services are not available or used outside provider.
 */
export const useFirebase = (): FirebaseServicesAndUser => {
  const context = useContext(FirebaseContext);

  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider.');
  }

  return {
    firebaseApp: context.firebaseApp,
    firestore: context.firestore,
    auth: context.auth,
    storage: context.storage,
    user: context.user,
    isUserLoading: context.isUserLoading,
    userError: context.userError,
  };
};

/** Hook to access Firebase Auth instance. */
export const useAuth = (): Auth | null => {
  const { auth } = useFirebase();
  return auth;
};

/** Hook to access Firestore instance. */
export const useFirestore = (): Firestore | null => {
  const { firestore } = useFirebase();
  return firestore;
};

/** Hook to access Firebase App instance. */
export const useFirebaseApp = (): FirebaseApp | null => {
  const { firebaseApp } = useFirebase();
  return firebaseApp;
};

type MemoFirebase <T> = T & {__memo?: boolean};

export function useMemoFirebase<T>(factory: () => T, deps: DependencyList): T | (MemoFirebase<T>) {
  const memoized = useMemo(factory, deps);
  
  if(typeof memoized !== 'object' || memoized === null) return memoized;
  (memoized as MemoFirebase<T>).__memo = true;
  
  return memoized;
}

/**
 * Hook specifically for accessing the authenticated user's state.
 * This provides the User object, loading status, and any auth errors.
 * @returns {UserHookResult} Object with user, isUserLoading, userError.
 */
export const useUser = (): UserHookResult => { // Renamed from useAuthUser
  const { user, isUserLoading, userError } = useFirebase(); // Leverages the main hook
  return { user, isUserLoading, userError };
};
