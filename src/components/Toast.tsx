import React, { useEffect, useState, useRef } from 'react';
import { Text, StyleSheet, Animated } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  message: string | null;
  type?: ToastType;
  onHide?: () => void;
}

const detectToastType = (msg: string): ToastType => {
  const lower = msg.toLowerCase();
  if (
    lower.includes('gagal') ||
    lower.includes('salah') ||
    lower.includes('error') ||
    lower.includes('tidak cocok') ||
    lower.includes('kedaluwarsa') ||
    lower.includes('dinonaktifkan')
  ) {
    return 'error';
  }
  if (
    lower.includes('harap') ||
    lower.includes('wajib') ||
    lower.includes('silakan') ||
    lower.includes('perlu') ||
    lower.includes('dibatalkan') ||
    lower.includes('belum') ||
    lower.includes('tidak')
  ) {
    return 'warning';
  }
  if (
    lower.includes('berhasil') ||
    lower.includes('sukses') ||
    lower.includes('diaktifkan') ||
    lower.includes('tersimpan')
  ) {
    return 'success';
  }
  return 'info';
};

export const Toast: React.FC<ToastProps> = ({ message, type, onHide }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    if (message) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.spring(translateYAnim, {
          toValue: 0,
          speed: 14,
          bounciness: 6,
          useNativeDriver: true,
        }),
      ]).start();

      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 250,
            useNativeDriver: true,
          }),
          Animated.timing(translateYAnim, {
            toValue: -20,
            duration: 250,
            useNativeDriver: true,
          }),
        ]).start(() => {
          if (onHide) onHide();
        });
      }, 3200);

      return () => clearTimeout(timer);
    }
  }, [message]);

  if (!message) return null;

  const activeType = type || detectToastType(message);

  let bgColor = '#10B981'; // Green
  let iconName = 'circle-check';

  if (activeType === 'error') {
    bgColor = '#EF4444'; // Red
    iconName = 'circle-xmark';
  } else if (activeType === 'warning') {
    bgColor = '#F59E0B'; // Amber Orange
    iconName = 'triangle-exclamation';
  } else if (activeType === 'info') {
    bgColor = '#1E3A44'; // Dark Blue / Slate
    iconName = 'circle-info';
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: bgColor,
          opacity: fadeAnim,
          transform: [{ translateY: translateYAnim }],
        },
      ]}
    >
      <FontAwesome6 name={iconName} size={15} color="#FFFFFF" style={styles.icon} />
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 54,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    zIndex: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
    maxWidth: '90%',
    gap: 10,
  },
  icon: {
    marginRight: 2,
  },
  text: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
    textAlign: 'left',
    flexShrink: 1,
  },
});
