// types/user.types.ts
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  age: number;
  profilePic?: string;
  clientId: string;
  role: string;
  username?: string;
  displayName?: string;
  password?: string;
  plan?: 'free' | 'premium' | 'business';
  avatar?: string;
  bio?: string;
  location?: string;
  website?: string;
  followers?: string[];
  following?: string[];
  joinedAt?: string;
  accessToken?: string;
  refreshToken?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Client {
  id: string;
  name: string;
  description: string;
}

export interface Role {
  id: string;
  name: string;
  description: string;
}