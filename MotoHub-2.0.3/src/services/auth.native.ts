import AsyncStorage from '@react-native-async-storage/async-storage';
import { FirebaseApp } from 'firebase/app';
import { getAuth, getReactNativePersistence, initializeAuth } from 'firebase/auth';

export function initializePlatformAuth(app: FirebaseApp) {
  try {
    return initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch (error) {
    // Fast Refresh pode reencontrar a instância que já foi inicializada.
    if ((error as { code?: string })?.code === 'auth/already-initialized') return getAuth(app);
    throw error;
  }
}
