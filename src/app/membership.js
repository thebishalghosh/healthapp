import React, { useCallback, useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AppText from '../components/ui/AppText';
import GlassCard from '../components/ui/GlassCard';
import GradientBackground from '../components/ui/GradientBackground';
import PrimaryButton from '../components/ui/PrimaryButton';
import { useAuth } from '../context/AuthContext';
import colors from '../constants/colors';
import { cancelMembership, getMembership, openSubscriptionCheckout, refreshCurrentSubscription } from '../services/subscription';

function money(plan) {
  if (plan?.price === undefined || plan?.price === null) return 'Price unavailable';
  return `${plan.currency || 'INR'} ${plan.price}`;
}

function planCode(plan) {
  return String(plan?.code || '').toUpperCase();
}

function isActive(subscription) {
  return ['active', 'authenticated'].includes(String(subscription?.status || '').toLowerCase());
}

const FEATURE_DETAILS = {
  ai: { name: 'AI Health Assistant', description: 'Generate personalized meal recommendations.', icon: 'sparkles-outline', category: 'AI & INSIGHTS' },
  ai_food_recommendations: { name: 'AI Food Recommendations', description: 'Explore meal ideas tailored to your goals.', icon: 'restaurant-outline', category: 'AI & INSIGHTS' },
  ai_recommendation_history: { name: 'Recommendation History', description: 'Review your previous recommendations.', icon: 'time-outline', category: 'AI & INSIGHTS' },
  ai_usage: { name: 'AI Usage', description: 'Keep track of your AI activity.', icon: 'analytics-outline', category: 'AI & INSIGHTS' },
  nutrition: { name: 'Nutrition Tracking', description: 'Review your nutrition targets and intake.', icon: 'nutrition-outline', category: 'HEALTH TRACKING' },
  water: { name: 'Water Tracking', description: 'Track your daily hydration.', icon: 'water-outline', category: 'HEALTH TRACKING' },
  hydration: { name: 'Hydration Tracking', description: 'Track your daily water intake.', icon: 'water-outline', category: 'HEALTH TRACKING' },
  workout: { name: 'Workout Tracking', description: 'Monitor your activity and workouts.', icon: 'fitness-outline', category: 'HEALTH TRACKING' },
  workouts: { name: 'Workout Tracking', description: 'Monitor your activity and workouts.', icon: 'fitness-outline', category: 'HEALTH TRACKING' },
  sleep: { name: 'Sleep Tracking', description: 'Keep a record of your sleep.', icon: 'moon-outline', category: 'HEALTH TRACKING' },
  health_score: { name: 'Health Score', description: 'Understand your daily health progress.', icon: 'heart-outline', category: 'PROGRESS & MOTIVATION' },
  streaks: { name: 'Health Streaks', description: 'Build consistency with healthy routines.', icon: 'flame-outline', category: 'PROGRESS & MOTIVATION' },
  streak: { name: 'Health Streaks', description: 'Build consistency with healthy routines.', icon: 'flame-outline', category: 'PROGRESS & MOTIVATION' },
  reminders: { name: 'Health Reminders', description: 'Stay on track with daily routines.', icon: 'notifications-outline', category: 'PROGRESS & MOTIVATION' },
};

function featureDetails(key) {
  const normalizedKey = String(key).toLowerCase();
  const known = FEATURE_DETAILS[normalizedKey];
  if (known) return known;
  const name = String(key).replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
  return { name: name.replace(/\b\w/g, (letter) => letter.toUpperCase()), description: 'Included with your membership.', icon: 'checkmark-circle-outline', category: 'MORE FOR YOUR WELLBEING' };
}

function groupFeatures(features) {
  const groups = new Map();
  Object.keys(features).filter((feature) => features[feature]).forEach((feature) => {
    const details = featureDetails(feature);
    if (!groups.has(details.category)) groups.set(details.category, []);
    groups.get(details.category).push({ key: feature, ...details });
  });
  return [...groups.entries()];
}

function FeatureRow({ feature, isLast }) {
  return <View style={[styles.featureRow, !isLast && styles.featureDivider]}>
    <View style={styles.featureIcon}><Ionicons name={feature.icon} size={17} color={colors.primary} /></View>
    <View style={styles.featureCopy}>
      <AppText weight="semibold" style={styles.featureName}>{feature.name}</AppText>
      <AppText style={styles.featureDescription}>{feature.description}</AppText>
    </View>
  </View>;
}

export default function Membership() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [membership, setMembership] = useState({ plans: [], subscription: null, features: {} });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingPlan, setProcessingPlan] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [message, setMessage] = useState(null);
  const { refreshEntitlements } = useAuth();

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setMessage(null);
    try { setMembership(await getMembership()); await refreshEntitlements(); }
    catch (error) { setMessage({ type: 'error', text: error.message || 'Unable to load membership.' }); }
    finally { setLoading(false); setRefreshing(false); }
  }, [refreshEntitlements]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const currentCode = planCode(membership.subscription?.plan || membership.subscription);
  const includedFeatureGroups = groupFeatures(membership.features);
  const subscribe = async (code) => {
    if (processingPlan || cancelling || code === currentCode) return;
    setProcessingPlan(code);
    setMessage({ type: 'info', text: 'Opening secure Razorpay Test Mode checkout...' });
    try {
      const result = await openSubscriptionCheckout(code, () => {
        setMessage({ type: 'info', text: 'Payment received. Activating your membership...' });
      });
      setMembership((current) => ({ ...current, subscription: result.subscription }));
      await refreshEntitlements();
      if (result.type === 'already_active') {
        setMessage({ type: 'info', text: 'You are already subscribed to this plan.' });
      } else if (isActive(result.subscription)) {
        const planName = result.subscription?.plan?.name || result.subscription?.plan?.code || result.subscription?.plan_code || code;
        setMessage({ type: 'success', text: `${planName} membership activated.` });
      } else if (String(result.subscription?.status || '').toLowerCase() === 'pending') {
        setMessage({ type: 'info', text: 'Payment received. Your membership is still being activated. Please refresh in a moment.' });
      } else {
        setMessage({ type: 'info', text: 'Your membership status has not changed. Please refresh in a moment.' });
      }
    } catch (error) { setMessage({ type: 'error', text: error.message || 'Unable to complete checkout.' }); }
    finally { setProcessingPlan(''); }
  };

  const refreshStatus = async () => {
    if (processingPlan || cancelling || refreshing) return;
    setRefreshing(true);
    setMessage({ type: 'info', text: 'Refreshing membership status...' });
    try {
      const subscription = await refreshCurrentSubscription();
      setMembership((current) => ({ ...current, subscription }));
      await refreshEntitlements();
      setMessage({ type: isActive(subscription) ? 'success' : 'info', text: isActive(subscription) ? 'Your membership is active.' : 'Payment is still being processed. Please refresh your membership status shortly.' });
    } catch (error) { setMessage({ type: 'error', text: error.message || 'Unable to refresh membership status.' }); }
    finally { setRefreshing(false); }
  };

  const cancel = async () => {
    if (cancelling || processingPlan) return;
    setCancelling(true);
    setMessage({ type: 'info', text: 'Requesting cancellation...' });
    try {
      const subscription = await cancelMembership();
      setMembership((current) => ({ ...current, subscription }));
      await refreshEntitlements();
      setMessage({ type: 'success', text: 'Subscription cancelled successfully.' });
    }
    catch (error) { setMessage({ type: 'error', text: error.message || 'Unable to cancel membership.' }); }
    finally { setCancelling(false); }
  };

  const confirmCancellation = () => {
    if (cancelling || processingPlan) return;
    Alert.alert('Cancel Subscription?', 'Are you sure you want to cancel your current subscription?', [
      { text: 'Keep Subscription', style: 'cancel' },
      { text: 'Cancel Subscription', style: 'destructive', onPress: cancel },
    ]);
  };

  return <GradientBackground style={styles.container}>
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView refreshControl={<RefreshControl refreshing={refreshing || loading} onRefresh={() => load(true)} tintColor={colors.primary} />} contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}>
        <TouchableOpacity onPress={() => router.back()}><AppText weight="semibold" style={styles.back}>Back</AppText></TouchableOpacity>
        <AppText weight="bold" size={30} style={styles.title}>Membership</AppText>
        <AppText style={styles.subtitle}>Choose the plan that fits your health journey.</AppText>
        {message ? <GlassCard style={[styles.message, message.type === 'error' && styles.error, message.type === 'success' && styles.success]}><AppText style={styles.messageText}>{message.text}</AppText></GlassCard> : null}
        <PrimaryButton title="Refresh Status" onPress={refreshStatus} loading={refreshing} disabled={refreshing || Boolean(processingPlan) || cancelling} style={styles.refreshButton} />
        <GlassCard style={styles.currentCard}><AppText style={styles.eyebrow}>CURRENT PLAN</AppText><AppText weight="bold" size={24}>{currentCode || 'FREE'}</AppText><AppText style={styles.muted}>{membership.subscription?.status || 'active'}</AppText>{currentCode !== 'FREE' ? <PrimaryButton title="Cancel Subscription" onPress={confirmCancellation} loading={cancelling} disabled={cancelling || Boolean(processingPlan)} style={styles.cancel} /> : null}</GlassCard>
        {includedFeatureGroups.length ? <GlassCard style={styles.featuresCard}>
          <AppText style={styles.eyebrow}>WHAT'S INCLUDED</AppText>
          {includedFeatureGroups.map(([category, features]) => <View key={category} style={styles.featureCategory}>
            <AppText style={styles.featureCategoryTitle}>{category}</AppText>
            <View style={styles.featureList}>{features.map((feature, index) => <FeatureRow key={feature.key} feature={feature} isLast={index === features.length - 1} />)}</View>
          </View>)}
        </GlassCard> : null}
        {membership.plans.filter((plan) => ['PERSONAL', 'PREMIUM'].includes(planCode(plan))).map((plan) => { const code = planCode(plan); const isCurrent = code === currentCode; return <GlassCard key={code} style={styles.planCard}><View style={styles.planHeader}><View><AppText style={styles.eyebrow}>{code}</AppText><AppText weight="bold" size={23}>{plan.name || code}</AppText></View>{isCurrent ? <AppText weight="semibold" style={styles.currentLabel}>CURRENT</AppText> : null}</View><AppText style={styles.description}>{plan.description || 'Health features for your routine.'}</AppText><AppText weight="bold" size={22}>{money(plan)}</AppText><AppText style={styles.muted}>Billing: {plan.billing_period || 'period unavailable'}</AppText><PrimaryButton title={isCurrent ? 'Current plan' : `Subscribe to ${code}`} onPress={() => subscribe(code)} loading={processingPlan === code} disabled={isCurrent || Boolean(processingPlan) || cancelling} style={styles.button} /></GlassCard>; })}
        {!loading && !membership.plans.length ? <AppText style={styles.muted}>No subscription plans are available right now.</AppText> : null}
      </ScrollView>
    </SafeAreaView>
  </GradientBackground>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  safeArea: { flex: 1 },
  content: { padding: 24 },
  back: { color: colors.primary, marginBottom: 28 },
  title: { color: colors.text },
  subtitle: { color: colors.secondaryText, marginTop: 8, marginBottom: 22 },
  refreshButton: { marginBottom: 18 },
  currentCard: { backgroundColor: colors.glassMedium, marginBottom: 18 },
  featuresCard: { backgroundColor: colors.glassMedium, marginBottom: 18 },
  planCard: { backgroundColor: colors.glassMedium, marginBottom: 14 },
  planHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  eyebrow: { color: colors.secondaryText, fontSize: 10, letterSpacing: 1.2, marginBottom: 5 },
  currentLabel: { color: colors.success, fontSize: 11 },
  description: { color: colors.secondaryText, lineHeight: 20, marginVertical: 14 },
  featureCategory: { marginTop: 15 },
  featureCategoryTitle: { color: colors.secondaryText, fontSize: 10, fontWeight: '700', letterSpacing: 1, marginBottom: 8 },
  featureList: { borderWidth: 1, borderColor: colors.border, borderRadius: 18, backgroundColor: colors.glassLight, paddingHorizontal: 12 },
  featureRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 13 },
  featureDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(23,34,29,0.12)' },
  featureIcon: { width: 34, height: 34, borderRadius: 12, backgroundColor: colors.mint, alignItems: 'center', justifyContent: 'center', marginRight: 11 },
  featureCopy: { flex: 1, minWidth: 0 },
  featureName: { color: colors.text, fontSize: 14, flexShrink: 1 },
  featureDescription: { color: colors.secondaryText, fontSize: 12, lineHeight: 17, marginTop: 3 },
  muted: { color: colors.secondaryText, fontSize: 12, marginTop: 4 },
  button: { marginTop: 18 },
  cancel: { marginTop: 16 },
  message: { backgroundColor: colors.glassMedium, marginBottom: 16 },
  messageText: { color: colors.primary, fontSize: 13 },
  error: { borderColor: colors.danger },
  success: { borderColor: colors.success },
});