import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

interface CouponModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (code: string) => Promise<boolean>;
  appliedCoupon?: string | null;
}

export const CartCouponModal: React.FC<CouponModalProps> = ({
  visible,
  onClose,
  onApply,
  appliedCoupon,
}) => {
  const [couponCode, setCouponCode] = useState('');
  const [isApplying, setIsApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);
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

  const handleApply = async () => {
    if (!couponCode.trim()) {
      setError('Lütfen bir kupon kodu girin');
      return;
    }

    setIsApplying(true);
    setError(null);

    try {
      const success = await onApply(couponCode.toUpperCase());
      if (success) {
        setCouponCode('');
        onClose();
      } else {
        setError('Geçersiz kupon kodu');
      }
    } catch (err) {
      setError('Kupon uygulanırken bir hata oluştu');
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
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
              <Ionicons name="pricetag" size={24} color="#0B3E25" />
              <Text style={styles.modalTitle}>Kupon Kodu</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          {appliedCoupon && (
            <View style={styles.appliedCouponContainer}>
              <LinearGradient
                colors={['#d1fae5', '#a7f3d0']}
                style={styles.appliedCouponGradient}
              >
                <Ionicons name="checkmark-circle" size={20} color="#0f3a1a" />
                <Text style={styles.appliedCouponText}>
                  Uygulanan: {appliedCoupon}
                </Text>
              </LinearGradient>
            </View>
          )}

          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <Ionicons name="ticket-outline" size={20} color="#6b7280" />
              <TextInput
                style={styles.input}
                placeholder="Kupon kodunu girin"
                placeholderTextColor="#9ca3af"
                value={couponCode}
                onChangeText={(text) => {
                  setCouponCode(text);
                  setError(null);
                }}
                autoCapitalize="characters"
                autoCorrect={false}
                maxLength={20}
              />
            </View>
            {error && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={16} color="#ef4444" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={styles.applyButton}
            onPress={handleApply}
            disabled={isApplying || !couponCode.trim()}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={!couponCode.trim() ? ['#9ca3af', '#6b7280'] : ['#0B3E25', '#0f3a1a']}
              style={styles.applyButtonGradient}
            >
              {isApplying ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                  <Text style={styles.applyButtonText}>Kuponu Uygula</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.examplesContainer}>
            <Text style={styles.examplesTitle}>Popüler Kuponlar:</Text>
            <View style={styles.examplesList}>
              <TouchableOpacity
                style={styles.exampleChip}
                onPress={() => setCouponCode('YENI50')}
              >
                <Text style={styles.exampleChipText}>YENI50</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.exampleChip}
                onPress={() => setCouponCode('INDIRIM20')}
              >
                <Text style={styles.exampleChipText}>INDIRIM20</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.exampleChip}
                onPress={() => setCouponCode('HOSGELDIN')}
              >
                <Text style={styles.exampleChipText}>HOSGELDIN</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
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
  appliedCouponContainer: {
    marginBottom: 16,
  },
  appliedCouponGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  appliedCouponText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f3a1a',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1f2937',
    paddingVertical: 12,
    marginLeft: 12,
    fontWeight: '600',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
    fontWeight: '500',
  },
  applyButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 24,
  },
  applyButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  examplesContainer: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  examplesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 12,
  },
  examplesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  exampleChip: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  exampleChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0B3E25',
  },
});
