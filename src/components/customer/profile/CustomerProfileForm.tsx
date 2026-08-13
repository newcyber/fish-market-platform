"use client";

import {
  useTransition,
} from "react";

import {
  useForm,
} from "react-hook-form";

import {
  zodResolver,
} from "@hookform/resolvers/zod";

import {
  toast,
} from "sonner";

import {
  User,
  Mail,
  Phone,
  Save,
} from "lucide-react";

import {
  updateCustomerProfileAction,
} from "@/actions/customer/update-profile";

import {
  CustomerProfileSchema,
  type CustomerProfileInput,
} from "@/validations/customer/profile.schema";

import {
  Input,
} from "@/components/ui/input";

import {
  Label,
} from "@/components/ui/label";

interface CustomerProfileFormProps {
  name: string;
  email: string;
  phone: string | null;
}

export default function CustomerProfileForm({
  name,
  email,
  phone,
}: CustomerProfileFormProps) {
  const [
    isPending,
    startTransition,
  ] = useTransition();

  const {
    register,
    handleSubmit,
    setError,
    formState: {
      errors,
    },
  } = useForm<CustomerProfileInput>({
    resolver:
      zodResolver(
        CustomerProfileSchema
      ),

    defaultValues: {
      name,
      phone:
        phone ?? "",
    },
  });

  /**
   * ============================================================
   * SUBMIT
   * ============================================================
   */

  const onSubmit = (
    values: CustomerProfileInput
  ) => {
    startTransition(async () => {
      const result =
        await updateCustomerProfileAction(
          values
        );

      if (!result.success) {
        if (result.fieldErrors) {
          const fieldErrors =
            result.fieldErrors;

          if (
            fieldErrors.name?.[0]
          ) {
            setError(
              "name",
              {
                type: "server",
                message:
                  fieldErrors.name[0],
              }
            );
          }

          if (
            fieldErrors.phone?.[0]
          ) {
            setError(
              "phone",
              {
                type: "server",
                message:
                  fieldErrors.phone[0],
              }
            );
          }
        }

        toast.error(
          result.message ??
            "Gagal memperbarui profil."
        );

        return;
      }

      toast.success(
        result.message ??
          "Profil berhasil diperbarui."
      );
    });
  };

  return (
    <form
      onSubmit={
        handleSubmit(onSubmit)
      }
      className="space-y-6"
      noValidate
    >
      {/* ====================================================== */}
      {/* NAME */}
      {/* ====================================================== */}

      <div className="space-y-2">
        <Label
          htmlFor="name"
          className="flex items-center gap-2"
        >
          <User className="h-4 w-4 text-slate-400" />

          Nama Lengkap
        </Label>

        <Input
          id="name"
          type="text"
          placeholder="Masukkan nama lengkap"
          disabled={isPending}
          aria-invalid={
            Boolean(errors.name)
          }
          {...register("name")}
        />

        {errors.name && (
          <p className="text-sm text-red-600">
            {errors.name.message}
          </p>
        )}
      </div>

      {/* ====================================================== */}
      {/* EMAIL */}
      {/* ====================================================== */}

      <div className="space-y-2">
        <Label
          htmlFor="email"
          className="flex items-center gap-2"
        >
          <Mail className="h-4 w-4 text-slate-400" />

          Email
        </Label>

        <Input
          id="email"
          type="email"
          value={email}
          disabled
          className="cursor-not-allowed bg-slate-50 text-slate-500"
        />

        <p className="text-xs text-slate-500">
          Email tidak dapat diubah melalui halaman profil.
        </p>
      </div>

      {/* ====================================================== */}
      {/* PHONE */}
      {/* ====================================================== */}

      <div className="space-y-2">
        <Label
          htmlFor="phone"
          className="flex items-center gap-2"
        >
          <Phone className="h-4 w-4 text-slate-400" />

          Nomor Telepon
        </Label>

        <Input
          id="phone"
          type="tel"
          placeholder="Contoh: 081234567890"
          disabled={isPending}
          aria-invalid={
            Boolean(errors.phone)
          }
          {...register("phone")}
        />

        {errors.phone && (
          <p className="text-sm text-red-600">
            {errors.phone.message}
          </p>
        )}
      </div>

      {/* ====================================================== */}
      {/* SUBMIT */}
      {/* ====================================================== */}

      <div className="flex justify-end border-t pt-6">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Save className="h-4 w-4" />

          {isPending
            ? "Menyimpan..."
            : "Simpan Perubahan"}
        </button>
      </div>
    </form>
  );
}