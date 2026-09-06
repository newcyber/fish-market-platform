import bcrypt from "bcryptjs";

import type { Prisma, Role } from "@prisma/client";

import CustomerRepository, {
  type CustomerFilters,
} from "@/repositories/CustomerRepository";

export interface CreateCustomerInput {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role: Role;
  isActive: boolean;
}

export interface UpdateCustomerInput {
  name?: string;
  email?: string;
  password?: string;
  phone?: string;
  role?: Role;
  isActive?: boolean;
}

export type CustomerSegment =
  | "BARU"
  | "REPEAT"
  | "LOYAL"
  | "VIP"
  | "AKTIF"
  | "DORMANT";

export interface CustomerListItem {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: Role;
  isActive: boolean;
  createdAt: Date;
  totalOrders: number;
  totalSpent: number;
  rewardPointsBalance: number;
  lastOrderAt: Date | null;
  area: string;
  segment: CustomerSegment;
}

export interface CustomerListResult {
  customers: CustomerListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface CustomerStats {
  totalCustomers: number;
  newCustomersThisMonth: number;
  activeCustomers30Days: number;
  repeatCustomers: number;
}

export default class CustomerService {
  /**
   * Daftar customer.
   */
  static async getCustomers(
    filters: CustomerFilters = {}
  ) {
    return CustomerRepository.findMany(filters);
  }

  /**
   * Daftar customer yang sudah dihapus.
   */
  static async getDeletedCustomers() {
    return CustomerRepository.findDeleted();
  }

  /**
   * Detail customer.
   */
  static async getCustomerById(
    id: string
  ) {
    return CustomerRepository.findById(id);
  }

  /**
   * Statistik customer untuk dashboard admin.
   */
  static async getCustomerStats(): Promise<CustomerStats> {
    return CustomerRepository.getStats();
  }

    /**
   * Daftar area customer untuk filter admin.
   */
  static async getCustomerAreas(): Promise<string[]> {
    return CustomerRepository.getCustomerAreas();
  }

  /**
   * Daftar customer untuk halaman admin.
   *
   * Alur:
   * 1. Ambil customer + aggregate order.
   * 2. Bentuk CustomerListItem.
   * 3. Hitung segment.
   * 4. Filter segment.
   * 5. Hitung total hasil filter.
   * 6. Terapkan pagination.
   *
   * Segment HARUS dihitung sebelum pagination agar
   * filter segment dan total pagination tetap akurat.
   */
  static async getCustomerList(
    filters: CustomerFilters = {}
  ): Promise<CustomerListResult> {
    const page = Math.max(
      Number(filters.page ?? 1),
      1
    );

    const limit = Math.max(
      Number(filters.limit ?? 10),
      1
    );

    const customers =
      await CustomerRepository.findCustomersWithAggregatedMetrics(
        filters
      );

    const mappedCustomers: CustomerListItem[] =
      customers.map((customer) => {
        const address =
          customer.addresses.find(
            (item) => item.isDefault
          ) ?? customer.addresses[0];

        const area = address
          ? [address.district, address.city]
              .filter(Boolean)
              .join(", ")
          : "-";

        const totalOrders =
          customer.totalOrders;

        const totalSpent =
          customer.totalSpent;

        const lastOrderAt =
          customer.lastOrderAt;

        return {
          id: customer.id,
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          role: customer.role,
          isActive: customer.isActive,
          createdAt: customer.createdAt,
          totalOrders,
          totalSpent,
          rewardPointsBalance:
            customer.rewardPointsBalance,
          lastOrderAt,
          area,
          segment: this.resolveSegment({
            createdAt: customer.createdAt,
            totalOrders,
            totalSpent,
            lastOrderAt,
          }),
        };
      });

    /**
     * Filter segment dilakukan setelah segment dihitung
     * dan sebelum pagination.
     */
    const filteredCustomers =
      filters.segment
        ? mappedCustomers.filter(
            (customer) =>
              customer.segment ===
              filters.segment
          )
        : mappedCustomers;

    const total =
      filteredCustomers.length;

    const totalPages =
      total === 0
        ? 0
        : Math.ceil(total / limit);

    /**
     * Jika page yang diminta melebihi halaman terakhir,
     * gunakan halaman terakhir yang valid.
     *
     * Untuk data kosong tetap gunakan page 1.
     */
    const currentPage =
      totalPages === 0
        ? 1
        : Math.min(page, totalPages);

    const startIndex =
      (currentPage - 1) * limit;

    const endIndex =
      startIndex + limit;

    const paginatedCustomers =
      filteredCustomers.slice(
        startIndex,
        endIndex
      );

    return {
      customers: paginatedCustomers,
      pagination: {
        page: currentPage,
        limit,
        total,
        totalPages,
        hasNextPage:
          currentPage < totalPages,
        hasPreviousPage:
          currentPage > 1,
      },
    };
  }

