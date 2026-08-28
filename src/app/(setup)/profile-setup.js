import React, { useEffect, useState } from 'react';
import { View, StyleSheet, TextInput, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AppText from '../../components/ui/AppText';
import PrimaryButton from '../../components/ui/PrimaryButton';
import colors from '../../constants/colors';
import { useAuth } from '../../context/AuthContext';
import { formatDateForApi, formatDateForDisplay, isFutureDisplayDate } from '../../services/profile';

export default function ProfileSetup() {
  const router = useRouter();
  const { fitnessGoal } = useLocalSearchParams();
  const { isAuthenticated, user, profile, updateProfile } = useAuth();
  const [fields, setFields] = useState({ firstName: user?.first_name || '', dateOfBirth: '', gender: '', height: '', weight: '', activityLevel: '', fitnessGoal: fitnessGoal || '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const updateField = (key, value) => setFields((current) => ({ ...current, [key]: value }));
  const inputs = [
    { key: 'firstName', label: 'FIRST NAME', placeholder: 'Your first name', icon: 'person-outline' },
    { key: 'dateOfBirth', label: 'DATE OF BIRTH', placeholder: 'DD/MM/YYYY', icon: 'calendar-outline' },
    { key: 'height', label: 'HEIGHT', placeholder: '180', icon: 'resize-outline', suffix: 'cm', keyboardType: 'numeric' },
    { key: 'weight', label: 'WEIGHT', placeholder: '75', icon: 'scale-outline', suffix: 'kg', keyboardType: 'numeric' },
  ];

  useEffect(() => {
    if (!profile) return;
    setFields((current) => ({ ...current, firstName: profile.fullName || user?.first_name || '', dateOfBirth: formatDateForDisplay(profile.dateOfBirth), height: profile.height === null ? '' : String(profile.height), weight: profile.weight === null ? '' : String(profile.weight), gender: profile.gender || '', activityLevel: profile.activityLevel || '', fitnessGoal: profile.goal || fitnessGoal || '' }));
  }, [profile, user]);

  const handleSubmit = async () => {
    const nextErrors = Object.keys(fields).reduce((result, key) => {
      if (!fields[key].trim()) result[key] = 'Required';
      return result;
    }, {});

    const dateOfBirth = formatDateForApi(fields.dateOfBirth.trim());
    if (!dateOfBirth) nextErrors.dateOfBirth = 'Use a valid date in DD/MM/YYYY format.';
    if (isFutureDisplayDate(fields.dateOfBirth.trim())) nextErrors.dateOfBirth = 'Date of birth cannot be in the future.';
    if (fields.height && (Number.isNaN(Number(fields.height)) || Number(fields.height) < 50 || Number(fields.height) > 300)) nextErrors.height = 'Use a height between 50 and 300 cm.';
    if (fields.weight && (Number.isNaN(Number(fields.weight)) || Number(fields.weight) <= 0 || Number(fields.weight) > 500)) nextErrors.weight = 'Use a weight greater than 0 and at most 500 kg.';

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const body = { first_name: fields.firstName.trim(), date_of_birth: dateOfBirth, height_cm: Number(fields.height), weight_kg: Number(fields.weight) };
    if (fields.gender.trim()) body.gender = fields.gender.trim();
    if (fields.activityLevel) body.activity_level = fields.activityLevel;
    if (fields.fitnessGoal) body.fitness_goal = fields.fitnessGoal;

    setSubmitting(true);
    try {
      if (isAuthenticated) {
        await updateProfile(body);
        router.replace('/(tabs)');
      } else {
        router.push({ pathname: '/(auth)/register', params: { firstName: fields.firstName.trim(), profile: JSON.stringify(body) } });
      }
    } catch (requestError) {
      const mappedErrors = {};
      Object.entries(requestError.fields || {}).forEach(([key, message]) => { mappedErrors[{ first_name: 'firstName', date_of_birth: 'dateOfBirth', height_cm: 'height', weight_kg: 'weight', activity_level: 'activityLevel', fitness_goal: 'form' }[key] || key] = message; });
      setErrors(Object.keys(mappedErrors).length ? mappedErrors : { form: requestError.message || 'Unable to save your profile.' });
    } finally {
      setSubmitting(false);
    }
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

      <View style={styles.field}><AppText weight="semibold" style={styles.label}>GENDER</AppText><View style={styles.choiceRow}>{['female', 'male'].map((value) => <TouchableOpacity key={value} onPress={() => updateField('gender', value)} style={[styles.choice, fields.gender === value && styles.choiceActive]}><AppText style={styles.choiceText}>{value}</AppText></TouchableOpacity>)}</View>{errors.gender ? <AppText style={styles.errorText}>{errors.gender}</AppText> : null}</View>
      <View style={styles.field}><AppText weight="semibold" style={styles.label}>ACTIVITY LEVEL</AppText><View style={styles.choiceRow}>{['sedentary', 'light', 'moderate', 'active', 'very_active'].map((value) => <TouchableOpacity key={value} onPress={() => updateField('activityLevel', value)} style={[styles.choice, fields.activityLevel === value && styles.choiceActive]}><AppText style={styles.choiceText}>{value.replaceAll('_', ' ')}</AppText></TouchableOpacity>)}</View>{errors.activityLevel ? <AppText style={styles.errorText}>{errors.activityLevel}</AppText> : null}</View>
      <View style={styles.field}><AppText weight="semibold" style={styles.label}>HEALTH GOAL</AppText><View style={styles.choiceRow}>{[['weight_loss', 'Lose weight'], ['weight_gain', 'Gain weight'], ['muscle_gain', 'Build muscle'], ['maintenance', 'Maintain'], ['general_wellness', 'General wellness']].map(([value, label]) => <TouchableOpacity key={value} onPress={() => updateField('fitnessGoal', value)} style={[styles.choice, fields.fitnessGoal === value && styles.choiceActive]}><AppText style={styles.choiceText}>{label}</AppText></TouchableOpacity>)}</View>{errors.fitnessGoal ? <AppText style={styles.errorText}>{errors.fitnessGoal}</AppText> : null}</View>

      {errors.form ? <AppText style={styles.errorText}>{errors.form}</AppText> : null}
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
  choiceRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  choice: { minWidth: '46%', flex: 1, minHeight: 42, paddingHorizontal: 10, paddingVertical: 10, borderRadius: 14, backgroundColor: colors.glassLight, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  choiceActive: { backgroundColor: colors.mint, borderColor: colors.primary },
  choiceText: { color: colors.text, fontSize: 12, textTransform: 'capitalize' },
  errorText: { color: colors.danger, fontSize: 12, marginTop: 6 },
});
