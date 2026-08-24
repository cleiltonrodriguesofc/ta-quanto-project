import { IAuthService, AuthSession } from '../../domain/repositories/IAuthService';
import { apiClient } from './apiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode'; // We will need to add jwt-decode

export class ApiAuthService implements IAuthService {
  async signInWithEmail(email: string, password: string): Promise<AuthSession> {
    try {
      const response = await apiClient.post('/api/v1/auth/login', { email, password });
      const { access_token, refresh_token } = response.data;
      
      await AsyncStorage.setItem('@auth_access_token', access_token);
      await AsyncStorage.setItem('@auth_refresh_token', refresh_token);
      
      const decoded: any = jwtDecode(access_token);
      
      return {
        userId: decoded.sub,
        email: email,
        accessToken: access_token,
      };
    } catch (error) {
      console.error('Login failed', error);
      throw new Error('Credenciais inválidas');
    }
  }

  async signUpWithEmail(email: string, password: string): Promise<AuthSession> {
    try {
      // name is required in our backend RegisterRequest
      const response = await apiClient.post('/api/v1/auth/register', { 
        email, 
        password,
        name: email.split('@')[0] // Default name
      });
      const { access_token, refresh_token } = response.data;
      
      await AsyncStorage.setItem('@auth_access_token', access_token);
      await AsyncStorage.setItem('@auth_refresh_token', refresh_token);
      
      const decoded: any = jwtDecode(access_token);
      
      return {
        userId: decoded.sub,
        email: email,
        accessToken: access_token,
      };
    } catch (error) {
      console.error('Register failed', error);
      throw new Error('Erro ao registrar usuário');
    }
  }

  async signInWithGoogle(): Promise<AuthSession> {
    // To be implemented via backend later
    throw new Error('Login com Google em desenvolvimento');
  }

  async signOut(): Promise<void> {
    try {
      const refresh_token = await AsyncStorage.getItem('@auth_refresh_token');
      if (refresh_token) {
        await apiClient.post('/api/v1/auth/logout', { refresh_token });
      }
    } catch (e) {
      console.error('Logout sync error', e);
    } finally {
      await AsyncStorage.removeItem('@auth_access_token');
      await AsyncStorage.removeItem('@auth_refresh_token');
    }
  }

  async getSession(): Promise<AuthSession | null> {
    try {
      const accessToken = await AsyncStorage.getItem('@auth_access_token');
      if (!accessToken) return null;

      const decoded: any = jwtDecode(accessToken);
      const isExpired = decoded.exp * 1000 < Date.now();

      if (!isExpired) {
        return {
          userId: decoded.sub,
          email: '',
          accessToken,
        };
      }

      // Access token expirado → tenta renovar com o refresh token
      const refreshToken = await AsyncStorage.getItem('@auth_refresh_token');
      if (!refreshToken) return null;

      try {
        const { data } = await apiClient.post('/api/v1/auth/refresh', {
          refresh_token: refreshToken,
        });

        if (data.access_token) {
          await AsyncStorage.setItem('@auth_access_token', data.access_token);
          await AsyncStorage.setItem('@auth_refresh_token', data.refresh_token);

          const newDecoded: any = jwtDecode(data.access_token);
          return {
            userId: newDecoded.sub,
            email: '',
            accessToken: data.access_token,
          };
        }
      } catch (refreshError) {
        console.warn('[ApiAuthService] Refresh token inválido, sessão encerrada.');
        await AsyncStorage.removeItem('@auth_access_token');
        await AsyncStorage.removeItem('@auth_refresh_token');
      }

      return null;
    } catch (error) {
      return null;
    }
  }
}
