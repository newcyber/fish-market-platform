import RegisterForm from "@/components/auth/RegisterForm";

/**
 * ============================================================
 * REGISTER PAGE
 * ============================================================
 *
 * Halaman registrasi customer.
 *
 * ============================================================
 */

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <RegisterForm />
    </main>
  );
}