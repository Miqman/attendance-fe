import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { FontAwesome6 } from '@expo/vector-icons';
import { BottomNavigation } from '@/components/BottomNavigation';
import { CameraModal } from '@/components/CameraModal';
import { Toast } from '@/components/Toast';
import { api } from '@/services/api';

export default function ReportScreen() {
  const router = useRouter();

  // State
  const [cameraVisible, setCameraVisible] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [reportStats, setReportStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const res = await api.getAttendanceReport();
      setLoading(false);
      if (res.stats) {
        setReportStats(res.stats);
      }
    })();
  }, []);

  const monthName = reportStats?.month || 'Agustus 2026';
  const totalDays = reportStats?.total_days || 20;
  const onTimeCount = reportStats?.on_time_count || 19;
  const lateCount = reportStats?.late_count || 1;
  const totalWorkHours = reportStats?.total_work_hours || 158.5;
  const onTimePercentage = reportStats?.on_time_percentage || 95;

  const handleExportPdf = () => {
    setToastMsg('Mengunduh Laporan Kehadiran (PDF)...');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Toast message={toastMsg} onHide={() => setToastMsg(null)} />

      {/* Top Header Banner */}
      <View style={styles.headerBanner}>
        <View style={styles.headerTopRow}>
          <View>
            <Text style={styles.headerSubtitle}>REKAPITULASI PRESENSI</Text>
            <Text style={styles.headerTitle}>Laporan Kehadiran</Text>
          </View>
          <TouchableOpacity onPress={handleExportPdf} style={styles.exportBtn}>
            <FontAwesome6 name="file-arrow-down" size={13} color="#1E3A44" />
            <Text style={styles.exportBtnText}>Export PDF</Text>
          </TouchableOpacity>
        </View>

        {/* Month Selector Pill */}
        <View style={styles.monthPillRow}>
          <TouchableOpacity style={styles.monthPillNav}>
            <FontAwesome6 name="chevron-left" size={12} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.monthPillText}>{monthName}</Text>
          <TouchableOpacity style={styles.monthPillNav}>
            <FontAwesome6 name="chevron-right" size={12} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Stats Bento Grid (4 Summary Cards) */}
        <View style={styles.statsGrid}>
          {/* Card 1: Total Hadir */}
          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <View style={[styles.statIconBox, { backgroundColor: '#ECFDF5' }]}>
                <FontAwesome6 name="calendar-check" size={14} color="#059669" />
              </View>
              <Text style={styles.statBadgeSuccess}>100%</Text>
            </View>
            <Text style={styles.statNumber}>{totalDays} Hari</Text>
            <Text style={styles.statLabel}>Total Kehadiran</Text>
          </View>

          {/* Card 2: Tepat Waktu */}
          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <View style={[styles.statIconBox, { backgroundColor: '#D1FAE5' }]}>
                <FontAwesome6 name="circle-check" size={14} color="#10B981" />
              </View>
              <Text style={styles.statBadgeSuccess}>{onTimePercentage}%</Text>
            </View>
            <Text style={styles.statNumber}>{onTimeCount} Hari</Text>
            <Text style={styles.statLabel}>Tepat Waktu (On Time)</Text>
          </View>

          {/* Card 3: Terlambat */}
          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <View style={[styles.statIconBox, { backgroundColor: '#FEF3C7' }]}>
                <FontAwesome6 name="circle-exclamation" size={14} color="#D97706" />
              </View>
              <Text style={styles.statBadgeWarning}>{100 - onTimePercentage}%</Text>
            </View>
            <Text style={styles.statNumber}>{lateCount} Hari</Text>
            <Text style={styles.statLabel}>Keterlambatan (Late)</Text>
          </View>

          {/* Card 4: Total Jam Kerja */}
          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <View style={[styles.statIconBox, { backgroundColor: '#FFF2E5' }]}>
                <FontAwesome6 name="clock" size={14} color="#FF9F43" />
              </View>
              <Text style={styles.statBadgeOrange}>7.9 jam/hari</Text>
            </View>
            <Text style={styles.statNumber}>{totalWorkHours}h</Text>
            <Text style={styles.statLabel}>Total Jam Kerja</Text>
          </View>
        </View>

        {/* Detailed Breakdown Card */}
        <View style={styles.breakdownCard}>
          <Text style={styles.breakdownTitle}>Ringkasan Tingkat Kedisiplinan</Text>

          {/* Progress Bar 1: Tepat Waktu */}
          <View style={styles.progressGroup}>
            <View style={styles.progressLabelRow}>
              <Text style={styles.progressLabel}>Hadir Tepat Waktu</Text>
              <Text style={styles.progressValue}>19 dari 20 hari (95%)</Text>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressBar, { width: '95%', backgroundColor: '#10B981' }]} />
            </View>
          </View>

          {/* Progress Bar 2: Jam Kerja Tercapai */}
          <View style={styles.progressGroup}>
            <View style={styles.progressLabelRow}>
              <Text style={styles.progressLabel}>Target Jam Kerja (160 Jam)</Text>
              <Text style={styles.progressValue}>158.5 Jam (99.0%)</Text>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressBar, { width: '99%', backgroundColor: '#FF9F43' }]} />
            </View>
          </View>

          {/* Progress Bar 3: Geofence Verification Rate */}
          <View style={styles.progressGroup}>
            <View style={styles.progressLabelRow}>
              <Text style={styles.progressLabel}>Akurasi Verifikasi GPS Geofence</Text>
              <Text style={styles.progressValue}>100% Terverifikasi</Text>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressBar, { width: '100%', backgroundColor: '#1E3A44' }]} />
            </View>
          </View>
        </View>

        {/* Recent Audit Log list */}
        <View style={styles.auditCard}>
          <Text style={styles.auditTitle}>Catatan Presensi Terakhir</Text>

          <View style={styles.auditItem}>
            <View style={styles.auditLeft}>
              <Text style={styles.auditDate}>24 Aug 2026</Text>
              <Text style={styles.auditTime}>08:28 AM - 17:00 PM</Text>
            </View>
            <View style={styles.auditRight}>
              <Text style={styles.auditHours}>8.5 jam</Text>
              <Text style={styles.auditTagOnTime}>On Time</Text>
            </View>
          </View>

          <View style={styles.auditItem}>
            <View style={styles.auditLeft}>
              <Text style={styles.auditDate}>23 Aug 2026</Text>
              <Text style={styles.auditTime}>08:25 AM - 17:05 PM</Text>
            </View>
            <View style={styles.auditRight}>
              <Text style={styles.auditHours}>8.6 jam</Text>
              <Text style={styles.auditTagOnTime}>On Time</Text>
            </View>
          </View>

          <View style={[styles.auditItem, { borderBottomWidth: 0 }]}>
            <View style={styles.auditLeft}>
              <Text style={styles.auditDate}>22 Aug 2026</Text>
              <Text style={styles.auditTime}>08:45 AM - 17:00 PM</Text>
            </View>
            <View style={styles.auditRight}>
              <Text style={styles.auditHours}>8.2 jam</Text>
              <Text style={styles.auditTagLate}>Terlambat</Text>
            </View>
          </View>
        </View>

        {/* Bottom Spacer */}
        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Camera Modal */}
      <CameraModal
        visible={cameraVisible}
        onClose={() => setCameraVisible(false)}
        onTakeSelfie={() => {
          setCameraVisible(false);
          setToastMsg('Foto presensi tersimpan!');
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
  headerBanner: {
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
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerSubtitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8C9A9E',
    letterSpacing: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 2,
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FF9F43',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 9999,
    shadowColor: '#FF9F43',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  exportBtnText: {
    color: '#1E3A44',
    fontWeight: '800',
    fontSize: 12,
  },
  monthPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  monthPillNav: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthPillText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    justifyContent: 'space-between',
    shadowColor: '#1E3A44',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    gap: 8,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statIconBox: {
    width: 32,
    height: 32,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statBadgeSuccess: {
    fontSize: 10,
    fontWeight: '800',
    color: '#059669',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  statBadgeWarning: {
    fontSize: 10,
    fontWeight: '800',
    color: '#D97706',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  statBadgeOrange: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FF9F43',
    backgroundColor: '#FFF2E5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '900',
    color: '#1E3A44',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8C9A9E',
  },
  breakdownCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
    gap: 14,
    shadowColor: '#1E3A44',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  breakdownTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E3A44',
  },
  progressGroup: {
    gap: 6,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E3A44',
  },
  progressValue: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8C9A9E',
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F1F5F9',
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  auditCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
    gap: 12,
    shadowColor: '#1E3A44',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  auditTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E3A44',
  },
  auditItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  auditLeft: {
    gap: 2,
  },
  auditDate: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1E3A44',
  },
  auditTime: {
    fontSize: 11,
    color: '#8C9A9E',
  },
  auditRight: {
    alignItems: 'flex-end',
    gap: 2,
  },
  auditHours: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1E3A44',
  },
  auditTagOnTime: {
    fontSize: 10,
    fontWeight: '800',
    color: '#059669',
  },
  auditTagLate: {
    fontSize: 10,
    fontWeight: '800',
    color: '#D97706',
  },
});
