import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { colors, spacing, radii } from "../theme";
import { useVendorAuth } from "../contexts/VendorAuthContext";
import { useNotification } from "../contexts/NotificationContext";
import {
  fetchVendorOrders,
  acceptOrder,
  declineOrder,
  markOrderPreparing,
  markOrderReady,
} from "../services/vendorApi";
import OrderCard from "../components/OrderCard";
import EmptyState from "../components/EmptyState";

export default function OrdersPage() {
  const { vendor } = useVendorAuth();
  const { success, error: showError, showConfirm } = useNotification();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [orders, setOrders] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState(null);

  const filters = [
    { id: "all", label: "All", status: null },
    { id: "pending", label: "Pending", status: "pending" },
    { id: "confirmed", label: "Confirmed", status: "confirmed" },
    { id: "preparing", label: "Preparing", status: "preparing" },
    { id: "ready", label: "Ready", status: "ready" },
  ];

  useEffect(() => {
    if (vendor) {
      loadOrders();
    }
  }, [vendor, selectedFilter]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const filter = filters.find((f) => f.id === selectedFilter);
      const result = await fetchVendorOrders(vendor.id, {
        status: filter.status,
      });

      if (result.success) {
        setOrders(result.data);
      } else {
        showError("Error", result.error);
      }
    } catch (err) {
      showError("Error", "Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadOrders();
    setRefreshing(false);
  };

  const handleAcceptOrder = async (orderId) => {
    showConfirm({
      title: "Accept Order",
      message: "Are you sure you want to accept this order?",
      confirmText: "Accept",
      cancelText: "Cancel",
      onConfirm: async () => {
        const result = await acceptOrder(orderId);
        if (result.success) {
          success("Order Accepted", "You can now start preparing this order");
          loadOrders();
        } else {
          showError("Error", result.error);
        }
      },
    });
  };

  const handleDeclineOrder = async (orderId) => {
    showConfirm({
      title: "Decline Order",
      message: "Are you sure you want to decline this order?",
      confirmText: "Decline",
      cancelText: "Cancel",
      confirmStyle: "destructive",
      onConfirm: async () => {
        const result = await declineOrder(orderId);
        if (result.success) {
          success("Order Declined", "The customer has been notified");
          loadOrders();
        } else {
          showError("Error", result.error);
        }
      },
    });
  };

  const handleMarkPreparing = async (orderId) => {
    const result = await markOrderPreparing(orderId);
    if (result.success) {
      success("Status Updated", "Order is now being prepared");
      loadOrders();
    } else {
      showError("Error", result.error);
    }
  };

  const handleMarkReady = async (orderId) => {
    const result = await markOrderReady(orderId);
    if (result.success) {
      success("Order Ready", "The delivery driver has been notified");
      loadOrders();
    } else {
      showError("Error", result.error);
    }
  };

  const handleOrderPress = (order) => {
    setSelectedOrder(order);
    // TODO: Open order detail modal/sheet
  };

  const renderOrderActions = (order) => {
    if (order.status === "pending") {
      return (
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.actionButton, styles.declineButton]}
            onPress={() => handleDeclineOrder(order.id)}>
            <Text style={styles.declineButtonText}>Decline</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.acceptButton]}
            onPress={() => handleAcceptOrder(order.id)}>
            <Text style={styles.acceptButtonText}>Accept</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (order.status === "confirmed") {
      return (
        <TouchableOpacity
          style={[styles.actionButton, styles.primaryButton]}
          onPress={() => handleMarkPreparing(order.id)}>
          <Text style={styles.primaryButtonText}>Start Preparing</Text>
        </TouchableOpacity>
      );
    }

    if (order.status === "preparing") {
      return (
        <TouchableOpacity
          style={[styles.actionButton, styles.successButton]}
          onPress={() => handleMarkReady(order.id)}>
          <Text style={styles.successButtonText}>Mark Ready</Text>
        </TouchableOpacity>
      );
    }

    return null;
  };

  const renderOrder = ({ item }) => (
    <View>
      <OrderCard order={item} onPress={() => handleOrderPress(item)} />
      {renderOrderActions(item)}
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading orders...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Filters */}
      <View style={styles.filtersContainer}>
        {filters.map((filter) => (
          <TouchableOpacity
            key={filter.id}
            style={[
              styles.filterChip,
              selectedFilter === filter.id && styles.filterChipActive,
            ]}
            onPress={() => setSelectedFilter(filter.id)}>
            <Text
              style={[
                styles.filterText,
                selectedFilter === filter.id && styles.filterTextActive,
              ]}>
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Orders List */}
      <FlatList
        data={orders}
        renderItem={renderOrder}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <EmptyState
            icon="📦"
            title="No Orders"
            message={`No ${
              selectedFilter !== "all" ? selectedFilter : ""
            } orders found`}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: 14,
    color: colors.textSecondary,
  },
  filtersContainer: {
    flexDirection: "row",
    padding: spacing.md,
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.full,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  filterTextActive: {
    color: colors.white,
  },
  listContent: {
    padding: spacing.md,
  },
  actionsRow: {
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  actionButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    alignItems: "center",
  },
  declineButton: {
    backgroundColor: colors.error + "20",
    borderWidth: 1,
    borderColor: colors.error,
  },
  declineButtonText: {
    color: colors.error,
    fontWeight: "600",
    fontSize: 14,
  },
  acceptButton: {
    backgroundColor: colors.success,
  },
  acceptButtonText: {
    color: colors.white,
    fontWeight: "600",
    fontSize: 14,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    marginBottom: spacing.lg,
  },
  primaryButtonText: {
    color: colors.white,
    fontWeight: "600",
    fontSize: 14,
  },
  successButton: {
    backgroundColor: colors.success,
    marginBottom: spacing.lg,
  },
  successButtonText: {
    color: colors.white,
    fontWeight: "600",
    fontSize: 14,
  },
});
