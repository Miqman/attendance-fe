import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  Image,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { FontAwesome6 } from '@expo/vector-icons';
import { Toast } from '@/components/Toast';
import { api } from '@/services/api';
import { useAuthStore } from '@/services/authStore';

export default function RequestsScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  // States
  const [activeTab, setActiveTab] = useState<'my_requests' | 'approvals'>('my_requests');
  const [myRequests, setMyRequests] = useState<any[]>([]);
  const [approvals, setApprovals] = useState<any[]>([]);
  const [leaveBalance, setLeaveBalance] = useState<any>(null);
  const [approverOptions, setApproverOptions] = useState<any[]>([]);
  const [selectedApproverId, setSelectedApproverId] = useState<string | null>(null);
  const [isApprover, setIsApprover] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // New Request Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [approverPickerVisible, setApproverPickerVisible] = useState(false);
  const [searchApproverText, setSearchApproverText] = useState('');
  const [reqType, setReqType] = useState<'cuti' | 'izin' | 'sakit' | 'overtime'>('cuti');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Reject Dialog State
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [selectedReqId, setSelectedReqId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      // 1. My Requests
      const myRes = await api.getMyRequests();
      if (myRes.requests) {
        setMyRequests(myRes.requests);
      }

      // 2. Leave Balance
      const balRes = await api.getLeaveBalance();
      if (balRes.balance) {
        setLeaveBalance(balRes.balance);
      }

      // 3. Approvals
      const appRes = await api.getApprovals();
      if (appRes.approvals) {
        setApprovals(appRes.approvals);
        setIsApprover(Boolean(appRes.is_approver));
      }

      // 4. Approver Options (Leads, Managers, HR)
      const approversRes = await api.getApprovers();
      if (approversRes.approvers) {
        setApproverOptions(approversRes.approvers);
        if (!selectedApproverId && approversRes.approvers.length > 0) {
          setSelectedApproverId(approversRes.approvers[0].id);
        }
      }
    } catch (err) {
      console.log('Error fetching requests data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  // Handle Create Request Submit
  const handleSubmitRequest = async () => {
    if (!reason.trim()) {
      setToastMsg('Peringatan: Harap isi alasan permohonan.');
      return;
    }

    setSubmitting(true);
    const res = await api.submitRequest({
      type: reqType,
      start_date: startDate,
      end_date: endDate,
      reason,
      approver_id: selectedApproverId || undefined,
    });
    setSubmitting(false);

    if (res.success) {
      setToastMsg(res.message || 'Pengajuan berhasil dikirimkan!');
      setModalVisible(false);
      setReason('');
      fetchInitialData();
    } else {
      setToastMsg(res.error || 'Gagal mengirimkan pengajuan');
    }
  };

  // Handle Approve by Lead/HR
  const handleApprove = async (id: string) => {
    setActionLoading(true);
    const res = await api.approveRequest(id);
    setActionLoading(false);

    if (res.success) {
      setToastMsg(res.message || 'Pengajuan berhasil disetujui (Approved)!');
      fetchInitialData();
    } else {
      setToastMsg(res.error || 'Gagal menyetujui pengajuan');
    }
  };

  // Handle Open Reject Dialog
  const handleOpenReject = (id: string) => {
    setSelectedReqId(id);
    setRejectReason('');
    setRejectModalVisible(true);
  };

  // Handle Confirm Reject
  const handleConfirmReject = async () => {
    if (!selectedReqId) return;
    if (!rejectReason.trim()) {
      setToastMsg('Harap masukkan alasan penolakan.');
      return;
    }

    setActionLoading(true);
    const res = await api.rejectRequest(selectedReqId, rejectReason);
    setActionLoading(false);

    if (res.success) {
      setToastMsg(res.message || 'Pengajuan telah ditolak.');
      setRejectModalVisible(false);
      setSelectedReqId(null);
      fetchInitialData();
    } else {
      setToastMsg(res.error || 'Gagal menolak pengajuan');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return { bg: '#ECFDF5', text: '#059669', label: 'Disetujui' };
      case 'rejected':
        return { bg: '#FFE4E6', text: '#E11D48', label: 'Ditolak' };
      default:
        return { bg: '#FEF3C7', text: '#D97706', label: 'Menunggu Review' };
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'cuti':
        return { label: 'Cuti Tahunan', icon: 'calendar-check', color: '#3B82F6' };
      case 'sakit':
        return { label: 'Izin Sakit', icon: 'notes-medical', color: '#EF4444' };
      case 'izin':
        return { label: 'Izin Keperluan', icon: 'envelope-open-text', color: '#F59E0B' };
      case 'overtime':
        return { label: 'Klaim Lembur', icon: 'clock', color: '#8B5CF6' };
      default:
        return { label: type.toUpperCase(), icon: 'file-lines', color: '#64748B' };
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchInitialData();
    setRefreshing(false);
    setToastMsg('Data pengajuan diperbarui');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Toast message={toastMsg} onHide={() => setToastMsg(null)} />

      {/* Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <FontAwesome6 name="arrow-left" size={16} color="#1E3A44" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Pengajuan & Izin</Text>
          <Text style={styles.headerSubtitle}>Cuti, Izin Sakit & Persetujuan Atasan</Text>
        </View>
        <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.newReqBtn}>
          <FontAwesome6 name="plus" size={12} color="#1E3A44" />
          <Text style={styles.newReqBtnText}>Ajukan</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          onPress={() => setActiveTab('my_requests')}
          style={[styles.tabButton, activeTab === 'my_requests' && styles.tabButtonActive]}
        >
          <Text style={[styles.tabText, activeTab === 'my_requests' && styles.tabTextActive]}>
            Pengajuan Saya ({myRequests.length})
          </Text>
        </TouchableOpacity>

        {isApprover && (
          <TouchableOpacity
            onPress={() => setActiveTab('approvals')}
            style={[styles.tabButton, activeTab === 'approvals' && styles.tabButtonActive]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={[styles.tabText, activeTab === 'approvals' && styles.tabTextActive]}>
                Persetujuan Tim
              </Text>
              {approvals.filter((a) => a.status === 'pending').length > 0 && (
                <View style={styles.pendingBadge}>
                  <Text style={styles.pendingBadgeText}>
                    {approvals.filter((a) => a.status === 'pending').length}
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        )}
      </View>

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
        {activeTab === 'my_requests' ? (
          <>
            {/* Leave Balance Banner */}
            <View style={styles.balanceCard}>
              <View style={styles.balanceHeader}>
                <View style={styles.balanceIconBox}>
                  <FontAwesome6 name="calendar-days" size={18} color="#FF9F43" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.balanceTitle}>Saldo Cuti Tahunan 2026</Text>
                  <Text style={styles.balanceSub}>Hak cuti karyawan aktif</Text>
                </View>
                <View style={styles.quotaPill}>
                  <Text style={styles.quotaPillText}>
                    {leaveBalance?.remaining_quota ?? 10} / {leaveBalance?.total_quota ?? 12} Hari
                  </Text>
                </View>
              </View>

              <View style={styles.balanceStatsRow}>
                <View style={styles.balanceStatItem}>
                  <Text style={styles.balanceStatNum}>{leaveBalance?.total_quota ?? 12}</Text>
                  <Text style={styles.balanceStatLabel}>Total Kuota</Text>
                </View>
                <View style={styles.balanceStatDivider} />
                <View style={styles.balanceStatItem}>
                  <Text style={[styles.balanceStatNum, { color: '#EF4444' }]}>
                    {leaveBalance?.used_quota ?? 2}
                  </Text>
                  <Text style={styles.balanceStatLabel}>Terpakai</Text>
                </View>
                <View style={styles.balanceStatDivider} />
                <View style={styles.balanceStatItem}>
                  <Text style={[styles.balanceStatNum, { color: '#10B981' }]}>
                    {leaveBalance?.remaining_quota ?? 10}
                  </Text>
                  <Text style={styles.balanceStatLabel}>Sisa Hari</Text>
                </View>
              </View>
            </View>

            {/* List Header */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Riwayat Permohonan</Text>
            </View>

            {loading ? (
              <ActivityIndicator size="small" color="#FF9F43" style={{ marginVertical: 30 }} />
            ) : myRequests.length > 0 ? (
              myRequests.map((item) => {
                const badge = getStatusBadge(item.status);
                const typeMeta = getTypeLabel(item.type);
                return (
                  <View key={item.id} style={styles.requestCard}>
                    <View style={styles.cardTopRow}>
                      <View style={styles.cardTypeGroup}>
                        <View style={[styles.typeIconBox, { backgroundColor: typeMeta.color + '15' }]}>
                          <FontAwesome6 name={typeMeta.icon} size={14} color={typeMeta.color} />
                        </View>
                        <View>
                          <Text style={styles.cardTypeTitle}>{typeMeta.label}</Text>
                          <Text style={styles.cardDates}>
                            {item.start_date} s/d {item.end_date}
                          </Text>
                        </View>
                      </View>

                      <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
                        <Text style={[styles.statusBadgeText, { color: badge.text }]}>
                          {badge.label}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.cardReasonText}>"{item.reason}"</Text>

                    {/* Assigned Approver Target */}
                    <View style={styles.targetApproverBox}>
                      <FontAwesome6 name="paper-plane" size={10} color="#64748B" />
                      <Text style={styles.targetApproverText}>
                        Ditujukan ke:{' '}
                        <Text style={{ fontWeight: '700', color: '#1E3A44' }}>
                          {item.approver?.full_name || 'Atasan / HR'}
                        </Text>{' '}
                        {item.approver?.job_title ? `(${item.approver.job_title})` : ''}
                      </Text>
                    </View>

                    {item.approved_by && (
                      <View style={styles.approverInfoBox}>
                        <FontAwesome6 name="user-check" size={11} color="#059669" />
                        <Text style={styles.approverInfoText}>
                          Disetujui oleh: <Text style={{ fontWeight: '700' }}>{item.approved_by}</Text>
                        </Text>
                      </View>
                    )}

                    {item.status === 'rejected' && item.rejection_reason && (
                      <View style={[styles.approverInfoBox, { backgroundColor: '#FFF1F2' }]}>
                        <FontAwesome6 name="circle-xmark" size={11} color="#E11D48" />
                        <Text style={[styles.approverInfoText, { color: '#E11D48' }]}>
                          Alasan Ditolak: {item.rejection_reason}
                        </Text>
                      </View>
                    )}
                  </View>
                );
              })
            ) : (
              <View style={styles.emptyStateCard}>
                <FontAwesome6 name="folder-open" size={32} color="#CBD5E1" />
                <Text style={styles.emptyTitle}>Belum Ada Pengajuan</Text>
                <Text style={styles.emptySub}>
                  Gunakan tombol "+ Ajukan" di pojok kanan atas untuk mengajukan cuti atau izin.
                </Text>
              </View>
            )}
          </>
        ) : (
          <>
            {/* Tab 2: Approvals List */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Permohonan Bawahan & Tim</Text>
            </View>

            {loading ? (
              <ActivityIndicator size="small" color="#FF9F43" style={{ marginVertical: 30 }} />
            ) : approvals.length > 0 ? (
              approvals.map((item) => {
                const badge = getStatusBadge(item.status);
                const typeMeta = getTypeLabel(item.type);
                const isPending = item.status === 'pending';

                return (
                  <View key={item.id} style={styles.approvalCard}>
                    {/* Applicant Profile Bar */}
                    <View style={styles.applicantRow}>
                      <Image
                        source={{
                          uri:
                            item.applicant?.avatar_url ||
                            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
                        }}
                        style={styles.applicantAvatar}
                      />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.applicantName}>{item.applicant?.full_name}</Text>
                        <Text style={styles.applicantMeta}>
                          {item.applicant?.employee_id} • {item.applicant?.job_title}
                        </Text>
                      </View>

                      <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
                        <Text style={[styles.statusBadgeText, { color: badge.text }]}>
                          {badge.label}
                        </Text>
                      </View>
                    </View>

                    {/* Details */}
                    <View style={styles.approvalDetails}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <FontAwesome6 name={typeMeta.icon} size={12} color={typeMeta.color} />
                        <Text style={[styles.approvalTypeTag, { color: typeMeta.color }]}>
                          {typeMeta.label}
                        </Text>
                      </View>
                      <Text style={styles.approvalDates}>
                        Tanggal: <Text style={{ fontWeight: '700' }}>{item.start_date}</Text> s/d{' '}
                        <Text style={{ fontWeight: '700' }}>{item.end_date}</Text>
                      </Text>
                      <Text style={styles.approvalReason}>"{item.reason}"</Text>
                    </View>

                    {/* Action Buttons if Pending */}
                    {isPending && (
                      <View style={styles.actionButtonGroup}>
                        <TouchableOpacity
                          onPress={() => handleOpenReject(item.id)}
                          disabled={actionLoading}
                          style={styles.rejectBtn}
                        >
                          <FontAwesome6 name="xmark" size={12} color="#E11D48" />
                          <Text style={styles.rejectBtnText}>Tolak</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() => handleApprove(item.id)}
                          disabled={actionLoading}
                          style={styles.approveBtn}
                        >
                          <FontAwesome6 name="check" size={12} color="#FFFFFF" />
                          <Text style={styles.approveBtnText}>Setujui (Approve)</Text>
                        </TouchableOpacity>
                      </View>
                    )}

                    {!isPending && item.approved_by && (
                      <View style={styles.approverInfoBox}>
                        <FontAwesome6 name="circle-check" size={11} color="#059669" />
                        <Text style={styles.approverInfoText}>
                          Diputuskan oleh: {item.approved_by}
                        </Text>
                      </View>
                    )}
                  </View>
                );
              })
            ) : (
              <View style={styles.emptyStateCard}>
                <FontAwesome6 name="circle-check" size={32} color="#10B981" />
                <Text style={styles.emptyTitle}>Semua Pengajuan Selesai</Text>
                <Text style={styles.emptySub}>Tidak ada permohonan pending yang membutuhkan persetujuan.</Text>
              </View>
            )}
          </>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Modal: Form Pengajuan Baru */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Buat Pengajuan Baru</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                <FontAwesome6 name="xmark" size={16} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Type Selector Pills */}
            <Text style={styles.inputLabel}>Tipe Pengajuan</Text>
            <View style={styles.typeSelectorRow}>
              {[
                { key: 'cuti', label: 'Cuti Tahunan' },
                { key: 'sakit', label: 'Izin Sakit' },
                { key: 'izin', label: 'Izin Khusus' },
                { key: 'overtime', label: 'Lembur' },
              ].map((t) => (
                <TouchableOpacity
                  key={t.key}
                  onPress={() => setReqType(t.key as any)}
                  style={[styles.typePill, reqType === t.key && styles.typePillActive]}
                >
                  <Text style={[styles.typePillText, reqType === t.key && styles.typePillTextActive]}>
                    {t.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Dynamic Searchable Approver Selector */}
            <Text style={styles.inputLabel}>Atasan / Approver Yang Menyetujui</Text>
            {(() => {
              const selectedAppr = approverOptions.find((a) => a.id === selectedApproverId) || approverOptions[0];
              return (
                <TouchableOpacity
                  onPress={() => {
                    setSearchApproverText('');
                    setApproverPickerVisible(true);
                  }}
                  style={styles.approverTriggerCard}
                >
                  <Image
                    source={{
                      uri:
                        selectedAppr?.avatar_url ||
                        'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120',
                    }}
                    style={styles.approverTriggerAvatar}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.approverTriggerName}>
                      {selectedAppr ? selectedAppr.full_name : 'Pilih Atasan...'}
                    </Text>
                    <Text style={styles.approverTriggerRole}>
                      {selectedAppr ? `${selectedAppr.job_title} • ${selectedAppr.department || 'Management'}` : 'Klik untuk mencari atasan'}
                    </Text>
                  </View>
                  <View style={styles.changeApproverBtn}>
                    <FontAwesome6 name="magnifying-glass" size={11} color="#1E3A44" />
                    <Text style={styles.changeApproverBtnText}>Cari</Text>
                  </View>
                </TouchableOpacity>
              );
            })()}

            {/* Dates Inputs */}
            <View style={styles.dateInputsRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Tanggal Mulai (YYYY-MM-DD)</Text>
                <TextInput
                  style={styles.textInput}
                  value={startDate}
                  onChangeText={setStartDate}
                  placeholder="2026-08-28"
                  placeholderTextColor="#94A3B8"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Tanggal Selesai</Text>
                <TextInput
                  style={styles.textInput}
                  value={endDate}
                  onChangeText={setEndDate}
                  placeholder="2026-08-29"
                  placeholderTextColor="#94A3B8"
                />
              </View>
            </View>

            {/* Reason Input */}
            <Text style={styles.inputLabel}>Alasan / Uraian Permohonan</Text>
            <TextInput
              style={[styles.textInput, { height: 70, textAlignVertical: 'top' }]}
              value={reason}
              onChangeText={setReason}
              placeholder="Contoh: Mengurus keperluan keluarga / istirahat sakit..."
              placeholderTextColor="#94A3B8"
              multiline
            />

            {/* Submit Button */}
            <TouchableOpacity
              onPress={handleSubmitRequest}
              disabled={submitting}
              style={styles.submitBtn}
            >
              {submitting ? (
                <ActivityIndicator color="#1E3A44" size="small" />
              ) : (
                <Text style={styles.submitBtnText}>Kirim Pengajuan ke Atasan</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal: Searchable Approver Picker Dialog */}
      <Modal visible={approverPickerVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { height: '80%', maxHeight: 600 }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Pilih Atasan / Approver</Text>
                <Text style={styles.modalSub}>Pilih atasan atau HR yang berwenang menyetujui</Text>
              </View>
              <TouchableOpacity onPress={() => setApproverPickerVisible(false)} style={styles.closeBtn}>
                <FontAwesome6 name="xmark" size={16} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Search Input Bar */}
            <View style={styles.searchBarBox}>
              <FontAwesome6 name="magnifying-glass" size={13} color="#94A3B8" />
              <TextInput
                style={styles.searchBarInput}
                value={searchApproverText}
                onChangeText={setSearchApproverText}
                placeholder="Cari nama atasan, jabatan, divisi..."
                placeholderTextColor="#94A3B8"
                autoFocus
              />
              {searchApproverText.length > 0 && (
                <TouchableOpacity onPress={() => setSearchApproverText('')}>
                  <FontAwesome6 name="circle-xmark" size={14} color="#94A3B8" />
                </TouchableOpacity>
              )}
            </View>

            {/* Vertical Search List */}
            <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1, marginTop: 10 }}>
              {(() => {
                const filtered = approverOptions.filter(
                  (a) =>
                    a.full_name?.toLowerCase().includes(searchApproverText.toLowerCase()) ||
                    a.job_title?.toLowerCase().includes(searchApproverText.toLowerCase()) ||
                    (a.department && a.department.toLowerCase().includes(searchApproverText.toLowerCase()))
                );

                if (filtered.length === 0) {
                  return (
                    <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                      <FontAwesome6 name="user-slash" size={28} color="#CBD5E1" />
                      <Text style={{ fontSize: 13, fontWeight: '700', color: '#64748B', marginTop: 10 }}>
                        Atasan tidak ditemukan
                      </Text>
                      <Text style={{ fontSize: 11, color: '#94A3B8', marginTop: 4 }}>
                        Coba gunakan kata kunci nama atau divisi lain.
                      </Text>
                    </View>
                  );
                }

                return filtered.map((appr) => {
                  const isSelected = selectedApproverId === appr.id;
                  return (
                    <TouchableOpacity
                      key={appr.id}
                      onPress={() => {
                        setSelectedApproverId(appr.id);
                        setApproverPickerVisible(false);
                      }}
                      style={[
                        styles.approverListItem,
                        isSelected && styles.approverListItemActive,
                      ]}
                    >
                      <Image
                        source={{
                          uri:
                            appr.avatar_url ||
                            'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120',
                        }}
                        style={styles.approverListAvatar}
                      />
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text
                            style={[
                              styles.approverListName,
                              isSelected && { color: '#FF9F43', fontWeight: '800' },
                            ]}
                          >
                            {appr.full_name}
                          </Text>
                          <View
                            style={[
                              styles.roleTagPill,
                              appr.role === 'hr' && { backgroundColor: '#FDF2F8' },
                            ]}
                          >
                            <Text
                              style={[
                                styles.roleTagText,
                                appr.role === 'hr' && { color: '#DB2777' },
                              ]}
                            >
                              {appr.role?.toUpperCase()}
                            </Text>
                          </View>
                        </View>
                        <Text style={styles.approverListRole}>
                          {appr.job_title} • {appr.department || 'Operasional'}
                        </Text>
                      </View>

                      {isSelected ? (
                        <View style={styles.approverCheckCircleLarge}>
                          <FontAwesome6 name="check" size={11} color="#1E3A44" />
                        </View>
                      ) : (
                        <FontAwesome6 name="chevron-right" size={11} color="#CBD5E1" />
                      )}
                    </TouchableOpacity>
                  );
                });
              })()}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal: Tolak Pengajuan (Reason Dialog) */}
      <Modal visible={rejectModalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Alasan Penolakan</Text>
            <Text style={styles.modalSub}>
              Masukkan alasan mengapa pengajuan ini tidak dapat disetujui:
            </Text>

            <TextInput
              style={[styles.textInput, { height: 80, textAlignVertical: 'top', marginTop: 12 }]}
              value={rejectReason}
              onChangeText={setRejectReason}
              placeholder="Contoh: Kuota tim pada tanggal tersebut sudah penuh..."
              placeholderTextColor="#94A3B8"
              multiline
            />

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
              <TouchableOpacity
                onPress={() => setRejectModalVisible(false)}
                style={[styles.rejectBtn, { flex: 1, paddingVertical: 12 }]}
              >
                <Text style={styles.rejectBtnText}>Batal</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleConfirmReject}
                disabled={actionLoading}
                style={[styles.approveBtn, { flex: 1, backgroundColor: '#E11D48', paddingVertical: 12 }]}
              >
                {actionLoading ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <Text style={styles.approveBtnText}>Konfirmasi Tolak</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F4F6F6',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E3A44',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
  },
  newReqBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FF9F43',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 9999,
  },
  newReqBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E3A44',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  tabButton: {
    paddingVertical: 12,
    marginRight: 20,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabButtonActive: {
    borderBottomColor: '#FF9F43',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8C9A9E',
  },
  tabTextActive: {
    color: '#1E3A44',
    fontWeight: '800',
  },
  pendingBadge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
  },
  pendingBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  scrollContent: {
    padding: 16,
  },
  balanceCard: {
    backgroundColor: '#1E3A44',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  balanceIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 159, 67, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  balanceTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  balanceSub: {
    fontSize: 11,
    color: '#8C9A9E',
  },
  quotaPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  quotaPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FF9F43',
  },
  balanceStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  balanceStatItem: {
    alignItems: 'center',
  },
  balanceStatNum: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  balanceStatLabel: {
    fontSize: 10,
    color: '#8C9A9E',
    marginTop: 2,
  },
  balanceStatDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E3A44',
  },
  requestCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTypeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  typeIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTypeTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E3A44',
  },
  cardDates: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  cardReasonText: {
    fontSize: 12,
    color: '#475569',
    marginTop: 10,
    fontStyle: 'italic',
  },
  approverInfoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    marginTop: 10,
  },
  approverInfoText: {
    fontSize: 10,
    color: '#059669',
  },
  approvalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  applicantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  applicantAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  applicantName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E3A44',
  },
  applicantMeta: {
    fontSize: 11,
    color: '#64748B',
  },
  approvalDetails: {
    marginTop: 10,
    gap: 4,
  },
  approvalTypeTag: {
    fontSize: 12,
    fontWeight: '700',
  },
  approvalDates: {
    fontSize: 11,
    color: '#475569',
  },
  approvalReason: {
    fontSize: 12,
    color: '#334155',
    fontStyle: 'italic',
  },
  actionButtonGroup: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  rejectBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FECDD3',
    backgroundColor: '#FFF1F2',
  },
  rejectBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#E11D48',
  },
  approveBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#10B981',
  },
  approveBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  emptyStateCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 30,
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
    color: '#64748B',
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
  modalSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  closeBtn: {
    padding: 4,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 6,
    marginTop: 10,
  },
  typeSelectorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 6,
  },
  typePill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  typePillActive: {
    backgroundColor: '#FF9F43',
    borderColor: '#FF9F43',
  },
  typePillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  typePillTextActive: {
    color: '#1E3A44',
    fontWeight: '800',
  },
  dateInputsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 12,
    color: '#1E3A44',
  },
  submitBtn: {
    backgroundColor: '#FF9F43',
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  submitBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E3A44',
  },
  targetApproverBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  targetApproverText: {
    fontSize: 10,
    color: '#64748B',
  },
  approverTriggerCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    marginBottom: 6,
  },
  approverTriggerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  approverTriggerName: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1E3A44',
  },
  approverTriggerRole: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 1,
  },
  changeApproverBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 159, 67, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },
  changeApproverBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1E3A44',
  },
  searchBarBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 6,
  },
  searchBarInput: {
    flex: 1,
    fontSize: 12,
    color: '#1E3A44',
    padding: 0,
  },
  approverListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  approverListItemActive: {
    backgroundColor: '#FFF8F1',
  },
  approverListAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  approverListName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E3A44',
  },
  approverListRole: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },
  roleTagPill: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  roleTagText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#3B82F6',
  },
  approverCheckCircleLarge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FF9F43',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
