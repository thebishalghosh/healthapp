import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Image } from 'react-native';
import AppText from '../../components/ui/AppText';
import colors from '../../constants/colors';

export default function Profile() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: 24 }}>
        <Image source={require('../../../assets/icon.png')} style={styles.avatar} />
        <AppText weight="semibold" size={20} style={{ marginTop: 12 }}>Bishal</AppText>
        <AppText style={{ color: colors.secondaryText }}>Health score 83</AppText>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  avatar: { width: 96, height: 96, borderRadius: 20, backgroundColor: colors.surface },
});
