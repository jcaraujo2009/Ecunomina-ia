import { UserRole } from './index';

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      companyId?: string | null;
      role?: UserRole;
    }
  }

  interface User {
    companyId?: string | null;
    role?: UserRole;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    companyId?: string | null;
    role?: UserRole;
  }
}
