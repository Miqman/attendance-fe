import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';

interface OTPModalProps {
  visible: boolean;
  email: string;
  loading?: boolean;
  expiresAt?: string | null;
  errorMsg?: string | null;
  sampleOtpCode?: string;
  onClose: () => void;
  onVerifySuccess: (otpCode: string) => void;
  onResendOtp?: () => void;
}

export const OTPModal: React.FC<OTPModalProps> = ({
  visible,
  email,
  loading = false,
  expiresAt,
  errorMsg,
  sampleOtpCode,
  onClose,
  onVerifySuccess,
  onResendOtp,
}) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const inputsRef = useRef<Array<TextInput | null>>([]);

  // Reset & focus first box when modal opens
  useEffect(() => {
    if (visible) {
      setOtp(['', '', '', '', '', '']);
      setTimeout(() => {
        inputsRef.current[0]?.focus();
      }, 300);
    }
  }, [visible]);

  // Countdown timer for OTP Expiration
  useEffect(() => {
    if (!visible || !expiresAt) {
      setRemainingSeconds(null);
      return;
    }

    const calcTime = () => {
      const diff = Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000);
      return Math.max(0, diff);
    };

    setRemainingSeconds(calcTime());

    const timer = setInterval(() => {
      const remaining = calcTime();
      setRemainingSeconds(remaining);
      if (remaining === 0) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [visible, expiresAt]);

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleChangeText = (text: string, index: number) => {
    if (text.length > 1) {
      const pasted = text.trim().slice(0, 6).split('');
      const newOtp = ['', '', '', '', '', ''];
      pasted.forEach((char, i) => {
        newOtp[i] = char;
      });
      setOtp(newOtp);
      inputsRef.current[Math.min(pasted.length, 5)]?.focus();
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    if (text && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handleVerify = () => {
    if (loading || remainingSeconds === 0) return;
    const otpCode = otp.join('');
    onVerifySuccess(otpCode);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} disabled={loading}>
            <FontAwesome6 name="xmark" size={14} color="#1E3A44" />
          </TouchableOpacity>

          <View style={styles.iconCircle}>
            <FontAwesome6 name="shield-halved" size={24} color="#FF9F43" />
          </View>

          <Text style={styles.title}>Verifikasi OTP Aktivasi</Text>
          <Text style={styles.subtitle}>
            Kode verifikasi 6 digit telah dikirim ke{'\n'}
            <Text style={styles.emailText}>{email || 'email Anda'}</Text>
          </Text>

          {/* Error Alert Banner inside Modal Overlay */}
          {errorMsg ? (
            <View style={styles.errorBanner}>
              <FontAwesome6 name="triangle-exclamation" size={13} color="#EF4444" />
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          ) : null}

          {/* Dynamic OTP Expiration Countdown Timer */}
          {remainingSeconds !== null ? (
            <View style={[styles.timerBadge, remainingSeconds === 0 && styles.timerBadgeExpired]}>
              <FontAwesome6
                name="clock"
                size={12}
                color={remainingSeconds === 0 ? '#EF4444' : '#6366F1'}
              />
              <Text style={[styles.timerText, remainingSeconds === 0 && styles.timerTextExpired]}>
                {remainingSeconds > 0
                  ? `Berlaku: ${formatTimer(remainingSeconds)}`
                  : 'OTP Kedaluwarsa. Silakan Kirim Ulang.'}
              </Text>
            </View>
          ) : null}

          {/* Dynamic OTP Hint Badge (Development Mock Only) */}
          {sampleOtpCode ? (
            <View style={styles.simOtpBadge}>
              <FontAwesome6 name="key" size={12} color="#FF9F43" />
              <Text style={styles.simOtpText}>
                Kode OTP Anda: <Text style={styles.simOtpCodeText}>{sampleOtpCode}</Text>
              </Text>
            </View>
          ) : null}

          {/* 6 Digit Input Row with Auto-Focus */}
          <View style={styles.otpRow}>
            {otp.map((digit, idx) => (
              <TextInput
                key={idx}
                ref={(ref) => {
                  inputsRef.current[idx] = ref;
                }}
                style={[
                  styles.otpInput,
                  digit ? styles.otpInputActive : null,
                  remainingSeconds === 0 ? styles.otpInputDisabled : null,
                ]}
                keyboardType="number-pad"
                maxLength={1}
                value={digit}
                editable={!loading && remainingSeconds !== 0}
                onChangeText={(text) => handleChangeText(text, idx)}
                onKeyPress={(e) => handleKeyPress(e, idx)}
              />
            ))}
          </View>

          <TouchableOpacity
            onPress={handleVerify}
            style={[
              styles.verifyBtn,
              (loading || remainingSeconds === 0) ? styles.verifyBtnDisabled : null,
            ]}
            disabled={loading || remainingSeconds === 0}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#1E3A44" />
            ) : (
              <Text style={styles.verifyBtnText}>Konfirmasi Verifikasi</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={onResendOtp} style={styles.resendBtn} disabled={loading}>
            <Text style={styles.resendText}>
              Tidak menerima kode? <Text style={styles.resendHighlight}>Kirim Ulang OTP</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 32,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F4F6F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFF2E5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E3A44',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 12,
    color: '#8C9A9E',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 10,
  },
  emailText: {
    color: '#1E3A44',
    fontWeight: '700',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    width: '100%',
    marginBottom: 12,
  },
  errorText: {
    fontSize: 12,
    color: '#DC2626',
    fontWeight: '700',
    flex: 1,
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#C7D2FE',
    marginBottom: 16,
  },
  timerBadgeExpired: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
  },
  timerText: {
    fontSize: 12,
    color: '#4338CA',
    fontWeight: '700',
  },
  timerTextExpired: {
    color: '#DC2626',
  },
  simOtpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFF2E5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFE0C2',
    marginBottom: 16,
  },
  simOtpText: {
    fontSize: 12,
    color: '#1E3A44',
    fontWeight: '600',
  },
  simOtpCodeText: {
    color: '#FF9F43',
    fontWeight: '900',
    letterSpacing: 1,
  },
  otpRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    marginBottom: 20,
  },
  otpInput: {
    width: 44,
    height: 50,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#F4F6F6',
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '800',
    color: '#1E3A44',
  },
  otpInputActive: {
    borderColor: '#FF9F43',
    backgroundColor: '#FFFFFF',
  },
  otpInputDisabled: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
    color: '#9CA3AF',
  },
  verifyBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 9999,
    backgroundColor: '#FF9F43',
    alignItems: 'center',
    shadowColor: '#FF9F43',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
    marginBottom: 14,
  },
  verifyBtnDisabled: {
    opacity: 0.5,
    backgroundColor: '#CBD5E1',
  },
  verifyBtnText: {
    color: '#1E3A44',
    fontWeight: '800',
    fontSize: 14,
  },
  resendBtn: {
    paddingVertical: 4,
  },
  resendText: {
    fontSize: 11,
    color: '#8C9A9E',
  },
  resendHighlight: {
    color: '#FF9F43',
    fontWeight: '700',
  },
});
