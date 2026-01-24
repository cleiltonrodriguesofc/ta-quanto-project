import { render, fireEvent, waitFor } from '@testing-library/react-native';
import React from 'react';
import { AuthProvider } from '../context/AuthContext';
import LoginScreen from '../app/auth/login';
import { supabase } from '../utils/supabase';

// Mock Expo modules
jest.mock('expo-router', () => ({
    useRouter: () => ({
        push: jest.fn(),
        back: jest.fn(),
    }),
}));

jest.mock('expo-web-browser', () => ({
    openAuthSessionAsync: jest.fn(() => Promise.resolve({ type: 'success', url: 'exp://localhost/auth/callback?access_token=123&refresh_token=456' })),
    maybeCompleteAuthSession: jest.fn(),
}));

jest.mock('expo-auth-session', () => ({
    makeRedirectUri: jest.fn(() => 'exp://localhost/auth/callback'),
}));

jest.mock('expo-auth-session/build/QueryParams', () => ({
    getQueryParams: jest.fn(() => ({ access_token: '123', refresh_token: '456' })),
}));

// Mock Supabase
jest.mock('../utils/supabase', () => ({
    supabase: {
        auth: {
            signInWithOAuth: jest.fn(() => Promise.resolve({ data: { url: 'https://google.com/auth' }, error: null })),
            setSession: jest.fn(() => Promise.resolve({ error: null })),
            getSession: jest.fn(() => Promise.resolve({ data: { session: null } })),
            onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } })),
            signOut: jest.fn(),
        },
    },
}));

describe('Google Authentication', () => {
    it('triggers signInWithGoogle when button is pressed', async () => {
        const { getByText } = render(
            <AuthProvider>
                <LoginScreen />
            </AuthProvider>
        );

        const googleButton = getByText('Sign in with Google');
        expect(googleButton).toBeTruthy();

        fireEvent.press(googleButton);

        await waitFor(() => {
            expect(supabase.auth.signInWithOAuth).toHaveBeenCalledWith({
                provider: 'google',
                options: {
                    redirectTo: 'exp://localhost/auth/callback',
                    skipBrowserRedirect: true,
                },
            });
        });
    });
});
