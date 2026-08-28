import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppText from '../components/ui/AppText';
import GradientBackground from '../components/ui/GradientBackground';
import PrimaryButton from '../components/ui/PrimaryButton';
import colors from '../constants/colors';
import { activityLabels, formatDateForApi, formatDateForDisplay, goalLabels, isFutureDisplayDate } from '../services/profile';
import { useAuth } from '../context/AuthContext';

const genderOptions = ['female', 'male'];
const goalOptions = ['weight_loss', 'weight_gain', 'muscle_gain', 'maintenance', 'general_wellness'];
const activityOptions = ['sedentary', 'light', 'moderate', 'active', 'very_active'];

function Field({ label, placeholder, value, error, onChange, keyboardType, autoCapitalize = 'words' }) {
  return (
    <View style={[styles.field, error && styles.fieldError]}>
      <AppText weight="semibold" style={styles.label}>{label}</AppText>
      <TextInput value={value} onChangeText={onChange} placeholder={placeholder} placeholderTextColor={colors.tertiaryText} style={styles.input} keyboardType={keyboardType} autoCapitalize={autoCapitalize} />
      {error ? <AppText style={styles.errorText}>{error}</AppText> : null}
    </View>
  );
}

function Choices({ label, options, value, labels, onChange, error }) {
  return (
    <View style={[styles.field, error && styles.fieldError]}>
      <AppText weight="semibold" style={styles.label}>{label}</AppText>
      <View style={styles.choiceRow}>
        {options.map((option) => <TouchableOpacity key={option} onPress={() => onChange(option)} style={[styles.choice, value === option && styles.choiceActive]}><AppText style={styles.choiceText}>{labels[option]}</AppText></TouchableOpacity>)}
      </View>
      {error ? <AppText style={styles.errorText}>{error}</AppText> : null}
    </View>
  );
}

