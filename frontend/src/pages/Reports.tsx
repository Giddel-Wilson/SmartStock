import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts'
import { 
  ChartBarIcon, 
  DocumentTextIcon, 
  ArrowTrendingDownIcon, 
  ExclamationTriangleIcon,
  ArrowDownTrayIcon,
  CalendarIcon
} from '@heroicons/react/24/outline'
import { 
  InventorySummaryReport, 
  LowStockReport, 
  InventoryMovementReport, 
  ReportFilter,
  Category 
} from '../../../shared/types'
import LoadingSpinner from '../components/LoadingSpinner'
import { useAuthStore } from '../stores/authStore'

// Dynamic API base URL with enhanced logging
const getApiBaseUrl = () => {
  const protocol = window.location.protocol;
  const hostname = window.location.hostname;
  
  console.log('🌐 Current hostname:', hostname);
  console.log('🔒 Current protocol:', protocol);
  
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    const url = 'http://localhost:3001/api';
    console.log('📍 Using localhost API URL:', url);
    return url;
  }
  
  const url = `${protocol}//${hostname}:3001/api`;
  console.log('📍 Using network API URL:', url);
  return url;
};

const API_BASE_URL = getApiBaseUrl();
console.log('🔗 Final Reports API Base URL:', API_BASE_URL);

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D']

interface ReportStats {
  totalProducts: number
  totalValue: number
  lowStockCount: number
  totalMovements: number
  salesThisMonth: number
  purchasesThisMonth: number
}

