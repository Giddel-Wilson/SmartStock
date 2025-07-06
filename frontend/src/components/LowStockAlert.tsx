import { Link } from 'react-router-dom'
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { Product } from '../../../shared/types'

interface LowStockAlertProps {
  products: Product[]
}

export default function LowStockAlert({ products }: LowStockAlertProps) {
  if (!products.length) {
    return (
      <div className="text-center py-8">
        <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-green-100">
          <svg
            className="h-6 w-6 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <p className="mt-2 text-sm text-gray-500">All products are well stocked!</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {products.map((product) => (
        <div
          key={product.id}
          className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg"
        >
          <div className="flex items-center space-x-3">
            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600" />
            <div>
              <p className="text-sm font-medium text-gray-900">
                {product.name}
              </p>
              <p className="text-xs text-gray-500">
                SKU: {product.sku}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-900">
              {product.quantity_in_stock} left
            </p>
            <p className="text-xs text-gray-500">
              Threshold: {product.minimum_stock_level}
            </p>
          </div>
        </div>
      ))}
      
      {products.length > 0 && (
        <div className="pt-2">
          <Link
            to="/products?lowStock=true"
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            View all low stock items →
          </Link>
        </div>
      )}
    </div>
  )
}
