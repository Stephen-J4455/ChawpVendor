import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors, spacing, radii } from "../theme";
import { useVendorAuth } from "../contexts/VendorAuthContext";
import { useNotification } from "../contexts/NotificationContext";
import { fetchPayoutHistory } from "../services/vendorApi";
import EmptyState from "../components/EmptyState";

export default function PayoutsPage() {
  const { vendor } = useVendorAuth();
  const { error: showError } = useNotification();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [payouts, setPayouts] = useState([]);

  useEffect(() => {
    if (vendor?.id) {
      loadPayouts();
    }
  }, [vendor?.id]);

  const loadPayouts = async () => {
    if (!vendor?.id) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const result = await fetchPayoutHistory(vendor.id);

      if (result.success) {
        setPayouts(result.data);
      } else {
        showError("Error", result.error);
      }
    } catch (err) {
      showError("Error", "Failed to load payouts");
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPayouts();
    setRefreshing(false);
  };

  const totalEarnings = payouts
    .filter((p) => p.status === "completed")
    .reduce((sum, payout) => sum + payout.amount, 0);

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return colors.success;
      case "processing":
        return colors.info;
      case "pending":
        return colors.warning;
      case "failed":
        return colors.error;
      default:
        return colors.textSecondary;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return "✅";
      case "processing":
        return "⏳";
      case "pending":
        return "⏸️";
      case "failed":
        return "❌";
      default:
        return "📋";
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading payouts...</Text>
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
      {/* Summary Card */}
      <LinearGradient
        colors={[colors.accent, colors.accentDark]}
        style={styles.summaryCard}
      >
        <Text style={styles.summaryLabel}>Total Earnings</Text>
        <Text style={styles.summaryAmount}>GH₵{totalEarnings.toFixed(2)}</Text>
        <Text style={styles.summarySubtext}>
          From {payouts.length} payout{payouts.length !== 1 ? "s" : ""}
        </Text>
      </LinearGradient>

      {/* Payout History */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Payout History</Text>

        {payouts.length === 0 ? (
          <EmptyState
            icon="💰"
            title="No Payouts Yet"
            message="Your payout history will appear here once admin processes payouts"
          />
        ) : (
          payouts.map((payout) => (
            <View key={payout.id} style={styles.payoutCard}>
              <View style={styles.payoutHeader}>
                <View style={styles.payoutLeft}>
                  <Text style={styles.payoutIcon}>
                    {getStatusIcon(payout.status)}
                  </Text>
                  <View>
                    <Text style={styles.payoutAmount}>
                      GH₵{payout.amount.toFixed(2)}
                    </Text>
                    <Text style={styles.payoutDate}>
                      {new Date(payout.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </Text>
                  </View>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(payout.status) + "20" },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      { color: getStatusColor(payout.status) },
                    ]}
                  >
                    {payout.status}
                  </Text>
                </View>
              </View>

              {payout.payment_method && (
                <View style={styles.payoutDetail}>
                  <Text style={styles.payoutDetailLabel}>Payment Method:</Text>
                  <Text style={styles.payoutDetailValue}>
                    {payout.payment_method === "mobile_money"
                      ? "Mobile Money"
                      : "Bank Transfer"}
                  </Text>
                </View>
              )}

              {payout.reference_number && (
                <View style={styles.payoutDetail}>
                  <Text style={styles.payoutDetailLabel}>Reference:</Text>
                  <Text style={styles.payoutDetailValue}>
                    {payout.reference_number}
                  </Text>
                </View>
              )}

              {payout.notes && (
                <Text style={styles.payoutNotes}>{payout.notes}</Text>
              )}

              {payout.completed_at && (
                <Text style={styles.completedDate}>
                  Completed on{" "}
                  {new Date(payout.completed_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
              )}
            </View>
          ))
        )}
      </View>

      {/* Info */}
      <View style={styles.infoBox}>
        <Text style={styles.infoIcon}>ℹ️</Text>
        <View style={styles.infoContent}>
          <Text style={styles.infoTitle}>Payout Schedule</Text>
          <Text style={styles.infoText}>
            Payouts are processed monthly. Funds are transferred to your
            registered bank account within 3-5 business days.
          </Text>
        </View>
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
  summaryCard: {
    marginTop: 56,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    padding: spacing.xl,
    borderRadius: radii.lg,
    alignItems: "center",
  },
  summaryLabel: {
    fontSize: 14,
    color: colors.white,
    opacity: 0.9,
    marginBottom: spacing.sm,
  },
  summaryAmount: {
    fontSize: 40,
    fontWeight: "700",
    color: colors.white,
    marginBottom: spacing.xs,
  },
  summarySubtext: {
    fontSize: 13,
    color: colors.white,
    opacity: 0.8,
  },
  section: {
    padding: spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  payoutCard: {
    backgroundColor: colors.card,
    borderRadius: radii.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  payoutHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  payoutLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  payoutIcon: {
    fontSize: 28,
  },
  payoutAmount: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: spacing.xs / 2,
  },
  payoutDate: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: radii.sm,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  payoutDetail: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  payoutDetailLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  payoutDetailValue: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textPrimary,
    textTransform: "capitalize",
  },
  payoutNotes: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    fontStyle: "italic",
  },
  completedDate: {
    fontSize: 12,
    color: colors.success,
    marginTop: spacing.sm,
    fontWeight: "500",
  },
  infoBox: {
    flexDirection: "row",
    backgroundColor: colors.card,
    marginHorizontal: spacing.lg,
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoIcon: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  infoText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
});
