export interface PublicUser {
  id: string;
  email: string;
  username: string;
}

export interface AuthResponse {
  user: PublicUser;
  accessToken: string;
  refreshToken: string;
}
