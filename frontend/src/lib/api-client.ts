/**
 * Centralized API client for all backend communication.
 * Production-grade API handling with proper error management.
 */

interface ApiError {
  code: string;
  message: string;
  status: number;
  details?: any;
}

interface ApiResponse<T> {
  data?: T;
  error?: ApiError;
}

class ApiClient {
  private baseUrl: string;
  private defaultHeaders: HeadersInit;

  constructor() {
    // Use empty baseUrl for relative paths when running through nginx
    this.baseUrl = '';
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
  }

  private getAuthHeaders(): HeadersInit {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    if (!response.ok) {
      // Handle authentication errors
      if (response.status === 401) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/login';
        }
      }

      // Try to parse error response
      try {
        const errorData = await response.json();
        return {
          error: {
            code: errorData.error?.code || 'UNKNOWN_ERROR',
            message: errorData.error?.message || errorData.detail || 'An error occurred',
            status: response.status,
            details: errorData.error?.details,
          },
        };
      } catch {
        return {
          error: {
            code: 'NETWORK_ERROR',
            message: 'Network error occurred',
            status: response.status,
          },
        };
      }
    }

    try {
      const data = await response.json();
      return { data };
    } catch {
      return { data: undefined as T };
    }
  }

  async get<T>(endpoint: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
    const url = `${this.baseUrl}${endpoint}${queryString}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          ...this.defaultHeaders,
          ...this.getAuthHeaders(),
        },
      });
      return this.handleResponse<T>(response);
    } catch (error) {
      return {
        error: {
          code: 'NETWORK_ERROR',
          message: 'Failed to connect to server',
          status: 0,
        },
      };
    }
  }

  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          ...this.defaultHeaders,
          ...this.getAuthHeaders(),
        },
        body: data ? JSON.stringify(data) : undefined,
      });
      return this.handleResponse<T>(response);
    } catch (error) {
      return {
        error: {
          code: 'NETWORK_ERROR',
          message: 'Failed to connect to server',
          status: 0,
        },
      };
    }
  }

  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'PUT',
        headers: {
          ...this.defaultHeaders,
          ...this.getAuthHeaders(),
        },
        body: data ? JSON.stringify(data) : undefined,
      });
      return this.handleResponse<T>(response);
    } catch (error) {
      return {
        error: {
          code: 'NETWORK_ERROR',
          message: 'Failed to connect to server',
          status: 0,
        },
      };
    }
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'DELETE',
        headers: {
          ...this.defaultHeaders,
          ...this.getAuthHeaders(),
        },
      });
      return this.handleResponse<T>(response);
    } catch (error) {
      return {
        error: {
          code: 'NETWORK_ERROR',
          message: 'Failed to connect to server',
          status: 0,
        },
      };
    }
  }

  // Auth specific methods
  async login(email: string, password: string): Promise<ApiResponse<{ access_token: string; refresh_token: string }>> {
    return this.post('/api/auth/login', { email, password });
  }

  async getCurrentUser<T>(): Promise<ApiResponse<T>> {
    return this.get('/api/auth/me');
  }

  async logout(): Promise<void> {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      window.location.href = '/login';
    }
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Export types
export type { ApiError, ApiResponse };