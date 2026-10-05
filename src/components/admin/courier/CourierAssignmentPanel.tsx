"use client";

import { useEffect, useState } from "react";
import { Loader2, RefreshCw, Truck } from "lucide-react";

type Order = {
  id: string;
  orderNumber: string;
  total: number;
  createdAt: string;
  user: {
    name: string;
    phone: string | null;
  };
  address: {
    receiverName: string;
    city: string;
    district: string;
  };
};

type Courier = {
  id: string;
  name: string;
  phone: string | null;
  email: string;
};

type DispatchCandidate = {
  courierId: string;
  courierName: string;
  rank: number;
  score: number;
  activeAssignments: number;
  metrics: {
    workload: number;
    sla: number;
    success: number;
    deliveryTime: number;
    retry: number;
  };
  reasons: string[];
};

type AttentionItem = {
  id: string;
  orderId: string;
  failedAt: string | null;
  failureCode: string | null;
  failureReason: string | null;
  courier: {
    id: string;
    name: string;
    phone: string | null;
  };
  order: {
    id: string;
    orderNumber: string;
    status: string;
    total: number;
    address: {
      receiverName: string;
      receiverPhone: string;
      city: string;
      district: string;
    };
  };
};

type ActiveAssignment = {
  id: string;
  status: "ASSIGNED" | "ON_ROUTE" | "PICKED_UP";
  assignedAt: string;
  courierId: string;
  orderId: string;
  courier: {
    id: string;
    name: string;
    phone: string | null;
  };
  order: {
    id: string;
    orderNumber: string;
    total: number;
    status: string;
    address: {
      receiverName: string;
      city: string;
      district: string;
    };
  };
};

const STATUS_LABEL: Record<ActiveAssignment["status"], string> = {
  ASSIGNED: "Ditugaskan",
  ON_ROUTE: "Dalam perjalanan",
  PICKED_UP: "Sudah diambil",
};

export default function CourierAssignmentPanel() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [activeAssignments, setActiveAssignments] = useState<
    ActiveAssignment[]
  >([]);
  const [attention, setAttention] = useState<AttentionItem[]>([]);
  const [retryCourier, setRetryCourier] = useState<Record<string, string>>({});
  const [retrying, setRetrying] = useState<string | null>(null);
  const [selectedCourier, setSelectedCourier] = useState("");
  const [recommendations, setRecommendations] = useState<
    Record<string, DispatchCandidate[]>
  >({});
  const [loadingRecommendation, setLoadingRecommendation] = useState<
    string | null
  >(null);
  const [reassignCourier, setReassignCourier] = useState<
    Record<string, string>
  >({});
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState<string | null>(null);
  const [reassigning, setReassigning] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");

    try {
      const [dispatchResponse, attentionResponse] = await Promise.all([
        fetch("/api/admin/courier/orders", {
          cache: "no-store",
        }),
        fetch("/api/admin/courier/attention?limit=50", {
          cache: "no-store",
        }),
      ]);

      const payload = await dispatchResponse.json();
      const attentionPayload = await attentionResponse.json();

      if (!dispatchResponse.ok) {
        throw new Error(
          payload?.message || "Gagal memuat order kurir.",
        );
      }

      if (!attentionResponse.ok) {
        throw new Error(
          attentionPayload?.message ||
            "Gagal memuat perhatian kurir.",
        );
      }

      /**
       * Contract API dispatch:
       *
       * {
       *   data: {
       *     orders: [],
       *     couriers: [],
       *     activeAssignments: []
       *   }
       * }
       */
      const dispatchData = payload?.data;

      const nextOrders: Order[] = Array.isArray(dispatchData?.orders)
        ? dispatchData.orders
        : [];

      const nextCouriers: Courier[] = Array.isArray(
        dispatchData?.couriers,
      )
        ? dispatchData.couriers
        : [];

      const nextActiveAssignments: ActiveAssignment[] = Array.isArray(
        dispatchData?.activeAssignments,
      )
        ? dispatchData.activeAssignments
        : [];

      /**
       * Contract API attention:
       *
       * {
       *   data: {
       *     items: []
       *   }
       * }
       */
      const attentionData = attentionPayload?.data;

      const nextAttention: AttentionItem[] = Array.isArray(
        attentionData?.items,
      )
        ? attentionData.items
        : [];

      setOrders(nextOrders);
      setCouriers(nextCouriers);
      setActiveAssignments(nextActiveAssignments);
      setAttention(nextAttention);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal memuat data kurir.",
      );

      /**
       * Selalu pertahankan invariant:
       *
       * orders             -> array
       * couriers           -> array
       * activeAssignments  -> array
       * attention          -> array
       *
       * Dengan demikian rendering .map() tidak akan crash
       * meskipun request API gagal.
       */
      setOrders([]);
      setCouriers([]);
      setActiveAssignments([]);
      setAttention([]);
    } finally {
      setLoading(false);
    }
  }

