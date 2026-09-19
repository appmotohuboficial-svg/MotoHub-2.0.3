import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, TouchableWithoutFeedback } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface BottomSheetMenuProps {
  visible: boolean;
  onClose: () => void;
  onSelectNovaManutencao: () => void;
  onSelectNovoEvento: () => void;
  onSelectNovaViagem: () => void;
}

export function BottomSheetMenu({
  visible,
  onClose,
  onSelectNovaManutencao,
  onSelectNovoEvento,
  onSelectNovaViagem,
}: BottomSheetMenuProps) {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      {/* Fundo escuro translúcido que fecha o modal ao ser clicado */}
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          
          {/* Container do Bottom Sheet */}
          <TouchableWithoutFeedback>
            <View style={styles.sheetContainer}>
              
              {/* Barra superior indicadora (puxador) */}
              <View style={styles.handleBar} />

              <Text style={styles.sectionTitle}>AÇÃO RÁPIDA</Text>

              {/* Opção 1: Nova Manutenção */}
              <TouchableOpacity 
                style={styles.menuItem} 
                onPress={() => { onClose(); onSelectNovaManutencao(); }}
                activeOpacity={0.7}
              >
                <View style={styles.iconBox}>
                  <MaterialCommunityIcons name="wrench" size={24} color="#E53935" />
                </View>
                <Text style={styles.menuText}>Nova Manutenção</Text>
                <MaterialCommunityIcons name="chevron-right" size={20} color="#33FFFFFF" />
              </TouchableOpacity>

              <View style={styles.divider} />

              {/* Opção 2: Eventos */}
              <TouchableOpacity 
                style={styles.menuItem} 
                onPress={() => { onClose(); onSelectNovoEvento(); }}
                activeOpacity={0.7}
              >
                <View style={styles.iconBox}>
                  <MaterialCommunityIcons name="calendar" size={24} color="#E53935" />
                </View>
                <Text style={styles.menuText}>Eventos</Text>
                <MaterialCommunityIcons name="chevron-right" size={20} color="#33FFFFFF" />
              </TouchableOpacity>

              <View style={styles.divider} />

              {/* Opção 3: Viagens */}
              <TouchableOpacity 
                style={styles.menuItem} 
                onPress={() => { onClose(); onSelectNovaViagem(); }}
                activeOpacity={0.7}
              >
                <View style={styles.iconBox}>
                  <MaterialCommunityIcons name="map-marker-path" size={24} color="#E53935" />
                </View>
                <Text style={styles.menuText}>Viagens</Text>
                <MaterialCommunityIcons name="chevron-right" size={20} color="#33FFFFFF" />
              </TouchableOpacity>

            </View>
          </TouchableWithoutFeedback>

        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#1C1C1E', // bg_bottom_sheet simulado
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    marginBottom: 130,
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#888888',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1.2,
    marginBottom: 16,
  },
  menuItem: {
    height: 72,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#1A1A1A', // bg_input_field simulado
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuText: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 24,
  },
  divider: {
    height: 1,
    backgroundColor: '#2C2C2C', // divider_color
  },
});