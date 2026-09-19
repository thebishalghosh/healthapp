import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import AppText from '../../components/ui/AppText';
import colors from '../../constants/colors';
import GlassCard from '../../components/ui/GlassCard';
import PrimaryButton from '../../components/ui/PrimaryButton';
import LockedFeature from '../../components/ui/LockedFeature';
import { useAuth } from '../../context/AuthContext';
import { MEAL_TYPES } from '../../services/recommendations';

function displayNumber(value) {
  return value === null || value === undefined ? '—' : Math.round(value * 10) / 10;
}

function NutritionMetric({ label, value, unit }) {
  return <View style={styles.metric}><AppText style={styles.metricLabel}>{label}</AppText><AppText weight="semibold" style={styles.metricValue}>{displayNumber(value)}{unit ? ` ${unit}` : ''}</AppText></View>;
}

function RecommendationCard({ recommendation, embedded = false }) {
  const nutrition = recommendation.estimatedNutrition || {};
  const content = <>
    <AppText style={styles.mealType}>{recommendation.mealType}</AppText>
    <AppText weight="semibold" size={19} style={styles.recommendationTitle}>{recommendation.title}</AppText>
    <AppText style={styles.recommendationDescription}>{recommendation.description}</AppText>
    <View style={styles.metricsGrid}>
      <NutritionMetric label="CALORIES" value={nutrition.calories} unit="kcal" />
      <NutritionMetric label="PROTEIN" value={nutrition.proteinG} unit="g" />
      <NutritionMetric label="CARBS" value={nutrition.carbohydratesG} unit="g" />
      <NutritionMetric label="FAT" value={nutrition.fatG} unit="g" />
      <NutritionMetric label="FIBER" value={nutrition.fiberG} unit="g" />
    </View>
    <AppText weight="semibold" style={styles.foodsHeading}>Foods</AppText>
    {recommendation.foods.map((food) => <View style={styles.foodRow} key={`${food.name}-${food.quantity}`}><Ionicons name="ellipse" size={6} color={colors.primary} /><AppText style={styles.foodText}>{food.name} <AppText style={styles.foodQuantity}>· {food.quantity}</AppText></AppText></View>)}
    {recommendation.reason ? <AppText style={styles.reason}>{recommendation.reason}</AppText> : null}
  </>;

  return embedded ? <View style={styles.embeddedRecommendation}>{content}</View> : <GlassCard style={styles.recommendationCard}>{content}</GlassCard>;
}

