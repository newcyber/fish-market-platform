export type UserRole =
  | "ADMIN"
  | "CUSTOMER";

export interface Address {
  id: string;

  label: string;

  recipientName: string;

  phone: string;

  address: string;

  province: string;

  city: string;

  district: string;

  postalCode: string;

  latitude: number | null;

  longitude: number | null;

  isDefault: boolean;

  createdAt: Date;

  updatedAt: Date;
}

export interface User {
  id: string;

  name: string;

  email: string;

  phone: string | null;

  image: string | null;

  role: UserRole;

  isActive: boolean;

  createdAt: Date;

  updatedAt: Date;

  deletedAt: Date | null;

  addresses: Address[];
}

export interface UserFormData {
  name: string;

  email: string;

  phone: string;

  password: string;

  role: UserRole;

  isActive: boolean;
}

export interface UserTableItem {
  id: string;

  name: string;

  email: string;

  phone: string | null;

  role: UserRole;

  isActive: boolean;

  totalAddresses: number;

  totalOrders: number;

  createdAt: Date;
}

export interface UserActionResult {
  success: boolean;

  message: string;
}