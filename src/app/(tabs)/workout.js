import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Image, RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import AppText from '../../components/ui/AppText';
import GlassCard from '../../components/ui/GlassCard';
import colors from '../../constants/colors';
import ProgressBar from '../../components/ui/ProgressBar';
import SectionHeader from '../../components/ui/SectionHeader';
import { api } from '../../services/api';
import tokenStorage from '../../services/tokenStorage';
import { useAuth } from '../../context/AuthContext';

export default function Workout() {
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

  function normalizeWorkout(entry) {
    return {
      id: entry.id,
      name: entry.workout_name || entry.name || 'Workout',
      type: entry.workout_type || entry.type || 'Workout',
      duration: entry.duration_minutes === null || entry.duration_minutes === undefined ? null : Number(entry.duration_minutes),
      calories: entry.calories_burned === null || entry.calories_burned === undefined ? null : Number(entry.calories_burned),
      loggedAt: entry.started_at || entry.completed_at || entry.created_at || null,
    };
  }

  function formatNumber(value, unit) {
    return value === null || value === undefined || Number.isNaN(value) ? '—' : `${Math.round(value)} ${unit}`;
  }

  function formatLoggedTime(value) {
    if (!value) return 'Logged today';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  }

  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { today, todayLoading, refreshToday } = useAuth();
  const [workouts, setWorkouts] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState('');

  const loadHistory = useCallback(async () => {
    const token = await tokenStorage.get();
    if (!token) return;
    setHistoryLoading(true);
    setHistoryError('');
    try {
      const data = await api.getWorkoutHistory(token, getTodayDate());
      setWorkouts(extractWorkoutEntries(data).map(normalizeWorkout).sort((first, second) => new Date(second.loggedAt || 0).getTime() - new Date(first.loggedAt || 0).getTime()));
    } catch (error) {
      setWorkouts([]);
      setHistoryError(error.message || 'Unable to load workout history. Please try again.');
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    refreshToday().catch(() => {});
    loadHistory();
  }, [loadHistory, refreshToday]));

  const workout = today?.workout || {};
  const hasWorkouts = workouts.length > 0;
  const workoutDetail = todayLoading ? 'Loading today' : workout.durationMinutes === null || workout.durationMinutes === undefined ? 'No workout logged' : `${formatNumber(workout.durationMinutes, 'min')} · ${formatNumber(workout.caloriesBurned, 'kcal')}`;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={todayLoading || historyLoading} onRefresh={() => Promise.all([refreshToday(), loadHistory()]).catch(() => {})} tintColor={colors.primary} />}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 128 }]}
        showsVerticalScrollIndicator={false}
      >
        <AppText style={styles.eyebrow}>YOUR MOVEMENT</AppText>
        <AppText weight="bold" size={30}>Today's workout</AppText>
        <AppText style={styles.subtitle}>Meet yourself where you are.</AppText>

        <TouchableOpacity activeOpacity={0.86} onPress={() => router.push('/workouts')} style={styles.hero}>
          <Image source={require('../../../assets/images/exercise-1.jpg')} style={styles.image} resizeMode="cover" /><View style={styles.overlay} />
          <View style={styles.heroCopy}><AppText weight="semibold" style={styles.heroEyebrow}>TODAY'S ACTIVITY</AppText><AppText weight="bold" size={24} style={styles.heroTitle}>{workout.durationMinutes === null || workout.durationMinutes === undefined ? 'Ready to move?' : `${formatNumber(workout.durationMinutes, 'min')} logged`}</AppText><AppText style={styles.heroMeta}>{workoutDetail}</AppText></View><View style={styles.start}><Ionicons name="arrow-forward" size={18} color={colors.primaryDark} /></View>
        </TouchableOpacity>

        <View style={styles.section}><SectionHeader title="Today's progress" action="Track workout" /><View style={styles.progressCard}><View style={styles.progressTop}><View><AppText weight="bold" size={26}>{formatNumber(workout.durationMinutes, 'min')}</AppText><AppText style={styles.muted}>{formatNumber(workout.caloriesBurned, 'calories burned')}</AppText></View><View style={styles.progressIcon}><Ionicons name="fitness-outline" size={21} color={colors.primary} /></View></View><ProgressBar value={workout.durationMinutes ? 1 : 0} color={colors.primary} /></View></View>

        <View style={styles.section}><View style={styles.historyHeader}><SectionHeader title="Today's workouts" />{historyLoading ? <ActivityIndicator color={colors.primary} /> : null}</View>{historyError ? <GlassCard style={styles.statusCard}><AppText style={styles.errorText}>{historyError}</AppText><TouchableOpacity onPress={loadHistory} style={styles.retry}><AppText weight="semibold" style={styles.retryText}>Retry</AppText></TouchableOpacity></GlassCard> : null}{!historyLoading && !historyError && !hasWorkouts ? <GlassCard style={styles.statusCard}><Ionicons name="fitness-outline" size={24} color={colors.primary} /><AppText style={styles.statusText}>No workouts logged today.</AppText><TouchableOpacity onPress={() => router.push('/workouts')} style={styles.trackButton}><AppText weight="semibold" style={styles.trackText}>Log a workout</AppText></TouchableOpacity></GlassCard> : null}{!historyError ? workouts.map((entry) => <TouchableOpacity key={String(entry.id)} activeOpacity={0.8} onPress={() => router.push('/workouts')}><GlassCard style={styles.workoutCard}><View style={styles.workoutRow}><View style={styles.workoutIcon}><Ionicons name="fitness-outline" size={18} color={colors.primary} /></View><View style={styles.workoutCopy}><AppText weight="semibold">{entry.name}</AppText><AppText style={styles.muted}>{entry.type} · {formatNumber(entry.duration, 'min')} · {formatLoggedTime(entry.loggedAt)}</AppText><AppText style={styles.workoutMeta}>{formatNumber(entry.calories, 'kcal burned')}</AppText></View><Ionicons name="chevron-forward" size={17} color={colors.tertiaryText} /></View></GlassCard></TouchableOpacity>) : null}</View>

        <View style={styles.section}><SectionHeader title="Recommended for you" /><TouchableOpacity activeOpacity={0.8} onPress={() => router.push('/workouts')} style={styles.recommend}><View style={styles.recommendIcon}><Ionicons name="body-outline" size={20} color={colors.primary} /></View><View style={{ flex: 1 }}><AppText weight="semibold">Log your next session</AppText><AppText style={styles.muted}>Keep your movement history up to date.</AppText></View><Ionicons name="chevron-forward" size={17} color={colors.tertiaryText} /></TouchableOpacity></View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 24 },
  eyebrow: { color: colors.primary, fontSize: 10, letterSpacing: 1.4, marginBottom: 7 },
  subtitle: { color: colors.secondaryText, marginTop: 6 },
  hero: { minHeight: 184, borderRadius: 28, overflow: 'hidden', marginTop: 22, backgroundColor: colors.primaryDark, padding: 20, justifyContent: 'flex-end' },
  image: { ...StyleSheet.absoluteFillObject, width: undefined, height: undefined },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(13,38,29,0.4)' },
  heroCopy: { paddingRight: 54 },
  heroEyebrow: { color: colors.mint, fontSize: 10, letterSpacing: 1.3 },
  heroTitle: { color: '#fff', lineHeight: 29, marginTop: 7 },
  heroMeta: { color: 'rgba(255,255,255,0.82)', fontSize: 12, marginTop: 9 },
  start: { position: 'absolute', right: 18, bottom: 18, width: 44, height: 44, borderRadius: 16, backgroundColor: colors.mint, alignItems: 'center', justifyContent: 'center' },
  section: { marginTop: 28 },
  progressCard: { padding: 18, borderRadius: 24, backgroundColor: colors.glassLight, borderWidth: 1, borderColor: colors.border, marginTop: 14 },
  progressTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  progressIcon: { width: 44, height: 44, borderRadius: 15, backgroundColor: colors.mint, alignItems: 'center', justifyContent: 'center' },
  muted: { color: colors.secondaryText, fontSize: 12, marginTop: 3 },
  historyHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statusCard: { marginTop: 14, backgroundColor: colors.glassMedium, alignItems: 'center' },
  statusText: { color: colors.secondaryText, marginTop: 12, textAlign: 'center' },
  errorText: { color: colors.danger, fontSize: 12, textAlign: 'center' },
  retry: { marginTop: 12, paddingVertical: 8, paddingHorizontal: 16, borderRadius: 12, backgroundColor: colors.mint },
  retryText: { color: colors.primary, fontSize: 12 },
  trackButton: { marginTop: 14, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 14, backgroundColor: colors.mint },
  trackText: { color: colors.primary, fontSize: 12 },
  workoutCard: { marginTop: 10, backgroundColor: colors.glassMedium },
  workoutRow: { flexDirection: 'row', alignItems: 'center' },
  workoutIcon: { width: 38, height: 38, borderRadius: 13, backgroundColor: colors.mint, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  workoutCopy: { flex: 1 },
  workoutMeta: { color: colors.secondaryText, fontSize: 12, marginTop: 4 },
  recommend: { flexDirection: 'row', alignItems: 'center', padding: 15, marginTop: 14, borderRadius: 22, backgroundColor: colors.glassLight, borderWidth: 1, borderColor: colors.border, marginBottom: 28 },
  recommendIcon: { width: 38, height: 38, borderRadius: 13, backgroundColor: colors.mint, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
});
