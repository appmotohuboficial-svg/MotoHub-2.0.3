import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  ImageBackground,
  Platform,
  Alert,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { collection, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../services/firebase';

export function FormularioManutencao({ route, navigation }: any) {
  const categoriaSelecionada = route?.params?.categoria || 'Geral';
  const motoId = route?.params?.motoId; // ID da moto passada por parâmetro

  const isAdministrativo = categoriaSelecionada === 'Seguro' || categoriaSelecionada === 'Documentos';

  // Estados de Data com Objeto Date para o Calendário Nativo
  const [data, setData] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [dataVencimento, setDataVencimento] = useState(new Date());
  const [showVencimentoPicker, setShowVencimentoPicker] = useState(false);

  const [observacoes, setObservacoes] = useState('');
  
  // Estados Mecânicos
  const [km, setKm] = useState('');
  const [oficina, setOficina] = useState('');
  const [trocouFiltro, setTrocouFiltro] = useState(false);
  const [marcaOleo, setMarcaOleo] = useState('');
  const [posicao, setPosicao] = useState(''); 
  const [marcaPeca, setMarcaPeca] = useState('');

  // Estados Administrativos
  const [seguradora, setSeguradora] = useState('');
  const [apolice, setApolice] = useState('');
  const [tipoDoc, setTipoDoc] = useState('');
  const [anoExercicio, setAnoExercicio] = useState('');
  const [valorPago, setValorPago] = useState('');
  const [formaPagamento, setFormaPagamento] = useState('');

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR');
  };

  const handleSalvarManutencao = async () => {
    if (!motoId) {
      Alert.alert('Atenção', 'Nenhuma moto vinculada. Volte e selecione uma moto.');
      return;
    }

    try {
      const dadosManutencao = {
        motoId,
        categoria: categoriaSelecionada,
        data: formatDate(data),
        km: km || '0',
        oficina,
        observacoes,
        trocouFiltro,
        marcaOleo,
        posicao,
        marcaPeca,
        seguradora,
        apolice,
        tipoDoc,
        anoExercicio,
        valorPago,
        dataVencimento: isAdministrativo ? formatDate(dataVencimento) : '',
        formaPagamento,
        createdAt: serverTimestamp(),
      };

      // 1. Salva o registro na coleção 'manutencoes' do Firestore
      await addDoc(collection(db, 'motos', motoId, 'manutencoes'), dadosManutencao);
      
      // 2. Se informou KM, atualiza o hodômetro da moto automaticamente na Garagem
      if (km) {
        const motoRef = doc(db, 'motos', motoId);
        await updateDoc(motoRef, {
          hodometro: km
        });
      }

      Alert.alert('Sucesso', `${categoriaSelecionada} registrada com sucesso!`, [
        { text: 'OK', onPress: () => navigation?.goBack() }
      ]);
    } catch (error: any) {
      Alert.alert('Erro', 'Não foi possível salvar: ' + error.message);
    }
  };

  const renderPillSelector = (opcoes: string[], stateAtual: string, setState: (val: string) => void) => (
    <View style={styles.pillContainer}>
      {opcoes.map((opcao) => (
        <TouchableOpacity
          key={opcao}
          style={[styles.pill, stateAtual === opcao && styles.pillActive]}
          onPress={() => setState(opcao)}
          activeOpacity={0.7}
        >
          <Text style={[styles.pillText, stateAtual === opcao && styles.pillTextActive]}>
            {opcao}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderCamposDinamicos = () => {
    switch (categoriaSelecionada) {
      case 'Óleo':
        return (
          <View style={styles.dynamicFieldsContainer}>
            <TextInput
              style={styles.input}
              placeholder="Marca e Viscosidade (Ex: Motul 10W40)"
              placeholderTextColor="#777"
              value={marcaOleo}
              onChangeText={setMarcaOleo}
            />
            <TouchableOpacity 
              style={styles.checkboxContainer} 
              onPress={() => setTrocouFiltro(!trocouFiltro)}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons 
                name={trocouFiltro ? "checkbox-marked" : "checkbox-blank-outline"} 
                size={24} 
                color={trocouFiltro ? "#E53935" : "#AAAAAA"} 
              />
              <Text style={styles.checkboxLabel}>Houve troca do filtro de óleo?</Text>
            </TouchableOpacity>
          </View>
        );

      case 'Pneu':
      case 'Freios':
        return (
          <View style={styles.dynamicFieldsContainer}>
            <Text style={styles.labelNotes}>QUAL RODA?</Text>
            {renderPillSelector(['Dianteiro', 'Traseiro', 'Ambos'], posicao, setPosicao)}
            <TextInput
              style={[styles.input, { marginTop: 12 }]}
              placeholder={categoriaSelecionada === 'Pneu' ? "Marca e Modelo do Pneu" : "Serviço (Ex: Pastilhas, Disco)"}
              placeholderTextColor="#777"
              value={marcaPeca}
              onChangeText={setMarcaPeca}
            />
          </View>
        );

      case 'Seguro':
        return (
          <View style={styles.dynamicFieldsContainer}>
            <TextInput
              style={styles.input}
              placeholder="Nome da Seguradora (Ex: Suhai, Porto)"
              placeholderTextColor="#777"
              value={seguradora}
              onChangeText={setSeguradora}
            />
            <TextInput
              style={styles.input}
              placeholder="Número da Apólice"
              placeholderTextColor="#777"
              value={apolice}
              onChangeText={setApolice}
            />
            
            <TouchableOpacity 
              style={styles.dateButton} 
              onPress={() => setShowVencimentoPicker(true)}
            >
              <Text style={styles.dateButtonText}>Vencimento: {formatDate(dataVencimento)}</Text>
              <MaterialCommunityIcons name="calendar" size={20} color="#E53935" />
            </TouchableOpacity>
            {showVencimentoPicker && (
              <DateTimePicker
                value={dataVencimento}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => {
                  setShowVencimentoPicker(false);
                  if (selectedDate) setDataVencimento(selectedDate);
                }}
              />
            )}

            <TextInput
              style={styles.input}
              placeholder="Valor Pago (R$)"
              placeholderTextColor="#777"
              keyboardType="numeric"
              value={valorPago}
              onChangeText={setValorPago}
            />
            <TextInput
              style={styles.input}
              placeholder="Forma de Pgto (Ex: Boleto Mensal, Débito)"
              placeholderTextColor="#777"
              value={formaPagamento}
              onChangeText={setFormaPagamento}
            />
          </View>
        );

      case 'Documentos':
        return (
          <View style={styles.dynamicFieldsContainer}>
            <Text style={styles.labelNotes}>TIPO DE DOCUMENTO</Text>
            {renderPillSelector(['IPVA', 'Licenciamento', 'Multa'], tipoDoc, setTipoDoc)}
            <TextInput
              style={[styles.input, { marginTop: 12 }]}
              placeholder="Ano de Exercício (Ex: 2024)"
              placeholderTextColor="#777"
              keyboardType="numeric"
              value={anoExercicio}
              onChangeText={setAnoExercicio}
            />
            
            <TouchableOpacity 
              style={styles.dateButton} 
              onPress={() => setShowVencimentoPicker(true)}
            >
              <Text style={styles.dateButtonText}>Vencimento: {formatDate(dataVencimento)}</Text>
              <MaterialCommunityIcons name="calendar" size={20} color="#E53935" />
            </TouchableOpacity>
            {showVencimentoPicker && (
              <DateTimePicker
                value={dataVencimento}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => {
                  setShowVencimentoPicker(false);
                  if (selectedDate) setDataVencimento(selectedDate);
                }}
              />
            )}

            <TextInput
              style={styles.input}
              placeholder="Valor Pago (R$)"
              placeholderTextColor="#777"
              keyboardType="numeric"
              value={valorPago}
              onChangeText={setValorPago}
            />
          </View>
        );

      default:
        return null; 
    }
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
              <Text style={styles.title}>{categoriaSelecionada}</Text>
              <View style={styles.redLine} />
              <Text style={styles.subtitle}>Registro de atividade</Text>
            </View>
          </View>
        </ImageBackground>

        <ScrollView 
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 120 }]} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          
          <Text style={styles.sectionTitle}>{isAdministrativo ? 'DADOS DO REGISTRO' : 'DADOS BÁSICOS'}</Text>

          {/* Botão Calendário para Data */}
          <TouchableOpacity 
            style={styles.dateButton} 
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={styles.dateButtonText}>Data: {formatDate(data)}</Text>
            <MaterialCommunityIcons name="calendar" size={20} color="#E53935" />
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={data}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                setShowDatePicker(false);
                if (selectedDate) setData(selectedDate);
              }}
            />
          )}

          {!isAdministrativo && (
            <>
              <TextInput
                style={styles.input}
                placeholder="Hodômetro (KM)"
                placeholderTextColor="#777"
                keyboardType="numeric"
                value={km}
                onChangeText={setKm}
              />
              <TextInput
                style={styles.input}
                placeholder="Oficina / Local"
                placeholderTextColor="#777"
                value={oficina}
                onChangeText={setOficina}
              />
            </>
          )}

          {renderCamposDinamicos()}

          <Text style={styles.labelNotes}>OBSERVAÇÕES ADICIONAIS</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Detalhes adicionais..."
            placeholderTextColor="#777"
            multiline={true}
            numberOfLines={4}
            textAlignVertical="top"
            value={observacoes}
            onChangeText={setObservacoes}
          />

          <TouchableOpacity style={styles.btnPrimary} onPress={handleSalvarManutencao} activeOpacity={0.8}>
            <Text style={styles.btnPrimaryText}>SALVAR REGISTRO</Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
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
  scrollContent: { paddingHorizontal: 24, paddingBottom: 40 },
  sectionTitle: { color: '#E53935', fontSize: 12, fontWeight: 'bold', marginTop: 24, marginBottom: 16 },
  input: { backgroundColor: '#1A1A1A', borderRadius: 8, height: 56, paddingHorizontal: 16, color: '#FFFFFF', fontSize: 14, marginBottom: 12, borderWidth: 1, borderColor: '#2C2C2C' },
  dateButton: { backgroundColor: '#1A1A1A', borderRadius: 8, height: 56, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, borderWidth: 1, borderColor: '#2C2C2C' },
  dateButtonText: { color: '#FFFFFF', fontSize: 14 },
  dynamicFieldsContainer: { marginTop: 8, marginBottom: 8 },
  checkboxContainer: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, marginBottom: 8 },
  checkboxLabel: { color: '#FFFFFF', fontSize: 14, marginLeft: 12 },
  labelNotes: { color: '#AAAAAA', fontSize: 10, fontWeight: 'bold', marginTop: 8, marginBottom: 8 },
  pillContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  pill: { flex: 1, height: 44, backgroundColor: '#1A1A1A', borderRadius: 8, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#2C2C2C', marginHorizontal: 4 },
  pillActive: { backgroundColor: '#E53935', borderColor: '#E53935' },
  pillText: { color: '#AAAAAA', fontSize: 13, fontWeight: 'bold' },
  pillTextActive: { color: '#FFFFFF' },
  textArea: { backgroundColor: '#1A1A1A', borderRadius: 8, minHeight: 100, padding: 16, color: '#FFFFFF', fontSize: 14, borderWidth: 1, borderColor: '#2C2C2C' },
  btnPrimary: { height: 64, backgroundColor: '#E53935', borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginTop: 32 },
  btnPrimaryText: { color: '#FFFFFF', fontSize: 14, fontWeight: 'bold' },
});