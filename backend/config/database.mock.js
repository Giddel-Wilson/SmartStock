const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

// Mock data for development
const mockUsers = [
    {
        id: '1',
        name: 'Admin User',
        email: 'admin@smartstock.com',
        password_hash: '$2a$10$owCOYkdvK1uip2A3ipJJ/.c14UoYECr1I30zzO9SsxNRZ54rErhhS', // SecurePassword123!
        role: 'manager',
        is_active: true,
        created_at: new Date('2024-01-15').toISOString(),
        last_login: new Date('2025-07-05').toISOString(),
        department_id: null,
        department_name: null,
        phone: '+1-555-0101'
    },
    {
        id: '2', 
        name: 'John Staff',
        email: 'john@smartstock.com',
        password_hash: '$2a$10$pDPZy72xlTSA2.bS1His2ePsgKcYTGIy6.UmqlmL4xngPm9X/Q8rq', // password123
        role: 'staff',
        is_active: true,
        created_at: new Date('2024-02-20').toISOString(),
        last_login: new Date('2025-07-04').toISOString(),
        department_id: '550e8400-e29b-41d4-a716-446655440001',
        department_name: 'Sales',
        phone: '+1-555-0102'
    },
    {
        id: '3',
        name: 'Sarah Johnson',
        email: 'sarah@smartstock.com',
        password_hash: '$2a$10$pDPZy72xlTSA2.bS1His2ePsgKcYTGIy6.UmqlmL4xngPm9X/Q8rq', // password123
        role: 'staff',
        is_active: true,
        created_at: new Date('2024-03-10').toISOString(),
        last_login: new Date('2025-07-03').toISOString(),
        department_id: '550e8400-e29b-41d4-a716-446655440002',
        department_name: 'Warehouse',
        phone: '+1-555-0103'
    },
    {
        id: '4',
        name: 'Mike Wilson',
        email: 'mike@smartstock.com',
        password_hash: '$2a$10$pDPZy72xlTSA2.bS1His2ePsgKcYTGIy6.UmqlmL4xngPm9X/Q8rq', // password123
        role: 'manager',
        is_active: true,
        created_at: new Date('2024-01-30').toISOString(),
        last_login: new Date('2025-07-02').toISOString(),
        department_id: '550e8400-e29b-41d4-a716-446655440002',
        department_name: 'Warehouse',
        phone: '+1-555-0104'
    },
    {
        id: '5',
        name: 'Emily Davis',
        email: 'emily@smartstock.com',
        password_hash: '$2a$10$pDPZy72xlTSA2.bS1His2ePsgKcYTGIy6.UmqlmL4xngPm9X/Q8rq', // password123
        role: 'staff',
        is_active: false,
        created_at: new Date('2024-04-15').toISOString(),
        last_login: new Date('2025-06-20').toISOString(),
        department_id: '550e8400-e29b-41d4-a716-446655440001',
        department_name: 'Sales',
        phone: '+1-555-0105'
    }
];

// Mock departments data
const mockDepartments = [
    {
        id: '550e8400-e29b-41d4-a716-446655440001',
        name: 'Sales',
        description: 'Sales department',
        user_count: 2,
        created_at: new Date('2024-01-01').toISOString()
    },
    {
        id: '550e8400-e29b-41d4-a716-446655440002',
        name: 'Warehouse',
        description: 'Warehouse operations',
        user_count: 2,
        created_at: new Date('2024-01-01').toISOString()
    }
];

