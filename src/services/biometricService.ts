import * as LocalAuthentication from 'expo-local-authentication';

export enum BiometricType {
  NONE = 'NONE',
  FACE_ID = 'FACE_ID',
  FINGERPRINT = 'FINGERPRINT',
  IRIS = 'IRIS',
  MULTIPLE = 'MULTIPLE',
}

export interface BiometricStatus {
  isSupported: boolean;
  isEnrolled: boolean;
  biometricType: BiometricType;
  label: string;
}

export const biometricService = {
  /**
   * Check hardware availability and enrolled biometric types.
   */
  async getBiometricStatus(): Promise<BiometricStatus> {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      if (!hasHardware) {
        return {
          isSupported: false,
          isEnrolled: false,
          biometricType: BiometricType.NONE,
          label: 'Biometrik Tidak Didukung',
        };
      }

      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();

      let biometricType = BiometricType.FINGERPRINT;
      let label = 'Sidik Jari (Fingerprint)';

      const hasFaceId = types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION);
      const hasFingerprint = types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT);
      const hasIris = types.includes(LocalAuthentication.AuthenticationType.IRIS);

      if (hasFaceId && hasFingerprint) {
        biometricType = BiometricType.MULTIPLE;
        label = 'Biometrik (FaceID / Fingerprint)';
      } else if (hasFaceId) {
        biometricType = BiometricType.FACE_ID;
        label = 'Face ID';
      } else if (hasFingerprint) {
        biometricType = BiometricType.FINGERPRINT;
        label = 'Sidik Jari (Fingerprint)';
      } else if (hasIris) {
        biometricType = BiometricType.IRIS;
        label = 'Iris Scan';
      }

      return {
        isSupported: true,
        isEnrolled,
        biometricType,
        label,
      };
    } catch {
      return {
        isSupported: false,
        isEnrolled: false,
        biometricType: BiometricType.NONE,
        label: 'Biometrik',
      };
    }
  },

  /**
   * Trigger native biometric prompt.
   */
  async authenticate(promptMessage: string = 'Verifikasi Biometrik untuk Masuk Perusahaan'): Promise<{ success: boolean; error?: string }> {
    try {
      const status = await this.getBiometricStatus();
      if (!status.isSupported) {
        return { success: false, error: 'Perangkat Anda tidak memiliki sensor biometrik' };
      }

      if (!status.isEnrolled) {
        return { success: false, error: 'Silakan atur FaceID / Sidik Jari di HP Anda terlebih dahulu' };
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage,
        cancelLabel: 'Batal',
        fallbackLabel: 'Gunakan Kata Sandi',
        disableDeviceFallback: false,
      });

      if (result.success) {
        return { success: true };
      } else {
        if (result.error === 'user_cancel' || result.error === 'app_cancel') {
          return { success: false, error: 'Autentikasi biometrik dibatalkan' };
        }
        return { success: false, error: 'Verifikasi biometrik tidak cocok' };
      }
    } catch (error: any) {
      return { success: false, error: error?.message || 'Gagal melakukan verifikasi biometrik' };
    }
  },
};
