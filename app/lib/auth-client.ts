"use client";

/**
 * BetterAuth Client for Frontend
 * 
 * Client-side authentication using BetterAuth API
 */

export interface User {
  id: string;
  email: string;
  name?: string;
  image?: string;
  emailVerified?: boolean;
}

export interface Session {
  user: User;
  session: {
    id: string;
    expiresAt: Date;
    token: string;
  };
}

/**
 * Get backend API URL
 */
function getBackendUrl(): string {
  if (typeof window === 'undefined') {
    return process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
  }
  return process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
}

/**
 * BetterAuth Client
 */
export class AuthClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = getBackendUrl();
  }

  /**
   * Get current session
   */
  async getSession(): Promise<Session | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/auth/get-session`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return data.session || null;
    } catch (error) {
      console.error('[AuthClient] Failed to get session:', error);
      return null;
    }
  }

  /**
   * Sign in with email and password
   */
  async signInEmail(email: string, password: string): Promise<{ error?: string; session?: Session }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/auth/sign-in/email`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { error: data.message || 'Sign in failed' };
      }

      return { session: data.session };
    } catch (error: any) {
      console.error('[AuthClient] Sign in error:', error);
      return { error: error?.message || 'Sign in failed' };
    }
  }

  /**
   * Sign up with email and password
   */
  async signUpEmail(email: string, password: string, name?: string): Promise<{ error?: string; session?: Session }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/auth/sign-up/email`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, name }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { error: data.message || 'Sign up failed' };
      }

      return { session: data.session };
    } catch (error: any) {
      console.error('[AuthClient] Sign up error:', error);
      return { error: error?.message || 'Sign up failed' };
    }
  }

  /**
   * Sign in with Google OAuth
   */
  async signInWithGoogle(): Promise<void> {
    const redirectUrl = `${this.baseUrl}/api/auth/sign-in/social?provider=google`;
    window.location.href = redirectUrl;
  }

  /**
   * Sign out
   */
  async signOut(): Promise<void> {
    try {
      await fetch(`${this.baseUrl}/api/auth/sign-out`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('[AuthClient] Sign out error:', error);
    }
  }

  /**
   * Forgot password
   */
  async forgotPassword(email: string): Promise<{ error?: string; success?: boolean }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/auth/forget-password`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { error: data.message || 'Failed to send reset email' };
      }

      return { success: true };
    } catch (error: any) {
      console.error('[AuthClient] Forgot password error:', error);
      return { error: error?.message || 'Failed to send reset email' };
    }
  }
}

export const authClient = new AuthClient();

