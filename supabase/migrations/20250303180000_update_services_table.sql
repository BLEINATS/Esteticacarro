/*
  # Update Services Table
  Add missing columns for full service catalog features.

  ## Query Description:
  This migration adds columns to the 'services' table to support return alerts, landing page visibility, and images.
  It ensures the database schema matches the frontend application logic.

  ## Metadata:
  - Schema-Category: "Structural"
  - Impact-Level: "Low"
  - Requires-Backup: false
  - Reversible: true

  ## Structure Details:
  - return_interval_days (INTEGER)
  - show_on_landing_page (BOOLEAN)
  - image_url (TEXT)
*/

ALTER TABLE services 
ADD COLUMN IF NOT EXISTS return_interval_days INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS show_on_landing_page BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS image_url TEXT;
