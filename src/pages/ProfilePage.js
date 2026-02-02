import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Switch,
  Modal,
  TextInput,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, radii } from "../theme";
import { useVendorAuth } from "../contexts/VendorAuthContext";
import { useNotification } from "../contexts/NotificationContext";
import { supabase } from "../config/supabase";
import {
  fetchVendorHours,
  updateVendorHourStatus,
  updateVendorHourTimes,
} from "../services/vendorApi";

export default function ProfilePage() {
  const { vendor, signOut, refreshVendor } = useVendorAuth();
  const {
    showConfirm,
    success: showSuccess,
    error: showError,
  } = useNotification();
  const [uploadingImage, setUploadingImage] = useState(false);
  const [vendorHours, setVendorHours] = useState([]);
  const [loadingHours, setLoadingHours] = useState(true);
  const [showHoursSection, setShowHoursSection] = useState(false);
  const [showBusinessSection, setShowBusinessSection] = useState(false);
  const [showBankSection, setShowBankSection] = useState(false);
  const [showNotificationsSection, setShowNotificationsSection] =
    useState(false);
  const [showSupportSection, setShowSupportSection] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [businessModalVisible, setBusinessModalVisible] = useState(false);
  const [bankModalVisible, setBankModalVisible] = useState(false);
  const [editingHour, setEditingHour] = useState(null);
  const [openTime, setOpenTime] = useState("");
  const [closeTime, setCloseTime] = useState("");

  // Business details
  const [businessName, setBusinessName] = useState(vendor?.name || "");
  const [businessEmail, setBusinessEmail] = useState(vendor?.email || "");
  const [businessPhone, setBusinessPhone] = useState(vendor?.phone || "");
  const [businessAddress, setBusinessAddress] = useState(vendor?.address || "");
  const [businessDescription, setBusinessDescription] = useState(
    vendor?.description || "",
  );

  // Payment details
  const [paymentMethod, setPaymentMethod] = useState("bank"); // 'bank' or 'mobile_money'
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [bankName, setBankName] = useState("");
  const [routingNumber, setRoutingNumber] = useState("");

  // Mobile money details
  const [mobileMoneyProvider, setMobileMoneyProvider] = useState("mtn");
  const [mobileMoneyNumber, setMobileMoneyNumber] = useState("");
  const [mobileMoneyName, setMobileMoneyName] = useState("");

  // Notification preferences
  const [orderNotifications, setOrderNotifications] = useState(true);
  const [promotionNotifications, setPromotionNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(false);

  const [notification, setNotification] = useState({
    visible: false,
    type: "",
    message: "",
  });

  // Helper function to convert day_of_week number to day name
  const getDayName = (dayOfWeek) => {
    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    return days[dayOfWeek];
  };

  const showNotification = (type, message) => {
    setNotification({ visible: true, type, message });
    setTimeout(() => {
      setNotification({ visible: false, type: "", message: "" });
    }, 3000);
  };

  useEffect(() => {
    if (vendor?.id) {
      loadVendorHours();
    }
  }, [vendor?.id]);

  const loadVendorHours = async () => {
    setLoadingHours(true);
    console.log("Loading hours for vendor:", vendor.id);
    const result = await fetchVendorHours(vendor.id);
    console.log("Vendor hours result:", result);
    if (result.success) {
      console.log("Setting vendor hours:", result.data);
      setVendorHours(result.data);
    } else {
      console.error("Failed to load hours:", result.error);
      showNotification("error", "Failed to load operating hours");
    }
    setLoadingHours(false);
  };

  const handleToggleHourStatus = async (hourId, currentStatus) => {
    const newStatus = !currentStatus;
    const result = await updateVendorHourStatus(hourId, newStatus);

    if (result.success) {
      setVendorHours(
        vendorHours.map((hour) =>
          hour.id === hourId ? { ...hour, is_closed: newStatus } : hour,
        ),
      );
      showNotification(
        "success",
        newStatus ? "Day closed successfully" : "Day opened successfully",
      );
    } else {
      showNotification("error", "Failed to update status");
    }
  };

  const handleEditHour = (hour) => {
    setEditingHour(hour);
    setOpenTime(hour.open_time?.slice(0, 5) || "08:00");
    setCloseTime(hour.close_time?.slice(0, 5) || "22:00");
    setEditModalVisible(true);
  };

  const handleSaveHourTimes = async () => {
    if (!editingHour) return;

    const result = await updateVendorHourTimes(
      editingHour.id,
      openTime + ":00",
      closeTime + ":00",
    );

    if (result.success) {
      setVendorHours(
        vendorHours.map((hour) =>
          hour.id === editingHour.id
            ? {
                ...hour,
                open_time: openTime + ":00",
                close_time: closeTime + ":00",
              }
            : hour,
        ),
      );
      showNotification("success", "Operating hours updated successfully");
      setEditModalVisible(false);
      setEditingHour(null);
    } else {
      showNotification("error", "Failed to update hours");
    }
  };

  const handleSaveBusinessDetails = async () => {
    try {
      const { data, error } = await supabase
        .from("chawp_vendors")
        .update({
          name: businessName,
          email: businessEmail,
          phone: businessPhone,
          address: businessAddress,
          description: businessDescription,
        })
        .eq("id", vendor.id)
        .select();

      if (error) throw error;

      showNotification("success", "Business details updated successfully");
      setBusinessModalVisible(false);
      refreshVendor();
    } catch (error) {
      console.error("Error updating business details:", error);
      showNotification("error", "Failed to update business details");
    }
  };

  const handleSaveBankDetails = async () => {
    try {
      // Prepare data based on payment method
      const paymentData = {
        vendor_id: vendor.id,
        payment_method: paymentMethod,
      };

      if (paymentMethod === "bank") {
        paymentData.account_name = accountName;
        paymentData.account_number = accountNumber;
        paymentData.bank_name = bankName;
        paymentData.routing_number = routingNumber;
        // Clear mobile money fields
        paymentData.mobile_money_provider = null;
        paymentData.mobile_money_number = null;
        paymentData.mobile_money_name = null;
      } else {
        // mobile_money
        paymentData.mobile_money_provider = mobileMoneyProvider;
        paymentData.mobile_money_number = mobileMoneyNumber;
        paymentData.mobile_money_name = mobileMoneyName;
        // Clear bank fields
        paymentData.account_name = null;
        paymentData.account_number = null;
        paymentData.bank_name = null;
        paymentData.routing_number = null;
      }

      // Check if payment details already exist
      const { data: existing } = await supabase
        .from("chawp_vendor_bank_details")
        .select("*")
        .eq("vendor_id", vendor.id)
        .single();

      let result;
      if (existing) {
        // Update existing
        result = await supabase
          .from("chawp_vendor_bank_details")
          .update(paymentData)
          .eq("vendor_id", vendor.id);
      } else {
        // Create new
        result = await supabase
          .from("chawp_vendor_bank_details")
          .insert(paymentData);
      }

      if (result.error) throw result.error;

      showNotification("success", "Payment details saved successfully");
      setBankModalVisible(false);
    } catch (error) {
      console.error("Error saving payment details:", error);
      showNotification("error", "Failed to save payment details");
    }
  };

  const handleSaveNotificationPreferences = async () => {
    try {
      const { error } = await supabase.from("chawp_vendor_preferences").upsert({
        vendor_id: vendor.id,
        order_notifications: orderNotifications,
        promotion_notifications: promotionNotifications,
        email_notifications: emailNotifications,
      });

      if (error) throw error;

      showNotification(
        "success",
        "Notification preferences saved successfully",
      );
    } catch (error) {
      console.error("Error saving preferences:", error);
      showNotification("error", "Failed to save preferences");
    }
  };

  const pickAndUploadImage = async () => {
    try {
      // Request permission
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        showError("Error", "Camera roll permission is required");
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true, // Request base64 encoding
      });

      if (!result.canceled) {
        await uploadVendorImage(result.assets[0].uri, result.assets[0].base64);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      showError("Error", "Failed to pick image");
    }
  };

  const uploadVendorImage = async (uri, base64) => {
    try {
      setUploadingImage(true);
      const fileName = `vendor_${vendor.id}_${Date.now()}.jpg`;
      const filePath = `vendors/${fileName}`;

      // Convert base64 to binary for upload
      const base64Data = base64 || uri.split(",")[1]; // Handle both cases
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Upload to Supabase storage using Uint8Array
      const { data, error } = await supabase.storage
        .from("chawp")
        .upload(filePath, bytes.buffer, {
          contentType: "image/jpeg",
          upsert: true,
        });

      if (error) throw error;

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("chawp").getPublicUrl(filePath);

      // Update vendor image in database
      const { error: updateError } = await supabase
        .from("chawp_vendors")
        .update({ image: publicUrl })
        .eq("id", vendor.id);

      if (updateError) throw updateError;

      // Refresh vendor data
      await refreshVendor();
      showSuccess("Success", "Profile image updated successfully");
    } catch (error) {
      console.error("Upload error:", error);
      showError("Error", "Failed to upload image. Please try again.");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSignOut = () => {
    showConfirm({
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

  const menuItems = [
    {
      id: "business",
      icon: "storefront-outline",
      title: "Business Details",
      subtitle: "Update restaurant information",
    },
    {
      id: "hours",
      icon: "time-outline",
      title: "Operating Hours",
      subtitle: "Set your opening hours",
    },
    {
      id: "bank",
      icon: "card-outline",
      title: "Bank Details",
      subtitle: "Update payout information",
    },
    {
      id: "notifications",
      icon: "notifications-outline",
      title: "Notifications",
      subtitle: "Manage notification preferences",
    },
    {
      id: "support",
      icon: "chatbubble-outline",
      title: "Support",
      subtitle: "Get help and contact us",
    },
  ];

  return (
    <View style={styles.wrapper}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Cover Photo */}
        <View style={styles.coverPhotoContainer}>
          {vendor?.image ? (
            <Image
              source={{ uri: vendor.image }}
              style={styles.coverPhoto}
              resizeMode="cover"
            />
          ) : (
            <LinearGradient
              colors={[colors.primary, colors.primaryDark]}
              style={styles.coverPhoto}
            />
          )}
          <View style={styles.coverOverlay} />
        </View>

        {/* Profile Header */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            {vendor?.image ? (
              <Image
                source={{ uri: vendor.image }}
                style={styles.avatarImage}
                resizeMode="cover"
              />
            ) : (
              <Text style={styles.avatarText}>
                {vendor?.name?.charAt(0).toUpperCase() || "V"}
              </Text>
            )}
            <TouchableOpacity
              style={styles.uploadButton}
              onPress={pickAndUploadImage}
              disabled={uploadingImage}
            >
              {uploadingImage ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Text style={styles.uploadIcon}>📷</Text>
              )}
            </TouchableOpacity>
          </View>
          <Text style={styles.vendorName}>{vendor?.name || "Vendor"}</Text>
          <Text style={styles.vendorEmail}>{vendor?.email || ""}</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{vendor?.rating || "0.0"}</Text>
            <Text style={styles.statLabel}>⭐ Rating</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {vendor?.delivery_time || "N/A"}
            </Text>
            <Text style={styles.statLabel}>🕐 Avg Time</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{vendor?.status || "active"}</Text>
            <Text style={styles.statLabel}>📊 Status</Text>
          </View>
        </View>

        {/* Menu Items */}
        <View style={styles.section}>
          {menuItems.map((item) => (
            <View key={item.id}>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  if (item.id === "hours") {
                    setShowHoursSection(!showHoursSection);
                  } else if (item.id === "business") {
                    setShowBusinessSection(!showBusinessSection);
                  } else if (item.id === "bank") {
                    setShowBankSection(!showBankSection);
                  } else if (item.id === "notifications") {
                    setShowNotificationsSection(!showNotificationsSection);
                  } else if (item.id === "support") {
                    setShowSupportSection(!showSupportSection);
                  }
                }}
              >
                <View style={styles.menuItemLeft}>
                  <Ionicons
                    name={item.icon}
                    size={24}
                    color={colors.primary}
                    style={styles.menuItemIcon}
                  />
                  <View style={styles.menuItemText}>
                    <Text style={styles.menuItemTitle}>{item.title}</Text>
                    <Text style={styles.menuItemSubtitle}>{item.subtitle}</Text>
                  </View>
                </View>
                {item.id === "hours" ? (
                  <Ionicons
                    name={showHoursSection ? "chevron-up" : "chevron-down"}
                    size={20}
                    color={colors.textSecondary}
                  />
                ) : item.id === "business" ? (
                  <Ionicons
                    name={showBusinessSection ? "chevron-up" : "chevron-down"}
                    size={20}
                    color={colors.textSecondary}
                  />
                ) : item.id === "bank" ? (
                  <Ionicons
                    name={showBankSection ? "chevron-up" : "chevron-down"}
                    size={20}
                    color={colors.textSecondary}
                  />
                ) : item.id === "notifications" ? (
                  <Ionicons
                    name={
                      showNotificationsSection ? "chevron-up" : "chevron-down"
                    }
                    size={20}
                    color={colors.textSecondary}
                  />
                ) : item.id === "support" ? (
                  <Ionicons
                    name={showSupportSection ? "chevron-up" : "chevron-down"}
                    size={20}
                    color={colors.textSecondary}
                  />
                ) : (
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={colors.textSecondary}
                  />
                )}
              </TouchableOpacity>

              {/* Operating Hours Expanded Section */}
              {item.id === "hours" && showHoursSection && (
                <View style={styles.hoursSection}>
                  {loadingHours ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : vendorHours && vendorHours.length > 0 ? (
                    vendorHours.map((hour) => (
                      <View key={hour.id} style={styles.hourRow}>
                        <View style={styles.hourInfo}>
                          <Text style={styles.dayName}>
                            {getDayName(hour.day_of_week)}
                          </Text>
                          <Text style={styles.hourTime}>
                            {hour.is_closed
                              ? "Closed"
                              : `${hour.open_time?.slice(
                                  0,
                                  5,
                                )} - ${hour.close_time?.slice(0, 5)}`}
                          </Text>
                        </View>
                        <View style={styles.hourActions}>
                          <TouchableOpacity
                            style={styles.editButton}
                            onPress={() => handleEditHour(hour)}
                            disabled={hour.is_closed}
                          >
                            <Ionicons
                              name="create-outline"
                              size={18}
                              color={
                                hour.is_closed
                                  ? colors.textMuted
                                  : colors.primary
                              }
                            />
                          </TouchableOpacity>
                          <Switch
                            value={!hour.is_closed}
                            onValueChange={() =>
                              handleToggleHourStatus(hour.id, hour.is_closed)
                            }
                            trackColor={{
                              false: colors.border,
                              true: colors.primary + "50",
                            }}
                            thumbColor={
                              !hour.is_closed
                                ? colors.primary
                                : colors.textMuted
                            }
                          />
                        </View>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.emptyText}>
                      No operating hours available.{" "}
                      {console.log("VendorHours:", vendorHours)}
                    </Text>
                  )}
                </View>
              )}

              {/* Business Details Expanded Section */}
              {item.id === "business" && showBusinessSection && (
                <View style={styles.expandedSection}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Business Name:</Text>
                    <Text style={styles.detailValue}>{vendor?.name}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Email:</Text>
                    <Text style={styles.detailValue}>{vendor?.email}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Phone:</Text>
                    <Text style={styles.detailValue}>
                      {vendor?.phone || "Not set"}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Address:</Text>
                    <Text style={styles.detailValue}>
                      {vendor?.address || "Not set"}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Description:</Text>
                    <Text style={styles.detailValue}>
                      {vendor?.description || "Not set"}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.editDetailsButton}
                    onPress={() => {
                      setBusinessName(vendor?.name || "");
                      setBusinessEmail(vendor?.email || "");
                      setBusinessPhone(vendor?.phone || "");
                      setBusinessAddress(vendor?.address || "");
                      setBusinessDescription(vendor?.description || "");
                      setBusinessModalVisible(true);
                    }}
                  >
                    <Ionicons
                      name="create-outline"
                      size={18}
                      color={colors.white}
                    />
                    <Text style={styles.editDetailsButtonText}>
                      Edit Details
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Bank Details Expanded Section */}
              {item.id === "bank" && showBankSection && (
                <View style={styles.expandedSection}>
                  <Text style={styles.sectionNote}>
                    <Ionicons
                      name="information-circle"
                      size={16}
                      color={colors.primary}
                    />{" "}
                    Your banking information is securely encrypted and used only
                    for payouts.
                  </Text>
                  <TouchableOpacity
                    style={styles.editDetailsButton}
                    onPress={() => setBankModalVisible(true)}
                  >
                    <Ionicons
                      name="card-outline"
                      size={18}
                      color={colors.white}
                    />
                    <Text style={styles.editDetailsButtonText}>
                      Manage Bank Details
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Notifications Expanded Section */}
              {item.id === "notifications" && showNotificationsSection && (
                <View style={styles.expandedSection}>
                  <View style={styles.notificationRow}>
                    <View style={styles.notificationInfo}>
                      <Text style={styles.notificationTitle}>
                        Order Updates
                      </Text>
                      <Text style={styles.notificationSubtitle}>
                        Get notified about new orders
                      </Text>
                    </View>
                    <Switch
                      value={orderNotifications}
                      onValueChange={(value) => {
                        setOrderNotifications(value);
                        handleSaveNotificationPreferences();
                      }}
                      trackColor={{
                        false: colors.border,
                        true: colors.primary + "50",
                      }}
                      thumbColor={
                        orderNotifications ? colors.primary : colors.textMuted
                      }
                    />
                  </View>

                  <View style={styles.notificationRow}>
                    <View style={styles.notificationInfo}>
                      <Text style={styles.notificationTitle}>Promotions</Text>
                      <Text style={styles.notificationSubtitle}>
                        Marketing and promotional updates
                      </Text>
                    </View>
                    <Switch
                      value={promotionNotifications}
                      onValueChange={(value) => {
                        setPromotionNotifications(value);
                        handleSaveNotificationPreferences();
                      }}
                      trackColor={{
                        false: colors.border,
                        true: colors.primary + "50",
                      }}
                      thumbColor={
                        promotionNotifications
                          ? colors.primary
                          : colors.textMuted
                      }
                    />
                  </View>

                  <View style={styles.notificationRow}>
                    <View style={styles.notificationInfo}>
                      <Text style={styles.notificationTitle}>
                        Email Notifications
                      </Text>
                      <Text style={styles.notificationSubtitle}>
                        Receive updates via email
                      </Text>
                    </View>
                    <Switch
                      value={emailNotifications}
                      onValueChange={(value) => {
                        setEmailNotifications(value);
                        handleSaveNotificationPreferences();
                      }}
                      trackColor={{
                        false: colors.border,
                        true: colors.primary + "50",
                      }}
                      thumbColor={
                        emailNotifications ? colors.primary : colors.textMuted
                      }
                    />
                  </View>
                </View>
              )}

              {/* Support Expanded Section */}
              {item.id === "support" && showSupportSection && (
                <View style={styles.expandedSection}>
                  <TouchableOpacity style={styles.supportOption}>
                    <View style={styles.supportOptionLeft}>
                      <Ionicons
                        name="mail-outline"
                        size={22}
                        color={colors.primary}
                      />
                      <View style={styles.supportOptionText}>
                        <Text style={styles.supportOptionTitle}>
                          Email Support
                        </Text>
                        <Text style={styles.supportOptionSubtitle}>
                          support@chawp.com
                        </Text>
                      </View>
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color={colors.textSecondary}
                    />
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.supportOption}>
                    <View style={styles.supportOptionLeft}>
                      <Ionicons
                        name="call-outline"
                        size={22}
                        color={colors.primary}
                      />
                      <View style={styles.supportOptionText}>
                        <Text style={styles.supportOptionTitle}>
                          Phone Support
                        </Text>
                        <Text style={styles.supportOptionSubtitle}>
                          +1 (555) 123-4567
                        </Text>
                      </View>
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color={colors.textSecondary}
                    />
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.supportOption}>
                    <View style={styles.supportOptionLeft}>
                      <Ionicons
                        name="help-circle-outline"
                        size={22}
                        color={colors.primary}
                      />
                      <View style={styles.supportOptionText}>
                        <Text style={styles.supportOptionTitle}>
                          Help Center
                        </Text>
                        <Text style={styles.supportOptionSubtitle}>
                          FAQs and guides
                        </Text>
                      </View>
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color={colors.textSecondary}
                    />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Sign Out */}
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={20} color={colors.error} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        {/* Version */}
        <Text style={styles.version}>ChawpVendor v1.0.0</Text>

        {/* Edit Hours Modal */}
        <Modal
          visible={editModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setEditModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Edit Operating Hours</Text>
                <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                  <Ionicons
                    name="close"
                    size={24}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>

              {editingHour && (
                <View style={styles.modalBody}>
                  <Text style={styles.dayTitle}>
                    {getDayName(editingHour.day_of_week)}
                  </Text>

                  <View style={styles.timeInputContainer}>
                    <View style={styles.timeInput}>
                      <Text style={styles.timeLabel}>Opening Time</Text>
                      <View style={styles.inputWrapper}>
                        <Ionicons
                          name="time-outline"
                          size={20}
                          color={colors.primary}
                          style={styles.inputIcon}
                        />
                        <TextInput
                          style={styles.textInput}
                          value={openTime}
                          onChangeText={setOpenTime}
                          placeholder="HH:MM"
                          placeholderTextColor={colors.textMuted}
                          maxLength={5}
                        />
                      </View>
                    </View>

                    <View style={styles.timeInput}>
                      <Text style={styles.timeLabel}>Closing Time</Text>
                      <View style={styles.inputWrapper}>
                        <Ionicons
                          name="time-outline"
                          size={20}
                          color={colors.primary}
                          style={styles.inputIcon}
                        />
                        <TextInput
                          style={styles.textInput}
                          value={closeTime}
                          onChangeText={setCloseTime}
                          placeholder="HH:MM"
                          placeholderTextColor={colors.textMuted}
                          maxLength={5}
                        />
                      </View>
                    </View>
                  </View>

                  <View style={styles.modalActions}>
                    <TouchableOpacity
                      style={styles.cancelButton}
                      onPress={() => setEditModalVisible(false)}
                    >
                      <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.saveButton}
                      onPress={handleSaveHourTimes}
                    >
                      <Text style={styles.saveButtonText}>Save</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          </View>
        </Modal>

        {/* Business Details Modal */}
        <Modal
          visible={businessModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setBusinessModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Edit Business Details</Text>
                <TouchableOpacity
                  onPress={() => setBusinessModalVisible(false)}
                >
                  <Ionicons
                    name="close"
                    size={24}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.modalBody}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Business Name</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.textInput}
                      value={businessName}
                      onChangeText={setBusinessName}
                      placeholder="Enter business name"
                      placeholderTextColor={colors.textMuted}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Email</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.textInput}
                      value={businessEmail}
                      onChangeText={setBusinessEmail}
                      placeholder="Enter email"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="email-address"
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Phone</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.textInput}
                      value={businessPhone}
                      onChangeText={setBusinessPhone}
                      placeholder="Enter phone number"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="phone-pad"
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Address</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={[styles.textInput, styles.textArea]}
                      value={businessAddress}
                      onChangeText={setBusinessAddress}
                      placeholder="Enter business address"
                      placeholderTextColor={colors.textMuted}
                      multiline
                      numberOfLines={2}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Description</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={[styles.textInput, styles.textArea]}
                      value={businessDescription}
                      onChangeText={setBusinessDescription}
                      placeholder="Enter business description"
                      placeholderTextColor={colors.textMuted}
                      multiline
                      numberOfLines={3}
                    />
                  </View>
                </View>

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => setBusinessModalVisible(false)}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.saveButton}
                    onPress={handleSaveBusinessDetails}
                  >
                    <Text style={styles.saveButtonText}>Save</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </Modal>

        {/* Bank Details Modal */}
        <Modal
          visible={bankModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setBankModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Bank Details</Text>
                <TouchableOpacity onPress={() => setBankModalVisible(false)}>
                  <Ionicons
                    name="close"
                    size={24}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.modalBody}>
                <Text style={styles.securityNote}>
                  <Ionicons
                    name="shield-checkmark"
                    size={16}
                    color={colors.success}
                  />{" "}
                  All information is encrypted and secure
                </Text>

                {/* Payment Method Selector */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Payment Method</Text>
                  <View style={styles.paymentMethodContainer}>
                    <TouchableOpacity
                      style={[
                        styles.paymentMethodButton,
                        paymentMethod === "bank" &&
                          styles.paymentMethodButtonActive,
                      ]}
                      onPress={() => setPaymentMethod("bank")}
                    >
                      <Ionicons
                        name="card-outline"
                        size={20}
                        color={
                          paymentMethod === "bank"
                            ? colors.white
                            : colors.textSecondary
                        }
                      />
                      <Text
                        style={[
                          styles.paymentMethodText,
                          paymentMethod === "bank" &&
                            styles.paymentMethodTextActive,
                        ]}
                      >
                        Bank Account
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.paymentMethodButton,
                        paymentMethod === "mobile_money" &&
                          styles.paymentMethodButtonActive,
                      ]}
                      onPress={() => setPaymentMethod("mobile_money")}
                    >
                      <Ionicons
                        name="phone-portrait-outline"
                        size={20}
                        color={
                          paymentMethod === "mobile_money"
                            ? colors.white
                            : colors.textSecondary
                        }
                      />
                      <Text
                        style={[
                          styles.paymentMethodText,
                          paymentMethod === "mobile_money" &&
                            styles.paymentMethodTextActive,
                        ]}
                      >
                        Mobile Money
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Bank Details Fields */}
                {paymentMethod === "bank" && (
                  <>
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Account Holder Name</Text>
                      <View style={styles.inputWrapper}>
                        <TextInput
                          style={styles.textInput}
                          value={accountName}
                          onChangeText={setAccountName}
                          placeholder="Enter account holder name"
                          placeholderTextColor={colors.textMuted}
                        />
                      </View>
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Account Number</Text>
                      <View style={styles.inputWrapper}>
                        <TextInput
                          style={styles.textInput}
                          value={accountNumber}
                          onChangeText={setAccountNumber}
                          placeholder="Enter account number"
                          placeholderTextColor={colors.textMuted}
                          keyboardType="number-pad"
                          secureTextEntry
                        />
                      </View>
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Bank Name</Text>
                      <View style={styles.inputWrapper}>
                        <TextInput
                          style={styles.textInput}
                          value={bankName}
                          onChangeText={setBankName}
                          placeholder="Enter bank name"
                          placeholderTextColor={colors.textMuted}
                        />
                      </View>
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Routing Number</Text>
                      <View style={styles.inputWrapper}>
                        <TextInput
                          style={styles.textInput}
                          value={routingNumber}
                          onChangeText={setRoutingNumber}
                          placeholder="Enter routing number"
                          placeholderTextColor={colors.textMuted}
                          keyboardType="number-pad"
                        />
                      </View>
                    </View>
                  </>
                )}

                {/* Mobile Money Fields */}
                {paymentMethod === "mobile_money" && (
                  <>
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>
                        Mobile Money Provider
                      </Text>
                      <View style={styles.providerContainer}>
                        {["MTN", "Vodafone", "AirtelTigo"].map((provider) => (
                          <TouchableOpacity
                            key={provider}
                            style={[
                              styles.providerButton,
                              mobileMoneyProvider === provider.toLowerCase() &&
                                styles.providerButtonActive,
                            ]}
                            onPress={() =>
                              setMobileMoneyProvider(provider.toLowerCase())
                            }
                          >
                            <Text
                              style={[
                                styles.providerText,
                                mobileMoneyProvider ===
                                  provider.toLowerCase() &&
                                  styles.providerTextActive,
                              ]}
                            >
                              {provider}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Account Name</Text>
                      <View style={styles.inputWrapper}>
                        <TextInput
                          style={styles.textInput}
                          value={mobileMoneyName}
                          onChangeText={setMobileMoneyName}
                          placeholder="Enter account holder name"
                          placeholderTextColor={colors.textMuted}
                        />
                      </View>
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Mobile Money Number</Text>
                      <View style={styles.inputWrapper}>
                        <Ionicons
                          name="phone-portrait-outline"
                          size={20}
                          color={colors.primary}
                          style={styles.inputIcon}
                        />
                        <TextInput
                          style={styles.textInput}
                          value={mobileMoneyNumber}
                          onChangeText={setMobileMoneyNumber}
                          placeholder="e.g., 0244123456"
                          placeholderTextColor={colors.textMuted}
                          keyboardType="phone-pad"
                        />
                      </View>
                    </View>
                  </>
                )}

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => setBankModalVisible(false)}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.saveButton}
                    onPress={handleSaveBankDetails}
                  >
                    <Text style={styles.saveButtonText}>Save</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>

      {/* Notification Toast */}
      {notification.visible && (
        <View
          style={[
            styles.notification,
            notification.type === "success"
              ? styles.notificationSuccess
              : styles.notificationError,
          ]}
        >
          <Ionicons
            name={
              notification.type === "success"
                ? "checkmark-circle"
                : "alert-circle"
            }
            size={20}
            color="#FFFFFF"
          />
          <Text style={styles.notificationText}>{notification.message}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    position: "relative",
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingBottom: spacing.xxxl,
  },
  coverPhotoContainer: {
    width: "100%",
    height: 200,
    position: "relative",
  },
  coverPhoto: {
    width: "100%",
    height: "100%",
  },
  coverOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
  header: {
    marginTop: -60,
    padding: spacing.xxl,
    alignItems: "center",
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.white,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.md,
    position: "relative",
    overflow: "hidden",
    borderWidth: 4,
    borderColor: colors.white,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  avatarText: {
    fontSize: 40,
    fontWeight: "700",
    color: colors.primary,
  },
  uploadButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: colors.accent,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: colors.white,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  uploadIcon: {
    fontSize: 16,
  },
  vendorName: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  vendorEmail: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  statsContainer: {
    flexDirection: "row",
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radii.md,
    padding: spacing.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  section: {
    padding: spacing.lg,
  },
  menuItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.card,
    padding: spacing.md,
    borderRadius: radii.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  menuItemIcon: {
    marginRight: spacing.md,
  },
  menuItemText: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  menuItemSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  menuItemChevron: {
    fontSize: 24,
    color: colors.textMuted,
  },
  hoursSection: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.md,
    marginTop: -spacing.md,
    marginBottom: spacing.md,
    marginHorizontal: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  hourRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  hourInfo: {
    flex: 1,
  },
  hourActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  editButton: {
    padding: spacing.xs,
  },
  dayName: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: spacing.xs / 2,
  },
  hourTime: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: "center",
    paddingVertical: spacing.lg,
  },
  expandedSection: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.md,
    marginTop: -spacing.md,
    marginBottom: spacing.md,
    marginHorizontal: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  detailRow: {
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  detailLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: spacing.xs / 2,
  },
  detailValue: {
    fontSize: 15,
    color: colors.textPrimary,
    fontWeight: "500",
  },
  editDetailsButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  editDetailsButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.white,
  },
  sectionNote: {
    fontSize: 14,
    color: colors.textSecondary,
    backgroundColor: colors.primaryLight,
    padding: spacing.md,
    borderRadius: radii.sm,
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  notificationRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  notificationInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: spacing.xs / 2,
  },
  notificationSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  supportOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  supportOptionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    flex: 1,
  },
  supportOptionText: {
    flex: 1,
  },
  supportOptionTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: spacing.xs / 2,
  },
  supportOptionSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  textArea: {
    minHeight: 80,
    paddingTop: spacing.sm,
    textAlignVertical: "top",
  },
  securityNote: {
    fontSize: 13,
    color: colors.success,
    backgroundColor: colors.successLight,
    padding: spacing.md,
    borderRadius: radii.sm,
    marginBottom: spacing.md,
  },
  paymentMethodContainer: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  paymentMethodButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  paymentMethodButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  paymentMethodText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  paymentMethodTextActive: {
    color: colors.white,
  },
  providerContainer: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  providerButton: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    alignItems: "center",
  },
  providerButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  providerText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  providerTextActive: {
    color: colors.white,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.lg,
    borderRadius: radii.lg,
    padding: spacing.lg,
    width: "90%",
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  modalBody: {
    gap: spacing.md,
  },
  dayTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    textAlign: "center",
  },
  timeInputContainer: {
    gap: spacing.md,
  },
  timeInput: {
    gap: spacing.xs,
  },
  timeLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textSecondary,
    marginBottom: spacing.xs / 2,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  inputIcon: {
    marginRight: spacing.sm,
    color: colors.textSecondary,
  },
  textInput: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: "500",
  },
  modalActions: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.md,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.md,
    borderRadius: radii.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  saveButton: {
    flex: 1,
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: radii.md,
    alignItems: "center",
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  signOutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    backgroundColor: colors.error + "20",
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.error,
  },
  version: {
    textAlign: "center",
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: spacing.lg,
  },
  notification: {
    position: "absolute",
    top: spacing.xl,
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radii.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 9999,
  },
  notificationSuccess: {
    backgroundColor: "#10B981",
  },
  notificationError: {
    backgroundColor: "#EF4444",
  },
  notificationText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
