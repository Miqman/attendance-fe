import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { FontAwesome6 } from '@expo/vector-icons';
import { BottomNavigation } from '@/components/BottomNavigation';
import { CameraModal } from '@/components/CameraModal';
import { Toast } from '@/components/Toast';
import * as Location from 'expo-location';
import { api } from '@/services/api';
import { useAuthStore } from '@/services/authStore';

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour >= 4 && hour < 11) return 'Selamat Pagi 👋';
  if (hour >= 11 && hour < 15) return 'Selamat Siang ☀️';
  if (hour >= 15 && hour < 19) return 'Selamat Sore 🌅';
  return 'Selamat Malam 🌙';
};

const getShiftText = () => {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 14) return 'Shift Pagi';
  if (hour >= 14 && hour < 22) return 'Shift Siang';
  return 'Shift Malam';
};

const getFormattedDate = () => {
  const now = new Date();
  const options: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'short' };
  return now.toLocaleDateString('id-ID', options);
};

export default function DashboardScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  // Dynamic State
  const [isInsideGeofence, setIsInsideGeofence] = useState(true);
  const [locationPermissionGranted, setLocationPermissionGranted] = useState<boolean | null>(null);
  const [currentCoords, setCurrentCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [clockState, setClockState] = useState<'Clock In' | 'Clock Out'>('Clock In');
  const [workHours, setWorkHours] = useState(0);
  const [workHoursPercent, setWorkHoursPercent] = useState(0);
  const [todayLogs, setTodayLogs] = useState<any[]>([]);
  const [cameraVisible, setCameraVisible] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [timeString, setTimeString] = useState('08:28:14');
  const [ampm, setAmpm] = useState('AM');
  const [loadingAtt, setLoadingAtt] = useState(false);
  const [isMockLocation, setIsMockLocation] = useState<boolean>(false);

  // Request GPS Location Permissions & Real Position with Anti-Mock GPS detection
  const requestLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationPermissionGranted(false);
        setToastMsg('Izin Lokasi Ditolak: Akses GPS diperlukan untuk melakukan presensi.');
        return false;
      }
      setLocationPermissionGranted(true);
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      
      // Anti-Mock GPS Detection
      if ((loc as any)?.mocked) {
        setIsMockLocation(true);
        setToastMsg('Peringatan Anti-Fraud: Fake GPS / Mock Location terdeteksi pada perangkat!');
        return false;
      } else {
        setIsMockLocation(false);
      }

      if (loc?.coords) {
        setCurrentCoords({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
      }
      return true;
    } catch (err) {
      console.log('Location permission error:', err);
      setLocationPermissionGranted(false);
      return false;
    }
  };

  useEffect(() => {
    requestLocation();
  }, []);

  // Helper to calculate dynamic work hours from API attendance records
  const updateAttendanceState = (attendances: any[]) => {
    if (!attendances || attendances.length === 0) {
      setClockState('Clock In');
      setWorkHours(0);
      setWorkHoursPercent(0);
      return;
    }

    const lastAtt = attendances[0];
    const attDate = new Date(lastAtt.timestamp).toDateString();
    const isToday = attDate === new Date().toDateString();

    if (isToday && lastAtt.type === 'in') {
      setClockState('Clock Out');
      const elapsedMs = Math.max(0, new Date().getTime() - new Date(lastAtt.timestamp).getTime());
      const elapsedHours = Math.min(8.0, elapsedMs / (1000 * 60 * 60));
      const roundedHours = Math.round(elapsedHours * 10) / 10;
      setWorkHours(roundedHours);
      setWorkHoursPercent(Math.min(100, Math.round((roundedHours / 8.0) * 100)));
    } else if (isToday && lastAtt.type === 'out') {
      setClockState('Clock In');
      const hours = lastAtt.work_hours || 8.0;
      setWorkHours(hours);
      setWorkHoursPercent(100);
    } else {
      setClockState('Clock In');
      setWorkHours(0);
      setWorkHoursPercent(0);
    }
  };

  // Fetch profile & live attendance history on mount
  useEffect(() => {
    (async () => {
      const profileRes = await api.getProfile();
      if (profileRes.profile) {
        setUser(profileRes.profile);
      }

      const historyRes = await api.getAttendanceHistory();
      if (historyRes.attendances && historyRes.attendances.length > 0) {
        setTodayLogs(historyRes.attendances);
        updateAttendanceState(historyRes.attendances);
      } else {
        setClockState('Clock In');
        setWorkHours(0);
        setWorkHoursPercent(0);
      }
    })();
  }, []);

  // Real-time digital clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, '0');
      const m = String(now.getMinutes()).padStart(2, '0');
      const s = String(now.getSeconds()).padStart(2, '0');
      const isPm = now.getHours() >= 12;
      setTimeString(`${h}:${m}:${s}`);
      setAmpm(isPm ? 'PM' : 'AM');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const isGeofenceRequired = Number(user?.is_geofence_required || 0) === 1;

  // Clock In/Out action button press (Re-requests location if not granted)
  const handleClockAction = async () => {
    if (isMockLocation) {
      setToastMsg('Peringatan Anti-Fraud: Nonaktifkan Mock Location / Fake GPS terlebih dahulu!');
      return;
    }
    if (!locationPermissionGranted) {
      const hasPermission = await requestLocation();
      if (!hasPermission) return;
    }
    if (isGeofenceRequired && !isInsideGeofence) {
      setToastMsg('Peringatan: Perusahaan mewajibkan absensi di dalam radius kantor!');
      return;
    }
    setCameraVisible(true);
  };

  // Selfie captured & submitted from native camera
  const handleTakeSelfie = async (photoBase64: string) => {
    setCameraVisible(false);
    if (isMockLocation) {
      setToastMsg('Absensi Ditolak: Terdeteksi Fake GPS / Mock Location aktif.');
      return;
    }

    const type = clockState === 'Clock In' ? 'in' : 'out';
    const latitude = currentCoords?.latitude ?? -6.20881;
    const longitude = currentCoords?.longitude ?? 106.84562;

    setLoadingAtt(true);
    const res = await api.submitAttendance({
      type,
      latitude,
      longitude,
      photo_base64: photoBase64,
      is_mocked: isMockLocation,
    });
    setLoadingAtt(false);

    if (res.success) {
      setToastMsg(res.message || `Berhasil ${type === 'in' ? 'Clock In' : 'Clock Out'}!`);

      // Refresh live history
      const historyRes = await api.getAttendanceHistory();
      if (historyRes.attendances) {
        setTodayLogs(historyRes.attendances);
        updateAttendanceState(historyRes.attendances);
      }
    } else {
      setToastMsg(res.error || 'Gagal melakukan presensi');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Toast message={toastMsg} onHide={() => setToastMsg(null)} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header Profile Bar */}
        <View style={styles.headerRow}>
          <View style={styles.userProfileGroup}>
            <TouchableOpacity onPress={() => router.push('/profile')}>
              <Image
                source={{
                  uri:
                    user?.avatar_url ||
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
                }}
                style={styles.avatarImg}
              />
            </TouchableOpacity>
            <View>
              <Text style={styles.greetingText}>{getGreeting()}</Text>
              <Text style={styles.userName}>{user?.full_name || 'Karyawan'}</Text>
            </View>
          </View>

          <TouchableOpacity onPress={() => setToastMsg('Notifikasi: Semua tugas hari ini lengkap!')} style={styles.bellBtn}>
            <FontAwesome6 name="bell" size={16} color="#1E3A44" />
            <View style={styles.bellBadge} />
          </TouchableOpacity>
        </View>

        {/* Hero Card: Clock In Status & Digital Timer */}
        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <View style={[styles.badgePill, (!isGeofenceRequired || isInsideGeofence) ? styles.badgePillSuccess : styles.badgePillError]}>
              <View style={[styles.pulseDot, { backgroundColor: (!isGeofenceRequired || isInsideGeofence) ? '#34D399' : '#FB7185' }]} />
              <Text style={styles.badgeText}>
                {!isGeofenceRequired
                  ? 'Absensi Fleksibel (WFH/Remote)'
                  : isInsideGeofence
                  ? 'Dalam Radius (12m)'
                  : 'Luar Radius (120m)'}
              </Text>
            </View>
            <Text style={styles.shiftText}>{getShiftText()}</Text>
          </View>

          {/* Live Digital Clock Display */}
          <View style={styles.clockDisplayBox}>
            <Text style={styles.clockSubhead}>WAKTU SEKARANG</Text>
            <Text style={styles.clockTimeText}>
              {timeString} <Text style={styles.ampmText}>{ampm}</Text>
            </Text>
            <Text style={styles.clockDateText}>{getFormattedDate()} • {user?.office_name || 'HQ Tower Jakarta'}</Text>
          </View>

          {/* Progress Circular Gauge & Action */}
          <View style={styles.gaugeActionRow}>
            <View style={styles.gaugeLeftGroup}>
              {/* Gauge Graphic */}
              <View style={styles.gaugeCircle}>
                <Text style={styles.gaugePercent}>{workHoursPercent}%</Text>
              </View>
              <View>
                <Text style={styles.gaugeTitle}>Jam Kerja Hari Ini</Text>
                <Text style={styles.gaugeSubtitle}>
                  <Text style={{ color: '#FF9F43', fontWeight: '800' }}>
                    {workHours.toFixed(1)} jam
                  </Text>{' '}
                  / 8.0 jam
                </Text>
              </View>
            </View>

            {/* Dynamic Clock Action CTA Button */}
            <TouchableOpacity
              onPress={handleClockAction}
              disabled={loadingAtt}
              style={[styles.clockActionBtn, (isGeofenceRequired && !isInsideGeofence) && { opacity: 0.6 }]}
            >
              {loadingAtt ? (
                <ActivityIndicator color="#1E3A44" size="small" />
              ) : (
                <>
                  <FontAwesome6
                    name={clockState === 'Clock In' ? 'right-to-bracket' : 'right-from-bracket'}
                    size={14}
                    color="#1E3A44"
                  />
                  <Text style={styles.clockActionLabel}>{clockState}</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Service Action Banner */}
        <View style={styles.quickServicesRow}>
          <TouchableOpacity
            onPress={() => router.push('/requests')}
            style={styles.quickServiceCardOrange}
          >
            <View style={styles.quickServiceIconBoxOrange}>
              <FontAwesome6 name="calendar-plus" size={16} color="#FF9F43" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.quickServiceTitle}>Pengajuan & Izin</Text>
              <Text style={styles.quickServiceSub}>Cuti, Sakit, Lembur & Approval</Text>
            </View>
            <FontAwesome6 name="chevron-right" size={12} color="#FF9F43" />
          </TouchableOpacity>
        </View>

        {/* Section: Today's Schedule (Bento Grid) */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Aktivitas & Jadwal Hari Ini</Text>
          <TouchableOpacity onPress={() => router.push('/history')}>
            <Text style={styles.sectionLink}>Lihat Semua</Text>
          </TouchableOpacity>
        </View>

        {/* Bento Layout Grid */}
        <View style={styles.bentoGrid}>
          {/* Card 1: Standup */}
          <View style={styles.bentoCreamCard}>
            <View style={styles.bentoCardTop}>
              <View style={styles.bentoIconOrange}>
                <FontAwesome6 name="users" size={12} color="#FF9F43" />
              </View>
              <View style={styles.timeBadgeCream}>
                <Text style={styles.timeTextCream}>09:00</Text>
              </View>
            </View>
            <View>
              <Text style={styles.bentoCardTitle}>Team Standup</Text>
              <Text style={styles.bentoCardSub}>Google Meet • Online</Text>
            </View>
          </View>

          {/* Card 2: Design Sync */}
          <View style={styles.bentoWhiteCard}>
            <View style={styles.bentoCardTop}>
              <View style={styles.bentoIconSlate}>
                <FontAwesome6 name="pen-nib" size={12} color="#1E3A44" />
              </View>
              <View style={styles.timeBadgeSlate}>
                <Text style={styles.timeTextSlate}>13:30</Text>
              </View>
            </View>
            <View>
              <Text style={styles.bentoCardTitle}>Sync Design System</Text>
              <Text style={styles.bentoCardSub}>Ruang Rapat 4A</Text>
            </View>
          </View>
        </View>

        {/* Section: Recent Attendance Log */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Log Absensi Terbaru</Text>
        </View>

        {todayLogs.length > 0 ? (
          todayLogs.slice(0, 2).map((log, idx) => (
            <TouchableOpacity key={log.id || idx} onPress={() => router.push('/history')} style={styles.recentActivityCard}>
              <View style={styles.activityLeftGroup}>
                <View style={[styles.activityIconCircle, { backgroundColor: log.type === 'in' ? '#ECFDF5' : '#FFF2E5' }]}>
                  <FontAwesome6
                    name={log.type === 'in' ? 'right-to-bracket' : 'right-from-bracket'}
                    size={14}
                    color={log.type === 'in' ? '#10B981' : '#FF9F43'}
                  />
                </View>
                <View>
                  <Text style={styles.activityTitle}>
                    {log.type === 'in' ? 'Clock In (Absen Masuk)' : 'Clock Out (Absen Keluar)'}
                  </Text>
                  <Text style={styles.activityTime}>
                    {new Date(log.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} • {log.notes || 'Verified GPS'}
                  </Text>
                </View>
              </View>

              <View style={[styles.statusBadgeGreen, log.status === 'late' && { backgroundColor: '#FFE4E6' }]}>
                <Text style={[styles.statusBadgeTextGreen, log.status === 'late' && { color: '#F43F5E' }]}>
                  {log.status === 'on_time' ? 'Tepat Waktu' : 'Terlambat'}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.recentActivityCard}>
            <View style={styles.activityLeftGroup}>
              <View style={styles.activityIconCircle}>
                <FontAwesome6 name="circle-info" size={14} color="#FF9F43" />
              </View>
              <View>
                <Text style={styles.activityTitle}>Belum Ada Absensi Hari Ini</Text>
                <Text style={styles.activityTime}>Tekan tombol Clock In untuk melakukan presensi</Text>
              </View>
            </View>

            <View style={[styles.statusBadgeGreen, { backgroundColor: '#F1F5F9' }]}>
              <Text style={[styles.statusBadgeTextGreen, { color: '#64748B' }]}>Belum Absen</Text>
            </View>
          </View>
        )}

        {/* Bottom Spacer for Floating Navigation */}
        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Native Camera Modal */}
      <CameraModal
        visible={cameraVisible}
        actionTitle={clockState}
        isInsideGeofence={isInsideGeofence}
        isGeofenceRequired={isGeofenceRequired}
        onClose={() => setCameraVisible(false)}
        onTakeSelfie={handleTakeSelfie}
      />

      {/* Floating Bottom Navigation */}
      <BottomNavigation onOpenCamera={() => setCameraVisible(true)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F4F6F6',
  },
  simulatorBar: {
    backgroundColor: '#1E3A44',
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  simLabel: {
    color: '#8C9A9E',
    fontSize: 10,
    fontWeight: '700',
  },
  simBtn: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 9999,
    borderWidth: 1,
  },
  simBtnInactive: {
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  simBtnActiveSuccess: {
    borderColor: '#34D399',
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
  },
  simBtnActiveError: {
    borderColor: '#FB7185',
    backgroundColor: 'rgba(251, 113, 133, 0.15)',
  },
  simBtnText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#8C9A9E',
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  userProfileGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarImg: {
    width: 44,
    height: 44,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#FF9F43',
  },
  greetingText: {
    fontSize: 11,
    color: '#8C9A9E',
    fontWeight: '600',
  },
  userName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E3A44',
  },
  bellBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1E3A44',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    position: 'relative',
  },
  bellBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF9F43',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  heroCard: {
    backgroundColor: '#1E3A44',
    borderRadius: 32,
    padding: 20,
    gap: 16,
    shadowColor: '#1E3A44',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  badgePillSuccess: {
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.3)',
  },
  badgePillError: {
    backgroundColor: 'rgba(251, 113, 133, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(251, 113, 133, 0.3)',
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  shiftText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#CBD5E1',
  },
  clockDisplayBox: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  clockSubhead: {
    fontSize: 9,
    fontWeight: '800',
    color: '#8C9A9E',
    letterSpacing: 1,
    marginBottom: 2,
  },
  clockTimeText: {
    fontSize: 34,
    fontWeight: '900',
    color: '#FFFFFF',
    fontFamily: 'monospace',
  },
  ampmText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FF9F43',
  },
  clockDateText: {
    fontSize: 11,
    color: '#CBD5E1',
    fontWeight: '500',
    marginTop: 2,
  },
  gaugeActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 24,
    padding: 14,
  },
  gaugeLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  gaugeCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 3,
    borderColor: '#FF9F43',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 159, 67, 0.1)',
  },
  gaugePercent: {
    fontSize: 11,
    fontWeight: '900',
    color: '#FF9F43',
  },
  gaugeTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  gaugeSubtitle: {
    fontSize: 10,
    color: '#8C9A9E',
    marginTop: 2,
  },
  clockActionBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 9999,
    backgroundColor: '#FF9F43',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    shadowColor: '#FF9F43',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  clockActionLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1E3A44',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E3A44',
  },
  sectionLink: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FF9F43',
  },
  bentoGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  bentoCreamCard: {
    flex: 1,
    backgroundColor: '#FFF2E5',
    borderRadius: 24,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: '#FFE0C2',
  },
  bentoWhiteCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#1E3A44',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  bentoCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bentoIconOrange: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bentoIconSlate: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F4F6F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeBadgeCream: {
    backgroundColor: 'rgba(255, 159, 67, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 9999,
  },
  timeTextCream: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FF9F43',
  },
  timeBadgeSlate: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 9999,
  },
  timeTextSlate: {
    fontSize: 9,
    fontWeight: '800',
    color: '#1E3A44',
  },
  bentoCardTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1E3A44',
  },
  bentoCardSub: {
    fontSize: 10,
    color: '#8C9A9E',
    marginTop: 2,
  },
  recentActivityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#1E3A44',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  activityLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  activityIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1E3A44',
  },
  activityTime: {
    fontSize: 10,
    color: '#8C9A9E',
    marginTop: 2,
  },
  statusBadgeGreen: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  statusBadgeTextGreen: {
    fontSize: 10,
    fontWeight: '800',
    color: '#059669',
  },
  locationWarningBanner: {
    backgroundColor: '#FFE4E6',
    marginHorizontal: 16,
    marginTop: 8,
    padding: 12,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#FECDD3',
  },
  locationWarningText: {
    flex: 1,
    fontSize: 11,
    fontWeight: '700',
    color: '#E11D48',
  },
  quickServicesRow: {
    marginBottom: 20,
  },
  quickServiceCardOrange: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 159, 67, 0.25)',
    shadowColor: '#1E3A44',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  quickServiceIconBoxOrange: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 159, 67, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickServiceTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E3A44',
  },
  quickServiceSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
});
