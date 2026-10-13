import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BottomNav } from '../components/BottomNav';
import { BottomSheetMenu } from '../components/BottomSheetMenu';

export function Motoclubes({ navigation }: any) {
  const [menuVisible, setMenuVisible] = useState(false);
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} accessibilityRole="button" accessibilityLabel="Voltar">
          <MaterialCommunityIcons name="chevron-left" size={30} color="#E53935" />
        </TouchableOpacity>
        <Text style={styles.title}>Motoclube</Text>
      </View>
      <View style={styles.content}>
        <MaterialCommunityIcons name="shield-outline" size={56} color="#E53935" />
        <Text style={styles.badge}>Em breve</Text>
        <Text style={styles.description}>Uma área dedicada aos motoclubes e suas comunidades está chegando ao MotoHub.</Text>
      </View>
      <BottomNav state={{ routes: [{ name: 'Motoclubes' }], index: 0 }} navigation={navigation} onPressFab={() => setMenuVisible(true)} />
      <BottomSheetMenu visible={menuVisible} onClose={() => setMenuVisible(false)}
        onSelectNovaManutencao={() => navigation.navigate('Manutencao')}
        onSelectNovoEvento={() => navigation.navigate('Eventos')}
        onSelectNovaViagem={() => navigation.navigate('Viagens')} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#2C2C2C' },
  backButton: { width: 48, height: 48, justifyContent: 'center', alignItems: 'center' },
  title: { color: '#FFFFFF', fontSize: 24, fontWeight: 'bold', marginLeft: 8 },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, paddingBottom: 140 },
  badge: { color: '#E53935', fontSize: 22, fontWeight: 'bold', marginTop: 16 },
  description: { color: '#AAAAAA', fontSize: 16, textAlign: 'center', lineHeight: 24, marginTop: 12 },
});