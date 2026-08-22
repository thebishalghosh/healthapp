import React from 'react';
import { Tabs } from 'expo-router';
import { StyleSheet, Platform, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import colors from '../../constants/colors';
import shadows from '../../constants/shadows';

function TabIcon({ name, color, focused }) {
  return (
    <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
      <Ionicons name={name} size={22} color={color} />
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.tertiaryText,
        tabBarStyle: [styles.tabBar, { backgroundColor: 'transparent' }],
        tabBarBackground: () => <BlurView intensity={42} tint="light" experimentalBlurMethod="dimezisBlurView" style={styles.blur} />,
      }}
    >
      <Tabs.Screen name="index" options={{ tabBarIcon: ({ color, focused }) => <TabIcon name="home-outline" color={color} focused={focused} /> }} />
      <Tabs.Screen name="nutrition" options={{ tabBarIcon: ({ color, focused }) => <TabIcon name="fast-food-outline" color={color} focused={focused} /> }} />
      <Tabs.Screen name="workout" options={{ tabBarIcon: ({ color, focused }) => <TabIcon name="barbell-outline" color={color} focused={focused} /> }} />
      <Tabs.Screen name="ai" options={{ tabBarIcon: ({ color, focused }) => <TabIcon name="sparkles-outline" color={color} focused={focused} /> }} />
      <Tabs.Screen name="profile" options={{ tabBarIcon: ({ color, focused }) => <TabIcon name="person-circle-outline" color={color} focused={focused} /> }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: Platform.OS === 'ios' ? 28 : 16,
    height: 64,
    borderRadius: 28,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.floating,
  },
  blur: { flex: 1, borderRadius: 28, overflow: 'hidden', backgroundColor: 'rgba(246,248,244,0.78)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.82)' },
  iconContainer: { width: 42, height: 42, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  iconContainerActive: { backgroundColor: colors.mint, shadowColor: colors.primary, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.15, shadowRadius: 7, elevation: 3 },
});
