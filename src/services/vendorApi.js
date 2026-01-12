import { supabase } from "../config/supabase";

// ==================== Dashboard & Analytics ====================

export async function getVendorStats(vendorId) {
  try {
    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString();

    // Get total orders count
    const { count: totalOrders } = await supabase
      .from("chawp_orders")
      .select("*", { count: "exact", head: true })
      .eq("vendor_id", vendorId);

    // Get today's orders
    const { data: todayOrders } = await supabase
      .from("chawp_orders")
      .select("total_amount")
      .eq("vendor_id", vendorId)
      .gte("created_at", todayStr);

    const todayRevenue =
      todayOrders?.reduce(
        (sum, order) => sum + parseFloat(order.total_amount || 0),
        0
      ) || 0;

    // Get pending orders count
    const { count: pendingCount } = await supabase
      .from("chawp_orders")
      .select("*", { count: "exact", head: true })
      .eq("vendor_id", vendorId)
      .eq("status", "pending");

    // Get total revenue
    const { data: allOrders } = await supabase
      .from("chawp_orders")
      .select("total_amount")
      .eq("vendor_id", vendorId);

    const totalRevenue =
      allOrders?.reduce(
        (sum, order) => sum + parseFloat(order.total_amount || 0),
        0
      ) || 0;

    return {
      success: true,
      data: {
        totalOrders: totalOrders || 0,
        todayRevenue,
        pendingOrders: pendingCount || 0,
        totalRevenue,
      },
    };
  } catch (error) {
    console.error("Error fetching vendor stats:", error);
    return { success: false, error: error.message };
  }
}

// ==================== Orders Management ====================

export async function fetchVendorOrders(vendorId, filters = {}) {
  try {
    let query = supabase
      .from("chawp_orders")
      .select(
        `
        *,
        chawp_user_profiles(full_name, username, phone, address)
      `
      )
      .eq("vendor_id", vendorId)
      .order("created_at", { ascending: false });

    if (filters.status) {
      query = query.eq("status", filters.status);
    }

    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    const { data: orders, error } = await query;
    if (error) throw error;

    // Fetch order items for each order
    const ordersWithItems = await Promise.all(
      (orders || []).map(async (order) => {
        const { data: items } = await supabase
          .from("chawp_order_items")
          .select(
            `
            *,
            chawp_meals(title, image, price)
          `
          )
          .eq("order_id", order.id);

        return { ...order, items: items || [] };
      })
    );

    return { success: true, data: ordersWithItems };
  } catch (error) {
    console.error("Error fetching vendor orders:", error);
    return { success: false, error: error.message };
  }
}

export async function updateOrderStatus(orderId, status) {
  try {
    const { data, error } = await supabase
      .from("chawp_orders")
      .update({ status })
      .eq("id", orderId)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error("Error updating order status:", error);
    return { success: false, error: error.message };
  }
}

export async function acceptOrder(orderId) {
  return updateOrderStatus(orderId, "confirmed");
}

export async function declineOrder(orderId) {
  return updateOrderStatus(orderId, "cancelled");
}

export async function markOrderPreparing(orderId) {
  return updateOrderStatus(orderId, "preparing");
}

export async function markOrderReady(orderId) {
  return updateOrderStatus(orderId, "ready");
}

// ==================== Menu Management ====================

