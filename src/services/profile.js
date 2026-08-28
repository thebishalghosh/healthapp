const fieldAliases = {
  firstName: ['first_name', 'firstName'],
  lastName: ['last_name', 'lastName'],
  fullName: ['full_name', 'fullName', 'name', 'first_name'],
  dateOfBirth: ['date_of_birth', 'dateOfBirth'],
  gender: ['gender', 'sex'],
  height: ['height', 'height_cm'],
  weight: ['weight', 'weight_kg'],
  goal: ['fitness_goal', 'goal', 'health_goal'],
  activityLevel: ['activity_level', 'activityLevel'],
};

function firstValue(source, aliases) {
  const key = aliases.find((candidate) => source?.[candidate] !== undefined && source[candidate] !== null && source[candidate] !== '');
  return key ? source[key] : null;
}
function dateParts(value, separator) {
  const parts = value.split(separator);
  if (parts.length !== 3 || parts.some((part) => !/^\d+$/.test(part))) return null;
  const [first, second, third] = parts.map(Number);
  const day = separator === '/' ? first : third;
  const month = separator === '/' ? second : second;
  const year = separator === '/' ? third : first;
  if (String(day).padStart(2, '0') !== (separator === '/' ? parts[0] : parts[2]) || String(month).padStart(2, '0') !== parts[1] || String(year).padStart(4, '0') !== (separator === '/' ? parts[2] : parts[0])) return null;
  const daysInMonth = new Date(year, month, 0).getDate();
  if (month < 1 || month > 12 || day < 1 || day > daysInMonth || year < 1 || year > 9999) return null;
  return { day, month, year };
}

function formatDateForDisplay(apiDate) {
  const parts = typeof apiDate === 'string' ? dateParts(apiDate, '-') : null;
  return parts ? `${String(parts.day).padStart(2, '0')}/${String(parts.month).padStart(2, '0')}/${String(parts.year).padStart(4, '0')}` : '';
}

function formatDateForApi(displayDate) {
  const parts = typeof displayDate === 'string' ? dateParts(displayDate, '/') : null;
  return parts ? `${String(parts.year).padStart(4, '0')}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}` : '';
}

function isFutureDisplayDate(displayDate) {
  const parts = typeof displayDate === 'string' ? dateParts(displayDate, '/') : null;
  if (!parts) return false;
  const today = new Date();
  return parts.year > today.getFullYear() || (parts.year === today.getFullYear() && (parts.month > today.getMonth() + 1 || (parts.month === today.getMonth() + 1 && parts.day > today.getDate())));
}
function unwrapProfile(payload) {
  return payload?.profile || payload?.data?.profile || payload?.data || payload || {};
}

function normalizeProfile(payload) {
  const source = unwrapProfile(payload);
  const fields = Object.fromEntries(Object.entries(fieldAliases).map(([name, aliases]) => [name, firstValue(source, aliases)]));
  const completionFields = ['dateOfBirth', 'gender', 'height', 'weight', 'goal', 'activityLevel'];
  const availableFields = completionFields.map((name) => fieldAliases[name]).filter((aliases) => aliases.some((key) => Object.prototype.hasOwnProperty.call(source, key)));
  const completedFields = availableFields.filter((aliases) => firstValue(source, aliases) !== null).length;
  const birthDate = fields.dateOfBirth ? new Date(`${fields.dateOfBirth}T00:00:00`) : null;
  const today = new Date();
  const age = birthDate && !Number.isNaN(birthDate.getTime()) ? today.getFullYear() - birthDate.getFullYear() - ((today.getMonth() < birthDate.getMonth() || (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate())) ? 1 : 0) : null;

  return {
    ...fields,
    age,
    completion: availableFields.length ? Math.round((completedFields / availableFields.length) * 100) : 0,
  };
}

export { formatDateForApi, formatDateForDisplay, isFutureDisplayDate, normalizeProfile };

export const goalLabels = {
  weight_loss: 'Lose weight',
  weight_gain: 'Gain weight',
  muscle_gain: 'Build muscle',
  maintenance: 'Maintain weight',
  general_wellness: 'General wellness',
};

export const activityLabels = {
  sedentary: 'Sedentary',
  light: 'Light',
  moderate: 'Moderate',
  active: 'Active',
  very_active: 'Very active',
};