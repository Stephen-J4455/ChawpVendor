import { StatusBar as ExpoStatusBar } from "expo-status-bar";
import React, { useState } from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
  StatusBar as NativeStatusBar,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

import { colors, spacing, radii } from "./src/theme";
import {
  VendorAuthProvider,
  useVendorAuth,
} from "./src/contexts/VendorAuthContext";
import {
  NotificationProvider,
  useNotification,
} from "./src/contexts/NotificationContext";
import VendorAuthScreen from "./src/components/VendorAuthScreen";
import DashboardPage from "./src/pages/DashboardPage";
import OrdersPage from "./src/pages/OrdersPage";
import MenuPage from "./src/pages/MenuPage";
import PayoutsPage from "./src/pages/PayoutsPage";
import ProfilePage from "./src/pages/ProfilePage";

const topInset =
  Platform.OS === "android"
    ? (NativeStatusBar.currentHeight || 0) + spacing.md
    : spacing.xl;

const bottomNavItems = [
  { id: "dashboard", label: "Dashboard", icon: "grid-outline" },
  { id: "orders", label: "Orders", icon: "receipt-outline" },
  { id: "menu", label: "Menu", icon: "restaurant-outline" },
  { id: "payouts", label: "Payouts", icon: "cash-outline" },
  { id: "profile", label: "Profile", icon: "person-outline" },
];

