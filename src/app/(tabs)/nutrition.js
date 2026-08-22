import React from 'react';
import { View, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppText from '../../components/ui/AppText';
import GlassCard from '../../components/ui/GlassCard';
import colors from '../../constants/colors';
import ProgressBar from '../../components/ui/ProgressBar';
import SectionHeader from '../../components/ui/SectionHeader';

export default function Nutrition() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: 24 }}>
        <AppText style={styles.eyebrow}>DAILY NOURISHMENT</AppText><AppText weight="bold" size={30}>Today's nutrition</AppText>
        <AppText style={styles.subtitle}>Small choices, meaningful progress.</AppText>
        <GlassCard style={styles.hero}>
          <View style={styles.heroTop}><View><AppText style={styles.cardEyebrow}>CALORIES</AppText><AppText weight="bold" size={34}>1,420</AppText><AppText style={styles.muted}>of 2,200 kcal</AppText></View><View style={styles.ring}><AppText weight="bold" size={20} style={styles.ringText}>65%</AppText><AppText style={styles.ringLabel}>today</AppText></View></View>
          <ProgressBar value={0.65} color={colors.primary} />
        </GlassCard>
        <View style={styles.section}><SectionHeader title="Your balance" action="Details" /><View style={styles.stats}>{[{ label: 'Protein', value: '78g', goal: '120g', progress: 0.65, color: colors.primary, icon: 'fitness-outline' }, { label: 'Carbs', value: '164g', goal: '240g', progress: 0.68, color: colors.warning, icon: 'leaf-outline' }, { label: 'Fats', value: '42g', goal: '70g', progress: 0.6, color: colors.lavender, icon: 'water-outline' }].map((stat) => <View style={styles.stat} key={stat.label}><View style={[styles.statIcon, { backgroundColor: stat.color }]}><Ionicons name={stat.icon} size={16} color={colors.text} /></View><AppText weight="semibold" style={styles.statLabel}>{stat.label}</AppText><AppText weight="bold" size={18}>{stat.value}</AppText><AppText style={styles.muted}>of {stat.goal}</AppText><ProgressBar value={stat.progress} color={colors.primary} height={5} /></View>)}</View></View>
        <View style={styles.meals}><SectionHeader title="Today's meals" action="See all" />{['Breakfast', 'Lunch', 'Dinner', 'Snacks'].map((meal, index) => <View style={styles.meal} key={meal}><View style={[styles.mealIcon, { backgroundColor: [colors.amber, colors.mint, colors.blue, colors.lavender][index] }]}><Ionicons name={['sunny-outline', 'restaurant-outline', 'moon-outline', 'cafe-outline'][index]} size={18} color={colors.text} /></View><View style={styles.mealCopy}><AppText weight="semibold">{meal}</AppText><AppText style={styles.muted}>{index === 0 ? '420 kcal  ·  Completed' : index === 1 ? '680 kcal  ·  Planned' : '520 kcal  ·  Planned'}</AppText></View><Ionicons name="chevron-forward" size={17} color={colors.tertiaryText} /></View>)}</View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: colors.background }, eyebrow: { color: colors.primary, fontSize: 10, letterSpacing: 1.4, marginBottom: 7 }, subtitle: { color: colors.secondaryText, marginTop: 6 }, hero: { marginTop: 22, backgroundColor: colors.glassMedium }, heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }, cardEyebrow: { color: colors.secondaryText, fontSize: 10, letterSpacing: 1.2, marginBottom: 7 }, muted: { color: colors.secondaryText, fontSize: 12, marginTop: 3 }, ring: { width: 90, height: 90, borderRadius: 45, borderWidth: 8, borderColor: colors.mint, alignItems: 'center', justifyContent: 'center' }, ringText: { color: colors.primary }, ringLabel: { color: colors.secondaryText, fontSize: 10 }, section: { marginTop: 28 }, stats: { flexDirection: 'row', gap: 10, marginTop: 14 }, stat: { flex: 1, padding: 13, borderRadius: 20, backgroundColor: colors.glassLight, borderWidth: 1, borderColor: colors.border }, statIcon: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 10 }, statLabel: { fontSize: 12, marginBottom: 7 }, meals: { marginTop: 28, marginBottom: 28 }, meal: { flexDirection: 'row', alignItems: 'center', paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: 'rgba(23,34,29,0.06)' }, mealIcon: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginRight: 12 }, mealCopy: { flex: 1 } });
