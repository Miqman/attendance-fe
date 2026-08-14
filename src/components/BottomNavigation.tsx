import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { FontAwesome6 } from '@expo/vector-icons';

interface BottomNavigationProps {
  onOpenCamera: () => void;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({ onOpenCamera }) => {
  const router = useRouter();
  const pathname = usePathname();

  const isHome = pathname === '/' || pathname === '/index';
  const isHistory = pathname === '/history';
  const isReport = pathname === '/report';
  const isProfile = pathname === '/profile';

  return (
    <View style={styles.navWrapper}>
      <View style={styles.navContainer}>
        {/* Beranda */}
        <TouchableOpacity onPress={() => router.push('/')} style={styles.navItem}>
          <FontAwesome6 name="house" size={16} color={isHome ? '#FF9F43' : '#8C9A9E'} />
          <Text style={[styles.navText, isHome && styles.activeText]}>Beranda</Text>
        </TouchableOpacity>

        {/* Riwayat */}
        <TouchableOpacity onPress={() => router.push('/history')} style={styles.navItem}>
          <FontAwesome6 name="calendar-days" size={16} color={isHistory ? '#FF9F43' : '#8C9A9E'} />
          <Text style={[styles.navText, isHistory && styles.activeText]}>Riwayat</Text>
        </TouchableOpacity>

        {/* Center Prominent FAB Button */}
        <TouchableOpacity onPress={onOpenCamera} style={styles.fabBtn}>
          <FontAwesome6 name="plus" size={18} color="#1E3A44" />
        </TouchableOpacity>

        {/* Laporan */}
        <TouchableOpacity onPress={() => router.push('/report')} style={styles.navItem}>
          <FontAwesome6 name="chart-pie" size={16} color={isReport ? '#FF9F43' : '#8C9A9E'} />
          <Text style={[styles.navText, isReport && styles.activeText]}>Laporan</Text>
        </TouchableOpacity>

        {/* Profil */}
        <TouchableOpacity onPress={() => router.push('/profile')} style={styles.navItem}>
          <FontAwesome6 name="user" size={16} color={isProfile ? '#FF9F43' : '#8C9A9E'} />
          <Text style={[styles.navText, isProfile && styles.activeText]}>Profil</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  navWrapper: {
    position: 'absolute',
    bottom: 16,
    left: 12,
    right: 12,
    alignItems: 'center',
    zIndex: 100,
  },
  navContainer: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 9999,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    shadowColor: '#1E3A44',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  navItem: {
    alignItems: 'center',
    gap: 3,
    flex: 1,
  },
  navText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#8C9A9E',
  },
  activeText: {
    color: '#FF9F43',
    fontWeight: '800',
  },
  fabBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FF9F43',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -26,
    shadowColor: '#FF9F43',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 10,
    borderWidth: 4,
    borderColor: '#F4F6F6',
  },
});
