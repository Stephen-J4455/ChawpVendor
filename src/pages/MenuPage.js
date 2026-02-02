import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Switch,
} from "react-native";
import { colors, spacing, radii } from "../theme";
import { useVendorAuth } from "../contexts/VendorAuthContext";
import { useNotification } from "../contexts/NotificationContext";
import {
  fetchVendorMeals,
  toggleMealAvailability,
} from "../services/vendorApi";
import EmptyState from "../components/EmptyState";

export default function MenuPage() {
  const { vendor } = useVendorAuth();
  const { success, error: showError } = useNotification();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [meals, setMeals] = useState([]);

  useEffect(() => {
    if (vendor?.id) {
      loadMeals();
    }
  }, [vendor?.id]);

  const loadMeals = async () => {
    if (!vendor?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const result = await fetchVendorMeals(vendor.id);

      if (result.success) {
        setMeals(result.data);
      } else {
        showError("Error", result.error);
      }
    } catch (err) {
      showError("Error", "Failed to load menu");
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMeals();
    setRefreshing(false);
  };

  const handleToggleAvailability = async (meal) => {
    const result = await toggleMealAvailability(meal.id, meal.status);
    if (result.success) {
      const newStatus = result.data.status;
      success(
        "Updated",
        `${meal.title} is now ${
          newStatus === "available" ? "available" : "unavailable"
        }`,
      );
      loadMeals();
    } else {
      showError("Error", result.error);
    }
  };

  const renderMealItem = ({ item }) => (
    <View style={styles.mealCard}>
      <View style={styles.mealInfo}>
        <Text style={styles.mealTitle}>{item.title}</Text>
        <Text style={styles.mealDescription} numberOfLines={2}>
          {item.description}
        </Text>
        <View style={styles.mealMeta}>
          <Text style={styles.mealPrice}>
            GH₵{parseFloat(item.price).toFixed(2)}
          </Text>
          <View
            style={[
              styles.statusBadge,
              item.status === "available"
                ? styles.statusAvailable
                : styles.statusUnavailable,
            ]}
          >
            <Text
              style={[
                styles.statusText,
                item.status === "available"
                  ? styles.statusTextAvailable
                  : styles.statusTextUnavailable,
              ]}
            >
              {item.status === "available" ? "Available" : "Unavailable"}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.mealActions}>
        <View style={styles.toggleContainer}>
          <Text style={styles.toggleLabel}>Available</Text>
          <Switch
            value={item.status === "available"}
            onValueChange={() => handleToggleAvailability(item)}
            trackColor={{
              false: colors.gray500,
              true: colors.success,
            }}
            thumbColor={colors.white}
          />
        </View>
      </View>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading menu...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Menu Items</Text>
        <Text style={styles.headerSubtitle}>
          {meals.length} item{meals.length !== 1 ? "s" : ""}
        </Text>
      </View>

      <FlatList
        data={meals}
        renderItem={renderMealItem}
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
            icon="🍽️"
            title="No Menu Items"
            message="Your menu items will appear here"
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
  header: {
    padding: spacing.lg,
    paddingTop: 56,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  listContent: {
    padding: spacing.md,
  },
  mealCard: {
    backgroundColor: colors.card,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  mealInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  mealTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  mealDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    lineHeight: 18,
  },
  mealMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  mealPrice: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.accent,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.sm,
  },
  statusAvailable: {
    backgroundColor: colors.success + "20",
  },
  statusUnavailable: {
    backgroundColor: colors.gray500 + "20",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  statusTextAvailable: {
    color: colors.success,
  },
  statusTextUnavailable: {
    color: colors.gray500,
  },
  mealActions: {
    justifyContent: "center",
  },
  toggleContainer: {
    alignItems: "center",
    gap: spacing.xs,
  },
  toggleLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
});
