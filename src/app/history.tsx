import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { FontAwesome6 } from '@expo/vector-icons';
import { BottomNavigation } from '@/components/BottomNavigation';
import { DetailModal } from '@/components/DetailModal';
import { CameraModal } from '@/components/CameraModal';
import { CalendarPickerModal } from '@/components/CalendarPickerModal';
import { Toast } from '@/components/Toast';
import { api } from '@/services/api';
import { useAuthStore } from '@/services/authStore';

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const DAY_NAMES = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

export default function HistoryScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  // Selected Date State
  const [selectedDate, setSelectedDate] = useState<Date>(new Date(2026, 7, 24)); // 24 Aug 2026
  const [detailVisible, setDetailVisible] = useState(false);
  const [cameraVisible, setCameraVisible] = useState(false);
  const [calendarPickerVisible, setCalendarPickerVisible] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [attendances, setAttendances] = useState<any[]>([]);
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const scrollRef = useRef<ScrollView>(null);

  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth();
  const dayNum = selectedDate.getDate();
  const dayOfWeekIndex = selectedDate.getDay();

  // Total days in selected month
  const totalDaysInMonth = new Date(year, month + 1, 0).getDate();

  // Fetch live history from backend API
  useEffect(() => {
    (async () => {
      setLoading(true);
      const res = await api.getAttendanceHistory();
      setLoading(false);
      if (res.attendances) {
        setAttendances(res.attendances);
      }
    })();
  }, []);

  // Auto-scroll date strip to center selected date whenever selectedDate changes
  useEffect(() => {
    if (scrollRef.current) {
      // Each date pill: width 44 + gap 8 = 52px. Offset by 120px to center selected pill in header
      const targetX = Math.max(0, (dayNum - 1) * 52 - 120);
      setTimeout(() => {
        scrollRef.current?.scrollTo({ x: targetX, animated: true });
      }, 100);
    }
  }, [selectedDate, dayNum]);

  // Navigation handlers
  const handlePrevMonth = () => {
    const prev = new Date(year, month - 1, Math.min(dayNum, 28));
    setSelectedDate(prev);
    setToastMsg(`Menampilkan ${MONTH_NAMES[prev.getMonth()]} ${prev.getFullYear()}`);
  };

  const handleNextMonth = () => {
    const next = new Date(year, month + 1, Math.min(dayNum, 28));
    setSelectedDate(next);
    setToastMsg(`Menampilkan ${MONTH_NAMES[next.getMonth()]} ${next.getFullYear()}`);
  };

  // Generate date strip items for current month
  const dateStripItems = [];
  for (let d = 1; d <= totalDaysInMonth; d++) {
    const dateObj = new Date(year, month, d);
    dateStripItems.push({
      dateNum: d,
      dayName: DAY_NAMES[dateObj.getDay()],
      dateObj: dateObj,
    });
  }

  const isWeekend = dayOfWeekIndex === 0 || dayOfWeekIndex === 6;

  return (
    <SafeAreaView style={styles.safeArea}>
      <Toast message={toastMsg} onHide={() => setToastMsg(null)} />

      {/* Top Calendar Dark Header */}
      <View style={styles.darkHeader}>
        {/* Month Selector Header */}
        <View style={styles.monthRow}>
          <TouchableOpacity onPress={handlePrevMonth} style={styles.monthNavBtn}>
            <FontAwesome6 name="chevron-left" size={12} color="#CBD5E1" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setCalendarPickerVisible(true)}
            style={styles.monthCenterInfo}
          >
            <View style={styles.monthTitleRow}>
              <Text style={styles.monthTitle}>
                {MONTH_NAMES[month]} {year}
              </Text>
              <FontAwesome6 name="calendar-days" size={12} color="#FF9F43" />
            </View>
            <Text style={styles.monthSub}>20 Hari Kerja • 160 Jam</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleNextMonth} style={styles.monthNavBtn}>
            <FontAwesome6 name="chevron-right" size={12} color="#CBD5E1" />
          </TouchableOpacity>
        </View>

        {/* Horizontal Scrollable Date Strip */}
        <ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dateStripScrollContent}
        >
          {dateStripItems.map((item) => {
            const isSelected = item.dateNum === dayNum;
            return (
              <TouchableOpacity
                key={item.dateNum}
                onPress={() => {
                  setSelectedDate(item.dateObj);
                  setToastMsg(`Memilih ${item.dateNum} ${MONTH_NAMES[month]} ${year}`);
                }}
                style={[styles.dateItem, isSelected && styles.dateItemSelected]}
              >
                <Text style={[styles.dateDayText, isSelected && styles.dateDayTextSelected]}>
                  {item.dayName}
                </Text>
                <Text style={[styles.dateNumText, isSelected && styles.dateNumTextSelected]}>
                  {item.dateNum}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Scrollable Timeline & Activity Content */}
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Date Status Header */}
        <View style={styles.statusHeaderRow}>
          <View>
            <Text style={styles.statusDateTitle}>
              {DAY_NAMES[dayOfWeekIndex]}, {dayNum} {MONTH_NAMES[month]} {year}
            </Text>
            <Text style={styles.statusSubText}>
              Status Absensi:{' '}
              <Text style={isWeekend ? styles.statusHighlightWeekend : styles.statusHighlight}>
                {isWeekend ? 'Libur Akhir Pekan' : 'Hadir Tepat Waktu'}
              </Text>
            </Text>
          </View>
          <View style={styles.totalHoursBadge}>
            <Text style={styles.totalHoursBadgeText}>
              {isWeekend ? '0.0 Jam' : '7.5 Jam Total'}
            </Text>
          </View>
        </View>

        {!isWeekend ? (
          <>
            {/* Verified Clock In Card Snippet -> Opens DetailModal */}
            <TouchableOpacity
              onPress={() => {
                if (attendances.length > 0) {
                  const item = attendances[0];
                  setSelectedLog({
                    name: item.full_name || user?.full_name || 'Budi Santoso',
                    employeeId: item.employee_id || user?.employee_id || 'EMP-8823',
                    timestamp: `${new Date(item.timestamp).toLocaleTimeString('id-ID')} (${new Date(item.timestamp).toLocaleDateString('id-ID')})`,
                    coordinates: `${item.latitude}, ${item.longitude}`,
                    geofenceStatus: `Terverifikasi (${item.geofence_distance}m)`,
                    photoUrl: item.photo_url,
                  });
                }
                setDetailVisible(true);
              }}
              style={styles.verifiedCard}
            >
              <View style={styles.verifiedLeftGroup}>
                <View style={styles.verifiedAvatarWrapper}>
                  <Image
                    source={{
                      uri:
                        attendances.length > 0 && attendances[0].photo_url
                          ? attendances[0].photo_url
                          : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
                    }}
                    style={styles.verifiedAvatarImg}
                  />
                  <View style={styles.verifiedCheckBadge}>
                    <FontAwesome6 name="check" size={8} color="#FFFFFF" />
                  </View>
                </View>
                <View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={styles.verifiedTitle}>
                      {attendances.length > 0 ? (attendances[0].type === 'in' ? 'Clock In Verified' : 'Clock Out Verified') : 'Clock In Verified'}
                    </Text>
                    <View style={styles.gpsPill}>
                      <Text style={styles.gpsPillText}>GPS</Text>
                    </View>
                  </View>
                  <Text style={styles.verifiedTime}>
                    {attendances.length > 0
                      ? `${new Date(attendances[0].timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} • HQ Tower Jakarta`
                      : '08:28:14 AM • HQ Tower Jakarta'}
                  </Text>
                </View>
              </View>
              <FontAwesome6 name="chevron-right" size={14} color="#8C9A9E" />
            </TouchableOpacity>

            {/* Vertical Timeline Chronology List (Live Data from API) */}
            <View style={styles.timelineContainer}>
              <View style={styles.timelineLine} />

              {attendances.length > 0 ? (
                attendances.map((item, idx) => (
                  <TouchableOpacity
                    key={item.id || idx}
                    onPress={() => {
                      setSelectedLog({
                        name: item.full_name || user?.full_name || 'Budi Santoso',
                        employeeId: item.employee_id || user?.employee_id || 'EMP-8823',
                        timestamp: `${new Date(item.timestamp).toLocaleTimeString('id-ID')} (${new Date(item.timestamp).toLocaleDateString('id-ID')})`,
                        coordinates: `${item.latitude}, ${item.longitude}`,
                        geofenceStatus: `Terverifikasi (${item.geofence_distance}m)`,
                        photoUrl: item.photo_url,
                      });
                      setDetailVisible(true);
                    }}
                    style={styles.timelineItem}
                  >
                    <View style={[styles.timelineNodeCircle, { backgroundColor: item.type === 'in' ? '#10B981' : '#FF9F43' }]}>
                      <FontAwesome6 name={item.type === 'in' ? 'right-to-bracket' : 'right-from-bracket'} size={12} color="#FFFFFF" />
                    </View>
                    <View style={styles.timelineCard}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <View style={{ flex: 1, paddingRight: 8 }}>
                          <View style={styles.timelineCardHeader}>
                            <Text style={styles.timelineCardTitle}>
                              {item.type === 'in' ? 'Absen Masuk (Clock In)' : 'Absen Keluar (Clock Out)'}
                            </Text>
                            <Text style={item.status === 'on_time' ? styles.timelineTimeGreen : styles.timelineTimeMuted}>
                              {new Date(item.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                            </Text>
                          </View>
                          <Text style={styles.timelineCardSub}>
                            {item.notes || `Verified via Face Selfie & Geofence GPS Radius ${item.geofence_distance || 12}m.`}
                          </Text>
                        </View>
                        {item.photo_url ? (
                          <Image
                            source={{ uri: item.photo_url }}
                            style={{ width: 42, height: 42, borderRadius: 12, borderWidth: 1.5, borderColor: '#FF9F43' }}
                          />
                        ) : null}
                      </View>
                    </View>
                  </TouchableOpacity>
                ))
              ) : (
                <View style={styles.timelineItem}>
                  <View style={[styles.timelineNodeCircle, { backgroundColor: '#10B981' }]}>
                    <FontAwesome6 name="right-to-bracket" size={12} color="#FFFFFF" />
                  </View>
                  <View style={styles.timelineCard}>
                    <View style={styles.timelineCardHeader}>
                      <Text style={styles.timelineCardTitle}>Absen Masuk (Clock In)</Text>
                      <Text style={styles.timelineTimeGreen}>08:28 AM</Text>
                    </View>
                    <Text style={styles.timelineCardSub}>
                      Verified via Face Selfie & Geofence GPS Radius 12m.
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </>
        ) : (
          /* Weekend Empty State */
          <View style={styles.weekendEmptyCard}>
            <FontAwesome6 name="mug-hot" size={32} color="#FF9F43" />
            <Text style={styles.weekendEmptyTitle}>Akhir Pekan (Hari Libur)</Text>
            <Text style={styles.weekendEmptySub}>
              Tidak ada jadwal presensi di hari libur akhir pekan. Selamat beristirahat!
            </Text>
          </View>
        )}

        {/* Bottom Spacer */}
        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Calendar Picker Modal */}
      <CalendarPickerModal
        visible={calendarPickerVisible}
        onClose={() => setCalendarPickerVisible(false)}
        selectedDate={selectedDate}
        onSelectDate={(newDate) => {
          setSelectedDate(newDate);
          setToastMsg(`Tanggal terpilih: ${newDate.getDate()} ${MONTH_NAMES[newDate.getMonth()]} ${newDate.getFullYear()}`);
        }}
      />

      {/* Detail Modal */}
      <DetailModal
        visible={detailVisible}
        attendanceData={selectedLog || undefined}
        onClose={() => setDetailVisible(false)}
      />

      {/* Camera Modal */}
      <CameraModal
        visible={cameraVisible}
        onClose={() => setCameraVisible(false)}
        onTakeSelfie={async (photoBase64) => {
          setCameraVisible(false);
          setLoading(true);
          const res = await api.submitAttendance({
            type: 'in',
            latitude: -6.20881,
            longitude: 106.84562,
            photo_base64: photoBase64,
          });
          setLoading(false);
          if (res.success) {
            setToastMsg('Berhasil! Presensi selfie tersimpan.');
            const historyRes = await api.getAttendanceHistory();
            if (historyRes.attendances) {
              setAttendances(historyRes.attendances);
            }
          } else {
            setToastMsg(res.error || 'Gagal menyimpan presensi');
          }
        }}
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
  darkHeader: {
    backgroundColor: '#1E3A44',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    gap: 16,
    shadowColor: '#1E3A44',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  monthNavBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthCenterInfo: {
    alignItems: 'center',
  },
  monthTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  monthTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  monthSub: {
    color: '#CBD5E1',
    fontSize: 10,
    fontWeight: '500',
    marginTop: 2,
  },
  dateStripScrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  dateItem: {
    width: 44,
    paddingVertical: 10,
    borderRadius: 18,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  dateItemSelected: {
    backgroundColor: '#FF9F43',
    shadowColor: '#FF9F43',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  dateDayText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94A3B8',
  },
  dateDayTextSelected: {
    color: '#1E3A44',
    fontWeight: '800',
  },
  dateNumText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 2,
  },
  dateNumTextSelected: {
    color: '#1E3A44',
    fontWeight: '900',
  },
  requestPillBtn: {
    width: '100%',
    paddingVertical: 10,
    borderRadius: 9999,
    backgroundColor: '#FF9F43',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#FF9F43',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  requestPillText: {
    color: '#1E3A44',
    fontWeight: '800',
    fontSize: 12,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  statusHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusDateTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E3A44',
  },
  statusSubText: {
    fontSize: 11,
    color: '#8C9A9E',
    marginTop: 2,
  },
  statusHighlight: {
    color: '#10B981',
    fontWeight: '800',
  },
  statusHighlightWeekend: {
    color: '#F43F5E',
    fontWeight: '800',
  },
  totalHoursBadge: {
    backgroundColor: '#FFF2E5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: '#FFE0C2',
  },
  totalHoursBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FF9F43',
  },
  verifiedCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#1E3A44',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  verifiedLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  verifiedAvatarWrapper: {
    position: 'relative',
  },
  verifiedAvatarImg: {
    width: 48,
    height: 48,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#10B981',
  },
  verifiedCheckBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifiedTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E3A44',
  },
  gpsPill: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  gpsPillText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#047857',
  },
  verifiedTime: {
    fontSize: 11,
    color: '#8C9A9E',
    marginTop: 2,
  },
  timelineContainer: {
    paddingLeft: 4,
    position: 'relative',
    gap: 14,
  },
  timelineLine: {
    position: 'absolute',
    left: 23,
    top: 20,
    bottom: 20,
    width: 2,
    backgroundColor: '#CBD5E1',
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  timelineNodeCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#F4F6F6',
    zIndex: 2,
  },
  timelineCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 14,
    shadowColor: '#1E3A44',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  timelineCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  timelineCardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E3A44',
  },
  timelineTimeGreen: {
    fontSize: 11,
    fontWeight: '800',
    color: '#10B981',
    fontFamily: 'monospace',
  },
  timelineTimeMuted: {
    fontSize: 10,
    fontWeight: '600',
    color: '#8C9A9E',
    fontFamily: 'monospace',
  },
  timelineCardSub: {
    fontSize: 11,
    color: '#475569',
  },
  weekendEmptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginVertical: 20,
  },
  weekendEmptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E3A44',
  },
  weekendEmptySub: {
    fontSize: 12,
    color: '#8C9A9E',
    textAlign: 'center',
    lineHeight: 18,
  },
});
