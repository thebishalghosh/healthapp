import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import AppText from '../../components/ui/AppText';
import colors from '../../constants/colors';
import GlassCard from '../../components/ui/GlassCard';

export default function AI() {
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 128 }]}>
        <AppText style={styles.eyebrow}>INTELLIGENT WELLNESS</AppText><AppText weight="bold" size={30}>HealthAI</AppText><AppText style={styles.subtitle}>Your personal health companion.</AppText>
        <GlassCard style={styles.hero}><View style={styles.heroIcon}><Ionicons name="sparkles" size={26} color={colors.primary} /></View><AppText weight="bold" size={24} style={styles.heroTitle}>Ask HealthAI</AppText><AppText style={styles.heroText}>Personalized guidance for the moments that matter.</AppText><View style={styles.topicRow}>{['Nutrition', 'Fitness', 'Sleep', 'Habits'].map((topic, index) => <View style={styles.topic} key={topic}><Ionicons name={['nutrition-outline', 'fitness-outline', 'moon-outline', 'leaf-outline'][index]} size={16} color={colors.primary} /><AppText style={styles.topicText}>{topic}</AppText></View>)}</View></GlassCard>
        <AppText weight="semibold" size={18} style={styles.sectionTitle}>Start with a question</AppText>
        {['How much protein should I eat?', 'What should I eat after my workout?', 'Help me improve my sleep'].map((question) => <View style={styles.question} key={question}><AppText style={styles.questionText}>{question}</AppText><Ionicons name="arrow-up" size={17} color={colors.primary} /></View>)}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: colors.background }, content: { padding: 24 }, eyebrow: { color: colors.primary, fontSize: 10, letterSpacing: 1.4, marginBottom: 7 }, subtitle: { color: colors.secondaryText, marginTop: 6 }, hero: { marginTop: 26, backgroundColor: colors.mint, minHeight: 260 }, heroIcon: { width: 54, height: 54, borderRadius: 19, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', marginBottom: 22 }, heroTitle: { color: colors.primaryDark }, heroText: { color: colors.secondaryText, marginTop: 8, maxWidth: 250, lineHeight: 22 }, topicRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 24 }, topic: { flexDirection: 'row', alignItems: 'center', paddingVertical: 9, paddingHorizontal: 11, borderRadius: 13, backgroundColor: 'rgba(255,255,255,0.62)' }, topicText: { fontSize: 12, color: colors.primaryDark, marginLeft: 6 }, sectionTitle: { marginTop: 30, marginBottom: 12 }, question: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 17, borderRadius: 19, backgroundColor: colors.glassLight, borderWidth: 1, borderColor: colors.border, marginBottom: 10 }, questionText: { color: colors.text, flex: 1, fontSize: 14 } });
