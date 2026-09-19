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
  Image,
  Alert,
  KeyboardAvoidingView,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { collection, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db, auth } from '../services/firebase';
import { useTemporaryImage } from '../hooks/useTemporaryImage';
import { formatarHorario } from '../utils/datas';
import { deleteUploadedImage, uploadLocalImage } from '../services/imageUpload';

const LISTA_ESTRUTURAS = [
  { id: 'bandas', label: 'Bandas / Rock' },
  { id: 'djs', label: 'DJs / Música Eletrônica' },
  { id: 'expositores', label: 'Expositores de Marcas' },
  { id: 'alimentacao', label: 'Praça de Alimentação' },
  { id: 'camping', label: 'Área de Camping' },
  { id: 'coberta', label: 'Área Coberta' },
  { id: 'banheiros', label: 'Banheiros com Limpeza' },
  { id: 'chuveiro', label: 'Chuveiro Quente' },
];

export function NovoEvento({ navigation }: any) {
  const [flyerUri, setFlyerUri] = useTemporaryImage();
  const [salvando, setSalvando] = useState(false);

  const [nomeEvento, setNomeEvento] = useState('');
  const [cidade, setCidade] = useState('');
  const [uf, setUf] = useState('');
  const [local, setLocal] = useState('');
  const [organizador, setOrganizador] = useState('');
  const [contato, setContato] = useState('');
  const [outros, setOutros] = useState('');

  const [dataInicio, setDataInicio] = useState(() => { const data = new Date(); data.setHours(8, 0, 0, 0); return data; });
  const [dataFim, setDataFim] = useState(() => { const data = new Date(); data.setHours(18, 0, 0, 0); return data; });
  const [showPickerInicio, setShowPickerInicio] = useState(false);
  const [showPickerFim, setShowPickerFim] = useState(false);
  const [pickerHorario, setPickerHorario] = useState<'inicio' | 'fim' | null>(null);

  const [estruturasSelecionadas, setEstruturasSelecionadas] = useState<string[]>([]);

  const formatarData = (data: Date) => data.toLocaleDateString('pt-BR');

  const toggleEstrutura = (id: string) => {
    if (estruturasSelecionadas.includes(id)) {
      setEstruturasSelecionadas(estruturasSelecionadas.filter(item => item !== id));
    } else {
      setEstruturasSelecionadas([...estruturasSelecionadas, id]);
    }
  };

  const selecionarImagem = async () => {
    const permissao = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissao.status !== 'granted') {
      Alert.alert('Permissão Negada', 'Precisamos de acesso à sua galeria para carregar o flyer.');
      return;
    }

    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false, 
      quality: 1,
    });

    if (!resultado.canceled) {
      setFlyerUri(resultado.assets[0].uri);
    }
  };

  // Nova função para salvar no Firebase
  const handleSalvarEvento = async () => {
    if (!nomeEvento.trim() || !cidade.trim() || uf.trim().length !== 2) {
      Alert.alert('Atenção', 'Por favor, preencha ao menos o nome do evento, cidade e UF.');
      return;
    }

    if (dataFim <= dataInicio) {
      Alert.alert('Atenção', 'O término deve ser depois do início. Confira as datas e os horários.');
      return;
    }

    let flyerPath = '';

    try {
      setSalvando(true);
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('Erro', 'Você precisa estar logado para cadastrar um evento.');
        return;
      }

      flyerPath = flyerUri ? `eventos/${user.uid}/${Date.now()}.jpg` : '';
      const uploadedFlyerUrl = flyerUri
        ? await uploadLocalImage(flyerUri, flyerPath)
        : '';

      const expiresAt = new Date(dataFim);
      expiresAt.setSeconds(0, 0);

      // Montando o objeto para o Firestore
      const dadosEvento = {
        userId: user.uid,
        nomeEvento: nomeEvento.trim(),
        cidade: cidade.trim(),
        uf: uf.toUpperCase().trim(),
        local: local.trim(),
        organizador: organizador.trim(),
        contato: contato.trim(),
        dataInicio: formatarData(dataInicio),
        dataFim: formatarData(dataFim),
        horarioInicio: formatarHorario(dataInicio),
        horarioFim: formatarHorario(dataFim),
        dataInicioTimestamp: Timestamp.fromDate(dataInicio),
        dataFimTimestamp: Timestamp.fromDate(dataFim),
        expiresAt: Timestamp.fromDate(expiresAt),
        estruturas: estruturasSelecionadas,
        outros: outros.trim(),
        flyerUri: uploadedFlyerUrl,
        flyerPath,
        flyerMetadata: uploadedFlyerUrl ? {
          fileName: flyerPath.split('/').pop(),
          contentType: 'image/jpeg',
        } : null,
        createdAt: serverTimestamp(),
      };

      // Gravando na coleção 'eventos'
      await addDoc(collection(db, 'eventos'), dadosEvento);

      Alert.alert('Sucesso', 'Evento cadastrado com sucesso!', [
        { text: 'OK', onPress: () => navigation?.goBack() }
      ]);
    } catch (error: any) {
      if (flyerPath) {
        await deleteUploadedImage(flyerPath).catch(() => undefined);
      }
      Alert.alert('Erro', 'Não foi possível salvar o evento: ' + error.message);
    } finally {
      setSalvando(false);
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
              <Text style={styles.title}>Novo Evento</Text>
              <View style={styles.redLine} />
              <Text style={styles.subtitle}>Divulgue seu encontro para a comunidade</Text>
            </View>
          </View>
        </ImageBackground>

        <ScrollView 
          contentContainerStyle={styles.scrollContent} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          
          <Text style={styles.sectionTitle}>FLYER DO EVENTO</Text>
          <TouchableOpacity style={styles.uploadContainer} activeOpacity={0.8} onPress={selecionarImagem}>
            {flyerUri ? (
              <Image source={{ uri: flyerUri }} style={styles.flyerImage} resizeMode="contain" />
            ) : (
              <>
                <MaterialCommunityIcons name="image-plus" size={48} color="#E53935" />
                <Text style={styles.uploadText}>Toque para selecionar a arte</Text>
                <Text style={styles.uploadSubtext}>A imagem será otimizada para o banner.</Text>
              </>
            )}
          </TouchableOpacity>

          <Text style={styles.sectionTitle}>INFORMAÇÕES GERAIS</Text>

          <TextInput
            style={styles.input}
            placeholder="Nome do Evento"
            placeholderTextColor="#777"
            value={nomeEvento}
            onChangeText={setNomeEvento}
          />

          <View style={styles.row}>
            <TextInput
              style={[styles.input, { flex: 1, marginRight: 8 }]}
              placeholder="Cidade"
              placeholderTextColor="#777"
              value={cidade}
              onChangeText={setCidade}
            />
            <TextInput
              style={[styles.input, { width: 70 }]}
              placeholder="UF"
              placeholderTextColor="#777"
              maxLength={2}
              autoCapitalize="characters"
              value={uf}
              onChangeText={setUf}
            />
          </View>

          <TextInput
            style={styles.input}
            placeholder="Local / Endereço Completo"
            placeholderTextColor="#777"
            value={local}
            onChangeText={setLocal}
          />

          <Text style={styles.sectionTitle}>PERÍODO DO EVENTO</Text>
          <View style={styles.row}>
            <TouchableOpacity 
              style={[styles.input, styles.dateButton, { flex: 1, marginRight: 6 }]}
              onPress={() => setShowPickerInicio(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.dateLabel}>Início</Text>
              <Text style={styles.dateButtonText}>{formatarData(dataInicio)}</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.input, styles.dateButton, { flex: 1, marginLeft: 6 }]}
              onPress={() => setShowPickerFim(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.dateLabel}>Fim</Text>
              <Text style={styles.dateButtonText}>{formatarData(dataFim)}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.row}>
            <TouchableOpacity accessibilityLabel="Horário de início" style={[styles.input, styles.dateButton, { flex: 1, marginRight: 6 }]} onPress={() => setPickerHorario('inicio')}>
              <Text style={styles.dateLabel}>Horário de início</Text>
              <Text style={styles.dateButtonText}>{formatarHorario(dataInicio)}</Text>
            </TouchableOpacity>
            <TouchableOpacity accessibilityLabel="Horário de término" style={[styles.input, styles.dateButton, { flex: 1, marginLeft: 6 }]} onPress={() => setPickerHorario('fim')}>
              <Text style={styles.dateLabel}>Horário de término</Text>
              <Text style={styles.dateButtonText}>{formatarHorario(dataFim)}</Text>
            </TouchableOpacity>
          </View>
          {pickerHorario && (
            <>
              <DateTimePicker value={pickerHorario === 'inicio' ? dataInicio : dataFim} mode="time" is24Hour display="default"
                onChange={(event, date) => {
                  if (Platform.OS === 'android' || event.type === 'dismissed') setPickerHorario(null);
                  if (event.type === 'dismissed' || !date) return;
                  const atualizada = new Date(pickerHorario === 'inicio' ? dataInicio : dataFim);
                  atualizada.setHours(date.getHours(), date.getMinutes(), 0, 0);
                  if (pickerHorario === 'inicio') setDataInicio(atualizada);
                  else setDataFim(atualizada);
                }}
              />
              {Platform.OS === 'ios' && <TouchableOpacity onPress={() => setPickerHorario(null)}><Text style={styles.sectionTitle}>CONCLUIR HORÁRIO</Text></TouchableOpacity>}
            </>
          )}
          {showPickerInicio && (
            <DateTimePicker value={dataInicio} mode="date" display="default"
              onChange={(_event, date) => {
                if (!date) return setShowPickerInicio(false);
                date.setHours(dataInicio.getHours(), dataInicio.getMinutes(), 0, 0);
                setDataInicio(date);
                if (dataFim < date) setDataFim(date);
                if (Platform.OS === 'android') setShowPickerInicio(false);
              }}
            />
          )}
          {showPickerFim && (
            <DateTimePicker value={dataFim} mode="date" display="default"
              minimumDate={dataInicio}
              onChange={(_event, date) => {
                if (!date) return setShowPickerFim(false);
                date.setHours(dataFim.getHours(), dataFim.getMinutes(), 0, 0);
                setDataFim(date);
                if (Platform.OS === 'android') setShowPickerFim(false);
              }}
            />
          )}

          <Text style={styles.sectionTitle}>ORGANIZAÇÃO</Text>
          <TextInput
            style={styles.input}
            placeholder="Nome do Organizador / Moto Clube"
            placeholderTextColor="#777"
            value={organizador}
            onChangeText={setOrganizador}
          />
          <TextInput
            style={styles.input}
            placeholder="Contato (WhatsApp ou Link)"
            placeholderTextColor="#777"
            keyboardType="phone-pad"
            value={contato}
            onChangeText={setContato}
          />

          <Text style={styles.sectionTitle}>ESTRUTURA E ATRAÇÕES</Text>
          <View style={styles.checkboxGroup}>
            {LISTA_ESTRUTURAS.map((item) => {
              const isChecked = estruturasSelecionadas.includes(item.id);
              return (
                <TouchableOpacity 
                  key={item.id} 
                  style={styles.checkboxContainer} 
                  onPress={() => toggleEstrutura(item.id)}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons 
                    name={isChecked ? "checkbox-marked" : "checkbox-blank-outline"} 
                    size={24} 
                    color={isChecked ? "#E53935" : "#555555"} 
                  />
                  <Text style={styles.checkboxLabel}>{item.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TextInput
            style={styles.textArea}
            placeholder="Outros (Ex: Troféus, Sorteios, Café da manhã grátis...)"
            placeholderTextColor="#777"
            multiline={true}
            numberOfLines={3}
            textAlignVertical="top"
            value={outros}
            onChangeText={setOutros}
          />

          <TouchableOpacity 
            style={styles.btnPrimary} 
            activeOpacity={0.8}
            onPress={handleSalvarEvento}
            disabled={salvando}
          >
            {salvando ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.btnPrimaryText}>CADASTRAR EVENTO</Text>
            )}
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
  scrollContent: { paddingHorizontal: 24, paddingBottom: 120 },
  sectionTitle: { color: '#E53935', fontSize: 12, fontWeight: 'bold', marginTop: 32, marginBottom: 12, textTransform: 'uppercase' },
  input: { backgroundColor: '#1A1A1A', borderRadius: 8, height: 56, paddingHorizontal: 16, color: '#FFFFFF', fontSize: 14, marginBottom: 12, borderWidth: 1, borderColor: '#2C2C2C' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  
  uploadContainer: { height: 220, backgroundColor: '#1A1A1A', borderRadius: 12, borderWidth: 2, borderColor: '#2C2C2C', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', padding: 8, overflow: 'hidden' },
  flyerImage: { width: '100%', height: '100%' },
  uploadText: { color: '#FFFFFF', fontSize: 14, fontWeight: 'bold', marginTop: 12 },
  uploadSubtext: { color: '#777777', fontSize: 11, marginTop: 4, textAlign: 'center' },
  
  dateButton: { justifyContent: 'center', paddingTop: 8 },
  dateLabel: { color: '#777777', fontSize: 10, position: 'absolute', top: 6, left: 16 },
  dateButtonText: { color: '#FFFFFF', fontSize: 15, marginTop: 6 },
  checkboxGroup: { backgroundColor: '#1A1A1A', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#2C2C2C', marginBottom: 12 },
  checkboxContainer: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  checkboxLabel: { color: '#FFFFFF', fontSize: 14, marginLeft: 16 },
  textArea: { backgroundColor: '#1A1A1A', borderRadius: 8, minHeight: 80, padding: 16, color: '#FFFFFF', fontSize: 14, borderWidth: 1, borderColor: '#2C2C2C', marginBottom: 12 },
  btnPrimary: { height: 64, backgroundColor: '#E53935', borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginTop: 32 },
  btnPrimaryText: { color: '#FFFFFF', fontSize: 14, fontWeight: 'bold' },
});
