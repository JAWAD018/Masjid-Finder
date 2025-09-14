// src/firebase/firebaseService.js
import { auth, db } from "./config"; 
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
} from "firebase/firestore";

class FirebaseService {
  async signInWithEmailAndPassword(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  async createUserWithEmailAndPassword(email, password) {
    return createUserWithEmailAndPassword(auth, email, password);
  }

  async signOut() {
    return signOut(auth);
  }

  onAuthStateChanged(callback) {
    return onAuthStateChanged(auth, callback);
  }

  // ✅ Add this
  getCurrentUser() {
    return auth.currentUser;
  }

  async addDoc(collectionName, data) {
    return addDoc(collection(db, collectionName), data);
  }

  async getDocs(collectionName) {
    const snapshot = await getDocs(collection(db, collectionName));
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  }

  async updateDoc(collectionName, id, data) {
    const ref = doc(db, collectionName, id);
    return updateDoc(ref, data);
  }

  async deleteDoc(collectionName, id) {
    const ref = doc(db, collectionName, id);
    return deleteDoc(ref);
  }

  onSnapshot(collectionName, callback) {
    const ref = collection(db, collectionName);
    return onSnapshot(ref, (snapshot) =>
      callback(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })))
    );
  }
}

const firebase = new FirebaseService();
export default firebase;
