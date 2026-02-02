import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors, spacing, radii } from "../theme";
import { useVendorAuth } from "../contexts/VendorAuthContext";
import { useNotification } from "../contexts/NotificationContext";
import { getVendorStats, fetchVendorOrders } from "../services/vendorApi";
import MetricCard from "../components/MetricCard";
import OrderCard from "../components/OrderCard";
import EmptyState from "../components/EmptyState";

export default function DashboardPage() {
  const { vendor } = useVendorAuth();
  const { error: showError } = useNotification();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);

  useEffect(() => {
    if (vendor) {
      loadDashboardData();
    }
  }, [vendor]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [statsResult, ordersResult] = await Promise.all([
        getVendorStats(vendor.id),
        fetchVendorOrders(vendor.id, { limit: 5 }),
      ]);

      if (statsResult.success) {
        setStats(statsResult.data);
      } else {
        showError("Error", statsResult.error);
      }

      if (ordersResult.success) {
        setRecentOrders(ordersResult.data);
      } else {
        showError("Error", ordersResult.error);
      }
    } catch (err) {
      showError("Error", "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.primary}
        />
      }
    >
      {/* Header */}
      <LinearGradient
        colors={[colors.primary, colors.primaryDark]}
        style={styles.headerGradient}
      >
        <Text style={styles.greeting}>👋 Welcome back!</Text>
        <Text style={styles.vendorName}>{vendor?.name || "Vendor"}</Text>
      </LinearGradient>

      {/* Metrics */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Today's Overview</Text>
        <View style={styles.metricsGrid}>
          <MetricCard
            icon="💰"
            label="Today's Revenue"
            value={`GH₵${stats?.todayRevenue?.toFixed(2) || "0.00"}`}
          />
          <MetricCard
            icon="📦"
            label="Pending Orders"
            value={stats?.pendingOrders || 0}
          />
        </View>
        <View style={styles.metricsGrid}>
          <MetricCard
            icon="📊"
            label="Total Orders"
            value={stats?.totalOrders || 0}
          />
          <MetricCard
            icon="💵"
            label="Total Revenue"
            value={`GH₵${stats?.totalRevenue?.toFixed(2) || "0.00"}`}
          />
        </View>
      </View>

      {/* Recent Orders */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Orders</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>See All →</Text>
          </TouchableOpacity>
        </View>

        {recentOrders.length === 0 ? (
          <EmptyState
            icon="📦"
            title="No Orders Yet"
            message="New orders will appear here"
          />
        ) : (
          recentOrders.map((order) => (
            <OrderCard key={order.id} order={order} onPress={() => {}} />
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingBottom: spacing.xxl,
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
  headerGradient: {
    padding: spacing.lg,
    paddingTop: 56,
    paddingBottom: spacing.xxl,
  },
  greeting: {
    fontSize: 14,
    color: colors.white,
    opacity: 0.9,
    marginBottom: spacing.xs,
  },
  vendorName: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.white,
  },
  section: {
    padding: spacing.lg,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  seeAllText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: "600",
  },
  metricsGrid: {
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.md,
  },
});
