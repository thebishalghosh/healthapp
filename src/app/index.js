import React from 'react';
import { Redirect } from 'expo-router';

export default function Index() {
  // Declarative redirect to onboarding (runs after navigator mounts)
  return <Redirect href="/(auth)/welcome" />;
}