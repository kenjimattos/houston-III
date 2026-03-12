export interface UserSessionInfo {
  id: string;
  email: string;
  userRole: string | null;
  roles: string[];
  permissions: string[];
  grupoIds: string[];
  grupoId: string | null;
  userName: string | null;
  isAdmin: boolean;
}
