import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
} from "react-native";
import { colors, spacing, radii } from "../theme";

const { width } = Dimensions.get("window");

export default function Notification({
  visible,
  type = "info",
  title,
  message,
  actions = [],
  duration = 4000,
  onClose,
}) {
  const slideAnim = useRef(new Animated.Value(-200)).current;
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (visible) {
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Slide in
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }).start();

      // Auto-dismiss if duration > 0
      if (duration > 0) {
        timeoutRef.current = setTimeout(() => {
          handleClose();
        }, duration);
      }
    } else {
      // Slide out
      Animated.timing(slideAnim, {
        toValue: -200,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [visible, duration]);

  const handleClose = () => {
    Animated.timing(slideAnim, {
      toValue: -200,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      onClose?.();
    });
  };

  if (!visible && slideAnim._value <= -200) {
    return null;
  }

  const getTypeConfig = () => {
    switch (type) {
      case "success":
        return { icon: "✅", color: colors.success };
      case "error":
        return { icon: "❌", color: colors.error };
      case "warning":
        return { icon: "⚠️", color: colors.warning };
      default:
        return { icon: "ℹ️", color: colors.info };
    }
  };

  const typeConfig = getTypeConfig();

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
          borderLeftColor: typeConfig.color,
        },
      ]}>
      <TouchableOpacity
        style={styles.content}
        activeOpacity={0.9}
        onPress={actions.length === 0 ? handleClose : undefined}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>{typeConfig.icon}</Text>
        </View>

        <View style={styles.textContainer}>
          {title ? <Text style={styles.title}>{title}</Text> : null}
          {message ? <Text style={styles.message}>{message}</Text> : null}

          {actions.length > 0 && (
            <View style={styles.actionsContainer}>
              {actions.map((action, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.actionButton,
                    action.style === "destructive" &&
                      styles.actionButtonDestructive,
                    action.style === "primary" && styles.actionButtonPrimary,
                  ]}
                  onPress={() => {
                    action.onPress?.();
                    if (action.style !== "cancel") {
                      handleClose();
                    }
                  }}>
                  <Text
                    style={[
                      styles.actionButtonText,
                      action.style === "destructive" &&
                        styles.actionButtonTextDestructive,
                      action.style === "primary" &&
                        styles.actionButtonTextPrimary,
                    ]}>
                    {action.text}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {actions.length === 0 && (
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 50,
    left: spacing.md,
    right: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radii.md,
    borderLeftWidth: 4,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
    zIndex: 9999,
  },
  content: {
    flexDirection: "row",
    padding: spacing.md,
    alignItems: "flex-start",
  },
  iconContainer: {
    marginRight: spacing.md,
  },
  icon: {
    fontSize: 24,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  message: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  closeButton: {
    padding: spacing.xs,
    marginLeft: spacing.sm,
  },
  closeButtonText: {
    fontSize: 18,
    color: colors.textMuted,
  },
  actionsContainer: {
    flexDirection: "row",
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  actionButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionButtonPrimary: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  actionButtonDestructive: {
    backgroundColor: colors.error + "20",
    borderColor: colors.error,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  actionButtonTextPrimary: {
    color: colors.white,
  },
  actionButtonTextDestructive: {
    color: colors.error,
  },
});
