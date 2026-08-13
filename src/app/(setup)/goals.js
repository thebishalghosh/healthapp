import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import AppText from '../../components/ui/AppText';
import PrimaryButton from '../../components/ui/PrimaryButton';
import colors from '../../constants/colors';

const options = [
  'Build Muscle',
  'Lose Weight',
  'Improve Fitness',
  'Eat Healthier',
  'Build Healthy Habits',
  'Improve Energy',
];

export default function Goals() {
  const [selected, setSelected] = useState(null);
  const router = useRouter();

  return (
    <View style={styles.container}>
      <AppText weight="bold" size={28} style={styles.title}>What is your main goal?</AppText>
      <AppText style={styles.subtitle}>Choose what you want to focus on</AppText>

      <FlatList
        data={options}
        numColumns={2}
        keyExtractor={(i) => i}
        contentContainerStyle={{ paddingTop: 20 }}
        renderItem={({ item }) => {
          const active = selected === item;
          return (
            <TouchableOpacity onPress={() => setSelected(item)} style={[styles.pill, active && styles.pillActive]}>
              <AppText style={[styles.pillText, active && { color: '#fff' }]}>{item}</AppText>
            </TouchableOpacity>
          );
        }}
      />

      <View style={styles.footer}>
        <PrimaryButton title="Continue" onPress={() => router.push('/(setup)/profile-setup')} disabled={!selected} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: colors.background },
  title: { marginTop: 24 },
  subtitle: { color: colors.secondaryText, marginTop: 6 },
  pill: {
    flex: 1,
    margin: 8,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: colors.surface,
    alignItems: 'center',
  },
  pillActive: { backgroundColor: colors.primary },
  pillText: { color: colors.text },
  footer: { marginTop: 'auto', marginBottom: 24 },
});
