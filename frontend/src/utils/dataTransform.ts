/**
 * Utility functions to transform API response data from snake_case to camelCase
 */

// Convert snake_case to camelCase
export const snakeToCamel = (str: string): string => {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
}

// Transform object keys from snake_case to camelCase
export const transformKeys = (obj: any): any => {
  if (obj === null || obj === undefined || typeof obj !== 'object') {
    return obj
  }
  
  if (Array.isArray(obj)) {
    return obj.map(transformKeys)
  }
  
  const transformed: any = {}
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = snakeToCamel(key)
    transformed[camelKey] = transformKeys(value)
  }
  
  return transformed
}

// Specific transforms for different entities
export const transformProduct = (product: any) => {
  return transformKeys(product)
}

export const transformUser = (user: any) => {
  return transformKeys(user)
}

export const transformDepartment = (department: any) => {
  return transformKeys(department)
}

export const transformCategory = (category: any) => {
  return transformKeys(category)
}

export const transformInventoryLog = (log: any) => {
  return transformKeys(log)
}

// Transform API responses
export const transformApiResponse = (response: any) => {
  if (!response || !response.data) return response
  
  return {
    ...response,
    data: transformKeys(response.data)
  }
}
