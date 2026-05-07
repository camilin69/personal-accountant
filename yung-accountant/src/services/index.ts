// services/index.ts
// Exportar servicios
export { authService } from './auth.service';
export { userService } from './user.service';
export { metaService } from './meta.service';
export { categoryService } from './category.service';
export type { CreateCategoryRequest, UpdateCategoryRequest, CategoryResponse } from './category.service';

// Exportar tipos
export type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  LogoutRequest,
  UserProfile,
  UpdateUserRequest,
  UpdateUserResponse,
  Client,
  Role,
} from './types/user.types';

// Exportar instancias de axios
export { authAxios, usersAxios, postsAxios, categoriesAxios, axiosInstance } from './api/axios.config';

// Inicializar interceptores
import './api/auth.interceptor';