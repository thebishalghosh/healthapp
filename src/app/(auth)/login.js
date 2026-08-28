import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import AppText from '../../components/ui/AppText';
import PrimaryButton from '../../components/ui/PrimaryButton';
import GradientBackground from '../../components/ui/GradientBackground';
import colors from '../../constants/colors';
import { useAuth } from '../../context/AuthContext';

export default function Login() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setError('');
    if (!email.trim() || !password) {
      setError('Enter your email and password.');
      return;
    }
    setSubmitting(true);
    try {
      await login(email.trim(), password);
      router.replace('/(tabs)');
    } catch (requestError) {
      setError(requestError.message || 'Unable to sign in. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <GradientBackground>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <TouchableOpacity onPress={() => router.back()}><AppText weight="semibold" style={styles.back}>← Back</AppText></TouchableOpacity>
          <View style={styles.intro}><AppText weight="bold" size={30}>Welcome back.</AppText><AppText style={styles.subtitle}>Sign in to continue your health journey.</AppText></View>
          <View style={styles.field}><AppText weight="semibold" style={styles.label}>EMAIL</AppText><TextInput value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="you@example.com" placeholderTextColor={colors.tertiaryText} style={styles.input} /></View>
          <View style={styles.field}><AppText weight="semibold" style={styles.label}>PASSWORD</AppText><TextInput value={password} onChangeText={setPassword} secureTextEntry placeholder="Your password" placeholderTextColor={colors.tertiaryText} style={styles.input} /></View>
          {error ? <AppText style={styles.error}>{error}</AppText> : null}
          <PrimaryButton title="Sign In  →" onPress={handleSubmit} loading={submitting} disabled={submitting} style={styles.button} />
          <TouchableOpacity onPress={() => router.push('/(auth)/register')} style={styles.link}><AppText weight="semibold" style={styles.linkText}>Create an account</AppText></TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24, paddingTop: 32 },
  back: { color: colors.primary, fontSize: 14 },
  intro: { marginTop: 48, marginBottom: 28 },
  subtitle: { color: colors.secondaryText, marginTop: 8, lineHeight: 22 },
  field: { backgroundColor: colors.glassLight, borderWidth: 1, borderColor: colors.border, borderRadius: 22, padding: 16, marginBottom: 12 },
  label: { color: colors.secondaryText, fontSize: 10, letterSpacing: 1.3, marginBottom: 8 },
  input: { fontSize: 17, color: colors.text, paddingVertical: 3 },
  error: { color: colors.danger, marginTop: 4, lineHeight: 20 },
  button: { marginTop: 20 },
  link: { alignItems: 'center', padding: 16 },
  linkText: { color: colors.primary, fontSize: 13 },
});