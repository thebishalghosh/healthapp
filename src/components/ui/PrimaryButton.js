import React from 'react';
import { TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import colors from '../../constants/colors';
import spacing from '../../constants/spacing';
import AppText from './AppText';

export default function PrimaryButton({ title, onPress, style, loading, disabled }) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      disabled={disabled || loading}
      style={[styles.button, disabled && styles.disabled, style]}
    >
      <LinearGradient colors={[colors.primary, colors.primaryDark]} style={styles.fill}>
        {loading ? <ActivityIndicator color="#fff" /> : <AppText weight="semibold" style={styles.text}>{title}</AppText>}
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 18,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fill: { width: '100%', minHeight: 56, paddingVertical: spacing.sm, paddingHorizontal: spacing.lg, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  text: { color: '#fff', fontSize: 16 },
  disabled: { opacity: 0.6 },
});
