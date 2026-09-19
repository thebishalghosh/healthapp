import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Platform, RefreshControl, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import AppText from '../components/ui/AppText';
import GlassCard from '../components/ui/GlassCard';
import GradientBackground from '../components/ui/GradientBackground';
import PrimaryButton from '../components/ui/PrimaryButton';
import colors from '../constants/colors';
import { api } from '../services/api';
import tokenStorage from '../services/tokenStorage';

function localDateValue() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function dateValue(value) {
  const [year, month, day] = String(value).split('-').map(Number);
  return new Date(year, (month || 1) - 1, day || 1, 12, 0, 0);
}

function timeValue(value) {
  const [hour, minute] = String(value || '23:00').split(':').map(Number);
  const date = new Date();
  date.setHours(hour || 0, minute || 0, 0, 0);
  return date;
}

function displayTime(value) {
  return timeValue(value).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

function durationLabel(minutes) {
  const value = Number(minutes || 0);
  return `${Math.floor(value / 60)}h ${value % 60}m`;
}

function formFromSleep(sleep) {
  return {
    sleepDate: sleep?.sleep_date || localDateValue(),
    bedtime: String(sleep?.bedtime || '23:00').slice(0, 5),
    wakeTime: String(sleep?.wake_time || '07:00').slice(0, 5),
  };
}

function toBody(form) {
  return { sleep_date: form.sleepDate, bedtime: form.bedtime, wake_time: form.wakeTime };
}

export default function Sleep() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [sleep, setSleep] = useState(null);
  const [history, setHistory] = useState([]);
  const [form, setForm] = useState(formFromSleep());
  const [editing, setEditing] = useState(false);
  const [picker, setPicker] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadSleep = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const token = await tokenStorage.get();
      if (!token) return;
      const [todayResponse, historyResponse] = await Promise.all([api.getSleep(token), api.getSleepHistory(token)]);
      const current = todayResponse?.sleep || null;
      setSleep(current);
      setHistory(historyResponse?.sleep?.entries || []);
      if (!editing) setForm(formFromSleep(current));
    } catch (loadError) {
      setError(loadError.message || 'Unable to load sleep data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [editing]);

  useFocusEffect(useCallback(() => { loadSleep(); }, [loadSleep]));

  const updateForm = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setError('');
    setNotice('');
  };

  const saveSleep = async () => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(form.sleepDate) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(form.bedtime) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(form.wakeTime)) {
      setError('Enter a valid date, bedtime, and wake-up time.');
      return;
    }
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const token = await tokenStorage.get();
      if (!token) throw new Error('Authentication is required to save sleep.');
      if (editing && sleep?.id) await api.updateSleep(token, sleep.id, toBody(form));
      else await api.addSleep(token, toBody(form));
      setEditing(false);
      setNotice('Sleep saved.');
      await loadSleep();
    } catch (saveError) {
      setError(saveError.message || 'Unable to save sleep. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const removeSleep = () => {
    if (!sleep?.id) return;
    Alert.alert('Delete sleep log?', 'This will remove the current sleep entry.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        setSaving(true);
        try {
          const token = await tokenStorage.get();
          await api.deleteSleep(token, sleep.id);
          setSleep(null);
          setEditing(false);
          setForm(formFromSleep(null));
          setNotice('Sleep deleted.');
          await loadSleep();
        } catch (deleteError) {
          setError(deleteError.message || 'Unable to delete sleep. Please try again.');
        } finally {
          setSaving(false);
        }
      } },
    ]);
  };

  const showPicker = (type) => setPicker(type);
  const pickerValue = picker === 'date' ? dateValue(form.sleepDate) : timeValue(picker === 'bedtime' ? form.bedtime : form.wakeTime);
  const handlePickerChange = (event, value) => {
    if (Platform.OS !== 'ios') setPicker(null);
    if (!value) return;
    if (picker === 'date') updateForm('sleepDate', `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`);
    else updateForm(picker, `${String(value.getHours()).padStart(2, '0')}:${String(value.getMinutes()).padStart(2, '0')}`);
  };

  return (
    <GradientBackground style={styles.container} innerStyle={styles.backgroundContent}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <ScrollView refreshControl={<RefreshControl refreshing={loading || saving} onRefresh={loadSleep} tintColor={colors.primary} />} contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]} showsVerticalScrollIndicator={false}>
          <View style={styles.header}><TouchableOpacity accessibilityLabel="Go back" accessibilityRole="button" onPress={() => router.back()} style={styles.backButton}><Ionicons name="arrow-back" size={21} color={colors.primary} /></TouchableOpacity><View style={styles.headerCopy}><AppText style={styles.eyebrow}>REST & RECOVERY</AppText><AppText weight="bold" size={30}>Sleep Tracking</AppText><AppText style={styles.subtitle}>Capture your sleep rhythm and keep recovery visible.</AppText></View><View style={styles.headerIcon}><Ionicons name="moon-outline" size={22} color={colors.primary} /></View></View>
          {error ? <GlassCard style={styles.message}><AppText style={styles.errorText}>{error}</AppText></GlassCard> : null}
          {notice ? <GlassCard style={styles.message}><AppText style={styles.noticeText}>{notice}</AppText></GlassCard> : null}
          {sleep && !editing ? <GlassCard style={styles.summary}><AppText style={styles.cardEyebrow}>LATEST SLEEP</AppText><AppText weight="bold" size={32} style={styles.duration}>{durationLabel(sleep.duration_minutes)}</AppText><AppText style={styles.muted}>{sleep.sleep_date} · {displayTime(sleep.bedtime)} to {displayTime(sleep.wake_time)}</AppText><View style={styles.actions}><TouchableOpacity onPress={() => { setForm(formFromSleep(sleep)); setEditing(true); }} style={styles.action}><Ionicons name="create-outline" size={17} color={colors.primary} /><AppText style={styles.actionText}>Edit</AppText></TouchableOpacity><TouchableOpacity onPress={removeSleep} style={[styles.action, styles.deleteAction]}><Ionicons name="trash-outline" size={17} color={colors.danger} /><AppText style={styles.deleteText}>Delete</AppText></TouchableOpacity></View></GlassCard> : null}
          {!sleep && !loading && !editing ? <GlassCard style={styles.empty}><Ionicons name="moon-outline" size={25} color={colors.primary} /><AppText weight="semibold" style={styles.emptyTitle}>No sleep logged yet.</AppText><AppText style={styles.muted}>Add last night's sleep to see your recovery here.</AppText></GlassCard> : null}
          <View style={styles.section}><AppText weight="semibold" size={20}>{editing ? 'Edit sleep' : 'Log sleep'}</AppText><View style={styles.formCard}><FormButton label="Sleep date" value={form.sleepDate} icon="calendar-outline" onPress={() => showPicker('date')} /><FormButton label="Bedtime" value={displayTime(form.bedtime)} icon="moon-outline" onPress={() => showPicker('bedtime')} /><FormButton label="Wake-up time" value={displayTime(form.wakeTime)} icon="sunny-outline" onPress={() => showPicker('wakeTime')} />{picker ? <DateTimePicker value={pickerValue} mode={picker === 'date' ? 'date' : 'time'} is24Hour={false} display={Platform.OS === 'ios' ? 'spinner' : 'default'} onChange={handlePickerChange} /> : null}<PrimaryButton title={editing ? 'Save changes' : 'Save sleep'} onPress={saveSleep} loading={saving} disabled={saving} style={styles.saveButton} />{editing ? <TouchableOpacity onPress={() => { setEditing(false); setForm(formFromSleep(sleep)); }} style={styles.cancel}><AppText style={styles.muted}>Cancel</AppText></TouchableOpacity> : null}</View></View>
          <View style={styles.section}><AppText weight="semibold" size={20}>Sleep history</AppText>{history.length ? history.map((entry) => <GlassCard key={String(entry.id)} style={styles.historyCard}><View style={styles.historyRow}><View><AppText weight="semibold">{entry.sleep_date}</AppText><AppText style={styles.muted}>{displayTime(entry.bedtime)} to {displayTime(entry.wake_time)}</AppText></View><AppText weight="bold" style={styles.historyDuration}>{durationLabel(entry.duration_minutes)}</AppText></View></GlassCard>) : <AppText style={styles.muted}>Your saved sleep entries will appear here.</AppText>}</View>
        </ScrollView>
      </SafeAreaView>
    </GradientBackground>
  );
}

