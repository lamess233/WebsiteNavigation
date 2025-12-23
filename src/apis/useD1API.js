import { ref } from 'vue';

/**
 * A composable for interacting with the Cloudflare D1 Worker API.
 */
export function useD1API() {
  // In development, Vite's proxy will forward this. 
  // In production, it's a relative path to the Worker.
  const API_BASE = '/api';

  const getToken = () => localStorage.getItem('admin_token');
  const saveToken = (token) => localStorage.setItem('admin_token', token);
  const clearToken = () => localStorage.removeItem('admin_token');

  /**
   * A generic request handler for the D1 API.
   * @param {string} url - The API endpoint (e.g., '/public/categories').
   * @param {object} [options={}] - Fetch options (method, body, etc.).
   * @returns {Promise<any>} The 'data' field from the API response.
   */
  const request = async (url, options = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const token = getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}${url}`, {
      ...options,
      headers,
    });

    const responseData = await response.json();

    if (responseData.code !== 0) {
      // If the token is invalid or expired, clear it.
      if (responseData.code === 401) {
        clearToken();
      }
      throw new Error(responseData.message || 'API request failed');
    }

    return responseData.data;
  };

  return {
    // --- Auth ---
    login: (username, password) =>
      request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      }).then(data => {
        if (data.token) {
          saveToken(data.token);
        }
        return data;
      }),
    
    logout: () =>
      request('/auth/logout', { method: 'POST' })
        .finally(() => clearToken()),

    changePassword: (currentPassword, newPassword) =>
      request('/admin/password', {
        method: 'PUT',
        body: JSON.stringify({ currentPassword, newPassword }),
      }),

    // --- Public ---
    getPublicData: () => request('/public/categories'),
    getPublicSettings: () => request('/public/settings'),

    // --- Admin ---
    admin: {
      getCategories: () => request('/admin/categories'),
      createCategory: (category) =>
        request('/admin/categories', {
          method: 'POST',
          body: JSON.stringify(category),
        }),
      updateCategories: (categories) =>
        request('/admin/categories', {
          method: 'PUT',
          body: JSON.stringify(categories),
        }),
      deleteCategory: (id) =>
        request(`/admin/categories/${id}`, {
          method: 'DELETE',
        }),
      
      getSites: () => request('/admin/sites'),
      createSite: (site) =>
        request('/admin/sites', {
          method: 'POST',
          body: JSON.stringify(site),
        }),
      updateSite: (site) =>
        request(`/admin/sites/${site.id}`, {
          method: 'PUT',
          body: JSON.stringify(site),
        }),
      deleteSite: (id) =>
        request(`/admin/sites/${id}`, {
          method: 'DELETE',
        }),

      getSettings: () => request('/admin/settings'),
      updateSettings: (settings) =>
        request('/admin/settings', {
          method: 'PUT',
          body: JSON.stringify(settings),
        }),
    },
    
    // --- Helpers ---
    isLoggedIn: () => !!getToken(),
    clearToken,
  };
}