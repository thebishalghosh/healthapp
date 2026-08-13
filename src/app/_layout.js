import { Stack, Slot } from 'expo-router';

export default function RootLayout() {
  // Ensure the navigator Slot is mounted immediately by rendering it inside Stack
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Slot />
    </Stack>
  );
}
