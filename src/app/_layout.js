import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { AuthProvider } from '../context/AuthContext';
import { listReminders, reconcileReminderNotifications } from '../services/reminders';
import { useAuth } from '../context/AuthContext';

function ReminderLifecycle() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.id) return;
    listReminders().then((reminders) => reconcileReminderNotifications(user.id, reminders)).catch(() => {});
  }, [user?.id]);

  return null;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <ReminderLifecycle />
      <Stack screenOptions={{ headerShown: false }} />
    </AuthProvider>
  );
}
