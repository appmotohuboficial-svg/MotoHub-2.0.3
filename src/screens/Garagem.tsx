import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, StatusBar, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MotoCard } from '../components/MotoCard';
import { Moto } from '../types';
import { BottomNav } from '../components/BottomNav';
import { BottomSheetMenu } from '../components/BottomSheetMenu';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../services/firebase';

export function Garagem({ navigation }: any) {
  const [motos, setMotos] = useState<Moto[]>([]);

  // Estado para controlar o menu do botão +
  const [menuVisible, setMenuVisible] = useState(false);

  // Sincronização em tempo real com o Firestore
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const q = query(collection(db, 'motos'), where('userId', '==', user.uid));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const listaMotos: Moto[] = [];
      querySnapshot.forEach((doc) => {
        listaMotos.push({ id: doc.id, ...doc.data() } as Moto);
      });
      setMotos(listaMotos);
    });

    return () => unsubscribe();
  }, []);

  const handleCadastrarMoto = () => {
    navigation.navigate('NovoCadastroMotos');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />
      
      {/* Header Fixo */}
      <View style={styles.header}>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.title}>Minha Garagem</Text>
          <View style={styles.redLine} />
          <Text style={styles.subtitle}>Gerencie suas máquinas</Text>
        </View>

        <TouchableOpacity style={styles.addButton} onPress={handleCadastrarMoto} activeOpacity={0.8}>
          <Text style={styles.addButtonText}>+ Cadastrar Moto</Text>
        </TouchableOpacity>
      </View>

      {/* Lista de Motos com rolagem garantida ou Estado Vazio */}
      {motos.length === 0 ? (
        <ScrollView contentContainerStyle={styles.emptyContainer} showsVerticalScrollIndicator={false}>
          <Text style={styles.emptyText}>Nenhuma moto cadastrada</Text>
        </ScrollView>
      ) : (
        <FlatList
          data={motos}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <MotoCard 
              moto={item} 
              onPress={() => {
                navigation.navigate('PerfilDaMoto', { moto: item });
              }} 
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* BARRA INFERIOR */}
      <BottomNav 
        state={{ routes: [{ name: 'GaragemTab' }], index: 0 }} 
        navigation={navigation} 
        onPressFab={() => setMenuVisible(true)} 
      />

      {/* MENU DO BOTÃO + */}
      <BottomSheetMenu
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        onSelectNovaManutencao={() => navigation.navigate('Manutencao')}
        onSelectNovoEvento={() => navigation.navigate('Eventos')}
        onSelectNovaViagem={() => navigation.navigate('Viagens')}
      />

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  headerTitleContainer: {
    flex: 1,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '900',
  },
  redLine: {
    width: 32,
    height: 3,
    backgroundColor: '#E53935',
    marginTop: 8,
    marginBottom: 8,
  },
  subtitle: {
    color: '#AAAAAA',
    fontSize: 14,
  },
  addButton: {
    backgroundColor: '#E53935',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 140, // Espaço extra para a barra inferior não cobrir o último card
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
  },
  emptyText: {
    color: '#AAAAAA',
    fontSize: 16,
  },
});