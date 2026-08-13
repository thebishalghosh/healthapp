import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function GradientBackground({ children, style }) {
  return (
    <LinearGradient colors={["#1677FF", "#36D9E8"]} style={[styles.bg, style]} start={[0, 0]} end={[1, 1]}>
      <View style={styles.inner}>{children}</View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  inner: { flex: 1, padding: 24 },
});
