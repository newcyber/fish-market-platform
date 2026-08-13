import bcrypt from "bcryptjs";

export default class PasswordService {
  /**
   * Jumlah salt rounds.
   */
  private static readonly SALT_ROUNDS = 12;

  /**
   * Hash password.
   */
  static async hash(
    password: string
  ): Promise<string> {
    return bcrypt.hash(
      password,
      this.SALT_ROUNDS
    );
  }

  /**
   * Verifikasi password.
   */
  static async verify(
    password: string,
    hashedPassword: string
  ): Promise<boolean> {
    return bcrypt.compare(
      password,
      hashedPassword
    );
  }

  /**
   * Cek apakah password sudah di-hash.
   */
  static isHashed(
    password: string
  ): boolean {
    return password.startsWith("$2");
  }

  /**
   * Hash hanya jika password belum di-hash.
   */
  static async hashIfNeeded(
    password: string
  ): Promise<string> {
    if (
      this.isHashed(password)
    ) {
      return password;
    }

    return this.hash(password);
  }
}