import React from 'react';
import { View, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import AppText from '../../components/ui/AppText';
import GlassCard from '../../components/ui/GlassCard';
import colors from '../../constants/colors';

export default function Nutrition() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: 24 }}>
        <AppText weight="semibold" size={24}>Nutrition</AppText>
        <GlassCard style={{ marginTop: 16 }}>
          <AppText weight="semibold" size={28}>82 / 100</AppText>
          <AppText style={{ color: colors.secondaryText, marginTop: 6 }}>Your nutrition today</AppText>
        </GlassCard>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: colors.background } });
