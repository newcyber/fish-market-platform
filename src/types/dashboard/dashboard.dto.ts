export interface DashboardStatsDTO {
  totalProducts: number;
  totalCustomers: number;
  totalOrders: number;
  pendingPayments: number;
}

export interface RecentOrderDTO {
  id: string;
  orderNumber: string;
  customer: string;
  total: number;
  status: string;
  createdAt: Date;
}

export interface RecentCustomerDTO {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  joinedAt: Date;
}

export interface DashboardDTO {
  stats: DashboardStatsDTO;
  recentOrders: RecentOrderDTO[];
  recentCustomers: RecentCustomerDTO[];
}