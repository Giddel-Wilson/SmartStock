export interface User {
  id: string
  name: string
  email: string
  role: 'manager' | 'staff'
  department_id?: string
  department_name?: string
  phone?: string
  is_active: boolean
  last_login?: string
  created_at: string
  updated_at?: string
}

export interface Department {
  id: string
  name: string
  description?: string
  user_count?: number
  created_at: string
  updated_at?: string
}

export interface Category {
  id: string
  name: string
  description?: string
  product_count?: number
  total_value?: number
  created_at: string
  updated_at?: string
}

export interface Product {
  id: string
  name: string
  sku: string
  category_id?: string
  category_name?: string
  department_id?: string
  department_name?: string
  quantity_in_stock: number
  price: number
  cost?: number
  minimum_stock_level: number
  maximum_stock_level?: number
  supplier?: string
  description?: string
  location?: string
  is_active: boolean
  is_low_stock?: boolean
  created_at: string
  updated_at?: string
}

export interface InventoryLog {
  id: string
  product_id: string
  product_name?: string
  sku?: string
  user_id: string
  user_name?: string
  type: 'adjustment' | 'sale' | 'purchase' | 'transfer' | 'damage' | 'return'
  quantity_change: number
  previous_quantity: number
  new_quantity: number
  reason?: string
  reference_number?: string
  created_at: string
}

export interface StockAlert {
  id: string
  productId: string
  productName?: string
  sku?: string
  alertType: string
  message: string
  isRead: boolean
  alertSent: boolean
  createdAt: string
}

export interface ActivityLog {
  id: string
  userId: string
  userName?: string
  userEmail?: string
  action: string
  entityType: string
  entityId?: string
  details?: any
  ipAddress?: string
  userAgent?: string
  timestamp: string
}

export interface InventorySummary {
  stats: {
    totalProducts: number
    activeProducts: number
    lowStockProducts: number
    outOfStockProducts: number
    totalInventoryValue: number
  }
  recentMovements: InventoryLog[]
  lowStockProducts: Product[]
  topSellingProducts: Array<{
    name: string
    sku: string
    totalSold: number
  }>
}

export interface ApiResponse<T> {
  data: T
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export interface FormErrors {
  [key: string]: string
}

export interface ReportFilter {
  startDate?: string
  endDate?: string
  categoryId?: string
  productId?: string
  changeType?: string
  userId?: string
  format?: 'json' | 'pdf' | 'csv'
}

export interface InventoryReportProduct {
  id: string
  name: string
  sku: string
  quantity: number
  unit_price: number
  low_stock_threshold: number
  total_value: number
  category_name?: string
  is_low_stock: boolean
  total_stock_in: number
  total_stock_out: number
  net_movement: number
}

export interface LowStockReportProduct extends Product {
  units_needed: number
  stock_percentage: number
}

export interface InventoryMovementReport {
  movements: InventoryLog[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
  generatedAt: string
  filters: ReportFilter
}

export interface InventorySummaryReport {
  products: InventoryReportProduct[]
  summary: {
    totalProducts: number
    totalValue: number
    lowStockCount: number
    outOfStockCount: number
  }
  generatedAt: string
  filters: ReportFilter
}

export interface LowStockReport {
  lowStockProducts: LowStockReportProduct[]
  totalCount: number
  generatedAt: string
}

export interface SalesReport {
  period: string
  totalSales: number
  totalRevenue: number
  topProducts: Array<{
    name: string
    sku: string
    totalSold: number
    revenue: number
  }>
  salesByCategory: Array<{
    categoryName: string
    totalSold: number
    revenue: number
  }>
  generatedAt: string
}
