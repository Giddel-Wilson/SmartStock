import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { Link, useNavigate } from 'react-router-dom'
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
  quantity: number
  price: number
  minimumStockLevel: number
  supplier?: string
  description?: string
  imageUrl?: string
  isActive: boolean
}

export default function CreateProduct() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Check if user has permission to create products
  if (!user || user.role !== 'manager') {
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
            <p className="text-sm text-gray-600">Only administrators can create products</p>
          </div>
        </div>
        <div className="card">
          <div className="text-center py-12">
            <p className="text-gray-500">You do not have permission to create products.</p>
            <p className="text-sm text-gray-400 mt-2">Contact your administrator for access.</p>
            <Link to="/products" className="btn-primary mt-4">
              Back to Products
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<ProductForm>({
    defaultValues: {
      isActive: true,
      quantity: 0,
      price: 0,
      minimumStockLevel: 10,
    }
  })

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

  const createProductMutation = useMutation(
    (data: any) => productsAPI.createProduct(data),
    {
      onSuccess: (response) => {
        toast.success('Product created successfully')
        queryClient.invalidateQueries('products')
        navigate(`/products/${response.data.product.id}`)
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Failed to create product')
      },
    }
  )

  const categories = Array.isArray(categoriesData?.data?.categories) ? categoriesData.data.categories : []
  const departments = Array.isArray(departmentsData?.data?.departments) ? departmentsData.data.departments : []

  const onSubmit = async (data: ProductForm) => {
    setIsSubmitting(true)
    try {
      // Convert string values to numbers and remove isActive (new products are active by default)
      const formattedData = {
        name: data.name,
        sku: data.sku,
        categoryId: data.categoryId || undefined,
        departmentId: data.departmentId || undefined,
        quantity: Number(data.quantity),
        price: Number(data.price),
        minimumStockLevel: Number(data.minimumStockLevel),
        supplier: data.supplier || undefined,
        description: data.description || undefined,
      }
      
      await createProductMutation.mutateAsync(formattedData)
    } catch (error) {
      // Error handled by mutation
    } finally {
      setIsSubmitting(false)
    }
  }

  const quantity = watch('quantity')
  const price = watch('price')
  const totalValue = (Number(quantity) || 0) * (Number(price) || 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          to="/products"
          className="p-2 text-gray-400 hover:text-gray-600 rounded-md"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create Product</h1>
          <p className="text-sm text-gray-600">Add a new product to your inventory</p>
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

            {/* Inventory & Pricing */}
            <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Inventory & Pricing</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">
                    Initial Quantity *
                  </label>
                  <input
                    {...register('quantity', {
                      required: 'Quantity is required',
                      min: { value: 0, message: 'Quantity cannot be negative' },
                      valueAsNumber: true
                    })}
                    type="number"
                    min="0"
                    className="mt-1 input-field"
                    placeholder="0"
                  />
                  {errors.quantity && (
                    <p className="mt-1 text-sm text-red-600">{errors.quantity.message}</p>
                  )}
                </div>

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

            {/* Summary */}
            <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Summary</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Initial Quantity</span>
                  <span className="text-sm font-medium text-gray-900">
                    {quantity || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Unit Price</span>
                  <span className="text-sm font-medium text-gray-900">
                    ₦{Number(price || 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between border-t pt-3">
                  <span className="text-sm font-medium text-gray-900">Total Value</span>
                  <span className="text-sm font-bold text-gray-900">
                    ₦{totalValue.toFixed(2)}
                  </span>
                </div>
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
                  {isSubmitting ? 'Creating...' : 'Create Product'}
                </button>
                <Link
                  to="/products"
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
