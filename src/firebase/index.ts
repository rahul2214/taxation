'use client';

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCZO2Isjv_1YE5my6MNlqC1GOALAcvMxpU",
  authDomain: "studio-2420228626-c9ece.firebaseapp.com",
  projectId: "studio-2420228626-c9ece",
  storageBucket: "studio-2420228626-c9ece.appspot.com",
  messagingSenderId: "678202999647",
  appId: "1:678202999647:web:686de81c702cb498cc2cea"
};


// IMPORTANT: DO NOT MODIFY THIS FUNCTION
export function initializeFirebase() {
  if (!getApps().length) {
    // Important! initializeApp() is called without any arguments because Firebase App Hosting
    // integrates with the initializeApp() function to provide the environment variables needed to
    // populate the FirebaseOptions in production. It is critical that we attempt to call initializeApp()
    // without arguments.
    let firebaseApp;
    try {
      // Attempt to initialize via Firebase App Hosting environment variables
      firebaseApp = initializeApp();
    } catch (e) {
      // Only warn in production because it's normal to use the firebaseConfig to initialize
      // during development
      if (process.env.NODE_ENV === "production") {
        console.warn('Automatic initialization failed. Falling back to firebase config object.', e);
      }
      if (!firebaseConfig.projectId) {
        console.error("Firebase config is not set. Please add your Firebase project configuration to the .env file.");
        // We are returning a dummy object here to avoid crashing the app.
        // The app will not work correctly until the Firebase config is set.
        return {
          firebaseApp: null,
          auth: null,
          firestore: null,
          storage: null
        }
      }
      firebaseApp = initializeApp(firebaseConfig);
    }

    return getSdks(firebaseApp);
  }

  // If already initialized, return the SDKs with the already initialized App
  return getSdks(getApp());
}

export function getSdks(firebaseApp: FirebaseApp) {
  if (!firebaseApp) {
    return {
        firebaseApp: null,
        auth: null,
        firestore: null,
        storage: null
    };
  }
  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: getFirestore(firebaseApp),
    storage: getStorage(firebaseApp)
  };
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
