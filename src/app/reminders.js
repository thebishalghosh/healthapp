import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Platform, RefreshControl, ScrollView, StyleSheet, Switch, TextInput, TouchableOpacity, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import AppText from '../components/ui/AppText';
import GlassCard from '../components/ui/GlassCard';
import GradientBackground from '../components/ui/GradientBackground';
import PrimaryButton from '../components/ui/PrimaryButton';
import SectionHeader from '../components/ui/SectionHeader';
import colors from '../constants/colors';
import { useAuth } from '../context/AuthContext';
import { cancelReminderNotifications, createReminder, deleteReminder, listReminders, reconcileReminderNotifications, scheduleReminderNotification, updateReminder } from '../services/reminders';

const TYPES = [
  { value: 'water', label: 'Water', icon: 'water-outline', color: colors.blue, title: 'Drink water', message: 'Take a moment to hydrate.' },
  { value: 'meal', label: 'Meal', icon: 'restaurant-outline', color: colors.amber, title: 'Meal time', message: 'Remember to log your meal.' },
  { value: 'workout', label: 'Workout', icon: 'fitness-outline', color: colors.mint, title: 'Move your body', message: 'Time for your workout.' },
  { value: 'sleep', label: 'Sleep', icon: 'moon-outline', color: colors.lavender, title: 'Wind down', message: 'Prepare for a restful night.' },
];
const REPEATS = [{ value: 'once', label: 'Once' }, { value: 'daily', label: 'Daily' }, { value: 'weekly', label: 'Weekly' }, { value: 'custom', label: 'Custom' }];
const DAYS = [{ value: 1, label: 'Sun' }, { value: 2, label: 'Mon' }, { value: 3, label: 'Tue' }, { value: 4, label: 'Wed' }, { value: 5, label: 'Thu' }, { value: 6, label: 'Fri' }, { value: 7, label: 'Sat' }];
const EMPTY_FORM = { type: 'water', title: 'Drink water', message: 'Take a moment to hydrate.', time: '09:00', repeat: 'daily', days: [2, 4, 6], startDate: '', endDate: '', enabled: true };

function normalizeReminder(value) {
  let repeatDays = value.repeat_days;
  if (typeof repeatDays === 'string') {
    try { repeatDays = JSON.parse(repeatDays); } catch (error) { repeatDays = []; }
  }
  return { ...value, id: Number(value.id), is_enabled: Boolean(Number(value.is_enabled ?? value.enabled)), repeat_days: Array.isArray(repeatDays) ? repeatDays.map(Number).filter(Boolean) : [] };
}

function timeDate(value) {
  const [hour, minute] = String(value || '09:00').split(':').map(Number);
  const date = new Date();
  date.setHours(hour || 0, minute || 0, 0, 0);
  return date;
}

