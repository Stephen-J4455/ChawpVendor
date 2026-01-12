import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, spacing, radii, typography } from "../theme";

export default function MetricCard({ icon, label, value, subValue, trend }) {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>{icon}</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{value}</Text>
        {subValue && <Text style={styles.subValue}>{subValue}</Text>}
        {trend && (
          <View style={styles.trendContainer}>
            <Text
              style={[
                styles.trend,
                trend > 0 ? styles.trendUp : styles.trendDown,
              ]}>
              {trend > 0 ? "↑" : "↓"} {Math.abs(trend)}%
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radii.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    minWidth: 150,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.md,
  },
  icon: {
    fontSize: 24,
  },
  content: {
    flex: 1,
  },
  label: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  value: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  subValue: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  trendContainer: {
    marginTop: spacing.xs,
  },
  trend: {
    fontSize: 12,
    fontWeight: "600",
  },
  trendUp: {
    color: colors.success,
  },
  trendDown: {
    color: colors.error,
  },
});
