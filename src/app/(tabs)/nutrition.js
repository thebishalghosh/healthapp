import React, { useCallback, useState } from 'react';
import { ActivityIndicator, View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import AppText from '../../components/ui/AppText';
import GlassCard from '../../components/ui/GlassCard';
import colors from '../../constants/colors';
import ProgressBar from '../../components/ui/ProgressBar';
import SectionHeader from '../../components/ui/SectionHeader';
import PrimaryButton from '../../components/ui/PrimaryButton';
import { api } from '../../services/api';
import tokenStorage from '../../services/tokenStorage';
import { useAuth } from '../../context/AuthContext';

function target(value, unit) {
  return value === null || value === undefined ? 'Not available' : `${Math.round(value)}${unit}`;
}

function NutritionSkeleton() {
  return <GlassCard style={styles.hero}><View style={styles.skeletonLarge} /><View style={styles.skeletonSmall} /><View style={styles.skeletonBar} /></GlassCard>;
}

function getTodayDate() {
  const date = new Date();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function normalizeMeal(entry) {
  return {
    id: entry.id,
    mealType: entry.meal_type || entry.mealType || 'meal',
    foodName: entry.food_name || entry.foodName || 'Meal',
    calories: entry.calories === null || entry.calories === undefined ? null : Number(entry.calories),
    protein: entry.protein_g === null || entry.protein_g === undefined ? null : Number(entry.protein_g),
    carbohydrates: entry.carbohydrates_g === null || entry.carbohydrates_g === undefined ? null : Number(entry.carbohydrates_g),
    fat: entry.fat_g === null || entry.fat_g === undefined ? null : Number(entry.fat_g),
    fiber: entry.fiber_g === null || entry.fiber_g === undefined ? null : Number(entry.fiber_g),
    loggedAt: entry.consumed_at || entry.created_at || null,
  };
}

function sumMealValue(mealEntries, field) {
  const values = mealEntries.map((meal) => meal[field]).filter((value) => value !== null && Number.isFinite(value));
  return values.length ? values.reduce((total, value) => total + value, 0) : null;
}

function formatMealTime(value) {
  if (!value) return 'Logged today';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

export default function Nutrition() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profile, profileLoading, nutrition, nutritionLoading, nutritionError, refreshNutrition, calculateNutrition, today, todayLoading, todayError, refreshToday } = useAuth();
  const [meals, setMeals] = useState([]);
  const [mealsLoading, setMealsLoading] = useState(false);
  const [mealsError, setMealsError] = useState('');

  const loadMeals = useCallback(async () => {
    const token = await tokenStorage.get();
    if (!token) return;
    setMealsLoading(true);
    setMealsError('');
    try {
      const response = await api.getFoodHistory(token, getTodayDate());
      const entries = response?.food?.meals || [];
      setMeals(Array.isArray(entries) ? entries.map(normalizeMeal) : []);
    } catch (error) {
      setMeals([]);
      setMealsError(error.message || 'Unable to load today\'s meals. Please try again.');
    } finally {
      setMealsLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    if (profile) refreshNutrition().catch(() => {});
    refreshToday().catch(() => {});
    loadMeals();
  }, [loadMeals, profile, refreshNutrition, refreshToday]));

  const calculate = () => calculateNutrition().catch(() => {});
  const refresh = () => Promise.all([refreshNutrition(), refreshToday(), loadMeals()]).catch(() => {});
  const profileIncomplete = !profile || profile.completion < 100;
  const isNotCalculated = nutritionError?.status === 404 || nutritionError?.code === 'NUTRITION_NOT_CALCULATED';
  const isStale = nutritionError?.status === 409 || nutritionError?.code === 'NUTRITION_STALE' || todayError?.status === 409 || todayError?.code === 'NUTRITION_STALE';
  const isValidationError = nutritionError?.status === 422 || nutritionError?.code === 'VALIDATION_ERROR';
  const isAuthError = nutritionError?.status === 401 || nutritionError?.code === 'UNAUTHENTICATED';
  const activeError = nutritionError || todayError;
  const calorieTarget = nutrition?.caloriesTarget;
  const calorieConsumed = sumMealValue(meals, 'calories');
  const proteinConsumed = sumMealValue(meals, 'protein');
  const carbohydratesConsumed = sumMealValue(meals, 'carbohydrates');
  const fatConsumed = sumMealValue(meals, 'fat');
  const fiberConsumed = sumMealValue(meals, 'fiber');
  const waterTarget = nutrition?.water;
  const waterConsumed = today?.water?.consumedMl;
  const calorieProgress = calorieTarget > 0 && calorieConsumed !== null && calorieConsumed !== undefined ? Math.min(1, calorieConsumed / calorieTarget) : 0;
  const waterPercentage = today?.water?.percentage === null || today?.water?.percentage === undefined ? null : Math.min(100, Math.max(0, today.water.percentage));
  const waterProgress = waterPercentage === null ? 0 : waterPercentage / 100;
  const caloriePercentage = calorieTarget > 0 && calorieConsumed !== null && calorieConsumed !== undefined ? Math.round((calorieConsumed / calorieTarget) * 100) : null;
  const macroTargets = [{ label: 'Protein', target: nutrition?.protein, consumed: proteinConsumed, unit: 'g', color: colors.primary, icon: 'fitness-outline' }, { label: 'Carbs', target: nutrition?.carbohydrates, consumed: carbohydratesConsumed, unit: 'g', color: colors.warning, icon: 'leaf-outline' }, { label: 'Fat', target: nutrition?.fat, consumed: fatConsumed, unit: 'g', color: colors.lavender, icon: 'water-outline' }, { label: 'Fiber', target: nutrition?.fiber, consumed: fiberConsumed, unit: 'g', color: colors.amber, icon: 'nutrition-outline' }];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={nutritionLoading || todayLoading || mealsLoading} onRefresh={refresh} tintColor={colors.primary} />}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 128 }]}
      >
        <AppText style={styles.eyebrow}>DAILY NOURISHMENT</AppText><AppText weight="bold" size={30}>Today's Nutrition</AppText>
        <AppText style={styles.subtitle}>Personalized targets based on your saved health profile.</AppText>
        {(profileLoading || nutritionLoading || todayLoading) && !nutrition ? <NutritionSkeleton /> : null}
        {(profileIncomplete || activeError) && !profileLoading && !nutritionLoading && !todayLoading ? <GlassCard style={styles.message}><AppText weight="semibold">{isNotCalculated ? "Your nutrition targets haven't been calculated yet." : isStale ? 'Your health profile has changed.' : isValidationError || profileIncomplete ? 'Complete your health profile before calculating nutrition targets.' : isAuthError ? 'Your session has expired.' : 'Nutrition targets are unavailable'}</AppText><AppText style={styles.muted}>{isStale ? 'Recalculate your nutrition targets to keep them up to date.' : isNotCalculated ? 'Use your saved profile to create your daily targets.' : isAuthError ? 'Please sign in again to continue.' : profileIncomplete ? 'Add the missing health details to calculate your targets.' : 'We could not retrieve your latest calculation.'}</AppText>{profileIncomplete || isValidationError ? <PrimaryButton title="Complete Profile" onPress={() => router.push('/(setup)/profile-setup')} style={styles.messageButton} /> : isNotCalculated ? <PrimaryButton title="Calculate My Targets" onPress={calculate} style={styles.messageButton} loading={nutritionLoading} /> : isStale ? <PrimaryButton title="Recalculate Targets" onPress={calculate} style={styles.messageButton} loading={nutritionLoading} /> : <PrimaryButton title="Retry" onPress={refresh} style={styles.messageButton} />}</GlassCard> : null}
        {nutrition && !profileIncomplete && !activeError && !nutritionLoading && !profileLoading ? <><GlassCard style={styles.hero}><View style={styles.heroTop}><View><AppText style={styles.cardEyebrow}>TODAY'S CALORIES</AppText><AppText weight="bold" size={34}>{calorieConsumed === null || calorieConsumed === undefined ? 'Target only' : `${Math.round(calorieConsumed)} / ${target(calorieTarget, ' kcal')}`}</AppText><AppText style={styles.muted}>{caloriePercentage === null ? `Personalized target: ${target(calorieTarget, ' kcal')}` : `${caloriePercentage}% of your target`}</AppText></View><View style={styles.ring}><AppText weight="bold" size={20} style={styles.ringText}>{caloriePercentage === null ? '—' : `${Math.round(calorieProgress * 100)}%`}</AppText><AppText style={styles.ringLabel}>today</AppText></View></View><ProgressBar value={calorieProgress} color={colors.primary} /></GlassCard><View style={styles.section}><SectionHeader title="Your macros" action="Targets" /><View style={styles.stats}>{macroTargets.map((stat) => <View style={styles.stat} key={stat.label}><View style={[styles.statIcon, { backgroundColor: stat.color }]}><Ionicons name={stat.icon} size={16} color={colors.text} /></View><AppText weight="semibold" style={styles.statLabel}>{stat.label}</AppText><AppText weight="bold" size={18}>{target(stat.target, stat.unit)}</AppText><AppText style={styles.muted}>{stat.consumed === null || stat.consumed === undefined ? 'Target' : `${Math.round(stat.consumed)} consumed`}</AppText><ProgressBar value={stat.target > 0 && stat.consumed !== null && stat.consumed !== undefined ? Math.min(1, stat.consumed / stat.target) : 0} color={colors.primary} height={5} /></View>)}</View></View><GlassCard style={styles.waterCard}><View style={styles.waterHeader}><View><AppText style={styles.cardEyebrow}>WATER TARGET</AppText><AppText weight="bold" size={26}>{waterTarget === null || waterTarget === undefined ? 'Not available' : waterConsumed === null || waterConsumed === undefined ? `Target: ${Math.round(waterTarget)} ml` : `${Math.round(waterConsumed)} / ${Math.round(waterTarget)} ml`}</AppText><AppText style={styles.muted}>{waterTarget === null || waterTarget === undefined ? 'Complete your profile to calculate a target.' : waterPercentage === null ? 'Progress unavailable' : `${Math.round(waterPercentage)}% of today's target`}</AppText></View><Ionicons name="water-outline" size={30} color={colors.primary} /></View><ProgressBar value={waterProgress} color={colors.blue} /></GlassCard><PrimaryButton title="Recalculate Targets" onPress={calculate} loading={nutritionLoading} disabled={nutritionLoading} style={styles.recalculateButton} /></> : null}
        <View style={styles.meals}><View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}><SectionHeader title="Today's meals" action="See all" /><TouchableOpacity accessibilityLabel="Open meal tracking" accessibilityRole="button" onPress={() => router.push('/meals')}><Ionicons name="add-circle-outline" size={22} color={colors.primary} /></TouchableOpacity></View>{mealsError ? <GlassCard style={styles.message}><AppText style={styles.muted}>{mealsError}</AppText><PrimaryButton title="Retry" onPress={loadMeals} style={styles.messageButton} /></GlassCard> : null}{!mealsLoading && !mealsError && !meals.length ? <GlassCard style={styles.message}><Ionicons name="restaurant-outline" size={24} color={colors.primary} /><AppText style={styles.muted}>No meals logged today.</AppText><PrimaryButton title="Log a meal" onPress={() => router.push('/meals')} style={styles.messageButton} /></GlassCard> : null}{!mealsError ? meals.map((meal) => <TouchableOpacity key={String(meal.id)} activeOpacity={0.8} onPress={() => router.push('/meals')}><View style={styles.meal}><View style={[styles.mealIcon, { backgroundColor: meal.mealType === 'breakfast' ? colors.amber : meal.mealType === 'lunch' ? colors.mint : meal.mealType === 'dinner' ? colors.blue : colors.lavender }]}><Ionicons name="restaurant-outline" size={18} color={colors.text} /></View><View style={styles.mealCopy}><AppText weight="semibold">{meal.foodName}</AppText><AppText style={styles.muted}>{meal.mealType} · {formatMealTime(meal.loggedAt)}</AppText></View><AppText weight="semibold" style={{ color: colors.primary, marginLeft: 8 }}>{meal.calories === null ? '—' : `${Math.round(meal.calories)} kcal`}</AppText><Ionicons name="chevron-forward" size={17} color={colors.tertiaryText} /></View></TouchableOpacity>) : null}</View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: colors.background }, content: { padding: 24 }, eyebrow: { color: colors.primary, fontSize: 10, letterSpacing: 1.4, marginBottom: 7 }, subtitle: { color: colors.secondaryText, marginTop: 6, lineHeight: 21 }, hero: { marginTop: 22, backgroundColor: colors.glassMedium }, heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }, cardEyebrow: { color: colors.secondaryText, fontSize: 10, letterSpacing: 1.2, marginBottom: 7 }, muted: { color: colors.secondaryText, fontSize: 12, marginTop: 3 }, ring: { width: 90, height: 90, borderRadius: 45, borderWidth: 8, borderColor: colors.mint, alignItems: 'center', justifyContent: 'center' }, ringText: { color: colors.primary }, ringLabel: { color: colors.secondaryText, fontSize: 10 }, section: { marginTop: 28 }, stats: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 14 }, stat: { width: '47%', padding: 13, borderRadius: 20, backgroundColor: colors.glassLight, borderWidth: 1, borderColor: colors.border }, statIcon: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 10 }, statLabel: { fontSize: 12, marginBottom: 7 }, message: { marginTop: 22, backgroundColor: colors.glassMedium }, messageButton: { marginTop: 16 }, recalculateButton: { marginTop: 24 }, skeletonLarge: { width: '40%', height: 28, borderRadius: 8, backgroundColor: colors.border }, skeletonSmall: { width: '65%', height: 12, borderRadius: 6, backgroundColor: colors.border, marginTop: 10 }, skeletonBar: { width: '100%', height: 8, borderRadius: 4, backgroundColor: colors.border, marginTop: 20 }, waterCard: { marginTop: 22, backgroundColor: colors.mint }, waterHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }, meals: { marginTop: 28, marginBottom: 28 }, meal: { flexDirection: 'row', alignItems: 'center', paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: 'rgba(23,34,29,0.06)' }, mealIcon: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginRight: 12 }, mealCopy: { flex: 1 } });
