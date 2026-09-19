import React, { useEffect } from 'react';
import { View, Image, StyleSheet, StatusBar } from 'react-native';

export function SplashScreen({ navigation }: any) {
  useEffect(() => {
    // Redireciona para a tela InicioVisitante após 2.5 segundos
    const timer = setTimeout(() => {
      navigation.replace('InicioVisitante');
    }, 2500);

    // Limpa o timer caso o componente seja desmontado antes do tempo
    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      
      <Image 
        source={require('../../assets/icon-motohub.png')}
        style={styles.logo}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 280,
    height: 280,
  },
});
