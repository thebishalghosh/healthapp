import React, { useState } from 'react';
import { View, StyleSheet, TextInput, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AppText from '../../components/ui/AppText';
import PrimaryButton from '../../components/ui/PrimaryButton';
import colors from '../../constants/colors';

export default function ProfileSetup() {
  const router = useRouter();
  const [fields, setFields] = useState({ name: '', age: '', height: '', weight: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const updateField = (key, value) => setFields((current) => ({ ...current, [key]: value }));
  const inputs = [
    { key: 'name', label: 'NAME', placeholder: 'Your name', icon: 'person-outline' },
    { key: 'age', label: 'AGE', placeholder: '29', icon: 'calendar-outline', suffix: 'years', keyboardType: 'numeric' },
    { key: 'height', label: 'HEIGHT', placeholder: '180', icon: 'resize-outline', suffix: 'cm', keyboardType: 'numeric' },
    { key: 'weight', label: 'WEIGHT', placeholder: '75', icon: 'scale-outline', suffix: 'kg', keyboardType: 'numeric' },
  ];

  const handleSubmit = () => {
    const nextErrors = Object.keys(fields).reduce((result, key) => {
      if (!fields[key].trim()) result[key] = 'Required';
      return result;
    }, {});

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    // TODO: Replace this temporary development bypass with POST /api/v1/onboarding.
    setTimeout(() => {
      router.replace('/(tabs)');
    }, 350);
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.intro}>
        <AppText weight="bold" size={30} style={styles.title}>Let's understand{"\n"}your body.</AppText>
        <AppText style={styles.subtitle}>A few details help HealthAI personalize your experience.</AppText>
      </View>

      {inputs.map((field) => (
        <View style={[styles.field, errors[field.key] && styles.fieldError]} key={field.key}>
          <View style={styles.fieldHeader}><Ionicons name={field.icon} size={15} color={colors.primary} /><AppText weight="semibold" style={styles.label}>{field.label}</AppText></View>
          <View style={styles.inputRow}>
            <TextInput value={fields[field.key]} onChangeText={(value) => { updateField(field.key, value); if (errors[field.key]) setErrors((current) => ({ ...current, [field.key]: undefined })); }} placeholder={field.placeholder} placeholderTextColor={colors.tertiaryText} style={styles.input} keyboardType={field.keyboardType} />
            {field.suffix ? <AppText style={styles.suffix}>{field.suffix}</AppText> : null}
          </View>
          {errors[field.key] ? <AppText style={styles.errorText}>{errors[field.key]}</AppText> : null}
        </View>
      ))}

      <View style={styles.footer}><PrimaryButton title="Save & Continue  →" onPress={handleSubmit} loading={submitting} disabled={submitting} /></View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 24, paddingBottom: 44 },
  intro: { marginTop: 20, marginBottom: 22 },
  title: { lineHeight: 36 },
  subtitle: { color: colors.secondaryText, marginTop: 8, lineHeight: 22 },
  field: { backgroundColor: colors.glassLight, borderWidth: 1, borderColor: colors.border, borderRadius: 22, padding: 16, marginBottom: 12 },
  fieldHeader: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  label: { color: colors.secondaryText, fontSize: 10, letterSpacing: 1.3 },
  inputRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  input: { flex: 1, paddingVertical: 4, fontSize: 20, color: colors.text },
  suffix: { color: colors.secondaryText, fontSize: 13 },
  footer: { marginTop: 12 },
});
