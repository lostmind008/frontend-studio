/**
 * Authentication service
 * Handles login, registration, and user profile operations
 */

import { apiClient } from '../api/client';
import { 
  UserLogin, 
  UserRegistration, 
  TokenResponse, 
  UserProfile, 
  UserResponse,
  ApiResponse 
} from '../api/types';

class AuthService {
  // ========== AUTHENTICATION ==========

  /**
   * Login user with email and password
   */
  async login(credentials: UserLogin): Promise<TokenResponse> {
    const response: ApiResponse<TokenResponse> = await apiClient.post(
      '/auth/login',
      credentials,
      { skipAuth: true }
    );

    // Store token in client
    apiClient.setAuthToken(response.data.access_token);

    return response.data;
  }

  /**
   * Register new user account
   */
  async register(userData: UserRegistration): Promise<TokenResponse> {
    const response: ApiResponse<TokenResponse> = await apiClient.post(
      '/auth/register',
      userData,
      { skipAuth: true }
    );

    // Store token in client
    apiClient.setAuthToken(response.data.access_token);

    return response.data;
  }

  /**
   * Logout user (clear token)
   */
  async logout(): Promise<void> {
    // Clear token from storage
    apiClient.clearAuthToken();
    
    // Redirect to auth page
    if (typeof window !== 'undefined') {
      window.location.href = '/auth';
    }
  }

  // ========== USER PROFILE ==========

  /**
   * Get current user profile (detailed)
   */
  async getProfile(): Promise<UserProfile> {
    const response: ApiResponse<UserProfile> = await apiClient.get('/auth/profile');
    return response.data;
  }

  /**
   * Get current user basic info
   */
  async getCurrentUser(): Promise<UserResponse> {
    const response: ApiResponse<UserResponse> = await apiClient.get('/auth/me');
    return response.data;
  }

  /**
   * Verify current JWT token
   */
  async verifyToken(): Promise<{ valid: boolean; user?: UserResponse }> {
    try {
      const response: ApiResponse<{ valid: boolean; user: UserResponse }> = 
        await apiClient.post('/auth/verify');
      return response.data;
    } catch (error) {
      return { valid: false };
    }
  }

  // ========== UTILITIES ==========

  /**
   * Check if user is currently authenticated
   */
  isAuthenticated(): boolean {
    return apiClient.isAuthenticated();
  }

  /**
   * Get current auth token
   */
  getToken(): string | null {
    return apiClient.getAuthToken();
  }

  /**
   * Refresh user session on app load
   */
  async refreshSession(): Promise<UserProfile | null> {
    if (!this.isAuthenticated()) {
      return null;
    }

    try {
      return await this.getProfile();
    } catch (error) {
      // Token likely expired, clear it
      await this.logout();
      return null;
    }
  }
}

// Singleton export
export const authService = new AuthService();
export default authService;