import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AppText from '../../components/ui/AppText';
import PrimaryButton from '../../components/ui/PrimaryButton';
import GradientBackground from '../../components/ui/GradientBackground';
import colors from '../../constants/colors';
import { useAuth } from '../../context/AuthContext';

export default function Register() {
  const router = useRouter();
  const { register, updateProfile } = useAuth();
  const { firstName: onboardingFirstName, profile: onboardingProfile } = useLocalSearchParams();
  const [fields, setFields] = useState({ firstName: onboardingFirstName || '', lastName: '', email: '', password: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const update = (key, value) => setFields((current) => ({ ...current, [key]: value }));

  const handleSubmit = async () => {
    setError('');
    setFieldErrors({});
    const missing = {};
    Object.keys(fields).forEach((key) => { if (!fields[key].trim()) missing[key] = 'Required'; });
    if (Object.keys(missing).length) {
      setFieldErrors(missing);
      return;
    }
    setSubmitting(true);
    try {
      await register(fields.email.trim(), fields.password, fields.firstName.trim(), fields.lastName.trim());
      if (onboardingProfile) await updateProfile(JSON.parse(onboardingProfile));
      router.replace('/(tabs)');
    } catch (requestError) {
      if (requestError.fields) {
        const mapped = {};
        Object.entries(requestError.fields).forEach(([key, message]) => {
          mapped[{ first_name: 'firstName', last_name: 'lastName' }[key] || key] = message;
        });
        setFieldErrors(mapped);
      }
      setError(requestError.message || 'Unable to create your account. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const inputs = [
    ['firstName', 'FIRST NAME', 'Your first name'],
    ['lastName', 'LAST NAME', 'Your last name'],
    ['email', 'EMAIL', 'you@example.com'],
    ['password', 'PASSWORD', '8+ characters, uppercase, lowercase, number'],
  ];

  return (
    <GradientBackground>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <TouchableOpacity onPress={() => router.back()}><AppText weight="semibold" style={styles.back}>← Back</AppText></TouchableOpacity>
          <View style={styles.intro}><AppText weight="bold" size={30}>Create your account.</AppText><AppText style={styles.subtitle}>Save your progress and make HealthAI personal.</AppText></View>
          {inputs.map(([key, label, placeholder]) => <View style={styles.field} key={key}><AppText weight="semibold" style={styles.label}>{label}</AppText><TextInput value={fields[key]} onChangeText={(value) => update(key, value)} autoCapitalize={key === 'email' || key === 'password' ? 'none' : 'words'} keyboardType={key === 'email' ? 'email-address' : 'default'} secureTextEntry={key === 'password'} placeholder={placeholder} placeholderTextColor={colors.tertiaryText} style={styles.input} />{fieldErrors[key] ? <AppText style={styles.fieldError}>{fieldErrors[key]}</AppText> : null}</View>)}
          {error ? <AppText style={styles.error}>{error}</AppText> : null}
          <PrimaryButton title="Create Account  →" onPress={handleSubmit} loading={submitting} disabled={submitting} style={styles.button} />
          <TouchableOpacity onPress={() => router.push('/(auth)/login')} style={styles.link}><AppText weight="semibold" style={styles.linkText}>Already have an account? Sign in</AppText></TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24, paddingTop: 32, paddingBottom: 44 },
  back: { color: colors.primary, fontSize: 14 },
  intro: { marginTop: 36, marginBottom: 24 },
  subtitle: { color: colors.secondaryText, marginTop: 8, lineHeight: 22 },
  field: { backgroundColor: colors.glassLight, borderWidth: 1, borderColor: colors.border, borderRadius: 22, padding: 16, marginBottom: 12 },
  label: { color: colors.secondaryText, fontSize: 10, letterSpacing: 1.3, marginBottom: 8 },
  input: { fontSize: 16, color: colors.text, paddingVertical: 3 },
  fieldError: { color: colors.danger, fontSize: 12, marginTop: 6 },
  error: { color: colors.danger, lineHeight: 20, marginTop: 4 },
  button: { marginTop: 20 },
  link: { alignItems: 'center', padding: 16 },
  linkText: { color: colors.primary, fontSize: 13 },
});