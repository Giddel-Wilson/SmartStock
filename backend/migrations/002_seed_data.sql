-- SmartStock Initial Data
-- Seed data for development and testing

-- Insert departments
INSERT INTO departments (id, name, description) VALUES
    ('550e8400-e29b-41d4-a716-446655440001', 'Sales', 'Sales and customer relations department'),
    ('550e8400-e29b-41d4-a716-446655440002', 'Warehouse', 'Inventory and warehouse management'),
    ('550e8400-e29b-41d4-a716-446655440003', 'Purchasing', 'Procurement and vendor management'),
    ('550e8400-e29b-41d4-a716-446655440004', 'Quality Control', 'Product quality assurance and testing');

-- Insert categories
INSERT INTO categories (id, name, description) VALUES
    ('650e8400-e29b-41d4-a716-446655440001', 'Electronics', 'Electronic devices and components'),
    ('650e8400-e29b-41d4-a716-446655440002', 'Furniture', 'Office and home furniture'),
    ('650e8400-e29b-41d4-a716-446655440003', 'Clothing', 'Apparel and accessories'),
    ('650e8400-e29b-41d4-a716-446655440004', 'Books', 'Books and educational materials'),
    ('650e8400-e29b-41d4-a716-446655440005', 'Tools', 'Hardware tools and equipment');

-- Insert users with hashed passwords
-- Note: Password hashes are for: SecurePassword123! (admin) and password123 (others)
INSERT INTO users (id, name, email, password_hash, role, department_id, phone, is_active, last_login, created_at) VALUES
    ('a50e8400-e29b-41d4-a716-446655440001', 'Admin User', 'admin@smartstock.com', '$2a$10$owCOYkdvK1uip2A3ipJJ/.c14UoYECr1I30zzO9SsxNRZ54rErhhS', 'manager', NULL, '+1-555-0101', true, '2025-07-05 00:00:00', '2024-01-15 00:00:00'),
    ('a50e8400-e29b-41d4-a716-446655440002', 'John Staff', 'john@smartstock.com', '$2a$10$pDPZy72xlTSA2.bS1His2ePsgKcYTGIy6.UmqlmL4xngPm9X/Q8rq', 'staff', '550e8400-e29b-41d4-a716-446655440001', '+1-555-0102', true, '2025-07-04 00:00:00', '2024-02-20 00:00:00'),
    ('a50e8400-e29b-41d4-a716-446655440003', 'Sarah Johnson', 'sarah@smartstock.com', '$2a$10$pDPZy72xlTSA2.bS1His2ePsgKcYTGIy6.UmqlmL4xngPm9X/Q8rq', 'staff', '550e8400-e29b-41d4-a716-446655440002', '+1-555-0103', true, '2025-07-03 00:00:00', '2024-03-10 00:00:00'),
    ('a50e8400-e29b-41d4-a716-446655440004', 'Mike Wilson', 'mike@smartstock.com', '$2a$10$pDPZy72xlTSA2.bS1His2ePsgKcYTGIy6.UmqlmL4xngPm9X/Q8rq', 'manager', '550e8400-e29b-41d4-a716-446655440002', '+1-555-0104', true, '2025-07-02 00:00:00', '2024-01-30 00:00:00'),
    ('a50e8400-e29b-41d4-a716-446655440005', 'Emily Davis', 'emily@smartstock.com', '$2a$10$pDPZy72xlTSA2.bS1His2ePsgKcYTGIy6.UmqlmL4xngPm9X/Q8rq', 'staff', '550e8400-e29b-41d4-a716-446655440001', '+1-555-0105', false, '2025-06-20 00:00:00', '2024-04-15 00:00:00');