function formatTime(value) {
  const [hour, minute] = String(value || '').split(':').map(Number);
  if (!Number.isInteger(hour) || !Number.isInteger(minute)) return 'Select time';
  const date = new Date();
  date.setHours(hour, minute, 0, 0);
  return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

function formatRepeat(reminder) {
  if (reminder.repeat_type === 'once') return 'Once';
  if (reminder.repeat_type === 'daily') return 'Every day';
  const labels = (reminder.repeat_days || []).map((day) => DAYS.find((item) => item.value === Number(day))?.label).filter(Boolean);
  return labels.length ? labels.join(', ') : 'Selected days';
}

function reminderBody(form) {
  return {
    reminder_type: form.type,
    title: form.title.trim(),
    message: form.message.trim() || null,
    reminder_time: form.time,
    start_date: form.startDate || null,
    end_date: form.endDate || null,
    repeat_type: form.repeat,
    repeat_days: form.repeat === 'weekly' || form.repeat === 'custom' ? form.days : null,
    is_enabled: form.enabled,
  };
}

export default function Reminders() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const loadReminders = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const next = (await listReminders()).map(normalizeReminder);
      setReminders(next);
      if (user?.id) await reconcileReminderNotifications(user.id, next);
    } catch (loadError) {
      setError(loadError.message || 'Unable to load reminders. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useFocusEffect(useCallback(() => { loadReminders(); }, [loadReminders]));

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setError('');
    setNotice('');
  };

  const selectType = (type) => {
    const preset = TYPES.find((item) => item.value === type) || TYPES[0];
    setForm((current) => ({ ...current, type, title: current.title === TYPES.find((item) => item.value === current.type)?.title ? preset.title : current.title, message: current.message === TYPES.find((item) => item.value === current.type)?.message ? preset.message : current.message }));
  };

  const validate = () => {
    if (!form.title.trim()) return 'A reminder title is required.';
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(form.time)) return 'Choose a valid reminder time.';
    if ((form.repeat === 'weekly' || form.repeat === 'custom') && !form.days.length) return 'Select at least one day.';
    if (form.startDate && !/^\d{4}-\d{2}-\d{2}$/.test(form.startDate)) return 'Start date must use YYYY-MM-DD.';
    if (form.endDate && !/^\d{4}-\d{2}-\d{2}$/.test(form.endDate)) return 'End date must use YYYY-MM-DD.';
    return '';
  };

  const refreshAfterSave = async (body, existingId) => {
    const next = (await listReminders()).map(normalizeReminder);
    setReminders(next);
    const saved = existingId ? next.find((item) => item.id === existingId) : next.find((item) => item.title === body.title && item.reminder_type === body.reminder_type);
    if (saved?.is_enabled && user?.id) {
      const scheduledIds = await scheduleReminderNotification(user.id, saved);
      setNotice(scheduledIds.length ? 'Reminder saved and scheduled.' : 'Reminder saved. Notifications are disabled on this device.');
    } else setNotice('Reminder saved.');
  };

  const saveReminder = async () => {
    const validationError = validate();
    if (validationError) { setError(validationError); return; }
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const body = reminderBody(form);
      if (editing) {
        await cancelReminderNotifications(user?.id, editing.id);
        await updateReminder(editing.id, body);
        await refreshAfterSave(body, editing.id);
      } else {
        const created = await createReminder(body);
        const createdId = Number(created?.reminder?.id || created?.id);
        if (createdId) {
          const next = (await listReminders()).map(normalizeReminder);
          setReminders(next);
          const saved = next.find((item) => item.id === createdId);
          if (saved?.is_enabled && user?.id) {
            const scheduledIds = await scheduleReminderNotification(user.id, saved);
            setNotice(scheduledIds.length ? 'Reminder saved and scheduled.' : 'Reminder saved. Notifications are disabled on this device.');
          } else setNotice('Reminder saved.');
        } else {
          await refreshAfterSave(body, null);
        }
      }
      setEditing(null);
      setForm(EMPTY_FORM);
    } catch (saveError) {
      setError(saveError.message || 'Unable to save this reminder. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const toggleReminder = async (reminder) => {
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const enabled = !reminder.is_enabled;
      if (!enabled) await cancelReminderNotifications(user?.id, reminder.id);
      await updateReminder(reminder.id, { is_enabled: enabled });
      const next = (await listReminders()).map(normalizeReminder);
      setReminders(next);
      const updated = next.find((item) => item.id === reminder.id);
      if (enabled && updated) {
        const scheduledIds = await scheduleReminderNotification(user?.id, updated);
        setNotice(scheduledIds.length ? 'Reminder enabled.' : 'Reminder enabled, but notifications are disabled on this device.');
      } else setNotice('Reminder disabled.');
    } catch (toggleError) {
      setError(toggleError.message || 'Unable to update this reminder. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const removeReminder = (reminder) => {
    Alert.alert('Delete reminder?', `Remove ${reminder.title}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        setSaving(true);
        try {
          await deleteReminder(reminder.id);
          await cancelReminderNotifications(user?.id, reminder.id);
          setReminders((current) => current.filter((item) => item.id !== reminder.id));
          setNotice('Reminder deleted.');
        } catch (deleteError) {
          setError(deleteError.message || 'Unable to delete this reminder. Please try again.');
        } finally { setSaving(false); }
      } },
    ]);
  };

  const beginEdit = (reminder) => {
    setEditing(reminder);
    setForm({ type: reminder.reminder_type, title: reminder.title, message: reminder.message || '', time: String(reminder.reminder_time).slice(0, 5), repeat: reminder.repeat_type, days: reminder.repeat_days, startDate: reminder.start_date || '', endDate: reminder.end_date || '', enabled: reminder.is_enabled });
    setError('');
    setNotice('');
  };

  return (
    <GradientBackground style={styles.container} innerStyle={styles.backgroundContent}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <ScrollView refreshControl={<RefreshControl refreshing={loading || saving} onRefresh={loadReminders} tintColor={colors.primary} />} contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.header}><TouchableOpacity accessibilityLabel="Go back" accessibilityRole="button" onPress={() => router.back()} style={styles.backButton}><Ionicons name="arrow-back" size={21} color={colors.primary} /></TouchableOpacity><View style={styles.headerCopy}><AppText style={styles.eyebrow}>PERSONAL RHYTHM</AppText><AppText weight="bold" size={30}>Smart Reminders</AppText><AppText style={styles.subtitle}>Keep helpful moments close without adding noise.</AppText></View><View style={styles.headerIcon}><Ionicons name="notifications-outline" size={22} color={colors.primary} /></View></View>
          {error ? <GlassCard style={styles.message}><AppText style={styles.errorText}>{error}</AppText></GlassCard> : null}
          {notice ? <GlassCard style={styles.message}><AppText style={styles.noticeText}>{notice}</AppText></GlassCard> : null}
          <View style={styles.section}><View style={styles.sectionHeader}><SectionHeader title="Your reminders" />{loading ? <ActivityIndicator color={colors.primary} /> : null}</View>{!loading && !reminders.length ? <GlassCard style={styles.empty}><Ionicons name="notifications-off-outline" size={25} color={colors.primary} /><AppText style={styles.statusText}>No reminders yet.</AppText></GlassCard> : null}{reminders.map((reminder) => <GlassCard key={String(reminder.id)} style={styles.card}><View style={styles.cardRow}><View style={[styles.typeIcon, { backgroundColor: TYPES.find((type) => type.value === reminder.reminder_type)?.color || colors.mint }]}><Ionicons name={TYPES.find((type) => type.value === reminder.reminder_type)?.icon || 'notifications-outline'} size={19} color={colors.text} /></View><View style={styles.cardCopy}><AppText weight="semibold">{reminder.title}</AppText><AppText style={styles.muted}>{TYPES.find((type) => type.value === reminder.reminder_type)?.label || reminder.reminder_type} · {formatTime(reminder.reminder_time)}</AppText><AppText style={styles.muted}>{formatRepeat(reminder)}</AppText></View><Switch value={reminder.is_enabled} onValueChange={() => toggleReminder(reminder)} disabled={saving} trackColor={{ false: colors.border, true: colors.mint }} thumbColor={reminder.is_enabled ? colors.primary : colors.tertiaryText} /></View><View style={styles.actions}><TouchableOpacity onPress={() => beginEdit(reminder)} disabled={saving} style={styles.action}><Ionicons name="create-outline" size={17} color={colors.primary} /><AppText style={styles.actionText}>Edit</AppText></TouchableOpacity><TouchableOpacity onPress={() => removeReminder(reminder)} disabled={saving} style={[styles.action, styles.deleteAction]}><Ionicons name="trash-outline" size={17} color={colors.danger} /><AppText style={styles.deleteText}>Delete</AppText></TouchableOpacity></View></GlassCard>)}</View>
          <View style={styles.section}><SectionHeader title={editing ? 'Edit reminder' : 'Add reminder'} /><View style={styles.formCard}><AppText weight="semibold" style={styles.formLabel}>Reminder type</AppText><View style={styles.typeGrid}>{TYPES.map((type) => <TouchableOpacity key={type.value} onPress={() => selectType(type.value)} style={[styles.typeButton, { backgroundColor: type.color }, form.type === type.value && styles.typeActive]}><Ionicons name={type.icon} size={16} color={colors.text} /><AppText weight="semibold" style={styles.typeText}>{type.label}</AppText></TouchableOpacity>)}</View><FormField label="Title" value={form.title} onChangeText={(value) => updateField('title', value)} placeholder="Reminder title" /><FormField label="Message" value={form.message} onChangeText={(value) => updateField('message', value)} placeholder="Optional message" /><AppText weight="semibold" style={styles.formLabel}>Time</AppText><TouchableOpacity onPress={() => setShowTimePicker(true)} style={styles.timeButton}><Ionicons name="time-outline" size={18} color={colors.primary} /><AppText weight="semibold" style={styles.timeText}>{formatTime(form.time)}</AppText></TouchableOpacity>{showTimePicker ? <DateTimePicker value={timeDate(form.time)} mode="time" is24Hour={false} display={Platform.OS === 'ios' ? 'spinner' : 'default'} onChange={(event, value) => { setShowTimePicker(Platform.OS === 'ios'); if (value) updateField('time', `${String(value.getHours()).padStart(2, '0')}:${String(value.getMinutes()).padStart(2, '0')}`); }} /> : null}<AppText weight="semibold" style={styles.formLabel}>Repeat</AppText><View style={styles.repeatGrid}>{REPEATS.map((repeat) => <TouchableOpacity key={repeat.value} onPress={() => updateField('repeat', repeat.value)} style={[styles.repeatButton, form.repeat === repeat.value && styles.repeatActive]}><AppText weight="semibold" style={styles.repeatText}>{repeat.label}</AppText></TouchableOpacity>)}</View>{form.repeat === 'weekly' || form.repeat === 'custom' ? <><AppText weight="semibold" style={styles.formLabel}>Days</AppText><View style={styles.daysGrid}>{DAYS.map((day) => <TouchableOpacity key={day.value} onPress={() => updateField('days', form.days.includes(day.value) ? form.days.filter((value) => value !== day.value) : [...form.days, day.value])} style={[styles.dayButton, form.days.includes(day.value) && styles.dayActive]}><AppText weight="semibold" style={styles.dayText}>{day.label}</AppText></TouchableOpacity>)}</View></> : null}<FormField label="Start date (optional)" value={form.startDate} onChangeText={(value) => updateField('startDate', value)} placeholder="YYYY-MM-DD" keyboardType="numbers-and-punctuation" /><FormField label="End date (optional)" value={form.endDate} onChangeText={(value) => updateField('endDate', value)} placeholder="YYYY-MM-DD" keyboardType="numbers-and-punctuation" /><View style={styles.enabledRow}><AppText weight="semibold">Enabled</AppText><Switch value={form.enabled} onValueChange={(value) => updateField('enabled', value)} trackColor={{ false: colors.border, true: colors.mint }} thumbColor={form.enabled ? colors.primary : colors.tertiaryText} /></View>{editing ? <TouchableOpacity onPress={() => { setEditing(null); setForm(EMPTY_FORM); }} style={styles.cancel}><AppText weight="semibold" style={styles.cancelText}>Cancel edit</AppText></TouchableOpacity> : null}<PrimaryButton title={editing ? 'Save changes' : 'Save reminder'} onPress={saveReminder} loading={saving} disabled={saving} style={styles.saveButton} /></View></View>
        </ScrollView>
      </SafeAreaView>
    </GradientBackground>
  );
}

function FormField({ label, value, onChangeText, placeholder, keyboardType }) {
  return <View style={styles.field}><AppText weight="semibold" style={styles.fieldLabel}>{label}</AppText><TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={colors.tertiaryText} keyboardType={keyboardType || 'default'} style={styles.input} /></View>;
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
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  card: { marginTop: 10, backgroundColor: colors.glassMedium },
  cardRow: { flexDirection: 'row', alignItems: 'center' },
  typeIcon: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  cardCopy: { flex: 1 },
  muted: { color: colors.secondaryText, fontSize: 12, marginTop: 4 },
  actions: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: colors.border, marginTop: 15, paddingTop: 12 },
  action: { flexDirection: 'row', alignItems: 'center', marginRight: 18 },
  actionText: { color: colors.primary, fontSize: 12, marginLeft: 5 },
  deleteAction: { marginLeft: 'auto', marginRight: 0 },
  deleteText: { color: colors.danger, fontSize: 12, marginLeft: 5 },
  empty: { marginTop: 14, alignItems: 'center', backgroundColor: colors.glassMedium },
  statusText: { color: colors.secondaryText, marginTop: 12, textAlign: 'center' },
  message: { marginTop: 14, backgroundColor: colors.glassMedium },
  errorText: { color: colors.danger, fontSize: 12 },
  noticeText: { color: colors.success, fontSize: 12 },
  formCard: { marginTop: 14, padding: 18, borderRadius: 24, backgroundColor: colors.glassLight, borderWidth: 1, borderColor: colors.border },
  formLabel: { fontSize: 12, color: colors.secondaryText, marginTop: 16, marginBottom: 8 },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeButton: { minHeight: 40, paddingHorizontal: 12, borderRadius: 13, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: 'transparent' },
  typeActive: { borderColor: colors.primary },
  typeText: { fontSize: 12, marginLeft: 5 },
  field: { marginTop: 12 },
  fieldLabel: { color: colors.secondaryText, fontSize: 12, marginBottom: 7 },
  input: { minHeight: 50, borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, paddingHorizontal: 14, color: colors.text, fontSize: 15 },
  timeButton: { minHeight: 50, borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center' },
  timeText: { color: colors.primary, marginLeft: 8, fontSize: 15 },
  repeatGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  repeatButton: { paddingHorizontal: 13, minHeight: 38, borderRadius: 12, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  repeatActive: { backgroundColor: colors.mint, borderColor: colors.primary },
  repeatText: { color: colors.secondaryText, fontSize: 12 },
  daysGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  dayButton: { width: 38, height: 38, borderRadius: 12, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  dayActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  dayText: { color: colors.secondaryText, fontSize: 10 },
  enabledRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 18 },
  cancel: { alignItems: 'center', paddingVertical: 14 },
  cancelText: { color: colors.secondaryText },
  saveButton: { marginTop: 8 },
});
