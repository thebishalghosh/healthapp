import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import AppText from '../../components/ui/AppText';
import colors from '../../constants/colors';
import GlassCard from '../../components/ui/GlassCard';

export default function Profile() {
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 128 }]}>
        <View style={styles.profileHead}><View style={styles.avatar}><Ionicons name="person-outline" size={30} color={colors.primary} /></View><View><AppText weight="bold" size={24}>Bishal</AppText><AppText style={styles.muted}>Health Profile</AppText></View><View style={styles.edit}><Ionicons name="options-outline" size={19} color={colors.primary} /></View></View>
        <GlassCard style={styles.score}><View style={styles.scoreRow}><View><AppText style={styles.eyebrow}>CURRENT HEALTH SCORE</AppText><AppText weight="bold" size={34}>83</AppText><AppText style={styles.muted}>You're building great momentum.</AppText></View><View style={styles.scoreRing}><Ionicons name="arrow-up" size={16} color={colors.success} /><AppText weight="semibold" style={styles.scorePercent}>6%</AppText></View></View></GlassCard>
        <AppText weight="semibold" size={18} style={styles.sectionTitle}>Your profile</AppText>
        {[{ title: 'Body metrics', detail: '29 years  ·  180 cm  ·  75 kg', icon: 'body-outline', color: colors.blue }, { title: 'Goals', detail: 'Build muscle', icon: 'flag-outline', color: colors.mint }, { title: 'Preferences', detail: 'Personalize your experience', icon: 'options-outline', color: colors.lavender }, { title: 'Achievements', detail: '3 milestones unlocked', icon: 'ribbon-outline', color: colors.amber }].map((item) => <View style={styles.item} key={item.title}><View style={[styles.itemIcon, { backgroundColor: item.color }]}><Ionicons name={item.icon} size={19} color={colors.text} /></View><View style={{ flex: 1 }}><AppText weight="semibold">{item.title}</AppText><AppText style={styles.muted}>{item.detail}</AppText></View><Ionicons name="chevron-forward" size={17} color={colors.tertiaryText} /></View>)}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 24 },
  profileHead: { flexDirection: 'row', alignItems: 'center', marginTop: 16 },
  avatar: { width: 72, height: 72, borderRadius: 24, backgroundColor: colors.mint, alignItems: 'center', justifyContent: 'center', marginRight: 15 },
  muted: { color: colors.secondaryText, fontSize: 12, marginTop: 3 },
  edit: { width: 38, height: 38, borderRadius: 14, backgroundColor: colors.glassLight, alignItems: 'center', justifyContent: 'center', marginLeft: 'auto' },
  score: { marginTop: 24, backgroundColor: colors.glassMedium },
  scoreRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  eyebrow: { color: colors.primary, fontSize: 10, letterSpacing: 1.2, marginBottom: 7 },
  scoreRing: { width: 72, height: 72, borderRadius: 36, borderWidth: 7, borderColor: colors.mint, alignItems: 'center', justifyContent: 'center' },
  scorePercent: { color: colors.success, fontSize: 13 },
  sectionTitle: { marginTop: 30, marginBottom: 12 },
  item: { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 21, backgroundColor: colors.glassLight, borderWidth: 1, borderColor: colors.border, marginBottom: 10 },
  itemIcon: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
});
