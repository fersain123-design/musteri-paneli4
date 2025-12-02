import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Animated,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

interface DeliveryTimeSlot {
  id: string;
  date: string;
  time: string;
  available: boolean;
  express?: boolean;
}

interface DeliveryTimeModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (slot: DeliveryTimeSlot) => void;
  selectedSlot?: DeliveryTimeSlot | null;
}

export const CartDeliveryTimeModal: React.FC<DeliveryTimeModalProps> = ({
  visible,
  onClose,
  onSelect,
  selectedSlot,
}) => {
  const slideAnim = React.useRef(new Animated.Value(300)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }).start();
    } else {
      slideAnim.setValue(300);
    }
  }, [visible]);

  // Generate time slots
  const getTimeSlots = (): DeliveryTimeSlot[] => {
    const slots: DeliveryTimeSlot[] = [];
    const today = new Date();
    
    for (let day = 0; day < 3; day++) {
      const date = new Date(today);
      date.setDate(date.getDate() + day);
      
      const dayName = day === 0 ? 'Bugün' : day === 1 ? 'Yarın' : 'İki Gün Sonra';
      const dateStr = `${date.getDate()}/${date.getMonth() + 1}`;
      
      // Morning slots
      if (day > 0 || today.getHours() < 10) {
        slots.push({
          id: `${day}-morning`,
          date: `${dayName} (${dateStr})`,
          time: '09:00 - 12:00',
          available: true,
          express: day === 0,
        });
      }
      
      // Afternoon slots
      if (day > 0 || today.getHours() < 14) {
        slots.push({
          id: `${day}-afternoon`,
          date: `${dayName} (${dateStr})`,
          time: '12:00 - 15:00',
          available: true,
          express: day === 0,
        });
      }
      
      // Evening slots
      if (day > 0 || today.getHours() < 18) {
        slots.push({
          id: `${day}-evening`,
          date: `${dayName} (${dateStr})`,
          time: '15:00 - 18:00',
          available: day === 0,
        });
      }
      
      // Night slots
      if (day > 0 || today.getHours() < 20) {
        slots.push({
          id: `${day}-night`,
          date: `${dayName} (${dateStr})`,
          time: '18:00 - 21:00',
          available: day < 2,
        });
      }
    }
    
    return slots;
  };

  const timeSlots = getTimeSlots();

  const handleSelectSlot = (slot: DeliveryTimeSlot) => {
    if (slot.available) {
      onSelect(slot);
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        >
          <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
        </TouchableOpacity>

        <Animated.View
          style={[
            styles.modalContent,
            {
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.modalHeader}>
            <View style={styles.handleBar} />
            <View style={styles.headerContent}>
              <Ionicons name="time-outline" size={24} color="#0B3E25" />
              <Text style={styles.modalTitle}>Teslimat Zamanı</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.slotsContainer}
          >
            {timeSlots.map((slot) => {
              const isSelected = selectedSlot?.id === slot.id;
              
              return (
                <TouchableOpacity
                  key={slot.id}
                  style={[
                    styles.slotCard,
                    !slot.available && styles.slotCardDisabled,
                    isSelected && styles.slotCardSelected,
                  ]}
                  onPress={() => handleSelectSlot(slot)}
                  disabled={!slot.available}
                  activeOpacity={0.7}
                >
                  {isSelected && (
                    <LinearGradient
                      colors={['#0B3E25', '#0f3a1a']}
                      style={StyleSheet.absoluteFill}
                    />
                  )}
                  
                  <View style={styles.slotContent}>
                    <View style={styles.slotLeft}>
                      <View style={styles.slotIcon}>
                        <Ionicons
                          name={slot.express ? 'flash' : 'calendar-outline'}
                          size={20}
                          color={isSelected ? '#fff' : slot.available ? '#0B3E25' : '#9ca3af'}
                        />
                      </View>
                      <View style={styles.slotInfo}>
                        <Text
                          style={[
                            styles.slotDate,
                            !slot.available && styles.slotDateDisabled,
                            isSelected && styles.slotDateSelected,
                          ]}
                        >
                          {slot.date}
                        </Text>
                        <Text
                          style={[
                            styles.slotTime,
                            !slot.available && styles.slotTimeDisabled,
                            isSelected && styles.slotTimeSelected,
                          ]}
                        >
                          {slot.time}
                        </Text>
                      </View>
                    </View>
                    
                    <View style={styles.slotRight}>
                      {slot.express && slot.available && !isSelected && (
                        <View style={styles.expressBadge}>
                          <Text style={styles.expressText}>Hızlı</Text>
                        </View>
                      )}
                      {!slot.available && (
                        <Text style={styles.unavailableText}>Dolu</Text>
                      )}
                      {isSelected && (
                        <View style={styles.selectedIcon}>
                          <Ionicons name="checkmark-circle" size={24} color="#fff" />
                        </View>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View style={styles.footer}>
            <View style={styles.infoBox}>
              <Ionicons name="information-circle-outline" size={16} color="#6b7280" />
              <Text style={styles.infoText}>
                Teslimat saatleri yoğunluğa göre değişiklik gösterebilir
              </Text>
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
  },
  modalHeader: {
    paddingTop: 12,
    paddingBottom: 20,
    alignItems: 'center',
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
    marginBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  closeButton: {
    position: 'absolute',
    right: 0,
    top: 12,
    padding: 8,
  },
  scrollView: {
    maxHeight: 400,
  },
  slotsContainer: {
    paddingBottom: 20,
  },
  slotCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
  },
  slotCardDisabled: {
    opacity: 0.5,
  },
  slotCardSelected: {
    borderColor: '#0B3E25',
  },
  slotContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  slotLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  slotIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  slotInfo: {
    flex: 1,
  },
  slotDate: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  slotDateDisabled: {
    color: '#9ca3af',
  },
  slotDateSelected: {
    color: '#fff',
  },
  slotTime: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
  },
  slotTimeDisabled: {
    color: '#9ca3af',
  },
  slotTimeSelected: {
    color: '#fff',
    opacity: 0.9,
  },
  slotRight: {
    alignItems: 'flex-end',
  },
  expressBadge: {
    backgroundColor: '#F4A51C',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  expressText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#fff',
  },
  unavailableText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9ca3af',
  },
  selectedIcon: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
  },
  footer: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 12,
  },
  infoText: {
    fontSize: 12,
    color: '#6b7280',
    flex: 1,
    fontWeight: '500',
  },
});