useEffect(() => {
  void load();
}, []);

async function loadRecommendation(orderId: string) {
  setLoadingRecommendation(orderId);
  setError("");

  try {
    const response = await fetch(
      `/api/admin/courier/dispatch/candidates?orderId=${encodeURIComponent(
        orderId,
      )}`,
      {
        cache: "no-store",
      },
    );

    const payload = await response.json();

    if (!response.ok) {
      throw new Error(
        payload?.message ||
          "Gagal menghitung rekomendasi kurir.",
      );
    }

    const candidates = Array.isArray(
      payload?.data?.candidates,
    )
      ? payload.data.candidates
      : [];

    setRecommendations((current) => ({
      ...current,
      [orderId]: candidates,
    }));

    if (candidates.length > 0 && candidates[0]?.courierId) {
      setSelectedCourier(candidates[0].courierId);
    }
  } catch (err) {
    setError(
      err instanceof Error
        ? err.message
        : "Gagal menghitung rekomendasi kurir.",
    );
  } finally {
    setLoadingRecommendation(null);
  }
}

  async function assign(orderId: string) {
    if (!selectedCourier) {
      setError("Pilih kurir terlebih dahulu.");
      return;
    }

    setAssigning(orderId);
    setError("");

    try {
      const response = await fetch(
        "/api/admin/courier/assignments",
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({
            orderId,
            courierId: selectedCourier,
          }),
        },
      );

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(
          payload?.message ||
            "Gagal membuat assignment kurir.",
        );
      }

      setRecommendations((current) => {
        const next = { ...current };
        delete next[orderId];
        return next;
      });

      setSelectedCourier("");

      await load();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal membuat assignment kurir.",
      );
    } finally {
      setAssigning(null);
    }
  }

  async function retryFailed(attentionId: string) {
    const courierId = retryCourier[attentionId];

    if (!courierId) {
      setError(
        "Pilih kurir untuk pengiriman ulang terlebih dahulu.",
      );
      return;
    }

    setRetrying(attentionId);
    setError("");

    try {
      const response = await fetch(
        `/api/admin/courier/assignments/${attentionId}/retry`,
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({
            courierId,
          }),
        },
      );

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(
          payload?.message ||
            "Gagal membuat pengiriman ulang.",
        );
      }

      setRetryCourier((current) => {
        const next = { ...current };
        delete next[attentionId];
        return next;
      });

      await load();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal membuat pengiriman ulang.",
      );
    } finally {
      setRetrying(null);
    }
  }

  async function reassign(assignmentId: string) {
    const courierId = reassignCourier[assignmentId];

    if (!courierId) {
      setError(
        "Pilih kurir pengganti terlebih dahulu.",
      );
      return;
    }

    setReassigning(assignmentId);
    setError("");

    try {
      const response = await fetch(
        `/api/admin/courier/assignments/${assignmentId}/reassign`,
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({
            courierId,
          }),
        },
      );

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(
          payload?.message ||
            "Gagal mengganti kurir.",
        );
      }

      setReassignCourier((current) => {
        const next = { ...current };
        delete next[assignmentId];
        return next;
      });

      await load();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal mengganti kurir.",
      );
    } finally {
      setReassigning(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Dispatch Kurir
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Pantau assignment aktif dan tugaskan pesanan baru.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
        >
          <RefreshCw
            className={`h-4 w-4 ${
              loading ? "animate-spin" : ""
            }`}
          />
          Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <section className="space-y-3 rounded-2xl border border-red-200 bg-red-50/50 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-red-900">
              Delivery Attention
            </h3>

            <p className="mt-1 text-xs text-red-700">
              Pengantaran gagal yang belum memiliki assignment aktif baru.
            </p>
          </div>

          <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-bold text-red-700">
            {attention.length}
          </span>
        </div>

        {attention.length === 0 ? (
          <div className="rounded-xl border border-dashed border-red-200 bg-white p-5 text-center text-sm text-red-700">
            Tidak ada pengantaran gagal yang menunggu tindak lanjut.
          </div>
        ) : (
          attention.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border border-red-200 bg-white p-4 shadow-sm"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wide text-slate-400">
                      {item.order.orderNumber}
                    </span>

                    <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700">
                      Gagal Antar
                    </span>
                  </div>

                  <p className="mt-1 font-semibold text-slate-900">
                    {item.order.address.receiverName}
                  </p>

                  <p className="text-sm text-slate-500">
                    {item.order.address.district},{" "}
                    {item.order.address.city} · Kurir:{" "}
                    {item.courier.name}
                  </p>

                  <p className="mt-1 text-xs font-medium text-red-700">
                    {item.failureCode
                      ? item.failureCode.replaceAll("_", " ")
                      : "OTHER"}
                    : {item.failureReason ?? "Tidak ada catatan"}
                  </p>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <select
                    value={retryCourier[item.id] ?? ""}
                    onChange={(e) =>
                      setRetryCourier((current) => ({
                        ...current,
                        [item.id]: e.target.value,
                      }))
                    }
                    className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm"
                  >
                    <option value="">
                      Kurir pengiriman ulang...
                    </option>

                    {couriers.map((courier) => (
                      <option
                        key={courier.id}
                        value={courier.id}
                      >
                        {courier.name}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    disabled={
                      !retryCourier[item.id] ||
                      retrying === item.id
                    }
                    onClick={() =>
                      void retryFailed(item.id)
                    }
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    {retrying === item.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                    Kirim Ulang
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-900">
            Assignment Aktif
          </h3>

          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
            {activeAssignments.length}
          </span>
        </div>

        {activeAssignments.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
            Belum ada assignment aktif.
          </div>
        ) : (
          activeAssignments.map((assignment) => (
            <div
              key={assignment.id}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wide text-slate-400">
                      {assignment.order.orderNumber}
                    </span>

                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                      {STATUS_LABEL[assignment.status]}
                    </span>
                  </div>

                  <p className="mt-1 font-semibold text-slate-900">
                    {assignment.order.address.receiverName}
                  </p>

                  <p className="text-sm text-slate-500">
                    {assignment.order.address.district},{" "}
                    {assignment.order.address.city} · Kurir:{" "}
                    {assignment.courier.name}
                  </p>
                </div>

                {assignment.status === "ASSIGNED" ? (
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <select
                      value={
                        reassignCourier[assignment.id] ?? ""
                      }
                      onChange={(e) =>
                        setReassignCourier((current) => ({
                          ...current,
                          [assignment.id]: e.target.value,
                        }))
                      }
                      className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm"
                    >
                      <option value="">
                        Ganti kurir...
                      </option>

                      {couriers
                        .filter(
                          (courier) =>
                            courier.id !==
                            assignment.courierId,
                        )
                        .map((courier) => (
                          <option
                            key={courier.id}
                            value={courier.id}
                          >
                            {courier.name}
                          </option>
                        ))}
                    </select>

                    <button
                      type="button"
                      disabled={
                        !reassignCourier[assignment.id] ||
                        reassigning === assignment.id
                      }
                      onClick={() =>
                        void reassign(assignment.id)
                      }
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                    >
                      {reassigning === assignment.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4" />
                      )}
                      Ganti
                    </button>
                  </div>
                ) : (
                  <span className="text-xs font-medium text-slate-400">
                    Tidak dapat diganti setelah kurir mulai bekerja
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </section>

      <section className="space-y-3 border-t border-slate-200 pt-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <label className="text-sm font-semibold">
            Kurir tujuan
          </label>

          <select
            value={selectedCourier}
            onChange={(event) =>
              setSelectedCourier(event.target.value)
            }
            className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-slate-300"
          >
            <option value="">
              Pilih kurir...
            </option>

            {couriers.map((courier) => (
              <option
                key={courier.id}
                value={courier.id}
              >
                {courier.name}
                {courier.phone
                  ? ` — ${courier.phone}`
                  : ""}
              </option>
            ))}
          </select>
        </div>

        <h3 className="font-bold text-slate-900">
          Pesanan Siap Ditugaskan
        </h3>

        {loading ? (
          <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white p-10 text-sm text-slate-500">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Memuat tugas...
          </div>
        ) : orders.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
            Tidak ada pesanan yang siap ditugaskan ke kurir.
          </div>
        ) : (
          orders.map((order) => (
            <div
              key={order.id}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    {order.orderNumber}
                  </p>

                  <p className="mt-1 font-semibold">
                    {order.user.name}
                  </p>

                  <p className="text-sm text-slate-500">
                    {order.address.district},{" "}
                    {order.address.city}
                  </p>

                  <p className="mt-1 text-sm font-bold">
                    Rp {order.total.toLocaleString("id-ID")}
                  </p>

                  {recommendations[order.id]?.length ? (
                    <div className="mt-3 space-y-2">
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                        Rekomendasi dispatch
                      </p>

                      {recommendations[order.id]
                        .slice(0, 3)
                        .map((candidate) => (
                          <button
                            key={candidate.courierId}
                            type="button"
                            onClick={() =>
                              setSelectedCourier(
                                candidate.courierId,
                              )
                            }
                            className={`block w-full rounded-xl border p-3 text-left transition ${
                              selectedCourier ===
                              candidate.courierId
                                ? "border-slate-900 bg-slate-50"
                                : "border-slate-200 bg-white hover:bg-slate-50"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <span className="text-sm font-bold text-slate-900">
                                #{candidate.rank}{" "}
                                {candidate.courierName}
                              </span>

                              <span className="rounded-full bg-slate-900 px-2 py-1 text-xs font-bold text-white">
                                {candidate.score}
                              </span>
                            </div>

                            <p className="mt-1 text-xs text-slate-500">
                              {candidate.activeAssignments}{" "}
                              assignment aktif · SLA{" "}
                              {candidate.metrics.sla}% · sukses{" "}
                              {candidate.metrics.success}%
                            </p>

                            <p className="mt-1 text-xs font-medium text-slate-600">
                              {candidate.reasons.join(" · ")}
                            </p>
                          </button>
                        ))}
                    </div>
                  ) : null}
                </div>

                <div className="flex shrink-0 flex-col gap-2 sm:w-48">
                  <button
                    type="button"
                    disabled={
                      loadingRecommendation === order.id
                    }
                    onClick={() =>
                      void loadRecommendation(order.id)
                    }
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                  >
                    {loadingRecommendation === order.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Truck className="h-4 w-4" />
                    )}
                    Rekomendasi
                  </button>

                  <button
                    type="button"
                    disabled={
                      !selectedCourier ||
                      assigning === order.id
                    }
                    onClick={() =>
                      void assign(order.id)
                    }
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    {assigning === order.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Truck className="h-4 w-4" />
                    )}
                    Tugaskan
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
}