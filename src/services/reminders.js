import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import tokenStorage from './tokenStorage';
import { api } from './api';

const SCHEDULES_KEY_PREFIX = 'healthapp.reminder-schedules.';
const CHANNEL_ID = 'health-reminders';
const WEEKDAYS = { sunday: 1, monday: 2, tuesday: 3, wednesday: 4, thursday: 5, friday: 6, saturday: 7 };

let notificationsModule;

function notificationsAvailable() {
  return Constants.appOwnership !== 'expo';
}

async function getNotifications() {
  if (!notificationsAvailable()) return null;
  if (!notificationsModule) {
    notificationsModule = await import('expo-notifications');
    notificationsModule.setNotificationHandler({
      handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
    });
  }
  return notificationsModule;
}

function getTimezone() {
  const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return detectedTimezone === 'Asia/Calcutta' ? 'Asia/Kolkata' : detectedTimezone;
}

function schedulesKey(userId) {
  return `${SCHEDULES_KEY_PREFIX}${userId}`;
}

function timezoneKey(userId) {
  return `${schedulesKey(userId)}.timezone`;
}

async function readScheduleMap(userId) {
  if (!userId) return {};
  try {
    const value = await SecureStore.getItemAsync(schedulesKey(userId));
    return value ? JSON.parse(value) : {};
  } catch (error) {
    return {};
  }
}

async function writeScheduleMap(userId, scheduleMap) {
  await SecureStore.setItemAsync(schedulesKey(userId), JSON.stringify(scheduleMap));
}

async function ensureNotificationChannel() {
  const Notifications = await getNotifications();
  if (!Notifications) return;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Health reminders',
    importance: Notifications.AndroidImportance.DEFAULT,
    sound: 'default',
  });
}

async function getPermissionStatus() {
  try {
    const Notifications = await getNotifications();
    if (!Notifications) return { granted: false, status: 'expo-go-disabled' };
    if (Platform.OS === 'android') await ensureNotificationChannel();
    return await Notifications.getPermissionsAsync();
  } catch (error) {
    return { granted: false, status: 'unavailable' };
  }
}

async function requestNotificationPermission() {
  try {
    const Notifications = await getNotifications();
    if (!Notifications) return { granted: false, status: 'expo-go-disabled' };
    if (Platform.OS === 'android') await ensureNotificationChannel();
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return current;
    return Notifications.requestPermissionsAsync();
  } catch (error) {
    return { granted: false, status: 'unavailable' };
  }
}

function parseTime(value) {
  const match = String(value || '').match(/^(\d{1,2}):(\d{2})/);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  return hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59 ? { hour, minute } : null;
}

function normalizeWeekday(value) {
  if (typeof value === 'number' && value >= 1 && value <= 7) return value;
  const text = String(value || '').toLowerCase();
  return WEEKDAYS[text] || WEEKDAYS[text.slice(0, 3)] || null;
}

function weekdayValues(repeatDays) {
  let values = repeatDays;
  if (typeof values === 'string') {
    try { values = JSON.parse(values); } catch (error) { values = values.split(','); }
  }
  if (!Array.isArray(values)) return [];
  return [...new Set(values.map(normalizeWeekday).filter(Boolean))];
}

function onceTrigger(reminder, hour, minute) {
  const startDate = reminder.start_date ? new Date(`${reminder.start_date}T${String(reminder.reminder_time).slice(0, 5)}:00`) : new Date();
  if (Number.isNaN(startDate.getTime())) return null;
  if (!reminder.start_date && startDate.getTime() <= Date.now()) startDate.setDate(startDate.getDate() + 1);
  startDate.setHours(hour, minute, 0, 0);
  return { type: Notifications.SchedulableTriggerInputTypes.DATE, date: startDate };
}

async function cancelNotificationIds(notificationIds) {
  const Notifications = await getNotifications();
  if (!Notifications) return;
  await Promise.all((Array.isArray(notificationIds) ? notificationIds : []).map((id) => Notifications.cancelScheduledNotificationAsync(id).catch(() => {})));
}

