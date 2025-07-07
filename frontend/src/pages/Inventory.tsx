import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { useForm } from 'react-hook-form'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { inventoryAPI, productsAPI } from '../lib/api'
import { useAuthStore } from '../stores/authStore'

import LoadingSpinner from '../components/LoadingSpinner'
import toast from 'react-hot-toast'

interface StockAdjustmentForm {
  productId: string
  changeType: 'restock' | 'sale' | 'adjustment' | 'return'
  quantityChanged: number
  reason?: string
  referenceNumber?: string
}

export default function Inventory() {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  const [search, setSearch] = useState('')
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false)

  // Check if user can adjust stock for a product
  const canAdjustStock = (product: any) => {
    if (!user) return false
    
    // Debug logging
    console.log('🔍 Permission check:', {
      userName: user.name,
      userRole: user.role,
      userDeptId: user.departmentId,
      userDeptName: user.departmentName,
      productName: product.name,
      productDeptId: product.department_id,
      productDeptName: product.department_name
    })
    
    // Managers (admins) can adjust stock for any product
    if (user.role === 'manager') return true
    
    // Staff can only adjust stock for products in their department
    // If product has no department assignment, only admins can adjust
    if (user.role === 'staff') {
      // Backend returns department_id (snake_case), frontend user has departmentId (camelCase)
      const canAdjust = user.departmentId && product.department_id === user.departmentId
      console.log('🔍 Staff permission result:', canAdjust)
      return canAdjust
    }
    
    return false
  }

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    watch,
  } = useForm<StockAdjustmentForm>()

  const { data: productsData, isLoading } = useQuery(
    ['products', { search, limit: 50 }],
    () => productsAPI.getProducts({ search, limit: 50 }),
    {
      keepPreviousData: true,
      staleTime: 2 * 60 * 1000,
    }
  )

  const adjustStockMutation = useMutation(
    (data: StockAdjustmentForm) => {
      console.log('📤 Sending API request to update inventory:', data)
      return inventoryAPI.updateInventory(data)
    },
    {
      onSuccess: (response) => {
        console.log('✅ Inventory update successful:', response)
        toast.success('Stock adjusted successfully')
        queryClient.invalidateQueries('products')
        setShowAdjustmentModal(false)
        setSelectedProduct(null)
        reset()
      },
      onError: (error: any) => {
        console.error('❌ Inventory update failed:', error)
        console.error('Error details:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status,
          statusText: error.response?.statusText,
          code: error.code,
          config: error.config
        })
        
        let errorMessage = 'Failed to adjust stock'
        
        if (error.code === 'ERR_NETWORK') {
          errorMessage = 'Network error - Backend server is not running'
        } else if (error.response?.status === 401) {
          errorMessage = 'Authentication required - Please log in again'
        } else if (error.response?.status === 400) {
          errorMessage = error.response.data?.error || 'Invalid request data'
        } else if (error.response?.data?.error) {
          errorMessage = error.response.data.error
        }
        
        toast.error(errorMessage)
      },
    }
  )

  const products = Array.isArray(productsData?.data?.products) ? productsData.data.products : []

  const handleAdjustStock = (product: any) => {
    if (!canAdjustStock(product)) {
      toast.error('You do not have permission to adjust stock for this product')
      return
    }
    
    setSelectedProduct(product)
    reset({
      productId: product.id,
      changeType: 'adjustment',
      quantityChanged: 0,
    })
    setShowAdjustmentModal(true)
  }

  const onSubmit = (data: StockAdjustmentForm) => {
    console.log('🚀 Submitting inventory adjustment:', data)
    console.log('📝 Form data details:', {
      productId: data.productId,
      changeType: data.changeType,
      quantityChanged: data.quantityChanged,
      reason: data.reason,
      referenceNumber: data.referenceNumber
    })
    
    adjustStockMutation.mutate({
      ...data,
      quantityChanged: Number(data.quantityChanged),
    })
  }

  const changeType = watch('changeType')
  const quantityChanged = watch('quantityChanged')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
          <p className="mt-1 text-sm text-gray-600">
            Adjust stock levels and track inventory changes
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search products to adjust inventory..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 input-field"
          />
        </div>
      </div>

      {/* Products List */}
      <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    SKU
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Current Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products.map((product: any) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          {product.imageUrl ? (
                            <img
                              className="h-10 w-10 rounded object-cover"
                              src={product.imageUrl}
                              alt={product.name}
                            />
                          ) : (
                            <div className="h-10 w-10 bg-gray-200 rounded flex items-center justify-center">
                              <span className="text-xs font-medium text-gray-500">
                                {product.name.charAt(0)}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {product.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {product.category_name || 'Uncategorized'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {product.sku}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {product.department_name || 'Unassigned'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{product.quantity_in_stock}</div>
                      <div className="text-xs text-gray-500">
                        Threshold: {product.minimum_stock_level}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {product.quantity_in_stock === 0 ? (
                        <span className="badge-danger">Out of Stock</span>
                      ) : product.is_low_stock ? (
                        <span className="badge-warning">Low Stock</span>
                      ) : (
                        <span className="badge-success">In Stock</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {canAdjustStock(product) ? (
                        <button
                          onClick={() => handleAdjustStock(product)}
                          className="text-primary-600 hover:text-primary-700 font-medium"
                        >
                          Adjust Stock
                        </button>
                      ) : (
                        <span className="text-gray-400 text-sm">
                          {product.department_id ? 
                            (user?.role === 'staff' ? 'Different Dept.' : 'No Access') : 
                            'Unassigned - Admin Only'
                          }
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {products.length === 0 && (
              <div className="text-center py-12">
                <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-gray-100">
                  <MagnifyingGlassIcon className="h-6 w-6 text-gray-400" />
                </div>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No products found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {search ? 'Try adjusting your search criteria.' : 'No products available for inventory management.'}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Stock Adjustment Modal */}
      {showAdjustmentModal && selectedProduct && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Adjust Stock: {selectedProduct.name}
              </h3>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Change Type *
                  </label>
                  <select
                    {...register('changeType', { required: 'Change type is required' })}
                    className="mt-1 select-field"
                  >
                    <option value="restock">Restock (Add Inventory)</option>
                    <option value="sale">Sale (Remove Inventory)</option>
                    <option value="adjustment">Manual Adjustment</option>
                    <option value="return">Return (Add Inventory)</option>
                  </select>
                  {errors.changeType && (
                    <p className="mt-1 text-sm text-red-600">{errors.changeType.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Quantity *
                  </label>
                  <input
                    {...register('quantityChanged', {
                      required: 'Quantity is required',
                      min: { value: 1, message: 'Quantity must be at least 1' },
                      valueAsNumber: true
                    })}
                    type="number"
                    min="1"
                    className="mt-1 input-field"
                    placeholder="Enter quantity"
                  />
                  {errors.quantityChanged && (
                    <p className="mt-1 text-sm text-red-600">{errors.quantityChanged.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Reference Number
                  </label>
                  <input
                    {...register('referenceNumber')}
                    type="text"
                    className="mt-1 input-field"
                    placeholder="Order #, Invoice #, etc."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Reason
                  </label>
                  <textarea
                    {...register('reason')}
                    rows={2}
                    className="mt-1 input-field"
                    placeholder="Enter reason for adjustment"
                  />
                </div>

                {/* Preview */}
                <div className="bg-gray-50 p-3 rounded-md">
                  <div className="text-sm font-medium text-gray-700">Preview:</div>
                  <div className="text-sm text-gray-600 mt-1">
                    Current Stock: {selectedProduct.quantity_in_stock}
                  </div>
                  <div className="text-sm text-gray-600">
                    Change: {changeType === 'sale' || changeType === 'adjustment' ? '-' : '+'}{quantityChanged || 0}
                  </div>
                  <div className="text-sm font-medium text-gray-900">
                    New Stock: {
                      changeType === 'sale' || (changeType === 'adjustment' && quantityChanged > selectedProduct.quantity_in_stock)
                        ? selectedProduct.quantity_in_stock - (quantityChanged || 0)
                        : selectedProduct.quantity_in_stock + (quantityChanged || 0)
                    }
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAdjustmentModal(false)
                      setSelectedProduct(null)
                      reset()
                    }}
                    className="btn-outline"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={adjustStockMutation.isLoading}
                    className="btn-primary flex items-center"
                  >
                    {adjustStockMutation.isLoading && (
                      <LoadingSpinner size="sm" className="mr-2" />
                    )}
                    {adjustStockMutation.isLoading ? 'Adjusting...' : 'Adjust Stock'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
