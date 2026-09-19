import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  FlatList,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { deleteDoc, doc, collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../services/firebase';
import { calcularConsumoMedio } from '../services/consumo';

interface HistoricoManutencao {
  id: string;
  data: string;
  categoria: string;
  km: string;
  oficina?: string;
  observacoes?: string;
}

export function PerfilDaMoto({ route, navigation }: any) {
  const { moto } = route.params || {};
  const [historico, setHistorico] = useState<HistoricoManutencao[]>([]);
  const [consumoMedio, setConsumoMedio] = useState<number | null>(null);

  // Busca o histórico de manutenções desta moto específica no Firestore
  useEffect(() => {
    const fetchHistorico = async () => {
      if (!moto?.id) return;

      try {
        // Buscando na subcoleção 'manutencoes' dentro do documento da moto
        const querySnapshot = await getDocs(collection(db, 'motos', moto.id, 'manutencoes'));
        const lista: HistoricoManutencao[] = [];
        
        querySnapshot.forEach((doc) => {
          lista.push({ id: doc.id, ...doc.data() } as HistoricoManutencao);
        });

        setHistorico(lista);

        const abastecimentosSnapshot = await getDocs(
          query(collection(db, 'abastecimentos'), where('motoId', '==', moto.id)),
        );
        const registros = abastecimentosSnapshot.docs.map((item) => item.data());
        setConsumoMedio(calcularConsumoMedio(registros));
      } catch (error) {
        console.log('Erro ao buscar histórico:', error);
      }
    };

    fetchHistorico();
  }, [moto?.id]);

  const handleExcluirMoto = () => {
    Alert.alert(
      'Excluir Moto',
      `Deseja realmente remover a ${moto.marca} ${moto.modelo} da sua garagem?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Excluir', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'motos', moto.id));
              Alert.alert('Sucesso', 'Moto removida da garagem.');
              navigation.goBack();
            } catch (error: any) {
              Alert.alert('Erro', 'Não foi possível excluir: ' + error.message);
            }
          }
        }
      ]
    );
  };

  const renderHistoricoItem = ({ item }: { item: HistoricoManutencao }) => (
    <View style={styles.historyCard}>
      <View style={styles.historyHeader}>
        <Text style={styles.historyService}>{item.categoria}</Text>
        <Text style={styles.historyDate}>{item.data}</Text>
      </View>
      <Text style={styles.historyKm}>Hodômetro: {item.km} km</Text>
      {item.oficina ? <Text style={styles.historyDetails}>Local: {item.oficina}</Text> : null}
      {item.observacoes ? <Text style={styles.historyDetails}>Obs: {item.observacoes}</Text> : null}
    </View>
  );

  const DetailRow = ({ label, value }: { label: string; value: unknown }) => {
    if (value === undefined || value === null || value === '') return null;
    return (
      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{String(value)}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation?.goBack()}>
          <Text style={styles.backButtonText}>&lt;</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>PERFIL DA MOTO</Text>
        <TouchableOpacity style={styles.deleteButton} onPress={handleExcluirMoto}>
          <MaterialCommunityIcons name="delete-outline" size={24} color="#E53935" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Card de Informações da Moto */}
        <View style={styles.motoProfileCard}>
          <View style={styles.imageContainer}>
            {moto?.fotoUri ? (
              <Image source={{ uri: moto.fotoUri }} style={styles.motoImage} resizeMode="cover" />
            ) : (
              <Image source={require('../../assets/MotoCadMoto.webp')} style={styles.defaultImage} resizeMode="contain" />
            )}
          </View>
          <View style={styles.motoInfo}>
            <Text style={styles.marca}>{moto?.marca}</Text>
            <Text style={styles.modelo}>{moto?.modelo}</Text>
            {moto?.apelido ? <Text style={styles.apelido}>"{moto.apelido}"</Text> : null}
            <Text style={styles.kmText}>{moto?.hodometro || '0'} km</Text>
          </View>
        </View>

        <View style={styles.consumoCard}>
          <MaterialCommunityIcons name="gas-station" size={26} color="#E53935" />
          <View style={styles.consumoInfo}>
            <Text style={styles.consumoLabel}>CONSUMO MÉDIO ESTIMADO</Text>
            <Text style={styles.consumoValue}>
              {consumoMedio !== null
                ? `${consumoMedio.toFixed(1).replace('.', ',')} km/L`
                : 'Dados insuficientes'}
            </Text>
            {consumoMedio === null ? (
              <Text style={styles.consumoHint}>
                Registre dois abastecimentos com tanque completo.
              </Text>
            ) : null}
          </View>
        </View>

        <Text style={styles.sectionTitle}>DADOS DE CADASTRO</Text>
        <View style={styles.detailsCard}>
          <DetailRow label="Marca" value={moto?.marca} />
          <DetailRow label="Modelo" value={moto?.modelo} />
          <DetailRow label="Apelido" value={moto?.apelido} />
          <DetailRow label="Ano" value={moto?.ano} />
          <DetailRow label="Hodômetro" value={`${moto?.hodometro || 0} km`} />
        </View>

        <Text style={styles.sectionTitle}>FICHA TÉCNICA</Text>
        <View style={styles.detailsCard}>
          <DetailRow label="Óleo" value={moto?.tipoOleo} />
          <DetailRow label="Viscosidade" value={moto?.viscosidade} />
          <DetailRow label="Pneu dianteiro" value={moto?.pressaoDianteira ? `${moto.pressaoDianteira} PSI` : ''} />
          <DetailRow label="Pneu traseiro" value={moto?.pressaoTraseira ? `${moto.pressaoTraseira} PSI` : ''} />
          <DetailRow label="Combustível" value={moto?.tipoCombustivel} />
          <DetailRow label="Tanque" value={moto?.capacidadeTanque ? `${moto.capacidadeTanque} L` : ''} />
          <DetailRow label="Fluido de freio" value={moto?.fluidoFreio} />
          <DetailRow label="Filtro de ar" value={moto?.filtroAr} />
          {!moto?.tipoOleo && !moto?.viscosidade && !moto?.tipoCombustivel ? (
            <Text style={styles.emptyText}>Ficha técnica não preenchida.</Text>
          ) : null}
        </View>

        {/* Botão de Atalho para Manutenções */}
        <TouchableOpacity 
          style={styles.btnManutencao}
          onPress={() => navigation.navigate('Manutencao', { moto })}
        >
          <MaterialCommunityIcons name="wrench" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text style={styles.btnManutencaoText}>Gerenciar Manutenções</Text>
        </TouchableOpacity>

        <Text style={[styles.sectionTitle, { marginTop: 32 }]}>HISTÓRICO DE MANUTENÇÃO</Text>
        
        {historico.length === 0 ? (
          <Text style={styles.emptyText}>Nenhuma manutenção registrada para esta moto.</Text>
        ) : (
          <FlatList
            data={historico}
            keyExtractor={(item) => item.id}
            renderItem={renderHistoricoItem}
            scrollEnabled={false}
          />
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  header: { height: 64, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#2C2C2C' },
  backButton: { width: 48, height: 48, justifyContent: 'center', alignItems: 'flex-start' },
  backButtonText: { color: '#E53935', fontSize: 28, fontWeight: 'bold' },
  headerTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  deleteButton: { width: 48, height: 48, justifyContent: 'center', alignItems: 'flex-end' },
  scrollContent: { padding: 24, paddingBottom: 40 },
  
  motoProfileCard: { backgroundColor: '#1A1A1A', borderRadius: 12, padding: 16, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#2C2C2C', marginBottom: 20 },
  imageContainer: { width: 80, height: 80, borderRadius: 8, backgroundColor: '#2C2C2C', overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
  motoImage: { width: '100%', height: '100%' },
  defaultImage: { width: 40, height: 40, opacity: 0.8 },
  motoInfo: { flex: 1, marginLeft: 16 },
  consumoCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1A1A1A', borderRadius: 8, padding: 16, borderWidth: 1, borderColor: '#2C2C2C', marginBottom: 24 },
  consumoInfo: { flex: 1, marginLeft: 14 },
  consumoLabel: { color: '#AAAAAA', fontSize: 10, fontWeight: 'bold' },
  consumoValue: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold', marginTop: 3 },
  consumoHint: { color: '#777777', fontSize: 11, marginTop: 4 },
  marca: { color: '#E53935', fontSize: 12, fontWeight: '900', textTransform: 'uppercase' },
  modelo: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold', marginTop: 2 },
  apelido: { color: '#AAAAAA', fontSize: 14, fontStyle: 'italic', marginTop: 2 },
  kmText: { color: '#FFFFFF', fontSize: 12, fontWeight: 'bold', marginTop: 6, backgroundColor: '#333', alignSelf: 'flex-start', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },

  btnManutencao: { flexDirection: 'row', height: 50, backgroundColor: '#E53935', borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  btnManutencaoText: { color: '#FFFFFF', fontSize: 14, fontWeight: 'bold' },

  sectionTitle: { color: '#E53935', fontSize: 12, fontWeight: 'bold', marginTop: 12, marginBottom: 16 },
  detailsCard: { backgroundColor: '#1A1A1A', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8, marginBottom: 24, borderWidth: 1, borderColor: '#2C2C2C' },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#333' },
  detailLabel: { color: '#AAAAAA', fontSize: 13, marginRight: 16 },
  detailValue: { flex: 1, color: '#FFFFFF', fontSize: 13, fontWeight: '600', textAlign: 'right' },
  historyCard: { backgroundColor: '#1A1A1A', borderRadius: 8, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#2C2C2C' },
  historyHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  historyService: { color: '#FFFFFF', fontSize: 14, fontWeight: 'bold' },
  historyDate: { color: '#AAAAAA', fontSize: 12 },
  historyKm: { color: '#E53935', fontSize: 12, fontWeight: '500', marginBottom: 4 },
  historyDetails: { color: '#AAAAAA', fontSize: 12, marginTop: 2 },
  emptyText: { color: '#777', fontSize: 14, fontStyle: 'italic' },
});
