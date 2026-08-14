import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Image } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';

interface DetailModalProps {
  visible: boolean;
  onClose: () => void;
  attendanceData?: {
    name?: string;
    employeeId?: string;
    timestamp?: string;
    coordinates?: string;
    geofenceStatus?: string;
    photoUrl?: string;
  };
}

export const DetailModal: React.FC<DetailModalProps> = ({
  visible,
  onClose,
  attendanceData = {
    name: 'Alex Morgan',
    employeeId: 'EMP-8821',
    timestamp: '08:28:14 AM (24 Aug)',
    coordinates: '-6.20881, 106.84562',
    geofenceStatus: 'Terverifikasi (12m)',
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300',
  },
}) => {
  return (
    <Modal visible={visible} animationType="fade" transparent={true} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <FontAwesome6 name="certificate" size={14} color="#FF9F43" />
              <Text style={styles.headerTitle}>Detail Verifikasi Absensi</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <FontAwesome6 name="xmark" size={14} color="#8C9A9E" />
            </TouchableOpacity>
          </View>

          {/* Body Content */}
          <View style={styles.body}>
            {/* Grid 2 Columns: Selfie + Map Preview */}
            <View style={styles.gridRow}>
              <View style={styles.gridCol}>
                <Text style={styles.colLabel}>FOTO SELFIE</Text>
                <Image source={{ uri: attendanceData.photoUrl }} style={styles.previewImage} />
              </View>

              <View style={styles.gridCol}>
                <Text style={styles.colLabel}>PETA GPS</Text>
                <View style={styles.mapContainer}>
                  <Image
                    source={{ uri: 'https://placehold.co/300x300/1E3A44/FFFFFF?text=GPS+Map+HQ' }}
                    style={styles.mapImage}
                  />
                  <View style={styles.mapPin}>
                    <FontAwesome6 name="location-dot" size={12} color="#1E3A44" />
                  </View>
                </View>
              </View>
            </View>

            {/* Attendance Metadata List */}
            <View style={styles.metadataCard}>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Nama Karyawan</Text>
                <Text style={styles.metaVal}>{attendanceData.name} ({attendanceData.employeeId})</Text>
              </View>

              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Waktu Clock In</Text>
                <Text style={styles.metaVal}>{attendanceData.timestamp}</Text>
              </View>

              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Koordinat GPS</Text>
                <Text style={styles.metaMonoVal}>{attendanceData.coordinates}</Text>
              </View>

              <View style={[styles.metaRow, { borderBottomWidth: 0 }]}>
                <Text style={styles.metaLabel}>Status Geofence</Text>
                <Text style={styles.metaSuccessVal}>{attendanceData.geofenceStatus}</Text>
              </View>
            </View>

            {/* Close Button */}
            <TouchableOpacity onPress={onClose} style={styles.submitBtn}>
              <Text style={styles.submitBtnText}>Tutup</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  container: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 32,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    backgroundColor: '#1E3A44',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#152B33',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    padding: 20,
    gap: 16,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 12,
  },
  gridCol: {
    flex: 1,
    gap: 4,
  },
  colLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#8C9A9E',
    letterSpacing: 0.5,
  },
  previewImage: {
    width: '100%',
    height: 110,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  mapContainer: {
    width: '100%',
    height: 110,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E3A44',
  },
  mapImage: {
    width: '100%',
    height: '100%',
    opacity: 0.8,
  },
  mapPin: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FF9F43',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF9F43',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  metadataCard: {
    backgroundColor: '#F4F6F6',
    borderRadius: 16,
    padding: 14,
    gap: 10,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 8,
  },
  metaLabel: {
    fontSize: 12,
    color: '#8C9A9E',
    fontWeight: '500',
  },
  metaVal: {
    fontSize: 12,
    color: '#1E3A44',
    fontWeight: '700',
  },
  metaMonoVal: {
    fontSize: 11,
    color: '#334155',
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  metaSuccessVal: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '800',
  },
  submitBtn: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 9999,
    backgroundColor: '#1E3A44',
    alignItems: 'center',
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
});
