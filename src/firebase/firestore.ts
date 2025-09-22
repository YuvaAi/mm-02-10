import { collection, doc, setDoc, getDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import { UserCredentials } from './types';

// Firestore functions
export const saveCredential = async (
  userId: string,
  credentialData: { type: string } & Record<string, unknown>
) => {
  try {
    console.log('Saving credential for user:', userId, 'type:', credentialData.type);
    
    // Path: users/{userId}/credentials/{provider}
    const credentialRef = doc(db, 'users', userId, 'credentials', credentialData.type);
    
    // Prepare the data to save
    const dataToSave = {
      ...credentialData,
      userId,
      updatedAt: serverTimestamp()
    };
    
    // Only set createdAt if it's not already provided
    if (!credentialData.createdAt) {
      dataToSave.createdAt = serverTimestamp();
    }
    
    console.log('Saving credential data:', dataToSave);
    
    await setDoc(credentialRef, dataToSave);
    console.log('Credential saved successfully');
    
    return { success: true, error: null };
  } catch (error: unknown) {
    const firestoreError = error as Error;
    console.error('Error saving credential:', firestoreError);
    return { success: false, error: firestoreError.message };
  }
};

export const getCredential = async (userId: string, platform: string) => {
  try {
    // Path: users/{userId}/credentials/{provider}
    const credentialRef = doc(db, 'users', userId, 'credentials', platform);
    const credentialSnap = await getDoc(credentialRef);
    
    if (credentialSnap.exists()) {
      return { success: true, data: credentialSnap.data(), error: null };
    } else {
      return { success: false, data: null, error: 'No credentials found' };
    }
  } catch (error: unknown) {
    const firestoreError = error as Error;
    return { success: false, data: null, error: firestoreError.message };
  }
};

export const getCredentials = async (userId: string) => {
  try {
    // Path: users/{userId}/credentials
    const credentialsRef = collection(db, 'users', userId, 'credentials');
    const q = query(credentialsRef);
    const querySnapshot = await getDocs(q);
    
    const credentials: UserCredentials[] = [];
    querySnapshot.forEach((doc) => {
      credentials.push({ id: doc.id, ...doc.data() } as UserCredentials);
    });
    
    return { success: true, data: credentials, error: null };
  } catch (error: unknown) {
    const firestoreError = error as Error;
    return { success: false, data: null, error: firestoreError.message };
  }
};