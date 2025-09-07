/**
 * Authentication Store for Jellyfin User Session Management
 *
 * This module provides a persistent authentication store using Zustand with expo-secure-store
 * for secure storage of user credentials and session data. The store is optimized to stay
 * under SecureStore's 2048-byte limit by storing only essential user data.
 *
 * @module useAuthStore
 */

import { UserDto } from '@jellyfin/sdk/lib/generated-client/models';
import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

/**
 * Minimal user data interface optimized for secure storage.
 * Contains only essential fields needed for Jellyfin API authentication.
 */
export type MinimalUser = {
    /** Required. The unique identifier for the Jellyfin user. */
    Id: string;

    /** Required. The display name of the user. */
    Name: string;
};

/**
 * Authentication state interface defining all stored authentication data and actions.
 */
type AuthState = {
    /** Optional. The currently authenticated user data, null if not authenticated. */
    user: MinimalUser | null;

    /** Optional. The JWT access token for API requests, null if not authenticated. */
    accessToken: string | null;

    /** Required. Boolean flag indicating if the user is currently authenticated. */
    isAuthenticated: boolean;

    /** Optional. Timestamp of the last successful login, null if never logged in. */
    lastLoginTime: number | null;

    /** Required. Stores user authentication data in secure storage. */
    setAuth: (user: UserDto, accessToken: string) => MinimalUser;

    /** Required. Clears all authentication data from storage and memory. */
    clearAuth: () => void;

    /** Required. Validates if the current session is still valid based on timeout. */
    isSessionValid: () => boolean;
};

/**
 * Custom secure storage implementation for expo-secure-store.
 * Provides encrypted storage for sensitive authentication data with error handling.
 *
 * @remarks
 * All storage operations include try-catch blocks to gracefully handle storage failures.
 * Storage size is not monitored here as the auth state is optimized to stay under limits.
 */
const secureStorage = {
    /**
     * Retrieves a value from secure storage.
     *
     * @param name - The key name to retrieve
     * @returns The stored value as a string, or null if not found or error occurred
     */
    getItem: async (name: string): Promise<string | null> => {
        try {
            return await SecureStore.getItemAsync(name);
        } catch (error) {
            return null;
        }
    },

    /**
     * Stores a value in secure storage.
     *
     * @param name - The key name to store under
     * @param value - The string value to store
     * @returns Promise that resolves when storage is complete
     */
    setItem: async (name: string, value: string): Promise<void> => {
        try {
            await SecureStore.setItemAsync(name, value);
        } catch (error) {
            // Silently handle storage errors
        }
    },

    /**
     * Removes a value from secure storage.
     *
     * @param name - The key name to remove
     * @returns Promise that resolves when removal is complete
     */
    removeItem: async (name: string): Promise<void> => {
        try {
            await SecureStore.deleteItemAsync(name);
        } catch (error) {
            // Silently handle storage errors
        }
    },
};

/**
 * Persistent authentication store for Jellyfin user sessions.
 *
 * This store manages user authentication state with secure persistence across app restarts.
 * It automatically handles session validation and provides methods for login/logout operations.
 *
 * @example
 * ```typescript
 * const { user, isAuthenticated, setAuth, clearAuth, isSessionValid } = useAuthStore();
 *
 * // Check if user is authenticated
 * if (isAuthenticated && isSessionValid()) {
 *     console.log(`Logged in as: ${user?.Name}`);
 * }
 *
 * // Store authentication after login
 * setAuth(userData, accessToken);
 *
 * // Clear authentication on logout
 * clearAuth();
 * ```
 *
 * @remarks
 * - Session data is encrypted using expo-secure-store
 * - Sessions expire after 24 hours automatically
 * - Only essential user data is stored to minimize storage size
 * - All authentication state persists across app restarts
 */
export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            accessToken: null,
            isAuthenticated: false,
            lastLoginTime: null,

            /**
             * Stores user authentication data and marks the user as authenticated.
             * Extracts only essential user data to minimize secure storage usage.
             *
             * @param user - The complete UserDto object from Jellyfin authentication
             * @param accessToken - The JWT access token for API requests
             *
             * @remarks
             * Only the user ID and name are extracted from the full UserDto to keep
             * storage under the 2048-byte SecureStore limit.
             */
            setAuth: (user: UserDto, accessToken: string) => {
                const minimalUser: MinimalUser = {
                    Id: user.Id!,
                    Name: user.Name || 'Unknown User',
                };

                set({
                    user: minimalUser,
                    accessToken,
                    isAuthenticated: true,
                    lastLoginTime: Date.now(),
                });

                return minimalUser;
            },

            /**
             * Clears all authentication data and marks the user as unauthenticated.
             * This should be called on logout or when authentication fails.
             */
            clearAuth: () => {
                set({
                    user: null,
                    accessToken: null,
                    isAuthenticated: false,
                    lastLoginTime: null,
                });
            },

            /**
             * Validates if the current authentication session is still valid.
             * Sessions are considered valid for 24 hours from the last login time.
             *
             * @returns True if the user is authenticated and session hasn't expired
             */
            isSessionValid: () => {
                const { isAuthenticated, lastLoginTime } = get();
                if (!isAuthenticated || !lastLoginTime) return false;

                // Consider session invalid after 24 hours.
                const SESSION_TIMEOUT = 24 * 60 * 60 * 1000;
                return Date.now() - lastLoginTime < SESSION_TIMEOUT;
            },
        }),
        {
            name: 'jellyfin-auth',
            storage: createJSONStorage(() => secureStorage),
            // Only persist essential fields to minimize storage size
            partialize: state => ({
                user: state.user,
                accessToken: state.accessToken,
                isAuthenticated: state.isAuthenticated,
                lastLoginTime: state.lastLoginTime,
            }),
        }
    )
);
