import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppText from '../../components/ui/AppText';
import PrimaryButton from '../../components/ui/PrimaryButton';
import GradientBackground from '../../components/ui/GradientBackground';
import colors from '../../constants/colors';

const options = [
  { title: 'Build Muscle', description: 'Build strength and lean mass', icon: 'barbell-outline' },
  { title: 'Lose Weight', description: 'Move toward a healthier balance', icon: 'trending-down-outline' },
  { title: 'Improve Fitness', description: 'Feel stronger in everyday life', icon: 'fitness-outline' },
  { title: 'Eat Healthier', description: 'Make nourishment feel effortless', icon: 'nutrition-outline' },
  { title: 'Build Healthy Habits', description: 'Create routines that last', icon: 'leaf-outline' },
  { title: 'Improve Energy', description: 'Have more energy for your day', icon: 'sunny-outline' },
];

const goalValues = {
  'Build Muscle': 'muscle_gain',
  'Lose Weight': 'weight_loss',
  'Improve Fitness': 'general_wellness',
  'Eat Healthier': 'general_wellness',
  'Build Healthy Habits': 'general_wellness',
  'Improve Energy': 'general_wellness',
};

export default function Goals() {
  const [selected, setSelected] = useState(null);
  const router = useRouter();

  return (
    <GradientBackground>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <AppText weight="semibold" style={styles.eyebrow}>YOUR GOAL</AppText>
          <AppText weight="bold" size={30} style={styles.title}>What do you want to{"\n"}focus on?</AppText>
          <AppText style={styles.subtitle}>Choose your primary health goal and we'll personalize your experience around it.</AppText>
        </View>

        <FlatList
          data={options}
          numColumns={2}
          keyExtractor={(item) => item.title}
          contentContainerStyle={styles.list}
          columnWrapperStyle={styles.column}
          renderItem={({ item }) => {
            const active = selected === item.title;
            return (
              <TouchableOpacity onPress={() => setSelected(item.title)} style={[styles.card, active && styles.cardActive]} activeOpacity={0.84}>
                <View style={styles.cardTop}>
                  <View style={[styles.iconWrap, active && styles.iconWrapActive]}><Ionicons name={item.icon} size={21} color={active ? colors.primaryDark : colors.primary} /></View>
                  {active ? <View style={styles.check}><Ionicons name="checkmark" size={14} color="#fff" /></View> : null}
                </View>
                <AppText weight="semibold" size={16} style={styles.cardTitle}>{item.title}</AppText>
                <AppText style={styles.description}>{item.description}</AppText>
              </TouchableOpacity>
            );
          }}
        />

        <View style={styles.footer}>
          <PrimaryButton title="Continue  →" onPress={() => router.push({ pathname: '/(setup)/profile-setup', params: { fitnessGoal: goalValues[selected] } })} disabled={!selected} />
        </View>
      </SafeAreaView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { paddingTop: 12, paddingBottom: 8 },
  eyebrow: { color: colors.primary, fontSize: 10, letterSpacing: 1.5, marginBottom: 9 },
  title: { lineHeight: 36 },
  subtitle: { color: colors.secondaryText, marginTop: 9, lineHeight: 21 },
  list: { paddingTop: 14, paddingBottom: 10 },
  column: { justifyContent: 'space-between' },
  card: { width: '47.5%', minHeight: 158, marginBottom: 12, padding: 15, borderRadius: 23, backgroundColor: colors.glassLight, borderWidth: 1, borderColor: colors.border, shadowColor: '#24493A', shadowOffset: { width: 0, height: 7 }, shadowOpacity: 0.06, shadowRadius: 15, elevation: 2 },
  cardActive: { backgroundColor: 'rgba(216,240,230,0.82)', borderColor: colors.primary, shadowColor: colors.primary, shadowOpacity: 0.16, elevation: 4 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 17 },
  iconWrap: { width: 43, height: 43, borderRadius: 15, backgroundColor: 'rgba(216,240,230,0.78)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.72)', alignItems: 'center', justifyContent: 'center' },
  iconWrapActive: { backgroundColor: '#fff', borderColor: 'rgba(23,107,82,0.18)' },
  check: { width: 24, height: 24, borderRadius: 9, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { lineHeight: 21 },
  description: { color: colors.secondaryText, fontSize: 11, lineHeight: 16, marginTop: 6 },
  footer: { paddingTop: 8, paddingBottom: 12 },
});
