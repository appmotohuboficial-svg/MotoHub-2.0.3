import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
  FlatList,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from '../services/firebase';
import { MOEDA_PADRAO, formatarMoeda, lerCentavos, calcularTotal } from '../utils/moeda';

export function RegistrarAbastecimento({ navigation }: any) {
  // Estados para seleção da Moto
  const [motos, setMotos] = useState<any[]>([]);
  const [motoSelecionada, setMotoSelecionada] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [loadingMotos, setLoadingMotos] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Estados do Formulário
  const [data, setData] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [hodometro, setHodometro] = useState('');
  const [tipoCombustivel, setTipoCombustivel] = useState('');
  const [litros, setLitros] = useState('');
  const [valorLitro, setValorLitro] = useState('');
  const [tanqueCompleto, setTanqueCompleto] = useState(true);

  // Busca as motos cadastradas na garagem do usuário
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
        
        // Se o usuário já tiver motos cadastradas, seleciona a primeira por padrão
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

  const formatarData = (dataObj: Date) => {
    return dataObj.toLocaleDateString('pt-BR');
  };

  const handleSalvar = async () => {
    if (!motoSelecionada || !hodometro || !litros || !valorLitro) {
      Alert.alert('Atenção', 'Preencha todos os campos obrigatórios.');
      return;
    }

    setIsSaving(true);

    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('Erro', 'Usuário não autenticado.');
        setIsSaving(false);
        return;
      }

      // Converte os valores de string para número trocando vírgula por ponto
      const litrosNum = Number(litros.replace(',', '.'));
      const valorNum = lerCentavos(valorLitro);
      const hodoNum = Number(hodometro.replace(',', '.'));

      if (![litrosNum, valorNum, hodoNum].every(Number.isFinite) || litrosNum <= 0 || valorNum <= 0 || hodoNum < 0) {
        Alert.alert('Valores inválidos', 'Informe quilometragem, litros e valor com números válidos.');
        return;
      }

      const novoAbastecimento = {
        userId: user.uid,
        motoId: motoSelecionada.id,
        motoNome: `${motoSelecionada.marca} ${motoSelecionada.modelo}`,
        dataAbastecimento: formatarData(data),
        hodometro: hodoNum,
        tipoCombustivel,
        litros: litrosNum,
        valorLitro: valorNum,
        valorTotal: calcularTotal(litrosNum, valorNum),
        moeda: MOEDA_PADRAO,
        tanqueCompleto,
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, 'abastecimentos'), novoAbastecimento);

      Alert.alert('Sucesso', 'Abastecimento registrado com sucesso!', [
        { text: 'OK', onPress: () => navigation?.goBack() }
      ]);
    } catch (error: any) {
      Alert.alert('Erro', 'Não foi possível salvar o abastecimento: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1 }}
      >
        <StatusBar barStyle="light-content" backgroundColor="#121212" />

        {/* Header Padronizado */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.title}>Abastecimento</Text>
              <View style={styles.redLine} />
              <Text style={styles.subtitle}>Registre seu consumo</Text>
            </View>

            <TouchableOpacity 
              style={styles.backButton} 
              onPress={() => navigation?.goBack()}
              disabled={isSaving}
            >
              <Text style={styles.backButtonText}>&lt;</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView 
          contentContainerStyle={styles.scrollContent} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          
          <Text style={styles.sectionTitle}>QUAL MOTO VOCÊ ABASTECEU?</Text>
          
          {/* Seleção da Moto via Modal */}
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

          <Text style={styles.sectionTitle}>DADOS DO ABASTECIMENTO</Text>

          {/* Campo de Data (Calendário Nativo) */}
          <TouchableOpacity 
            style={styles.inputPicker} 
            onPress={() => setShowPicker(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.pickerLabel}>Data do abastecimento</Text>
            <Text style={styles.pickerValue}>{formatarData(data)}</Text>
            <MaterialCommunityIcons name="calendar" size={20} color="#E53935" style={styles.iconRight} />
          </TouchableOpacity>

          {showPicker && (
            <DateTimePicker
              value={data}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                setShowPicker(Platform.OS === 'ios');
                if (selectedDate) setData(selectedDate);
              }}
            />
          )}

          <TextInput
            style={styles.input}
            placeholder="Hodômetro Total (KM)"
            placeholderTextColor="#777"
            keyboardType="numeric"
            value={hodometro}
            onChangeText={setHodometro}
          />

          <TextInput
            style={styles.input}
            placeholder="Tipo de Combustível (Ex: Gasolina Aditivada)"
            placeholderTextColor="#777"
            value={tipoCombustivel}
            onChangeText={setTipoCombustivel}
          />

          <Text style={styles.pickerValue}>Litros e valor por litro (BRL)</Text>
          <View style={styles.rowInputs}>
            <TextInput
              style={[styles.input, styles.halfInput]}
              placeholder="Litros"
              placeholderTextColor="#777"
              keyboardType="numeric"
              value={litros}
              onChangeText={setLitros}
            />

            <TextInput
              style={[styles.input, styles.halfInput]}
              placeholder="R$ 0,00"
              accessibilityLabel="Valor por litro em reais"
              placeholderTextColor="#777"
              keyboardType="numeric"
              value={valorLitro}
              onChangeText={(texto) => setValorLitro(texto.replace(/\D/g, '') ? formatarMoeda(lerCentavos(texto)) : '')}
              maxLength={20}
            />
          </View>

          <Text style={styles.pickerValue}>Total: {formatarMoeda(calcularTotal(Math.max(0, Number(litros.replace(',', '.')) || 0), lerCentavos(valorLitro)))}</Text>

          <View style={styles.switchContainer}>
            <View style={styles.switchTextContainer}>
              <Text style={styles.switchTitle}>TANQUE COMPLETO?</Text>
              <Text style={styles.switchDescription}>
                Marque somente quando abastecer até completar o tanque.
              </Text>
            </View>
            <Switch
              value={tanqueCompleto}
              onValueChange={setTanqueCompleto}
              trackColor={{ false: '#444444', true: '#E53935' }}
              thumbColor="#FFFFFF"
            />
          </View>

          <TouchableOpacity style={styles.btnPrimary} onPress={handleSalvar} disabled={isSaving}>
            {isSaving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.btnPrimaryText}>REGISTRAR ABASTECIMENTO</Text>
            )}
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>

      {/* Modal de Seleção de Moto */}
      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
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
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    height: 140,
    backgroundColor: '#1A1A1A',
    justifyContent: 'flex-end',
    paddingHorizontal: 24,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2C',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
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
    marginVertical: 8,
  },
  subtitle: {
    color: '#AAAAAA',
    fontSize: 14,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    color: '#E53935',
    fontSize: 32,
    fontWeight: 'bold',
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  sectionTitle: {
    color: '#E53935',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 12,
    marginTop: 16,
  },
  spinnerContainer: {
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
    height: 64,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2C2C2C',
  },
  spinnertext: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  inputPicker: {
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
    height: 64,
    paddingHorizontal: 16,
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2C2C2C',
  },
  pickerLabel: {
    color: '#777777',
    fontSize: 11,
    position: 'absolute',
    top: 8,
    left: 16,
  },
  pickerValue: {
    color: '#FFFFFF',
    fontSize: 15,
    marginTop: 12,
  },
  iconRight: {
    position: 'absolute',
    right: 16,
    top: 22,
  },
  input: {
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
    height: 56,
    paddingHorizontal: 16,
    color: '#FFFFFF',
    fontSize: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2C2C2C',
  },
  rowInputs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    width: '48%',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2C2C2C',
    padding: 16,
    marginTop: 4,
  },
  switchTextContainer: { flex: 1, marginRight: 16 },
  switchTitle: { color: '#FFFFFF', fontSize: 13, fontWeight: 'bold' },
  switchDescription: { color: '#888888', fontSize: 11, marginTop: 4, lineHeight: 16 },
  btnPrimary: {
    height: 64,
    backgroundColor: '#E53935',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  btnPrimaryText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  
  // Estilos do Modal de Seleção
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 24,
    maxHeight: '70%',
    borderWidth: 1,
    borderColor: '#2C2C2C',
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2C',
  },
  modalItemText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginLeft: 16,
    flex: 1,
  },
  modalCloseBtn: {
    marginTop: 24,
    height: 48,
    backgroundColor: '#2C2C2C',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