export default function EditProfile() {
  const router = useRouter();
  const { isAuthenticated, user, profile, profileLoading, refreshProfile, updateProfile } = useAuth();
  const [fields, setFields] = useState({ firstName: '', lastName: '', dateOfBirth: '', gender: '', height: '', weight: '', fitnessGoal: '', activityLevel: '' });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || profile) return;
    refreshProfile().catch(() => {});
  }, [isAuthenticated, profile, refreshProfile]);

  useEffect(() => {
    if (!profile) return;
    setFields({ firstName: profile.firstName || user?.first_name || '', lastName: profile.lastName || user?.last_name || '', dateOfBirth: formatDateForDisplay(profile.dateOfBirth), gender: profile.gender || '', height: profile.height === null ? '' : String(profile.height), weight: profile.weight === null ? '' : String(profile.weight), fitnessGoal: profile.goal || '', activityLevel: profile.activityLevel || '' });
  }, [profile, user]);

  if (!isAuthenticated) return <Redirect href="/(auth)/welcome" />;

  const updateField = (name, value) => {
    setFields((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined, form: undefined }));
  };

  const validate = () => {
    const nextErrors = {};
    const dateForApi = formatDateForApi(fields.dateOfBirth.trim());
    if (!fields.firstName.trim()) nextErrors.firstName = 'First name is required.';
    if (!fields.lastName.trim()) nextErrors.lastName = 'Last name is required.';
    if (!dateForApi) nextErrors.dateOfBirth = 'Use a valid date in DD/MM/YYYY format.';
    if (isFutureDisplayDate(fields.dateOfBirth.trim())) nextErrors.dateOfBirth = 'Date of birth cannot be in the future.';
    if (!genderOptions.includes(fields.gender)) nextErrors.gender = 'Choose male or female.';
    if (Number.isNaN(Number(fields.height)) || Number(fields.height) < 50 || Number(fields.height) > 300) nextErrors.height = 'Height must be between 50 and 300 cm.';
    if (Number.isNaN(Number(fields.weight)) || Number(fields.weight) <= 0 || Number(fields.weight) > 500) nextErrors.weight = 'Weight must be greater than 0 and at most 500 kg.';
    if (!goalOptions.includes(fields.fitnessGoal)) nextErrors.fitnessGoal = 'Choose a fitness goal.';
    if (!activityOptions.includes(fields.activityLevel)) nextErrors.activityLevel = 'Choose an activity level.';
    return nextErrors;
  };

  const save = async () => {
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setSaving(true);
    try {
      await updateProfile({ first_name: fields.firstName.trim(), last_name: fields.lastName.trim(), date_of_birth: formatDateForApi(fields.dateOfBirth.trim()), gender: fields.gender, height_cm: Number(fields.height), weight_kg: Number(fields.weight), fitness_goal: fields.fitnessGoal, activity_level: fields.activityLevel });
      router.replace({ pathname: '/(tabs)/profile', params: { saved: '1' } });
    } catch (error) {
      const mapped = {};
      Object.entries(error.fields || {}).forEach(([key, message]) => { mapped[{ first_name: 'firstName', last_name: 'lastName', date_of_birth: 'dateOfBirth', height_cm: 'height', weight_kg: 'weight', fitness_goal: 'fitnessGoal', activity_level: 'activityLevel' }[key] || key] = message; });
      setErrors(Object.keys(mapped).length ? mapped : { form: error.message || 'Unable to save your profile. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <GradientBackground>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <TouchableOpacity onPress={() => router.back()}><AppText weight="semibold" style={styles.back}>← Back</AppText></TouchableOpacity>
            <View style={styles.intro}><AppText weight="bold" size={30}>Edit your profile.</AppText><AppText style={styles.subtitle}>Keep your details current so HealthAI can stay personal.</AppText></View>
            {profileLoading && !profile ? <AppText style={styles.loading}>Loading your saved profile...</AppText> : null}
            <AppText weight="semibold" style={styles.sectionTitle}>Personal information</AppText>
            <Field label="FIRST NAME" placeholder="Your first name" value={fields.firstName} error={errors.firstName} onChange={(value) => updateField('firstName', value)} />
            <Field label="LAST NAME" placeholder="Your last name" value={fields.lastName} error={errors.lastName} onChange={(value) => updateField('lastName', value)} />
            <Field label="DATE OF BIRTH" placeholder="DD/MM/YYYY" autoCapitalize="none" value={fields.dateOfBirth} error={errors.dateOfBirth} onChange={(value) => updateField('dateOfBirth', value)} />
            <Choices label="GENDER" options={genderOptions} labels={{ female: 'Female', male: 'Male' }} value={fields.gender} error={errors.gender} onChange={(value) => updateField('gender', value)} />
            <AppText weight="semibold" style={styles.sectionTitle}>Body information</AppText>
            <Field label="HEIGHT" placeholder="180" keyboardType="numeric" autoCapitalize="none" value={fields.height} error={errors.height} onChange={(value) => updateField('height', value)} />
            <Field label="WEIGHT" placeholder="75" keyboardType="numeric" autoCapitalize="none" value={fields.weight} error={errors.weight} onChange={(value) => updateField('weight', value)} />
            <AppText weight="semibold" style={styles.sectionTitle}>Health and fitness</AppText>
            <Choices label="FITNESS GOAL" options={goalOptions} labels={goalLabels} value={fields.fitnessGoal} error={errors.fitnessGoal} onChange={(value) => updateField('fitnessGoal', value)} />
            <Choices label="ACTIVITY LEVEL" options={activityOptions} labels={activityLabels} value={fields.activityLevel} error={errors.activityLevel} onChange={(value) => updateField('activityLevel', value)} />
            {errors.form ? <AppText style={styles.errorText}>{errors.form}</AppText> : null}
            <PrimaryButton title="Save Profile" onPress={save} loading={saving} disabled={saving || profileLoading} style={styles.saveButton} />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1 },
  content: { padding: 24, paddingBottom: 44 },
  back: { color: colors.primary, fontSize: 14 },
  intro: { marginTop: 32, marginBottom: 22 },
  subtitle: { color: colors.secondaryText, marginTop: 8, lineHeight: 22 },
  loading: { color: colors.secondaryText, marginBottom: 14 },
  sectionTitle: { fontSize: 18, marginTop: 12, marginBottom: 12 },
  field: { backgroundColor: colors.glassLight, borderWidth: 1, borderColor: colors.border, borderRadius: 22, padding: 16, marginBottom: 12 },
  fieldError: { borderColor: colors.danger },
  label: { color: colors.secondaryText, fontSize: 10, letterSpacing: 1.3, marginBottom: 8 },
  input: { paddingVertical: 4, fontSize: 18, color: colors.text },
  choiceRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 2 },
  choice: { minWidth: '46%', flex: 1, minHeight: 42, paddingHorizontal: 10, paddingVertical: 10, borderRadius: 14, backgroundColor: colors.glassLight, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  choiceActive: { backgroundColor: colors.mint, borderColor: colors.primary },
  choiceText: { color: colors.text, fontSize: 12, textTransform: 'capitalize' },
  errorText: { color: colors.danger, fontSize: 12, marginTop: 6 },
  saveButton: { marginTop: 18 },
});