async function cancelReminderNotifications(userId, reminderId) {
  const scheduleMap = await readScheduleMap(userId);
  await cancelNotificationIds(scheduleMap[reminderId]);
  delete scheduleMap[reminderId];
  await writeScheduleMap(userId, scheduleMap);
}

async function scheduleReminderNotification(userId, reminder) {
  await cancelReminderNotifications(userId, reminder.id);
  if (!reminder.is_enabled) return [];
  const Notifications = await getNotifications();
  if (!Notifications) return [];
  const permission = await requestNotificationPermission();
  if (!permission.granted) return [];
  const time = parseTime(reminder.reminder_time);
  if (!time) throw new Error('Reminder time is invalid.');

  const content = {
    title: reminder.title,
    body: reminder.message || `Time for your ${reminder.reminder_type} reminder.`,
    sound: 'default',
    data: { reminderId: reminder.id, reminderType: reminder.reminder_type },
    ...(Platform.OS === 'android' ? { channelId: CHANNEL_ID } : {}),
  };
  let triggers = [];
  if (reminder.repeat_type === 'once') {
    const trigger = onceTrigger(reminder, time.hour, time.minute);
    if (trigger) triggers = [trigger];
  } else if (reminder.repeat_type === 'daily') {
    triggers = [{ type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: time.hour, minute: time.minute }];
  } else {
    triggers = weekdayValues(reminder.repeat_days).map((weekday) => ({ type: Notifications.SchedulableTriggerInputTypes.WEEKLY, weekday, hour: time.hour, minute: time.minute }));
  }
  const notificationIds = [];
  for (const trigger of triggers) notificationIds.push(await Notifications.scheduleNotificationAsync({ content, trigger }));
  const scheduleMap = await readScheduleMap(userId);
  scheduleMap[reminder.id] = notificationIds;
  await writeScheduleMap(userId, scheduleMap);
  return notificationIds;
}

async function reconcileReminderNotifications(userId, reminders) {
  const scheduleMap = await readScheduleMap(userId);
  const timezone = getTimezone();
  const previousTimezone = await SecureStore.getItemAsync(timezoneKey(userId));
  const activeIds = new Set((Array.isArray(reminders) ? reminders : []).map((reminder) => String(reminder.id)));
  await Promise.all(Object.keys(scheduleMap).filter((id) => !activeIds.has(String(id))).map((id) => cancelReminderNotifications(userId, id)));
  for (const reminder of reminders || []) await scheduleReminderNotification(userId, reminder);
  if (previousTimezone !== timezone) await SecureStore.setItemAsync(timezoneKey(userId), timezone);
}

async function cancelAllReminderNotifications(userId) {
  const scheduleMap = await readScheduleMap(userId);
  await Promise.all(Object.values(scheduleMap).map((ids) => cancelNotificationIds(ids)));
  await SecureStore.deleteItemAsync(schedulesKey(userId)).catch(() => {});
  await SecureStore.deleteItemAsync(timezoneKey(userId)).catch(() => {});
}

async function listReminders() {
  const token = await tokenStorage.get();
  if (!token) return [];
  const data = await api.getReminders(token);
  return Array.isArray(data) ? data : data?.reminders || [];
}

async function createReminder(data) {
  const token = await tokenStorage.get();
  if (!token) throw new Error('Authentication is required to manage reminders.');
  return api.createReminder(token, data);
}

async function updateReminder(id, data) {
  const token = await tokenStorage.get();
  if (!token) throw new Error('Authentication is required to manage reminders.');
  return api.updateReminder(token, id, data);
}

async function deleteReminder(id) {
  const token = await tokenStorage.get();
  if (!token) throw new Error('Authentication is required to manage reminders.');
  return api.deleteReminder(token, id);
}

export {
  cancelAllReminderNotifications,
  cancelReminderNotifications,
  createReminder,
  deleteReminder,
  getPermissionStatus,
  getTimezone,
  listReminders,
  reconcileReminderNotifications,
  requestNotificationPermission,
  scheduleReminderNotification,
  updateReminder,
};
