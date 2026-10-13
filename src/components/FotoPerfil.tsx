import React, { useState } from 'react';
import { Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
export function FotoPerfil({ uri, size = 64 }: { uri?: string; size?: number }) {
  const [failedUri, setFailedUri] = useState<string>();
  return uri && uri !== failedUri ? <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size / 2 }} onError={() => setFailedUri(uri)} accessibilityLabel="Foto do perfil" /> : <MaterialCommunityIcons name="account-circle-outline" size={size} color="#E53935" />;
}
