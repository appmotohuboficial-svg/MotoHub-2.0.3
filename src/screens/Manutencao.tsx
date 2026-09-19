import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  ImageBackground,
  Image,
  Modal,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from '../services/firebase';
import { Moto } from '../types';

interface Categoria {
  id: string;
  nome: string;
  icone: any;
}

export function Manutencao({ route, navigation }: any) {
  // Verifica se veio uma moto específica via parâmetro
  const paramMoto = route.params?.moto;

  const [motos, setMotos] = useState<Moto[]>([]);
  const [motoSelecionada, setMotoSelecionada] = useState<Moto | null>(paramMoto || null);
  const [modalMotosVisible, setModalMotosVisible] = useState(false);

  // Categorias de manutenção
  const categorias: Categoria[] = [
    { id: '1', nome: 'Óleo', icone: require('../../assets/oleo.webp') },
    { id: '2', nome: 'Pneu', icone: require('../../assets/pneu.webp') },
    { id: '3', nome: 'Relação', icone: require('../../assets/relacao.webp') },
    { id: '4', nome: 'Freios', icone: require('../../assets/freios.webp') },
    { id: '5', nome: 'Bateria', icone: require('../../assets/bateria.webp') },
    { id: '6', nome: 'Seguro', icone: require('../../assets/seguro.webp') },
    { id: '7', nome: 'Documentos', icone: require('../../assets/documento.webp') },
    { id: '8', nome: 'Revisão', icone: require('../../assets/revisao.webp') },
    { id: '9', nome: 'Outros', icone: require('../../assets/outros.webp') },
  ];

  // Busca as motos do usuário no Firestore ao abrir a tela
  useEffect(() => {
    const fetchMotos = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        const q = query(collection(db, 'motos'), where('userId', '==', user.uid));
        const querySnapshot = await getDocs(q);
        const lista: Moto[] = [];
        querySnapshot.forEach((doc) => {
          lista.push({ id: doc.id, ...doc.data() } as Moto);
        });

        setMotos(lista);

        // Se não veio nenhuma moto por parâmetro e existem motos cadastradas, seleciona a primeira por padrão
        if (!motoSelecionada && lista.length > 0) {
          setMotoSelecionada(lista[0]);
        }
      } catch (error) {
        console.log('Erro ao buscar motos:', error);
      }
    };

    fetchMotos();
  }, []);

  const handleCategoriaPress = (categoriaNome: string) => {
    navigation?.navigate('FormularioManutencao', { 
      categoria: categoriaNome,
      motoId: motoSelecionada?.id,
      motoNome: motoSelecionada ? `${motoSelecionada.marca} ${motoSelecionada.modelo}` : ''
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Header Padronizado */}
      <ImageBackground 
        source={require('../../assets/banner.webp')} 
        style={styles.header}
        imageStyle={{ opacity: 0.8 }}
      >
        <View style={styles.headerOverlay}>
          <View style={styles.topBar}>
            <View style={{ flex: 1 }} />
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={() => navigation?.goBack()}
            >
              <Text style={styles.backButtonText}>&lt;</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.headerTexts}>
            <Text style={styles.title}>Manutenção</Text>
            <View style={styles.redLine} />
            <Text style={styles.subtitle}>Cuide bem da sua máquina</Text>
          </View>
        </View>
      </ImageBackground>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Seleção de Moto Dinâmica */}
        <Text style={styles.sectionTitle}>SELECIONE A MOTO</Text>
        <TouchableOpacity 
          style={styles.spinnerContainer} 
          activeOpacity={0.8}
          onPress={() => setModalMotosVisible(true)}
        >
          <Text style={styles.spinnerText}>
            {motoSelecionada 
              ? `${motoSelecionada.marca} ${motoSelecionada.modelo} ${motoSelecionada.apelido ? `("${motoSelecionada.apelido}")` : ''}` 
              : 'Nenhuma moto encontrada'}
          </Text>
          <MaterialCommunityIcons name="chevron-down" size={24} color="#AAAAAA" />
        </TouchableOpacity>

        {/* Categorias */}
        <Text style={[styles.sectionTitle, { marginTop: 24, marginBottom: 16 }]}>CATEGORIAS</Text>

        <View style={styles.gridContainer}>
          {categorias.map((item) => (
            <TouchableOpacity 
              key={item.id} 
              style={styles.categoryCard}
              onPress={() => handleCategoriaPress(item.nome)}
              activeOpacity={0.7}
            >
              <Image source={item.icone} style={styles.categoryIcon} resizeMode="contain" />
              <Text style={styles.categoryName}>{item.nome}</Text>
            </TouchableOpacity>
          ))}
        </View>

      </ScrollView>

      {/* Modal para Escolher a Moto */}
      <Modal
        visible={modalMotosVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalMotosVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Selecionar Moto</Text>
            
            <FlatList
              data={motos}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => {
                    setMotoSelecionada(item);
                    setModalMotosVisible(false);
                  }}
                >
                  <Text style={styles.modalItemText}>
                    {item.marca} {item.modelo} {item.apelido ? `("${item.apelido}")` : ''}
                  </Text>
                </TouchableOpacity>
              )}
            />

            <TouchableOpacity 
              style={styles.modalCloseButton}
              onPress={() => setModalMotosVisible(false)}
            >
              <Text style={styles.modalCloseText}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  header: { height: 220, width: '100%' },
  headerOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.4)', justifyContent: 'space-between', paddingTop: 10 },
  topBar: { flexDirection: 'row', paddingHorizontal: 16 },
  backButton: { width: 48, height: 48, justifyContent: 'center', alignItems: 'center' },
  backButtonText: { color: '#E53935', fontSize: 32, fontWeight: 'bold' },
  headerTexts: { paddingHorizontal: 24, paddingBottom: 32 },
  title: { color: '#FFFFFF', fontSize: 28, fontWeight: '900' },
  redLine: { width: 32, height: 3, backgroundColor: '#E53935', marginTop: 8 },
  subtitle: { color: '#AAAAAA', fontSize: 14, marginTop: 8 },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 32 },
  sectionTitle: { color: '#AAAAAA', fontSize: 12, fontWeight: 'bold', letterSpacing: 0.2, marginTop: 16 },
  spinnerContainer: { backgroundColor: '#1A1A1A', borderRadius: 8, height: 56, marginTop: 8, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#2C2C2C' },
  spinnerText: { color: '#FFFFFF', fontSize: 14 },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  categoryCard: { backgroundColor: '#1A1A1A', width: '31%', aspectRatio: 1, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 12, borderWidth: 1, borderColor: '#2C2C2C', padding: 8 },
  categoryIcon: { width: 40, height: 40, marginBottom: 8 },
  categoryName: { color: '#FFFFFF', fontSize: 12, fontWeight: 'bold', textAlign: 'center' },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 24 },
  modalCard: { backgroundColor: '#1C1C1E', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#2C2C2C', maxHeight: '60%' },
  modalTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  modalItem: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#2C2C2C' },
  modalItemText: { color: '#FFFFFF', fontSize: 16 },
  modalCloseButton: { marginTop: 16, backgroundColor: '#E53935', height: 48, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  modalCloseText: { color: '#FFFFFF', fontWeight: 'bold' },
});