function AppContent() {
  const { user, vendor, loading, signIn, signOut, hasVendorProfile } =
    useVendorAuth();
  const { showConfirm, error: showError } = useNotification();
  const [selectedNav, setSelectedNav] = useState("dashboard");

  const handleSignIn = async (email, password) => {
    const result = await signIn(email, password);
    return result;
  };

  const handleSignOut = () => {
    showConfirm({
      type: "warning",
      title: "Sign Out",
      message: "Are you sure you want to sign out?",
      confirmText: "Sign Out",
      cancelText: "Cancel",
      confirmStyle: "destructive",
      onConfirm: async () => {
        await signOut();
      },
    });
  };

  // Show loading state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  // Show auth screen if not logged in
  if (!user) {
    return <VendorAuthScreen onSignIn={handleSignIn} />;
  }

  // Show error if user doesn't have a vendor profile
  if (!hasVendorProfile) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorTitle}>No Vendor Profile</Text>
        <Text style={styles.errorMessage}>
          Your account is not linked to a vendor profile. Please contact
          support.
        </Text>
        <TouchableOpacity style={styles.errorButton} onPress={handleSignOut}>
          <Text style={styles.errorButtonText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const renderPage = () => {
    switch (selectedNav) {
      case "dashboard":
        return <DashboardPage />;
      case "orders":
        return <OrdersPage />;
      case "menu":
        return <MenuPage />;
      case "payouts":
        return <PayoutsPage />;
      case "profile":
        return <ProfilePage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ExpoStatusBar style="light" />

      {/* Header */}
      <LinearGradient
        colors={[colors.primary, colors.primaryDark]}
        style={[styles.header, { paddingTop: topInset }]}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>CHAWP VENDOR</Text>
            <Text style={styles.headerSubtitle}>
              {bottomNavItems.find((item) => item.id === selectedNav)?.label ||
                "Dashboard"}
            </Text>
          </View>
        </View>
      </LinearGradient>

      {/* Page Content */}
      <View style={styles.content}>{renderPage()}</View>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        {bottomNavItems.map((item) => {
          const isActive = selectedNav === item.id;
          return (
            <TouchableOpacity
              key={item.id}
              style={styles.navItem}
              onPress={() => setSelectedNav(item.id)}>
              <View
                style={[
                  styles.navIconContainer,
                  isActive && styles.navIconContainerActive,
                ]}>
                <Ionicons
                  name={item.icon}
                  size={24}
                  color={isActive ? colors.primary : colors.textSecondary}
                />
              </View>
              <Text
                style={[styles.navLabel, isActive && styles.navLabelActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

// Error boundary component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("App crashed:", error, errorInfo);
    this.setState({ errorInfo });

    // Log to console for debugging
    console.error("Error details:", {
      message: error?.message,
      stack: error?.stack,
      componentStack: errorInfo?.componentStack,
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <SafeAreaView
          style={{
            flex: 1,
            backgroundColor: "#070B16",
            justifyContent: "center",
            alignItems: "center",
            padding: 20,
          }}>
          <ExpoStatusBar style="light" />
          <Text style={{ fontSize: 48, marginBottom: 20 }}>⚠️</Text>
          <Text
            style={{
              fontSize: 24,
              color: "#FFFFFF",
              fontWeight: "bold",
              marginBottom: 10,
            }}>
            App Error
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: "#6C7796",
              textAlign: "center",
              marginBottom: 20,
            }}>
            {this.state.error?.message || "Unknown error occurred"}
          </Text>
          <TouchableOpacity
            style={{
              backgroundColor: "#2E6BFF",
              paddingHorizontal: 20,
              paddingVertical: 12,
              borderRadius: 8,
            }}
            onPress={() => {
              this.setState({ hasError: false, error: null, errorInfo: null });
            }}>
            <Text style={{ color: "#FFFFFF", fontWeight: "600" }}>
              Try Again
            </Text>
          </TouchableOpacity>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}

export default function App() {
  const [appReady, setAppReady] = React.useState(false);
  const [appError, setAppError] = React.useState(null);

  React.useEffect(() => {
    // Initialize app with proper error handling
    const initApp = async () => {
      try {
        if (__DEV__) console.log("ChawpVendor initializing...");

        // Small delay to ensure everything is ready
        await new Promise((resolve) => setTimeout(resolve, 100));

        setAppReady(true);
        if (__DEV__) console.log("ChawpVendor ready");
      } catch (error) {
        console.error("App initialization error:", error);
        setAppError(error?.message || "Failed to initialize app");
      }
    };

    initApp();
  }, []);

  if (appError) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: "#070B16",
          justifyContent: "center",
          alignItems: "center",
          padding: 20,
        }}>
        <ExpoStatusBar style="light" />
        <Text style={{ fontSize: 48, marginBottom: 20 }}>⚠️</Text>
        <Text
          style={{
            fontSize: 24,
            color: "#FFFFFF",
            fontWeight: "bold",
            marginBottom: 10,
          }}>
          Initialization Error
        </Text>
        <Text
          style={{
            fontSize: 14,
            color: "#6C7796",
            textAlign: "center",
            marginBottom: 20,
          }}>
          {appError}
        </Text>
        <TouchableOpacity
          style={{
            backgroundColor: "#2E6BFF",
            paddingHorizontal: 20,
            paddingVertical: 12,
            borderRadius: 8,
          }}
          onPress={() => {
            setAppError(null);
            setAppReady(false);
          }}>
          <Text style={{ color: "#FFFFFF", fontWeight: "600" }}>Try Again</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (!appReady) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: "#070B16",
          justifyContent: "center",
          alignItems: "center",
        }}>
        <ExpoStatusBar style="light" />
        <ActivityIndicator size="large" color="#2E6BFF" />
        <Text style={{ fontSize: 14, color: "#6C7796", marginTop: 20 }}>
          Loading ChawpVendor...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <ErrorBoundary>
      <VendorAuthProvider>
        <NotificationProvider>
          <AppContent />
        </NotificationProvider>
      </VendorAuthProvider>
    </ErrorBoundary>
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
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
    padding: spacing.xxl,
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: spacing.lg,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: spacing.md,
    textAlign: "center",
  },
  errorMessage: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
  errorButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
  },
  errorButtonText: {
    color: colors.white,
    fontWeight: "600",
    fontSize: 16,
  },
  header: {
    paddingBottom: spacing.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "bold",
    color: colors.white,
    letterSpacing: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.white,
    opacity: 0.9,
    marginTop: spacing.xs,
    fontWeight: "500",
  },
  content: {
    flex: 1,
  },
  bottomNav: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingVertical: spacing.sm,
    paddingBottom: Platform.OS === "ios" ? spacing.lg : spacing.sm,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  navItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: spacing.xs,
  },
  navIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xs,
    backgroundColor: "transparent",
  },
  navIconContainerActive: {
    backgroundColor: colors.accent + "20",
    borderRadius: 24,
  },
  navIcon: {
    fontSize: 22,
  },
  navLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  navLabelActive: {
    color: colors.accent,
    fontWeight: "600",
  },
});
