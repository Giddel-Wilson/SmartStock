-- Migration: Add department support to products
-- This adds department-based product assignment and access control

-- Add department_id to products table
ALTER TABLE products 
ADD COLUMN department_id UUID REFERENCES departments(id) ON DELETE SET NULL;

-- Create index for department-based queries
CREATE INDEX idx_products_department ON products(department_id);

-- Add department_name to the products view (for easier queries)
-- This will be handled in the application layer for now

-- Add constraint to ensure managers can manage all departments
-- Staff can only manage products in their department
-- This will be enforced in the application layer
