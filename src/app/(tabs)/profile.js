import React, { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import AppText from '../../components/ui/AppText';
import GlassCard from '../../components/ui/GlassCard';
import GradientBackground from '../../components/ui/GradientBackground';
import PrimaryButton from '../../components/ui/PrimaryButton';
import colors from '../../constants/colors';
import { useAuth } from '../../context/AuthContext';
import { activityLabels, formatDateForDisplay, goalLabels } from '../../services/profile';
import { cancelAllReminderNotifications } from '../../services/reminders';

function initials(user) {
  const values = [user?.first_name, user?.last_name].filter(Boolean);
  return values.length ? values.map((value) => value.trim().charAt(0).toUpperCase()).join('').slice(0, 2) : '?';
}

function display(value) {
  return value === null || value === undefined || value === '' ? 'Not set' : String(value);
}

function numberWithUnit(value, unit) {
  return value === null || value === undefined ? 'Not set' : `${value} ${unit}`;
}

function ProfileSkeleton() {
  return <View><View style={styles.skeletonHeader}><View style={styles.skeletonAvatar} /><View style={styles.skeletonText}><View style={styles.skeletonLine} /><View style={styles.skeletonLineShort} /></View></View><GlassCard style={styles.skeletonCard}><View style={styles.skeletonBlock} /><View style={styles.skeletonBlockShort} /><View style={styles.skeletonBlock} /></GlassCard><GlassCard style={styles.skeletonCard}><View style={styles.skeletonBlock} /><View style={styles.skeletonBlock} /></GlassCard></View>;
}

function SectionTitle({ title, action, onPress }) {
  return <View style={styles.sectionTitleRow}><AppText weight="semibold" size={19}>{title}</AppText>{action ? <TouchableOpacity onPress={onPress} accessibilityRole="button"><AppText weight="semibold" style={styles.sectionAction}>{action}</AppText></TouchableOpacity> : null}</View>;
}

function InfoRow({ label, value, icon }) {
  return <View style={styles.infoRow}><View style={styles.infoIcon}><Ionicons name={icon} size={17} color={colors.primary} /></View><View style={styles.infoCopy}><AppText style={styles.infoLabel}>{label}</AppText><AppText weight="semibold" style={styles.infoValue}>{value}</AppText></View></View>;
}

function Metric({ label, value, unit, icon, color }) {
  return <View style={styles.metric}><View style={[styles.metricIcon, { backgroundColor: color }]}><Ionicons name={icon} size={16} color={colors.text} /></View><AppText style={styles.metricLabel}>{label}</AppText><AppText weight="semibold" style={styles.metricValue}>{value === null || value === undefined ? '—' : `${Math.round(value)}${unit}`}</AppText></View>;
}

export default function Profile() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { saved } = useLocalSearchParams();
  const { user, loading, profile, profileLoading, profileError, refreshProfile, nutrition, nutritionLoading, nutritionError, refreshNutrition, logout } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [refreshError, setRefreshError] = useState('');

  const refresh = useCallback(async () => {
    setRefreshing(true);
    setRefreshError('');
    try {
      await Promise.all([refreshProfile(), refreshNutrition()]);
    } catch (error) {
      setRefreshError(error.message || 'Unable to refresh your profile. Please try again.');
    } finally {
      setRefreshing(false);
    }
  }, [refreshNutrition, refreshProfile]);

  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await cancelAllReminderNotifications(user?.id);
      await logout();
      router.replace('/(auth)/welcome');
    } finally {
      setLoggingOut(false);
    }
  };

  const isLoading = loading || profileLoading || nutritionLoading;
  const profileUnavailable = profileError && !profileLoading;
  const nutritionUnavailable = nutritionError && !nutritionLoading;
  const fullName = [user?.first_name, user?.last_name].filter(Boolean).join(' ') || 'Your profile';

  return <GradientBackground style={styles.container} innerStyle={styles.backgroundContent}>
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView refreshControl={<RefreshControl refreshing={refreshing || isLoading} onRefresh={refresh} tintColor={colors.primary} />} contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 128 }]} showsVerticalScrollIndicator={false}>
        {isLoading && !profile && !nutrition ? <ProfileSkeleton /> : <>
          <View style={styles.header}><View style={styles.avatar}><AppText weight="bold" size={24} style={styles.avatarText}>{initials(user)}</AppText></View><View style={styles.headerCopy}><AppText weight="bold" size={25}>{fullName}</AppText><AppText style={styles.email}>{display(user?.email)}</AppText></View><TouchableOpacity accessibilityLabel="Edit profile" accessibilityRole="button" onPress={() => router.push('/edit-profile')} style={styles.editButton}><Ionicons name="create-outline" size={19} color={colors.primary} /></TouchableOpacity></View>
          {saved ? <AppText style={styles.successText}>Profile saved successfully.</AppText> : null}
          {refreshError ? <GlassCard style={styles.errorCard}><AppText style={styles.errorText}>{refreshError}</AppText><PrimaryButton title="Retry" onPress={refresh} style={styles.retryButton} /></GlassCard> : null}
          {profileUnavailable ? <GlassCard style={styles.errorCard}><AppText weight="semibold">We couldn't load your profile.</AppText><AppText style={styles.muted}>Your session may still be active. Please try again.</AppText><PrimaryButton title="Retry" onPress={refresh} style={styles.retryButton} /></GlassCard> : null}
          <View style={styles.section}><SectionTitle title="Personal information" action="Edit" onPress={() => router.push('/edit-profile')} /><GlassCard style={styles.card}><View style={styles.infoGrid}><InfoRow label="Date of birth" value={profile?.dateOfBirth ? formatDateForDisplay(profile.dateOfBirth) : 'Not set'} icon="calendar-outline" /><InfoRow label="Age" value={profile?.age === null || profile?.age === undefined ? 'Not set' : `${profile.age} years`} icon="time-outline" /><InfoRow label="Gender" value={display(profile?.gender)} icon="person-outline" /><InfoRow label="Activity level" value={activityLabels[profile?.activityLevel] || display(profile?.activityLevel)} icon="fitness-outline" /></View></GlassCard></View>
          <View style={styles.section}><SectionTitle title="Body & goals" /><GlassCard style={styles.card}><View style={styles.metrics}><Metric label="Height" value={profile?.height} unit=" cm" icon="resize-outline" color={colors.blue} /><Metric label="Weight" value={profile?.weight} unit=" kg" icon="scale-outline" color={colors.mint} /></View><View style={styles.goalRow}><View style={styles.goalIcon}><Ionicons name="flag-outline" size={18} color={colors.primary} /></View><View><AppText style={styles.infoLabel}>Fitness goal</AppText><AppText weight="semibold" style={styles.goalValue}>{goalLabels[profile?.goal] || display(profile?.goal)}</AppText></View></View></GlassCard></View>
          <View style={styles.section}><SectionTitle title="Nutrition targets" /><GlassCard style={styles.card}>{nutritionUnavailable ? <View><AppText weight="semibold">Nutrition targets are unavailable.</AppText><AppText style={styles.muted}>Complete your profile to calculate your nutrition targets.</AppText><PrimaryButton title="Edit Profile" onPress={() => router.push('/edit-profile')} style={styles.retryButton} /></View> : nutrition ? <View style={styles.nutritionGrid}><InfoRow label="Calories" value={numberWithUnit(nutrition.caloriesTarget, 'kcal')} icon="flame-outline" /><InfoRow label="Protein" value={numberWithUnit(nutrition.protein, 'g')} icon="fitness-outline" /><InfoRow label="Carbohydrates" value={numberWithUnit(nutrition.carbohydrates, 'g')} icon="leaf-outline" /><InfoRow label="Fat" value={numberWithUnit(nutrition.fat, 'g')} icon="water-outline" /><InfoRow label="Fiber" value={numberWithUnit(nutrition.fiber, 'g')} icon="nutrition-outline" /><InfoRow label="Water" value={numberWithUnit(nutrition.water, 'ml')} icon="beaker-outline" /></View> : <View><AppText weight="semibold">Complete your profile to calculate your nutrition targets.</AppText><PrimaryButton title="Edit Profile" onPress={() => router.push('/edit-profile')} style={styles.retryButton} /></View>}</GlassCard></View>
          <View style={styles.section}><SectionTitle title="Settings" /><GlassCard style={styles.card}><SettingRow label="Edit Profile" icon="create-outline" onPress={() => router.push('/edit-profile')} /><SettingRow label="Reminders" detail="Manage water, meal, workout, and sleep reminders" icon="notifications-outline" onPress={() => router.push('/reminders')} /><SettingRow label="Change Password" detail="Not available in this app version" icon="lock-closed-outline" /><SettingRow label="Delete Account/Data" detail="Not available in this app version" icon="trash-outline" isLast /></GlassCard></View>
          <View style={styles.section}><SectionTitle title="Account" /><PrimaryButton title="Sign Out" onPress={handleLogout} loading={loggingOut} disabled={loggingOut} style={styles.logout} /></View>
        </>}
      </ScrollView>
    </SafeAreaView>
  </GradientBackground>;
}

