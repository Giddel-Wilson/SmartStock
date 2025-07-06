import { useQuery } from 'react-query'
import { inventoryAPI } from '../lib/api'
import { useAuthStore } from '../stores/authStore'
import LoadingSpinner from '../components/LoadingSpinner'
import StatsCard from '../components/StatsCard'
import RecentActivity from '../components/RecentActivity'
import LowStockAlert from '../components/LowStockAlert'

export default function Dashboard() {
  const { user } = useAuthStore()
  
  const { data: inventorySummary, isLoading: summaryLoading, error } = useQuery(
    'inventory-summary',
    () => inventoryAPI.getSummary(),
    { 
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  )

  if (summaryLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500">Error loading dashboard: {String(error)}</div>
      </div>
    )
  }

  const stats = inventorySummary?.data?.stats || {}
  const recentMovements = inventorySummary?.data?.recentMovements || []
  // Use low stock products from inventory summary instead of separate API call
  const lowStockItems = inventorySummary?.data?.lowStockProducts || []

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.name}!
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Here's what's happening with your inventory today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Products"
          value={stats.active_products || 0}
          icon="package"
          color="blue"
        />
        <StatsCard
          title="Inventory Value"
          value={`₦${Number(stats.total_inventory_value || 0).toLocaleString()}`}
          icon="dollar"
          color="green"
        />
        <StatsCard
          title="Low Stock Items"
          value={stats.low_stock_products || 0}
          icon="exclamation"
          color="yellow"
          alert={stats.low_stock_products > 0}
        />
        <StatsCard
          title="Out of Stock"
          value={stats.out_of_stock_products || 0}
          icon="x-circle"
          color="red"
          alert={stats.out_of_stock_products > 0}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Recent Inventory Activity
          </h2>
          <RecentActivity movements={recentMovements} />
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Low Stock Alerts
          </h2>
          <LowStockAlert products={lowStockItems} />
        </div>
      </div>
    </div>
  )
}
