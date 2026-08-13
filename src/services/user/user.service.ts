import UserRepository from "@/repositories/UserRepository";

import PasswordService from "@/services/auth/password.service";

import type {
  UserInput,
} from "@/validators/users/create-user.validator";

import type {
  UpdateUserInput,
} from "@/validators/users/update-user.validator";

export default class UserService {
  

  /**
 * Ambil user berdasarkan ID.
 */
static async getById(
  id: string
) {
  return UserRepository.findById(
    id
  );
}

  /**
 * Ambil user berdasarkan email.
 */
static async getByEmail(
  email: string
) {
  return UserRepository.findByEmail(
    email
  );
}

  /**
 * Ambil seluruh user.
 */
static async getAll() {
  return UserRepository.findMany();
}

/**
 * Membuat admin baru.
 */
static async createAdmin(
  input: UserInput
) {
  await this.assertEmailUnique(
    input.email
  );

  await this.assertPhoneUnique(
    input.phone ?? null
  );

  const password =
    await PasswordService.hash(
      input.password
    );

  return UserRepository.create({
    name: input.name,

    email: input.email,

    phone:
      input.phone ?? null,

    password,

    role: input.role,

    isActive:
      input.isActive,

    avatar: null,
  });
}

/**
 * Update admin.
 */
static async updateAdmin(
  id: string,
  input: UpdateUserInput
) {
  await this.assertExists(id);

  await this.assertEmailUnique(
    input.email,
    id
  );

  await this.assertPhoneUnique(
    input.phone ?? null,
    id
  );

  const data: Parameters<
    typeof UserRepository.update
  >[1] = {
    name: input.name,

    email: input.email,

    phone:
      input.phone ?? null,

    role: input.role,

    isActive:
      input.isActive,
  };

  if (
    input.password &&
    input.password.trim() !== ""
  ) {
    data.password =
      await PasswordService.hash(
        input.password
      );
  }

  return UserRepository.update(
    id,
    data
  );
}

/**
 * Mengaktifkan user.
 */
static async activate(
  id: string
) {
  await this.assertExists(id);

  return UserRepository.activate(
    id
  );
}

/**
 * Menonaktifkan user.
 */
static async deactivate(
  id: string
) {
  await this.assertExists(id);

  return UserRepository.deactivate(
    id
  );
}

/**
 * Soft delete user.
 */
static async delete(
  id: string
) {
  await this.assertExists(id);

  return UserRepository.softDelete(
    id
  );
}

/**
 * Restore user.
 */
static async restore(
  id: string
) {
  return UserRepository.restore(
    id
  );
}

  /**
 * Cek apakah user ada.
 */
static async exists(
  id: string
): Promise<boolean> {
  const user =
    await UserRepository.findById(
      id
    );

  return !!user;
}

    /**
   * Pastikan user tersedia.
   */
  private static async assertExists(
    id: string
  ) {
    const user =
      await this.getById(id);

    if (!user) {
      throw new Error(
        "User tidak ditemukan."
      );
    }

    return user;
  }

 /**
 * Pastikan email belum digunakan.
 */
private static async assertEmailUnique(
  email: string,
  ignoreId?: string
) {
  const exists =
    await UserRepository.existsByEmail(
      email,
      ignoreId
    );

  if (exists) {
    throw new Error(
      "Email sudah digunakan."
    );
  }
}

  /**
 * Pastikan nomor telepon belum digunakan.
 */
private static async assertPhoneUnique(
  phone: string | null,
  ignoreId?: string
) {
  if (!phone) {
    return;
  }

  const exists =
    await UserRepository.existsByPhone(
      phone,
      ignoreId
    );

  if (exists) {
    throw new Error(
      "Nomor telepon sudah digunakan."
    );
  }
}
}