import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  LEGAL_UPDATED_AT,
  PRIVACY_SECTIONS,
  TERMS_SECTIONS,
  type LegalSection,
} from '../content/legal';

function LegalDocument({ title, sections }: { title: string; sections: LegalSection[] }) {
  return (
    <View style={styles.document}>
      <Text style={styles.documentTitle}>{title}</Text>
      {sections.map((section) => (
        <View key={section.title} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          {section.paragraphs.map((paragraph, index) => (
            <Text key={`${section.title}-${index}`} style={styles.paragraph}>
              {paragraph}
            </Text>
          ))}
        </View>
      ))}
    </View>
  );
}

export function DocumentacaoLegal({ navigation }: any) {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />

      {/* Top Bar (Header) */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation?.goBack()}
        >
          <Text style={styles.backButtonText}>&lt;</Text>
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>DOCUMENTAÇÃO LEGAL</Text>
        
        {/* View vazia para manter o título perfeitamente centralizado */}
        <View style={styles.headerSpacer} />
      </View>

      {/* Conteúdo do Documento */}
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <Text style={styles.updatedAt}>Última atualização: {LEGAL_UPDATED_AT}</Text>
        <LegalDocument title="TERMOS DE USO" sections={TERMS_SECTIONS} />
        <View style={styles.divider} />
        <LegalDocument title="POLÍTICA DE PRIVACIDADE" sections={PRIVACY_SECTIONS} />

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2C',
  },
  backButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  backButtonText: {
    color: '#E53935',
    fontSize: 28,
    fontWeight: 'bold',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  headerSpacer: {
    width: 48,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  updatedAt: {
    color: '#777777',
    fontSize: 12,
    marginBottom: 24,
  },
  document: {
    width: '100%',
  },
  documentTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  section: {
    marginTop: 18,
  },
  sectionTitle: {
    color: '#E53935',
    fontSize: 18,
    fontWeight: 'bold',
  },
  paragraph: {
    color: '#AAAAAA',
    fontSize: 14,
    lineHeight: 22,
    marginTop: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#2C2C2C',
    marginVertical: 24,
  },
});
