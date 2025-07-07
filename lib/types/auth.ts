export interface Farm {
  id: string;
  name: string;
  location: string;
  size: number;
  userId: string;
  createdAt: string;
  updatedAt: string;
  owner: User;
  collaborators: Collaborator[];
}

export interface User {
  id: string;
  email: string;
  phoneNumber?: string;
  passwordHash: string;
  fullName: string;
  county: string;
  subCounty: string;
  profilePictureUrl?: string;
  locationLat?: number;
  locationLng?: number;
  subscriptionType: "free" | "premium";
  subscriptionExpiresAt?: Date;
  role: "user" | "admin";
  farms?: Farm[];
  createdAt: string;
  updatedAt: string;
  name: string;
}

export interface RegisterRequest {
  fullName: string
  email?: string
  phoneNumber?: string
  password: string
  county: string
  subCounty: string
  locationLat?: number
  locationLng?: number
}

export interface LoginRequest {
  identifier: string // email or phone number
  password: string
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  expiresIn: number
  tokenType: "Bearer"
}

export interface AuthResponse {
  user: User
  token: string
}

export interface JWTPayload {
  userId: string
  email?: string
  phoneNumber?: string
  subscriptionType: "free" | "premium"
  role: "user" | "admin"
  iat: number
  exp: number
}

export interface RefreshTokenPayload {
  userId: string
  tokenId: string
  iat: number
  exp: number
}

export interface PasswordResetRequest {
  identifier: string // email or phone number
}

export interface PasswordResetConfirm {
  token: string
  newPassword: string
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
}

export interface VerifyEmailRequest {
  token: string
}

export interface VerifyPhoneRequest {
  phoneNumber: string
  verificationCode: string
}

export interface AuthenticatedRequest extends Request {
  user: User
}

// Subscription types
export interface SubscriptionFeatures {
  canAccessWeatherData: boolean
  canExportData: boolean
  canAccessAdvancedAnalytics: boolean
  canAccessSoilRecommendations: boolean
  maxProductionCycles: number
  maxPestAnalysesPerMonth: number
  canAccessMarketplace: boolean
}

export const SUBSCRIPTION_FEATURES: Record<"free" | "premium", SubscriptionFeatures> = {
  free: {
    canAccessWeatherData: false,
    canExportData: false,
    canAccessAdvancedAnalytics: false,
    canAccessSoilRecommendations: false,
    maxProductionCycles: 3,
    maxPestAnalysesPerMonth: 5,
    canAccessMarketplace: false,
  },
  premium: {
    canAccessWeatherData: true,
    canExportData: true,
    canAccessAdvancedAnalytics: true,
    canAccessSoilRecommendations: true,
    maxProductionCycles: -1, // unlimited
    maxPestAnalysesPerMonth: -1, // unlimited
    canAccessMarketplace: true,
  },
}

export type CollaboratorRole = 'manager' | 'worker' | 'family_member' | 'viewer';

export interface RolePermissions {
  canCreateCycles: boolean;
  canEditCycles: boolean;
  canDeleteCycles: boolean;
  canAssignTasks: boolean;
  canViewFinancials: boolean;
}

export interface Collaborator {
  id: string;
  userId: string;
  farmId: string;
  role: CollaboratorRole;
  status: 'pending' | 'active' | 'inactive';
  inviteToken?: string;
  invitedBy: string;
  invitedAt: string;
  acceptedAt?: string;
  email: string;
  phoneNumber?: string;
  fullName: string;
  createdAt: string;
  updatedAt: string;
  permissions: {
    canCreateCycles: boolean;
    canEditCycles: boolean;
    canDeleteCycles: boolean;
    canAssignTasks: boolean;
    canViewFinancials: boolean;
  };
}

export interface CollaborationInvite {
  id: string;
  email: string;
  phoneNumber?: string;
  role: CollaboratorRole;
  farmId: string;
  inviteToken: string;
  status: 'pending' | 'accepted' | 'expired';
  invitedBy: string;
  invitedAt: string;
  expiresAt: string;
}

export const ROLE_PERMISSIONS: Record<CollaboratorRole, RolePermissions> = {
  manager: {
    canCreateCycles: true,
    canEditCycles: true,
    canDeleteCycles: false,
    canAssignTasks: true,
    canViewFinancials: true
  },
  worker: {
    canCreateCycles: false,
    canEditCycles: false,
    canDeleteCycles: false,
    canAssignTasks: false,
    canViewFinancials: false
  },
  family_member: {
    canCreateCycles: true,
    canEditCycles: true,
    canDeleteCycles: false,
    canAssignTasks: false,
    canViewFinancials: true
  },
  viewer: {
    canCreateCycles: false,
    canEditCycles: false,
    canDeleteCycles: false,
    canAssignTasks: false,
    canViewFinancials: false
  }
};

export type RegisterData = {
  email: string;
  password: string;
  fullName: string;
  phoneNumber?: string;
};

export type AuthContextType = {
  user: User | null;
  farm: Farm | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
};

export interface CollaboratorInvite {
  id: string;
  email: string;
  role: string;
  status: string;
  farm: Farm;
  invitedBy: User;
  createdAt: string;
  expiresAt: string;
}
