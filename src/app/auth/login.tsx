import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { FontAwesome6 } from '@expo/vector-icons';
import { OTPModal } from '@/components/OTPModal';
import { Toast } from '@/components/Toast';
import { api } from '@/services/api';
import { useAuthStore } from '@/services/authStore';
import { biometricService, BiometricStatus, BiometricType } from '@/services/biometricService';

export default function LoginScreen() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [email, setEmail] = useState('dame9401@gmail.com');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [otpVisible, setOtpVisible] = useState(false);
  const [sampleOtpCode, setSampleOtpCode] = useState<string | undefined>(undefined);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpExpiresAt, setOtpExpiresAt] = useState<string | null>(null);
  const [modalErrorMsg, setModalErrorMsg] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [bioStatus, setBioStatus] = useState<BiometricStatus | null>(null);

  useEffect(() => {
    (async () => {
      const status = await biometricService.getBiometricStatus();
      setBioStatus(status);
    })();
  }, []);

  const handleLoginSubmit = async () => {
    if (!email || !password) {
      setToastMsg('Harap isi email dan kata sandi!');
      return;
    }

    setLoading(true);
    setModalErrorMsg(null);
    const res = await api.login(email, password);
    setLoading(false);

    if (res.requiresOtp) {
      setOtpExpiresAt(res.expiresAt || null);
      setToastMsg(`Kode OTP verifikasi telah dikirim ke email ${email}`);
      setOtpVisible(true);
      return;
    }

    if (res.token && res.user) {
      setAuth(res.token, res.user, res.refreshToken);
      setToastMsg('Login Berhasil! Mengarahkan...');
      setTimeout(() => router.replace('/'), 1000);
    } else {
      setToastMsg(res.error || 'Login gagal');
    }
  };

  const handleResendOtp = async () => {
    setOtpLoading(true);
    setModalErrorMsg(null);
    const res = await api.sendOtp(email);
    setOtpLoading(false);
    if (res.success) {
      setOtpExpiresAt(res.expiresAt || null);
      setToastMsg(`Kode OTP baru dikirim ke email ${email}`);
    } else {
      setModalErrorMsg(res.error || 'Gagal mengirim kode OTP baru');
    }
  };

  const handleOtpSuccess = async (otpCode: string) => {
    if (!otpCode || otpCode.length < 6) {
      setModalErrorMsg('Harap lengkapi 6 digit kode OTP!');
      return;
    }

    setOtpLoading(true);
    setModalErrorMsg(null);
    const verifyRes = await api.verifyOtp(email, otpCode);

    if (verifyRes.success) {
      const loginRes = await api.login(email, password);
      setOtpLoading(false);

      if (loginRes.token && loginRes.user) {
        setOtpVisible(false);
        setAuth(loginRes.token, loginRes.user, loginRes.refreshToken);
        setToastMsg('Aktivasi Berhasil! Mengarahkan ke Dashboard...');
        setTimeout(() => router.replace('/'), 1000);
      } else {
        setModalErrorMsg('Gagal masuk setelah verifikasi OTP');
      }
    } else {
      setOtpLoading(false);
      setModalErrorMsg(verifyRes.error || 'Kode OTP tidak valid, silakan periksa email Anda');
    }
  };

  const handleBiometricLogin = async () => {
    const status = bioStatus || (await biometricService.getBiometricStatus());

    if (!status.isSupported) {
      setToastMsg('Perangkat Anda tidak memiliki sensor biometrik (FaceID/Fingerprint)');
      return;
    }

    if (!status.isEnrolled) {
      setToastMsg('Silakan aktifkan Kunci Layar / FaceID / Fingerprint di HP Anda');
      return;
    }

    const { refreshToken, biometricRefreshToken } = useAuthStore.getState();
    const tokenToUse = biometricRefreshToken || refreshToken;

    if (!tokenToUse) {
      setToastMsg('Sesi biometrik tidak ditemukan. Silakan masuk 1 kali menggunakan Email & Kata Sandi di HP ini terlebih dahulu.');
      return;
    }

    const bioResult = await biometricService.authenticate(`Masuk via ${status.label}`);

    if (!bioResult.success) {
      if (bioResult.error && bioResult.error !== 'Autentikasi biometrik dibatalkan') {
        setToastMsg(bioResult.error);
      }
      return;
    }

    setLoading(true);

    const refreshRes = await api.refreshToken(tokenToUse);
    setLoading(false);

    if (refreshRes.success && refreshRes.token && refreshRes.user) {
      setAuth(refreshRes.token, refreshRes.user, refreshRes.refreshToken);
      setToastMsg(`Autentikasi ${status.label} Berhasil! Mengarahkan...`);
      setTimeout(() => router.replace('/'), 800);
    } else {
      setToastMsg(refreshRes.error || 'Sesi biometrik telah kedaluwarsa atau akun tidak aktif. Silakan masuk dengan Email dan Kata Sandi.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Toast message={toastMsg} onHide={() => setToastMsg(null)} />

      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {/* Header Section */}
        <View style={styles.headerBox}>
          <View style={styles.logoBadge}>
            <FontAwesome6 name="clock" size={32} color="#1E3A44" />
          </View>
          <Text style={styles.appTitle}>Absensi Modern</Text>
          <Text style={styles.appSubtitle}>Masuk ke Akun Karyawan Anda</Text>
        </View>

        {/* Card Form */}
        <View style={styles.loginCard}>
          <Text style={styles.cardHeaderTitle}>Masuk Akun</Text>

          {/* Email Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Karyawan</Text>
            <View style={styles.inputWrapper}>
              <FontAwesome6 name="envelope" size={16} color="#8C9A9E" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="nama@company.com"
                placeholderTextColor="#A0AEC0"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>
          </View>

          {/* Password Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Kata Sandi</Text>
            <View style={styles.inputWrapper}>
              <FontAwesome6 name="lock" size={16} color="#8C9A9E" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor="#A0AEC0"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity onPress={handleLoginSubmit} style={styles.submitBtn} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#1E3A44" size="small" />
            ) : (
              <>
                <Text style={styles.submitBtnText}>Masuk Sekarang</Text>
                <FontAwesome6 name="arrow-right" size={14} color="#1E3A44" />
              </>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>ATAU</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Biometric Login */}
          <TouchableOpacity onPress={handleBiometricLogin} style={styles.biometricBtn} disabled={loading}>
            <FontAwesome6
              name={
                bioStatus?.biometricType === BiometricType.FINGERPRINT
                  ? 'fingerprint'
                  : bioStatus?.biometricType === BiometricType.FACE_ID
                  ? 'face-smile'
                  : 'fingerprint'
              }
              size={16}
              color="#FF9F43"
            />
            <Text style={styles.biometricBtnText}>
              Masuk via {bioStatus?.label || 'Biometrik (FaceID / Sidik Jari)'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Footer Info */}
        <Text style={styles.footerInfo}>
          Aktivasi pertama kali memerlukan kode OTP 6 digit.{'\n'}
          Versi Aplikasi 1.0.0 • Tim IT Perusahaan
        </Text>
      </ScrollView>

      {/* OTP Modal */}
      <OTPModal
        visible={otpVisible}
        email={email}
        loading={otpLoading}
        expiresAt={otpExpiresAt}
        errorMsg={modalErrorMsg}
        sampleOtpCode={sampleOtpCode}
        onClose={() => {
          setOtpVisible(false);
          setModalErrorMsg(null);
        }}
        onVerifySuccess={handleOtpSuccess}
        onResendOtp={handleResendOtp}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#1E3A44',
  },
  container: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100%',
  },
  headerBox: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: 24,
    backgroundColor: '#FF9F43',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#FF9F43',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  appTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  appSubtitle: {
    fontSize: 12,
    color: '#8C9A9E',
    textAlign: 'center',
  },
  loginCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 32,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
    marginBottom: 24,
  },
  cardHeaderTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E3A44',
    marginBottom: 4,
  },
  cardHeaderSubtitle: {
    fontSize: 12,
    color: '#8C9A9E',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 10,
    fontWeight: '800',
    color: '#8C9A9E',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F4F6F6',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 13,
    color: '#1E3A44',
    fontWeight: '600',
  },
  submitBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 9999,
    backgroundColor: '#FF9F43',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#FF9F43',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
    marginTop: 8,
    marginBottom: 16,
  },
  submitBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E3A44',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  dividerText: {
    fontSize: 11,
    color: '#8C9A9E',
    fontWeight: '600',
  },
  biometricBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: '#FFF2E5',
    borderWidth: 1,
    borderColor: '#FFE0C2',
  },
  biometricBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E3A44',
  },
  footerInfo: {
    fontSize: 11,
    color: '#8C9A9E',
    textAlign: 'center',
  },
});
