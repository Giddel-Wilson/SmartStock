import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import { productsAPI, categoriesAPI, departmentsAPI } from '../lib/api'
import { useAuthStore } from '../stores/authStore'

import LoadingSpinner from '../components/LoadingSpinner'
import toast from 'react-hot-toast'

interface ProductForm {
  name: string
  sku: string
  categoryId?: string
  departmentId?: string
  price: number
  minimumStockLevel: number
  supplier?: string
  description?: string
  imageUrl?: string
  isActive: boolean
}

export default function EditProduct() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  const [isSubmitting, setIsSubmitting] = useState(false)

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

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
  } = useForm<ProductForm>()

  const { data: productData, isLoading, refetch } = useQuery(
    ['product', id],
    () => productsAPI.getProduct(id!),
    {
      enabled: !!id,
      staleTime: 0, // Always refetch to ensure fresh data
      cacheTime: 0, // Don't cache the data
      refetchOnMount: 'always', // Always refetch when component mounts
      retry: 3, // Retry failed requests up to 3 times
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
      onError: (error) => {
        console.error('❌ Failed to load product:', error)
      }
    }
  )

  // Use useEffect to handle form reset when product data changes
  useEffect(() => {
    if (productData?.data) {
      // Handle both response formats: { product } or { data: { product } }
      const product = productData.data.product || productData.data
      
      if (product && product.name) {
        const formData = {
          name: product.name,
          sku: product.sku,
          categoryId: product.category_id || '',
          departmentId: product.department_id || '',
          price: product.price,
          minimumStockLevel: product.minimum_stock_level,
          supplier: product.supplier || '',
          description: product.description || '',
          imageUrl: product.image_url || '',
          isActive: product.is_active,
        }
        reset(formData)
      }
    }
  }, [productData, reset])

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

  const updateProductMutation = useMutation(
    (data: ProductForm) => productsAPI.updateProduct(id!, data),
    {
      onSuccess: () => {
        toast.success('Product updated successfully')
        queryClient.invalidateQueries(['product', id])
        queryClient.invalidateQueries('products')
        navigate(`/products/${id}`)
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Failed to update product')
      },
    }
  )

  const categories = Array.isArray(categoriesData?.data?.categories) ? categoriesData.data.categories : []
  const departments = Array.isArray(departmentsData?.data?.departments) ? departmentsData.data.departments : []
  const product = productData?.data?.product || productData?.data || null

  // Check permissions after product is loaded
  if (product && !canEditProduct(product)) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link
            to="/products"
            className="p-2 text-gray-400 hover:text-gray-600 rounded-md"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
            <p className="text-sm text-gray-600">You do not have permission to edit this product</p>
          </div>
        </div>
        <div className="card">
          <div className="text-center py-12">
            <p className="text-gray-500">
              {product.department_id ? 
                'This product belongs to a different department.' : 
                'This product is unassigned and can only be edited by administrators.'
              }
            </p>
            <p className="text-sm text-gray-400 mt-2">Contact your administrator for access.</p>
            <Link to="/products" className="btn-primary mt-4">
              Back to Products
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const onSubmit = async (data: ProductForm) => {
    setIsSubmitting(true)
    try {
      const formattedData = {
        ...data,
        price: Number(data.price),
        minimumStockLevel: Number(data.minimumStockLevel),
        categoryId: data.categoryId || undefined,
        departmentId: data.departmentId || undefined,
      }
      
      await updateProductMutation.mutateAsync(formattedData)
    } catch (error) {
      // Error handled by mutation
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900">Product not found</h2>
        <p className="mt-2 text-gray-600">The product you're trying to edit doesn't exist.</p>
        <Link to="/products" className="mt-4 btn-primary inline-flex items-center">
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Back to Products
        </Link>
      </div>
    )
  }

  const price = watch('price')
  const currentValue = (Number(product?.quantity_in_stock) || 0) * (Number(price) || 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          to={`/products/${id}`}
          className="p-2 text-gray-400 hover:text-gray-600 rounded-md"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Product</h1>
          <p className="text-sm text-gray-600">Update product information</p>
          {/* Temporary debug info */}
          <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
            <span>Data loaded: {productData ? '✅' : '❌'}</span>
            <span>•</span>
            <span>Product: {product?.name || 'Not loaded'}</span>
            <button
              type="button"
              onClick={() => refetch()}
              className="text-blue-600 hover:text-blue-800 underline"
            >
              Refresh Data
            </button>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Product Name *
                  </label>
                  <input
                    {...register('name', {
                      required: 'Product name is required',
                      minLength: { value: 2, message: 'Name must be at least 2 characters' }
                    })}
                    type="text"
                    className="mt-1 input-field"
                    placeholder="Enter product name"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="sku" className="block text-sm font-medium text-gray-700">
                    SKU *
                  </label>
                  <input
                    {...register('sku', {
                      required: 'SKU is required',
                      pattern: {
                        value: /^[A-Z0-9-_]+$/i,
                        message: 'SKU can only contain letters, numbers, hyphens, and underscores'
                      }
                    })}
                    type="text"
                    className="mt-1 input-field"
                    placeholder="PROD-001"
                  />
                  {errors.sku && (
                    <p className="mt-1 text-sm text-red-600">{errors.sku.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700">
                    Category
                  </label>
                  <select
                    {...register('categoryId')}
                    className="mt-1 select-field"
                  >
                    <option value="">Select a category</option>
                    {categories.map((category: any) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="departmentId" className="block text-sm font-medium text-gray-700">
                    Department
                  </label>
                  <select
                    {...register('departmentId')}
                    className="mt-1 select-field"
                  >
                    <option value="">Select a department</option>
                    {departments.map((department: any) => (
                      <option key={department.id} value={department.id}>
                        {department.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="supplier" className="block text-sm font-medium text-gray-700">
                    Supplier
                  </label>
                  <input
                    {...register('supplier')}
                    type="text"
                    className="mt-1 input-field"
                    placeholder="Enter supplier name"
                  />
                </div>

                <div>
                  <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700">
                    Image URL
                  </label>
                  <input
                    {...register('imageUrl', {
                      pattern: {
                        value: /^https?:\/\/.+$/,
                        message: 'Please enter a valid URL'
                      }
                    })}
                    type="url"
                    className="mt-1 input-field"
                    placeholder="https://example.com/image.jpg"
                  />
                  {errors.imageUrl && (
                    <p className="mt-1 text-sm text-red-600">{errors.imageUrl.message}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    {...register('description')}
                    rows={3}
                    className="mt-1 input-field"
                    placeholder="Enter product description"
                  />
                </div>
              </div>
            </div>

            {/* Pricing & Settings */}
            <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Pricing & Settings</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                    Unit Price *
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">₦</span>
                    </div>
                    <input
                      {...register('price', {
                        required: 'Unit price is required',
                        min: { value: 0, message: 'Price cannot be negative' },
                        valueAsNumber: true
                      })}
                      type="number"
                      step="0.01"
                      min="0"
                      className="pl-7 input-field"
                      placeholder="0.00"
                    />
                  </div>
                  {errors.price && (
                    <p className="mt-1 text-sm text-red-600">{errors.price.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="minimumStockLevel" className="block text-sm font-medium text-gray-700">
                    Low Stock Threshold *
                  </label>
                  <input
                    {...register('minimumStockLevel', {
                      required: 'Low stock threshold is required',
                      min: { value: 0, message: 'Threshold cannot be negative' },
                      valueAsNumber: true
                    })}
                    type="number"
                    min="0"
                    className="mt-1 input-field"
                    placeholder="10"
                  />
                  {errors.minimumStockLevel && (
                    <p className="mt-1 text-sm text-red-600">{errors.minimumStockLevel.message}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Current Stock Info */}
            <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Current Stock</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Quantity</span>
                  <span className="text-sm font-medium text-gray-900">
                    {product.quantity_in_stock}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Current Value</span>
                  <span className="text-sm font-medium text-gray-900">
                    ₦{currentValue.toFixed(2)}
                  </span>
                </div>
                <div className="text-xs text-gray-500 pt-2 border-t">
                  To adjust stock quantities, use the Inventory page
                </div>
              </div>
            </div>

            {/* Status */}
            <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Status</h2>
              <div className="flex items-center">
                <input
                  {...register('isActive')}
                  type="checkbox"
                  className="rounded"
                />
                <label className="ml-2 text-sm text-gray-700">
                  Active (visible in catalog)
                </label>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Actions</h2>
              <div className="space-y-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full btn-primary flex items-center justify-center"
                >
                  {isSubmitting && <LoadingSpinner size="sm" className="mr-2" />}
                  {isSubmitting ? 'Updating...' : 'Update Product'}
                </button>
                <Link
                  to={`/products/${id}`}
                  className="w-full btn-outline flex items-center justify-center"
                >
                  Cancel
                </Link>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
