import React, { useEffect, useState } from 'react';
import { View, Image, StatusBar, StyleSheet, useWindowDimensions } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import * as SplashScreen from 'expo-splash-screen';
import { auth } from '../services/firebase';
import { cleanStaleTemporaryImages } from '../services/temporaryImages';
import { onAuthStateChanged } from 'firebase/auth';

import { AuthRoutes } from './auth.routes';
import { AppRoutes } from './app.routes';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function Routes() {
  useEffect(() => { void cleanStaleTemporaryImages(); }, []);
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [apresentando, setApresentando] = useState(true);
  const [logoPronto, setLogoPronto] = useState(false);
  const [layoutPronto, setLayoutPronto] = useState(false);
  const { width, height } = useWindowDimensions();
  const tamanhoLogo = Math.min(width * 0.82, height * 0.6, 420);

  useEffect(() => onAuthStateChanged(auth, (userState) => {
    setUser(userState);
    setInitializing(false);
  }), []);

  useEffect(() => {
    if (!logoPronto || !layoutPronto) return;
    let ativo = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    // A marca grande precisa estar desenhada antes de remover a abertura do Android.
    // O login é verificado em paralelo; esta apresentação acontece uma vez por montagem.
    SplashScreen.hideAsync().catch(() => {}).then(() => {
      if (ativo) timer = setTimeout(() => setApresentando(false), 800);
    });
    return () => { ativo = false; if (timer) clearTimeout(timer); };
  }, [logoPronto, layoutPronto]);

  if (initializing || apresentando) {
    return <View style={styles.container} onLayout={() => setLayoutPronto(true)}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      <Image source={require('../../assets/icon-motohub.png')}
        style={{ width: tamanhoLogo, height: tamanhoLogo }} resizeMode="contain"
        accessibilityLabel="MotoHub" onLoadEnd={() => setLogoPronto(true)} />
    </View>;
  }

  return (
    <View style={styles.root}>
      <NavigationContainer>
        {user ? <AppRoutes /> : <AuthRoutes />}
      </NavigationContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000000' },
  container: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
