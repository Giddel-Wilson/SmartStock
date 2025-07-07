-- Migration: Add image_url support to products
-- This adds image URL field to products for better product presentation

-- Add image_url to products table
ALTER TABLE products 
ADD COLUMN image_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN products.image_url IS 'URL to product image for display purposes';
