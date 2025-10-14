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

// Create a product group and add variant products tied to that group
export const addProductGroup = async (groupData, variants = []) => {
  try {
    console.log('Creating product group...', groupData);
    const groupRef = await addDoc(collection(db, 'productGroups'), groupData);
    const groupId = groupRef.id;

    // Add each variant as a product with a reference to the group
    const addedVariantIds = [];
    for (const variant of variants) {
      const variantData = {
        ...groupData,
        ...variant,
        groupId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const variantRef = await addDoc(collection(db, 'products'), variantData);
      addedVariantIds.push(variantRef.id);
    }

    // Persist variantIds into the group document so group metadata is immediately available
    try {
      await updateDoc(groupRef, {
        variantIds: addedVariantIds,
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      console.warn('Failed to persist variantIds on group doc:', err);
      // Not fatal: variants were created; return their IDs so caller can handle
    }

    console.log('Product group created with ID:', groupId, 'variants:', addedVariantIds);
    return { groupId, variantIds: addedVariantIds };
  } catch (error) {
    console.error('Error creating product group:', error);
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
      console.warn(`Product not found for ID: ${id}`);
      // Return null to let callers handle a missing product gracefully
      return null;
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