import React from 'react';
import { View, StyleSheet, TextInput, ScrollView } from 'react-native';
import AppText from '../../components/ui/AppText';
import PrimaryButton from '../../components/ui/PrimaryButton';
import colors from '../../constants/colors';

export default function ProfileSetup() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 24 }}>
      <AppText weight="bold" size={28} style={{ marginBottom: 8 }}>Your body</AppText>
      <AppText style={{ color: colors.secondaryText, marginBottom: 16 }}>A few quick details to personalize recommendations</AppText>

      <View style={styles.card}>
        <AppText style={{ marginBottom: 8 }}>Name</AppText>
        <TextInput placeholder="Your name" style={styles.input} />

        <AppText style={{ marginBottom: 8, marginTop: 12 }}>Age</AppText>
        <TextInput placeholder="29" style={styles.input} keyboardType="numeric" />

        <AppText style={{ marginBottom: 8, marginTop: 12 }}>Height (cm)</AppText>
        <TextInput placeholder="180" style={styles.input} keyboardType="numeric" />

        <AppText style={{ marginBottom: 8, marginTop: 12 }}>Weight (kg)</AppText>
        <TextInput placeholder="75" style={styles.input} keyboardType="numeric" />
      </View>

      <View style={{ marginTop: 24 }}>
        <PrimaryButton title="Save & Continue" onPress={() => {}} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  card: { backgroundColor: colors.surface, padding: 16, borderRadius: 16 },
  input: { borderBottomWidth: 1, borderBottomColor: '#eee', paddingVertical: 8 },
});
