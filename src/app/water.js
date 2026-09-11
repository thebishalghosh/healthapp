import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, RefreshControl, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import AppText from '../components/ui/AppText';
import GlassCard from '../components/ui/GlassCard';
import GradientBackground from '../components/ui/GradientBackground';
import PrimaryButton from '../components/ui/PrimaryButton';
import ProgressBar from '../components/ui/ProgressBar';
import colors from '../constants/colors';
import { api } from '../services/api';
import tokenStorage from '../services/tokenStorage';
import { useAuth } from '../context/AuthContext';

const QUICK_AMOUNTS = [250, 500, 750];

function formatAmount(value) {
  return value === null || value === undefined ? '—' : `${Math.round(value)} ml`;
}

function getTodayDate() {
  const date = new Date();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function normalizeHistory(payload) {
  const entries = payload?.water?.entries || payload?.history || payload?.entries || payload?.items || payload?.data || payload || [];
  if (!Array.isArray(entries)) return [];
  return entries
    .map((entry) => ({
      id: entry.id,
      amountMl: entry.amount_ml === null || entry.amount_ml === undefined ? Number(entry.amountMl) : Number(entry.amount_ml),
      consumedAt: entry.consumed_at || entry.created_at || entry.timestamp || entry.time || null,
      source: entry.source || null,
    }))
    .filter((entry) => entry.id !== null && entry.id !== undefined)
    .sort((first, second) => new Date(second.consumedAt || 0).getTime() - new Date(first.consumedAt || 0).getTime());
}

function formatConsumedTime(value) {
  if (!value) return 'Time unavailable';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

export default function Water() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { today, todayLoading, todayError, refreshToday, addWater } = useAuth();
  const [addingWater, setAddingWater] = useState(false);
  const [customAmount, setCustomAmount] = useState('');
  const [waterError, setWaterError] = useState('');
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [deleteError, setDeleteError] = useState('');

  const loadHistory = useCallback(async () => {
    const token = await tokenStorage.get();
    if (!token) return;
    setHistoryLoading(true);
    setHistoryError('');
    try {
      const data = await api.getWaterHistory(token, getTodayDate());
      setHistory(normalizeHistory(data));
    } catch (error) {
      setHistory([]);
      setHistoryError(error.message || 'Unable to load water history. Please try again.');
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    refreshToday().catch(() => {});
    loadHistory();
  }, [loadHistory, refreshToday]));

  const water = today?.water || {};
  const targetMl = water.targetMl;
  const consumedMl = water.consumedMl;
  const remainingMl = water.remainingMl === null || water.remainingMl === undefined
    ? targetMl === null || targetMl === undefined ? null : Math.max(targetMl - (consumedMl || 0), 0)
    : water.remainingMl;
  const percentage = water.percentage === null || water.percentage === undefined
    ? targetMl > 0 ? Math.round(((consumedMl || 0) / targetMl) * 100) : null
    : Math.round(water.percentage);
  const progress = percentage === null ? 0 : percentage / 100;

  const handleAddWater = async (amount) => {
    const amountMl = Number(amount);
    if (!Number.isFinite(amountMl) || amountMl <= 0) {
      setWaterError('Enter a water amount greater than 0 ml.');
      return;
    }

    setAddingWater(true);
    setWaterError('');
    try {
      await addWater(Math.round(amountMl));
      setCustomAmount('');
      await loadHistory();
    } catch (error) {
      setWaterError(error.message || 'Unable to log water. Please try again.');
    } finally {
      setAddingWater(false);
    }
  };

  const confirmDelete = (entry) => {
    Alert.alert('Delete water entry?', `Remove ${formatAmount(entry.amountMl)} from today's history?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteEntry(entry.id) },
    ]);
  };

  const deleteEntry = async (id) => {
    const token = await tokenStorage.get();
    if (!token) return;
    setDeletingId(id);
    setDeleteError('');
    try {
      await api.deleteWater(token, id);
      await Promise.all([loadHistory(), refreshToday()]);
    } catch (error) {
      setDeleteError(error.message || 'Unable to delete this water entry. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  const showTodayError = todayError && !todayLoading;
  const showInitialLoading = todayLoading && !today;

  return (
    <GradientBackground style={styles.container} innerStyle={styles.backgroundContent}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <ScrollView
          refreshControl={<RefreshControl refreshing={todayLoading} onRefresh={() => refreshToday().catch(() => {})} tintColor={colors.primary} />}
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <TouchableOpacity accessibilityLabel="Go back" accessibilityRole="button" onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={21} color={colors.primary} />
            </TouchableOpacity>
            <View style={styles.headerCopy}>
              <AppText style={styles.eyebrow}>DAILY HYDRATION</AppText>
              <AppText weight="bold" size={30}>Water Tracking</AppText>
              <AppText style={styles.subtitle}>Keep your hydration goal within reach.</AppText>
            </View>
            <View style={styles.headerIcon}><Ionicons name="water-outline" size={22} color={colors.primary} /></View>
          </View>

          {showInitialLoading ? <GlassCard style={styles.statusCard}><ActivityIndicator color={colors.primary} /><AppText style={styles.statusText}>Loading today's water data...</AppText></GlassCard> : null}
          {showTodayError ? <GlassCard style={styles.statusCard}><AppText weight="semibold">Today's water data is unavailable.</AppText><AppText style={styles.muted}>Please try again.</AppText><PrimaryButton title="Retry" onPress={() => refreshToday().catch(() => {})} style={styles.retryButton} /></GlassCard> : null}

          {!showInitialLoading && !showTodayError ? <>
            <GlassCard style={styles.summaryCard}>
              <View style={styles.summaryTop}>
                <View>
                  <AppText style={styles.cardEyebrow}>TODAY'S PROGRESS</AppText>
                  <AppText weight="bold" size={34}>{formatAmount(consumedMl)}</AppText>
                  <AppText style={styles.muted}>{targetMl === null || targetMl === undefined ? 'Target unavailable' : `of ${formatAmount(targetMl)}`}</AppText>
                </View>
                <View style={styles.percentageCircle}>
                  <AppText weight="bold" size={20} style={styles.percentageText}>{percentage === null ? '—' : `${percentage}%`}</AppText>
                  <AppText style={styles.percentageLabel}>complete</AppText>
                </View>
              </View>
              <ProgressBar value={progress} color={colors.primary} height={10} />
            </GlassCard>

            <View style={styles.statsRow}>
              <GlassCard style={styles.statCard}><AppText style={styles.statLabel}>TARGET</AppText><AppText weight="semibold" style={styles.statValue}>{formatAmount(targetMl)}</AppText></GlassCard>
              <GlassCard style={styles.statCard}><AppText style={styles.statLabel}>REMAINING</AppText><AppText weight="semibold" style={styles.statValue}>{formatAmount(remainingMl)}</AppText></GlassCard>
            </View>

            <View style={styles.section}>
              <AppText weight="semibold" size={20}>Add water</AppText>
              <AppText style={styles.muted}>Choose a quick amount or enter your own.</AppText>
              <View style={styles.quickAmounts}>
                {QUICK_AMOUNTS.map((amount) => <TouchableOpacity key={amount} activeOpacity={0.7} disabled={addingWater} onPress={() => handleAddWater(amount)} style={[styles.quickButton, addingWater && styles.disabled]}><Ionicons name="add" size={16} color={colors.primary} /><AppText weight="semibold" style={styles.quickText}>{amount} ml</AppText></TouchableOpacity>)}
              </View>
              <View style={styles.customRow}>
                <TextInput
                  value={customAmount}
                  onChangeText={(value) => setCustomAmount(value.replace(/[^0-9]/g, ''))}
                  placeholder="Custom amount"
                  placeholderTextColor={colors.tertiaryText}
                  keyboardType="number-pad"
                  returnKeyType="done"
                  maxLength={5}
                  editable={!addingWater}
                  style={styles.input}
                  onSubmitEditing={() => handleAddWater(customAmount)}
                />
                <PrimaryButton title={addingWater ? 'Adding' : 'Add water'} onPress={() => handleAddWater(customAmount)} loading={addingWater} disabled={!customAmount || addingWater} style={styles.addButton} />
              </View>
              {addingWater ? <ActivityIndicator color={colors.primary} style={styles.addingIndicator} /> : null}
              {waterError ? <AppText style={styles.errorText}>{waterError}</AppText> : null}
            </View>

            <View style={styles.historySection}>
              <View style={styles.historyHeader}><View><AppText weight="semibold" size={20}>Today's entries</AppText><AppText style={styles.muted}>Your logged water intake, newest first.</AppText></View>{historyLoading ? <ActivityIndicator color={colors.primary} /> : null}</View>
              {historyError ? <GlassCard style={styles.historyStatus}><AppText style={styles.errorText}>{historyError}</AppText><PrimaryButton title="Retry" onPress={loadHistory} style={styles.retryButton} /></GlassCard> : null}
              {deleteError ? <AppText style={styles.errorText}>{deleteError}</AppText> : null}
              {!historyLoading && !historyError && history.length === 0 ? <GlassCard style={styles.historyStatus}><Ionicons name="water-outline" size={24} color={colors.primary} /><AppText style={styles.statusText}>No water entries logged today.</AppText></GlassCard> : null}
              {!historyError ? history.map((entry) => <GlassCard style={styles.historyCard} key={String(entry.id)}><View style={styles.historyRow}><View style={styles.historyIcon}><Ionicons name="water-outline" size={18} color={colors.primary} /></View><View style={styles.historyCopy}><AppText weight="semibold">{formatAmount(entry.amountMl)}</AppText><AppText style={styles.muted}>{formatConsumedTime(entry.consumedAt)}{entry.source ? ` · ${entry.source}` : ''}</AppText></View><TouchableOpacity accessibilityLabel={`Delete ${formatAmount(entry.amountMl)} entry`} accessibilityRole="button" onPress={() => confirmDelete(entry)} disabled={deletingId !== null} style={[styles.deleteButton, deletingId === entry.id && styles.disabled]}>{deletingId === entry.id ? <ActivityIndicator size="small" color={colors.danger} /> : <Ionicons name="trash-outline" size={19} color={colors.danger} />}</TouchableOpacity></View></GlassCard>) : null}
            </View>
          </> : null}
        </ScrollView>
      </SafeAreaView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  backgroundContent: { padding: 0 },
  safeArea: { flex: 1 },
  content: { paddingHorizontal: 24, paddingTop: 10 },
  header: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 24 },
  backButton: { width: 42, height: 42, borderRadius: 15, backgroundColor: colors.mint, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  headerCopy: { flex: 1 },
  headerIcon: { width: 42, height: 42, borderRadius: 15, backgroundColor: colors.blue, alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
  eyebrow: { color: colors.primary, fontSize: 10, letterSpacing: 1.4, marginBottom: 7 },
  subtitle: { color: colors.secondaryText, marginTop: 6, lineHeight: 20 },
  summaryCard: { backgroundColor: colors.mint },
  summaryTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  cardEyebrow: { color: colors.secondaryText, fontSize: 10, letterSpacing: 1.2, marginBottom: 7 },
  muted: { color: colors.secondaryText, fontSize: 12, marginTop: 4 },
  percentageCircle: { width: 88, height: 88, borderRadius: 44, borderWidth: 8, borderColor: 'rgba(255,255,255,0.72)', alignItems: 'center', justifyContent: 'center' },
  percentageText: { color: colors.primary },
  percentageLabel: { color: colors.secondaryText, fontSize: 10 },
  statsRow: { flexDirection: 'row', gap: 12, marginTop: 14 },
  statCard: { flex: 1, backgroundColor: colors.glassMedium },
  statLabel: { color: colors.secondaryText, fontSize: 10, letterSpacing: 1.1 },
  statValue: { marginTop: 8, fontSize: 16 },
  section: { marginTop: 30 },
  quickAmounts: { flexDirection: 'row', gap: 8, marginTop: 16 },
  quickButton: { minHeight: 44, flex: 1, borderRadius: 14, backgroundColor: colors.glassMedium, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' },
  quickText: { color: colors.primary, fontSize: 12, marginLeft: 3 },
  customRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 10 },
  input: { flex: 1, minHeight: 56, borderRadius: 18, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.glassMedium, paddingHorizontal: 16, color: colors.text, fontFamily: 'System', fontSize: 15 },
  addButton: { flex: 0.9 },
  addingIndicator: { marginTop: 12 },
  disabled: { opacity: 0.55 },
  errorText: { color: colors.danger, fontSize: 12, marginTop: 10 },
  statusCard: { backgroundColor: colors.glassMedium, alignItems: 'center' },
  statusText: { color: colors.secondaryText, marginTop: 12, textAlign: 'center' },
  retryButton: { width: '100%', marginTop: 16 },
  historySection: { marginTop: 30 },
  historyHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  historyStatus: { marginTop: 14, backgroundColor: colors.glassMedium, alignItems: 'center' },
  historyCard: { marginTop: 10, backgroundColor: colors.glassMedium },
  historyRow: { flexDirection: 'row', alignItems: 'center' },
  historyIcon: { width: 38, height: 38, borderRadius: 13, backgroundColor: colors.blue, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  historyCopy: { flex: 1 },
  deleteButton: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(200,109,104,0.10)' },
});
