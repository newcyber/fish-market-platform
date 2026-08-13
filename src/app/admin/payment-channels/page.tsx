import {
  PaymentChannelService,
} from "@/services/payment/payment-channel.service";

import {
  PaymentChannelToolbar,
} from "@/components/admin/payment-channels/PaymentChannelToolbar";

import {
  PaymentChannelTable,
  type PaymentChannelTableItem,
} from "@/components/admin/payment-channels/PaymentChannelTable";

export const dynamic = "force-dynamic";

interface PaymentChannelsPageProps {
  searchParams?: Promise<{
    search?: string;
  }>;
}

export default async function PaymentChannelsPage({
  searchParams,
}: PaymentChannelsPageProps) {
  const params =
    (await searchParams) ?? {};

  const result =
    await PaymentChannelService.getAll();

  const channels =
    result.success && result.data
      ? result.data
      : [];

  const search =
    params.search
      ?.trim()
      .toLowerCase();

  const filteredChannels =
    search
      ? channels.filter(
          (channel) =>
            channel.name
              .toLowerCase()
              .includes(search) ||
            channel.slug
              .toLowerCase()
              .includes(search) ||
            channel.bankName
              ?.toLowerCase()
              .includes(search) ||
            channel.accountNumber
              ?.toLowerCase()
              .includes(search) ||
            channel.accountHolder
              ?.toLowerCase()
              .includes(search)
        )
      : channels;

  const tableData:
    PaymentChannelTableItem[] =
    filteredChannels.map(
      (channel) => ({
        id: channel.id,

        name: channel.name,

        type: channel.type,

        bankName:
          channel.bankName,

        accountNumber:
          channel.accountNumber,

        accountHolder:
          channel.accountHolder,

        isActive:
          channel.isActive,

        sortOrder:
          channel.sortOrder,
      })
    );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Payment Channel Management
        </h1>

        <p className="mt-2 text-muted-foreground">
          Kelola metode pembayaran yang
          tersedia untuk customer.
        </p>
      </div>

      <PaymentChannelToolbar
        search={params.search}
      />

      <PaymentChannelTable
        channels={tableData}
      />
    </div>
  );
}