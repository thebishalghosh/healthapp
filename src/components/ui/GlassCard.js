import React from 'react';
import { View, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import colors from '../../constants/colors';
import shadows from '../../constants/shadows';

export default function GlassCard({ children, style }) {
  return (
    <BlurView intensity={28} tint="light" experimentalBlurMethod="dimezisBlurView" style={[styles.container, shadows.card, style]}>
      <View style={styles.inner}>{children}</View>
    </BlurView>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 26,
    overflow: 'hidden',
    backgroundColor: colors.glassLight,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inner: {
    padding: 20,
  },
});
