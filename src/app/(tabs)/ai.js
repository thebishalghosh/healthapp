import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet } from 'react-native';
import AppText from '../../components/ui/AppText';
import colors from '../../constants/colors';

export default function AI() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: 24 }}>
        <AppText weight="semibold" size={24}>AI Health Assistant</AppText>
        <AppText style={{ color: colors.secondaryText, marginTop: 8 }}>Your personal wellness companion</AppText>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: colors.background } });
