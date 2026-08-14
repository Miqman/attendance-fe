import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { FontAwesome6 } from '@expo/vector-icons';
import { BottomNavigation } from '@/components/BottomNavigation';
import { CameraModal } from '@/components/CameraModal';
import { Toast } from '@/components/Toast';
import { api } from '@/services/api';
import { useAuthStore } from '@/services/authStore';

export default function AttendanceDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const user = useAuthStore((s) => s.user);

  const [cameraVisible, setCameraVisible] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [attData, setAttData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (id && typeof id === 'string') {
      (async () => {
        setLoading(true);
        const res = await api.getAttendanceDetail(id);
        setLoading(false);
        if (res.attendance) {
          setAttData(res.attendance);
        }
      })();
    }
  }, [id]);

  const detail = {
    id: attData?.id || id || 'ATT-8821-001',
    name: user?.full_name || 'Alex Morgan',
    employeeId: user?.employee_id || 'EMP-8821',
    timestamp: attData?.timestamp ? new Date(attData.timestamp).toLocaleString('id-ID') : '08:28:14 AM (24 Agustus 2026)',
    type: attData?.type ? (attData.type === 'in' ? 'Clock In (Masuk)' : 'Clock Out (Keluar)') : 'Clock In (Masuk)',
    coordinates: attData ? `${attData.latitude}, ${attData.longitude}` : '-6.20881, 106.84562',
    officeName: user?.office_name || 'HQ Tower Jakarta (Lt. 4)',
    geofenceStatus: attData ? `Terverifikasi (${attData.geofence_distance}m dari kantor)` : 'Terverifikasi (12m dari kantor)',
    photoUrl: attData?.photo_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500',
    mapUrl: 'https://placehold.co/600x400/1E3A44/FFFFFF?text=GPS+Map+Location+HQ',
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Toast message={toastMsg} onHide={() => setToastMsg(null)} />

      {/* Header Bar */}
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <FontAwesome6 name="arrow-left" size={16} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detail Catatan Kehadiran</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Verification Badge Header */}
        <View style={styles.statusBadgeCard}>
          <View style={styles.statusIconBox}>
            <FontAwesome6 name="circle-check" size={20} color="#10B981" />
          </View>
          <View>
            <Text style={styles.statusBadgeTitle}>Presensi Terverifikasi</Text>
            <Text style={styles.statusBadgeSub}>{detail.timestamp}</Text>
          </View>
        </View>

        {/* 2 Column Visual Media: Selfie Photo + GPS Map */}
        <View style={styles.mediaGrid}>
          <View style={styles.mediaCol}>
            <Text style={styles.mediaLabel}>FOTO SELFIE PRESENSI</Text>
            <View style={styles.imageContainer}>
              <Image source={{ uri: detail.photoUrl }} style={styles.selfieImage} />
              <View style={styles.selfieBadge}>
                <FontAwesome6 name="camera" size={10} color="#FFFFFF" />
              </View>
            </View>
          </View>

          <View style={styles.mediaCol}>
            <Text style={styles.mediaLabel}>PETA LOKASI GPS</Text>
            <View style={styles.mapContainer}>
              <Image source={{ uri: detail.mapUrl }} style={styles.mapImage} />
              <View style={styles.mapPin}>
                <FontAwesome6 name="location-dot" size={14} color="#1E3A44" />
              </View>
            </View>
          </View>
        </View>

        {/* Details Data List */}
        <View style={styles.detailsCard}>
          <Text style={styles.cardSectionTitle}>Informasi Rincian Log</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>ID Presensi</Text>
            <Text style={styles.infoMonoVal}>{detail.id}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Nama Karyawan</Text>
            <Text style={styles.infoVal}>{detail.name} ({detail.employeeId})</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Tipe Absensi</Text>
            <Text style={styles.infoHighlightVal}>{detail.type}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Waktu Server</Text>
            <Text style={styles.infoVal}>{detail.timestamp}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Lokasi Kantor</Text>
            <Text style={styles.infoVal}>{detail.officeName}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Koordinat GPS</Text>
            <Text style={styles.infoMonoVal}>{detail.coordinates}</Text>
          </View>

          <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.infoLabel}>Status Geofence</Text>
            <Text style={styles.infoSuccessVal}>{detail.geofenceStatus}</Text>
          </View>
        </View>

        {/* Back Button */}
        <TouchableOpacity onPress={() => router.back()} style={styles.backActionBtn}>
          <FontAwesome6 name="chevron-left" size={12} color="#FFFFFF" />
          <Text style={styles.backActionText}>Kembali ke Riwayat Kehadiran</Text>
        </TouchableOpacity>

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
  headerBar: {
    backgroundColor: '#1E3A44',
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#1E3A44',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  statusBadgeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    shadowColor: '#1E3A44',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  statusIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadgeTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E3A44',
  },
  statusBadgeSub: {
    fontSize: 11,
    color: '#8C9A9E',
    marginTop: 2,
  },
  mediaGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  mediaCol: {
    flex: 1,
    gap: 6,
  },
  mediaLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#8C9A9E',
    letterSpacing: 0.5,
  },
  imageContainer: {
    width: '100%',
    height: 140,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    position: 'relative',
  },
  selfieImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  selfieBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(30, 58, 68, 0.85)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  mapContainer: {
    width: '100%',
    height: 140,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E3A44',
    position: 'relative',
  },
  mapImage: {
    width: '100%',
    height: '100%',
    opacity: 0.85,
  },
  mapPin: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FF9F43',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF9F43',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  detailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    gap: 12,
    shadowColor: '#1E3A44',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  cardSectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E3A44',
    marginBottom: 4,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 10,
  },
  infoLabel: {
    fontSize: 12,
    color: '#8C9A9E',
    fontWeight: '500',
  },
  infoVal: {
    fontSize: 12,
    color: '#1E3A44',
    fontWeight: '700',
  },
  infoMonoVal: {
    fontSize: 11,
    color: '#334155',
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  infoHighlightVal: {
    fontSize: 12,
    color: '#FF9F43',
    fontWeight: '800',
  },
  infoSuccessVal: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '800',
  },
  backActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#1E3A44',
    borderRadius: 9999,
    paddingVertical: 14,
    marginTop: 4,
    shadowColor: '#1E3A44',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  backActionText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
});