export default function Reports() {
  const navigate = useNavigate()
  const { user, accessToken, isAuthenticated, logout } = useAuthStore()
  const [activeTab, setActiveTab] = useState<string>('overview')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [serverStatus, setServerStatus] = useState<'unknown' | 'running' | 'offline'>('unknown')
  const [filters, setFilters] = useState<ReportFilter>({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    format: 'json'
  })
  
  // Data states
  const [reportStats, setReportStats] = useState<ReportStats | null>(null)
  const [inventorySummary, setInventorySummary] = useState<InventorySummaryReport | null>(null)
  const [lowStockReport, setLowStockReport] = useState<LowStockReport | null>(null)
  const [movementReport, setMovementReport] = useState<InventoryMovementReport | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [categoryData, setCategoryData] = useState<any[]>([])
  const [movementTrends, setMovementTrends] = useState<any[]>([])

  const tabs = [
    { id: 'overview', name: 'Overview', icon: ChartBarIcon },
    { id: 'inventory', name: 'Inventory Summary', icon: DocumentTextIcon },
    { id: 'low-stock', name: 'Low Stock', icon: ExclamationTriangleIcon },
    { id: 'movements', name: 'Stock Movements', icon: ArrowTrendingDownIcon },
  ]

  // Function to test server connectivity
  const testServerConnectivity = async (url: string): Promise<boolean> => {
    try {
      console.log('🧪 Testing server connectivity to:', url);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      const response = await fetch(`${url}/health`, {
        method: 'GET',
        signal: controller.signal,
        cache: 'no-cache'
      });
      
      clearTimeout(timeoutId);
      console.log('✅ Server connectivity test result:', response.status);
      return response.ok;
    } catch (error) {
      console.error('❌ Server connectivity test failed:', error);
      if (error instanceof Error) {
        console.error('Error details:', error.message);
        if (error.name === 'AbortError') {
          console.error('💡 Request timed out - server may be slow or unreachable');
        }
      }
      return false;
    }
  };

  // Add debug logging
  useEffect(() => {
    console.log('Reports component mounted')
    console.log('Auth state:', { user: user?.email, role: user?.role, departmentId: user?.departmentId, department_id: (user as any)?.department_id, isAuthenticated, hasToken: !!accessToken })
    
    const initializeReports = async () => {
      // First check if server is running
      const serverRunning = await checkServerStatus()
      
      if (!serverRunning) {
        setError('Backend server is not running. Please start the server and try again.')
        return
      }
      
      if (!isAuthenticated || !accessToken) {
        console.log('Not authenticated, setting error message')
        setError('Authentication required. Please login again.')
        return
      }
      
      fetchCategories()
      fetchReportStats()
    }
    
    initializeReports()
  }, [])

  useEffect(() => {
    console.log('Active tab changed to:', activeTab)
    if (activeTab !== 'overview' && isAuthenticated && accessToken) {
      fetchReportData()
    }
  }, [activeTab, filters])

  // Periodic server status check
  useEffect(() => {
    const interval = setInterval(checkServerStatus, 30000) // Check every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const handleAuthError = () => {
    console.log('Authentication error, logging out and redirecting')
    logout()
    navigate('/login')
  }

  const fetchCategories = async () => {
    try {
      if (!accessToken) {
        console.error('No auth token found')
        setError('Authentication required. Please login again.')
        return
      }
      
      const response = await fetch(`${API_BASE_URL}/categories`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      })
      
      if (response.status === 401) {
        console.error('Authentication failed - token may be expired')
        setError('Authentication failed. Please login again.')
        return
      }
      
      if (response.ok) {
        const data = await response.json()
        setCategories(data.data || [])
      } else {
        console.error('Failed to fetch categories:', response.status, response.statusText)
        setError(`Failed to fetch categories: ${response.status}`)
      }
    } catch (err) {
      console.error('Error fetching categories:', err)
      if (err instanceof TypeError && err.message.includes('fetch')) {
        setError('Backend server is not running. Please start the server and try again.')
      } else {
        setError('Network error. Please check your connection and try again.')
      }
    }
  }

  const fetchReportStats = async () => {
    try {
      if (!accessToken) {
        console.error('No auth token found')
        setError('Authentication required. Please login again.')
        return
      }

      // Check permissions for report stats
      if (!user) {
        setError('User information not available. Please login again.')
        return
      }

      // Workers must have a department assignment to view reports
      // Admins (managers) can view all reports
      const userDepartmentId = user.departmentId || (user as any).department_id
      if (user.role === 'staff' && !userDepartmentId) {
        setError('You must be assigned to a department to view reports. Contact your administrator.')
        return
      }

      // Build URL with department filter for staff
      let url = `${API_BASE_URL}/inventory/summary`
      if (user.role === 'staff' && userDepartmentId) {
        url += `?departmentId=${userDepartmentId}`
      }
      
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      })
      
      if (response.status === 401) {
        setError('Authentication failed. Please login again.')
        return
      }
      
      if (response.ok) {
        const data = await response.json()
        console.log('Inventory summary data:', data) // Debug log
        
        // Handle the response structure properly
        const stats = data.stats || {}
        const recentMovements = data.recentMovements || []
        
        setReportStats({
          totalProducts: parseInt(stats.total_products) || parseInt(stats.totalProducts) || 0,
          totalValue: parseFloat(stats.total_inventory_value) || parseFloat(stats.totalInventoryValue) || 0,
          lowStockCount: parseInt(stats.low_stock_products) || parseInt(stats.lowStockProducts) || 0,
          totalMovements: recentMovements.length || 0,
          salesThisMonth: 0, // This would need a separate endpoint
          purchasesThisMonth: 0 // This would need a separate endpoint
        })

        // Transform category data for pie chart from categories state
        if (categories.length > 0) {
          const categoryStats = categories.map(cat => ({
            name: cat.name,
            value: cat.total_value || 0,
            count: cat.product_count || 0
          }))
          setCategoryData(categoryStats)
        } else {
          // Fallback: create some dummy data for visualization
          const totalValue = parseFloat(stats.total_inventory_value) || parseFloat(stats.totalInventoryValue) || 0
          setCategoryData([
            { name: 'Electronics', value: totalValue * 0.4, count: 5 },
            { name: 'Furniture', value: totalValue * 0.3, count: 3 },
            { name: 'Other', value: totalValue * 0.3, count: 2 }
          ])
        }
      } else {
        const errorText = await response.text()
        console.error('Failed to fetch report stats:', response.status, errorText)
        setError(`Failed to fetch inventory data: ${response.status}`)
      }
    } catch (err) {
      console.error('Error fetching report stats:', err)
      if (err instanceof TypeError && err.message.includes('fetch')) {
        setError('Backend server is not running. Please start the server and try again.')
      } else {
        setError('Network error. Please check your connection and try again.')
      }
    }
  }

  const fetchReportData = async () => {
    setLoading(true)
    setError('')
    
    try {
      if (!accessToken) {
        setError('Authentication required. Please login again.')
        setLoading(false)
        handleAuthError()
        return
      }

      // Check if user has permission to view reports
      if (!user) {
        setError('User information not available. Please login again.')
        setLoading(false)
        handleAuthError()
        return
      }

      // Workers must have a department assignment to view reports
      // Admins (managers) can view all reports  
      const userDepartmentId = user.departmentId || (user as any).department_id
      if (user.role === 'staff' && !userDepartmentId) {
        setError('You must be assigned to a department to view reports. Contact your administrator.')
        setLoading(false)
        return
      }
      
      const queryParams = new URLSearchParams()
      
      if (filters.startDate) queryParams.append('startDate', filters.startDate)
      if (filters.endDate) queryParams.append('endDate', filters.endDate)
      if (filters.categoryId) queryParams.append('categoryId', filters.categoryId)
      if (filters.productId) queryParams.append('productId', filters.productId)
      if (filters.changeType) queryParams.append('changeType', filters.changeType)

      // Add department filter for staff users (admins can see all departments)
      if (user.role === 'staff' && userDepartmentId) {
        queryParams.append('departmentId', userDepartmentId)
      }

      let endpoint = ''
      switch (activeTab) {
        case 'inventory':
          endpoint = `${API_BASE_URL}/reports/inventory-summary?${queryParams}`
          break
        case 'low-stock':
          endpoint = `${API_BASE_URL}/reports/low-stock?${queryParams}`
          break
        case 'movements':
          endpoint = `${API_BASE_URL}/reports/inventory-movements?${queryParams}`
          break
        default:
          setLoading(false)
          return
      }

      console.log('📊 Fetching report data from:', endpoint);
      console.log('🔑 Using auth token:', accessToken ? `${accessToken.substring(0, 20)}...` : 'None');
      
      // Test connectivity first
      const isServerReachable = await testServerConnectivity(API_BASE_URL);
      if (!isServerReachable) {
        setError('Cannot connect to server. Please check your network connection and ensure the server is running.');
        setLoading(false);
        return;
      }

      const response = await fetch(endpoint, {
        headers: { 
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        cache: 'no-cache'
      })

      console.log('📡 Report API response status:', response.status);
      console.log('📡 Report API response ok:', response.ok);

      if (response.status === 401) {
        console.warn('🚫 Authentication failed - token may be expired');
        setError('Authentication failed. Please login again.')
        setLoading(false)
        handleAuthError()
        return
      }

      if (!response.ok) {
        const errorText = await response.text()
        console.error('📊 Report fetch error:', response.status, errorText)
        setError(`Failed to fetch ${activeTab} report: ${response.status} - ${errorText || response.statusText}`)
        setLoading(false)
        return
      }

      const data = await response.json()
      console.log(`${activeTab} report data:`, data) // Debug log

      switch (activeTab) {
        case 'inventory':
          console.log('📊 Inventory summary response data:', data);
          console.log('📊 Summary values:', data.summary);
          setInventorySummary(data)
          break
        case 'low-stock':
          setLowStockReport(data)
          break
        case 'movements':
          setMovementReport(data)
          // Transform movements for trends chart
          const movements = data.movements || []
          const trends = movements.slice(0, 10).reverse().map((mov: any) => ({
            date: new Date(mov.created_at).toLocaleDateString(),
            quantity: mov.new_quantity || mov.quantity || 0,
            change: mov.quantity_change || mov.change || 0
          }))
          setMovementTrends(trends)
          break
      }
    } catch (err) {
      console.error('Error fetching report data:', err)
      setError(err instanceof Error ? err.message : 'An error occurred while fetching the report')
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (key: keyof ReportFilter, value: string) => {
    setFilters((prev: ReportFilter) => ({ ...prev, [key]: value }))
  }

  const downloadReport = async (format: 'pdf' | 'csv') => {
    try {
      if (!accessToken) {
        setError('Authentication required. Please login again.')
        handleAuthError()
        return
      }
      
      const queryParams = new URLSearchParams()
      
      if (filters.startDate) queryParams.append('startDate', filters.startDate)
      if (filters.endDate) queryParams.append('endDate', filters.endDate)
      if (filters.categoryId) queryParams.append('categoryId', filters.categoryId)
      queryParams.append('format', format)

      let endpoint = ''
      switch (activeTab) {
        case 'inventory':
          endpoint = `${API_BASE_URL}/reports/inventory-summary?${queryParams}`
          break
        case 'low-stock':
          endpoint = `${API_BASE_URL}/reports/low-stock?${queryParams}`
          break
        case 'movements':
          endpoint = `${API_BASE_URL}/reports/inventory-movements?${queryParams}`
          break
        default:
          return
      }

      const response = await fetch(endpoint, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      })

      if (response.status === 401) {
        handleAuthError()
        return
      }

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${activeTab}-report.${format}`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        console.error('Download failed:', response.status, response.statusText)
        setError(`Failed to download report: ${response.status}`)
      }
    } catch (err) {
      console.error('Error downloading report:', err)
      setError('Failed to download report. Please try again.')
    }
  }

  // Check server connectivity
  const checkServerStatus = async () => {
    try {
      console.log('Checking server status...')
      
      // First try the health endpoint
      let response = await fetch(`${API_BASE_URL}/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-cache'
      })
      
      if (response.ok) {
        console.log('Health check passed:', response.status)
        setServerStatus('running')
        return true
      }
      
      // If health check fails, try a fallback endpoint
      console.log('Health check failed, trying fallback...')
      response = await fetch(`${API_BASE_URL}/categories`, {
        method: 'GET',
        headers: { 
          'Content-Type': 'application/json',
          ...(accessToken && { 'Authorization': `Bearer ${accessToken}` })
        },
        cache: 'no-cache'
      })
      
      // Even if it returns 401 (unauthorized), it means the server is running
      const isRunning = response.status !== undefined && response.status < 500
      console.log('Fallback check result:', { status: response.status, isRunning })
      setServerStatus(isRunning ? 'running' : 'offline')
      return isRunning
      
    } catch (err) {
      console.log('Server status check error:', err instanceof Error ? err.message : 'Unknown error')
      setServerStatus('offline')
      return false
    }
  }

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ChartBarIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Products</p>
              <p className="text-2xl font-bold text-gray-900">
                {reportStats?.totalProducts || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="card">        <div className="flex items-center">
          <div className="p-2 bg-green-100 rounded-lg">
            <DocumentTextIcon className="h-6 w-6 text-green-600" />
          </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Inventory Value</p>
              <p className="text-2xl font-bold text-gray-900">
                ₦{reportStats?.totalValue?.toLocaleString() || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Low Stock Items</p>
              <p className="text-2xl font-bold text-gray-900">
                {reportStats?.lowStockCount || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Distribution */}
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Inventory by Category</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {categoryData.map((_entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`₦${Number(value).toLocaleString()}`, 'Value']} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Movement Trends */}
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Stock Movements</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={movementTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Area 
                type="monotone" 
                dataKey="quantity" 
                stroke="#8884d8" 
                fill="#8884d8" 
                fillOpacity={0.6}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )

  const renderFilters = () => (
    <div className="card mb-6">
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-48">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Start Date
          </label>
          <input
            type="date"
            value={filters.startDate || ''}
            onChange={(e) => handleFilterChange('startDate', e.target.value)}
            className="input"
          />
        </div>
        
        <div className="flex-1 min-w-48">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            End Date
          </label>
          <input
            type="date"
            value={filters.endDate || ''}
            onChange={(e) => handleFilterChange('endDate', e.target.value)}
            className="input"
          />
        </div>

        {activeTab === 'inventory' && (
          <div className="flex-1 min-w-48">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              value={filters.categoryId || ''}
              onChange={(e) => handleFilterChange('categoryId', e.target.value)}
              className="input"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {activeTab === 'movements' && (
          <div className="flex-1 min-w-48">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Movement Type
            </label>
            <select
              value={filters.changeType || ''}
              onChange={(e) => handleFilterChange('changeType', e.target.value)}
              className="input"
            >
              <option value="">All Types</option>
              <option value="adjustment">Adjustment</option>
              <option value="sale">Sale</option>
              <option value="purchase">Purchase</option>
              <option value="transfer">Transfer</option>
              <option value="damage">Damage</option>
              <option value="return">Return</option>
            </select>
          </div>
        )}

        <div className="flex items-end space-x-2">
          <button
            onClick={() => downloadReport('pdf')}
            className="btn-secondary"
            title="Download PDF"
          >
            <ArrowDownTrayIcon className="h-4 w-4" />
            PDF
          </button>
          <button
            onClick={() => downloadReport('csv')}
            className="btn-secondary"
            title="Download CSV"
          >
            <ArrowDownTrayIcon className="h-4 w-4" />
            CSV
          </button>
        </div>
      </div>
    </div>
  )

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      )
    }

    if (error) {
      return (
        <div className="card">
          <div className="text-center text-red-600">
            <ExclamationTriangleIcon className="h-12 w-12 mx-auto mb-4" />
            <p className="text-lg font-medium">Error Loading Report</p>
            <p className="text-sm">{error}</p>
            <div className="mt-4 space-x-2">
              <button 
                onClick={async () => {
                  setError('')
                  const serverRunning = await checkServerStatus()
                  if (!serverRunning) {
                    setError('Backend server is not running. Please start the server and try again.')
                    return
                  }
                  if (isAuthenticated && accessToken) {
                    fetchCategories()
                    fetchReportStats()
                  } else {
                    setError('Authentication required. Please login again.')
                  }
                }}
                className="btn-primary"
              >
                {serverStatus === 'offline' ? 'Check Server & Retry' : 'Retry'}
              </button>
              {error.includes('Authentication') && (
                <button 
                  onClick={() => navigate('/login')}
                  className="btn-secondary"
                >
                  Go to Login
                </button>
              )}
              {serverStatus === 'offline' && (
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800 font-medium mb-2">Backend Server Not Running</p>
                  <p className="text-xs text-yellow-700 mb-3">
                    The backend server needs to be started before you can view reports.
                  </p>
                  <div className="text-xs text-gray-600 space-y-1">
                    <p><strong>Quick Fix:</strong> Run <code className="bg-gray-100 px-1 rounded">./restart-backend.sh</code> from the project root</p>
                    <p><strong>Alternative:</strong> Run <code className="bg-gray-100 px-1 rounded">cd backend && npm start</code></p>
                    <p><strong>Full Restart:</strong> Run <code className="bg-gray-100 px-1 rounded">./quick-start.sh</code> to start both servers</p>
                  </div>
                  <div className="mt-2 text-xs text-blue-600">
                    <p>💡 Tip: Open browser dev tools (F12) → Console tab to see detailed error messages</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )
    }

    switch (activeTab) {
      case 'overview':
        return renderOverview()
      
      case 'inventory':
        return (
          <div className="space-y-6">
            {renderFilters()}
            <div className="card">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Inventory Summary Report
              </h3>
              {inventorySummary ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">Total Products</p>
                      <p className="text-xl font-bold text-blue-600">
                        {inventorySummary.summary?.totalProducts || inventorySummary.products?.length || 0}
                      </p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">Total Value</p>
                      <p className="text-xl font-bold text-green-600">
                        ₦{(inventorySummary.summary?.totalValue || 0).toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-red-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">Low Stock</p>
                      <p className="text-xl font-bold text-red-600">
                        {inventorySummary.summary?.lowStockCount || 0}
                      </p>
                    </div>
                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">Out of Stock</p>
                      <p className="text-xl font-bold text-yellow-600">
                        {inventorySummary.summary?.outOfStockCount || 0}
                      </p>
                    </div>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Product
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Stock
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Value
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Movement
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {inventorySummary.products?.map((product: any) => (
                          <tr key={product.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {product.name}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {product.sku} • {product.category_name}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {product.quantity} / {product.low_stock_threshold}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              ₦{product.total_value.toLocaleString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <div className="flex space-x-2">
                                <span className="text-green-600">+{product.total_stock_in}</span>
                                <span className="text-red-600">-{product.total_stock_out}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                product.is_low_stock 
                                  ? 'bg-red-100 text-red-800' 
                                  : 'bg-green-100 text-green-800'
                              }`}>
                                {product.is_low_stock ? 'Low Stock' : 'In Stock'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">
                  No inventory data available for the selected period.
                </p>
              )}
            </div>
          </div>
        )
      
      case 'low-stock':
        return (
          <div className="space-y-6">
            <div className="card">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Low Stock Alert Report
              </h3>
              {lowStockReport ? (
                <div className="space-y-4">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex">
                      <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
                      <div className="ml-3">
                        <h4 className="text-sm font-medium text-red-800">
                          {lowStockReport.totalCount} products are running low on stock
                        </h4>
                        <p className="text-sm text-red-700 mt-1">
                          These products need immediate attention to avoid stockouts.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Product
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Current Stock
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Minimum Level
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Stock %
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Units Needed
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {lowStockReport.lowStockProducts?.map((product: any) => (
                          <tr key={product.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {product.name}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {product.sku} • {product.category_name}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {product.quantity_in_stock}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {product.minimum_stock_level}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                                  <div 
                                    className={`h-2 rounded-full ${
                                      product.stock_percentage < 25 ? 'bg-red-500' :
                                      product.stock_percentage < 50 ? 'bg-yellow-500' : 'bg-green-500'
                                    }`}
                                    style={{ width: `${Math.min(product.stock_percentage, 100)}%` }}
                                  ></div>
                                </div>
                                <span className="text-sm text-gray-600">
                                  {product.stock_percentage}%
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600">
                              {product.units_needed}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">
                  No low stock products found.
                </p>
              )}
            </div>
          </div>
        )
      
      case 'movements':
        return (
          <div className="space-y-6">
            {renderFilters()}
            <div className="card">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Inventory Movement Report
              </h3>
              {movementReport ? (
                <div className="space-y-4">
                  {/* Movement trends chart */}
                  {movementTrends.length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-md font-medium text-gray-800 mb-3">Stock Level Trends</h4>
                      <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={movementTrends}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          <Line 
                            type="monotone" 
                            dataKey="quantity" 
                            stroke="#8884d8" 
                            strokeWidth={2}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                  
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date & Time
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Product
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Type
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Change
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Stock Level
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            User
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {movementReport.movements?.map((movement: any) => (
                          <tr key={movement.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {new Date(movement.created_at).toLocaleString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {movement.product_name}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {movement.sku}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                movement.type === 'sale' ? 'bg-red-100 text-red-800' :
                                movement.type === 'purchase' ? 'bg-green-100 text-green-800' :
                                movement.type === 'adjustment' ? 'bg-blue-100 text-blue-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {movement.type}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`text-sm font-medium ${
                                movement.quantity_change > 0 ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {movement.quantity_change > 0 ? '+' : ''}{movement.quantity_change}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {movement.previous_quantity} → {movement.new_quantity}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {movement.user_name}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  {movementReport.pagination && (
                    <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
                      <div className="flex flex-1 justify-between sm:hidden">
                        <button className="btn-secondary">Previous</button>
                        <button className="btn-secondary">Next</button>
                      </div>
                      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm text-gray-700">
                            Showing page {movementReport.pagination.page} of {movementReport.pagination.pages}
                            {' '}({movementReport.pagination.total} total movements)
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">
                  No movement data available for the selected period.
                </p>
              )}
            </div>
          </div>
        )
      
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          {/* Server Status Indicator */}
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              serverStatus === 'running' ? 'bg-green-500' : 
              serverStatus === 'offline' ? 'bg-red-500' : 'bg-yellow-500'
            }`}></div>
            <span className={`text-xs ${
              serverStatus === 'running' ? 'text-green-600' : 
              serverStatus === 'offline' ? 'text-red-600' : 'text-yellow-600'
            }`}>
              {serverStatus === 'running' ? 'Server Online' : 
               serverStatus === 'offline' ? 'Server Offline' : 'Checking...'}
            </span>
          </div>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <CalendarIcon className="h-4 w-4" />
          <span>Last updated: {new Date().toLocaleString()}</span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`group inline-flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className={`mr-2 h-5 w-5 ${
                activeTab === tab.id ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
              }`} />
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {renderContent()}
    </div>
  )
}
