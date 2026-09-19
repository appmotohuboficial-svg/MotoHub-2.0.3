import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface BottomNavProps {
  state: any;
  navigation: any;
  onPressFab: () => void;
}

export function BottomNav({ state, navigation, onPressFab }: BottomNavProps) {
  const insets = useSafeAreaInsets();
  
  const extraPadding = Platform.OS === 'android' ? 12 : 0;
  const bottomSpace = (insets.bottom > 0 ? insets.bottom : 20) + extraPadding;

  const currentRouteName = state?.routes?.[state?.index]?.name || '';

  const navigateTo = (routeName: string) => {
    navigation.navigate(routeName);
  };

  const isActive = (name: string) => currentRouteName === name;

  return (
    <View 
      style={[
        styles.container, 
        { 
          paddingBottom: bottomSpace,
          height: 68 + bottomSpace 
        }
      ]}
    >
      {/* Botão Home */}
      <TouchableOpacity 
        style={styles.navItem} 
        onPress={() => navigateTo('HomeLogada')}
        activeOpacity={0.7}
      >
        <MaterialCommunityIcons 
          name="home-outline" 
          size={24} 
          color={isActive('HomeLogada') ? '#E53935' : '#888888'} 
        />
        <Text style={[styles.navText, isActive('HomeLogada') && styles.navTextActive]}>Home</Text>
      </TouchableOpacity>

      {/* Botão Garagem */}
      <TouchableOpacity 
        style={styles.navItem} 
        onPress={() => navigateTo('Garagem')}
        activeOpacity={0.7}
      >
        <MaterialCommunityIcons 
          name="motorbike" 
          size={24} 
          color={isActive('Garagem') ? '#E53935' : '#888888'} 
        />
        <Text style={[styles.navText, isActive('Garagem') && styles.navTextActive]}>Garagem</Text>
      </TouchableOpacity>

      {/* Espaço reservado para o FAB Central */}
      <View style={styles.fabSpacer} />

      {/* Botão Parceiros */}
      <TouchableOpacity 
        style={styles.navItem} 
        onPress={() => navigateTo('Parceiros')}
        activeOpacity={0.7}
      >
        <MaterialCommunityIcons 
          name="handshake-outline" 
          size={24} 
          color={isActive('Parceiros') ? '#E53935' : '#888888'} 
        />
        <Text style={[styles.navText, isActive('Parceiros') && styles.navTextActive]}>Parceiros</Text>
      </TouchableOpacity>

      {/* Botão Perfil */}
      <TouchableOpacity 
        style={styles.navItem} 
        onPress={() => navigateTo('Perfil')}
        activeOpacity={0.7}
      >
        <MaterialCommunityIcons 
          name="account-outline" 
          size={24} 
          color={isActive('Perfil') ? '#E53935' : '#888888'} 
        />
        <Text style={[styles.navText, isActive('Perfil') && styles.navTextActive]}>Perfil</Text>
      </TouchableOpacity>

      {/* Botão Central Flutuante (FAB) */}
      <TouchableOpacity 
        style={[styles.fabButton, { bottom: 20 + bottomSpace }]} 
        onPress={onPressFab}
        activeOpacity={0.8}
      >
        <MaterialCommunityIcons name="plus" size={32} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#141414',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#2C2C2C',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 8,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navText: {
    color: '#888888',
    fontSize: 10,
    marginTop: 4,
  },
  navTextActive: {
    color: '#E53935',
    fontWeight: 'bold',
  },
  fabSpacer: {
    flex: 1,
  },
  fabButton: {
    position: 'absolute',
    alignSelf: 'center',
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E53935',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
});