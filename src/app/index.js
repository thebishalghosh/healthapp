import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import colors from '../constants/colors';

export default function Index() {
  const { loading, isAuthenticated } = useAuth();

  if (loading) {
    return <View style={styles.loading}><ActivityIndicator color={colors.primary} /></View>;
  }

  return <Redirect href={isAuthenticated ? '/(tabs)' : '/(auth)/welcome'} />;
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
});