function SettingRow({ label, detail, icon, onPress, isLast }) {
  const content = <View style={[styles.settingRow, isLast && styles.settingRowLast]}><View style={styles.settingIcon}><Ionicons name={icon} size={18} color={colors.primary} /></View><View style={styles.settingCopy}><AppText weight="semibold">{label}</AppText>{detail ? <AppText style={styles.muted}>{detail}</AppText> : null}</View>{onPress ? <Ionicons name="chevron-forward" size={17} color={colors.tertiaryText} /> : <AppText style={styles.unavailable}>Unavailable</AppText>}</View>;
  return onPress ? <TouchableOpacity onPress={onPress} accessibilityRole="button">{content}</TouchableOpacity> : content;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  backgroundContent: { padding: 0 },
  safeArea: { flex: 1 },
  content: { paddingHorizontal: 24, paddingTop: 10 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
  avatar: { width: 72, height: 72, borderRadius: 24, backgroundColor: colors.mint, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  avatarText: { color: colors.primary },
  headerCopy: { flex: 1 },
  email: { color: colors.secondaryText, fontSize: 13, marginTop: 5 },
  editButton: { width: 42, height: 42, borderRadius: 15, backgroundColor: colors.glassLight, alignItems: 'center', justifyContent: 'center' },
  successText: { color: colors.success, fontSize: 12, marginBottom: 4 },
  section: { marginTop: 26 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  sectionAction: { color: colors.primary, fontSize: 12 },
  card: { backgroundColor: colors.glassMedium },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 18 },
  infoRow: { flexDirection: 'row', alignItems: 'center', flex: 1, minWidth: '44%' },
  infoIcon: { width: 32, height: 32, borderRadius: 11, backgroundColor: colors.mint, alignItems: 'center', justifyContent: 'center', marginRight: 9 },
  infoCopy: { flex: 1 },
  infoLabel: { color: colors.secondaryText, fontSize: 10, letterSpacing: 0.4, textTransform: 'uppercase' },
  infoValue: { fontSize: 13, marginTop: 4 },
  metrics: { flexDirection: 'row', gap: 10 },
  metric: { flex: 1, padding: 13, borderRadius: 18, backgroundColor: colors.glassLight, borderWidth: 1, borderColor: colors.border },
  metricIcon: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 9 },
  metricLabel: { color: colors.secondaryText, fontSize: 11 },
  metricValue: { fontSize: 17, marginTop: 4 },
  goalRow: { flexDirection: 'row', alignItems: 'center', marginTop: 16, paddingTop: 15, borderTopWidth: 1, borderTopColor: colors.border },
  goalIcon: { width: 34, height: 34, borderRadius: 11, backgroundColor: colors.amber, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  goalValue: { marginTop: 4 },
  nutritionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 18 },
  errorCard: { marginTop: 14, backgroundColor: colors.glassMedium },
  errorText: { color: colors.danger, fontSize: 12 },
  muted: { color: colors.secondaryText, fontSize: 12, marginTop: 4 },
  retryButton: { marginTop: 16 },
  settingRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: colors.border },
  settingRowLast: { borderBottomWidth: 0 },
  settingIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: colors.mint, alignItems: 'center', justifyContent: 'center', marginRight: 11 },
  settingCopy: { flex: 1 },
  unavailable: { color: colors.tertiaryText, fontSize: 11 },
  logout: { marginBottom: 18 },
  skeletonHeader: { flexDirection: 'row', alignItems: 'center', marginTop: 14 },
  skeletonAvatar: { width: 72, height: 72, borderRadius: 24, backgroundColor: colors.border, marginRight: 14 },
  skeletonText: { flex: 1 },
  skeletonLine: { width: '60%', height: 18, borderRadius: 8, backgroundColor: colors.border },
  skeletonLineShort: { width: '42%', height: 12, borderRadius: 6, backgroundColor: colors.border, marginTop: 9 },
  skeletonCard: { marginTop: 24, backgroundColor: colors.glassMedium },
  skeletonBlock: { width: '75%', height: 16, borderRadius: 8, backgroundColor: colors.border, marginBottom: 16 },
  skeletonBlockShort: { width: '48%', height: 16, borderRadius: 8, backgroundColor: colors.border, marginBottom: 16 },
});
