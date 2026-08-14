import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { FontAwesome6 } from '@expo/vector-icons';
import { BottomNavigation } from '@/components/BottomNavigation';
import { CameraModal } from '@/components/CameraModal';
import { Toast } from '@/components/Toast';
import { api } from '@/services/api';
import { useAuthStore } from '@/services/authStore';
import { biometricService } from '@/services/biometricService';

export default function ProfileScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const logout = useAuthStore((s) => s.logout);

  // State
  const [biometricEnabled, setBiometricEnabled] = useState(user ? Boolean(user.biometric_enabled) : true);
  const [geofenceRequired, setGeofenceRequired] = useState(user ? Boolean(user.is_geofence_required) : false);
  const [cameraVisible, setCameraVisible] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const res = await api.getProfile();
      if (res.profile) {
        setUser(res.profile);
        setBiometricEnabled(Boolean(res.profile.biometric_enabled));
        setGeofenceRequired(Boolean(res.profile.is_geofence_required));
      }
    })();
  }, []);

  const handleToggleGeofenceRequired = async (val: boolean) => {
    setGeofenceRequired(val);
    const res = await api.updateProfile({ is_geofence_required: val ? 1 : 0 });
    if (res.profile) {
      setUser(res.profile);
    }
    setToastMsg(
      val
        ? 'Wajib Geofence diaktifkan (Absensi harus di Radius Kantor)'
        : 'Absensi Fleksibel diaktifkan (Karyawan bisa WFH/Remote dari mana saja)'
    );
  };

  const handleToggleBiometric = async (val: boolean) => {
    if (val) {
      const status = await biometricService.getBiometricStatus();
      if (!status.isSupported) {
        setToastMsg('Perangkat Anda tidak mendukung autentikasi biometrik');
        return;
      }
      if (!status.isEnrolled) {
        setToastMsg('Silakan atur FaceID / Sidik Jari di HP Anda terlebih dahulu');
        return;
      }

      const bioRes = await biometricService.authenticate('Konfirmasi Biometrik untuk Aktivasi Fitur');
      if (!bioRes.success) {
        if (bioRes.error && bioRes.error !== 'Autentikasi biometrik dibatalkan') {
          setToastMsg(bioRes.error);
        }
        return;
      }
    }

    setBiometricEnabled(val);
    const res = await api.updateProfile({ biometric_enabled: val ? 1 : 0 });
    if (res.profile) {
      setUser(res.profile);
    }
    setToastMsg(
      val
        ? 'Login Biometrik (FaceID/Fingerprint) telah diaktifkan'
        : 'Login Biometrik dinonaktifkan'
    );
  };

  const handleLogout = () => {
    logout();
    setToastMsg('Sesi berhasil diakhiri. Mengarahkan ke Login...');
    setTimeout(() => {
      router.replace('/auth/login');
    }, 1000);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Toast message={toastMsg} onHide={() => setToastMsg(null)} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Profile Banner & Avatar */}
        <View style={styles.profileCard}>
          <View style={styles.avatarWrapper}>
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=250&auto=format&fit=crop&q=80' }}
              style={styles.avatarImg}
            />
            <View style={styles.verifiedBadge}>
              <FontAwesome6 name="check" size={10} color="#FFFFFF" />
            </View>
          </View>

          <Text style={styles.userName}>{user?.full_name || 'Alex Morgan'}</Text>
          <Text style={styles.userRole}>{user?.job_title || 'Senior Frontend Engineer'}</Text>

          <View style={styles.deptBadge}>
            <Text style={styles.deptBadgeText}>
              {user?.department || 'Technology & Product'} • {user?.employee_id || 'EMP-8821'}
            </Text>
          </View>
        </View>

        {/* Office Geofence Information Card */}
        <View style={styles.infoCard}>
          <View style={styles.cardHeaderRow}>
            <FontAwesome6 name="building" size={16} color="#FF9F43" />
            <Text style={styles.cardTitle}>Lokasi Kantor Asal (Geofence)</Text>
          </View>

          <View style={styles.infoGrid}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Nama Kantor</Text>
              <Text style={styles.infoVal}>{user?.office_name || 'HQ Tower Jakarta'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Titik Koordinat</Text>
              <Text style={styles.infoMonoVal}>
                {user ? `${user.office_latitude}, ${user.office_longitude}` : '-6.20881, 106.84562'}
              </Text>
            </View>
            <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
              <Text style={styles.infoLabel}>Batas Radius Toleransi</Text>
              <Text style={styles.infoHighlightVal}>{user?.geofence_radius || 50} Meter</Text>
            </View>
          </View>
        </View>

        {/* Biometric & Security Settings Card */}
        <View style={styles.infoCard}>
          <View style={styles.cardHeaderRow}>
            <FontAwesome6 name="gear" size={16} color="#FF9F43" />
            <Text style={styles.cardTitle}>Pengaturan Keamanan & Akses</Text>
          </View>

          {/* Biometric Toggle */}
          <View style={styles.settingRow}>
            <View style={styles.settingTextGroup}>
              <Text style={styles.settingTitle}>Autentikasi Biometrik</Text>
              <Text style={styles.settingSub}>Login instan menggunakan FaceID / Fingerprint</Text>
            </View>
            <Switch
              value={biometricEnabled}
              onValueChange={handleToggleBiometric}
              trackColor={{ false: '#CBD5E1', true: '#FF9F43' }}
              thumbColor={biometricEnabled ? '#1E3A44' : '#F8FAFC'}
            />
          </View>

          {/* Notification Setting */}
          <TouchableOpacity style={styles.settingRow}>
            <View style={styles.settingTextGroup}>
              <Text style={styles.settingTitle}>Notifikasi Presensi</Text>
              <Text style={styles.settingSub}>Ingatkan jadwal Clock In & Clock Out</Text>
            </View>
            <FontAwesome6 name="chevron-right" size={14} color="#8C9A9E" />
          </TouchableOpacity>
        </View>

        {/* HR Special Settings Card (Visible Only to HR Role) */}
        {user?.role === 'hr' && (
          <View style={styles.infoCard}>
            <View style={styles.cardHeaderRow}>
              <FontAwesome6 name="user-shield" size={16} color="#34D399" />
              <Text style={styles.cardTitle}>Pengaturan Kebijakan HR (Khusus HR)</Text>
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingTextGroup}>
                <Text style={styles.settingTitle}>Wajibkan Radius Geofence</Text>
                <Text style={styles.settingSub}>
                  {geofenceRequired
                    ? 'Wajib absen di Radius Kantor (50m)'
                    : 'Absensi Bebas (WFH / Remote / Cafe diizinkan)'}
                </Text>
              </View>
              <Switch
                value={geofenceRequired}
                onValueChange={handleToggleGeofenceRequired}
                trackColor={{ false: '#CBD5E1', true: '#34D399' }}
                thumbColor={geofenceRequired ? '#1E3A44' : '#F8FAFC'}
              />
            </View>
          </View>
        )}

        {/* Logout Button */}
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <FontAwesome6 name="right-from-bracket" size={16} color="#F43F5E" />
          <Text style={styles.logoutBtnText}>Keluar dari Akun (Logout)</Text>
        </TouchableOpacity>

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
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#1E3A44',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 12,
  },
  avatarImg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#FF9F43',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  userName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1E3A44',
    marginBottom: 2,
  },
  userRole: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8C9A9E',
    marginBottom: 10,
  },
  deptBadge: {
    backgroundColor: '#FFF2E5',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: '#FFE0C2',
  },
  deptBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FF9F43',
  },
  infoCard: {
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
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E3A44',
  },
  infoGrid: {
    backgroundColor: '#F4F6F6',
    borderRadius: 16,
    padding: 14,
    gap: 10,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 8,
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
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  settingTextGroup: {
    flex: 1,
    gap: 2,
    paddingRight: 10,
  },
  settingTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E3A44',
  },
  settingSub: {
    fontSize: 11,
    color: '#8C9A9E',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFF1F2',
    borderRadius: 9999,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#FECDD3',
    marginTop: 8,
  },
  logoutBtnText: {
    color: '#F43F5E',
    fontWeight: '800',
    fontSize: 14,
  },
});
