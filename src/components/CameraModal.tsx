import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';

interface CameraModalProps {
  visible: boolean;
  onClose: () => void;
  onTakeSelfie: (photoBase64: string) => void;
  isInsideGeofence?: boolean;
  isGeofenceRequired?: boolean;
  actionTitle?: string;
}

export const CameraModal: React.FC<CameraModalProps> = ({
  visible,
  onClose,
  onTakeSelfie,
  isInsideGeofence = true,
  isGeofenceRequired = false,
  actionTitle = 'Clock In',
}) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [capturing, setCapturing] = useState(false);
  const [facing, setFacing] = useState<'front' | 'back'>('front');

  const cameraRef = useRef<any>(null);

  // Auto request permission on open
  useEffect(() => {
    if (visible && !permission?.granted) {
      requestPermission();
    }
    if (visible) {
      setCapturedPhoto(null);
    }
  }, [visible]);

  const handleShutter = async () => {
    // Only block if company explicitly requires geofence AND user is outside
    if (isGeofenceRequired && !isInsideGeofence) return;

    if (cameraRef.current) {
      setCapturing(true);
      try {
        const options = { quality: 0.3, base64: true };
        const photo = await cameraRef.current.takePictureAsync(options);
        console.log('📸 Camera selfie captured:', {
          uri: photo?.uri,
          base64Length: photo?.base64?.length,
        });

        if (photo?.base64) {
          setCapturedPhoto(`data:image/jpeg;base64,${photo.base64}`);
        } else if (photo?.uri) {
          // Convert local file/blob URI to Base64 Data URL
          const res = await fetch(photo.uri);
          const blob = await res.blob();
          const base64Data = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
          setCapturedPhoto(base64Data);
        }
      } catch (err: any) {
        console.log('❌ Camera takePictureAsync error:', err);
      } finally {
        setCapturing(false);
      }
    } else {
      console.log('⚠️ cameraRef.current is null! Camera not mounted or permission missing.');
    }
  };

  const handleConfirmUse = () => {
    if (capturedPhoto) {
      const finalPhoto = capturedPhoto;
      setCapturedPhoto(null);
      onTakeSelfie(finalPhoto);
    }
  };

  const handleRetake = () => {
    setCapturedPhoto(null);
  };

  const toggleCameraFacing = () => {
    setFacing((current) => (current === 'back' ? 'front' : 'back'));
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.overlay}>
        {/* Top Control Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={onClose} style={styles.iconBtn}>
            <FontAwesome6 name="xmark" size={16} color="#FFFFFF" />
          </TouchableOpacity>

          {isGeofenceRequired ? (
            <View style={[styles.badge, isInsideGeofence ? styles.badgeSuccess : styles.badgeError]}>
              <FontAwesome6
                name={isInsideGeofence ? 'circle-check' : 'circle-xmark'}
                size={12}
                color={isInsideGeofence ? '#34D399' : '#FB7185'}
              />
              <Text style={[styles.badgeText, isInsideGeofence ? styles.badgeTextSuccess : styles.badgeTextError]}>
                {isInsideGeofence ? 'Di Dalam Radius (12m)' : 'Di Luar Geofence (120m)'}
              </Text>
            </View>
          ) : (
            <View style={[styles.badge, styles.badgeWfa]}>
              <FontAwesome6 name="location-dot" size={12} color="#38BDF8" />
              <Text style={[styles.badgeText, { color: '#38BDF8' }]}>
                Absensi Fleksibel (WFA / Remote)
              </Text>
            </View>
          )}

          <TouchableOpacity onPress={toggleCameraFacing} style={styles.iconBtn}>
            <FontAwesome6 name="arrows-rotate" size={14} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Viewfinder Frame */}
        <View style={styles.viewfinder}>
          {capturedPhoto ? (
            /* Captured Real Photo Preview Screen */
            <Image source={{ uri: capturedPhoto }} style={styles.cameraFeed} />
          ) : permission?.granted ? (
            /* Native Real Camera Feed */
            <>
              <CameraView ref={cameraRef} facing={facing} style={styles.cameraFeed} />
              <View style={styles.ovalGuide}>
                <View style={styles.guidePill}>
                  <Text style={styles.guideText}>Posisikan Wajah di Oval</Text>
                </View>
              </View>
            </>
          ) : (
            /* Permission Request View */
            <View style={styles.permissionBox}>
              <FontAwesome6 name="camera" size={32} color="#FF9F43" />
              <Text style={styles.permText}>Akses Kamera Diperlukan</Text>
              <TouchableOpacity onPress={() => requestPermission()} style={styles.permBtn}>
                <Text style={styles.permBtnText}>Izinkan Kamera</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Bottom Control Panel */}
        <View style={styles.bottomControlPanel}>
          {capturedPhoto ? (
            /* Preview Confirmation Action Row */
            <View style={styles.confirmRow}>
              <TouchableOpacity onPress={handleRetake} style={styles.retakeBtn}>
                <FontAwesome6 name="rotate-left" size={14} color="#FFFFFF" />
                <Text style={styles.retakeBtnText}>Ulangi Foto</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={handleConfirmUse} style={styles.confirmBtn}>
                <FontAwesome6 name="check" size={14} color="#1E3A44" />
                <Text style={styles.confirmBtnText}>Gunakan & Absen</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* Camera Shutter Panel */
            <>
              <Text style={styles.controlTitle}>
                Verifikasi Foto Selfie untuk <Text style={styles.highlightText}>{actionTitle}</Text>
              </Text>

              <View style={styles.shutterRow}>
                <TouchableOpacity onPress={toggleCameraFacing} style={styles.subBtn}>
                  <FontAwesome6 name="camera-rotate" size={16} color="#8C9A9E" />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleShutter}
                  disabled={!isInsideGeofence || capturing}
                  style={[styles.shutterBtn, (!isInsideGeofence || capturing) && { opacity: 0.5 }]}
                >
                  <View style={styles.shutterInner}>
                    {capturing ? (
                      <ActivityIndicator color="#1E3A44" />
                    ) : (
                      <FontAwesome6 name="camera" size={22} color="#1E3A44" />
                    )}
                  </View>
                </TouchableOpacity>

                <TouchableOpacity onPress={onClose} style={styles.subBtn}>
                  <FontAwesome6 name="xmark" size={16} color="#8C9A9E" />
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  topBar: {
    width: '100%',
    maxWidth: 380,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1E3A44',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badgeSuccess: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  badgeError: {
    backgroundColor: 'rgba(244, 63, 94, 0.2)',
    borderColor: 'rgba(244, 63, 94, 0.4)',
  },
  badgeWfa: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderColor: 'rgba(56, 189, 248, 0.35)',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  badgeTextSuccess: {
    color: '#34D399',
  },
  badgeTextError: {
    color: '#FB7185',
  },
  viewfinder: {
    width: 280,
    height: 360,
    borderRadius: 36,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F172A',
    position: 'relative',
  },
  cameraFeed: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionBox: {
    alignItems: 'center',
    gap: 12,
    padding: 20,
  },
  permText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  permBtn: {
    backgroundColor: '#FF9F43',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 9999,
  },
  permBtnText: {
    color: '#1E3A44',
    fontSize: 12,
    fontWeight: '800',
  },
  ovalGuide: {
    position: 'absolute',
    width: 200,
    height: 250,
    borderRadius: 100,
    borderWidth: 2,
    borderColor: '#FF9F43',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 10,
  },
  guidePill: {
    backgroundColor: 'rgba(30, 58, 68, 0.85)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#475569',
    marginTop: -20,
  },
  guideText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  bottomControlPanel: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#1E3A44',
    borderRadius: 32,
    padding: 20,
    alignItems: 'center',
    gap: 16,
  },
  controlTitle: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  highlightText: {
    color: '#FF9F43',
    fontWeight: '800',
  },
  shutterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  subBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FF9F43',
    padding: 6,
    shadowColor: '#FF9F43',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  shutterInner: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF9F43',
  },
  confirmRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    width: '100%',
  },
  retakeBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 9999,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  retakeBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 9999,
    backgroundColor: '#FF9F43',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  confirmBtnText: {
    color: '#1E3A44',
    fontSize: 13,
    fontWeight: '800',
  },
});
