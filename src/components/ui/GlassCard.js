import React from 'react';
import { View, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import colors from '../../constants/colors';
import shadows from '../../constants/shadows';

export default function GlassCard({ children, style }) {
  return (
    <BlurView intensity={40} tint="light" style={[styles.container, shadows.card, style]}>
      <View style={styles.inner}>{children}</View>
    </BlurView>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  inner: {
    padding: 16,
  },
});
