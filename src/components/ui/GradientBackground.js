import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import colors from '../../constants/colors';

export default function GradientBackground({ children, style, innerStyle }) {
  return (
    <LinearGradient colors={[colors.background, '#EFF5EF', '#F7F5FA']} style={[styles.bg, style]} start={[0, 0]} end={[1, 1]}>
      <View style={styles.orbGreen} />
      <View style={styles.orbBlue} />
      <View style={styles.orbLavender} />
      <View style={[styles.inner, innerStyle]}>{children}</View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, overflow: 'hidden' },
  inner: { flex: 1, padding: 24 },
  orbGreen: { position: 'absolute', width: 300, height: 300, borderRadius: 150, backgroundColor: 'rgba(179,225,202,0.26)', top: -120, right: -100 },
  orbBlue: { position: 'absolute', width: 240, height: 240, borderRadius: 120, backgroundColor: 'rgba(169,216,228,0.18)', bottom: 80, left: -150 },
  orbLavender: { position: 'absolute', width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(216,212,238,0.16)', bottom: -100, right: -60 },
});
