/**
 * ============================================================
 * INTERNAL SHIPPING SERVICE
 * ============================================================
 *
 * Core calculation service untuk kurir internal.
 *
 * Tanggung jawab:
 * - Validasi konfigurasi kurir internal
 * - Validasi koordinat toko
 * - Validasi koordinat customer
 * - Menghitung jarak menggunakan rumus Haversine
 * - Mengecek batas maksimal pengiriman
 * - Menghitung ongkos kirim
 * - Mengecek gratis ongkir
 *
 * Service ini tidak bergantung pada:
 * - Next.js Request
 * - React
 * - Server Action
 * - Prisma Client secara langsung
 *
 * Tujuannya agar mudah digunakan kembali oleh:
 * - Checkout
 * - API
 * - Order Service
 * - Provider kurir lain di masa depan
 * ============================================================
 */

/**
 * ============================================================
 * TYPES
 * ============================================================
 */

export interface ShippingLocation {
  latitude: number | null;
  longitude: number | null;
}

export interface InternalShippingConfig {
  enabled: boolean;

  name: string;

  baseFee: number;

  perKmFee: number;

  minFee: number;

  maxDistanceKm: number;

  freeShippingThreshold: number | null;

  freeMaxDiscount: number;
}

export interface InternalShippingCalculationInput {
  storeLocation: ShippingLocation;

  customerLocation: ShippingLocation;

  config: InternalShippingConfig;

  /**
   * Total nilai belanja sebelum ongkir.
   */
  subtotal: number;
}

export interface InternalShippingCalculationResult {
  /**
   * Apakah kurir internal tersedia.
   */
  available: boolean;

  /**
   * Nama layanan kurir.
   */
  serviceName: string;

  /**
   * Jarak antara toko dan customer dalam KM.
   */
  distanceKm: number | null;

  /**
   * Ongkos kirim final.
   */
  shippingCost: number | null;

  /**
   * Menandakan apakah customer mendapatkan gratis ongkir.
   */
  isFreeShipping: boolean;

  /**
   * Biaya dasar sebelum perhitungan jarak.
   */
  baseFee: number | null;

  /**
   * Biaya berdasarkan jarak.
   */
  distanceFee: number | null;

  /**
   * Pesan alasan jika layanan tidak tersedia.
   */
  reason: string | null;
}

/**
 * ============================================================
 * CONSTANTS
 * ============================================================
 */

/**
 * Radius bumi dalam kilometer.
 */
const EARTH_RADIUS_KM = 6371;

/**
 * ============================================================
 * HELPER
 * ============================================================
 */

/**
 * Mengubah derajat menjadi radian.
 */
function degreesToRadians(
  degrees: number
): number {
  return (
    degrees *
    (Math.PI / 180)
  );
}

/**
 * ============================================================
 * COORDINATE VALIDATION
 * ============================================================
 */

function isValidLatitude(
  latitude: number | null
): latitude is number {
  return (
    latitude !== null &&
    Number.isFinite(latitude) &&
    latitude >= -90 &&
    latitude <= 90
  );
}

function isValidLongitude(
  longitude: number | null
): longitude is number {
  return (
    longitude !== null &&
    Number.isFinite(longitude) &&
    longitude >= -180 &&
    longitude <= 180
  );
}

function hasValidLocation(
  location: ShippingLocation
): location is {
  latitude: number;
  longitude: number;
} {
  return (
    isValidLatitude(
      location.latitude
    ) &&
    isValidLongitude(
      location.longitude
    )
  );
}

/**
 * ============================================================
 * DISTANCE CALCULATOR
 * ============================================================
 *
 * Menggunakan rumus Haversine.
 *
 * Hasil:
 * Jarak garis lurus antara dua titik GPS dalam kilometer.
 *
 * Catatan:
 * Ini bukan jarak jalan/rute kendaraan.
 * Tahap berikutnya dapat menggunakan routing API jika diperlukan.
 * ============================================================
 */

export function calculateDistanceKm(
  from: {
    latitude: number;
    longitude: number;
  },
  to: {
    latitude: number;
    longitude: number;
  }
): number {
  const latitudeDifference =
    degreesToRadians(
      to.latitude -
        from.latitude
    );

  const longitudeDifference =
    degreesToRadians(
      to.longitude -
        from.longitude
    );

  const latitudeFrom =
    degreesToRadians(
      from.latitude
    );

  const latitudeTo =
    degreesToRadians(
      to.latitude
    );

  const haversineValue =
    Math.sin(
      latitudeDifference / 2
    ) *
      Math.sin(
        latitudeDifference / 2
      ) +
    Math.cos(latitudeFrom) *
      Math.cos(latitudeTo) *
      Math.sin(
        longitudeDifference / 2
      ) *
      Math.sin(
        longitudeDifference / 2
      );

  const angularDistance =
    2 *
    Math.atan2(
      Math.sqrt(
        haversineValue
      ),
      Math.sqrt(
        1 - haversineValue
      )
    );

  const distance =
    EARTH_RADIUS_KM *
    angularDistance;

  /**
   * Bulatkan hingga 2 angka desimal.
   */
  return Math.round(
    distance * 100
  ) / 100;
}

/**
 * ============================================================
 * INTERNAL SHIPPING CALCULATOR
 * ============================================================
 */