// For development without database, we'll create a mock pool
const pool = process.env.DATABASE_URL ? new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
}) : {
    query: async (text, params) => {
        
        // Mock user detail query (GET /api/users/:id) - Most specific pattern first
        if (text.includes('u.id, u.name, u.email, u.role, u.phone, u.is_active, u.last_login, u.created_at') &&
            text.includes('d.name as department_name, d.id as department_id') &&
            text.includes('LEFT JOIN departments d ON u.department_id = d.id') &&
            text.includes('WHERE u.id = $1')) {
            const userId = params[0];
            const user = mockUsers.find(u => u.id === userId);
            if (user) {
                return { 
                    rows: [{
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        role: user.role,
                        phone: user.phone || null,
                        is_active: user.is_active,
                        last_login: user.last_login || new Date().toISOString(),
                        created_at: user.created_at,
                        department_name: user.department_name || null,
                        department_id: user.department_id || null
                    }]
                };
            }
            return { rows: [] };
        }
        
        // Mock login query - normalize whitespace for matching
        if (text.replace(/\s+/g, ' ').includes('SELECT u.*, d.name as department_name FROM users u') && 
            text.includes('WHERE u.email = $1')) {
            const email = params[0];
            const user = mockUsers.find(u => u.email === email);
            return { rows: user ? [user] : [] };
        }

        // Mock users count query
        if (text.replace(/\s+/g, ' ').trim().includes('SELECT COUNT(*) as total FROM users u')) {
            return { rows: [{ total: mockUsers.length.toString() }] };
        }

        // Mock users listing query with pagination and filters
        if (text.replace(/\s+/g, ' ').includes('SELECT u.id, u.name, u.email, u.role, u.phone, u.is_active, u.last_login, u.created_at, d.name as department_name, d.id as department_id FROM users u')) {
            // Simple implementation - return all users (ignoring pagination for now)
            const usersWithDept = mockUsers.map(user => ({
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                phone: user.phone || null,
                is_active: user.is_active,
                last_login: user.last_login || new Date().toISOString(),
                created_at: user.created_at,
                department_name: user.department_name || null,
                department_id: user.department_id || null
            }));
            return { rows: usersWithDept };
        }

        // Mock users listing query (simpler version)
        if (text.replace(/\s+/g, ' ').includes('SELECT u.id, u.name, u.email, u.role, u.phone, u.last_login, u.created_at, u.is_active')) {
            // Return all users with department info
            const usersWithDept = mockUsers.map(user => ({
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                phone: user.phone || null,
                last_login: user.last_login || new Date().toISOString(),
                created_at: user.created_at,
                is_active: user.is_active,
                department_id: user.department_id || null,
                department_name: user.department_name || null
            }));
            return { rows: usersWithDept };
        }

        // Mock user verification query (from auth middleware)
        if (text.includes('SELECT id, name, email, role, department_id, is_active FROM users WHERE id = $1')) {
            const userId = params[0];
            const user = mockUsers.find(u => u.id === userId);
            if (user) {
                return { 
                    rows: [{
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        role: user.role,
                        department_id: user.department_id || null,
                        is_active: user.is_active
                    }]
                };
            }
            return { rows: [] };
        }

        // Mock user existence check (SELECT * FROM users WHERE id = $1)
        if (text.includes('SELECT * FROM users WHERE id = $1')) {
            const userId = params[0];
            const user = mockUsers.find(u => u.id === userId);
            if (user) {
                return { 
                    rows: [user]
                };
            }
            return { rows: [] };
        }

        // Mock user profile query (/auth/me) 
        if (text.replace(/\s+/g, ' ').includes('SELECT u.id, u.name, u.email, u.role, u.phone, u.last_login, u.created_at')) {
            const userId = params[0];
            const user = mockUsers.find(u => u.id === userId);
            if (user) {
                return { 
                    rows: [{
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        role: user.role,
                        phone: user.phone || null,
                        last_login: user.last_login || new Date().toISOString(),
                        created_at: user.created_at,
                        department_name: user.department_name,
                        department_id: user.department_id || null
                    }]
                };
            }
            return { rows: [] };
        }
        
        // Mock refresh token queries
        if (text.includes('INSERT INTO refresh_tokens')) {
            return { rows: [{ id: '1' }] };
        }
        
        if (text.includes('UPDATE users SET last_login')) {
            return { rows: [] };
        }

        // Mock user deactivation query
        if (text.includes('UPDATE users') && text.includes('SET is_active = false') && text.includes('WHERE id = $1')) {
            const userId = params[0];
            const user = mockUsers.find(u => u.id === userId);
            if (user) {
                console.log(`🔴 Mock DB: Deactivating user ${userId}`);
                user.is_active = false;
                user.updated_at = new Date().toISOString();
                return { 
                    rows: [{
                        id: user.id,
                        is_active: user.is_active,
                        updated_at: user.updated_at
                    }]
                };
            }
            return { rows: [] };
        }

        // Mock user activation query  
        if (text.includes('UPDATE users') && text.includes('SET is_active = true') && text.includes('WHERE id = $1')) {
            const userId = params[0];
            const user = mockUsers.find(u => u.id === userId);
            if (user) {
                console.log(`🟢 Mock DB: Activating user ${userId}`);
                user.is_active = true;
                user.updated_at = new Date().toISOString();
                return { 
                    rows: [{
                        id: user.id,
                        is_active: user.is_active,
                        updated_at: user.updated_at
                    }]
                };
            }
            return { rows: [] };
        }

        // Mock user update query
        if (text.includes('UPDATE users') && text.includes('WHERE id = $')) {
            const userId = params[params.length - 1]; // Last parameter is usually the ID
            const user = mockUsers.find(u => u.id === userId);
            if (user) {
                // Update the user object in mockUsers array
                if (text.includes('name = $')) {
                    const nameIndex = text.indexOf('name = $') + 8;
                    const paramNum = parseInt(text.charAt(nameIndex)) - 1;
                    if (params[paramNum]) user.name = params[paramNum];
                }
                if (text.includes('email = $')) {
                    const emailIndex = text.indexOf('email = $') + 9;
                    const paramNum = parseInt(text.charAt(emailIndex)) - 1;
                    if (params[paramNum]) user.email = params[paramNum];
                }
                if (text.includes('phone = $')) {
                    const phoneIndex = text.indexOf('phone = $') + 9;
                    const paramNum = parseInt(text.charAt(phoneIndex)) - 1;
                    if (params[paramNum]) user.phone = params[paramNum];
                }
                if (text.includes('role = $')) {
                    const roleIndex = text.indexOf('role = $') + 8;
                    const paramNum = parseInt(text.charAt(roleIndex)) - 1;
                    if (params[paramNum]) user.role = params[paramNum];
                }
                if (text.includes('department_id = $')) {
                    const deptIndex = text.indexOf('department_id = $') + 17;
                    const paramNum = parseInt(text.charAt(deptIndex)) - 1;
                    user.department_id = params[paramNum] || null;
                    // Update department name
                    if (user.department_id) {
                        const dept = mockDepartments.find(d => d.id === user.department_id);
                        user.department_name = dept ? dept.name : null;
                    } else {
                        user.department_name = null;
                    }
                }
                if (text.includes('is_active = $')) {
                    const activeIndex = text.indexOf('is_active = $') + 13;
                    const paramNum = parseInt(text.charAt(activeIndex)) - 1;
                    if (params[paramNum] !== undefined) user.is_active = params[paramNum];
                }
                
                return { 
                    rows: [{
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        role: user.role,
                        phone: user.phone || null,
                        is_active: user.is_active,
                        department_id: user.department_id || null,
                        updated_at: new Date().toISOString()
                    }]
                };
            }
            return { rows: [] };
        }
        
        // Mock inventory summary query  
        if (text.includes('COUNT(*) as total_products') && text.includes('total_inventory_value')) {
            return {
                rows: [{
                    total_products: 25,
                    active_products: 23,
                    low_stock_products: 3,
                    out_of_stock_products: 1,
                    total_inventory_value: 15499.99
                }]
            };
        }
        
        // Mock products queries
        if (text.includes('FROM products')) {
            return { 
                rows: [
                    {
                        id: '1',
                        name: 'Sample Product',
                        sku: 'PROD-001',
                        quantity: 50,
                        unit_price: 29.99,
                        low_stock_threshold: 10,
                        is_active: true,
                        created_at: new Date().toISOString(),
                        category_name: 'Electronics'
                    }
                ]
            };
        }
        
        // Mock categories queries
        if (text.includes('FROM categories')) {
            return {
                rows: [
                    {
                        id: '1',
                        name: 'Electronics',
                        description: 'Electronic devices and accessories',
                        product_count: 15,
                        total_value: 1299.99,
                        created_at: new Date().toISOString()
                    },
                    {
                        id: '2',
                        name: 'Clothing',
                        description: 'Apparel and accessories',
                        product_count: 8,
                        total_value: 599.99,
                        created_at: new Date().toISOString()
                    }
                ]
            };
        }
        
        // Mock department name duplicate check (MUST come before general departments query)
        if (text.includes('SELECT id FROM departments WHERE LOWER(name) = LOWER($1)')) {
            const searchName = params[0].toLowerCase();
            const existingDept = mockDepartments.find(dept => dept.name.toLowerCase() === searchName);
            return { rows: existingDept ? [{ id: existingDept.id }] : [] };
        }
        
        // Mock departments queries
        if (text.includes('FROM departments')) {
            return {
                rows: mockDepartments
            };
        }
        
        // Mock recent inventory movements query
        if (text.includes('FROM inventory_logs il') && text.includes('ORDER BY il.timestamp DESC')) {
            return { 
                rows: [
                    {
                        id: '1',
                        product_id: '1',
                        user_id: '1',
                        change_type: 'restock',
                        quantity_before: 30,
                        quantity_after: 50,
                        quantity_changed: 20,
                        notes: 'Weekly restock delivery',
                        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 min ago
                        product_name: 'Wireless Bluetooth Headphones',
                        sku: 'WBH-001',
                        user_name: 'Admin User'
                    },
                    {
                        id: '2',
                        product_id: '2',
                        user_id: '2',
                        change_type: 'sale',
                        quantity_before: 15,
                        quantity_after: 12,
                        quantity_changed: -3,
                        notes: 'Customer purchase #1234',
                        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
                        product_name: 'USB-C Cable',
                        sku: 'USBC-001',
                        user_name: 'John Staff'
                    },
                    {
                        id: '3',
                        product_id: '3',
                        user_id: '1',
                        change_type: 'adjustment',
                        quantity_before: 8,
                        quantity_after: 5,
                        quantity_changed: -3,
                        notes: 'Damaged items removed',
                        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(), // 4 hours ago
                        product_name: 'Smartphone Case',
                        sku: 'SC-001',
                        user_name: 'Admin User'
                    }
                ]
            };
        }

        // Mock low stock products query
        if (text.includes('WHERE p.quantity <= p.low_stock_threshold') || text.includes('p.is_low_stock')) {
            return { 
                rows: [
                    {
                        id: '4',
                        name: 'Wireless Mouse',
                        sku: 'WM-001',
                        quantity: 3,
                        unit_price: 29.99,
                        low_stock_threshold: 10,
                        is_active: true,
                        is_low_stock: true,
                        created_at: new Date('2024-03-01').toISOString(),
                        category_name: 'Electronics'
                    },
                    {
                        id: '5',
                        name: 'Desk Lamp',
                        sku: 'DL-001',
                        quantity: 2,
                        unit_price: 45.99,
                        low_stock_threshold: 5,
                        is_active: true,
                        is_low_stock: true,
                        created_at: new Date('2024-02-15').toISOString(),
                        category_name: 'Office Supplies'
                    },
                    {
                        id: '6',
                        name: 'Coffee Mug',
                        sku: 'CM-001',
                        quantity: 0,
                        unit_price: 12.99,
                        low_stock_threshold: 15,
                        is_active: true,
                        is_low_stock: true,
                        created_at: new Date('2024-01-20').toISOString(),
                        category_name: 'Office Supplies'
                    }
                ]
            };
        }
        
        // Mock department validation query
        if (text.includes('SELECT id FROM departments WHERE id = $1')) {
            const deptId = params[0];
            const validDeptIds = ['550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002'];
            return { rows: validDeptIds.includes(deptId) ? [{ id: deptId }] : [] };
        }

        // Mock user existence check
        if (text.includes('SELECT id FROM users WHERE email = $1')) {
            const email = params[0];
            const existingUser = mockUsers.find(u => u.email === email);
            return { rows: existingUser ? [{ id: existingUser.id }] : [] };
        }

        // Mock user creation
        if (text.includes('INSERT INTO users (name, email, password_hash, role, department_id, phone)')) {
            const newUserId = (mockUsers.length + 1).toString();
            return { 
                rows: [{
                    id: newUserId,
                    name: params[0],
                    email: params[1],
                    role: params[3],
                    department_id: params[4],
                    phone: params[5],
                    created_at: new Date().toISOString()
                }]
            };
        }

        // Mock department creation
        if (text.includes('INSERT INTO departments (name, description)')) {
            const newDeptId = `550e8400-e29b-41d4-a716-446655440${String(mockDepartments.length + 1).padStart(3, '0')}`;
            const newDepartment = {
                id: newDeptId,
                name: params[0],
                description: params[1],
                user_count: 0,
                created_at: new Date().toISOString()
            };
            
            // Add to mock departments array
            mockDepartments.push(newDepartment);
            
            return { 
                rows: [newDepartment]
            };
        }

        // Mock activity logs insertion
        if (text.includes('INSERT INTO activity_logs')) {
            return { rows: [{ id: '1' }] };
        }

        // Mock top selling products query
        if (text.includes('SUM(ABS(il.quantity_changed)) as total_sold') && text.includes('WHERE il.change_type = \'sale\'')) {
            return { 
                rows: [
                    {
                        name: 'Wireless Bluetooth Headphones',
                        sku: 'WBH-001',
                        total_sold: 25
                    },
                    {
                        name: 'USB-C Cable',
                        sku: 'USBC-001',
                        total_sold: 18
                    },
                    {
                        name: 'Smartphone Case',
                        sku: 'SC-001',
                        total_sold: 12
                    }
                ]
            };
        }

        // Mock inventory logs queries (more specific - NOT for top selling)
        if (text.includes('FROM inventory_logs il') && !text.includes('SUM(ABS(il.quantity_changed))')) {
            return { 
                rows: [
                    {
                        id: '1',
                        product_id: '1',
                        user_id: '1',
                        change_type: 'restock',
                        quantity_before: 30,
                        quantity_after: 50,
                        quantity_changed: 20,
                        notes: 'Weekly restock',
                        timestamp: new Date().toISOString(),
                        product_name: 'Sample Product',
                        sku: 'PROD-001',
                        user_name: 'Admin User'
                    }
                ]
            };
        }

        // Mock departments count query
        if (text.replace(/\s+/g, ' ').includes('COUNT(u.id) as user_count FROM departments d')) {
            return {
                rows: [
                    {
                        id: '550e8400-e29b-41d4-a716-446655440001',
                        name: 'Sales',
                        description: 'Sales department',
                        user_count: 2,
                        created_at: new Date('2024-01-01').toISOString(),
                        updated_at: new Date('2024-01-01').toISOString()
                    },
                    {
                        id: '550e8400-e29b-41d4-a716-446655440002',
                        name: 'Warehouse',
                        description: 'Warehouse operations',
                        user_count: 2,
                        created_at: new Date('2024-01-01').toISOString(),
                        updated_at: new Date('2024-01-01').toISOString()
                    }
                ]
            };
        }

        // Mock categories count query  
        if (text.replace(/\s+/g, ' ').includes('COUNT(p.id) as product_count') && text.includes('FROM categories c')) {
            return {
                rows: [
                    {
                        id: '1',
                        name: 'Electronics',
                        description: 'Electronic devices and accessories',
                        product_count: 15,
                        total_value: 1299.99,
                        created_at: new Date('2024-01-01').toISOString(),
                        updated_at: new Date('2024-01-01').toISOString()
                    },
                    {
                        id: '2',
                        name: 'Clothing',
                        description: 'Apparel and accessories',
                        product_count: 8,
                        total_value: 599.99,
                        created_at: new Date('2024-01-01').toISOString(),
                        updated_at: new Date('2024-01-01').toISOString()
                    }
                ]
            };
        }

        // Mock products count queries
        if (text.includes('COUNT(*) as total FROM products p')) {
            return { rows: [{ total: '23' }] };
        }

        // Default empty response
        return { rows: [] };
    }
};

if (process.env.DATABASE_URL) {
    // Test database connection
    pool.on('connect', () => {
        console.log('📊 Connected to PostgreSQL database');
    });

    pool.on('error', (err) => {
        console.error('❌ Database connection error:', err);
    });
} else {
    console.log('📊 Using mock database for development');
    console.log('Demo login credentials:');
    console.log('Manager: admin@smartstock.com / SecurePassword123!');
    console.log('Staff: john@smartstock.com / password123');
}

module.exports = {
    query: (text, params) => {
        return pool.query(text, params);
    },
    end: () => pool.end()
};
