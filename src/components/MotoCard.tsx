import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Moto } from '../types';

interface MotoCardProps {
  moto: Moto;
  onPress?: () => void; // Adicionado para permitir o clique
}

export function MotoCard({ moto, onPress }: MotoCardProps) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.imageContainer}>
        {moto.fotoUri ? (
          <Image 
            source={{ uri: moto.fotoUri }} 
            style={styles.imagemReal}
            resizeMode="cover"
          />
        ) : (
          <Image 
            source={require('../../assets/MotoCadMoto.webp')} 
            style={styles.iconePadrao}
            resizeMode="contain"
          />
        )}
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.marca}>{moto.marca}</Text>
        <Text style={styles.modelo}>{moto.modelo}</Text>
        {moto.apelido ? <Text style={styles.apelido}>"{moto.apelido}"</Text> : null}
      </View>

      <View style={styles.kmContainer}>
        <Text style={styles.kmText}>{moto.hodometro || moto.kmAtual} km</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  imageContainer: {
    width: 80,
    height: 80,
    backgroundColor: '#2C2C2C',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  imagemReal: {
    width: '100%',
    height: '100%',
  },
  iconePadrao: {
    width: 50,
    height: 50,
    opacity: 0.8,
  },
  infoContainer: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'center',
  },
  marca: {
    color: '#E53935',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  modelo: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 2,
  },
  apelido: {
    color: '#AAAAAA',
    fontSize: 14,
    fontStyle: 'italic',
    marginTop: 2,
  },
  kmContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#333333',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    position: 'absolute',
    bottom: 16,
    right: 16,
  },
  kmText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
});