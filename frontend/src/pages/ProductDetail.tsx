import { useParams, Link } from 'react-router-dom'
import { useQuery } from 'react-query'
import { ArrowLeftIcon, PencilIcon, ChartBarIcon } from '@heroicons/react/24/outline'
import { productsAPI } from '../lib/api'

import LoadingSpinner from '../components/LoadingSpinner'
import { formatDistanceToNow } from 'date-fns'

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>()
  
  const { data: productData, isLoading } = useQuery(
    ['product', id],
    () => productsAPI.getProduct(id!),
    {
      enabled: !!id,
      staleTime: 5 * 60 * 1000,
    }
  )

  const { data: historyData } = useQuery(
    ['product-history', id],
    () => productsAPI.getProductHistory(id!),
    {
      enabled: !!id,
      staleTime: 2 * 60 * 1000,
    }
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const product = productData?.data?.product || null
  const history = Array.isArray(historyData?.data?.history) ? historyData.data.history : []

  if (!product) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900">Product not found</h2>
        <p className="mt-2 text-gray-600">The product you're looking for doesn't exist.</p>
        <Link to="/products" className="mt-4 btn-primary inline-flex items-center">
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Back to Products
        </Link>
      </div>
    )
  }

  const stockStatus = product.quantity_in_stock === 0 ? 'out-of-stock' : product.is_low_stock ? 'low-stock' : 'in-stock'
  const stockStatusColors = {
    'in-stock': 'badge-success',
    'low-stock': 'badge-warning',
    'out-of-stock': 'badge-danger',
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to="/products"
            className="p-2 text-gray-400 hover:text-gray-600 rounded-md"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
            <p className="text-sm text-gray-600">SKU: {product.sku}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to={`/products/${product.id}/edit`}
            className="btn-primary flex items-center gap-2"
          >
            <PencilIcon className="h-4 w-4" />
            Edit Product
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Product Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Product Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {product.imageUrl && (
                <div className="md:col-span-2">
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                </div>
              )}
              <div>
                <h3 className="text-sm font-medium text-gray-500">Name</h3>
                <p className="mt-1 text-sm text-gray-900">{product.name}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">SKU</h3>
                <p className="mt-1 text-sm text-gray-900">{product.sku}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Category</h3>
                <p className="mt-1 text-sm text-gray-900">
                  {product.category_name || 'Uncategorized'}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Supplier</h3>
                <p className="mt-1 text-sm text-gray-900">
                  {product.supplier || 'Not specified'}
                </p>
              </div>
              {product.description && (
                <div className="md:col-span-2">
                  <h3 className="text-sm font-medium text-gray-500">Description</h3>
                  <p className="mt-1 text-sm text-gray-900">{product.description}</p>
                </div>
              )}
            </div>
          </div>

          {/* Inventory History */}
          <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Inventory History</h2>
            {history.length > 0 ? (
              <div className="flow-root">
                <ul role="list" className="-mb-8">
                  {history.slice(0, 10).map((log: any, index: number) => (
                    <li key={log.id}>
                      <div className="relative pb-8">
                        {index !== Math.min(history.length - 1, 9) ? (
                          <span
                            className="absolute left-5 top-5 -ml-px h-full w-0.5 bg-gray-200"
                            aria-hidden="true"
                          />
                        ) : null}
                        <div className="relative flex items-start space-x-3">
                          <div className="relative">
                            <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                              <span className="text-sm font-medium text-gray-900">
                                {log.type?.charAt(0).toUpperCase() || '?'}
                              </span>
                            </div>
                          </div>
                          <div className="min-w-0 flex-1">
                            <div>
                              <div className="text-sm">
                                <span className="font-medium text-gray-900">
                                  {log.type?.charAt(0).toUpperCase() + log.type?.slice(1) || 'Unknown'}
                                </span>
                                <span className="ml-2 text-gray-500">
                                  by {log.user_name}
                                </span>
                              </div>
                              <p className="mt-0.5 text-sm text-gray-500">
                                {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                              </p>
                            </div>
                            <div className="mt-2 text-sm text-gray-700">
                              <p>
                                Quantity: {log.quantityBefore} → {log.quantityAfter}
                                <span className={`ml-2 ${log.quantity_change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  ({log.quantity_change > 0 ? '+' : ''}{log.quantity_change})
                                </span>
                              </p>
                              {log.reason && (
                                <p className="mt-1 text-gray-600">Reason: {log.reason}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No inventory history available</p>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Stock Status */}
          <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Stock Status</h2>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500">Current Stock</span>
                  <span className={`${stockStatusColors[stockStatus]}`}>
                    {stockStatus === 'in-stock' && 'In Stock'}
                    {stockStatus === 'low-stock' && 'Low Stock'}
                    {stockStatus === 'out-of-stock' && 'Out of Stock'}
                  </span>
                </div>
                <div className="mt-1 text-2xl font-bold text-gray-900">
                  {product.quantity_in_stock}
                </div>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Low Stock Threshold</span>
                <div className="mt-1 text-lg text-gray-900">
                  {product.minimum_stock_level}
                </div>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Unit Price</span>
                <div className="mt-1 text-lg text-gray-900">
                  ₦{Number(product.price || 0).toFixed(2)}
                </div>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Total Value</span>
                <div className="mt-1 text-lg font-bold text-gray-900">
                  ₦{(Number(product.quantity_in_stock || 0) * Number(product.price || 0)).toFixed(2)}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <Link
                to={`/inventory?product=${product.id}`}
                className="w-full btn-outline flex items-center justify-center gap-2"
              >
                <ChartBarIcon className="h-4 w-4" />
                Adjust Stock
              </Link>
              <Link
                to={`/reports?product=${product.id}`}
                className="w-full btn-outline flex items-center justify-center gap-2"
              >
                <ChartBarIcon className="h-4 w-4" />
                View Reports
              </Link>
            </div>
          </div>

          {/* Product Meta */}
          <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Details</h2>
            <div className="space-y-3">
              <div>
                <span className="text-sm font-medium text-gray-500">Status</span>
                <div className="mt-1">
                  <span className={`badge-${product.is_active ? 'success' : 'gray'}`}>
                    {product.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Created</span>
                <div className="mt-1 text-sm text-gray-900">
                  {new Date(product.created_at).toLocaleDateString()}
                </div>
              </div>
              {product.updatedAt && (
                <div>
                  <span className="text-sm font-medium text-gray-500">Last Updated</span>
                  <div className="mt-1 text-sm text-gray-900">
                    {new Date(product.updatedAt).toLocaleDateString()}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
