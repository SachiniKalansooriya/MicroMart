// frontend/src/services/authService.ts
const API_BASE_URL = 'https://kpk440vdkf.execute-api.eu-north-1.amazonaws.com/prod';

export interface SignupData {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role?: 'admin' | 'customer';
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role?: 'admin' | 'customer';
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface User {
  userId: string;
  name: string;
  email: string;
  phone: string;
  role: 'admin' | 'customer';
  createdAt: string;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
}

export const authService = {
  async signup(userData: SignupData): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Signup failed');
    }
    
    return response.json();
  },

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Login failed');
    }
    
    const data: AuthResponse = await response.json();
    
    if (data.token) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
    }
    
    return data;
  },

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getToken(): string | null {
    return localStorage.getItem('token');
  },

  getUser(): User | null {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  isAdmin(): boolean {
    const user = this.getUser();
    return user?.role === 'admin';
  },

  isAuthenticated(): boolean {
    return !!this.getToken();
  },

  // Alias for signup to maintain compatibility
  register(userData: RegisterData): Promise<AuthResponse> {
    return this.signup(userData);
  }
};

export default authService;