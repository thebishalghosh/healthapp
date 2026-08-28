import React, { useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AppText from '../../components/ui/AppText';
import GlassCard from '../../components/ui/GlassCard';
import colors from '../../constants/colors';
import ProgressBar from '../../components/ui/ProgressBar';
import SectionHeader from '../../components/ui/SectionHeader';
import PrimaryButton from '../../components/ui/PrimaryButton';
import { useAuth } from '../../context/AuthContext';

function target(value, unit) {
  return value === null || value === undefined ? 'Not available' : `${Math.round(value)}${unit}`;
}

function NutritionSkeleton() {
  return <GlassCard style={styles.hero}><View style={styles.skeletonLarge} /><View style={styles.skeletonSmall} /><View style={styles.skeletonBar} /></GlassCard>;
}

export default function Nutrition() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profile, profileLoading, nutrition, nutritionLoading, nutritionError, refreshNutrition, calculateNutrition } = useAuth();

  useEffect(() => {
    if (profile) refreshNutrition().catch(() => {});
  }, [refreshNutrition, profile]);

  const refresh = () => refreshNutrition().catch(() => {});
  const calculate = () => calculateNutrition().catch(() => {});
  const profileIncomplete = !profile || profile.completion < 100;
  const isNotCalculated = nutritionError?.status === 404 || nutritionError?.code === 'NUTRITION_NOT_CALCULATED';
  const isStale = nutritionError?.status === 409 || nutritionError?.code === 'NUTRITION_STALE';
  const isValidationError = nutritionError?.status === 422 || nutritionError?.code === 'VALIDATION_ERROR';
  const isAuthError = nutritionError?.status === 401 || nutritionError?.code === 'UNAUTHENTICATED';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={nutritionLoading} onRefresh={refresh} tintColor={colors.primary} />}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 128 }]}
      >
        <AppText style={styles.eyebrow}>DAILY NOURISHMENT</AppText><AppText weight="bold" size={30}>Today's nutrition</AppText>
        <AppText style={styles.subtitle}>Small choices, meaningful progress.</AppText>
        {(profileLoading || nutritionLoading) && !nutrition ? <NutritionSkeleton /> : null}
        {(profileIncomplete || nutritionError) && !profileLoading && !nutritionLoading ? <GlassCard style={styles.message}><AppText weight="semibold">{isNotCalculated ? "Your nutrition targets haven't been calculated yet." : isStale ? 'Your health profile has changed.' : isValidationError || profileIncomplete ? 'Complete your health profile before calculating nutrition targets.' : isAuthError ? 'Your session has expired.' : 'Nutrition targets are unavailable'}</AppText><AppText style={styles.muted}>{isStale ? 'Recalculate your nutrition targets to keep them up to date.' : isNotCalculated ? 'Use your saved profile to create your daily targets.' : isAuthError ? 'Please sign in again to continue.' : profileIncomplete ? 'Add the missing health details to calculate your targets.' : 'We could not retrieve your latest calculation.'}</AppText>{profileIncomplete || isValidationError ? <PrimaryButton title="Complete Profile" onPress={() => router.push('/(setup)/profile-setup')} style={styles.messageButton} /> : isNotCalculated ? <PrimaryButton title="Calculate My Targets" onPress={calculate} style={styles.messageButton} loading={nutritionLoading} /> : isStale ? <PrimaryButton title="Recalculate Targets" onPress={calculate} style={styles.messageButton} loading={nutritionLoading} /> : <PrimaryButton title="Retry" onPress={refresh} style={styles.messageButton} />}</GlassCard> : null}
        {nutrition && !profileIncomplete && !nutritionLoading && !profileLoading ? <><GlassCard style={styles.hero}><View style={styles.heroTop}><View><AppText style={styles.cardEyebrow}>CALORIES TARGET</AppText><AppText weight="bold" size={34}>0 / {target(nutrition.caloriesTarget, ' kcal')}</AppText><AppText style={styles.muted}>No food consumption tracked</AppText></View><View style={styles.ring}><AppText weight="bold" size={20} style={styles.ringText}>0%</AppText><AppText style={styles.ringLabel}>consumed</AppText></View></View><ProgressBar value={0} color={colors.primary} /></GlassCard><View style={styles.section}><SectionHeader title="Your targets" action="Details" /><View style={styles.stats}>{[{ label: 'Protein', value: nutrition.protein, unit: 'g', color: colors.primary, icon: 'fitness-outline' }, { label: 'Carbs', value: nutrition.carbohydrates, unit: 'g', color: colors.warning, icon: 'leaf-outline' }, { label: 'Fats', value: nutrition.fat, unit: 'g', color: colors.lavender, icon: 'water-outline' }, { label: 'Fiber', value: nutrition.fiber, unit: 'g', color: colors.amber, icon: 'nutrition-outline' }, { label: 'Water', value: nutrition.water === null ? null : nutrition.water / 1000, unit: ' L', color: colors.blue, icon: 'water-outline' }].map((stat) => <View style={styles.stat} key={stat.label}><View style={[styles.statIcon, { backgroundColor: stat.color }]}><Ionicons name={stat.icon} size={16} color={colors.text} /></View><AppText weight="semibold" style={styles.statLabel}>{stat.label} target</AppText><AppText weight="bold" size={18}>{target(stat.value, stat.unit)}</AppText><AppText style={styles.muted}>0 consumed</AppText><ProgressBar value={0} color={colors.primary} height={5} /></View>)}</View></View></> : null}
        <View style={styles.meals}><SectionHeader title="Today's meals" action="See all" />{['Breakfast', 'Lunch', 'Dinner', 'Snacks'].map((meal, index) => <View style={styles.meal} key={meal}><View style={[styles.mealIcon, { backgroundColor: [colors.amber, colors.mint, colors.blue, colors.lavender][index] }]}><Ionicons name={['sunny-outline', 'restaurant-outline', 'moon-outline', 'cafe-outline'][index]} size={18} color={colors.text} /></View><View style={styles.mealCopy}><AppText weight="semibold">{meal}</AppText><AppText style={styles.muted}>No meals tracked</AppText></View><Ionicons name="chevron-forward" size={17} color={colors.tertiaryText} /></View>)}</View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: colors.background }, content: { padding: 24 }, eyebrow: { color: colors.primary, fontSize: 10, letterSpacing: 1.4, marginBottom: 7 }, subtitle: { color: colors.secondaryText, marginTop: 6 }, hero: { marginTop: 22, backgroundColor: colors.glassMedium }, heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }, cardEyebrow: { color: colors.secondaryText, fontSize: 10, letterSpacing: 1.2, marginBottom: 7 }, muted: { color: colors.secondaryText, fontSize: 12, marginTop: 3 }, ring: { width: 90, height: 90, borderRadius: 45, borderWidth: 8, borderColor: colors.mint, alignItems: 'center', justifyContent: 'center' }, ringText: { color: colors.primary }, ringLabel: { color: colors.secondaryText, fontSize: 10 }, section: { marginTop: 28 }, stats: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 14 }, stat: { width: '47%', padding: 13, borderRadius: 20, backgroundColor: colors.glassLight, borderWidth: 1, borderColor: colors.border }, statIcon: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 10 }, statLabel: { fontSize: 12, marginBottom: 7 }, message: { marginTop: 22, backgroundColor: colors.glassMedium }, messageButton: { marginTop: 16 }, skeletonLarge: { width: '40%', height: 28, borderRadius: 8, backgroundColor: colors.border }, skeletonSmall: { width: '65%', height: 12, borderRadius: 6, backgroundColor: colors.border, marginTop: 10 }, skeletonBar: { width: '100%', height: 8, borderRadius: 4, backgroundColor: colors.border, marginTop: 20 }, meals: { marginTop: 28, marginBottom: 28 }, meal: { flexDirection: 'row', alignItems: 'center', paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: 'rgba(23,34,29,0.06)' }, mealIcon: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginRight: 12 }, mealCopy: { flex: 1 } });
