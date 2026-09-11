import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, RefreshControl, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import AppText from '../components/ui/AppText';
import GlassCard from '../components/ui/GlassCard';
import GradientBackground from '../components/ui/GradientBackground';
import PrimaryButton from '../components/ui/PrimaryButton';
import SectionHeader from '../components/ui/SectionHeader';
import colors from '../constants/colors';
import { api } from '../services/api';
import tokenStorage from '../services/tokenStorage';
import { useAuth } from '../context/AuthContext';

const WORKOUT_TYPES = ['Strength', 'Cardio', 'Mobility', 'Yoga', 'Sports', 'Other'];
const EMPTY_FORM = { name: '', type: 'Strength', duration: '', calories: '', notes: '' };

function getTodayDate() {
  const date = new Date();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function extractWorkoutEntries(source) {
  const entries = source?.workout?.workouts || [];
  return Array.isArray(entries) ? entries : [];
}

function positiveIntegerId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function normalizeWorkout(entry) {
  return {
    id: positiveIntegerId(entry.id),
    name: entry.workout_name || entry.name || 'Workout',
    type: entry.workout_type || entry.type || 'Other',
    duration: entry.duration_minutes === null || entry.duration_minutes === undefined ? null : Number(entry.duration_minutes),
    calories: entry.calories_burned === null || entry.calories_burned === undefined ? null : Number(entry.calories_burned),
    notes: entry.notes || '',
    loggedAt: entry.started_at || entry.completed_at || entry.consumed_at || entry.created_at || entry.loggedAt || null,
  };
}

function formatLoggedTime(value) {
  if (!value) return 'Logged today';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

function formatNumber(value, unit) {
  return value === null || value === undefined || Number.isNaN(value) ? '—' : `${Math.round(value)} ${unit}`;
}

export default function Workouts() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { today, todayLoading, todayError, refreshToday, addWorkout } = useAuth();
  const [form, setForm] = useState(EMPTY_FORM);
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [historyError, setHistoryError] = useState('');
  const [formError, setFormError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const loadHistory = useCallback(async () => {
    const token = await tokenStorage.get();
    if (!token) return [];
    setLoading(true);
    setHistoryError('');
    try {
      const data = await api.getWorkoutHistory(token, getTodayDate());
      const entries = extractWorkoutEntries(data).map(normalizeWorkout).sort((first, second) => new Date(second.loggedAt || 0).getTime() - new Date(first.loggedAt || 0).getTime());
      setWorkouts(entries);
      return entries;
    } catch (error) {
      setWorkouts([]);
      setHistoryError(error.message || 'Unable to load workout history. Please try again.');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    refreshToday().catch(() => {});
    loadHistory();
  }, [loadHistory, refreshToday]));

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setFormError('');
  };

  const validate = () => {
    if (!form.name.trim()) return 'Workout name is required.';
    if (!form.type) return 'Workout type is required.';
    const duration = Number(form.duration);
    if (form.duration.trim() === '' || !Number.isInteger(duration) || duration <= 0) return 'Duration must be a positive whole number of minutes.';
    const calories = Number(form.calories);
    if (form.calories.trim() === '' || !Number.isFinite(calories) || calories < 0) return 'Calories burned must be a valid non-negative number.';
    return '';
  };

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setFormError('');
  };

  const submitWorkout = async () => {
    const error = validate();
    if (error) {
      setFormError(error);
      return;
    }
    setSaving(true);
    setFormError('');
    const body = {
      workout_name: form.name.trim(),
      workout_type: form.type,
      duration_minutes: Number(form.duration),
      calories_burned: Number(form.calories),
      ...(form.notes.trim() ? { notes: form.notes.trim() } : {}),
    };
    try {
      if (editingId === null) {
        await addWorkout(body);
      } else {
        const token = await tokenStorage.get();
        if (!token) throw new Error('Authentication is required to update your workout.');
        await api.updateWorkout(token, editingId, body);
        await refreshToday();
      }
      await loadHistory();
      resetForm();
    } catch (error) {
      setFormError(error.message || 'Unable to save this workout. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const startEditing = (workout) => {
    if (workout.id === null) {
      setFormError('This workout is not available for editing until history refreshes.');
      return;
    }
    setEditingId(workout.id);
    setForm({ name: workout.name, type: workout.type, duration: workout.duration === null ? '' : String(workout.duration), calories: workout.calories === null ? '' : String(workout.calories), notes: workout.notes });
    setFormError('');
  };

  const cancelEditing = () => resetForm();

  const deleteWorkout = async (id) => {
    const backendId = positiveIntegerId(id);
    if (backendId === null) {
      setFormError('This workout is not available for deletion until history refreshes.');
      return;
    }
    const token = await tokenStorage.get();
    if (!token) return;
    setDeletingId(backendId);
    setFormError('');
    try {
      await api.deleteWorkout(token, backendId);
      if (editingId === backendId) resetForm();
      await Promise.all([loadHistory(), refreshToday()]);
    } catch (error) {
      setFormError(error.message || 'Unable to delete this workout. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  const confirmDelete = (workout) => {
    Alert.alert('Delete workout?', `Remove ${workout.name} from today's history?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteWorkout(workout.id) },
    ]);
  };

  const workoutSummary = today?.workout || {};
  const showTodayError = todayError && !todayLoading;
  const showInitialLoading = todayLoading && !today;

  return (
    <GradientBackground style={styles.container} innerStyle={styles.backgroundContent}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <KeyboardAvoidingView style={styles.keyboardView} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            refreshControl={<RefreshControl refreshing={todayLoading || loading} onRefresh={() => Promise.all([refreshToday(), loadHistory()]).catch(() => {})} tintColor={colors.primary} />}
            contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.header}>
              <TouchableOpacity accessibilityLabel="Go back" accessibilityRole="button" onPress={() => router.back()} style={styles.backButton}><Ionicons name="arrow-back" size={21} color={colors.primary} /></TouchableOpacity>
              <View style={styles.headerCopy}><AppText style={styles.eyebrow}>DAILY MOVEMENT</AppText><AppText weight="bold" size={30}>Workout Tracking</AppText><AppText style={styles.subtitle}>Keep a clear record of how you move.</AppText></View>
              <View style={styles.headerIcon}><Ionicons name="fitness-outline" size={22} color={colors.primary} /></View>
            </View>

            {showInitialLoading ? <GlassCard style={styles.statusCard}><ActivityIndicator color={colors.primary} /><AppText style={styles.statusText}>Loading today's workout data...</AppText></GlassCard> : null}
            {showTodayError ? <GlassCard style={styles.statusCard}><AppText weight="semibold">Today's workout summary is unavailable.</AppText><AppText style={styles.muted}>You can still try loading workout history.</AppText><PrimaryButton title="Retry" onPress={() => refreshToday().catch(() => {})} style={styles.retryButton} /></GlassCard> : null}

            {!showInitialLoading ? <>
              <GlassCard style={styles.summaryCard}>
                <View style={styles.summaryTop}><View><AppText style={styles.cardEyebrow}>TODAY'S ACTIVITY</AppText><AppText weight="bold" size={34}>{formatNumber(workoutSummary.durationMinutes, 'min')}</AppText><AppText style={styles.muted}>{formatNumber(workoutSummary.caloriesBurned, 'kcal burned')}</AppText></View><View style={styles.summaryIcon}><Ionicons name="barbell-outline" size={28} color={colors.primary} /></View></View>
              </GlassCard>

              <View style={styles.formSection}><SectionHeader title={editingId === null ? 'Log a workout' : 'Edit workout'} /><AppText style={styles.muted}>Add the details from your latest session.</AppText><View style={styles.formCard}>
                <Field label="Workout name" value={form.name} placeholder="e.g. Evening run" onChangeText={(value) => updateField('name', value)} />
                <AppText weight="semibold" style={styles.formGroupTitle}>Workout type</AppText>
                <View style={styles.typeGrid}>{WORKOUT_TYPES.map((type) => <TouchableOpacity key={type} activeOpacity={0.75} onPress={() => updateField('type', type)} style={[styles.typeButton, form.type === type && styles.typeButtonActive]}><AppText weight="semibold" style={[styles.typeText, form.type === type && styles.typeTextActive]}>{type}</AppText></TouchableOpacity>)}</View>
                <View style={styles.fieldGrid}><Field label="Duration (min)" value={form.duration} placeholder="e.g. 35" onChangeText={(value) => updateField('duration', value.replace(/[^0-9]/g, ''))} keyboardType="number-pad" /><Field label="Calories burned" value={form.calories} placeholder="e.g. 240" onChangeText={(value) => updateField('calories', value.replace(/[^0-9]/g, ''))} keyboardType="number-pad" /></View>
                <Field label="Notes (optional)" value={form.notes} placeholder="How did it feel?" onChangeText={(value) => updateField('notes', value)} multiline />
                {formError ? <AppText style={styles.errorText}>{formError}</AppText> : null}
                {editingId !== null ? <TouchableOpacity onPress={cancelEditing} disabled={saving} style={styles.cancelButton}><AppText weight="semibold" style={styles.cancelText}>Cancel edit</AppText></TouchableOpacity> : null}
                <PrimaryButton title={editingId === null ? 'Log workout' : 'Save changes'} onPress={submitWorkout} loading={saving} disabled={saving} style={styles.submitButton} />
              </View></View>

              <View style={styles.historySection}><View style={styles.historyHeader}><SectionHeader title="Today's workouts" />{loading ? <ActivityIndicator color={colors.primary} /> : null}</View>
                {historyError ? <GlassCard style={styles.statusCard}><AppText style={styles.errorText}>{historyError}</AppText><PrimaryButton title="Retry" onPress={loadHistory} style={styles.retryButton} /></GlassCard> : null}
                {!loading && !historyError && workouts.length === 0 ? <GlassCard style={styles.statusCard}><Ionicons name="fitness-outline" size={24} color={colors.primary} /><AppText style={styles.statusText}>No workouts logged today.</AppText></GlassCard> : null}
                {!historyError ? workouts.map((workout) => <GlassCard style={styles.workoutCard} key={String(workout.id)}><View style={styles.workoutRow}><View style={styles.workoutIcon}><Ionicons name="fitness-outline" size={18} color={colors.primary} /></View><View style={styles.workoutCopy}><AppText weight="semibold">{workout.name}</AppText><AppText style={styles.muted}>{workout.type} · {formatNumber(workout.duration, 'min')} · {formatLoggedTime(workout.loggedAt)}</AppText><AppText style={styles.workoutMeta}>{formatNumber(workout.calories, 'kcal burned')}{workout.notes ? ` · ${workout.notes}` : ''}</AppText></View><View style={styles.workoutActions}><TouchableOpacity accessibilityLabel={`Edit ${workout.name}`} accessibilityRole="button" onPress={() => startEditing(workout)} disabled={workout.id === null || saving || deletingId !== null} style={styles.actionButton}><Ionicons name="create-outline" size={19} color={colors.primary} /></TouchableOpacity><TouchableOpacity accessibilityLabel={`Delete ${workout.name}`} accessibilityRole="button" onPress={() => confirmDelete(workout)} disabled={workout.id === null || saving || deletingId !== null} style={[styles.actionButton, styles.deleteAction]}>{deletingId === workout.id ? <ActivityIndicator size="small" color={colors.danger} /> : <Ionicons name="trash-outline" size={19} color={colors.danger} />}</TouchableOpacity></View></View></GlassCard>) : null}
              </View>
            </> : null}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </GradientBackground>
  );
}

function Field({ label, value, placeholder, onChangeText, keyboardType, multiline }) {
  const [focused, setFocused] = useState(false);
  return <View style={styles.field}><AppText weight="semibold" style={styles.fieldLabel}>{label}</AppText><TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={colors.tertiaryText} keyboardType={keyboardType || 'default'} multiline={multiline} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} style={[styles.input, multiline && styles.notesInput, focused && styles.inputFocused]} /></View>;
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
  headerIcon: { width: 42, height: 42, borderRadius: 15, backgroundColor: colors.mint, alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
  eyebrow: { color: colors.primary, fontSize: 10, letterSpacing: 1.4, marginBottom: 7 },
  subtitle: { color: colors.secondaryText, marginTop: 6, lineHeight: 20 },
  summaryCard: { backgroundColor: colors.mint },
  summaryTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardEyebrow: { color: colors.secondaryText, fontSize: 10, letterSpacing: 1.2, marginBottom: 7 },
  muted: { color: colors.secondaryText, fontSize: 12, marginTop: 4 },
  summaryIcon: { width: 72, height: 72, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.7)', alignItems: 'center', justifyContent: 'center' },
  formSection: { marginTop: 30 },
  formCard: { marginTop: 14, padding: 20, borderRadius: 26, backgroundColor: colors.glassLight, borderWidth: 1, borderColor: colors.border },
  formGroupTitle: { marginTop: 18, marginBottom: 10 },
  field: { marginTop: 14 },
  fieldLabel: { fontSize: 12, color: colors.secondaryText, marginBottom: 7 },
  input: { minHeight: 52, borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.glassMedium, paddingHorizontal: 14, color: colors.text, fontSize: 15 },
  notesInput: { minHeight: 78, paddingTop: 14, textAlignVertical: 'top' },
  inputFocused: { borderColor: colors.primary },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeButton: { paddingHorizontal: 13, minHeight: 38, borderRadius: 13, backgroundColor: colors.glassMedium, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  typeButtonActive: { backgroundColor: colors.mint, borderColor: colors.primary },
  typeText: { color: colors.secondaryText, fontSize: 12 },
  typeTextActive: { color: colors.primary },
  fieldGrid: { flexDirection: 'row', gap: 10 },
  errorText: { color: colors.danger, fontSize: 12, marginTop: 10 },
  cancelButton: { alignItems: 'center', paddingVertical: 14 },
  cancelText: { color: colors.primary },
  submitButton: { marginTop: 12 },
  retryButton: { width: '100%', marginTop: 16 },
  statusCard: { marginTop: 14, backgroundColor: colors.glassMedium, alignItems: 'center' },
  statusText: { color: colors.secondaryText, marginTop: 12, textAlign: 'center' },
  historySection: { marginTop: 30 },
  historyHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  workoutCard: { marginTop: 10, backgroundColor: colors.glassMedium },
  workoutRow: { flexDirection: 'row', alignItems: 'center' },
  workoutIcon: { width: 38, height: 38, borderRadius: 13, backgroundColor: colors.mint, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  workoutCopy: { flex: 1 },
  workoutMeta: { color: colors.secondaryText, fontSize: 12, marginTop: 4 },
  workoutActions: { flexDirection: 'row', marginLeft: 8 },
  actionButton: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.mint },
  deleteAction: { marginLeft: 6, backgroundColor: 'rgba(200,109,104,0.10)' },
});
