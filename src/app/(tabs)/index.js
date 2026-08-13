import React from 'react';
import { View, StyleSheet, SafeAreaView, ScrollView, Image } from 'react-native';
import AppText from '../../components/ui/AppText';
import GlassCard from '../../components/ui/GlassCard';
import PrimaryButton from '../../components/ui/PrimaryButton';
import colors from '../../constants/colors';
import { user, todaysPlan } from '../../data/mockData';

export default function Home() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: 24 }}>
        <View style={styles.header}>
          <AppText weight="semibold" size={20}>Good morning, {user.name}</AppText>
          <Image source={require('../../../assets/icon.png')} style={styles.avatar} />
        </View>

        <GlassCard style={{ marginTop: 16 }}>
          <AppText weight="semibold" size={26}>Today's Health Score</AppText>
          <AppText weight="bold" size={34} style={{ marginTop: 8 }}>{user.healthScore}</AppText>
        </GlassCard>

        <View style={{ marginTop: 18 }}>
          <AppText weight="semibold">Today's Plan</AppText>
          {todaysPlan.map((p) => (
            <View key={p.id} style={styles.planRow}>
              <AppText>{p.title}</AppText>
              <AppText style={{ color: p.done ? colors.success : colors.secondaryText }}>{p.time}</AppText>
            </View>
          ))}
        </View>

        <View style={{ marginTop: 20 }}>
          <GlassCard>
            <AppText weight="semibold">AI Recommendation</AppText>
            <AppText style={{ marginTop: 8, color: colors.secondaryText }}>You're slightly below your protein target today. Consider adding a high-protein snack after your workout.</AppText>
            <PrimaryButton title="View Recommendation" style={{ marginTop: 12 }} />
          </GlassCard>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  avatar: { width: 46, height: 46, borderRadius: 12, backgroundColor: colors.surface },
  planRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12 },
});
