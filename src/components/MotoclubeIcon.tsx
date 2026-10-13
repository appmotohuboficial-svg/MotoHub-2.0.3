import React from 'react';
import { View, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export function MotoclubeIcon({ color }: { color: string }) {
  return (
    <View style={styles.container} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View style={[styles.topBand, { borderColor: color }]} />
      <MaterialCommunityIcons name="shield-outline" size={18} color={color} />
      <View style={[styles.bottomBand, { borderColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
  topBand: { position: 'absolute', top: 0, width: 24, height: 4, borderWidth: 1.5, borderTopLeftRadius: 6, borderTopRightRadius: 6 },
  bottomBand: { position: 'absolute', bottom: 0, width: 22, height: 4, borderWidth: 1.5, borderBottomLeftRadius: 6, borderBottomRightRadius: 6 },
});