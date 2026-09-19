import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AppText from './AppText';
import GlassCard from './GlassCard';
import GradientBackground from './GradientBackground';
import PrimaryButton from './PrimaryButton';
import colors from '../../constants/colors';

export default function LockedFeature({ title, description, loading = false, requirementText = 'Personal or Premium required', actionTitle = 'Upgrade Plan', onAction }) {
  const router = useRouter();

  if (loading) {
    return <GradientBackground style={styles.container}><View style={styles.loading}><AppText style={styles.muted}>Checking feature access...</AppText></View></GradientBackground>;
  }

  return <GradientBackground style={styles.container}><View style={styles.content}><GlassCard style={styles.card}><View style={styles.icon}><Ionicons name="lock-closed-outline" size={25} color={colors.primary} /></View><AppText weight="bold" size={25}>{title}</AppText>{requirementText ? <AppText style={styles.required}>{requirementText}</AppText> : null}<AppText style={styles.description}>{description}</AppText><PrimaryButton title={actionTitle} onPress={onAction || (() => router.push('/membership'))} style={styles.button} /></GlassCard></View></GradientBackground>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, justifyContent: 'center', padding: 24 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  card: { backgroundColor: colors.glassMedium },
  icon: { width: 54, height: 54, borderRadius: 18, backgroundColor: colors.mint, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  required: { color: colors.primary, fontSize: 13, marginTop: 14 },
  description: { color: colors.secondaryText, lineHeight: 21, marginTop: 8 },
  muted: { color: colors.secondaryText },
  button: { marginTop: 24 },
});