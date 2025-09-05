// Core Firebase
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { collection, addDoc, getDocs, doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { auth, db } from './config';

const googleProvider = new GoogleAuthProvider();

// Authentication functions
export const registerUser = async (email, password) => {
  try {
    console.log('Registering user...');
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    console.log('User registered successfully:', userCredential.user);
    return userCredential.user;
  } catch (error) {
    console.error('Error registering user:', error);
    throw error;
  }
};

export const loginUser = async (email, password) => {
  try {
    console.log('Logging in user...');
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log('User logged in successfully:', userCredential.user);
    return userCredential.user;
  } catch (error) {
    console.error('Error logging in user:', error);
    throw error;
  }
};

export const loginWithGoogle = async () => {
  try {
    console.log('Logging in with Google...');
    const result = await signInWithPopup(auth, googleProvider);
    console.log('Google login successful:', result.user);
    return result.user;
  } catch (error) {
    console.error('Error logging in with Google:', error);
    throw error;
  }
};

export const logoutUser = async () => {
  try {
    console.log('Logging out user...');
    await signOut(auth);
    console.log('User logged out successfully');
  } catch (error) {
    console.error('Error logging out user:', error);
    throw error;
  }
};

// Database functions
export const addProduct = async (productData) => {
  try {
    console.log('Adding product...', productData);
    const docRef = await addDoc(collection(db, 'products'), productData);
    console.log('Product added successfully with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error adding product:', error);
    throw error;
  }
};

export const getProducts = async () => {
  try {
    console.log('Fetching products...');
    const querySnapshot = await getDocs(collection(db, 'products'));
    const products = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    console.log('Products fetched successfully:', products);
    return products;
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
};

export const getProductById = async (id) => {
  try {
    console.log('Fetching product by ID:', id);
    const docRef = doc(db, 'products', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const product = { id: docSnap.id, ...docSnap.data() };
      console.log('Product fetched successfully:', product);
      return product;
    } else {
      console.error('Product not found');
      throw new Error('Product not found');
    }
  } catch (error) {
    console.error('Error fetching product by ID:', error);
    throw error;
  }
};

export const updateProduct = async (id, productData) => {
  try {
    console.log('Updating product:', id, productData);
    const docRef = doc(db, 'products', id);
    await updateDoc(docRef, productData);
    console.log('Product updated successfully');
  } catch (error) {
    console.error('Error updating product:', error);
    throw error;
  }
};

export const deleteProduct = async (id) => {
  try {
    console.log('Deleting product:', id);
    const docRef = doc(db, 'products', id);
    await deleteDoc(docRef);
    console.log('Product deleted successfully');
  } catch (error) {
    console.error('Error deleting product:', error);
    throw error;
  }
};

// Export instances
export { auth, db, googleProvider }; 