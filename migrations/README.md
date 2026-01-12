# Vendor Bank Details & Mobile Money Migration

## Overview

This migration creates the necessary database tables for vendor payment information, including both traditional bank accounts and mobile money options.

## Tables Created

### 1. `chawp_vendor_bank_details`

Stores vendor payment information with support for:

- **Bank Accounts**: Traditional bank account details (account name, number, bank name, routing)
- **Mobile Money**: Mobile money provider details (MTN, Vodafone, AirtelTigo, etc.)

### 2. `chawp_vendor_preferences`

Stores vendor notification and app preferences:

- Order notifications
- Promotion notifications
- Email/SMS notifications
- Language and currency preferences

## How to Run the Migration

### Option 1: Supabase Dashboard (Recommended)

1. Log in to your Supabase dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy the contents of `create_vendor_bank_details.sql`
5. Paste into the SQL editor
6. Click **Run** to execute

### Option 2: Supabase CLI

```bash
# From the project root directory
supabase db push

# Or run the specific migration file
psql -h your-db-host -U postgres -d your-db-name -f migrations/create_vendor_bank_details.sql
```

### Option 3: Direct SQL Connection

```bash
# Connect to your Supabase database
psql "postgresql://postgres:your-password@your-project-ref.supabase.co:5432/postgres"

# Run the migration
\i ChawpVendor/migrations/create_vendor_bank_details.sql
```

## Features

### Payment Methods Supported

1. **Bank Account**

   - Account Holder Name
   - Account Number (encrypted)
   - Bank Name
   - Routing Number
   - SWIFT Code (optional)

2. **Mobile Money**
   - Provider: MTN, Vodafone, AirtelTigo, etc.
   - Mobile Money Number
   - Account Holder Name

### Security Features

- Row Level Security (RLS) enabled
- Vendors can only access their own payment details
- Admins can view and verify all payment details
- Encrypted storage for sensitive information
- Verification workflow (is_verified flag)

### Notification Preferences

- Order notifications (push)
- Promotion notifications
- Email notifications
- SMS notifications
- Language preference
- Currency preference

## Database Schema

### chawp_vendor_bank_details

```sql
- id (UUID, Primary Key)
- vendor_id (UUID, Foreign Key → chawp_vendors)
- payment_method (VARCHAR) - 'bank' or 'mobile_money'
- account_name, account_number, bank_name, routing_number (for bank)
- mobile_money_provider, mobile_money_number, mobile_money_name (for mobile money)
- is_verified (BOOLEAN)
- verified_at (TIMESTAMPTZ)
- created_at, updated_at (TIMESTAMPTZ)
```

### chawp_vendor_preferences

```sql
- id (UUID, Primary Key)
- vendor_id (UUID, Foreign Key → chawp_vendors)
- order_notifications (BOOLEAN)
- promotion_notifications (BOOLEAN)
- email_notifications (BOOLEAN)
- sms_notifications (BOOLEAN)
- language (VARCHAR)
- currency (VARCHAR)
- created_at, updated_at (TIMESTAMPTZ)
```

## Row Level Security Policies

### Vendor Access

- Vendors can SELECT, INSERT, UPDATE their own records
- Filtered by `auth.uid()` matching vendor's `user_id`

### Admin Access

- Admins and super_admins can SELECT all records
- Admins can UPDATE verification status

## Verification Workflow

Admins can verify payment details:

```sql
UPDATE chawp_vendor_bank_details
SET is_verified = true, verified_at = NOW()
WHERE vendor_id = 'vendor-uuid';
```

## Mobile Money Providers Supported

- **MTN Mobile Money** (Ghana, Uganda, etc.)
- **Vodafone Cash** (Ghana)
- **AirtelTigo Money** (Ghana)
- Extensible to other providers (M-Pesa, Orange Money, etc.)

## Testing the Migration

After running the migration, verify:

```sql
-- Check if tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('chawp_vendor_bank_details', 'chawp_vendor_preferences');

-- Check RLS policies
SELECT tablename, policyname FROM pg_policies
WHERE tablename IN ('chawp_vendor_bank_details', 'chawp_vendor_preferences');

-- Test insert (as vendor)
INSERT INTO chawp_vendor_bank_details (vendor_id, payment_method, mobile_money_provider, mobile_money_number, mobile_money_name)
VALUES ('your-vendor-uuid', 'mobile_money', 'mtn', '0244123456', 'John Doe');
```

## Rollback (if needed)

```sql
-- Drop tables and dependencies
DROP TABLE IF EXISTS chawp_vendor_preferences CASCADE;
DROP TABLE IF EXISTS chawp_vendor_bank_details CASCADE;
DROP FUNCTION IF EXISTS update_vendor_bank_details_updated_at() CASCADE;
DROP FUNCTION IF EXISTS update_vendor_preferences_updated_at() CASCADE;
```

## Notes

- Unique constraint ensures one payment method per vendor
- Automatic `updated_at` timestamp on updates
- All payment information is encrypted at rest by Supabase
- Mobile money numbers should follow local format (e.g., 0244123456 for Ghana)
- SWIFT codes are optional for international transfers

## Support

If you encounter any issues:

1. Check Supabase logs in Dashboard → Database → Logs
2. Verify vendor_id exists in chawp_vendors table
3. Ensure RLS policies are correctly configured
4. Check that auth.uid() matches the vendor's user_id