export function calculateInternalShipping(
  input: InternalShippingCalculationInput
): InternalShippingCalculationResult {
  const {
    storeLocation,
    customerLocation,
    config,
    subtotal,
  } = input;

  /**
   * ----------------------------------------------------------
   * DEFAULT RESULT HELPER
   * ----------------------------------------------------------
   */

  function unavailable(
    reason: string,
    distanceKm: number | null = null
  ): InternalShippingCalculationResult {
    return {
      available: false,

      serviceName:
        config.name ||
        "Kurir Internal",

      distanceKm,

      shippingCost: null,

      isFreeShipping: false,

      baseFee: null,

      distanceFee: null,

      reason,
    };
  }

  /**
   * ----------------------------------------------------------
   * VALIDATE SHIPPING STATUS
   * ----------------------------------------------------------
   */

  if (!config.enabled) {
    return unavailable(
      "Kurir internal sedang tidak tersedia."
    );
  }

  /**
   * ----------------------------------------------------------
   * VALIDATE STORE LOCATION
   * ----------------------------------------------------------
   */

  if (
    !hasValidLocation(
      storeLocation
    )
  ) {
    return unavailable(
      "Lokasi toko belum dikonfigurasi."
    );
  }

  /**
   * ----------------------------------------------------------
   * VALIDATE CUSTOMER LOCATION
   * ----------------------------------------------------------
   */

  if (
    !hasValidLocation(
      customerLocation
    )
  ) {
    return unavailable(
      "Lokasi GPS alamat pengiriman belum tersedia."
    );
  }

  /**
   * ----------------------------------------------------------
   * VALIDATE CONFIGURATION
   * ----------------------------------------------------------
   */

  if (
    !Number.isFinite(
      config.baseFee
    ) ||
    config.baseFee < 0
  ) {
    return unavailable(
      "Konfigurasi biaya dasar kurir tidak valid."
    );
  }

  if (
    !Number.isFinite(
      config.perKmFee
    ) ||
    config.perKmFee < 0
  ) {
    return unavailable(
      "Konfigurasi biaya per kilometer tidak valid."
    );
  }

  if (
    !Number.isFinite(
      config.minFee
    ) ||
    config.minFee < 0
  ) {
    return unavailable(
      "Konfigurasi minimum ongkir tidak valid."
    );
  }

  if (
    !Number.isFinite(
      config.freeMaxDiscount
    ) ||
    config.freeMaxDiscount < 0
  ) {
    return unavailable(
      "Konfigurasi maksimum subsidi ongkir tidak valid."
    );
  }

  if (
    !Number.isFinite(
      config.maxDistanceKm
    ) ||
    config.maxDistanceKm <= 0
  ) {
    return unavailable(
      "Konfigurasi jarak maksimum tidak valid."
    );
  }

  /**
   * ----------------------------------------------------------
   * CALCULATE DISTANCE
   * ----------------------------------------------------------
   */

  const distanceKm =
    calculateDistanceKm(
      storeLocation,
      customerLocation
    );

  /**
   * ----------------------------------------------------------
   * CHECK MAXIMUM DISTANCE
   * ----------------------------------------------------------
   */

  if (
    distanceKm >
    config.maxDistanceKm
  ) {
    return unavailable(
      `Alamat berada di luar jangkauan pengiriman maksimal ${config.maxDistanceKm} KM.`,
      distanceKm
    );
  }

  /**
   * ----------------------------------------------------------
   * NORMALIZE SUBTOTAL
   * ----------------------------------------------------------
   */

  const normalizedSubtotal =
    Number.isFinite(subtotal) &&
    subtotal > 0
      ? subtotal
      : 0;

  /**
   * ----------------------------------------------------------
   * SHIPPING COST
   * ----------------------------------------------------------
   *
   * Formula:
   *
   * baseFee +
   * (distanceKm * perKmFee)
   *
   * kemudian:
   *
   * minimum ongkir = max(rawShippingCost, minFee)
   *
   * Jika subtotal memenuhi freeShippingThreshold,
   * berikan subsidi maksimal freeMaxDiscount.
   */

  const distanceFee =
    distanceKm *
    config.perKmFee;

  const rawShippingCost =
    config.baseFee +
    distanceFee;

  const normalShippingCost =
    Math.max(
      rawShippingCost,
      config.minFee
    );

  const isEligibleForShippingSubsidy =
    config.freeShippingThreshold !==
      null &&
    Number.isFinite(
      config.freeShippingThreshold
    ) &&
    config.freeShippingThreshold >
      0 &&
    normalizedSubtotal >=
      config.freeShippingThreshold;

  const shippingDiscount =
    isEligibleForShippingSubsidy
      ? Math.min(
          normalShippingCost,
          config.freeMaxDiscount
        )
      : 0;

  const finalShippingCost =
    Math.max(
      0,
      normalShippingCost -
        shippingDiscount
    );

  /**
   * ----------------------------------------------------------
   * Ongkir dibulatkan ke Rupiah penuh.
   * ----------------------------------------------------------
   */

  const roundedShippingCost =
    Math.round(
      finalShippingCost
    );

  return {
    available: true,

    serviceName:
      config.name ||
      "Kurir Internal",

    distanceKm,

    shippingCost:
      roundedShippingCost,

    isFreeShipping:
      roundedShippingCost === 0,

    baseFee:
      config.baseFee,

    distanceFee:
      Math.round(
        distanceFee
      ),

    reason: null,
  };
}