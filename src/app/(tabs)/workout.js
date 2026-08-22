import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, View, Image, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppText from '../../components/ui/AppText';
import colors from '../../constants/colors';
import ProgressBar from '../../components/ui/ProgressBar';
import SectionHeader from '../../components/ui/SectionHeader';

export default function Workout() {
  const { width } = useWindowDimensions();
  const heroHeight = Math.min(360, Math.max(280, width * 0.9));

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: 24 }}>
        <AppText style={styles.eyebrow}>YOUR MOVEMENT</AppText><AppText weight="bold" size={30}>Today's workout</AppText><AppText style={styles.subtitle}>Meet yourself where you are.</AppText>
        <View style={[styles.hero, { height: heroHeight }]}><Image source={require('../../../assets/images/exercise-1.jpg')} style={styles.image} resizeMode="cover" /><View style={styles.overlay} /><View style={styles.heroCopy}><AppText weight="semibold" style={styles.lightEyebrow}>TODAY'S WORKOUT</AppText><AppText weight="bold" size={24} style={styles.lightTitle}>Strength &{`\n`}Conditioning</AppText><AppText style={styles.lightMeta}>35 min  ·  6 exercises</AppText></View><View style={styles.start}><Ionicons name="arrow-forward" size={18} color={colors.primaryDark} /></View></View>
        <View style={styles.section}><SectionHeader title="Weekly progress" action="This week" /><View style={styles.progressCard}><View style={styles.progressTop}><View><AppText weight="bold" size={26}>4 / 5</AppText><AppText style={styles.muted}>sessions completed</AppText></View><View style={styles.week}><View style={[styles.day, styles.dayDone]} /><View style={[styles.day, styles.dayDone]} /><View style={[styles.day, styles.dayDone]} /><View style={[styles.day, styles.dayDone]} /><View style={styles.day} /></View></View><ProgressBar value={0.8} color={colors.primary} /></View></View>
        <View style={styles.section}><SectionHeader title="Recommended for you" /><View style={styles.recommend}><View style={styles.recommendIcon}><Ionicons name="body-outline" size={20} color={colors.primary} /></View><View style={{ flex: 1 }}><AppText weight="semibold">Morning mobility</AppText><AppText style={styles.muted}>12 min  ·  Gentle flow</AppText></View><Ionicons name="chevron-forward" size={17} color={colors.tertiaryText} /></View></View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: colors.background }, eyebrow: { color: colors.primary, fontSize: 10, letterSpacing: 1.4, marginBottom: 7 }, subtitle: { color: colors.secondaryText, marginTop: 6 }, hero: { borderRadius: 28, overflow: 'hidden', marginTop: 22 }, image: { ...StyleSheet.absoluteFillObject, width: undefined, height: undefined }, overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(13,38,29,0.4)' }, heroCopy: { position: 'absolute', left: 20, bottom: 22 }, lightEyebrow: { color: colors.mint, fontSize: 10, letterSpacing: 1.3 }, lightTitle: { color: '#fff', lineHeight: 29, marginTop: 7 }, lightMeta: { color: 'rgba(255,255,255,0.82)', fontSize: 12, marginTop: 9 }, start: { position: 'absolute', right: 18, bottom: 18, width: 44, height: 44, borderRadius: 16, backgroundColor: colors.mint, alignItems: 'center', justifyContent: 'center' }, section: { marginTop: 28 }, progressCard: { padding: 18, borderRadius: 24, backgroundColor: colors.glassLight, borderWidth: 1, borderColor: colors.border, marginTop: 14 }, progressTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }, muted: { color: colors.secondaryText, fontSize: 12, marginTop: 3 }, week: { flexDirection: 'row', gap: 7 }, day: { width: 11, height: 30, borderRadius: 8, backgroundColor: 'rgba(23,34,29,0.1)' }, dayDone: { backgroundColor: colors.primary }, recommend: { flexDirection: 'row', alignItems: 'center', padding: 15, marginTop: 14, borderRadius: 22, backgroundColor: colors.glassLight, borderWidth: 1, borderColor: colors.border, marginBottom: 28 }, recommendIcon: { width: 38, height: 38, borderRadius: 13, backgroundColor: colors.mint, alignItems: 'center', justifyContent: 'center', marginRight: 12 } });
