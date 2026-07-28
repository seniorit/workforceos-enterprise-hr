import { Injectable } from "@angular/core";
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  Firestore,
} from "firebase/firestore";

export const firebaseConfig = {
  projectId: "gen-lang-client-0440964729",
  appId: "1:201280266249:web:89d64b7a406976423798d8",
  apiKey: "AIzaSyA6uMblKCSmxxl-4MoRNofsHjSzMMmZlVY",
  authDomain: "gen-lang-client-0440964729.firebaseapp.com localhost:4200",
  firestoreDatabaseId:
    "ai-studio-workforceosenter-f652f67f-04f5-4b0f-a6c9-a04a1094cf3f",
  storageBucket: "gen-lang-client-0440964729.firebasestorage.app",
  messagingSenderId: "201280266249",
};

@Injectable({
  providedIn: "root",
})
export class FirebaseService {
  private app: FirebaseApp;
  public auth: Auth;
  public db: Firestore;

  constructor() {
    if (!getApps().length) {
      this.app = initializeApp({
        apiKey: firebaseConfig.apiKey,
        authDomain: firebaseConfig.authDomain,
        projectId: firebaseConfig.projectId,
        storageBucket: firebaseConfig.storageBucket,
        messagingSenderId: firebaseConfig.messagingSenderId,
        appId: firebaseConfig.appId,
      });
    } else {
      this.app = getApp();
    }

    this.auth = getAuth(this.app);

    // Initialize Firestore with persistent offline cache when running in browser
    const dbId = firebaseConfig.firestoreDatabaseId || "(default)";
    if (typeof window !== "undefined") {
      try {
        this.db = initializeFirestore(
          this.app,
          {
            localCache: persistentLocalCache({
              tabManager: persistentMultipleTabManager(),
            }),
          },
          dbId,
        );
      } catch (e) {
        console.warn(
          "Firestore already initialized or error enabling offline persistence:",
          e,
        );
        this.db = getFirestore(this.app, dbId);
      }
    } else {
      this.db = getFirestore(this.app, dbId);
    }
  }
}
