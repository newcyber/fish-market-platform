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
   * Membuat customer baru
   */
  static async createCustomer(
    input: CreateCustomerInput
  ) {
    
    if (input.role === "SUPER_ADMIN") {
  throw new Error(
    "Role Super Admin tidak dapat dibuat melalui halaman ini."
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
 * Update customer
 */
static async updateCustomer(
  id: string,
  input: UpdateCustomerInput
) {
  if (input.role === "SUPER_ADMIN") {
  throw new Error(
    "Role Super Admin tidak dapat diubah melalui halaman ini."
  );
}

const customer =
  await CustomerRepository.findById(id);

if (!customer) {
  throw new Error(
    "Customer tidak ditemukan."
  );
}

  // Validasi email
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

  // Validasi nomor telepon
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

  const data: Prisma.UserUpdateInput = {};

  if (input.name !== undefined) {
    data.name = input.name;
  }

  if (input.email !== undefined) {
    data.email = input.email;
  }

  if (input.phone !== undefined) {
    data.phone = input.phone;
  }

  if (input.role !== undefined) {
    data.role = input.role;
  }

  if (input.isActive !== undefined) {
    data.isActive = input.isActive;
  }

  if (input.password) {
    data.password = await bcrypt.hash(
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
   * Soft delete
   */
  static async deleteCustomer(
    id: string
  ) {
    const customer =
      await CustomerRepository.findById(id);

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
   * Restore customer
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
  return CustomerRepository.forceDelete(id);
}

}