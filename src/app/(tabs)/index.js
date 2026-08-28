import React, { useEffect } from 'react';
import { View, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AppText from '../../components/ui/AppText';
import GlassCard from '../../components/ui/GlassCard';
import colors from '../../constants/colors';
import ProgressBar from '../../components/ui/ProgressBar';
import SectionHeader from '../../components/ui/SectionHeader';
import { user, todaysPlan } from '../../data/mockData';
import GradientBackground from '../../components/ui/GradientBackground';
import PrimaryButton from '../../components/ui/PrimaryButton';
import { useAuth } from '../../context/AuthContext';

function ProfileSkeleton() {
  return <GlassCard style={styles.profileCard}><View style={styles.skeletonLine} /><View style={styles.skeletonLineShort} /><View style={styles.profileGrid}>{[1, 2, 3, 4].map((item) => <View key={item} style={styles.skeletonField}><View style={styles.skeletonLabel} /><View style={styles.skeletonValue} /></View>)}</View></GlassCard>;
}

function ProfileValue({ label, value, suffix }) {
  return <View style={styles.profileField}><AppText style={styles.profileLabel}>{label}</AppText><AppText weight="semibold" style={styles.profileValue}>{value === null || value === undefined ? 'Not added yet' : `${value}${suffix || ''}`}</AppText></View>;
}

export default function Home() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user: account, profile, profileLoading, profileError, refreshProfile, nutrition, nutritionLoading, refreshNutrition } = useAuth();
  const firstName = account?.first_name || account?.firstName || '';
  const fullName = profile?.fullName || [account?.first_name, account?.last_name].filter(Boolean).join(' ') || null;

  useEffect(() => {
    if (!profile && !profileLoading && !profileError) refreshProfile().catch(() => {});
  }, [profile, profileLoading, profileError, refreshProfile]);

  useEffect(() => {
    if (profile) refreshNutrition().catch(() => {});
  }, [refreshNutrition, profile]);

  const nutritionCalories = nutrition?.caloriesTarget;
  const nutritionWater = nutrition?.water === null || nutrition?.water === undefined ? null : nutrition.water / 1000;
  const nutritionDetail = nutritionLoading ? 'Loading target' : nutritionCalories === null || nutritionCalories === undefined ? 'Target unavailable' : `0 / ${Math.round(nutritionCalories)} kcal`;
  const waterDetail = nutritionLoading ? 'Loading target' : nutritionWater === null ? 'Target unavailable' : `0 / ${nutritionWater.toFixed(1)}L`;

  return (
    <GradientBackground style={styles.container} innerStyle={styles.backgroundContent}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <ScrollView style={styles.scroll} contentContainerStyle={[styles.content, { paddingTop: 10, paddingBottom: insets.bottom + 128 }]} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View><AppText style={styles.eyebrow}>THURSDAY, 22 AUGUST</AppText><AppText weight="semibold" size={24}>Good morning{firstName ? `, ${firstName}` : ''}</AppText><AppText style={styles.subtle}>Here's your health overview for today.</AppText></View>
          <View style={styles.avatar}><Ionicons name="person-outline" size={21} color={colors.primary} /></View>
        </View>

        {profileLoading && !profile ? <ProfileSkeleton /> : null}
        {profileError && !profileLoading ? <GlassCard style={styles.profileCard}><AppText weight="semibold">We couldn't load your profile</AppText><AppText style={styles.subtle}>Your session is still active. Please try again.</AppText><PrimaryButton title="Retry" onPress={() => refreshProfile().catch(() => {})} style={styles.retryButton} /></GlassCard> : null}
        {profile && !profileLoading ? <GlassCard style={styles.profileCard}><View style={styles.profileCardHeader}><View><AppText weight="semibold">Your profile</AppText><AppText style={styles.subtle}>{fullName || 'Complete your profile to personalize HealthAI.'}</AppText></View><AppText weight="bold" style={styles.completion}>{profile.completion}%</AppText></View><ProgressBar value={profile.completion / 100} color={colors.primary} /><View style={styles.profileGrid}><ProfileValue label="AGE" value={profile.age} suffix={profile.age === null ? '' : ' years'} /><ProfileValue label="GENDER" value={profile.gender} /><ProfileValue label="HEIGHT" value={profile.height} suffix={profile.height === null ? '' : ' cm'} /><ProfileValue label="WEIGHT" value={profile.weight} suffix={profile.weight === null ? '' : ' kg'} /><ProfileValue label="GOAL" value={profile.goal} /><ProfileValue label="ACTIVITY" value={profile.activityLevel} /></View>{profile.completion < 100 ? <TouchableOpacity onPress={() => router.push('/(setup)/profile-setup')}><AppText weight="semibold" style={styles.completeLink}>Complete Profile  →</AppText></TouchableOpacity> : null}</GlassCard> : null}

        <GlassCard style={styles.scoreCard}>
          <View style={styles.scoreTop}><AppText weight="semibold" style={styles.cardEyebrow}>TODAY'S HEALTH</AppText><View style={styles.scoreTrend}><Ionicons name="arrow-up" size={13} color={colors.success} /><AppText style={styles.trendText}>6%</AppText></View></View>
          <View style={styles.scoreRow}><AppText weight="bold" size={56}>{user.healthScore}</AppText><View style={styles.scoreCopy}><AppText weight="semibold">Health Score</AppText><AppText style={styles.subtle}>Excellent momentum today</AppText></View></View>
          <ProgressBar value={0.83} color={colors.primary} />
        </GlassCard>

        <View style={styles.section}><SectionHeader eyebrow="Your rhythm" title="Today's goals" action="See all" />
            <View style={styles.goalGrid}>
            {[{ label: 'Water', value: 0, detail: waterDetail, color: colors.blue, icon: 'water-outline' }, { label: 'Workout', value: 0.65, detail: '23 min left', color: colors.mint, icon: 'fitness-outline' }, { label: 'Nutrition', value: 0, detail: nutritionDetail, color: colors.amber, icon: 'nutrition-outline' }, { label: 'Sleep', value: 0.82, detail: '7h 24m', color: colors.lavender, icon: 'moon-outline' }].map((goal) => (
              <View style={styles.goal} key={goal.label}><View style={[styles.goalIcon, { backgroundColor: goal.color }]}><Ionicons name={goal.icon} size={18} color={colors.text} /></View><AppText weight="semibold" style={styles.goalLabel}>{goal.label}</AppText><AppText style={styles.goalDetail}>{goal.detail}</AppText><ProgressBar value={goal.value} color={colors.primary} height={5} /></View>
            ))}
          </View>
        </View>

        <GlassCard style={styles.insight}>
          <View style={styles.insightHeader}><View style={styles.aiIcon}><Ionicons name="sparkles" size={17} color={colors.primary} /></View><AppText weight="semibold">AI insight</AppText></View>
          <AppText style={styles.insightText}>You're close to your hydration goal. Try drinking another 500ml this afternoon.</AppText>
          <AppText weight="semibold" style={styles.link}>View recommendation  →</AppText>
        </GlassCard>

        <View style={styles.movementCard}>
          <Image source={require('../../../assets/images/exercise-2.jpg')} style={styles.movementImage} resizeMode="cover" />
          <View style={styles.movementOverlay} />
          <View style={styles.movementCopy}><AppText weight="semibold" style={styles.lightEyebrow}>MOVE YOUR BODY</AppText><AppText weight="semibold" size={21} style={styles.lightTitle}>A little movement{`\n`}goes a long way.</AppText><AppText style={styles.lightMeta}>25 min remaining  ·  65% complete</AppText></View>
          <View style={styles.play}><Ionicons name="arrow-forward" size={17} color={colors.primaryDark} /></View>
        </View>
        <View style={styles.planStub}><SectionHeader title="Today's plan" action="See all" />{todaysPlan.slice(0, 2).map((p) => <View key={p.id} style={styles.planRow}><View style={[styles.planDot, p.done && styles.planDone]}><Ionicons name={p.done ? 'checkmark' : 'ellipse-outline'} size={13} color={p.done ? '#fff' : colors.tertiaryText} /></View><AppText style={p.done && styles.doneText}>{p.title}</AppText><AppText style={styles.subtle}>{p.time}</AppText></View>)}
        </View>
      </ScrollView>
      </SafeAreaView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  backgroundContent: { padding: 0 },
  safeArea: { flex: 1 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 24 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  eyebrow: { color: colors.primary, fontSize: 10, letterSpacing: 1.2, marginBottom: 7 },
  subtle: { color: colors.secondaryText, fontSize: 12, marginTop: 3 },
  avatar: { width: 46, height: 46, borderRadius: 16, backgroundColor: colors.mint, alignItems: 'center', justifyContent: 'center' },
  scoreCard: { marginTop: 22, backgroundColor: colors.glassMedium },
  profileCard: { marginTop: 18, backgroundColor: colors.glassMedium },
  profileCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  completion: { color: colors.primary, fontSize: 18 },
  profileGrid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 16, gap: 12 },
  profileField: { width: '46%' },
  profileLabel: { color: colors.secondaryText, fontSize: 10, letterSpacing: 1.1 },
  profileValue: { marginTop: 4, fontSize: 14 },
  completeLink: { color: colors.primary, fontSize: 13, marginTop: 17 },
  retryButton: { marginTop: 16 },
  skeletonLine: { width: '42%', height: 16, borderRadius: 8, backgroundColor: colors.border },
  skeletonLineShort: { width: '70%', height: 11, borderRadius: 6, backgroundColor: colors.border, marginTop: 9 },
  skeletonField: { width: '46%' },
  skeletonLabel: { width: '45%', height: 9, borderRadius: 5, backgroundColor: colors.border },
  skeletonValue: { width: '70%', height: 14, borderRadius: 7, backgroundColor: colors.border, marginTop: 6 },
  scoreTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardEyebrow: { color: colors.secondaryText, fontSize: 10, letterSpacing: 1.3 },
  scoreTrend: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.mint, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 12 },
  trendText: { color: colors.success, fontSize: 12, marginLeft: 3 },
  scoreRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 12 },
  scoreCopy: { marginLeft: 15 },
  section: { marginTop: 28 },
  goalGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 14 },
  goal: { width: '46%', padding: 14, borderRadius: 22, backgroundColor: colors.glassLight, borderWidth: 1, borderColor: colors.border },
  goalIcon: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 11 },
  goalLabel: { fontSize: 14 },
  goalDetail: { color: colors.secondaryText, fontSize: 11, marginTop: 4, marginBottom: 10 },
  insight: { marginTop: 26, backgroundColor: colors.mint },
  insightHeader: { flexDirection: 'row', alignItems: 'center' },
  aiIcon: { width: 32, height: 32, borderRadius: 11, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  insightText: { color: colors.text, lineHeight: 22, marginTop: 12 },
  link: { color: colors.primary, fontSize: 13, marginTop: 14 },
  movementCard: { height: 184, borderRadius: 26, overflow: 'hidden', marginTop: 20 },
  movementImage: { ...StyleSheet.absoluteFillObject, width: undefined, height: undefined },
  movementOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15,40,30,0.42)' },
  movementCopy: { position: 'absolute', left: 20, bottom: 18 },
  lightEyebrow: { color: '#D8F0E6', fontSize: 10, letterSpacing: 1.4 },
  lightTitle: { color: '#fff', lineHeight: 25, marginTop: 6 },
  lightMeta: { color: 'rgba(255,255,255,0.78)', fontSize: 11, marginTop: 8 },
  play: { position: 'absolute', right: 18, bottom: 18, width: 38, height: 38, borderRadius: 14, backgroundColor: '#D8F0E6', alignItems: 'center', justifyContent: 'center' },
  planStub: { marginTop: 28, marginBottom: 24 },
  planRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: 'rgba(23,34,29,0.06)' },
  planDot: { width: 25, height: 25, borderRadius: 9, borderWidth: 1, borderColor: '#CBD5CE', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  planDone: { backgroundColor: colors.success, borderColor: colors.success },
  doneText: { textDecorationLine: 'line-through', color: colors.secondaryText },
});
