import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Animated,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

interface GiftWrapOption {
  id: string;
  name: string;
  price: number;
  icon: string;
  color: string;
}

interface GiftWrapModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (option: GiftWrapOption | null, message?: string) => void;
  selectedOption?: GiftWrapOption | null;
}

const GIFT_OPTIONS: GiftWrapOption[] = [
  { id: 'none', name: 'Hediye Paketi Yok', price: 0, icon: 'close-circle', color: '#9ca3af' },
  { id: 'basic', name: 'Standart Paket', price: 5, icon: 'gift', color: '#3b82f6' },
  { id: 'premium', name: 'Premium Paket', price: 10, icon: 'gift-sharp', color: '#F4A51C' },
  { id: 'deluxe', name: 'Lüks Paket', price: 15, icon: 'ribbon', color: '#ef4444' },
];

export const CartGiftWrapModal: React.FC<GiftWrapModalProps> = ({
  visible,
  onClose,
  onSelect,
  selectedOption,
}) => {
  const [selected, setSelected] = useState<GiftWrapOption | null>(selectedOption || null);
  const [giftMessage, setGiftMessage] = useState('');
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

  const handleConfirm = () => {
    onSelect(selected, giftMessage);
    onClose();
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
              <Ionicons name="gift-outline" size={24} color="#0B3E25" />
              <Text style={styles.modalTitle}>Hediye Paketi</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            <View style={styles.optionsContainer}>
              {GIFT_OPTIONS.map((option) => {
                const isSelected = selected?.id === option.id;
                
                return (
                  <TouchableOpacity
                    key={option.id}
                    style={[
                      styles.optionCard,
                      isSelected && styles.optionCardSelected,
                    ]}
                    onPress={() => setSelected(option)}
                    activeOpacity={0.7}
                  >
                    {isSelected && (
                      <LinearGradient
                        colors={['#0B3E25', '#0f3a1a']}
                        style={StyleSheet.absoluteFill}
                      />
                    )}
                    
                    <View style={styles.optionContent}>
                      <View
                        style={[
                          styles.optionIcon,
                          { backgroundColor: isSelected ? 'rgba(255,255,255,0.2)' : `${option.color}20` },
                        ]}
                      >
                        <Ionicons
                          name={option.icon as any}
                          size={28}
                          color={isSelected ? '#fff' : option.color}
                        />
                      </View>
                      
                      <View style={styles.optionInfo}>
                        <Text
                          style={[
                            styles.optionName,
                            isSelected && styles.optionNameSelected,
                          ]}
                        >
                          {option.name}
                        </Text>
                        <Text
                          style={[
                            styles.optionPrice,
                            isSelected && styles.optionPriceSelected,
                          ]}
                        >
                          {option.price === 0 ? 'Ücretsiz' : `+${option.price.toFixed(2)} TL`}
                        </Text>
                      </View>
                      
                      {isSelected && (
                        <View style={styles.selectedBadge}>
                          <Ionicons name="checkmark-circle" size={24} color="#fff" />
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {selected && selected.id !== 'none' && (
              <View style={styles.messageContainer}>
                <Text style={styles.messageLabel}>Hediye Mesajı (Opsiyonel)</Text>
                <View style={styles.messageInputWrapper}>
                  <TextInput
                    style={styles.messageInput}
                    placeholder="Hediye mesajınızı yazın..."
                    placeholderTextColor="#9ca3af"
                    value={giftMessage}
                    onChangeText={setGiftMessage}
                    multiline
                    maxLength={200}
                    textAlignVertical="top"
                  />
                </View>
                <Text style={styles.characterCount}>
                  {giftMessage.length}/200
                </Text>
              </View>
            )}
          </ScrollView>

          <TouchableOpacity
            style={styles.confirmButton}
            onPress={handleConfirm}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#0B3E25', '#0f3a1a']}
              style={styles.confirmButtonGradient}
            >
              <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
              <Text style={styles.confirmButtonText}>Onayla</Text>
              {selected && selected.price > 0 && (
                <Text style={styles.confirmButtonPrice}>
                  (+{selected.price.toFixed(2)} TL)
                </Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
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
  scrollContent: {
    paddingBottom: 20,
  },
  optionsContainer: {
    gap: 12,
  },
  optionCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
  },
  optionCardSelected: {
    borderColor: '#0B3E25',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optionInfo: {
    flex: 1,
  },
  optionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  optionNameSelected: {
    color: '#fff',
  },
  optionPrice: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  optionPriceSelected: {
    color: '#fff',
    opacity: 0.9,
  },
  selectedBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
  },
  messageContainer: {
    marginTop: 24,
  },
  messageLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  messageInputWrapper: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    padding: 12,
  },
  messageInput: {
    fontSize: 14,
    color: '#1f2937',
    minHeight: 80,
    maxHeight: 120,
  },
  characterCount: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'right',
    marginTop: 4,
  },
  confirmButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 20,
  },
  confirmButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  confirmButtonPrice: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
  },
});