-- Insert sample products
INSERT INTO products (id, name, description, sku, category_id, price, cost, quantity_in_stock, minimum_stock_level, maximum_stock_level, supplier, location) VALUES
    ('750e8400-e29b-41d4-a716-446655440001', 'Wireless Bluetooth Headphones', 'High-quality wireless headphones with noise cancellation', 'WBH-001', '650e8400-e29b-41d4-a716-446655440001', 199.99, 120.00, 45, 10, 100, 'AudioTech Inc', 'A-1-001'),
    ('750e8400-e29b-41d4-a716-446655440002', 'Office Desk Chair', 'Ergonomic office chair with lumbar support', 'ODC-002', '650e8400-e29b-41d4-a716-446655440002', 299.99, 180.00, 12, 5, 30, 'FurniturePlus', 'B-2-003'),
    ('750e8400-e29b-41d4-a716-446655440003', 'Cotton T-Shirt', 'Premium cotton t-shirt, various sizes and colors', 'CTS-003', '650e8400-e29b-41d4-a716-446655440003', 24.99, 12.00, 150, 20, 300, 'ClothingCorp', 'C-1-005'),
    ('750e8400-e29b-41d4-a716-446655440004', 'Programming Guide', 'Complete guide to modern programming practices', 'PG-004', '650e8400-e29b-41d4-a716-446655440004', 49.99, 25.00, 35, 10, 100, 'BookWorld', 'D-3-002'),
    ('750e8400-e29b-41d4-a716-446655440005', 'Electric Drill', 'Cordless electric drill with multiple bits', 'ED-005', '650e8400-e29b-41d4-a716-446655440005', 89.99, 55.00, 8, 5, 25, 'ToolMaster', 'E-1-010'),
    ('750e8400-e29b-41d4-a716-446655440006', 'Laptop Stand', 'Adjustable aluminum laptop stand', 'LS-006', '650e8400-e29b-41d4-a716-446655440001', 39.99, 22.00, 25, 10, 50, 'TechAccessories', 'A-2-005'),
    ('750e8400-e29b-41d4-a716-446655440007', 'Coffee Mug', 'Ceramic coffee mug with company logo', 'CM-007', '650e8400-e29b-41d4-a716-446655440002', 12.99, 6.00, 200, 50, 500, 'PromoProd', 'F-1-001'),
    ('750e8400-e29b-41d4-a716-446655440008', 'Wireless Mouse', 'Ergonomic wireless mouse with USB receiver', 'WM-008', '650e8400-e29b-41d4-a716-446655440001', 29.99, 15.00, 60, 15, 120, 'PeripheralTech', 'A-1-003');

-- Insert some sample inventory logs
INSERT INTO inventory_logs (product_id, user_id, type, quantity_change, previous_quantity, new_quantity, reason, reference_number) VALUES
    ('750e8400-e29b-41d4-a716-446655440001', 'a50e8400-e29b-41d4-a716-446655440002', 'purchase', 50, 0, 50, 'Initial stock purchase', 'PO-2024-001'),
    ('750e8400-e29b-41d4-a716-446655440001', 'a50e8400-e29b-41d4-a716-446655440003', 'sale', -5, 50, 45, 'Customer order #1001', 'SO-2024-001'),
    ('750e8400-e29b-41d4-a716-446655440002', 'a50e8400-e29b-41d4-a716-446655440004', 'purchase', 15, 0, 15, 'Initial stock purchase', 'PO-2024-002'),
    ('750e8400-e29b-41d4-a716-446655440002', 'a50e8400-e29b-41d4-a716-446655440002', 'sale', -3, 15, 12, 'Customer order #1002', 'SO-2024-002'),
    ('750e8400-e29b-41d4-a716-446655440003', 'a50e8400-e29b-41d4-a716-446655440003', 'purchase', 200, 0, 200, 'Bulk clothing order', 'PO-2024-003'),
    ('750e8400-e29b-41d4-a716-446655440003', 'a50e8400-e29b-41d4-a716-446655440002', 'sale', -50, 200, 150, 'Retail sales', 'SO-2024-003');

-- Insert some activity logs for demonstration
INSERT INTO activity_logs (user_id, action, resource_type, resource_id, old_values, new_values, ip_address) VALUES
    ('a50e8400-e29b-41d4-a716-446655440001', 'LOGIN', 'auth', NULL, NULL, '{"timestamp": "2025-07-05T00:00:00Z"}', '192.168.1.100'),
    ('a50e8400-e29b-41d4-a716-446655440002', 'CREATE_PRODUCT', 'product', '750e8400-e29b-41d4-a716-446655440001', NULL, '{"name": "Wireless Bluetooth Headphones", "sku": "WBH-001"}', '192.168.1.101'),
    ('a50e8400-e29b-41d4-a716-446655440003', 'UPDATE_INVENTORY', 'product', '750e8400-e29b-41d4-a716-446655440001', '{"quantity": 50}', '{"quantity": 45}', '192.168.1.102');