export default function AI() {
  const insets = useSafeAreaInsets();
  const { user, recommendations, recommendationsLoading, recommendationsError, refreshRecommendations, getRecommendationHistory, getAIUsage, hasFeature, features, entitlementsLoading, entitlementsError, refreshEntitlements, denyFeature } = useAuth();
  const [accessDenied, setAccessDenied] = useState(false);
  const [requiredPlan, setRequiredPlan] = useState('Personal or Premium required');
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState(null);
  const [usage, setUsage] = useState(null);
  const [usageLoading, setUsageLoading] = useState(false);
  const [usageError, setUsageError] = useState(null);
  const [expandedGenerationId, setExpandedGenerationId] = useState(null);
  const historyRequestId = useRef(0);
  const usageRequestId = useRef(0);
  const entitlementsLoadingRef = useRef(entitlementsLoading);
  const entitlementRefreshInFlight = useRef(false);
  entitlementsLoadingRef.current = entitlementsLoading;
  const aiEnabled = features?.ai === true;
  const recommendationList = recommendations?.recommendations || [];
  const dailyContext = recommendations?.dailyContext;
  const hasResults = recommendationList.length > 0;

  const loadHistory = useCallback(async () => {
    const requestId = historyRequestId.current + 1;
    historyRequestId.current = requestId;
    setHistoryLoading(true);
    setHistoryError(null);
    try {
      const nextHistory = await getRecommendationHistory(20, 0);
      if (requestId === historyRequestId.current) setHistory(nextHistory);
    } catch (error) {
      if (requestId === historyRequestId.current) setHistoryError(error);
    } finally {
      if (requestId === historyRequestId.current) setHistoryLoading(false);
    }
  }, [getRecommendationHistory]);

  const loadUsage = useCallback(async () => {
    const requestId = usageRequestId.current + 1;
    usageRequestId.current = requestId;
    setUsageLoading(true);
    setUsageError(null);
    try {
      const nextUsage = await getAIUsage();
      if (requestId === usageRequestId.current) setUsage(nextUsage);
    } catch (error) {
      if (requestId === usageRequestId.current) setUsageError(error);
    } finally {
      if (requestId === usageRequestId.current) setUsageLoading(false);
    }
  }, [getAIUsage]);

  useEffect(() => {
    historyRequestId.current += 1;
    usageRequestId.current += 1;
    setHistory([]);
    setHistoryError(null);
    setUsage(null);
    setUsageError(null);
    setExpandedGenerationId(null);
    setAccessDenied(false);
    setRequiredPlan('Personal or Premium required');
    if (user && aiEnabled) {
      loadHistory();
      loadUsage();
    } else {
      setHistoryLoading(false);
      setUsageLoading(false);
    }
  }, [user, aiEnabled, loadHistory, loadUsage]);

  useFocusEffect(useCallback(() => {
    if (!user || entitlementsLoadingRef.current || entitlementRefreshInFlight.current) return;
    entitlementRefreshInFlight.current = true;
    refreshEntitlements().finally(() => {
      entitlementRefreshInFlight.current = false;
    });
  }, [user, refreshEntitlements]));

  const generateRecommendations = async () => {
    if (!hasFeature('ai')) return;
    try {
      await refreshRecommendations();
      await Promise.all([loadHistory(), loadUsage()]);
    } catch (error) {
      if (denyFeature('ai', error)) {
        setRequiredPlan(error.code === 'FEATURE_REQUIRES_PREMIUM' ? 'Premium subscription required' : 'Personal or Premium required');
        setAccessDenied(true);
      }
      // The existing recommendation error state remains the source of truth for generation failures.
    }
  };

  const refreshAll = generateRecommendations;

  const formatDate = (value) => {
    if (!value) return 'Date unavailable';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? 'Date unavailable' : date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (entitlementsLoading) {
    return <LockedFeature loading title="AI Health Assistant" description="Unlock AI-powered health assistance and personalized recommendations." />;
  }

  if (entitlementsError) {
    return <LockedFeature title="AI Health Assistant" description="We couldn't verify your subscription right now." requirementText="" actionTitle="Try Again" onAction={refreshEntitlements} />;
  }

  if (accessDenied || !hasFeature('ai')) {
    return <LockedFeature title="AI Health Assistant" description="Unlock AI-powered health assistance and personalized recommendations." requirementText={requiredPlan} />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={recommendationsLoading || historyLoading || usageLoading} onRefresh={refreshAll} tintColor={colors.primary} />}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 128 }]}
      >
        <AppText style={styles.eyebrow}>INTELLIGENT WELLNESS</AppText><AppText weight="bold" size={30}>HealthAI</AppText><AppText style={styles.subtitle}>Your personal health companion.</AppText>
        <GlassCard style={styles.hero}><View style={styles.heroIcon}><Ionicons name="sparkles" size={26} color={colors.primary} /></View><AppText weight="bold" size={24} style={styles.heroTitle}>Ask HealthAI</AppText><AppText style={styles.heroText}>Get personalized meal recommendations based on your health profile and nutrition targets.</AppText><View style={styles.topicRow}>{['Nutrition', 'Fitness', 'Sleep', 'Habits'].map((topic, index) => <View style={styles.topic} key={topic}><Ionicons name={['nutrition-outline', 'fitness-outline', 'moon-outline', 'leaf-outline'][index]} size={16} color={colors.primary} /><AppText style={styles.topicText}>{topic}</AppText></View>)}</View><PrimaryButton title={hasResults ? 'Regenerate recommendations' : 'Generate recommendations'} onPress={generateRecommendations} loading={recommendationsLoading} disabled={recommendationsLoading} style={styles.generateButton} /></GlassCard>

        {recommendationsLoading && !hasResults ? <GlassCard style={styles.statusCard}><ActivityIndicator color={colors.primary} /><AppText weight="semibold" style={styles.statusTitle}>Creating your recommendations...</AppText><AppText style={styles.statusText}>HealthAI is reviewing your saved goals and nutrition targets.</AppText></GlassCard> : null}
        {recommendationsError && !recommendationsLoading ? <GlassCard style={styles.statusCard}><AppText weight="semibold" style={styles.statusTitle}>We couldn't load your recommendations.</AppText><AppText style={styles.statusText}>{recommendationsError.message || 'Please check your connection and try again.'}</AppText><PrimaryButton title="Retry" onPress={generateRecommendations} style={styles.retryButton} /></GlassCard> : null}

        {dailyContext ? <GlassCard style={styles.contextCard}><AppText weight="semibold" size={18}>Today's nutrition context</AppText><View style={styles.contextGrid}><NutritionMetric label="CALORIE TARGET" value={dailyContext.caloriesTarget} unit="kcal" /><NutritionMetric label="CALORIES LEFT" value={dailyContext.caloriesRemaining} unit="kcal" /><NutritionMetric label="PROTEIN TARGET" value={dailyContext.proteinTarget} unit="g" /><NutritionMetric label="PROTEIN LEFT" value={dailyContext.proteinRemaining} unit="g" /></View></GlassCard> : null}
        {hasResults ? <><AppText weight="semibold" size={18} style={styles.sectionTitle}>Today's meal plan</AppText>{MEAL_TYPES.map((mealType) => { const recommendation = recommendationList.find((item) => item.mealType === mealType); return recommendation ? <RecommendationCard recommendation={recommendation} key={`${mealType}-${recommendation.title}`} /> : null; })}</> : null}
        <GlassCard style={styles.usageCard}><AppText weight="semibold" size={18}>AI Usage</AppText>{usageLoading ? <ActivityIndicator color={colors.primary} style={styles.inlineLoader} /> : usageError ? <View style={styles.inlineError}><AppText style={styles.statusText}>Usage is temporarily unavailable.</AppText><Pressable onPress={loadUsage}><AppText weight="semibold" style={styles.retryText}>Retry</AppText></Pressable></View> : <View style={styles.usageGrid}><NutritionMetric label="USED" value={usage?.successfulRequests} /><NutritionMetric label="LIMIT" value={usage?.requestLimit} /><NutritionMetric label="REMAINING" value={usage?.remainingRequests} />{usage?.period ? <View style={styles.metric}><AppText style={styles.metricLabel}>PERIOD</AppText><AppText weight="semibold" style={styles.metricValue}>{usage.period}</AppText></View> : null}</View>}</GlassCard>
        <AppText weight="semibold" size={18} style={styles.sectionTitle}>Recommendation history</AppText>
        {historyLoading ? <GlassCard style={styles.historyStatus}><ActivityIndicator color={colors.primary} /><AppText style={styles.statusText}>Loading saved recommendations...</AppText></GlassCard> : null}
        {historyError && !historyLoading ? <GlassCard style={styles.historyStatus}><AppText style={styles.statusText}>We couldn't load your AI history.</AppText><Pressable onPress={loadHistory}><AppText weight="semibold" style={styles.retryText}>Retry</AppText></Pressable></GlassCard> : null}
        {!historyLoading && !historyError && history.length === 0 ? <GlassCard style={styles.historyStatus}><Ionicons name="time-outline" size={24} color={colors.primary} /><AppText style={styles.statusText}>Your AI meal history will appear here after you generate your first recommendation.</AppText></GlassCard> : null}
        {!historyLoading && !historyError ? history.map((entry, index) => { const entryKey = entry.generationId || `${entry.createdAt}-${index}`; const expanded = expandedGenerationId === entryKey; return <GlassCard style={styles.historyCard} key={entryKey}><Pressable onPress={() => setExpandedGenerationId(expanded ? null : entryKey)}><View style={styles.historyHeader}><View style={styles.historyCopy}><AppText style={styles.historyDate}>{formatDate(entry.createdAt)}</AppText><AppText weight="semibold" size={16} style={styles.historyTitle}>{entry.title}</AppText><AppText style={styles.historyTypes}>{entry.mealTypes.length ? entry.mealTypes.join(' · ') : 'Saved meal plan'}</AppText></View><Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={20} color={colors.primary} /></View><View style={styles.historySummary}><NutritionMetric label="MEALS" value={entry.recommendations.length} />{entry.nutrition.calories !== null ? <NutritionMetric label="PLAN CALORIES" value={entry.nutrition.calories} unit="kcal" /> : null}</View></Pressable>{expanded ? <View style={styles.historyDetails}>{MEAL_TYPES.map((mealType) => { const recommendation = entry.recommendations.find((item) => item.mealType === mealType); return recommendation ? <RecommendationCard embedded recommendation={recommendation} key={`${entryKey}-${mealType}`} /> : null; })}</View> : null}</GlassCard>; }) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 24 },
  eyebrow: { color: colors.primary, fontSize: 10, letterSpacing: 1.4, marginBottom: 7 },
  subtitle: { color: colors.secondaryText, marginTop: 6 },
  hero: { marginTop: 26, backgroundColor: colors.mint, minHeight: 260 },
  heroIcon: { width: 54, height: 54, borderRadius: 19, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', marginBottom: 22 },
  heroTitle: { color: colors.primaryDark },
  heroText: { color: colors.secondaryText, marginTop: 8, lineHeight: 22 },
  topicRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 24 },
  topic: { flexDirection: 'row', alignItems: 'center', paddingVertical: 9, paddingHorizontal: 11, borderRadius: 13, backgroundColor: 'rgba(255,255,255,0.62)' },
  topicText: { fontSize: 12, color: colors.primaryDark, marginLeft: 6 },
  generateButton: { marginTop: 24 },
  statusCard: { marginTop: 20, backgroundColor: colors.glassMedium, alignItems: 'center' },
  statusTitle: { marginTop: 12, textAlign: 'center' },
  statusText: { color: colors.secondaryText, lineHeight: 20, marginTop: 6, textAlign: 'center' },
  retryButton: { width: '100%', marginTop: 16 },
  contextCard: { marginTop: 22, backgroundColor: colors.glassMedium },
  usageCard: { marginTop: 22, backgroundColor: colors.glassMedium },
  inlineLoader: { marginTop: 16, alignSelf: 'flex-start' },
  inlineError: { marginTop: 8 },
  retryText: { color: colors.primary, marginTop: 8 },
  usageGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 16 },
  contextGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 16 },
  metric: { width: '46%', minHeight: 45 },
  metricLabel: { color: colors.secondaryText, fontSize: 9, letterSpacing: 1.1 },
  metricValue: { color: colors.text, fontSize: 14, marginTop: 5 },
  sectionTitle: { marginTop: 30, marginBottom: 12 },
  recommendationCard: { marginBottom: 14, backgroundColor: colors.glassMedium },
  mealType: { color: colors.primary, fontSize: 10, letterSpacing: 1.1, textTransform: 'uppercase' },
  recommendationTitle: { marginTop: 8, lineHeight: 23 },
  recommendationDescription: { color: colors.secondaryText, lineHeight: 21, marginTop: 8 },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 18, paddingTop: 14, borderTopWidth: 1, borderTopColor: colors.border },
  foodsHeading: { marginTop: 18, marginBottom: 8 },
  foodRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  foodText: { color: colors.text, fontSize: 13, marginLeft: 8, flex: 1 },
  foodQuantity: { color: colors.secondaryText, fontSize: 12 },
  reason: { color: colors.secondaryText, fontSize: 12, lineHeight: 19, marginTop: 16 },
  embeddedRecommendation: { paddingTop: 16, borderTopWidth: 1, borderTopColor: colors.border },
  historyStatus: { marginTop: 12, backgroundColor: colors.glassMedium, alignItems: 'center' },
  historyCard: { marginTop: 12, backgroundColor: colors.glassMedium },
  historyHeader: { flexDirection: 'row', alignItems: 'center' },
  historyCopy: { flex: 1, paddingRight: 12 },
  historyDate: { color: colors.primary, fontSize: 10, letterSpacing: 1.1, textTransform: 'uppercase' },
  historyTitle: { marginTop: 6 },
  historyTypes: { color: colors.secondaryText, fontSize: 12, marginTop: 4, textTransform: 'capitalize' },
  historySummary: { flexDirection: 'row', gap: 24, marginTop: 16, paddingTop: 14, borderTopWidth: 1, borderTopColor: colors.border },
  historyDetails: { marginTop: 4 },
});
