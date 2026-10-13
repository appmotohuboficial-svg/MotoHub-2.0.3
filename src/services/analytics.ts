import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';

// Somente nomes de telas; nunca enviar parâmetros das rotas ou dados pessoais.
export async function registrarTelaAnalytics(screenName: string): Promise<void> {
  if (Platform.OS !== 'android' || Constants.executionEnvironment === ExecutionEnvironment.StoreClient) return;
  if (!screenName || screenName.length > 100) return;

  try {
    // Carregamento tardio mantém Expo Go e web sem acessar módulos nativos.
    const { getAnalytics, logScreenView } = await import('@react-native-firebase/analytics');
    await logScreenView(getAnalytics(), { screen_name: screenName, screen_class: screenName });
  } catch {
    // Uma falha de telemetria não deve interromper a navegação.
    if (__DEV__) console.warn('Analytics indisponível nesta build; navegação preservada.');
  }
}
