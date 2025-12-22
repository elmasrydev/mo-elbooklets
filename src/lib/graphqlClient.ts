/**
 * GraphQL Client with Fallback URL Support
 * 
 * This module provides a GraphQL client that uses the centralized API configuration
 * and supports fallback URLs for network resilience.
 */

import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { tryFetchWithFallback } from '../config/api';

/**
 * Execute a GraphQL query or mutation with automatic fallback
 */
export const executeGraphQL = async <TData = any, TVariables = any>(
  query: string,
  variables?: TVariables,
  requireAuth: boolean = true
): Promise<{ data?: TData; errors?: any[] }> => {
  let token: string | null = null;

  if (requireAuth) {
    token = await AsyncStorage.getItem('auth_token');
    if (!token) {
      throw new Error('Authentication required');
    }
  }

  try {
    const result = await tryFetchWithFallback(query, variables, token || undefined);
    return result;
  } catch (error: any) {
    console.error('GraphQL execution error:', error);
    throw error;
  }
};

/**
 * Custom hook for GraphQL queries with fallback support
 */
export const useGraphQLQuery = <TData = any, TVariables = any>(
  query: string,
  variables?: TVariables,
  options?: {
    skip?: boolean;
    requireAuth?: boolean;
    onCompleted?: (data: TData) => void;
    onError?: (error: Error) => void;
  }
) => {
  const [data, setData] = React.useState<TData | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  const executeQuery = React.useCallback(async () => {
    if (options?.skip) return;

    try {
      setLoading(true);
      setError(null);

      const result = await executeGraphQL<TData, TVariables>(
        query,
        variables,
        options?.requireAuth !== false
      );

      if (result.errors && result.errors.length > 0) {
        const error = new Error(result.errors[0].message || 'GraphQL Error');
        setError(error);
        options?.onError?.(error);
      } else if (result.data) {
        setData(result.data);
        options?.onCompleted?.(result.data);
      }
    } catch (err: any) {
      const error = err instanceof Error ? err : new Error(err.message || 'Unknown error');
      setError(error);
      options?.onError?.(error);
    } finally {
      setLoading(false);
    }
  }, [query, variables, options]);

  React.useEffect(() => {
    executeQuery();
  }, [executeQuery]);

  return {
    data,
    loading,
    error,
    refetch: executeQuery,
  };
};

/**
 * Custom hook for GraphQL mutations with fallback support
 */
export const useGraphQLMutation = <TData = any, TVariables = any>(
  mutation: string,
  options?: {
    requireAuth?: boolean;
    onCompleted?: (data: TData) => void;
    onError?: (error: Error) => void;
  }
) => {
  const [data, setData] = React.useState<TData | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  const executeMutation = React.useCallback(async (variables?: TVariables) => {
    try {
      setLoading(true);
      setError(null);

      const result = await executeGraphQL<TData, TVariables>(
        mutation,
        variables,
        options?.requireAuth !== false
      );

      if (result.errors && result.errors.length > 0) {
        const error = new Error(result.errors[0].message || 'GraphQL Error');
        setError(error);
        options?.onError?.(error);
        return { data: null, error };
      } else if (result.data) {
        setData(result.data);
        options?.onCompleted?.(result.data);
        return { data: result.data, error: null };
      }

      return { data: null, error: null };
    } catch (err: any) {
      const error = err instanceof Error ? err : new Error(err.message || 'Unknown error');
      setError(error);
      options?.onError?.(error);
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  }, [mutation, options]);

  return [executeMutation, { data, loading, error }] as const;
};


