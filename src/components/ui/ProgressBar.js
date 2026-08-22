import React from 'react';
import { View, StyleSheet } from 'react-native';
import colors from '../../constants/colors';

export default function ProgressBar({ value, color = colors.primary, height = 8 }) {
  return (
    <View style={[styles.track, { height }]}>
      <View style={[styles.fill, { width: `${Math.min(Math.max(value, 0), 1) * 100}%`, backgroundColor: color, height }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { width: '100%', borderRadius: 20, overflow: 'hidden', backgroundColor: 'rgba(23,34,29,0.08)' },
  fill: { borderRadius: 20 },
});
