import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, RefreshControl, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import AppText from '../components/ui/AppText';
import GlassCard from '../components/ui/GlassCard';
import GradientBackground from '../components/ui/GradientBackground';
import PrimaryButton from '../components/ui/PrimaryButton';
import ProgressBar from '../components/ui/ProgressBar';
import SectionHeader from '../components/ui/SectionHeader';
import colors from '../constants/colors';
import { api } from '../services/api';
import tokenStorage from '../services/tokenStorage';
import { useAuth } from '../context/AuthContext';

const MEAL_TYPES = [
  { value: 'breakfast', label: 'Breakfast', icon: 'sunny-outline', color: colors.amber },
  { value: 'lunch', label: 'Lunch', icon: 'restaurant-outline', color: colors.mint },
  { value: 'dinner', label: 'Dinner', icon: 'moon-outline', color: colors.blue },
  { value: 'snack', label: 'Snack', icon: 'cafe-outline', color: colors.lavender },
];

const EMPTY_FORM = {
  foodName: '',
  quantity: '',
  calories: '',
  protein: '',
  carbohydrates: '',
  fat: '',
};

function numberOrNull(value) {
  return value === null || value === undefined || value === '' ? null : Number(value);
}

function positiveIntegerId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function getTodayDate() {
  const date = new Date();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function extractMealEntries(source) {
  const entries = source?.food?.meals || source?.history || source?.entries || source?.items || source?.meals || source?.foodEntries || source?.nutrition?.meals || [];
  return Array.isArray(entries) ? entries : [];
}

function normalizeMeal(entry) {
  return {
    id: positiveIntegerId(entry.id),
    mealType: entry.meal_type || entry.mealType || 'meal',
    foodName: entry.food_name || entry.foodName || 'Meal',
    quantity: entry.quantity || null,
    calories: numberOrNull(entry.calories),
    protein: numberOrNull(entry.protein_g ?? entry.protein),
    carbohydrates: numberOrNull(entry.carbohydrates_g ?? entry.carbohydrates),
    fat: numberOrNull(entry.fat_g ?? entry.fat),
    fiber: numberOrNull(entry.fiber_g ?? entry.fiber),
    loggedAt: entry.consumed_at || entry.created_at || entry.loggedAt || null,
  };
}

function sumMealValue(mealEntries, field) {
  const values = mealEntries.map((meal) => meal[field]).filter((value) => value !== null && Number.isFinite(value));
  return values.length ? values.reduce((total, value) => total + value, 0) : null;
}

function mealLabel(value) {
  return MEAL_TYPES.find((meal) => meal.value === value)?.label || value;
}

function formatValue(value, unit = '') {
  return value === null || value === undefined || Number.isNaN(value) ? '—' : `${Math.round(value * 10) / 10}${unit}`;
}

function formatLoggedTime(value) {
  if (!value) return 'Just now';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Logged today' : date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

export default function Meals() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { today, todayLoading, todayError, refreshToday, addFood } = useAuth();
  const [mealType, setMealType] = useState('breakfast');
  const [form, setForm] = useState(EMPTY_FORM);
  const [meals, setMeals] = useState([]);
  const [mealLoading, setMealLoading] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [mealError, setMealError] = useState('');
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const syncMeals = useCallback((source) => {
    const entries = extractMealEntries(source).map(normalizeMeal);
    if (entries.length) setMeals(entries);
  }, []);

  const loadMealHistory = useCallback(async () => {
    const token = await tokenStorage.get();
    if (!token) return [];
    setHistoryLoading(true);
    setHistoryError('');
    try {
      const data = await api.getFoodHistory(token, getTodayDate());
      const entries = extractMealEntries(data).map(normalizeMeal).sort((first, second) => new Date(second.loggedAt || 0).getTime() - new Date(first.loggedAt || 0).getTime());
      setMeals(entries);
      return entries;
    } catch (error) {
      setHistoryError(error.message || 'Unable to load meal history. Please try again.');
      return [];
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    syncMeals(today);
  }, [syncMeals, today]);

  useFocusEffect(useCallback(() => {
    refreshToday().then(syncMeals).catch(() => {});
    loadMealHistory();
  }, [loadMealHistory, refreshToday, syncMeals]));

  const nutrition = today?.nutrition || {};
  const caloriesTarget = nutrition.caloriesTarget;
  const caloriesConsumed = sumMealValue(meals, 'calories');
  const proteinConsumed = sumMealValue(meals, 'protein');
  const carbohydratesConsumed = sumMealValue(meals, 'carbohydrates');
  const fatConsumed = sumMealValue(meals, 'fat');
  const fiberConsumed = sumMealValue(meals, 'fiber');
  const caloriesProgress = caloriesTarget > 0 && caloriesConsumed !== null && caloriesConsumed !== undefined ? Math.min(1, caloriesConsumed / caloriesTarget) : 0;
  const showTodayError = todayError && !todayLoading;
  const showInitialLoading = todayLoading && !today;

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setValidationError('');
    setMealError('');
  };

  const validate = () => {
    if (!form.foodName.trim()) return 'Food name is required.';
    if (!form.quantity.trim()) return 'Quantity is required.';
    const numericFields = [
      ['quantity', 'Quantity'],
      ['calories', 'Calories'],
      ['protein', 'Protein'],
      ['carbohydrates', 'Carbohydrates'],
      ['fat', 'Fat'],
    ];
    for (const [field, label] of numericFields) {
      const value = Number(form[field]);
      if (form[field].trim() === '' || !Number.isFinite(value) || value < 0) return `${label} must be a valid non-negative number.`;
    }
    return '';
  };

  const submitMeal = async () => {
    const error = validate();
    if (error) {
      setValidationError(error);
      return;
    }

    setMealLoading(true);
    setValidationError('');
    setMealError('');
    const body = {
      meal_type: mealType,
      food_name: form.foodName.trim(),
      calories: Number(form.calories),
      protein_g: Number(form.protein),
      carbohydrates_g: Number(form.carbohydrates),
      fat_g: Number(form.fat),
    };
    const localMeal = normalizeMeal({ ...body, quantity: form.quantity.trim(), loggedAt: new Date().toISOString() });

    try {
      if (editingId === null) {
        const refreshedToday = await addFood(body);
        const returnedMeals = extractMealEntries(refreshedToday).map(normalizeMeal);
        const history = await loadMealHistory();
        setMeals(history.length ? history : returnedMeals.length ? returnedMeals : [localMeal, ...meals]);
      } else {
        const token = await tokenStorage.get();
        if (!token) throw new Error('Authentication is required to update your meal.');
        await api.updateFood(token, editingId, body);
        await Promise.all([refreshToday(), loadMealHistory()]);
      }
      setForm(EMPTY_FORM);
      setEditingId(null);
    } catch (error) {
      setMealError(error.message || (editingId === null ? 'Unable to log this meal. Please try again.' : 'Unable to update this meal. Please try again.'));
    } finally {
      setMealLoading(false);
    }
  };

  const startEditing = (meal) => {
    const backendId = positiveIntegerId(meal.id);
    if (backendId === null) {
      setMealError('This meal is not available for editing until history refreshes.');
      return;
    }
    setEditingId(backendId);
    setMealType(meal.mealType);
    setForm({ foodName: meal.foodName, quantity: meal.quantity ? String(meal.quantity) : '', calories: meal.calories === null ? '' : String(meal.calories), protein: meal.protein === null ? '' : String(meal.protein), carbohydrates: meal.carbohydrates === null ? '' : String(meal.carbohydrates), fat: meal.fat === null ? '' : String(meal.fat) });
    setValidationError('');
    setMealError('');
  };

  const cancelEditing = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setValidationError('');
    setMealError('');
  };

  const deleteMeal = async (id) => {
    const backendId = positiveIntegerId(id);
    if (backendId === null) {
      setMealError('This meal is not available for deletion until history refreshes.');
      return;
    }
    const token = await tokenStorage.get();
    if (!token) return;
    setDeletingId(backendId);
    setMealError('');
    try {
      await api.deleteFood(token, backendId);
      if (editingId === backendId) cancelEditing();
      await Promise.all([refreshToday(), loadMealHistory()]);
    } catch (error) {
      setMealError(error.message || 'Unable to delete this meal. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  const confirmDelete = (meal) => {
    Alert.alert('Delete meal?', `Remove ${meal.foodName} from today's meals?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteMeal(meal.id) },
    ]);
  };

  return (
    <GradientBackground style={styles.container} innerStyle={styles.backgroundContent}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <KeyboardAvoidingView style={styles.keyboardView} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            refreshControl={<RefreshControl refreshing={todayLoading || historyLoading} onRefresh={() => Promise.all([refreshToday().then(syncMeals), loadMealHistory()]).catch(() => {})} tintColor={colors.primary} />}
            contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
            showsVerticalScrollIndicator={false}
          >
          <View style={styles.header}>
            <TouchableOpacity accessibilityLabel="Go back" accessibilityRole="button" onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={21} color={colors.primary} />
            </TouchableOpacity>
            <View style={styles.headerCopy}>
              <AppText style={styles.eyebrow}>DAILY NOURISHMENT</AppText>
              <AppText weight="bold" size={30}>Meal Logging</AppText>
              <AppText style={styles.subtitle}>Keep a clear record of what fuels your day.</AppText>
            </View>
            <View style={styles.headerIcon}><Ionicons name="restaurant-outline" size={22} color={colors.primary} /></View>
          </View>

          {showInitialLoading ? <GlassCard style={styles.statusCard}><ActivityIndicator color={colors.primary} /><AppText style={styles.statusText}>Loading today's nutrition...</AppText></GlassCard> : null}
          {showTodayError ? <GlassCard style={styles.statusCard}><AppText weight="semibold">Today's nutrition data is unavailable.</AppText><AppText style={styles.muted}>Please try again.</AppText><PrimaryButton title="Retry" onPress={() => refreshToday().then(syncMeals).catch(() => {})} style={styles.retryButton} /></GlassCard> : null}

          {!showInitialLoading && !showTodayError ? <>
            <GlassCard style={styles.totalCard}>
              <View style={styles.totalTop}>
                <View>
                  <AppText style={styles.cardEyebrow}>TODAY'S CALORIES</AppText>
                  <AppText weight="bold" size={32}>{formatValue(caloriesConsumed, ' kcal')}</AppText>
                  <AppText style={styles.muted}>{caloriesTarget === null || caloriesTarget === undefined ? 'Target unavailable' : `of ${formatValue(caloriesTarget, ' kcal')}`}</AppText>
                </View>
                <View style={styles.percentageCircle}><AppText weight="bold" size={20} style={styles.percentageText}>{caloriesTarget > 0 && caloriesConsumed !== null && caloriesConsumed !== undefined ? `${Math.round(caloriesProgress * 100)}%` : '—'}</AppText><AppText style={styles.percentageLabel}>complete</AppText></View>
              </View>
              <ProgressBar value={caloriesProgress} color={colors.primary} height={10} />
            </GlassCard>

            <View style={styles.macroSection}>
              <SectionHeader title="Nutrition totals" />
              <View style={styles.macroGrid}>
                {[['Protein', proteinConsumed, ' g', colors.primary], ['Carbs', carbohydratesConsumed, ' g', colors.warning], ['Fat', fatConsumed, ' g', colors.lavender], ['Fiber', fiberConsumed, ' g', colors.amber]].map(([label, value, unit, color]) => <GlassCard style={styles.macroCard} key={label}><View style={[styles.macroIcon, { backgroundColor: color }]}><Ionicons name={label === 'Fat' ? 'water-outline' : label === 'Carbs' ? 'leaf-outline' : label === 'Fiber' ? 'nutrition-outline' : 'fitness-outline'} size={16} color={colors.text} /></View><AppText style={styles.macroLabel}>{label}</AppText><AppText weight="semibold" style={styles.macroValue}>{formatValue(value, unit)}</AppText></GlassCard>)}
              </View>
            </View>

            <View style={styles.formSection}>
              <SectionHeader title="Log a meal" />
              <AppText style={styles.muted}>Select a meal type and add its nutrition details.</AppText>
              <View style={styles.mealTypes}>{MEAL_TYPES.map((meal) => <TouchableOpacity key={meal.value} activeOpacity={0.75} onPress={() => setMealType(meal.value)} style={[styles.mealType, { backgroundColor: meal.color }, mealType === meal.value && styles.mealTypeActive]}><Ionicons name={meal.icon} size={17} color={colors.text} /><AppText weight="semibold" style={styles.mealTypeText}>{meal.label}</AppText></TouchableOpacity>)}</View>
              <View style={styles.formCard}>
                <AppText weight="semibold" style={styles.formGroupTitle}>Food details</AppText>
                <Field label="Food name" value={form.foodName} placeholder="e.g. 2 eggs" onChangeText={(value) => updateField('foodName', value)} />
                <Field label="Quantity" value={form.quantity} placeholder="e.g. 2" onChangeText={(value) => updateField('quantity', value)} keyboardType="decimal-pad" />
                <AppText weight="semibold" style={styles.formGroupTitle}>Nutrition details</AppText>
                <View style={styles.fieldGrid}>
                  <Field label="Calories" value={form.calories} placeholder="e.g. 180" onChangeText={(value) => updateField('calories', value)} keyboardType="decimal-pad" />
                  <Field label="Protein (g)" value={form.protein} placeholder="e.g. 12" onChangeText={(value) => updateField('protein', value)} keyboardType="decimal-pad" />
                  <Field label="Carbohydrates (g)" value={form.carbohydrates} placeholder="e.g. 2" onChangeText={(value) => updateField('carbohydrates', value)} keyboardType="decimal-pad" />
                  <Field label="Fat (g)" value={form.fat} placeholder="e.g. 10" onChangeText={(value) => updateField('fat', value)} keyboardType="decimal-pad" />
                </View>
                {validationError ? <AppText style={styles.errorText}>{validationError}</AppText> : null}
                {mealError ? <AppText style={styles.errorText}>{mealError}</AppText> : null}
                {editingId !== null ? <TouchableOpacity onPress={cancelEditing} disabled={mealLoading} style={styles.cancelButton}><AppText weight="semibold" style={styles.cancelText}>Cancel edit</AppText></TouchableOpacity> : null}
                <PrimaryButton title={editingId !== null ? 'Save changes' : 'Log meal'} onPress={submitMeal} loading={mealLoading} disabled={mealLoading} style={styles.submitButton} />
              </View>
            </View>

            <View style={styles.loggedSection}>
              <View style={styles.historyHeader}><SectionHeader title="Today's meals" />{historyLoading ? <ActivityIndicator color={colors.primary} /> : null}</View>
              {historyError ? <GlassCard style={styles.statusCard}><AppText style={styles.errorText}>{historyError}</AppText><PrimaryButton title="Retry" onPress={loadMealHistory} style={styles.retryButton} /></GlassCard> : null}
              {!historyLoading && !historyError && !meals.length ? <GlassCard style={styles.emptyCard}><Ionicons name="restaurant-outline" size={24} color={colors.primary} /><AppText style={styles.statusText}>No meals logged today.</AppText></GlassCard> : null}
              {!historyError ? meals.map((meal) => <GlassCard style={styles.mealCard} key={String(meal.id)}><View style={styles.mealRow}><View style={styles.mealIcon}><Ionicons name="restaurant-outline" size={18} color={colors.primary} /></View><View style={styles.mealCopy}><AppText weight="semibold">{meal.foodName}</AppText><AppText style={styles.muted}>{mealLabel(meal.mealType)}{meal.quantity ? ` · ${meal.quantity}` : ''} · {formatLoggedTime(meal.loggedAt)}</AppText><AppText style={styles.mealNutrition}>{formatValue(meal.calories, ' kcal')} · {formatValue(meal.protein, ' g protein')} · {formatValue(meal.carbohydrates, ' g carbs')} · {formatValue(meal.fat, ' g fat')}</AppText></View><View style={styles.mealActions}><TouchableOpacity accessibilityLabel={`Edit ${meal.foodName}`} accessibilityRole="button" onPress={() => startEditing(meal)} disabled={meal.id === null || mealLoading || deletingId !== null} style={styles.actionButton}><Ionicons name="create-outline" size={19} color={colors.primary} /></TouchableOpacity><TouchableOpacity accessibilityLabel={`Delete ${meal.foodName}`} accessibilityRole="button" onPress={() => confirmDelete(meal)} disabled={meal.id === null || mealLoading || deletingId !== null} style={[styles.actionButton, styles.deleteAction]}>{deletingId === meal.id ? <ActivityIndicator size="small" color={colors.danger} /> : <Ionicons name="trash-outline" size={19} color={colors.danger} />}</TouchableOpacity></View></View></GlassCard>) : null}
            </View>
          </> : null}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </GradientBackground>
  );
}

function Field({ label, value, placeholder, onChangeText, keyboardType }) {
  const [focused, setFocused] = useState(false);
  return <View style={styles.field}><AppText weight="semibold" style={styles.fieldLabel}>{label}</AppText><TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={colors.tertiaryText} keyboardType={keyboardType || 'default'} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} style={[styles.input, focused && styles.inputFocused]} /></View>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  backgroundContent: { padding: 0 },
  safeArea: { flex: 1 },
  keyboardView: { flex: 1 },
  content: { paddingHorizontal: 24, paddingTop: 10 },
  header: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 24 },
  backButton: { width: 42, height: 42, borderRadius: 15, backgroundColor: colors.mint, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  headerCopy: { flex: 1 },
  headerIcon: { width: 42, height: 42, borderRadius: 15, backgroundColor: colors.amber, alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
  eyebrow: { color: colors.primary, fontSize: 10, letterSpacing: 1.4, marginBottom: 7 },
  subtitle: { color: colors.secondaryText, marginTop: 6, lineHeight: 20 },
  totalCard: { backgroundColor: colors.mint },
  totalTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  cardEyebrow: { color: colors.secondaryText, fontSize: 10, letterSpacing: 1.2, marginBottom: 7 },
  muted: { color: colors.secondaryText, fontSize: 12, marginTop: 4 },
  percentageCircle: { width: 88, height: 88, borderRadius: 44, borderWidth: 8, borderColor: 'rgba(255,255,255,0.72)', alignItems: 'center', justifyContent: 'center' },
  percentageText: { color: colors.primary },
  percentageLabel: { color: colors.secondaryText, fontSize: 10 },
  macroSection: { marginTop: 28 },
  macroGrid: { flexDirection: 'row', gap: 8, marginTop: 14 },
  macroCard: { flex: 1, backgroundColor: colors.glassMedium },
  macroIcon: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 9 },
  macroLabel: { color: colors.secondaryText, fontSize: 11 },
  macroValue: { marginTop: 5, fontSize: 14 },
  formSection: { marginTop: 30 },
  mealTypes: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16 },
  mealType: { width: '48%', minHeight: 44, borderRadius: 14, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: 'transparent' },
  mealTypeActive: { borderColor: colors.primary },
  mealTypeText: { fontSize: 12, marginLeft: 7 },
  formCard: { marginTop: 14, padding: 16, borderRadius: 22, backgroundColor: colors.glassMedium, borderWidth: 1, borderColor: colors.border },
  formGroupTitle: { color: colors.primaryDark, fontSize: 13, marginBottom: 12 },
  field: { marginBottom: 14 },
  fieldGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  fieldLabel: { color: colors.text, fontSize: 12, letterSpacing: 0.2, marginBottom: 6 },
  input: { minHeight: 50, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(23,34,29,0.16)', backgroundColor: colors.surface, paddingHorizontal: 14, color: colors.text, fontSize: 16 },
  inputFocused: { borderColor: colors.primary, borderWidth: 2, backgroundColor: '#FFFFFF', shadowColor: colors.primary, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.12, shadowRadius: 7, elevation: 2 },
  cancelButton: { alignItems: 'center', paddingVertical: 11, marginTop: 4 },
  cancelText: { color: colors.secondaryText, fontSize: 13 },
  submitButton: { marginTop: 4 },
  errorText: { color: colors.danger, fontSize: 12, marginTop: 2, marginBottom: 12 },
  loggedSection: { marginTop: 30 },
  emptyCard: { marginTop: 14, backgroundColor: colors.glassMedium, alignItems: 'center' },
  statusCard: { backgroundColor: colors.glassMedium, alignItems: 'center' },
  statusText: { color: colors.secondaryText, marginTop: 12, textAlign: 'center' },
  retryButton: { width: '100%', marginTop: 16 },
  historyHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  mealCard: { marginTop: 10, backgroundColor: colors.glassMedium },
  mealRow: { flexDirection: 'row', alignItems: 'center' },
  mealIcon: { width: 38, height: 38, borderRadius: 13, backgroundColor: colors.amber, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  mealCopy: { flex: 1 },
  mealNutrition: { color: colors.secondaryText, fontSize: 11, marginTop: 7 },
  mealActions: { flexDirection: 'row', gap: 6, marginLeft: 8 },
  actionButton: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.mint },
  deleteAction: { backgroundColor: 'rgba(200,109,104,0.10)' },
});
