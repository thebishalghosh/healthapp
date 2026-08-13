import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet } from 'react-native';
import AppText from '../../components/ui/AppText';
import colors from '../../constants/colors';

export default function Workout() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: 24 }}>
        <AppText weight="semibold" size={24}>Workout</AppText>
        <AppText style={{ color: colors.secondaryText, marginTop: 8 }}>Today's Workout</AppText>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: colors.background } });
