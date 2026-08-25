import {
  Suspense,
} from "react";

import {
  LoginForm,
} from "@/components/auth/LoginForm";

/**
 * ============================================================
 * LOGIN PAGE
 * ============================================================
 *
 * LoginForm menggunakan useSearchParams()
 * untuk membaca callbackUrl.
 *
 * Next.js membutuhkan Suspense boundary
 * ketika useSearchParams() digunakan pada
 * Client Component yang dirender dari App Router.
 *
 * ============================================================
 */

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div
          className="
            flex
            min-h-screen
            items-center
            justify-center
            bg-slate-50
            px-4
          "
        >
          <div
            className="
              flex
              flex-col
              items-center
              gap-3
              text-center
            "
          >
            <div
              className="
                h-8
                w-8
                animate-spin
                rounded-full
                border-4
                border-slate-200
                border-t-cyan-600
              "
              aria-hidden="true"
            />

            <p
              className="
                text-sm
                font-medium
                text-slate-600
              "
            >
              Memuat halaman login...
            </p>
          </div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}