function FormButton({ label, value, icon, onPress }) {
  return <View style={styles.field}><AppText weight="semibold" style={styles.fieldLabel}>{label}</AppText><TouchableOpacity onPress={onPress} style={styles.inputButton}><Ionicons name={icon} size={18} color={colors.primary} /><AppText weight="semibold" style={styles.inputValue}>{value}</AppText></TouchableOpacity></View>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  backgroundContent: { padding: 0 },
  safeArea: { flex: 1 },
  content: { paddingHorizontal: 24, paddingTop: 10 },
  header: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 24 },
  backButton: { width: 42, height: 42, borderRadius: 15, backgroundColor: colors.mint, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  headerCopy: { flex: 1 },
  headerIcon: { width: 42, height: 42, borderRadius: 15, backgroundColor: colors.lavender, alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
  eyebrow: { color: colors.primary, fontSize: 10, letterSpacing: 1.4, marginBottom: 7 },
  subtitle: { color: colors.secondaryText, marginTop: 6, lineHeight: 20 },
  section: { marginTop: 28 },
  summary: { backgroundColor: colors.glassMedium },
  cardEyebrow: { color: colors.secondaryText, fontSize: 10, letterSpacing: 1.3 },
  duration: { color: colors.primary, marginTop: 8 },
  muted: { color: colors.secondaryText, fontSize: 12, marginTop: 4 },
  actions: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: colors.border, marginTop: 15, paddingTop: 12 },
  action: { flexDirection: 'row', alignItems: 'center', marginRight: 18 },
  actionText: { color: colors.primary, fontSize: 12, marginLeft: 5 },
  deleteAction: { marginLeft: 'auto', marginRight: 0 },
  deleteText: { color: colors.danger, fontSize: 12, marginLeft: 5 },
  empty: { alignItems: 'center', backgroundColor: colors.glassMedium },
  emptyTitle: { marginTop: 12 },
  message: { marginBottom: 14, backgroundColor: colors.glassMedium },
  errorText: { color: colors.danger, fontSize: 12 },
  noticeText: { color: colors.success, fontSize: 12 },
  formCard: { marginTop: 14, padding: 18, borderRadius: 24, backgroundColor: colors.glassLight, borderWidth: 1, borderColor: colors.border },
  field: { marginBottom: 14 },
  fieldLabel: { color: colors.secondaryText, fontSize: 12, marginBottom: 7 },
  inputButton: { minHeight: 50, borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center' },
  inputValue: { color: colors.primary, marginLeft: 8, fontSize: 15 },
  saveButton: { marginTop: 4 },
  cancel: { alignItems: 'center', paddingVertical: 14 },
  historyCard: { marginTop: 10, backgroundColor: colors.glassMedium },
  historyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  historyDuration: { color: colors.primary },
});