  /**
   * Menentukan segment customer berdasarkan
   * aktivitas pembelian.
   *
   * Prioritas:
   * VIP
   * LOYAL
   * REPEAT
   * BARU
   * DORMANT
   * AKTIF
   */
  static resolveSegment(input: {
    createdAt: Date;
    totalOrders: number;
    totalSpent: number;
    lastOrderAt: Date | null;
  }): CustomerSegment {
    const now = Date.now();

    const thirtyDays =
      30 * 24 * 60 * 60 * 1000;

    const sixtyDays =
      60 * 24 * 60 * 60 * 1000;

    const customerAge =
      now -
      input.createdAt.getTime();

    const lastOrderAge =
      input.lastOrderAt
        ? now -
          input.lastOrderAt.getTime()
        : null;

    /**
     * VIP
     *
     * Minimal 10 transaksi berhasil
     * ATAU total belanja minimal Rp5.000.000.
     */
    if (
      input.totalOrders >= 10 ||
      input.totalSpent >= 5_000_000
    ) {
      return "VIP";
    }

    /**
     * LOYAL
     *
     * Minimal 5 transaksi berhasil.
     */
    if (
      input.totalOrders >= 5
    ) {
      return "LOYAL";
    }

    /**
     * REPEAT
     *
     * Minimal 2 transaksi berhasil.
     */
    if (
      input.totalOrders >= 2
    ) {
      return "REPEAT";
    }

    /**
     * BARU
     *
     * Customer berusia maksimal 30 hari
     * dan belum memiliki 2 transaksi.
     */
    if (
      customerAge <= thirtyDays &&
      input.totalOrders < 2
    ) {
      return "BARU";
    }

    /**
     * DORMANT
     *
     * Tidak melakukan transaksi
     * selama lebih dari 60 hari.
     */
    if (
      lastOrderAge !== null &&
      lastOrderAge > sixtyDays
    ) {
      return "DORMANT";
    }

    /**
     * AKTIF
     *
     * Default apabila tidak memenuhi
     * segment lainnya.
     */
    return "AKTIF";
  }

  /**
   * Membuat customer baru.
   */
  static async createCustomer(
    input: CreateCustomerInput
  ) {
    if (input.role !== "CUSTOMER") {
      throw new Error(
        "Role customer hanya dapat berupa CUSTOMER."
      );
    }

    const exists =
      await CustomerRepository.findByEmail(
        input.email
      );

    if (exists) {
      throw new Error(
        "Email sudah digunakan."
      );
    }

    if (input.phone) {
      const phoneExists =
        await CustomerRepository.findByPhone(
          input.phone
        );

      if (phoneExists) {
        throw new Error(
          "Nomor telepon sudah digunakan."
        );
      }
    }

    const password =
      await bcrypt.hash(
        input.password,
        10
      );

    return CustomerRepository.create({
      name: input.name,
      email: input.email,
      password,
      phone: input.phone,
      role: input.role,
      isActive: input.isActive,
    });
  }

  /**
   * Update customer.
   */
  static async updateCustomer(
    id: string,
    input: UpdateCustomerInput
  ) {
    if (
      input.role !== undefined &&
      input.role !== "CUSTOMER"
    ) {
      throw new Error(
        "Role customer hanya dapat berupa CUSTOMER."
      );
    }

    const customer =
      await CustomerRepository.findById(
        id
      );

    if (!customer) {
      throw new Error(
        "Customer tidak ditemukan."
      );
    }

    /**
     * Validasi email.
     */
    if (
      input.email &&
      input.email !== customer.email
    ) {
      const emailExists =
        await CustomerRepository.findByEmail(
          input.email
        );

      if (emailExists) {
        throw new Error(
          "Email sudah digunakan."
        );
      }
    }

    /**
     * Validasi nomor telepon.
     */
    if (
      input.phone &&
      input.phone !== customer.phone
    ) {
      const phoneExists =
        await CustomerRepository.findByPhone(
          input.phone
        );

      if (phoneExists) {
        throw new Error(
          "Nomor telepon sudah digunakan."
        );
      }
    }

    const data: Prisma.UserUpdateInput =
      {};

    if (
      input.name !== undefined
    ) {
      data.name = input.name;
    }

    if (
      input.email !== undefined
    ) {
      data.email = input.email;
    }

    if (
      input.phone !== undefined
    ) {
      data.phone = input.phone;
    }

    if (
      input.role !== undefined
    ) {
      data.role = input.role;
    }

    if (
      input.isActive !== undefined
    ) {
      data.isActive =
        input.isActive;
    }

    if (input.password) {
      data.password =
        await bcrypt.hash(
          input.password,
          10
        );
    }

    return CustomerRepository.update(
      id,
      data
    );
  }

  /**
   * Soft delete customer.
   */
  static async deleteCustomer(
    id: string
  ) {
    const customer =
      await CustomerRepository.findById(
        id
      );

    if (!customer) {
      throw new Error(
        "Customer tidak ditemukan."
      );
    }

    return CustomerRepository.softDelete(
      id
    );
  }

  /**
   * Restore customer.
   */
  static async restoreCustomer(
    id: string
  ) {
    return CustomerRepository.restore(
      id
    );
  }

  /**
   * Hapus permanen customer.
   */
  static async forceDeleteCustomer(
    id: string
  ) {
    return CustomerRepository.forceDelete(
      id
    );
  }
}
