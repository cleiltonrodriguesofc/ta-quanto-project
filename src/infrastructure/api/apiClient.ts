import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// URL do FastAPI (pode ser o IP local durante o desenvolvimento, ex: http://192.168.1.100:8000)
// Configurado via variável de ambiente
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Bypass-Tunnel-Reminder': 'true', // Essencial para o localtunnel não retornar a página de aviso em HTML
  },
});

// Interceptor para injetar o token de acesso
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('@auth_access_token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      console.warn('Erro ao ler o token', e);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para lidar com token expirado (refresh)
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Se recebermos 401 e a requisição ainda não foi tentada novamente
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = await AsyncStorage.getItem('@auth_refresh_token');
        if (refreshToken) {
          // Tenta atualizar o token
          const { data } = await axios.post(`${API_URL}/api/v1/auth/refresh`, {
            refresh_token: refreshToken
          });
          
          if (data.access_token) {
            await AsyncStorage.setItem('@auth_access_token', data.access_token);
            await AsyncStorage.setItem('@auth_refresh_token', data.refresh_token);
            
            // Refaz a requisição original com o novo token
            originalRequest.headers.Authorization = `Bearer ${data.access_token}`;
            return apiClient(originalRequest);
          }
        }
      } catch (refreshError) {
        // Se o refresh falhar, limpa os tokens (usuário deslogado)
        await AsyncStorage.removeItem('@auth_access_token');
        await AsyncStorage.removeItem('@auth_refresh_token');
        // Redirecionamento pode ser feito em um provider superior ou evento
      }
    }
    
    return Promise.reject(error);
  }
);
