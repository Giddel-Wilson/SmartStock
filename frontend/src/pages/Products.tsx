import { useState } from 'react'
import { useQuery } from 'react-query'
import { Link } from 'react-router-dom'
import {
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
} from '@heroicons/react/24/outline'
import { productsAPI, categoriesAPI, departmentsAPI } from '../lib/api'
import LoadingSpinner from '../components/LoadingSpinner'
import { useAuthStore } from '../stores/authStore'

import toast from 'react-hot-toast'

export default function Products() {
  const { user } = useAuthStore()
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('')
  const [lowStockFilter, setLowStockFilter] = useState(false)
  const [sortBy, setSortBy] = useState('name')
  const [sortOrder, setSortOrder] = useState('asc')
  const [page, setPage] = useState(1)
  const [showFilters, setShowFilters] = useState(false)

  // Permission check function
  const canEditProduct = (product: any) => {
    if (!user) return false
    
    // Managers (admins) can edit any product
    if (user.role === 'manager') return true
    
    // Staff can only edit products in their department
    // If product has no department assignment, only admins can edit
    if (user.role === 'staff') {
      return user.departmentId && product.department_id === user.departmentId
    }
    
    return false
  }

  const canDeleteProduct = (product: any) => {
    // Only managers (admins) can delete products
    return user?.role === 'manager'
  }

  const { data: productsData, isLoading, refetch } = useQuery(
    ['products', { search, categoryFilter, departmentFilter, lowStockFilter, sortBy, sortOrder, page }],
    () => productsAPI.getProducts({
      search,
      category: categoryFilter,
      department: departmentFilter,
      lowStock: lowStockFilter,
      sortBy,
      sortOrder,
      page,
      limit: 20,
    }),
    {
      keepPreviousData: true,
      staleTime: 2 * 60 * 1000,
    }
  )

  const { data: categoriesData } = useQuery(
    'categories',
    () => categoriesAPI.getCategories(),
    {
      staleTime: 10 * 60 * 1000,
    }
  )

  const { data: departmentsData } = useQuery(
    'departments',
    () => departmentsAPI.getDepartments(),
    {
      staleTime: 10 * 60 * 1000,
    }
  )

  const products = (() => {
    try {
      if (!productsData?.data?.products) return []
      return productsData.data.products.map((product: any) => {
        // Add computed properties safely
        product.is_low_stock = (product.quantity_in_stock || 0) <= (product.minimum_stock_level || 0)
        return product
      })
    } catch (error) {
      console.error('Error processing products:', error)
      return []
    }
  })()
  
  const pagination = productsData?.data?.pagination || {}
  
  const categories = (() => {
    try {
      if (!categoriesData?.data?.categories) return []
      return categoriesData.data.categories
    } catch (error) {
      console.error('Error processing categories:', error)
      return []
    }
  })()

  const departments = (() => {
    try {
      if (!departmentsData?.data?.departments) return []
      return departmentsData.data.departments
    } catch (error) {
      console.error('Error processing departments:', error)
      return []
    }
  })()

  const handleDeleteProduct = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return

    try {
      await productsAPI.deleteProduct(id)
      toast.success('Product deleted successfully')
      refetch()
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to delete product')
    }
  }

  const handleClearFilters = () => {
    setSearch('')
    setCategoryFilter('')
    setDepartmentFilter('')
    setLowStockFilter(false)
    setSortBy('name')
    setSortOrder('asc')
    setPage(1)
  }

  if (isLoading && page === 1) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage your product catalog and inventory
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn-outline flex items-center gap-2"
          >
            <FunnelIcon className="h-4 w-4" />
            Filters
          </button>
          {/* Only show Add Product button for managers (admins) */}
          {user?.role === 'manager' && (
            <Link to="/products/new" className="btn-primary flex items-center gap-2">
              <PlusIcon className="h-4 w-4" />
              Add Product
            </Link>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 input-field"
              />
            </div>
          </div>
          
          {showFilters && (
            <div className="flex flex-col sm:flex-row gap-4">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="select-field"
              >
                <option value="">All Categories</option>
                {categories.map((category: any) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="select-field"
              >
                <option value="">All Departments</option>
                {departments.map((department: any) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </select>
              
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="select-field"
              >
                <option value="name">Sort by Name</option>
                <option value="sku">Sort by SKU</option>
                <option value="quantity_in_stock">Sort by Quantity</option>
                <option value="price">Sort by Price</option>
                <option value="created_at">Sort by Date</option>
              </select>
              
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="select-field"
              >
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
              
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={lowStockFilter}
                  onChange={(e) => setLowStockFilter(e.target.checked)}
                  className="rounded"
                />
                Low Stock Only
              </label>
              
              <button
                onClick={handleClearFilters}
                className="btn-outline text-sm"
              >
                Clear
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
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
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
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
                        <div className="h-10 w-10 bg-gray-200 rounded flex items-center justify-center">
                          <span className="text-xs font-medium text-gray-500">
                            {(product.name || 'P').charAt(0)}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {product.name || 'Unnamed Product'}
                        </div>
                        {product.description && (
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {product.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {product.sku || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {product.category_name || 'Uncategorized'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {product.department_name || 'Unassigned'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="text-sm text-gray-900">{product.quantity_in_stock || 0}</span>
                      {product.is_low_stock && (
                        <span className="ml-2 badge-warning">Low Stock</span>
                      )}
                      {(product.quantity_in_stock || 0) === 0 && (
                        <span className="ml-2 badge-danger">Out of Stock</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ₦{Number(product.price || 0).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`badge-${product.is_active ? 'success' : 'gray'}`}
                    >
                      {product.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        to={`/products/${product.id}`}
                        className="text-primary-600 hover:text-primary-700"
                        title="View"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </Link>
                      {canEditProduct(product) ? (
                        <Link
                          to={`/products/${product.id}/edit`}
                          className="text-gray-600 hover:text-gray-700"
                          title="Edit"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </Link>
                      ) : (
                        <span 
                          className="text-gray-300"
                          title={user?.role === 'staff' ? 'Product not in your department' : 'No edit permission'}
                        >
                          <PencilIcon className="h-4 w-4" />
                        </span>
                      )}
                      {canDeleteProduct(product) && (
                        <button
                          onClick={() => handleDeleteProduct(product.id, product.name)}
                          className="text-red-600 hover:text-red-700"
                          title="Delete"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {products.length === 0 && (
          <div className="text-center py-12">
            <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-gray-100">
              <MagnifyingGlassIcon className="h-6 w-6 text-gray-400" />
            </div>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No products found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {search || categoryFilter || lowStockFilter
                ? 'Try adjusting your search or filter criteria.'
                : 'Get started by creating your first product.'}
            </p>
            {!search && !categoryFilter && !lowStockFilter && user?.role === 'manager' && (
              <div className="mt-6">
                <Link to="/products/new" className="btn-primary">
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add Product
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
            {pagination.total} products
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              className="btn-outline disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="px-3 py-2 text-sm text-gray-700">
              Page {page} of {pagination.pages}
            </span>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page === pagination.pages}
              className="btn-outline disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
