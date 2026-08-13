import React from 'react';
import { Tabs } from 'expo-router';
import { StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../constants/colors';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: [styles.tabBar, { backgroundColor: colors.surface }],
      }}
    >
      <Tabs.Screen name="index" options={{ tabBarIcon: ({ color }) => <Ionicons name="home-outline" size={22} color={color} /> }} />
      <Tabs.Screen name="nutrition" options={{ tabBarIcon: ({ color }) => <Ionicons name="fast-food-outline" size={22} color={color} /> }} />
      <Tabs.Screen name="workout" options={{ tabBarIcon: ({ color }) => <Ionicons name="barbell-outline" size={22} color={color} /> }} />
      <Tabs.Screen name="ai" options={{ tabBarIcon: ({ color }) => <Ionicons name="sparkles-outline" size={22} color={color} /> }} />
      <Tabs.Screen name="profile" options={{ tabBarIcon: ({ color }) => <Ionicons name="person-circle-outline" size={22} color={color} /> }} />
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
    borderRadius: 32,
    paddingHorizontal: 12,
    shadowColor: '#0b1724',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 24,
    elevation: 6,
  },
});
