# ChawpVendor

Vendor management app for the Chawp food delivery platform.

## Overview

ChawpVendor is a React Native mobile application built with Expo that allows restaurant vendors to:

- View and manage incoming orders in real-time
- Update order status (accept, decline, preparing, ready)
- Manage menu items (availability, pricing)
- Track earnings and view payout history
- Manage restaurant profile and settings

## Features

### 📊 Dashboard

- Today's revenue and order count
- Pending orders overview
- Quick access to recent orders
- Real-time metrics

### 📦 Orders Management

- Filter orders by status (Pending, Confirmed, Preparing, Ready)
- Accept or decline new orders
- Update order status through the preparation workflow
- View customer details and contact information
- Real-time order updates via Supabase subscriptions

### 🍽️ Menu Management

- View all menu items
- Toggle item availability on/off
- View pricing and descriptions
- Quick status updates

### 💰 Payouts

- View total earnings
- Monthly payout history
- Order count per payout period
- Payout schedule information

### 👤 Profile

- Restaurant information
- Operating hours management
- Bank details for payouts
- Notification preferences
- Support access

## Tech Stack

- **Framework**: React Native with Expo
- **UI**: Custom components with Linear Gradient
- **Backend**: Supabase (PostgreSQL + Realtime)
- **State Management**: React Context API
- **Navigation**: Custom tab-based navigation

## Project Structure

```
ChawpVendor/
├── App.js                      # Main app entry with navigation
├── index.js                    # Expo entry point
├── package.json                # Dependencies
├── assets/                     # Images and icons
└── src/
    ├── theme.js               # Colors, spacing, typography
    ├── components/            # Reusable UI components
    │   ├── VendorAuthScreen.js
    │   ├── Notification.js
    │   ├── MetricCard.js
    │   ├── OrderCard.js
    │   └── EmptyState.js
    ├── config/
    │   └── supabase.js        # Supabase client config
    ├── contexts/              # React Context providers
    │   ├── VendorAuthContext.js
    │   └── NotificationContext.js
    ├── pages/                 # Main app screens
    │   ├── DashboardPage.js
    │   ├── OrdersPage.js
    │   ├── MenuPage.js
    │   ├── PayoutsPage.js
    │   └── ProfilePage.js
    └── services/              # API and data layer
        └── vendorApi.js       # Supabase queries
```

## Setup

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- Supabase account and project

### Installation

1. Clone the repository and navigate to the ChawpVendor directory:

```bash
cd ChawpVendor
```

2. Install dependencies:

```bash
npm install
```

3. Configure Supabase:

   - Open `src/config/supabase.js`
   - Replace `YOUR_SUPABASE_URL` with your Supabase project URL
   - Replace `YOUR_SUPABASE_ANON_KEY` with your Supabase anon key

4. Start the development server:

```bash
npm start
```

5. Run on your device:
   - **iOS**: Press `i` in the terminal or scan QR code with Expo Go
   - **Android**: Press `a` in the terminal or scan QR code with Expo Go
   - **Web**: Press `w` in the terminal

## Database Schema

The app expects the following Supabase tables:

### `chawp_vendors`

- `id` (uuid, primary key)
- `user_id` (uuid, references auth.users) - Links to vendor user account
- `name` (text) - Restaurant name
- `email` (text)
- `phone` (text)
- `address` (text)
- `description` (text)
- `image` (text) - Restaurant logo/image URL
- `rating` (numeric)
- `delivery_time` (text)
- `status` (text) - 'active', 'inactive', 'closed'
- `created_at` (timestamp)
- `updated_at` (timestamp)

### `chawp_orders`

- `id` (uuid, primary key)
- `vendor_id` (uuid, references chawp_vendors)
- `user_id` (uuid, references auth.users)
- `status` (text) - 'pending', 'confirmed', 'preparing', 'ready', 'delivering', 'delivered', 'cancelled'
- `total_amount` (numeric)
- `created_at` (timestamp)

### `chawp_order_items`

- `id` (uuid, primary key)
- `order_id` (uuid, references chawp_orders)
- `meal_id` (uuid, references chawp_meals)
- `quantity` (integer)
- `price` (numeric)

### `chawp_meals`

- `id` (uuid, primary key)
- `vendor_id` (uuid, references chawp_vendors)
- `title` (text)
- `description` (text)
- `price` (numeric)
- `image` (text)
- `status` (text) - 'available', 'unavailable'
- `created_at` (timestamp)

### `chawp_user_profiles`

- `id` (uuid, primary key, references auth.users)
- `full_name` (text)
- `username` (text)
- `phone` (text)
- `address` (text)

## Authentication

Vendors authenticate using email/password through Supabase Auth. The app expects:

1. A valid Supabase user account
2. A corresponding record in `chawp_vendors` table with matching `user_id`

## Real-time Features

The app uses Supabase Realtime to subscribe to order changes:

- New orders trigger notifications
- Status updates reflect immediately
- Multiple devices stay in sync

## Environment Variables

For production, consider using environment variables:

- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Your Supabase anon key

## Development

### Adding New Features

1. Create new components in `src/components/`
2. Add new pages in `src/pages/`
3. Extend API functions in `src/services/vendorApi.js`
4. Update navigation in `App.js`

### Styling

- Theme configuration: `src/theme.js`
- Use consistent spacing, colors, and typography from theme
- Follow existing component patterns

## Known Issues & Future Enhancements

- [ ] Implement order detail modal/sheet
- [ ] Add push notifications for new orders
- [ ] Implement business hours management UI
- [ ] Add bank details form
- [ ] Implement image upload for menu items
- [ ] Add order history filtering and search
- [ ] Implement analytics charts
- [ ] Add multi-language support
- [ ] Implement offline mode with data sync

## Support

For issues or questions, contact the Chawp development team.

## License

Private - All rights reserved
