import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../config/supabase";

const VendorAuthContext = createContext({});

const VENDOR_STORAGE_KEY = "@chawp_vendor_profile";

export const useVendorAuth = () => {
  const context = useContext(VendorAuthContext);
  if (!context) {
    throw new Error("useVendorAuth must be used within a VendorAuthProvider");
  }
  return context;
};

export const VendorAuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load vendor from cache
  const loadVendorFromCache = async () => {
    try {
      const cachedVendor = await AsyncStorage.getItem(VENDOR_STORAGE_KEY);
      if (cachedVendor) {
        setVendor(JSON.parse(cachedVendor));
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error loading vendor from cache:", error);
      return false;
    }
  };

  // Save vendor to cache
  const saveVendorToCache = async (vendorData) => {
    try {
      await AsyncStorage.setItem(
        VENDOR_STORAGE_KEY,
        JSON.stringify(vendorData),
      );
    } catch (error) {
      console.error("Error saving vendor to cache:", error);
    }
  };

  // Clear vendor from cache
  const clearVendorCache = async () => {
    try {
      await AsyncStorage.removeItem(VENDOR_STORAGE_KEY);
    } catch (error) {
      console.error("Error clearing vendor cache:", error);
    }
  };

  useEffect(() => {
    // Initialize authentication
    const initAuth = async () => {
      try {
        // First, try to load cached vendor profile
        const hasCachedVendor = await loadVendorFromCache();

        // Get current session from Supabase
        const {
          data: { session },
        } = await supabase.auth.getSession();

        setUser(session?.user ?? null);

        if (session?.user) {
          // Load fresh vendor profile from database
          await loadVendorProfile(session.user.id);
        } else {
          // No session, clear cached data
          setVendor(null);
          await clearVendorCache();
          setLoading(false);
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
        setLoading(false);
      }
    };

    initAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event);

      setUser(session?.user ?? null);

      if (event === "SIGNED_IN" && session?.user) {
        setLoading(true); // Keep loading while fetching vendor profile
        await loadVendorProfile(session.user.id);
      } else if (event === "SIGNED_OUT") {
        setVendor(null);
        await clearVendorCache();
        setLoading(false);
      } else if (event === "TOKEN_REFRESHED" && session?.user) {
        // Optionally refresh vendor profile on token refresh
        console.log("Token refreshed");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadVendorProfile = async (userId) => {
    try {
      // Try to get vendor profile linked to this user
      const { data, error } = await supabase
        .from("chawp_vendors")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (error) {
        console.error("Error loading vendor profile:", error);
        setVendor(null);
        await clearVendorCache();
      } else {
        setVendor(data);
        // Save to cache for persistence
        await saveVendorToCache(data);
      }
    } catch (error) {
      console.error("Error loading vendor profile:", error);
      setVendor(null);
      await clearVendorCache();
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error("Error signing in:", error);
      return { success: false, error: error.message };
    }
  };

  const signOut = async () => {
    try {
      // Clear cache first
      await clearVendorCache();

      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      // Clear state
      setUser(null);
      setVendor(null);

      return { success: true };
    } catch (error) {
      console.error("Error signing out:", error);
      return { success: false, error: error.message };
    }
  };

  const updateVendorProfile = async (updates) => {
    if (!vendor) return { success: false, error: "No vendor profile" };

    try {
      const { data, error } = await supabase
        .from("chawp_vendors")
        .update(updates)
        .eq("id", vendor.id)
        .select()
        .single();

      if (error) throw error;

      // Update state and cache
      setVendor(data);
      await saveVendorToCache(data);

      return { success: true, data };
    } catch (error) {
      console.error("Error updating vendor profile:", error);
      return { success: false, error: error.message };
    }
  };

  const refreshVendor = async () => {
    if (!user) return;
    await loadVendorProfile(user.id);
  };

  const value = {
    user,
    vendor,
    loading,
    signIn,
    signOut,
    updateVendorProfile,
    refreshVendor,
    isAuthenticated: !!user,
    hasVendorProfile: !!vendor,
  };

  return (
    <VendorAuthContext.Provider value={value}>
      {children}
    </VendorAuthContext.Provider>
  );
};
