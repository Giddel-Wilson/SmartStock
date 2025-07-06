import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { useForm } from 'react-hook-form'
import {
  PlusIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon,
} from '@heroicons/react/24/outline'
import { departmentsAPI } from '../lib/api'
import { Department } from '../../../shared/types'

import toast from 'react-hot-toast'

interface DepartmentForm {
  name: string
  description?: string
}

export default function Departments() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DepartmentForm>()

  const { data: departmentsData, isLoading } = useQuery(
    ['departments', search],
    () => departmentsAPI.getDepartments(),
    {
      staleTime: 5 * 60 * 1000,
    }
  )

  const createDepartmentMutation = useMutation(
    (data: DepartmentForm) => departmentsAPI.createDepartment(data),
    {
      onSuccess: () => {
        toast.success('Department created successfully')
        queryClient.invalidateQueries('departments')
        setShowModal(false)
        reset()
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Failed to create department')
      },
    }
  )

  const updateDepartmentMutation = useMutation(
    ({ id, data }: { id: string; data: DepartmentForm }) =>
      departmentsAPI.updateDepartment(id, data),
    {
      onSuccess: () => {
        toast.success('Department updated successfully')
        queryClient.invalidateQueries('departments')
        setShowModal(false)
        setEditingDepartment(null)
        reset()
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Failed to update department')
      },
    }
  )

  const deleteDepartmentMutation = useMutation(
    (id: string) => departmentsAPI.deleteDepartment(id),
    {
      onSuccess: () => {
        toast.success('Department deleted successfully')
        queryClient.invalidateQueries('departments')
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Failed to delete department')
      },
    }
  )

  const departments = (() => {
    try {
      if (!departmentsData?.data?.departments) return []
      return departmentsData.data.departments
    } catch (error) {
      console.error('Error accessing departments:', error)
      return []
    }
  })()

  const handleCreateDepartment = () => {
    setEditingDepartment(null)
    reset({ name: '', description: '' })
    setShowModal(true)
  }

  const handleEditDepartment = (department: Department) => {
    setEditingDepartment(department)
    reset({
      name: department.name,
      description: department.description || '',
    })
    setShowModal(true)
  }

  const handleDeleteDepartment = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return
    deleteDepartmentMutation.mutate(id)
  }

  const onSubmit = (data: DepartmentForm) => {
    if (editingDepartment) {
      updateDepartmentMutation.mutate({ id: editingDepartment.id, data })
    } else {
      createDepartmentMutation.mutate(data)
    }
  }

  const isSubmitting = createDepartmentMutation.isLoading || updateDepartmentMutation.isLoading

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Departments</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage organizational departments and staff assignments
          </p>
        </div>
        <button
          onClick={handleCreateDepartment}
          className="btn-primary flex items-center gap-2"
        >
          <PlusIcon className="h-4 w-4" />
          Add Department
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search departments..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 input-field"
          />
        </div>
      </div>

      {/* Departments Table */}
      <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-300 border-t-primary-600"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Staff Count
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {departments.map((department: Department) => (
                  <tr key={department.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {department.name}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500 max-w-xs truncate">
                        {department.description || 'No description'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {department.user_count || 0} staff
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(department.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEditDepartment(department)}
                          className="text-primary-600 hover:text-primary-700"
                          title="Edit"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteDepartment(department.id, department.name)}
                          className="text-red-600 hover:text-red-700"
                          title="Delete"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {departments.length === 0 && (
              <div className="text-center py-12">
                <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-gray-100">
                  <MagnifyingGlassIcon className="h-6 w-6 text-gray-400" />
                </div>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No departments found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {search ? 'Try adjusting your search criteria.' : 'Get started by creating your first department.'}
                </p>
                {!search && (
                  <div className="mt-6">
                    <button onClick={handleCreateDepartment} className="btn-primary">
                      <PlusIcon className="h-4 w-4 mr-2" />
                      Add Department
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingDepartment ? 'Edit Department' : 'Create Department'}
              </h3>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Name *
                  </label>
                  <input
                    {...register('name', {
                      required: 'Department name is required',
                      minLength: { value: 2, message: 'Name must be at least 2 characters' }
                    })}
                    type="text"
                    className="mt-1 input-field"
                    placeholder="Enter department name"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    {...register('description')}
                    rows={3}
                    className="mt-1 input-field"
                    placeholder="Enter department description"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false)
                      setEditingDepartment(null)
                      reset()
                    }}
                    className="btn-outline"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-primary flex items-center"
                  >
                    {isSubmitting && <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-white mr-2"></div>}
                    {isSubmitting
                      ? editingDepartment ? 'Updating...' : 'Creating...'
                      : editingDepartment ? 'Update Department' : 'Create Department'
                    }
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
