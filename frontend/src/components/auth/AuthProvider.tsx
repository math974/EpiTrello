import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { me, UserModel } from '@/lib/authClient';
import { getAccessToken, setAccessToken } from '@/lib/tokenStore';
import { REFRESH_TOKEN_MUTATION } from '@/lib/auth.graphql';
import { print } from 'graphql';

interface AuthContextType {
  user: UserModel | null;
  loading: boolean;
  isAuthenticated: boolean;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<UserModel | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = async () => {
    try {
      setLoading(true);
      
      const token = getAccessToken();
      
      // If no token but we might have a cookie, try to refresh first
      if (!token) {
        console.log('🔄 No access token, attempting refresh via cookie...');
        try {
          const graphqlUri = process.env.NEXT_PUBLIC_GRAPHQL_API || 'http://localhost:4000/graphql';
          const response = await fetch(graphqlUri, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include', // Include cookies (refreshToken is in httpOnly cookie)
            body: JSON.stringify({
              query: print(REFRESH_TOKEN_MUTATION),
              variables: {
                input: {}, // Empty input - will use cookie
              },
            }),
          });

          if (response.ok) {
            const result = await response.json();
            if (result.data?.refreshToken?.accessToken) {
              console.log('✅ Token refreshed successfully via cookie');
              setAccessToken(result.data.refreshToken.accessToken);
              // Now try me() with the new token
              const userData = await me();
              if (userData) {
                setUser(userData);
                return;
              }
            } else {
              console.warn('⚠️ Refresh response OK but no access token:', result);
            }
          } else {
            console.error('❌ Refresh request failed:', response.status, response.statusText);
            const errorText = await response.text();
            console.error('Response body:', errorText);
          }
        } catch (refreshError) {
          console.error('❌ Failed to refresh token:', refreshError);
          // Continue to try me() anyway
        }
      }
      
      // Try to get user data
      // If token is expired, apollo.ts will automatically refresh it using the httpOnly cookie
      // The backend now throws UNAUTHENTICATED if token is present but expired, triggering auto-refresh
      const userData = await me();
      
      if (userData) {
        setUser(userData);
      } else {
        setUser(null);
      }
    } catch (error: any) {
      // If refresh failed or no valid token/cookie, user is not authenticated
      console.error('❌ Auth check failed:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check authentication on mount
    checkAuth();
  }, []);

  const value: AuthContextType = {
    user,
    loading,
    isAuthenticated: !!user,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

