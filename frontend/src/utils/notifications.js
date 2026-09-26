import { LocalNotifications } from '@capacitor/local-notifications';

export const requestNotificationPermission = async () => {
  try {
    const status = await LocalNotifications.checkPermissions();
    if (status.display !== 'granted') {
      await LocalNotifications.requestPermissions();
    }

    // High Importance Notification Channel for Alarms (Sound + Vibration + Heads-Up)
    await LocalNotifications.createChannel({
      id: 'medicine_alarms_channel',
      name: 'Medicine Reminders & Alarms',
      description: 'Loud sound and vibration alerts for scheduled medicine reminders',
      importance: 5, // Importance High/Max for heads-up alert + sound + vibration
      visibility: 1, // Show on Lock Screen
      vibration: true,
      sound: 'ringtone'
    });
  } catch (err) {
    console.warn("[NOTIF_PERM_ERR]", err);
  }
};

export const scheduleMedicineAlarm = async (medicine) => {
  try {
    if (!medicine || !medicine.time) return false;
    const [hours, minutes] = medicine.time.split(':').map(Number);

    const now = new Date();
    const targetDate = new Date();
    targetDate.setHours(hours, minutes, 0, 0);

    // If scheduled time for today has passed, set target date to tomorrow
    if (targetDate.getTime() <= now.getTime()) {
      targetDate.setDate(targetDate.getDate() + 1);
    }

    const notificationId = Math.abs(medicine.name.split('').reduce((a,b) => (((a << 5) - a) + b.charCodeAt(0)) | 0, 0)) % 1000000;

    await requestNotificationPermission();

    await LocalNotifications.schedule({
      notifications: [
        {
          title: `💊 Medicine Reminder: ${medicine.name}`,
          body: `Time to take your ${medicine.dosage} (${medicine.food})`,
          id: notificationId,
          channelId: 'medicine_alarms_channel',
          sound: 'ringtone',
          schedule: {
            at: targetDate,
            repeats: true,
            allowWhileIdle: true
          },
          extra: {
            medicineId: medicine._id
          }
        }
      ]
    });
    console.log(`[ALARM_SCHEDULED] ${medicine.name} at ${targetDate.toLocaleString()}`);
    return true;
  } catch (err) {
    console.error('Notification Error:', err);
    return false;
  }
};

export const cancelMedicineAlarm = async (medicineName) => {
  try {
    const notificationId = Math.abs(medicineName.split('').reduce((a,b) => (((a << 5) - a) + b.charCodeAt(0)) | 0, 0)) % 1000000;
    await LocalNotifications.cancel({
      notifications: [{ id: notificationId }]
    });
    console.log(`Alarm canceled for ${medicineName}`);
  } catch (err) {
    console.error('Cancel Notification Error:', err);
  }
};
