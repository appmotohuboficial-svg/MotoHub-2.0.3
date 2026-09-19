import 'firebase/auth';
import type AsyncStorage from '@react-native-async-storage/async-storage';
import type { Persistence } from 'firebase/auth';

// A entrada nativa do Firebase 12 exporta esta API, mas o barrel de tipos
// firebase/auth usa a declaração web. O Metro resolve a implementação nativa.
declare module 'firebase/auth' {
  export function getReactNativePersistence(storage: typeof AsyncStorage): Persistence;
}
