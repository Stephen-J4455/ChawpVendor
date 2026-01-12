import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { colors, spacing, radii } from "../theme";

export default function OrderCard({ order, onPress }) {
  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return colors.statusPending;
      case "confirmed":
        return colors.statusConfirmed;
      case "preparing":
        return colors.statusPreparing;
      case "ready":
        return colors.statusReady;
      case "delivering":
        return colors.statusDelivering;
      case "delivered":
        return colors.statusDelivered;
      case "cancelled":
        return colors.statusCancelled;
      default:
        return colors.textMuted;
    }
  };

  const getStatusLabel = (status) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const itemCount = order.items?.length || 0;
  const firstItem = order.items?.[0]?.chawp_meals?.title || "Order";

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.header}>
        <View style={styles.orderInfo}>
          <Text style={styles.orderId}>#{order.id.slice(0, 8)}</Text>
          <Text style={styles.time}>{formatTime(order.created_at)}</Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(order.status) + "20" },
          ]}>
          <Text
            style={[
              styles.statusText,
              { color: getStatusColor(order.status) },
            ]}>
            {getStatusLabel(order.status)}
          </Text>
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.customerName}>
          {order.chawp_user_profiles?.full_name || "Customer"}
        </Text>
        <Text style={styles.itemsText}>
          {itemCount} item{itemCount !== 1 ? "s" : ""} • {firstItem}
          {itemCount > 1 ? ` +${itemCount - 1} more` : ""}
        </Text>
      </View>

      <View style={styles.footer}>
        <Text style={styles.amount}>
          GH₵{parseFloat(order.total_amount).toFixed(2)}
        </Text>
        {order.chawp_user_profiles?.phone && (
          <Text style={styles.phone}>📞 {order.chawp_user_profiles.phone}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  orderInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  orderId: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  time: {
    fontSize: 13,
    color: colors.textMuted,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.sm,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  content: {
    marginBottom: spacing.sm,
  },
  customerName: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  itemsText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  amount: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.accent,
  },
  phone: {
    fontSize: 13,
    color: colors.textSecondary,
  },
});
