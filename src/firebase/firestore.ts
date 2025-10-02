import { collection, doc, setDoc, getDoc, query, where, getDocs } from 'firebase/firestore';
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
      updatedAt: new Date().toISOString()
    };
    
    // Only set createdAt if it's not already provided
    if (!credentialData.createdAt) {
      dataToSave.createdAt = new Date().toISOString();
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
      const rawData = credentialSnap.data();
      // Convert any Firestore timestamps to ISO strings
      const convertedData = convertTimestamps(rawData);
      return { success: true, data: convertedData, error: null };
    } else {
      return { success: false, data: null, error: 'No credentials found' };
    }
  } catch (error: unknown) {
    const firestoreError = error as Error;
    return { success: false, data: null, error: firestoreError.message };
  }
};

// Helper function to convert Firestore timestamps to ISO strings
const convertTimestamps = (obj: any): any => {
  if (obj === null || obj === undefined) return obj;
  
  if (typeof obj === 'object') {
    // Check if it's a Firestore timestamp object
    if (obj.seconds !== undefined && obj.nanoseconds !== undefined) {
      // Convert Firestore timestamp to ISO string
      const date = new Date(obj.seconds * 1000 + obj.nanoseconds / 1000000);
      return date.toISOString();
    }
    
    // If it's an array, convert each element
    if (Array.isArray(obj)) {
      return obj.map(convertTimestamps);
    }
    
    // If it's a regular object, convert each property
    const converted: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        converted[key] = convertTimestamps(obj[key]);
      }
    }
    return converted;
  }
  
  return obj;
};

export const getCredentials = async (userId: string) => {
  try {
    // Path: users/{userId}/credentials
    const credentialsRef = collection(db, 'users', userId, 'credentials');
    const q = query(credentialsRef);
    const querySnapshot = await getDocs(q);
    
    const credentials: UserCredentials[] = [];
    querySnapshot.forEach((doc) => {
      const rawData = doc.data();
      // Convert any Firestore timestamps to ISO strings
      const convertedData = convertTimestamps(rawData);
      credentials.push({ id: doc.id, ...convertedData } as UserCredentials);
    });
    
    return { success: true, data: credentials, error: null };
  } catch (error: unknown) {
    const firestoreError = error as Error;
    return { success: false, data: null, error: firestoreError.message };
  }
};