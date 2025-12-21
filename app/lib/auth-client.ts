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
 * 
 * Defaults to port 3000, but can be overridden via NEXT_PUBLIC_BACKEND_URL environment variable.
 * If your backend runs on a different port (e.g., 3001), set NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
 */
function getBackendUrl(): string {
  const defaultUrl = 'http://localhost:3000'; // Backend default port from main.ts
  if (typeof window === 'undefined') {
    return process.env.NEXT_PUBLIC_BACKEND_URL || defaultUrl;
  }
  return process.env.NEXT_PUBLIC_BACKEND_URL || defaultUrl;
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
        // Not authenticated - this is normal for logged-out users
        if (response.status === 404 || response.status === 401) {
          return null;
        }
        console.error('[AuthClient] Session error:', response.status);
        return null;
      }

      const data = await response.json();
      
      // BetterAuth returns { user, session } or { user, token } format
      if (data && data.user) {
        // If we have a session object, use it directly
        if (data.session) {
          return data as Session;
        }
        // If we have a token, construct session object
        if (data.token) {
          return {
            user: data.user,
            session: {
              id: data.token,
              token: data.token,
              expiresAt: data.session?.expiresAt ? new Date(data.session.expiresAt) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            },
          };
        }
        // If we only have user, try to construct minimal session
        if (data.user) {
          return {
            user: data.user,
            session: {
              id: data.user.id,
              token: '', // Will be set from cookie
              expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            },
          };
        }
      }
      return null;
    } catch (error: any) {
      // Network error or CORS - return null silently (user is not authenticated)
      // Only log if it's not a network error (which is expected when backend is down)
      if (error?.message && !error.message.includes('Failed to fetch')) {
        console.error('[AuthClient] Failed to get session:', error);
      }
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
        const errorMessage = data.message || data.error?.message || data.error || JSON.stringify(data) || `HTTP ${response.status}: Sign in failed`;
        return { error: errorMessage };
      }

      // BetterAuth returns { token, user } on sign-in success
      if (data.user && data.token) {
        // Construct Session object from BetterAuth response
        const session: Session = {
          user: data.user,
          session: {
            id: data.token, // Use token as session ID
            token: data.token,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default 7 days expiry
          },
        };
        return { session };
      }
      
      console.error('[AuthClient] Invalid sign-in response format:', data);
      return { error: 'Invalid response format' };
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
        // BetterAuth returns errors in different formats
        const errorMessage = data.message || data.error?.message || data.error || JSON.stringify(data) || `HTTP ${response.status}: Sign up failed`;
        console.error('[AuthClient] Sign up error response:', { status: response.status, data });
        return { error: errorMessage };
      }

      // BetterAuth returns { token, user } on sign-up success
      if (data.user && data.token) {
        // Construct Session object from BetterAuth response
        const session: Session = {
          user: data.user,
          session: {
            id: data.token, // Use token as session ID
            token: data.token,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default 7 days expiry
          },
        };
        return { session };
      }
      
      console.error('[AuthClient] Invalid sign-up response format:', data);
      return { error: 'Invalid response format' };
    } catch (error: any) {
      console.error('[AuthClient] Sign up error:', error);
      return { error: error?.message || 'Sign up failed' };
    }
  }

  /**
   * Sign in with Google OAuth
   */
  async signInWithGoogle(): Promise<void> {
    // BetterAuth OAuth flow - the backend will handle redirect to Google
    // After Google auth, BetterAuth will redirect back to the callbackURL
    const frontendUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    const callbackUrl = `${frontendUrl}/`;
    const redirectUrl = `${this.baseUrl}/api/auth/sign-in/social?provider=google&callbackURL=${encodeURIComponent(callbackUrl)}`;
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

