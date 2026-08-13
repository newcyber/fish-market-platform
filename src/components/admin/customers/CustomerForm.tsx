"use client";

import { useState } from "react";

import type { Role } from "@prisma/client";

import FormSection from "@/components/admin/form/FormSection";
import FormGrid from "@/components/admin/form/FormGrid";
import FormActions from "@/components/admin/form/FormActions";
import SubmitButton from "@/components/admin/form/SubmitButton";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export interface CustomerFormValues {
  name: string;

  email: string;

  phone: string;

  password: string;

  role: Role;

  isActive: boolean;
}

interface CustomerFormProps {
  defaultValues?: Partial<CustomerFormValues>;

  submitLabel?: string;

  cancelHref?: string;

  action: (
    formData: FormData
  ) => void | Promise<void>;
}

export default function CustomerForm({
  defaultValues,
  submitLabel = "Simpan Customer",
  cancelHref = "/admin/customers",
  action,
}: CustomerFormProps) {
  const [form, setForm] =
    useState<CustomerFormValues>({
      name:
        defaultValues?.name ?? "",

      email:
        defaultValues?.email ?? "",

      phone:
        defaultValues?.phone ?? "",

      password: "",

      role:
         defaultValues?.role ??
         "CUSTOMER",

      isActive:
        defaultValues?.isActive ??
        true,
    });

  return (
    <form
      action={action}
      className="space-y-6"
    >

              <FormSection
        title="Informasi Customer"
        description="Lengkapi informasi customer."
      >
        <FormGrid columns={2}>
          <div className="space-y-2">
            <Label htmlFor="name">
              Nama
            </Label>

            <Input
              id="name"
              name="name"
              value={form.name}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  name: e.target.value,
                }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">
              Email
            </Label>

            <Input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  email: e.target.value,
                }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">
              Nomor Telepon
            </Label>

            <Input
              id="phone"
              name="phone"
              value={form.phone}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  phone: e.target.value,
                }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">
              Password
            </Label>

            <Input
              id="password"
              name="password"
              type="password"
              value={form.password}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  password:
                    e.target.value,
                }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label>
              Role
            </Label>

            <input
              type="hidden"
              name="role"
              value={form.role}
            />

            <Select
              value={form.role}
              onValueChange={(value) =>
                setForm((prev) => ({
                  ...prev,
                  role: value as Role,
                }))
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
  <SelectItem value="CUSTOMER">
    Customer
  </SelectItem>

  <SelectItem value="ADMIN">
    Admin
  </SelectItem>
</SelectContent>
            </Select>
          </div>
        </FormGrid>

        <div className="mt-6 flex items-center justify-between rounded-lg border p-4">
          <div>
            <Label>
              Status
            </Label>

            <p className="text-sm text-muted-foreground">
              Aktifkan customer
              agar dapat login ke
              sistem.
            </p>
          </div>

          <input
            type="hidden"
            name="isActive"
            value={
              form.isActive
                ? "true"
                : "false"
            }
          />

          <Switch
            checked={form.isActive}
            onCheckedChange={(
              checked
            ) =>
              setForm((prev) => ({
                ...prev,
                isActive: checked,
              }))
            }
          />
        </div>
      </FormSection>

            <FormActions
        cancelHref={cancelHref}
      >
        <SubmitButton
          label={submitLabel}
        />
      </FormActions>
    </form>
  );
}