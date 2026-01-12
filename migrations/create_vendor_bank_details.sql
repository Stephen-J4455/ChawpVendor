-- Create vendor bank details table with mobile money support
-- Migration: create_vendor_bank_details.sql

-- Create table for vendor bank and payment details
CREATE TABLE IF NOT EXISTS public.chawp_vendor_bank_details (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID NOT NULL REFERENCES public.chawp_vendors(id) ON DELETE CASCADE,
    
    -- Payment method type
    payment_method VARCHAR(50) NOT NULL DEFAULT 'bank', -- 'bank', 'mobile_money'
    
    -- Bank account details
    account_name VARCHAR(255),
    account_number VARCHAR(50),
    bank_name VARCHAR(255),
    routing_number VARCHAR(50),
    swift_code VARCHAR(20),
    
    -- Mobile money details
    mobile_money_provider VARCHAR(50), -- 'mtn', 'vodafone', 'airtel', 'tigo', etc.
    mobile_money_number VARCHAR(20),
    mobile_money_name VARCHAR(255),
    
    -- Status and verification
    is_verified BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT unique_vendor_payment UNIQUE(vendor_id),
    CONSTRAINT valid_payment_method CHECK (payment_method IN ('bank', 'mobile_money'))
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_vendor_bank_details_vendor_id ON public.chawp_vendor_bank_details(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_bank_details_payment_method ON public.chawp_vendor_bank_details(payment_method);

-- Enable Row Level Security
ALTER TABLE public.chawp_vendor_bank_details ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Vendors can view their own bank details
CREATE POLICY "Vendors can view own bank details"
    ON public.chawp_vendor_bank_details
    FOR SELECT
    USING (
        auth.uid() IN (
            SELECT user_id FROM public.chawp_vendors WHERE id = vendor_id
        )
    );

-- Vendors can insert their own bank details
CREATE POLICY "Vendors can insert own bank details"
    ON public.chawp_vendor_bank_details
    FOR INSERT
    WITH CHECK (
        auth.uid() IN (
            SELECT user_id FROM public.chawp_vendors WHERE id = vendor_id
        )
    );

-- Vendors can update their own bank details
CREATE POLICY "Vendors can update own bank details"
    ON public.chawp_vendor_bank_details
    FOR UPDATE
    USING (
        auth.uid() IN (
            SELECT user_id FROM public.chawp_vendors WHERE id = vendor_id
        )
    )
    WITH CHECK (
        auth.uid() IN (
            SELECT user_id FROM public.chawp_vendors WHERE id = vendor_id
        )
    );

-- Admins can view all bank details
CREATE POLICY "Admins can view all bank details"
    ON public.chawp_vendor_bank_details
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.chawp_user_profiles
            WHERE id = auth.uid()
            AND role IN ('super_admin', 'admin')
        )
    );

-- Admins can update verification status
CREATE POLICY "Admins can update verification"
    ON public.chawp_vendor_bank_details
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.chawp_user_profiles
            WHERE id = auth.uid()
            AND role IN ('super_admin', 'admin')
        )
    );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_vendor_bank_details_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS set_vendor_bank_details_updated_at ON public.chawp_vendor_bank_details;
CREATE TRIGGER set_vendor_bank_details_updated_at
    BEFORE UPDATE ON public.chawp_vendor_bank_details
    FOR EACH ROW
    EXECUTE FUNCTION update_vendor_bank_details_updated_at();

-- Create vendor preferences table for notifications
CREATE TABLE IF NOT EXISTS public.chawp_vendor_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID NOT NULL REFERENCES public.chawp_vendors(id) ON DELETE CASCADE,
    
    -- Notification preferences
    order_notifications BOOLEAN DEFAULT TRUE,
    promotion_notifications BOOLEAN DEFAULT TRUE,
    email_notifications BOOLEAN DEFAULT FALSE,
    sms_notifications BOOLEAN DEFAULT FALSE,
    
    -- App preferences
    language VARCHAR(10) DEFAULT 'en',
    currency VARCHAR(10) DEFAULT 'USD',
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT unique_vendor_preferences UNIQUE(vendor_id)
);

-- Create index for vendor preferences
CREATE INDEX IF NOT EXISTS idx_vendor_preferences_vendor_id ON public.chawp_vendor_preferences(vendor_id);

-- Enable Row Level Security for preferences
ALTER TABLE public.chawp_vendor_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies for preferences

-- Vendors can view their own preferences
CREATE POLICY "Vendors can view own preferences"
    ON public.chawp_vendor_preferences
    FOR SELECT
    USING (
        auth.uid() IN (
            SELECT user_id FROM public.chawp_vendors WHERE id = vendor_id
        )
    );

-- Vendors can insert their own preferences
CREATE POLICY "Vendors can insert own preferences"
    ON public.chawp_vendor_preferences
    FOR INSERT
    WITH CHECK (
        auth.uid() IN (
            SELECT user_id FROM public.chawp_vendors WHERE id = vendor_id
        )
    );

-- Vendors can update their own preferences
CREATE POLICY "Vendors can update own preferences"
    ON public.chawp_vendor_preferences
    FOR UPDATE
    USING (
        auth.uid() IN (
            SELECT user_id FROM public.chawp_vendors WHERE id = vendor_id
        )
    )
    WITH CHECK (
        auth.uid() IN (
            SELECT user_id FROM public.chawp_vendors WHERE id = vendor_id
        )
    );

-- Create trigger for vendor_preferences updated_at
CREATE OR REPLACE FUNCTION update_vendor_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_vendor_preferences_updated_at ON public.chawp_vendor_preferences;
CREATE TRIGGER set_vendor_preferences_updated_at
    BEFORE UPDATE ON public.chawp_vendor_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_vendor_preferences_updated_at();

-- Comments for documentation
COMMENT ON TABLE public.chawp_vendor_bank_details IS 'Stores vendor bank account and mobile money payment information';
COMMENT ON COLUMN public.chawp_vendor_bank_details.payment_method IS 'Type of payment method: bank or mobile_money';
COMMENT ON COLUMN public.chawp_vendor_bank_details.mobile_money_provider IS 'Mobile money provider: mtn, vodafone, airtel, tigo, etc.';
COMMENT ON COLUMN public.chawp_vendor_bank_details.is_verified IS 'Whether the payment details have been verified by admin';

COMMENT ON TABLE public.chawp_vendor_preferences IS 'Stores vendor notification and app preferences';
