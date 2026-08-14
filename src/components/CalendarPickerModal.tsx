import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';

interface CalendarPickerModalProps {
  visible: boolean;
  onClose: () => void;
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
}

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const DAY_NAMES = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

export const CalendarPickerModal: React.FC<CalendarPickerModalProps> = ({
  visible,
  onClose,
  selectedDate,
  onSelectDate,
}) => {
  const [viewDate, setViewDate] = React.useState(new Date(selectedDate));

  React.useEffect(() => {
    setViewDate(new Date(selectedDate));
  }, [selectedDate, visible]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  // First day of month (0-6, Sun-Sat)
  const firstDayIndex = new Date(year, month, 1).getDay();
  // Total days in current month
  const totalDays = new Date(year, month + 1, 0).getDate();

  const handlePrevMonth = () => {
    setViewDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(year, month + 1, 1));
  };

  const handleDateClick = (dayNum: number) => {
    const newSelected = new Date(year, month, dayNum);
    onSelectDate(newSelected);
    onClose();
  };

  // Build grid items (padding empty cells + day numbers)
  const gridCells = [];
  for (let i = 0; i < firstDayIndex; i++) {
    gridCells.push(null);
  }
  for (let d = 1; d <= totalDays; d++) {
    gridCells.push(d);
  }

  const isToday = (d: number) => {
    const today = new Date();
    return (
      today.getDate() === d &&
      today.getMonth() === month &&
      today.getFullYear() === year
    );
  };

  const isCurrentSelected = (d: number) => {
    return (
      selectedDate.getDate() === d &&
      selectedDate.getMonth() === month &&
      selectedDate.getFullYear() === year
    );
  };

  return (
    <Modal visible={visible} animationType="fade" transparent={true} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.monthNav}>
              <TouchableOpacity onPress={handlePrevMonth} style={styles.navBtn}>
                <FontAwesome6 name="chevron-left" size={14} color="#CBD5E1" />
              </TouchableOpacity>
              <Text style={styles.monthTitle}>
                {MONTH_NAMES[month]} {year}
              </Text>
              <TouchableOpacity onPress={handleNextMonth} style={styles.navBtn}>
                <FontAwesome6 name="chevron-right" size={14} color="#CBD5E1" />
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <FontAwesome6 name="xmark" size={14} color="#8C9A9E" />
            </TouchableOpacity>
          </View>

          {/* Days Header Row (Min - Sab) */}
          <View style={styles.daysHeaderRow}>
            {DAY_NAMES.map((day, idx) => (
              <Text key={day} style={[styles.dayHeaderCell, (idx === 0 || idx === 6) && styles.weekendHeaderCell]}>
                {day}
              </Text>
            ))}
          </View>

          {/* 7 Columns Month Days Grid */}
          <View style={styles.gridContainer}>
            {gridCells.map((cell, idx) => {
              if (cell === null) {
                return <View key={`empty-${idx}`} style={styles.gridCellEmpty} />;
              }

              const selected = isCurrentSelected(cell);
              const today = isToday(cell);

              return (
                <TouchableOpacity
                  key={`day-${cell}`}
                  onPress={() => handleDateClick(cell)}
                  style={[
                    styles.gridCell,
                    selected && styles.gridCellSelected,
                    today && !selected && styles.gridCellToday,
                  ]}
                >
                  <Text
                    style={[
                      styles.gridCellText,
                      selected && styles.gridCellTextSelected,
                      today && !selected && styles.gridCellTextToday,
                    ]}
                  >
                    {cell}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Legend & Action Footer */}
          <View style={styles.footer}>
            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#FF9F43' }]} />
                <Text style={styles.legendText}>Terpilih</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
                <Text style={styles.legendText}>Hari Ini</Text>
              </View>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeModalBtn}>
              <Text style={styles.closeModalBtnText}>Selesai</Text>
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
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  container: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 32,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    backgroundColor: '#1E3A44',
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  navBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#152B33',
    alignItems: 'center',
    justifyContent: 'center',
  },
  daysHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#F4F6F6',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  dayHeaderCell: {
    flex: 1,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '800',
    color: '#1E3A44',
  },
  weekendHeaderCell: {
    color: '#F43F5E',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
  },
  gridCellEmpty: {
    width: '14.28%',
    height: 44,
  },
  gridCell: {
    width: '14.28%',
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    marginVertical: 2,
  },
  gridCellSelected: {
    backgroundColor: '#FF9F43',
    shadowColor: '#FF9F43',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  gridCellToday: {
    borderWidth: 2,
    borderColor: '#10B981',
    backgroundColor: '#ECFDF5',
  },
  gridCellText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E3A44',
  },
  gridCellTextSelected: {
    color: '#1E3A44',
    fontWeight: '900',
  },
  gridCellTextToday: {
    color: '#059669',
    fontWeight: '900',
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
    color: '#8C9A9E',
    fontWeight: '600',
  },
  closeModalBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 9999,
    backgroundColor: '#1E3A44',
  },
  closeModalBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
});
