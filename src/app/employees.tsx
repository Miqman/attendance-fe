import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { FontAwesome6 } from '@expo/vector-icons';
import { BottomNavigation } from '@/components/BottomNavigation';
import { CameraModal } from '@/components/CameraModal';
import { Toast } from '@/components/Toast';
import { api } from '@/services/api';
import { useAuthStore } from '@/services/authStore';

export default function EmployeesScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  // States
  const [employees, setEmployees] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'present' | 'leave' | 'tech' | 'hr'>('all');
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [cameraVisible, setCameraVisible] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const fetchEmployees = async () => {
    try {
      const res = await api.getEmployeesDirectory();
      if (res.employees) {
        setEmployees(res.employees);
        setStats(res.stats);
      }
    } catch (err) {
      console.log('Error fetching employees:', err);
    }
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      await fetchEmployees();
      setLoading(false);
    })();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchEmployees();
    setRefreshing(false);
    setToastMsg('Data tim & kehadiran berhasil dimuat ulang');
  };

  // Filter Logic
  const filteredEmployees = employees.filter((emp) => {
    // 1. Keyword search (Name, Job title, Employee ID, Department)
    const q = searchText.toLowerCase();
    const matchesSearch =
      emp.full_name?.toLowerCase().includes(q) ||
      emp.job_title?.toLowerCase().includes(q) ||
      emp.employee_id?.toLowerCase().includes(q) ||
      emp.department?.toLowerCase().includes(q);

    if (!matchesSearch) return false;

    // 2. Tab Filter
    if (activeFilter === 'present') {
      return emp.status_type === 'present' || emp.status_type === 'clocked_out';
    }
    if (activeFilter === 'leave') {
      return emp.status_type === 'leave';
    }
    if (activeFilter === 'tech') {
      return emp.department?.toLowerCase().includes('tech') || emp.department?.toLowerCase().includes('product');
    }
    if (activeFilter === 'hr') {
      return emp.department?.toLowerCase().includes('human') || emp.department?.toLowerCase().includes('hr');
    }

    return true;
  });

  const getStatusBadge = (emp: any) => {
    switch (emp.status_type) {
      case 'present':
        return {
          bg: '#ECFDF5',
          text: '#059669',
          icon: 'circle-check',
          label: `Hadir (${emp.clock_in_time || 'Aktif'})`,
        };
      case 'clocked_out':
        return {
          bg: '#F1F5F9',
          text: '#475569',
          icon: 'right-from-bracket',
          label: `Sudah Pulang (${emp.clock_out_time || 'Selesai'})`,
        };
      case 'leave':
        return {
          bg: emp.today_status === 'sakit' ? '#FFF1F2' : '#FEF3C7',
          text: emp.today_status === 'sakit' ? '#E11D48' : '#D97706',
          icon: emp.today_status === 'sakit' ? 'notes-medical' : 'calendar-xmark',
          label: emp.status_label || 'Sedang Cuti',
        };
      default:
        return {
          bg: '#F8FAFC',
          text: '#94A3B8',
          icon: 'clock',
          label: 'Belum Absen',
        };
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Toast message={toastMsg} onHide={() => setToastMsg(null)} />

      {/* Top Banner Header */}
      <View style={styles.headerBanner}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerSub}>DIREKTORI PERUSAHAAN</Text>
            <Text style={styles.headerTitle}>Karyawan & Tim</Text>
          </View>
        </View>

        {/* Live Team Pulse Stats Cards */}
        <View style={styles.pulseStatsRow}>
          <View style={styles.pulseStatCard}>
            <Text style={styles.pulseStatNum}>{stats?.total_employees || employees.length}</Text>
            <Text style={styles.pulseStatLabel}>Total Tim</Text>
          </View>

          <View style={[styles.pulseStatCard, { borderLeftColor: '#10B981' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <View style={[styles.pulseDot, { backgroundColor: '#10B981' }]} />
              <Text style={[styles.pulseStatNum, { color: '#10B981' }]}>
                {stats?.present_today || 0}
              </Text>
            </View>
            <Text style={styles.pulseStatLabel}>Hadir Hari Ini</Text>
          </View>

          <View style={[styles.pulseStatCard, { borderLeftColor: '#FF9F43' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <View style={[styles.pulseDot, { backgroundColor: '#FF9F43' }]} />
              <Text style={[styles.pulseStatNum, { color: '#FF9F43' }]}>
                {stats?.on_leave_today || 0}
              </Text>
            </View>
            <Text style={styles.pulseStatLabel}>Cuti / Izin</Text>
          </View>
        </View>
      </View>

      {/* Search Input Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchBarBox}>
          <FontAwesome6 name="magnifying-glass" size={14} color="#94A3B8" />
          <TextInput
            style={styles.searchInput}
            value={searchText}
            onChangeText={setSearchText}
            placeholder="Cari nama, jabatan, divisi, atau ID..."
            placeholderTextColor="#94A3B8"
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText('')}>
              <FontAwesome6 name="circle-xmark" size={14} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {[
            { key: 'all', label: 'Semua' },
            { key: 'leave', label: `Sedang Cuti / Izin (${stats?.on_leave_today || 0})` },
            { key: 'present', label: `Hadir Hari Ini (${stats?.present_today || 0})` },
            { key: 'tech', label: 'Tech & Product' },
            { key: 'hr', label: 'Human Resources' },
          ].map((f) => (
            <TouchableOpacity
              key={f.key}
              onPress={() => setActiveFilter(f.key as any)}
              style={[styles.filterPill, activeFilter === f.key && styles.filterPillActive]}
            >
              <Text style={[styles.filterPillText, activeFilter === f.key && styles.filterPillTextActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Employee List Scrollable with Pull-to-Refresh */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#FF9F43']}
            tintColor="#FF9F43"
          />
        }
      >
        {loading ? (
          <ActivityIndicator size="small" color="#FF9F43" style={{ marginVertical: 40 }} />
        ) : filteredEmployees.length > 0 ? (
          filteredEmployees.map((emp) => {
            const badge = getStatusBadge(emp);
            return (
              <TouchableOpacity
                key={emp.id}
                onPress={() => {
                  setSelectedEmployee(emp);
                  setDetailModalVisible(true);
                }}
                style={styles.employeeCard}
              >
                <View style={styles.employeeMainRow}>
                  <Image
                    source={{
                      uri:
                        emp.avatar_url ||
                        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120',
                    }}
                    style={styles.employeeAvatar}
                  />
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={styles.employeeName}>{emp.full_name}</Text>
                      {emp.role !== 'employee' && (
                        <View style={[styles.roleBadge, emp.role === 'hr' && { backgroundColor: '#FDF2F8' }]}>
                          <Text style={[styles.roleBadgeText, emp.role === 'hr' && { color: '#DB2777' }]}>
                            {emp.role?.toUpperCase()}
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.employeeTitle}>{emp.job_title}</Text>
                    <Text style={styles.employeeDept}>
                      {emp.employee_id} • {emp.department}
                    </Text>
                  </View>

                  <FontAwesome6 name="chevron-right" size={12} color="#CBD5E1" />
                </View>

                {/* Status Bottom Bar */}
                <View style={[styles.statusStrip, { backgroundColor: badge.bg }]}>
                  <FontAwesome6 name={badge.icon} size={11} color={badge.text} />
                  <Text style={[styles.statusStripText, { color: badge.text }]}>
                    {badge.label}
                  </Text>
                  {emp.leave_details && (
                    <Text style={[styles.statusStripSub, { color: badge.text }]} numberOfLines={1}>
                      • "{emp.leave_details.reason}"
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          })
        ) : (
          <View style={styles.emptyStateBox}>
            <FontAwesome6 name="users-slash" size={32} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>Karyawan Tidak Ditemukan</Text>
            <Text style={styles.emptySub}>
              Tidak ada data yang cocok dengan kata kunci "{searchText}".
            </Text>
          </View>
        )}

        <View style={{ height: 90 }} />
      </ScrollView>

      {/* Detail Modal */}
      <Modal visible={detailModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Informasi Karyawan</Text>
              <TouchableOpacity onPress={() => setDetailModalVisible(false)} style={styles.closeBtn}>
                <FontAwesome6 name="xmark" size={16} color="#64748B" />
              </TouchableOpacity>
            </View>

            {selectedEmployee && (
              <View style={styles.detailContent}>
                {/* Profile Header */}
                <View style={styles.detailProfileRow}>
                  <Image
                    source={{
                      uri:
                        selectedEmployee.avatar_url ||
                        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
                    }}
                    style={styles.detailAvatar}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.detailName}>{selectedEmployee.full_name}</Text>
                    <Text style={styles.detailTitle}>{selectedEmployee.job_title}</Text>
                    <Text style={styles.detailDept}>{selectedEmployee.department}</Text>
                  </View>
                </View>

                {/* Status Highlight Box */}
                <View style={[styles.detailStatusBox, { backgroundColor: getStatusBadge(selectedEmployee).bg }]}>
                  <FontAwesome6
                    name={getStatusBadge(selectedEmployee).icon}
                    size={14}
                    color={getStatusBadge(selectedEmployee).text}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.detailStatusTitle, { color: getStatusBadge(selectedEmployee).text }]}>
                      Status Hari Ini: {getStatusBadge(selectedEmployee).label}
                    </Text>
                    {selectedEmployee.leave_details && (
                      <Text style={[styles.detailStatusSub, { color: getStatusBadge(selectedEmployee).text }]}>
                        Alasan: "{selectedEmployee.leave_details.reason}" ({selectedEmployee.leave_details.start_date} s/d {selectedEmployee.leave_details.end_date})
                      </Text>
                    )}
                  </View>
                </View>

                {/* Data Grid */}
                <View style={styles.detailGrid}>
                  <View style={styles.detailGridItem}>
                    <Text style={styles.detailGridLabel}>ID Karyawan</Text>
                    <Text style={styles.detailGridValue}>{selectedEmployee.employee_id}</Text>
                  </View>
                  <View style={styles.detailGridItem}>
                    <Text style={styles.detailGridLabel}>Role Hak Akses</Text>
                    <Text style={styles.detailGridValue}>{selectedEmployee.role?.toUpperCase()}</Text>
                  </View>
                  <View style={styles.detailGridItem}>
                    <Text style={styles.detailGridLabel}>Lokasi Kantor</Text>
                    <Text style={styles.detailGridValue}>{selectedEmployee.office_name || 'HQ Tower Jakarta'}</Text>
                  </View>
                  <View style={styles.detailGridItem}>
                    <Text style={styles.detailGridLabel}>Email Kerja</Text>
                    <Text style={styles.detailGridValue}>{selectedEmployee.email}</Text>
                  </View>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Floating Bottom Navigation */}
      <BottomNavigation onOpenCamera={() => setCameraVisible(true)} />

      {/* Camera Modal */}
      <CameraModal
        visible={cameraVisible}
        actionTitle="Clock In"
        isInsideGeofence={true}
        onClose={() => setCameraVisible(false)}
        onTakeSelfie={async (photoBase64) => {
          setCameraVisible(false);
          const res = await api.submitAttendance({
            type: 'in',
            latitude: -6.20881,
            longitude: 106.84562,
            photo_base64: photoBase64,
          });
          setToastMsg(res.message || 'Presensi berhasil!');
          fetchEmployees();
        }}
      />
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
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  headerSub: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FF9F43',
    letterSpacing: 0.8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  refreshBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseStatsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  pulseStatCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    padding: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#8C9A9E',
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  pulseStatNum: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  pulseStatLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: '#8C9A9E',
    marginTop: 2,
  },
  searchSection: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  searchBarBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    color: '#1E3A44',
    padding: 0,
  },
  filterScroll: {
    gap: 8,
    marginTop: 10,
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterPillActive: {
    backgroundColor: '#1E3A44',
    borderColor: '#1E3A44',
  },
  filterPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  filterPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  scrollContent: {
    padding: 16,
  },
  employeeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#1E3A44',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  employeeMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  employeeAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: '#F1F5F9',
  },
  employeeName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E3A44',
  },
  roleBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  roleBadgeText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#3B82F6',
  },
  employeeTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF9F43',
    marginTop: 1,
  },
  employeeDept: {
    fontSize: 10,
    color: '#8C9A9E',
    marginTop: 1,
  },
  statusStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 10,
  },
  statusStripText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusStripSub: {
    fontSize: 10,
    flex: 1,
    fontStyle: 'italic',
  },
  emptyStateBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E3A44',
    marginTop: 10,
  },
  emptySub: {
    fontSize: 11,
    color: '#8C9A9E',
    textAlign: 'center',
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E3A44',
  },
  closeBtn: {
    padding: 4,
  },
  detailContent: {
    gap: 14,
  },
  detailProfileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  detailAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  detailName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E3A44',
  },
  detailTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF9F43',
    marginTop: 2,
  },
  detailDept: {
    fontSize: 11,
    color: '#8C9A9E',
  },
  detailStatusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 12,
  },
  detailStatusTitle: {
    fontSize: 12,
    fontWeight: '800',
  },
  detailStatusSub: {
    fontSize: 11,
    marginTop: 2,
    fontStyle: 'italic',
  },
  detailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 6,
  },
  detailGridItem: {
    width: '48%',
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 10,
  },
  detailGridLabel: {
    fontSize: 10,
    color: '#8C9A9E',
  },
  detailGridValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E3A44',
    marginTop: 2,
  },
});
