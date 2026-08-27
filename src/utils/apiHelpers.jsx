// src/utils/apiHelpers.js

/**
 * Extract data from various API response shapes.
 * Supports:
 *   - { data: ... }
 *   - { success: true, data: ... }
 *   - { success: true, result: ... }
 *   - Direct array/object
 */
export const extractData = (response) => {
  if (!response) return null;

  // If response is already the data (axios interceptor may return data)
  const data = response.data || response;

  if (data && typeof data === 'object') {
    if (data.data !== undefined) return data.data;
    if (data.result !== undefined) return data.result;
    if (data.success === true && data.data !== undefined) return data.data;
    if (data.success === true && data.result !== undefined) return data.result;
  }

  return data;
};

/**
 * Optional: handle paginated responses
 */
export const extractPaginatedData = (response) => {
  const data = extractData(response);
  if (data && typeof data === 'object' && data.rows !== undefined) {
    return {
      items: data.rows,
      total: data.count || data.total || 0,
      ...data
    };
  }
  return {
    items: data || [],
    total: Array.isArray(data) ? data.length : 0
  };
};