export async function fetchVendorMeals(vendorId) {
  try {
    const { data, error } = await supabase
      .from("chawp_meals")
      .select("*")
      .eq("vendor_id", vendorId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return { success: true, data: data || [] };
  } catch (error) {
    console.error("Error fetching vendor meals:", error);
    return { success: false, error: error.message };
  }
}

export async function createMeal(mealData) {
  try {
    const { data, error } = await supabase
      .from("chawp_meals")
      .insert([mealData])
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error("Error creating meal:", error);
    return { success: false, error: error.message };
  }
}

export async function updateMeal(mealId, updates) {
  try {
    const { data, error } = await supabase
      .from("chawp_meals")
      .update(updates)
      .eq("id", mealId)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error("Error updating meal:", error);
    return { success: false, error: error.message };
  }
}

export async function toggleMealAvailability(mealId, currentStatus) {
  const newStatus = currentStatus === "available" ? "unavailable" : "available";
  return updateMeal(mealId, { status: newStatus });
}

export async function deleteMeal(mealId) {
  try {
    const { error } = await supabase
      .from("chawp_meals")
      .delete()
      .eq("id", mealId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error("Error deleting meal:", error);
    return { success: false, error: error.message };
  }
}

// ==================== Payouts ====================

export async function fetchPayoutHistory(vendorId) {
  try {
    // Fetch from the chawp_vendor_payouts table
    const { data: payouts, error } = await supabase
      .from("chawp_vendor_payouts")
      .select("*")
      .eq("vendor_id", vendorId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching payouts:", error);
      throw error;
    }

    // If no payouts table exists yet, return empty array
    if (!payouts) {
      return { success: true, data: [] };
    }

    // Format payouts data for the UI
    const formattedPayouts = payouts.map((payout) => ({
      id: payout.id,
      amount: parseFloat(payout.amount || 0),
      status: payout.status,
      payment_method: payout.payment_method,
      reference_number: payout.reference_number,
      notes: payout.notes,
      created_at: payout.created_at,
      completed_at: payout.completed_at,
    }));

    return {
      success: true,
      data: formattedPayouts,
    };
  } catch (error) {
    console.error("Error fetching payout history:", error);
    return { success: false, error: error.message };
  }
}

// ==================== Real-time Subscriptions ====================

export function subscribeToVendorOrders(vendorId, callback) {
  const subscription = supabase
    .channel(`vendor_orders_${vendorId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "chawp_orders",
        filter: `vendor_id=eq.${vendorId}`,
      },
      (payload) => {
        callback(payload);
      }
    )
    .subscribe();

  return subscription;
}

export function unsubscribeFromChannel(subscription) {
  if (subscription) {
    supabase.removeChannel(subscription);
  }
}

// ==================== Vendor Hours Management ====================

export async function fetchVendorHours(vendorId) {
  try {
    const { data, error } = await supabase
      .from("chawp_vendor_hours")
      .select("*")
      .eq("vendor_id", vendorId)
      .order("day_of_week", { ascending: true });

    if (error) throw error;

    // If no hours exist, create default hours for all days
    if (!data || data.length === 0) {
      const defaultHours = [];

      for (let i = 0; i < 7; i++) {
        defaultHours.push({
          vendor_id: vendorId,
          day_of_week: i,
          is_closed: false,
          open_time: "08:00:00",
          close_time: "22:00:00",
        });
      }

      const { data: insertedData, error: insertError } = await supabase
        .from("chawp_vendor_hours")
        .insert(defaultHours)
        .select();

      if (insertError) throw insertError;
      return { success: true, data: insertedData };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error fetching vendor hours:", error);
    return { success: false, error: error.message };
  }
}

export async function updateVendorHourStatus(hourId, isClosed) {
  try {
    const { data, error } = await supabase
      .from("chawp_vendor_hours")
      .update({ is_closed: isClosed })
      .eq("id", hourId)
      .select();

    if (error) throw error;
    return { success: true, data: data[0] };
  } catch (error) {
    console.error("Error updating vendor hour status:", error);
    return { success: false, error: error.message };
  }
}

export async function updateVendorHourTimes(hourId, openTime, closeTime) {
  try {
    const { data, error } = await supabase
      .from("chawp_vendor_hours")
      .update({
        open_time: openTime,
        close_time: closeTime,
      })
      .eq("id", hourId)
      .select();

    if (error) throw error;
    return { success: true, data: data[0] };
  } catch (error) {
    console.error("Error updating vendor hour times:", error);
    return { success: false, error: error.message };
  }
}
