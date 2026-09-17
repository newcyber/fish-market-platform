export interface LandingPageIosAppData {
  id: string;
  key: string;
  enabled: boolean;
  appName: string;
  version: string;
  description: string | null;
  appStoreUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdateLandingPageIosAppInput {
  enabled?: boolean;
  appName: string;
  version: string;
  description?: string | null;
  appStoreUrl?: string | null;
}