import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  PanResponder,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = -80;

interface SwipeableItemProps {
  children: React.ReactNode;
  onDelete: () => void;
  onFavorite?: () => void;
  isFavorite?: boolean;
}

export const CartSwipeableItem: React.FC<SwipeableItemProps> = ({
  children,
  onDelete,
  onFavorite,
  isFavorite = false,
}) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const lastOffset = useRef(0);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 5;
      },
      onPanResponderGrant: () => {
        translateX.setOffset(lastOffset.current);
        translateX.setValue(0);
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dx < 0) {
          translateX.setValue(gestureState.dx);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        translateX.flattenOffset();
        
        if (gestureState.dx < SWIPE_THRESHOLD) {
          // Swipe to reveal actions
          Animated.spring(translateX, {
            toValue: -160,
            useNativeDriver: true,
            tension: 50,
            friction: 7,
          }).start();
          lastOffset.current = -160;
        } else {
          // Return to original position
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            tension: 50,
            friction: 7,
          }).start();
          lastOffset.current = 0;
        }
      },
    })
  ).current;

  const handleDelete = () => {
    Animated.timing(translateX, {
      toValue: -SCREEN_WIDTH,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      onDelete();
    });
  };

  const handleFavorite = () => {
    if (onFavorite) {
      onFavorite();
      // Return to original position
      Animated.spring(translateX, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }).start();
      lastOffset.current = 0;
    }
  };

  return (
    <View style={styles.container}>
      {/* Background actions */}
      <View style={styles.actionsContainer}>
        {onFavorite && (
          <TouchableOpacity
            style={styles.favoriteAction}
            onPress={handleFavorite}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#F4A51C', '#f59e0b']}
              style={styles.actionGradient}
            >
              <Ionicons
                name={isFavorite ? 'heart' : 'heart-outline'}
                size={24}
                color="#fff"
              />
            </LinearGradient>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity
          style={styles.deleteAction}
          onPress={handleDelete}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#ef4444', '#dc2626']}
            style={styles.actionGradient}
          >
            <Ionicons name="trash-outline" size={24} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Swipeable content */}
      <Animated.View
        style={[
          styles.swipeableContent,
          {
            transform: [{ translateX }],
          },
        ]}
        {...panResponder.panHandlers}
      >
        {children}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
  },
  actionsContainer: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 8,
  },
  favoriteAction: {
    width: 72,
    height: '90%',
    borderRadius: 12,
    overflow: 'hidden',
  },
  deleteAction: {
    width: 72,
    height: '90%',
    borderRadius: 12,
    overflow: 'hidden',
  },
  actionGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  swipeableContent: {
    backgroundColor: 'transparent',
  },
});
