import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  ImageBackground,
  Alert,
  Switch,
  Platform,
  KeyboardAvoidingView,
  Modal,
  FlatList,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from '../services/firebase';
import { calcularConsumoMedio } from '../services/consumo';
import { MAX_PASSAGENS, PontoIntermediario, TipoPontoIntermediario } from '../utils/roteiro';

export function NovaViagem({ navigation }: any) {
  const [motos, setMotos] = useState<any[]>([]);
  const [motoSelecionada, setMotoSelecionada] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [loadingMotos, setLoadingMotos] = useState(true);
  const [calculandoMedia, setCalculandoMedia] = useState(false);
  const [temDadosAbastecimento, setTemDadosAbastecimento] = useState(true);

  const [cidadeOrigem, setCidadeOrigem] = useState('');
  const [ufOrigem, setUfOrigem] = useState('');
  const [cidadeDestino, setCidadeDestino] = useState('');
  const [ufDestino, setUfDestino] = useState('');
  const [pontosIntermediarios, setPontosIntermediarios] = useState<PontoIntermediario[]>([]);
  const [localEncontro, setLocalEncontro] = useState('');
  const [consumoMedio, setConsumoMedio] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [isPublica, setIsPublica] = useState(false);

  const [dataPartida, setDataPartida] = useState(new Date());
  const [dataRetorno, setDataRetorno] = useState(new Date());
  const [showPickerPartida, setShowPickerPartida] = useState(false);
  const [showPickerRetorno, setShowPickerRetorno] = useState(false);

  const formatarData = (data: Date) => data.toLocaleDateString('pt-BR');

  // 1. Busca as motos do usuário
  useEffect(() => {
    const fetchMotos = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        const q = query(collection(db, 'motos'), where('userId', '==', user.uid));
        const querySnapshot = await getDocs(q);
        
        const listaMotos: any[] = [];
        querySnapshot.forEach((doc) => {
          listaMotos.push({ id: doc.id, ...doc.data() });
        });

        setMotos(listaMotos);
        if (listaMotos.length > 0) {
          setMotoSelecionada(listaMotos[0]);
        }
      } catch (error) {
        console.log('Erro ao buscar motos:', error);
      } finally {
        setLoadingMotos(false);
      }
    };
    fetchMotos();
  }, []);

  // 2. Busca e calcula a média de forma 100% segura no App (sem exigir índice do Firebase)
  useEffect(() => {
    const calcularMediaHistorica = async () => {
      if (!motoSelecionada) return;
      
      setCalculandoMedia(true);
      setConsumoMedio('');
      setTemDadosAbastecimento(true);
      
      try {
        // Query simples sem ordenar no Firebase para evitar erros de índice
        const q = query(
          collection(db, 'abastecimentos'),
          where('motoId', '==', motoSelecionada.id)
        );
        
        const snapshot = await getDocs(q);
        const abastecimentos = snapshot.docs.map(doc => doc.data());

        const media = calcularConsumoMedio(abastecimentos);
        if (media !== null) {
          setConsumoMedio(media.toFixed(1).replace('.', ','));
          setTemDadosAbastecimento(true);
        } else {
          setTemDadosAbastecimento(false);
        }
      } catch (error) {
        console.log('Erro ao calcular média:', error);
        setTemDadosAbastecimento(false);
      } finally {
        setCalculandoMedia(false);
      }
    };

    calcularMediaHistorica();
  }, [motoSelecionada]);

  const adicionarPontoIntermediario = () => {
    if (pontosIntermediarios.length >= MAX_PASSAGENS) return;
    setPontosIntermediarios((atuais) => [...atuais, { local: '', tipo: 'passagem' }]);
  };

  const atualizarPonto = (index: number, alteracao: Partial<PontoIntermediario>) => {
    setPontosIntermediarios((atuais) => atuais.map((item, posicao) =>
      posicao === index ? { ...item, ...alteracao } : item
    ));
  };

  const moverPonto = (index: number, direcao: -1 | 1) => {
    const destino = index + direcao;
    if (destino < 0 || destino >= pontosIntermediarios.length) return;
    setPontosIntermediarios((atuais) => {
      const copia = [...atuais];
      [copia[index], copia[destino]] = [copia[destino], copia[index]];
      return copia;
    });
  };

  const definirTipo = (index: number, tipo: TipoPontoIntermediario) => atualizarPonto(index, { tipo });

  const handleTraçarRota = () => {
    if (!motoSelecionada) {
      Alert.alert('Atenção', 'Selecione a moto que fará a viagem.');
      return;
    }
    if (!cidadeOrigem.trim() || !ufOrigem.trim() || !cidadeDestino.trim() || !ufDestino.trim()) {
      Alert.alert('Atenção', 'Preencha a cidade e o estado (UF) de origem e destino.');
      return;
    }
    if (!Number.isFinite(Number(consumoMedio.replace(',', '.'))) || Number(consumoMedio.replace(',', '.')) <= 0) {
      Alert.alert('Atenção', 'Informe um consumo médio da moto maior que zero.');
      return;
    }

    const origemCompleta = `${cidadeOrigem.trim()} - ${ufOrigem.toUpperCase().trim()}`;
    const destinoCompleto = `${cidadeDestino.trim()} - ${ufDestino.toUpperCase().trim()}`;
    if (pontosIntermediarios.some((item) => !item.local.trim())) {
      Alert.alert('Atenção', 'Preencha as paradas/passagens ou remova os campos vazios.');
      return;
    }
    const pontosValidos = pontosIntermediarios.map((item) => ({ ...item, local: item.local.trim() }));
    const passagensValidas = pontosValidos.map((item) => item.local);

    const dadosViagem = {
      motoId: motoSelecionada.id,
      motoNome: `${motoSelecionada.marca} ${motoSelecionada.modelo}`,
      origem: origemCompleta,
      destino: destinoCompleto,
      passagens: passagensValidas,
      pontosIntermediarios: pontosValidos,
      consumoMedio,
      localEncontro,
      dataPartida: formatarData(dataPartida),
      dataRetorno: formatarData(dataRetorno),
      observacoes,
      isPublica,
    };

    navigation?.navigate('ResumoRoteiro', dadosViagem);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1 }}
      >
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

        <ImageBackground 
          source={require('../../assets/banner.webp')} 
          style={styles.header}
          imageStyle={{ opacity: 0.8 }}
        >
          <View style={styles.headerOverlay}>
            <View style={styles.topBar}>
              <View style={{ flex: 1 }} />
              <TouchableOpacity style={styles.backButton} onPress={() => navigation?.goBack()}>
                <Text style={styles.backButtonText}>&lt;</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.headerTexts}>
              <Text style={styles.title}>Nova Viagem</Text>
              <View style={styles.redLine} />
              <Text style={styles.subtitle}>Trace seu roteiro</Text>
            </View>
          </View>
        </ImageBackground>

        <ScrollView 
          contentContainerStyle={styles.scrollContent} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          
          <Text style={styles.sectionTitle}>MOTO DA VIAGEM</Text>
          <TouchableOpacity 
            style={styles.spinnerContainer} 
            activeOpacity={0.8}
            onPress={() => setModalVisible(true)}
            disabled={loadingMotos || motos.length === 0}
          >
            {loadingMotos ? (
              <ActivityIndicator color="#E53935" size="small" />
            ) : (
              <Text style={styles.spinnertext}>
                {motoSelecionada ? `${motoSelecionada.marca} ${motoSelecionada.modelo}` : 'Nenhuma moto cadastrada'}
              </Text>
            )}
            <MaterialCommunityIcons name="chevron-down" size={24} color="#E53935" />
          </TouchableOpacity>

          <Text style={styles.sectionTitle}>PROGRAMAR ROTEIRO</Text>

          <View style={styles.row}>
            <TextInput
              style={[styles.input, { flex: 1, marginRight: 8 }]}
              placeholder="Cidade de partida"
              placeholderTextColor="#777"
              value={cidadeOrigem}
              onChangeText={setCidadeOrigem}
            />
            <TextInput
              style={[styles.input, { width: 70 }]}
              placeholder="UF"
              placeholderTextColor="#777"
              maxLength={2}
              autoCapitalize="characters"
              value={ufOrigem}
              onChangeText={setUfOrigem}
            />
          </View>

          {pontosIntermediarios.map((ponto, index) => (
            <View key={`ponto-${index}`} style={styles.pontoCard}>
              <View style={styles.pontoHeader}>
                <Text style={styles.pontoTitulo}>PONTO {index + 1}</Text>
                <View style={styles.pontoAcoes}>
                  <TouchableOpacity
                    accessibilityLabel={`Mover ponto ${index + 1} para cima`}
                    disabled={index === 0}
                    style={[styles.iconButton, index === 0 && styles.iconDisabled]}
                    onPress={() => moverPonto(index, -1)}
                  >
                    <MaterialCommunityIcons name="chevron-up" size={24} color="#FFFFFF" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    accessibilityLabel={`Mover ponto ${index + 1} para baixo`}
                    disabled={index === pontosIntermediarios.length - 1}
                    style={[styles.iconButton, index === pontosIntermediarios.length - 1 && styles.iconDisabled]}
                    onPress={() => moverPonto(index, 1)}
                  >
                    <MaterialCommunityIcons name="chevron-down" size={24} color="#FFFFFF" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    accessibilityLabel={`Remover ponto ${index + 1}`}
                    style={styles.iconButton}
                    onPress={() => setPontosIntermediarios((atuais) => atuais.filter((_item, posicao) => posicao !== index))}
                  >
                    <MaterialCommunityIcons name="close" size={22} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </View>
              <TextInput
                style={styles.input}
                placeholder="Cidade - UF"
                maxLength={100}
                placeholderTextColor="#777"
                value={ponto.local}
                onChangeText={(texto) => atualizarPonto(index, { local: texto })}
              />
              <View style={styles.tipoRow}>
                {(['parada', 'passagem'] as TipoPontoIntermediario[]).map((tipo) => (
                  <TouchableOpacity
                    key={tipo}
                    style={[styles.tipoButton, ponto.tipo === tipo && styles.tipoButtonAtivo]}
                    onPress={() => definirTipo(index, tipo)}
                  >
                    <Text style={[styles.tipoText, ponto.tipo === tipo && styles.tipoTextAtivo]}>
                      {tipo === 'parada' ? 'PARADA' : 'PASSAGEM'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}

          <View style={styles.row}>
            <TextInput
              style={[styles.input, { flex: 1, marginRight: 8 }]}
              placeholder="Cidade destino"
              placeholderTextColor="#777"
              value={cidadeDestino}
              onChangeText={setCidadeDestino}
            />
            <TextInput
              style={[styles.input, { width: 70 }]}
              placeholder="UF"
              placeholderTextColor="#777"
              maxLength={2}
              autoCapitalize="characters"
              value={ufDestino}
              onChangeText={setUfDestino}
            />
          </View>

          {pontosIntermediarios.length < MAX_PASSAGENS && (
            <TouchableOpacity accessibilityRole="button" accessibilityLabel="Adicionar destino intermediário" style={styles.addPassagemButton} onPress={adicionarPontoIntermediario}>
              <MaterialCommunityIcons name="plus-circle-outline" size={24} color="#FFFFFF" />
              <Text style={styles.addPassagemText}>ADICIONAR DESTINO</Text>
            </TouchableOpacity>
          )}
          <Text style={styles.infoText}>Adicione até {MAX_PASSAGENS} destinos intermediários como parada ou passagem. Eles entram entre origem e destino final. Use as setas para reorganizar a ordem.</Text>
          <Text style={styles.sectionTitle}>PERÍODO</Text>
          <View style={styles.row}>
            <TouchableOpacity 
              style={[styles.input, styles.dateButton, { flex: 1, marginRight: 6 }]}
              onPress={() => setShowPickerPartida(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.dateLabel}>Partida</Text>
              <Text style={styles.dateButtonText}>{formatarData(dataPartida)}</Text>
              <MaterialCommunityIcons name="calendar" size={16} color="#E53935" style={styles.dateIcon} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.input, styles.dateButton, { flex: 1, marginLeft: 6 }]}
              onPress={() => setShowPickerRetorno(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.dateLabel}>Retorno</Text>
              <Text style={styles.dateButtonText}>{formatarData(dataRetorno)}</Text>
              <MaterialCommunityIcons name="calendar" size={16} color="#E53935" style={styles.dateIcon} />
            </TouchableOpacity>
          </View>

          {showPickerPartida && (
            <DateTimePicker
              value={dataPartida}
              mode="date"
              display="default"
              onChange={(_event, selectedDate) => {
                if (!selectedDate) return setShowPickerPartida(false);
                setDataPartida(selectedDate);
                if (Platform.OS === 'android') setShowPickerPartida(false);
              }}
            />
          )}
          {showPickerRetorno && (
            <DateTimePicker
              value={dataRetorno}
              mode="date"
              display="default"
              onChange={(_event, selectedDate) => {
                if (!selectedDate) return setShowPickerRetorno(false);
                setDataRetorno(selectedDate);
                if (Platform.OS === 'android') setShowPickerRetorno(false);
              }}
            />
          )}

          <Text style={styles.sectionTitle}>ENCONTRO E CONSUMO</Text>
          <TextInput
            style={styles.input}
            placeholder="Local de encontro (Ex: Posto Ipiranga)"
            placeholderTextColor="#777"
            value={localEncontro}
            onChangeText={setLocalEncontro}
          />
          
          {/* Campo de Consumo com aviso caso não haja dados */}
          <View style={[styles.input, styles.consumoContainer]}>
            <TextInput
              style={styles.consumoInput}
              placeholder="Consumo Médio da Moto (km/l)"
              placeholderTextColor="#777"
              keyboardType="numeric"
              value={consumoMedio}
              onChangeText={setConsumoMedio}
            />
            {calculandoMedia && <ActivityIndicator color="#E53935" size="small" style={{ marginRight: 16 }} />}
          </View>

          {!temDadosAbastecimento && !calculandoMedia && (
            <Text style={styles.warningText}>
              São necessários dois abastecimentos com tanque completo. Informe a média manualmente.
            </Text>
          )}

          <Text style={[styles.sectionTitle, { marginBottom: 8 }]}>OBSERVAÇÕES</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Pontos de parada, tipo de estrada, etc..."
            placeholderTextColor="#777"
            multiline={true}
            numberOfLines={3}
            textAlignVertical="top"
            value={observacoes}
            onChangeText={setObservacoes}
          />

          <View style={styles.switchContainer}>
            <Text style={styles.switchLabel}>Tornar essa viagem pública?</Text>
            <Switch
              value={isPublica}
              onValueChange={setIsPublica}
              trackColor={{ false: '#2C2C2C', true: '#E53935' }}
              thumbColor={'#FFFFFF'}
            />
          </View>

          <TouchableOpacity style={styles.btnPrimary} onPress={handleTraçarRota} activeOpacity={0.8}>
            <Text style={styles.btnPrimaryText}>TRAÇAR ROTA</Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Selecione a Máquina</Text>
            
            <FlatList
              data={motos}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.modalItem}
                  onPress={() => {
                    setMotoSelecionada(item);
                    setModalVisible(false);
                  }}
                >
                  <MaterialCommunityIcons name="motorbike" size={24} color="#AAAAAA" />
                  <Text style={styles.modalItemText}>{item.marca} {item.modelo}</Text>
                  {motoSelecionada?.id === item.id && (
                    <MaterialCommunityIcons name="check" size={24} color="#E53935" />
                  )}
                </TouchableOpacity>
              )}
            />

            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setModalVisible(false)}>
              <Text style={styles.modalCloseText}>FECHAR</Text>
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
  headerOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'space-between', paddingTop: 10 },
  topBar: { flexDirection: 'row', paddingHorizontal: 16 },
  backButton: { width: 48, height: 48, justifyContent: 'center', alignItems: 'center' },
  backButtonText: { color: '#E53935', fontSize: 32, fontWeight: 'bold' },
  headerTexts: { paddingHorizontal: 24, paddingBottom: 32 },
  title: { color: '#FFFFFF', fontSize: 28, fontWeight: '900' },
  redLine: { width: 32, height: 3, backgroundColor: '#E53935', marginTop: 8 },
  subtitle: { color: '#AAAAAA', fontSize: 14, marginTop: 8 },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 120 },
  sectionTitle: { color: '#E53935', fontSize: 12, fontWeight: 'bold', marginTop: 24, marginBottom: 12 },
  spinnerContainer: { backgroundColor: '#1A1A1A', borderRadius: 8, height: 56, paddingHorizontal: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#2C2C2C', marginBottom: 8 },
  spinnertext: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  input: { backgroundColor: '#1A1A1A', borderRadius: 8, height: 56, paddingHorizontal: 16, color: '#FFFFFF', fontSize: 14, marginBottom: 12, borderWidth: 1, borderColor: '#2C2C2C' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  addPassagemButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, minHeight: 52, padding: 12, marginTop: 4, marginBottom: 8, backgroundColor: '#E53935', borderRadius: 8 },
  addPassagemText: { color: '#FFFFFF', fontSize: 14, fontWeight: 'bold' },
  pontoCard: { backgroundColor: '#161616', borderWidth: 1, borderColor: '#2C2C2C', borderRadius: 10, padding: 10, marginBottom: 12 },
  pontoHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  pontoTitulo: { color: '#AAAAAA', fontSize: 11, fontWeight: 'bold' },
  pontoAcoes: { flexDirection: 'row', alignItems: 'center' },
  iconButton: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', marginLeft: 2 },
  iconDisabled: { opacity: 0.25 },
  tipoRow: { flexDirection: 'row', gap: 8 },
  tipoButton: { flex: 1, minHeight: 40, borderRadius: 8, borderWidth: 1, borderColor: '#3A3A3A', alignItems: 'center', justifyContent: 'center' },
  tipoButtonAtivo: { borderColor: '#E53935', backgroundColor: 'rgba(229,57,53,0.14)' },
  tipoText: { color: '#AAAAAA', fontSize: 11, fontWeight: 'bold' },
  tipoTextAtivo: { color: '#FFFFFF' },
  dateButton: { justifyContent: 'center', paddingTop: 12 },
  dateLabel: { color: '#777777', fontSize: 10, position: 'absolute', top: 4, left: 16 },
  dateButtonText: { color: '#FFFFFF', fontSize: 15, marginTop: 4 },
  dateIcon: { position: 'absolute', right: 12, top: 18 },
  consumoContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 0, marginBottom: 4 },
  consumoInput: { flex: 1, height: '100%', color: '#FFFFFF', paddingHorizontal: 16, fontSize: 14 },
  warningText: { color: '#E53935', fontSize: 12, fontStyle: 'italic', marginBottom: 12, marginLeft: 4 },
  textArea: { backgroundColor: '#1A1A1A', borderRadius: 8, minHeight: 80, padding: 16, color: '#FFFFFF', fontSize: 14, borderWidth: 1, borderColor: '#2C2C2C', marginBottom: 12 },
  switchContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  switchLabel: { color: '#FFFFFF', fontSize: 14 },
  infoText: { color: '#AAAAAA', fontSize: 12, marginTop: 8, fontStyle: 'italic' },
  btnPrimary: { height: 64, backgroundColor: '#E53935', borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginTop: 32 },
  btnPrimaryText: { color: '#FFFFFF', fontSize: 14, fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.7)', justifyContent: 'center', padding: 24 },
  modalContent: { backgroundColor: '#1A1A1A', borderRadius: 16, padding: 24, maxHeight: '70%', borderWidth: 1, borderColor: '#2C2C2C' },
  modalTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
  modalItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#2C2C2C' },
  modalItemText: { color: '#FFFFFF', fontSize: 16, marginLeft: 16, flex: 1 },
  modalCloseBtn: { marginTop: 24, height: 48, backgroundColor: '#2C2C2C', borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  modalCloseText: { color: '#FFFFFF', fontSize: 14, fontWeight: 'bold' },
});
