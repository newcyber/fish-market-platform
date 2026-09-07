"use client";

import {
  useRef,
  useState,
  useTransition,
} from "react";

import dynamic from "next/dynamic";
import Image from "next/image";

import {
  Store,
  Mail,
  Phone,
  MapPin,
  Clock,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Navigation,
  LocateFixed,
  Truck,
  ImagePlus,
  Trash2,
} from "lucide-react";

import {
  updateSettingsAction,
} from "@/actions/admin/settings/update-settings";

/**
 * ============================================================
 * STORE LOCATION MAP PREVIEW
 * ============================================================
 *
 * Leaflet hanya dijalankan di browser.
 */

const StoreLocationMapPreview = dynamic(
  () =>
    import(
      "@/components/admin/settings/StoreLocationMapPreview"
    ),
  {
    ssr: false,
  }
);

/**
 * ============================================================
 * SETTINGS FORM
 * ============================================================
 */

interface SettingsFormProps {
  settings: {
    storeName: string;
    storeDescription: string | null;
    footerDescription: string | null;

    /**
     * URL/path logo situs.
     */
    siteLogo: string | null;

    /**
    * HERO SLIDER IMAGES
    */

heroSlide1Image: string | null;
heroSlide1Eyebrow: string | null;
heroSlide1Title: string | null;
heroSlide1Highlight: string | null;
heroSlide1Description: string | null;
heroSlide1Button: string | null;

heroSlide2Image: string | null;
heroSlide2Eyebrow: string | null;
heroSlide2Title: string | null;
heroSlide2Highlight: string | null;
heroSlide2Description: string | null;
heroSlide2Button: string | null;

heroSlide3Image: string | null;
heroSlide3Eyebrow: string | null;
heroSlide3Title: string | null;
heroSlide3Highlight: string | null;
heroSlide3Description: string | null;
heroSlide3Button: string | null;

loginSlide1Image: string | null;
loginSlide2Image: string | null;
loginSlide3Image: string | null;
loginSlide4Image: string | null;

flashSaleBannerImage: string | null;
flashSaleBannerLabel: string | null;
flashSaleBannerTitle: string | null;
flashSaleBannerHighlight: string | null;
flashSaleBannerDescription: string | null;

    email: string | null;
    whatsapp: string | null;

    address: string | null;
    city: string | null;
    province: string | null;
    postalCode: string | null;

    /**
     * STORE LOCATION / SHIPPING ORIGIN
     */

    latitude: number | null;
    longitude: number | null;

    /**
     * INTERNAL SHIPPING CONFIGURATION
     */

    internalShippingEnabled: boolean;
    internalShippingName: string;
    internalShippingBaseFee: number;
    internalShippingPerKmFee: number;
    internalShippingMinFee: number;
    internalShippingMaxDistance: number;
    internalShippingFreeThreshold: number | null;
    internalShippingFreeMaxDiscount: number;

        /**
     * ==========================================================
     * OPERATIONAL
     */
    openingTime: string | null;
    closingTime: string | null;

    /**
     * ==========================================================
     * ORDER SETTINGS
     * ==========================================================
     */

    paymentTimeoutHours: number;
  };
}

/**
 * ============================================================
 * LOGO CONFIGURATION
 * ============================================================
 */

const MAX_LOGO_SIZE =
  2 * 1024 * 1024;

const ALLOWED_LOGO_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
];

/**
 * ============================================================
 * HERO IMAGE CONFIGURATION
 * ============================================================
 */

const MAX_HERO_IMAGE_SIZE =
  5 * 1024 * 1024;

const MAX_LOGIN_IMAGE_SIZE =
  5 * 1024 * 1024;

const ALLOWED_LOGIN_IMAGE_TYPES = [
  "image/png",
  "image/webp",
  "image/gif",
] as const;

const MAX_FLASH_SALE_IMAGE_SIZE =
  5 * 1024 * 1024;

const ALLOWED_HERO_IMAGE_TYPES = [
  "image/png",
  "image/webp",
  "image/gif",
] as const;

const ALLOWED_FLASH_SALE_IMAGE_TYPES = [
  "image/png",
  "image/webp",
  "image/gif",
] as const;

type HeroSlideKey =
  | "slide1"
  | "slide2"
  | "slide3";

type LoginSlideKey =
  | "slide1"
  | "slide2"
  | "slide3"
  | "slide4";

/**
 * ============================================================
 * COMPONENT
 * ============================================================
 */

export default function SettingsForm({
  settings,
}: SettingsFormProps) {
  const [isPending, startTransition] =
    useTransition();

  const [message, setMessage] =
    useState<string | null>(null);

  const [isSuccess, setIsSuccess] =
    useState<boolean | null>(null);

  /**
   * ==========================================================
   * SITE LOGO STATE
   * ==========================================================
   */

  const [siteLogo, setSiteLogo] =
    useState<string | null>(
      settings.siteLogo
    );

  const [
    isUploadingLogo,
    setIsUploadingLogo,
  ] = useState(false);

  const logoInputRef =
    useRef<HTMLInputElement | null>(
      null
    );

    /**
 * ==========================================================
 * HERO SLIDER IMAGE STATE
 * ==========================================================
 */

const [
  heroSlide1Image,
  setHeroSlide1Image,
] = useState<string | null>(
  settings.heroSlide1Image
);

const [
  heroSlide2Image,
  setHeroSlide2Image,
] = useState<string | null>(
  settings.heroSlide2Image
);

const [
  heroSlide3Image,
  setHeroSlide3Image,
] = useState<string | null>(
  settings.heroSlide3Image
);

const [
  heroSlide1Eyebrow,
  setHeroSlide1Eyebrow,
] = useState(
  settings.heroSlide1Eyebrow ?? ""
);

const [
  heroSlide1Title,
  setHeroSlide1Title,
] = useState(
  settings.heroSlide1Title ?? ""
);

const [
  heroSlide1Highlight,
  setHeroSlide1Highlight,
] = useState(
  settings.heroSlide1Highlight ?? ""
);

const [
  heroSlide1Description,
  setHeroSlide1Description,
] = useState(
  settings.heroSlide1Description ?? ""
);

const [
  heroSlide1Button,
  setHeroSlide1Button,
] = useState(
  settings.heroSlide1Button ?? ""
);

const [
  heroSlide2Eyebrow,
  setHeroSlide2Eyebrow,
] = useState(
  settings.heroSlide2Eyebrow ?? ""
);

const [
  heroSlide2Title,
  setHeroSlide2Title,
] = useState(
  settings.heroSlide2Title ?? ""
);

const [
  heroSlide2Highlight,
  setHeroSlide2Highlight,
] = useState(
  settings.heroSlide2Highlight ?? ""
);

const [
  heroSlide2Description,
  setHeroSlide2Description,
] = useState(
  settings.heroSlide2Description ?? ""
);

const [
  heroSlide2Button,
  setHeroSlide2Button,
] = useState(
  settings.heroSlide2Button ?? ""
);

const [
  heroSlide3Eyebrow,
  setHeroSlide3Eyebrow,
] = useState(
  settings.heroSlide3Eyebrow ?? ""
);

const [
  heroSlide3Title,
  setHeroSlide3Title,
] = useState(
  settings.heroSlide3Title ?? ""
);

const [
  heroSlide3Highlight,
  setHeroSlide3Highlight,
] = useState(
  settings.heroSlide3Highlight ?? ""
);

const [
  heroSlide3Description,
  setHeroSlide3Description,
] = useState(
  settings.heroSlide3Description ?? ""
);

const [
  heroSlide3Button,
  setHeroSlide3Button,
] = useState(
  settings.heroSlide3Button ?? ""
);

const [
  uploadingHeroSlide,
  setUploadingHeroSlide,
] = useState<HeroSlideKey | null>(
  null
);

const heroSlide1InputRef =
  useRef<HTMLInputElement | null>(
    null
  );

const heroSlide2InputRef =
  useRef<HTMLInputElement | null>(
    null
  );

const heroSlide3InputRef =
  useRef<HTMLInputElement | null>(
    null
  );

/**
 * ==========================================================
 * MOBILE LOGIN SLIDER IMAGE STATE
 * ==========================================================
 */

const [
  loginSlide1Image,
  setLoginSlide1Image,
] = useState<string | null>(
  settings.loginSlide1Image
);

const [
  loginSlide2Image,
  setLoginSlide2Image,
] = useState<string | null>(
  settings.loginSlide2Image
);

const [
  loginSlide3Image,
  setLoginSlide3Image,
] = useState<string | null>(
  settings.loginSlide3Image
);

const [
  loginSlide4Image,
  setLoginSlide4Image,
] = useState<string | null>(
  settings.loginSlide4Image
);

const [
  uploadingLoginSlide,
  setUploadingLoginSlide,
] = useState<LoginSlideKey | null>(
  null
);

const loginSlide1InputRef =
  useRef<HTMLInputElement | null>(null);

const loginSlide2InputRef =
  useRef<HTMLInputElement | null>(null);

const loginSlide3InputRef =
  useRef<HTMLInputElement | null>(null);

const loginSlide4InputRef =
  useRef<HTMLInputElement | null>(null);

const [
  flashSaleBannerImage,
  setFlashSaleBannerImage,
] = useState<string | null>(
  settings.flashSaleBannerImage
);

const [
  flashSaleBannerLabel,
  setFlashSaleBannerLabel,
] = useState(
  settings.flashSaleBannerLabel ?? ""
);

const [
  flashSaleBannerTitle,
  setFlashSaleBannerTitle,
] = useState(
  settings.flashSaleBannerTitle ?? ""
);

const [
  flashSaleBannerHighlight,
  setFlashSaleBannerHighlight,
] = useState(
  settings.flashSaleBannerHighlight ?? ""
);

const [
  flashSaleBannerDescription,
  setFlashSaleBannerDescription,
] = useState(
  settings.flashSaleBannerDescription ?? ""
);

const [
  isUploadingFlashSaleBanner,
  setIsUploadingFlashSaleBanner,
] = useState(false);

const flashSaleBannerInputRef =
  useRef<HTMLInputElement | null>(
    null
  );

  /**
   * ==========================================================
   * STORE GPS STATE
   * ==========================================================
   */

  const [latitude, setLatitude] =
    useState<string>(
      settings.latitude !== null &&
      settings.latitude !== undefined
        ? String(settings.latitude)
        : ""
    );

  const [longitude, setLongitude] =
    useState<string>(
      settings.longitude !== null &&
      settings.longitude !== undefined
        ? String(settings.longitude)
        : ""
    );

  const [isLocating, setIsLocating] =
    useState(false);

  /**
   * ==========================================================
   * INTERNAL SHIPPING STATE
   * ==========================================================
   */

  const [
    internalShippingEnabled,
    setInternalShippingEnabled,
  ] = useState(
    settings.internalShippingEnabled
  );

    /**
   * ==========================================================
   * ORDER SETTINGS STATE
   * ==========================================================
   */

  const [
    paymentTimeoutHours,
    setPaymentTimeoutHours,
  ] = useState<string>(
    String(
      settings.paymentTimeoutHours
    )
  );

  /**
   * ==========================================================
   * MAP PREVIEW COORDINATES
   * ==========================================================
   */

  const previewLatitude =
    Number(latitude);

  const previewLongitude =
    Number(longitude);

  const hasValidLocation =
    latitude.trim() !== "" &&
    longitude.trim() !== "" &&
    Number.isFinite(previewLatitude) &&
    Number.isFinite(previewLongitude) &&
    previewLatitude >= -90 &&
    previewLatitude <= 90 &&
    previewLongitude >= -180 &&
    previewLongitude <= 180;

  /**
   * ==========================================================
   * UPLOAD SITE LOGO
   * ==========================================================
   */

  async function handleLogoChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file =
      event.target.files?.[0];

    /**
     * Reset input agar file yang sama tetap
     * bisa dipilih kembali.
     */

    event.target.value = "";

    if (!file) {
      return;
    }

    setMessage(null);
    setIsSuccess(null);

    /**
     * --------------------------------------------------------
     * VALIDATE MIME TYPE
     * --------------------------------------------------------
     */

    if (
      !ALLOWED_LOGO_TYPES.includes(
        file.type
      )
    ) {
      setMessage(
        "Format logo harus PNG, JPG, JPEG, atau WEBP."
      );

      setIsSuccess(false);

      return;
    }

    /**
     * --------------------------------------------------------
     * VALIDATE FILE SIZE
     * --------------------------------------------------------
     */

    if (
      file.size <= 0 ||
      file.size > MAX_LOGO_SIZE
    ) {
      setMessage(
        "Ukuran logo maksimal 2 MB."
      );

      setIsSuccess(false);

      return;
    }

    try {
      setIsUploadingLogo(true);

      const formData =
        new FormData();

      formData.append(
        "file",
        file
      );

      const response =
        await fetch(
          "/api/settings/logo",
          {
            method: "POST",
            body: formData,
          }
        );

      const result =
        await response.json();

      if (
        !response.ok ||
        !result.success ||
        !result.url
      ) {
        throw new Error(
          result.message ||
            "Gagal mengupload logo."
        );
      }

      /**
       * URL hasil upload disimpan ke state.
       *
       * URL baru benar-benar masuk database
       * setelah admin klik Simpan Pengaturan.
       */

      setSiteLogo(
        result.url
      );

      setMessage(
        "Logo berhasil diupload. Jangan lupa klik Simpan Pengaturan."
      );

      setIsSuccess(true);
    } catch (error) {
      console.error(
        "Failed to upload site logo:",
        error
      );

      setMessage(
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan saat mengupload logo."
      );

      setIsSuccess(false);
    } finally {
      setIsUploadingLogo(false);
    }
  }

  /**
   * ==========================================================
   * REMOVE SITE LOGO
   * ==========================================================
   *
   * Tahap ini hanya menghapus URL dari state.
   *
   * Nilai null akan disimpan ke database setelah
   * admin menekan Simpan Pengaturan.
   *
   * File fisik lama belum dihapus di tahap ini agar
   * tidak ada risiko kehilangan logo sebelum Settings
   * berhasil tersimpan.
   */

  function handleRemoveLogo() {
    setSiteLogo(null);

    setMessage(
      "Logo akan dihapus setelah Anda menyimpan pengaturan."
    );

    setIsSuccess(true);
  }

  /**
 * ==========================================================
 * SET HERO SLIDE IMAGE
 * ==========================================================
 */

function setHeroSlideImage(
  slide: HeroSlideKey,
  value: string | null
) {
  switch (slide) {
    case "slide1":
      setHeroSlide1Image(value);
      break;

    case "slide2":
      setHeroSlide2Image(value);
      break;

    case "slide3":
      setHeroSlide3Image(value);
      break;
  }
}

function setLoginSlideImage(
  slide: LoginSlideKey,
  value: string | null
) {
  switch (slide) {
    case "slide1":
      setLoginSlide1Image(value);
      break;

    case "slide2":
      setLoginSlide2Image(value);
      break;

    case "slide3":
      setLoginSlide3Image(value);
      break;

    case "slide4":
      setLoginSlide4Image(value);
      break;
  }
}

/**
 * ==========================================================
 * UPLOAD HERO IMAGE
 * ==========================================================
 */

async function handleHeroImageChange(
  slide: HeroSlideKey,
  event: React.ChangeEvent<HTMLInputElement>
) {
  const file =
    event.target.files?.[0];

  /**
   * Reset input agar file yang sama
   * tetap dapat dipilih kembali.
   */

  event.target.value = "";

  if (!file) {
    return;
  }

  setMessage(null);
  setIsSuccess(null);

  /**
   * --------------------------------------------------------
   * VALIDATE MIME TYPE
   * --------------------------------------------------------
   */

  if (
    !ALLOWED_HERO_IMAGE_TYPES.includes(
      file.type as
        | "image/png"
        | "image/webp"
        | "image/gif"
    )
  ) {
    setMessage(
      "Format gambar Hero harus PNG, WEBP, atau GIF."
    );

    setIsSuccess(false);

    return;
  }

  /**
   * --------------------------------------------------------
   * VALIDATE FILE SIZE
   * --------------------------------------------------------
   */

  if (
    file.size <= 0 ||
    file.size > MAX_HERO_IMAGE_SIZE
  ) {
    setMessage(
      "Ukuran gambar Hero maksimal 5 MB."
    );

    setIsSuccess(false);

    return;
  }

  try {
    /**
     * ------------------------------------------------------
     * SET UPLOADING STATE
     * ------------------------------------------------------
     */

    setUploadingHeroSlide(slide);

    /**
     * ------------------------------------------------------
     * PREPARE FORM DATA
     * ------------------------------------------------------
     */

    const formData =
      new FormData();

    formData.append(
      "file",
      file
    );

    /**
     * Kirim informasi slide ke API.
     *
     * Contoh:
     * - slide1
     * - slide2
     * - slide3
     */

    formData.append(
      "slide",
      slide
    );

    /**
     * ------------------------------------------------------
     * UPLOAD HERO IMAGE
     * ------------------------------------------------------
     */

    const response =
      await fetch(
        "/api/settings/hero-image",
        {
          method: "POST",
          body: formData,
        }
      );

    /**
     * ------------------------------------------------------
     * PARSE RESPONSE SAFELY
     * ------------------------------------------------------
     *
     * Menghindari error jika API
     * tidak mengembalikan JSON valid.
     */

    const result =
      await response
        .json()
        .catch(() => null);

    /**
     * Debug response.
     *
     * Bisa dilihat di browser console
     * apabila masih terjadi masalah.
     */

    console.log(
      "[HERO_IMAGE_UPLOAD_RESPONSE]",
      {
        status: response.status,
        ok: response.ok,
        result,
      }
    );

    /**
     * ------------------------------------------------------
     * HANDLE HTTP ERROR
     * ------------------------------------------------------
     */

    if (!response.ok) {
      throw new Error(
        result?.message ||
          "Gagal mengupload gambar Hero."
      );
    }

    /**
     * ------------------------------------------------------
     * RESOLVE IMAGE URL
     * ------------------------------------------------------
     *
     * Mendukung beberapa struktur response API:
     *
     * {
     *   success: true,
     *   url: "..."
     * }
     *
     * atau:
     *
     * {
     *   success: true,
     *   data: {
     *     url: "..."
     *   }
     * }
     *
     * atau:
     *
     * {
     *   url: "..."
     * }
     *
     * atau:
     *
     * {
     *   data: {
     *     imageUrl: "..."
     *   }
     * }
     */

    const uploadedUrl =
      result?.url ||
      result?.data?.url ||
      result?.imageUrl ||
      result?.data?.imageUrl ||
      result?.path ||
      result?.data?.path ||
      null;

    /**
     * ------------------------------------------------------
     * VALIDATE UPLOAD URL
     * ------------------------------------------------------
     */

    if (
      typeof uploadedUrl !==
        "string" ||
      uploadedUrl.trim() === ""
    ) {
      console.error(
        "[HERO_IMAGE_UPLOAD_INVALID_RESPONSE]",
        result
      );

      throw new Error(
        "Upload gambar berhasil, tetapi URL gambar tidak ditemukan pada response server."
      );
    }

    /**
     * ------------------------------------------------------
     * UPDATE HERO IMAGE STATE
     * ------------------------------------------------------
     *
     * URL hanya masuk state terlebih dahulu.
     *
     * Database baru diperbarui setelah admin
     * menekan tombol Simpan Pengaturan.
     */

    setHeroSlideImage(
      slide,
      uploadedUrl
    );

    /**
     * ------------------------------------------------------
     * SUCCESS MESSAGE
     * ------------------------------------------------------
     */

    setMessage(
      "Gambar Hero berhasil diupload. Jangan lupa klik Simpan Pengaturan."
    );

    setIsSuccess(true);
  } catch (error) {
    /**
     * ------------------------------------------------------
     * ERROR HANDLER
     * ------------------------------------------------------
     */

    console.error(
      "[HERO_IMAGE_UPLOAD_ERROR]",
      error
    );

    setMessage(
      error instanceof Error
        ? error.message
        : "Terjadi kesalahan saat mengupload gambar Hero."
    );

    setIsSuccess(false);
  } finally {
    /**
     * ------------------------------------------------------
     * RESET UPLOADING STATE
     * ------------------------------------------------------
     */

    setUploadingHeroSlide(
      null
    );
  }
}

/**
 * ==========================================================
 * UPLOAD MOBILE LOGIN SLIDER IMAGE
 * ==========================================================
 */
async function handleLoginImageChange(
  slide: LoginSlideKey,
  event: React.ChangeEvent<HTMLInputElement>
) {
  const file =
    event.target.files?.[0];

  /**
   * Reset input agar file yang sama
   * tetap dapat dipilih kembali.
   */
  event.target.value = "";

  if (!file) {
    return;
  }

  setMessage(null);
  setIsSuccess(null);

  /**
   * --------------------------------------------------------
   * VALIDATE MIME TYPE
   * --------------------------------------------------------
   */
  if (
    !ALLOWED_LOGIN_IMAGE_TYPES.includes(
      file.type as
        | "image/png"
        | "image/webp"
        | "image/gif"
    )
  ) {
    setMessage(
      "Format gambar Login harus PNG, WEBP, atau GIF."
    );

    setIsSuccess(false);

    return;
  }

  /**
   * --------------------------------------------------------
   * VALIDATE FILE SIZE
   * --------------------------------------------------------
   */
  if (
    file.size <= 0 ||
    file.size > MAX_LOGIN_IMAGE_SIZE
  ) {
    setMessage(
      "Ukuran gambar Login maksimal 5 MB."
    );

    setIsSuccess(false);

    return;
  }

  try {
    setUploadingLoginSlide(slide);

    const formData =
      new FormData();

    formData.append(
      "file",
      file
    );

    formData.append(
      "slide",
      slide
    );

    /**
     * ------------------------------------------------------
     * UPLOAD LOGIN IMAGE
     * ------------------------------------------------------
     */
    const response =
      await fetch(
        "/api/settings/login-image",
        {
          method: "POST",
          body: formData,
        }
      );

    const result =
      await response
        .json()
        .catch(() => null);

    console.log(
      "[LOGIN_IMAGE_UPLOAD_RESPONSE]",
      {
        status: response.status,
        ok: response.ok,
        result,
      }
    );

    if (!response.ok) {
      throw new Error(
        result?.message ||
          "Gagal mengupload gambar Login."
      );
    }

    /**
     * API kita mengembalikan:
     *
     * data: {
     *   path,
     *   slide
     * }
     */
    const uploadedUrl =
      result?.data?.path;

    if (
      typeof uploadedUrl !==
        "string" ||
      uploadedUrl.trim() === ""
    ) {
      throw new Error(
        "Upload gambar berhasil, tetapi path gambar tidak ditemukan pada response server."
      );
    }

    setLoginSlideImage(
      slide,
      uploadedUrl
    );

    setMessage(
      "Gambar Login berhasil diupload. Jangan lupa klik Simpan Pengaturan."
    );

    setIsSuccess(true);
  } catch (error) {
    console.error(
      "Failed to upload login image:",
      error
    );

    setMessage(
      error instanceof Error
        ? error.message
        : "Terjadi kesalahan saat mengupload gambar Login."
    );

    setIsSuccess(false);
  } finally {
    setUploadingLoginSlide(
      null
    );
  }
}

/**
 * ==========================================================
 * REMOVE HERO IMAGE
 * ==========================================================
 */

function handleRemoveHeroImage(
  slide: HeroSlideKey
) {
  /**
   * Hapus gambar dari local state.
   *
   * Database belum langsung diubah.
   * Perubahan akan disimpan ketika admin
   * menekan tombol Simpan Pengaturan.
   */

  setHeroSlideImage(
    slide,
    null
  );

  setMessage(
    "Gambar Hero akan dihapus setelah Anda menyimpan pengaturan."
  );

  setIsSuccess(true);
}

  /**
   * ==========================================================
   * UPLOAD FLASH SALE BANNER IMAGE
   * ==========================================================
   */

  async function handleFlashSaleBannerChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    setMessage(null);
    setIsSuccess(null);

    if (
      !ALLOWED_FLASH_SALE_IMAGE_TYPES.includes(
        file.type as
          | "image/png"
          | "image/webp"
          | "image/gif"
      )
    ) {
      setMessage(
        "Format gambar Flash Sale harus PNG, WEBP, atau GIF."
      );
      setIsSuccess(false);
      return;
    }

    if (
      file.size <= 0 ||
      file.size > MAX_FLASH_SALE_IMAGE_SIZE
    ) {
      setMessage(
        "Ukuran gambar Flash Sale maksimal 5 MB."
      );
      setIsSuccess(false);
      return;
    }

    try {
      setIsUploadingFlashSaleBanner(true);

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(
        "/api/settings/flash-sale-image",
        {
          method: "POST",
          body: formData,
        }
      );

      const result = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.message ||
            "Gagal mengupload gambar Flash Sale."
        );
      }

      const uploadedUrl =
        result?.url ||
        result?.data?.url ||
        result?.imageUrl ||
        result?.data?.imageUrl ||
        result?.path ||
        result?.data?.path ||
        null;

      if (
        typeof uploadedUrl !== "string" ||
        uploadedUrl.trim() === ""
      ) {
        throw new Error(
          "Upload gambar berhasil, tetapi URL gambar tidak ditemukan pada response server."
        );
      }

      setFlashSaleBannerImage(uploadedUrl);
      setMessage(
        "Gambar Flash Sale berhasil diupload. Jangan lupa klik Simpan Pengaturan."
      );
      setIsSuccess(true);
    } catch (error) {
      console.error(
        "[FLASH_SALE_IMAGE_UPLOAD_ERROR]",
        error
      );

      setMessage(
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan saat mengupload gambar Flash Sale."
      );
      setIsSuccess(false);
    } finally {
      setIsUploadingFlashSaleBanner(false);
    }
  }

  function handleRemoveFlashSaleBanner() {
    setFlashSaleBannerImage(null);

    setMessage(
      "Gambar Flash Sale akan dihapus setelah Anda menyimpan pengaturan."
    );
    setIsSuccess(true);
  }

  /**
   * ==========================================================
   * GET CURRENT LOCATION
   * ==========================================================
   */

  function handleGetCurrentLocation() {
    setMessage(null);
    setIsSuccess(null);

    if (!navigator.geolocation) {
      setMessage(
        "Browser atau perangkat ini tidak mendukung akses lokasi GPS."
      );

      setIsSuccess(false);

      return;
    }

    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextLatitude =
          position.coords.latitude;

        const nextLongitude =
          position.coords.longitude;

        setLatitude(
          nextLatitude.toFixed(7)
        );

        setLongitude(
          nextLongitude.toFixed(7)
        );

        setMessage(
          "Lokasi toko berhasil diperoleh. Jangan lupa menyimpan pengaturan."
        );

        setIsSuccess(true);

        setIsLocating(false);
      },
      (error) => {
        console.error(
          "Failed to get store location:",
          error
        );

        let errorMessage =
          "Gagal mengambil lokasi saat ini.";

        if (
          error.code ===
          error.PERMISSION_DENIED
        ) {
          errorMessage =
            "Izin akses lokasi ditolak. Silakan izinkan akses lokasi terlebih dahulu.";
        }

        if (
          error.code ===
          error.POSITION_UNAVAILABLE
        ) {
          errorMessage =
            "Lokasi perangkat tidak tersedia.";
        }

        if (
          error.code ===
          error.TIMEOUT
        ) {
          errorMessage =
            "Waktu pengambilan lokasi habis. Silakan coba lagi.";
        }

        setMessage(errorMessage);
        setIsSuccess(false);
        setIsLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  }

  /**
   * ==========================================================
   * PARSE COORDINATE
   * ==========================================================
   */

  function parseCoordinate(
    value: string
  ): number | null {
    const trimmed =
      value.trim();

    if (!trimmed) {
      return null;
    }

    const parsed =
      Number(trimmed);

    return Number.isFinite(parsed)
      ? parsed
      : null;
  }

  /**
   * ==========================================================
   * PARSE NUMBER
   * ==========================================================
   */

  function parseNumber(
    value: FormDataEntryValue | null,
    fallback: number
  ): number {
    if (
      value === null ||
      String(value).trim() === ""
    ) {
      return fallback;
    }

    const parsed =
      Number(value);

    return Number.isFinite(parsed)
      ? parsed
      : fallback;
  }

  /**
   * ==========================================================
   * PARSE OPTIONAL NUMBER
   * ==========================================================
   */

  function parseOptionalNumber(
    value: FormDataEntryValue | null
  ): number | null {
    if (
      value === null ||
      String(value).trim() === ""
    ) {
      return null;
    }

    const parsed =
      Number(value);

    return Number.isFinite(parsed)
      ? parsed
      : null;
  }

  /**
   * ==========================================================
   * SUBMIT
   * ==========================================================
   */

  function handleSubmit(
    formData: FormData
  ) {
    setMessage(null);
    setIsSuccess(null);

    if (isUploadingLogo) {
  setMessage(
    "Tunggu hingga proses upload logo selesai."
  );

  setIsSuccess(false);

  return;
}

if (uploadingHeroSlide) {
  setMessage(
    "Tunggu hingga proses upload gambar Hero selesai."
  );

  setIsSuccess(false);

  return;
}

if (uploadingLoginSlide) {
  setMessage(
    "Tunggu hingga proses upload gambar Login selesai."
  );

  setIsSuccess(false);

  return;
}

if (isUploadingFlashSaleBanner) {
  setMessage(
    "Tunggu hingga proses upload gambar Flash Sale selesai."
  );

  setIsSuccess(false);

  return;
}

    const input = {
      /**
       * STORE INFORMATION
       */

      storeName: String(
        formData.get("storeName") ?? ""
      ),

      storeDescription: String(
        formData.get("storeDescription") ?? ""
      ),

      footerDescription: String(
        formData.get("footerDescription") ?? ""
      ),

      /**
       * SITE LOGO
       */

      siteLogo,

      /**
 * HERO SLIDER IMAGES
 */

      heroSlide1Image,

      heroSlide2Image,

      heroSlide3Image,

/**
 * MOBILE LOGIN SLIDER IMAGES
 */
      loginSlide1Image,
      loginSlide2Image,
      loginSlide3Image,
      loginSlide4Image,

      flashSaleBannerImage,

      heroSlide1Eyebrow,
      heroSlide1Title,
      heroSlide1Highlight,
      heroSlide1Description,
      heroSlide1Button,

      heroSlide2Eyebrow,
      heroSlide2Title,
      heroSlide2Highlight,
      heroSlide2Description,
      heroSlide2Button,

      heroSlide3Eyebrow,
      heroSlide3Title,
      heroSlide3Highlight,
      heroSlide3Description,
      heroSlide3Button,

      flashSaleBannerLabel,
      flashSaleBannerTitle,
      flashSaleBannerHighlight,
      flashSaleBannerDescription,

      email: String(
        formData.get("email") ?? ""
      ),

      whatsapp: String(
        formData.get("whatsapp") ?? ""
      ),

      /**
       * STORE ADDRESS
       */

      address: String(
        formData.get("address") ?? ""
      ),

      city: String(
        formData.get("city") ?? ""
      ),

      province: String(
        formData.get("province") ?? ""
      ),

      postalCode: String(
        formData.get("postalCode") ?? ""
      ),

      /**
       * STORE LOCATION / SHIPPING ORIGIN
       */

      latitude:
        parseCoordinate(latitude),

      longitude:
        parseCoordinate(longitude),

      /**
       * INTERNAL SHIPPING
       */

      internalShippingEnabled,

      internalShippingName: String(
        formData.get(
          "internalShippingName"
        ) ?? ""
      ),

      internalShippingBaseFee:
        parseNumber(
          formData.get(
            "internalShippingBaseFee"
          ),
          0
        ),

      internalShippingPerKmFee:
        parseNumber(
          formData.get(
            "internalShippingPerKmFee"
          ),
          0
        ),

      internalShippingMinFee:
        parseNumber(
          formData.get(
            "internalShippingMinFee"
          ),
          0
        ),

      internalShippingMaxDistance:
        parseNumber(
          formData.get(
            "internalShippingMaxDistance"
          ),
          10
        ),

      internalShippingFreeThreshold:
        parseOptionalNumber(
          formData.get(
            "internalShippingFreeThreshold"
          )
        ),

      internalShippingFreeMaxDiscount:
        parseNumber(
          formData.get(
            "internalShippingFreeMaxDiscount"
          ),
        0
        ),

            /**
       * --------------------------------------------------------
       * OPERATIONAL
       * --------------------------------------------------------
       */

      openingTime: String(
        formData.get("openingTime") ?? ""
      ),

      closingTime: String(
        formData.get("closingTime") ?? ""
      ),

      /**
       * --------------------------------------------------------
       * ORDER SETTINGS
       * --------------------------------------------------------
       */

      paymentTimeoutHours:
        Number(paymentTimeoutHours),
    };

    startTransition(async () => {
      try {
        const result =
          await updateSettingsAction(
            input
          );

        setMessage(result.message);
        setIsSuccess(result.success);
      } catch (error) {
        console.error(
          "Failed to update store settings:",
          error
        );

        setMessage(
          "Terjadi kesalahan saat menyimpan pengaturan toko."
        );

        setIsSuccess(false);
      }
    });
  }

  return (
    <form
      action={handleSubmit}
      className="space-y-6"
    >
      {/* ====================================================== */}
      {/* FEEDBACK */}
      {/* ====================================================== */}

      {message && (
        <div
          className={[
            "flex items-center gap-3 rounded-xl border px-4 py-3 text-sm",
            isSuccess
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-red-200 bg-red-50 text-red-700",
          ].join(" ")}
        >
          {isSuccess ? (
            <CheckCircle2 className="h-5 w-5 shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 shrink-0" />
          )}

          <span>{message}</span>
        </div>
      )}

      {/* ====================================================== */}
      {/* INFORMASI TOKO */}
      {/* ====================================================== */}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-6 flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white">
            <Store className="h-5 w-5" />
          </div>

          <div>
            <h2 className="text-base font-bold text-slate-900">
              Informasi Toko
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Kelola informasi utama toko dan identitas brand.
            </p>
          </div>
        </div>

        <div className="grid gap-5">
          {/* ================================================== */}
          {/* SITE LOGO */}
          {/* ================================================== */}

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Logo Situs
            </label>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  {siteLogo ? (
                    <Image
                      src={siteLogo}
                      alt="Logo situs"
                      width={96}
                      height={96}
                      unoptimized
                      className="h-full w-full object-contain p-2"
                    />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-slate-400">
                      <ImagePlus className="h-7 w-7" />

                      <span className="text-[10px] font-medium">
                        Belum ada logo
                      </span>
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-900">
                    Identitas Logo Situs
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Upload logo yang akan digunakan sebagai identitas utama situs.
                    Format PNG, JPG, JPEG, atau WEBP dengan ukuran maksimal 2 MB.
                  </p>

                  <div className="mt-4 flex flex-wrap gap-3">
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
                      onChange={
                        handleLogoChange
                      }
                      className="hidden"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        logoInputRef.current?.click()
                      }
                      disabled={
                        isPending ||
                        isUploadingLogo
                      }
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isUploadingLogo ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Mengupload...
                        </>
                      ) : (
                        <>
                          <ImagePlus className="h-4 w-4" />

                          {siteLogo
                            ? "Ganti Logo"
                            : "Upload Logo"}
                        </>
                      )}
                    </button>

                    {siteLogo && (
                      <button
                        type="button"
                        onClick={
                          handleRemoveLogo
                        }
                        disabled={
                          isPending ||
                          isUploadingLogo
                        }
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <Trash2 className="h-4 w-4" />
                        Hapus
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ================================================== */}
          {/* STORE NAME */}
          {/* ================================================== */}

          <div>
            <label
              htmlFor="storeName"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Nama Toko
            </label>

            <input
              id="storeName"
              name="storeName"
              type="text"
              required
              defaultValue={settings.storeName}
              disabled={isPending}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-50"
              placeholder="Contoh: Pisjo Market"
            />
          </div>

          <div>
            <label
              htmlFor="storeDescription"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Deskripsi Toko
            </label>

            <textarea
              id="storeDescription"
              name="storeDescription"
              rows={4}
              defaultValue={
                settings.storeDescription ?? ""
              }
              disabled={isPending}
              className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-50"
              placeholder="Tuliskan deskripsi singkat tentang toko..."
            />
          </div>

          <div>
            <label
              htmlFor="footerDescription"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Deskripsi Footer
            </label>

            <textarea
              id="footerDescription"
              name="footerDescription"
              rows={4}
              defaultValue={
                settings.footerDescription ?? ""
              }
              disabled={isPending}
              className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-50"
              placeholder="Masukkan deskripsi yang ingin ditampilkan pada bagian footer..."
            />

            <p className="mt-2 text-xs text-slate-500">
              Deskripsi ini akan ditampilkan pada bagian footer halaman customer.
            </p>
          </div>
        </div>
      </section>

{/* ====================================================== */}
{/* HERO SLIDER IMAGES */}
{/* ====================================================== */}

<section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
  <div className="mb-6 flex items-start gap-3">
    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white">
      <ImagePlus className="h-5 w-5" />
    </div>

    <div>
      <h2 className="text-base font-bold text-slate-900">
        Gambar Hero Slider
      </h2>

      <p className="mt-1 text-sm text-slate-500">
        Atur gambar visual pada sisi kanan setiap slide homepage.
      </p>
    </div>
  </div>

<div className="grid gap-5 xl:grid-cols-3">
  {(
    [
      {
        key: "slide1" as const,
        title: "Hero Slide 1",
        description:
          "Konten dan gambar slide pertama homepage.",
        image: heroSlide1Image,
        inputRef: heroSlide1InputRef,

        eyebrow: heroSlide1Eyebrow,
        setEyebrow: setHeroSlide1Eyebrow,

        headline: heroSlide1Title,
        setHeadline: setHeroSlide1Title,

        highlight: heroSlide1Highlight,
        setHighlight: setHeroSlide1Highlight,

        slideDescription: heroSlide1Description,
        setSlideDescription:
          setHeroSlide1Description,

        button: heroSlide1Button,
        setButton: setHeroSlide1Button,
      },

      {
        key: "slide2" as const,
        title: "Hero Slide 2",
        description:
          "Konten dan gambar slide kedua homepage.",
        image: heroSlide2Image,
        inputRef: heroSlide2InputRef,

        eyebrow: heroSlide2Eyebrow,
        setEyebrow: setHeroSlide2Eyebrow,

        headline: heroSlide2Title,
        setHeadline: setHeroSlide2Title,

        highlight: heroSlide2Highlight,
        setHighlight: setHeroSlide2Highlight,

        slideDescription: heroSlide2Description,
        setSlideDescription:
          setHeroSlide2Description,

        button: heroSlide2Button,
        setButton: setHeroSlide2Button,
      },

      {
        key: "slide3" as const,
        title: "Hero Slide 3",
        description:
          "Konten dan gambar slide ketiga homepage.",
        image: heroSlide3Image,
        inputRef: heroSlide3InputRef,

        eyebrow: heroSlide3Eyebrow,
        setEyebrow: setHeroSlide3Eyebrow,

        headline: heroSlide3Title,
        setHeadline: setHeroSlide3Title,

        highlight: heroSlide3Highlight,
        setHighlight: setHeroSlide3Highlight,

        slideDescription: heroSlide3Description,
        setSlideDescription:
          setHeroSlide3Description,

        button: heroSlide3Button,
        setButton: setHeroSlide3Button,
      },
    ] as const
  ).map((slide) => {
      const isUploading =
        uploadingHeroSlide ===
        slide.key;

      return (
        <div
          key={slide.key}
          className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50"
        >
          {/* PREVIEW */}

          <div className="relative flex aspect-16/10 items-center justify-center overflow-hidden border-b border-slate-200 bg-white">
            {slide.image ? (
              <Image
                src={slide.image}
                alt={slide.title}
                fill
                sizes="(max-width: 1280px) 100vw, 33vw"
                className="object-contain p-5"
                unoptimized
              />
            ) : (
              <div className="flex flex-col items-center gap-2 text-slate-400">
                <ImagePlus className="h-10 w-10" />

                <span className="text-xs font-medium">
                  Belum ada gambar
                </span>
              </div>
            )}

            {isUploading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-white/80 backdrop-blur-sm">
                <Loader2 className="h-7 w-7 animate-spin text-slate-900" />

                <span className="text-xs font-semibold text-slate-700">
                  Mengupload gambar...
                </span>
              </div>
            )}
          </div>

          <div className="mt-5 space-y-4 border-t border-slate-200 pt-5">

  <div>
    <label className="mb-2 block text-xs font-semibold text-slate-700">
      Eyebrow
    </label>

    <input
      type="text"
      value={slide.eyebrow}
      onChange={(event) =>
        slide.setEyebrow(event.target.value)
      }
      disabled={isPending}
      className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100 disabled:bg-slate-50"
      placeholder="PUSAT IKAN SEGAR"
    />
  </div>

  <div>
    <label className="mb-2 block text-xs font-semibold text-slate-700">
      Judul
    </label>

    <input
      type="text"
      value={slide.headline}
      onChange={(event) =>
        slide.setHeadline(event.target.value)
      }
      disabled={isPending}
      className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100 disabled:bg-slate-50"
      placeholder="Ikan Segar,"
    />
  </div>

  <div>
    <label className="mb-2 block text-xs font-semibold text-slate-700">
      Highlight
    </label>

    <input
      type="text"
      value={slide.highlight}
      onChange={(event) =>
        slide.setHighlight(event.target.value)
      }
      disabled={isPending}
      className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100 disabled:bg-slate-50"
      placeholder="Langsung untuk Keluarga."
    />
  </div>

  <div>
    <label className="mb-2 block text-xs font-semibold text-slate-700">
      Deskripsi
    </label>

    <textarea
      value={slide.slideDescription}
      onChange={(event) =>
        slide.setSlideDescription(
          event.target.value
        )
      }
      disabled={isPending}
      rows={3}
      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100 disabled:bg-slate-50"
      placeholder="Belanja ikan dan seafood pilihan..."
    />
  </div>

  <div>
    <label className="mb-2 block text-xs font-semibold text-slate-700">
      Teks Tombol
    </label>

    <input
      type="text"
      value={slide.button}
      onChange={(event) =>
        slide.setButton(event.target.value)
      }
      disabled={isPending}
      className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100 disabled:bg-slate-50"
      placeholder="Belanja Sekarang"
    />
  </div>

</div>

      {/* CONTENT */}

          <div className="p-4">
            <h3 className="text-sm font-bold text-slate-900">
              {slide.title}
            </h3>

            <p className="mt-1 min-h-10 text-xs leading-5 text-slate-500">
              {slide.description}
            </p>

            <p className="mt-3 text-[11px] leading-5 text-slate-400">
              PNG, WEBP, atau GIF. Maksimal 5 MB.
            </p>

            <input
              ref={slide.inputRef}
              type="file"
              accept=".png,.webp,.gif,image/png,image/webp,image/gif"
              onChange={(event) =>
                handleHeroImageChange(
                  slide.key,
                  event
                )
              }
              className="hidden"
            />

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() =>
                  slide.inputRef.current?.click()
                }
                disabled={
                  isPending ||
                  uploadingHeroSlide !== null
                }
                className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <ImagePlus className="h-4 w-4" />

                    {slide.image
                      ? "Ganti Gambar"
                      : "Upload Gambar"}
                  </>
                )}
              </button>

              {slide.image && (
                <button
                  type="button"
                  onClick={() =>
                    handleRemoveHeroImage(
                      slide.key
                    )
                  }
                  disabled={
                    isPending ||
                    uploadingHeroSlide !== null
                  }
                  className="inline-flex h-10 items-center justify-center rounded-xl border border-red-200 bg-white px-3 text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                  aria-label={`Hapus ${slide.title}`}
                  title="Hapus gambar"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      );
    })}
  </div>

  <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
    <p className="text-xs leading-5 text-blue-700">
      Jika gambar tidak diatur, homepage akan tetap menggunakan icon default.
      Gambar hanya digunakan sebagai visual pada sisi kanan Hero Slider dan
      tidak menggantikan background atau isi slide.
    </p>
  </div>
</section>

{/* ====================================================== */}
{/* MOBILE LOGIN SLIDER */}
{/* ====================================================== */}

<section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
  <div className="mb-6 flex items-start gap-3">
    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white">
      <ImagePlus className="h-5 w-5" />
    </div>

    <div>
      <h2 className="text-base font-bold text-slate-900">
        Mobile Login Slider
      </h2>

      <p className="mt-1 text-sm text-slate-500">
        Atur gambar slider yang tampil pada halaman login versi mobile.
      </p>
    </div>
  </div>

  <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
    {(
      [
        {
          key: "slide1" as const,
          title: "Login Slide 1",
          description: "Gambar pertama pada slider login mobile.",
          image: loginSlide1Image,
          inputRef: loginSlide1InputRef,
        },
        {
          key: "slide2" as const,
          title: "Login Slide 2",
          description: "Gambar kedua pada slider login mobile.",
          image: loginSlide2Image,
          inputRef: loginSlide2InputRef,
        },
        {
          key: "slide3" as const,
          title: "Login Slide 3",
          description: "Gambar ketiga pada slider login mobile.",
          image: loginSlide3Image,
          inputRef: loginSlide3InputRef,
        },
        {
          key: "slide4" as const,
          title: "Login Slide 4",
          description: "Gambar keempat pada slider login mobile.",
          image: loginSlide4Image,
          inputRef: loginSlide4InputRef,
        },
      ] as const
    ).map((slide) => {
      const isUploading =
        uploadingLoginSlide === slide.key;

      return (
        <div
          key={slide.key}
          className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50"
        >
          <div className="relative flex aspect-9/16 items-center justify-center overflow-hidden border-b border-slate-200 bg-white">
            {slide.image ? (
              <Image
                src={slide.image}
                alt={slide.title}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1280px) 25vw, 280px"
                className="object-cover"
                unoptimized
              />
            ) : (
              <div className="flex flex-col items-center gap-2 px-4 text-center text-slate-400">
                <ImagePlus className="h-10 w-10" />

                <span className="text-xs font-medium">
                  Menggunakan gambar default
                </span>
              </div>
            )}

            {isUploading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-white/80 backdrop-blur-sm">
                <Loader2 className="h-7 w-7 animate-spin text-slate-900" />

                <span className="text-xs font-semibold text-slate-700">
                  Mengupload gambar...
                </span>
              </div>
            )}
          </div>

          <div className="p-4">
            <h3 className="text-sm font-bold text-slate-900">
              {slide.title}
            </h3>

            <p className="mt-1 min-h-10 text-xs leading-5 text-slate-500">
              {slide.description}
            </p>

            <p className="mt-3 text-[11px] leading-5 text-slate-400">
              PNG, WEBP, atau GIF. Maksimal 5 MB.
            </p>

            <input
              ref={slide.inputRef}
              type="file"
              accept=".png,.webp,.gif,image/png,image/webp,image/gif"
              onChange={(event) =>
                handleLoginImageChange(
                  slide.key,
                  event
                )
              }
              className="hidden"
            />

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() =>
                  slide.inputRef.current?.click()
                }
                disabled={
                  isPending ||
                  uploadingLoginSlide !== null
                }
                className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-slate-900 px-3 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <ImagePlus className="h-4 w-4" />
                    {slide.image
                      ? "Ganti"
                      : "Upload"}
                  </>
                )}
              </button>

              {slide.image && (
                <button
                  type="button"
                  onClick={() =>
                    setLoginSlideImage(
                      slide.key,
                      null
                    )
                  }
                  disabled={
                    isPending ||
                    uploadingLoginSlide !== null
                  }
                  className="inline-flex h-10 items-center justify-center rounded-xl border border-red-200 bg-white px-3 text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                  aria-label={`Hapus ${slide.title}`}
                  title="Hapus gambar"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      );
    })}
  </div>

  <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
    <p className="text-xs leading-5 text-blue-700">
      Jika gambar Login tidak diatur, halaman login
      mobile akan otomatis menggunakan gambar default
      bawaan sistem. Perubahan baru aktif setelah
      Anda menekan Simpan Pengaturan.
    </p>
  </div>
</section>

{/* ====================================================== */}
{/* FLASH SALE BANNER */}
{/* ====================================================== */}

<section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
  <div className="mb-6 flex items-start gap-3">
    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white">
      <ImagePlus className="h-5 w-5" />
    </div>

    <div>
      <h2 className="text-base font-bold text-slate-900">
        Banner Flash Sale Homepage
      </h2>

      <p className="mt-1 text-sm text-slate-500">
        Upload satu gambar seafood horizontal untuk banner Flash Sale di homepage.
      </p>
    </div>
  </div>

  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
    <div className="relative flex aspect-[16/7] items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white">
      {flashSaleBannerImage ? (
        <Image
          src={flashSaleBannerImage}
          alt="Banner Flash Sale"
          fill
          sizes="(max-width:768px) 100vw, 900px"
          className="object-cover"
          unoptimized
        />
      ) : (
        <div className="flex flex-col items-center gap-2 text-slate-400">
          <ImagePlus className="h-10 w-10" />
          <span className="text-xs font-medium">
            Belum ada banner Flash Sale
          </span>
        </div>
      )}

      {isUploadingFlashSaleBanner && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-white/80 backdrop-blur-sm">
          <Loader2 className="h-7 w-7 animate-spin text-slate-900" />
          <span className="text-xs font-semibold text-slate-700">
            Mengupload gambar...
          </span>
        </div>
      )}
    </div>

    <div className="mt-4 flex flex-wrap gap-2">
      <input
        ref={flashSaleBannerInputRef}
        type="file"
        accept=".png,.webp,.gif,image/png,image/webp,image/gif"
        onChange={handleFlashSaleBannerChange}
        className="hidden"
      />

      <button
        type="button"
        onClick={() => flashSaleBannerInputRef.current?.click()}
        disabled={isPending || isUploadingFlashSaleBanner}
        className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
      >
        {isUploadingFlashSaleBanner ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Mengupload...
          </>
        ) : (
          <>
            <ImagePlus className="h-4 w-4" />
            {flashSaleBannerImage ? "Ganti Banner" : "Upload Banner"}
          </>
        )}
      </button>

      {flashSaleBannerImage && (
        <button
          type="button"
          onClick={handleRemoveFlashSaleBanner}
          disabled={isPending || isUploadingFlashSaleBanner}
          className="inline-flex h-10 items-center justify-center rounded-xl border border-red-200 bg-white px-3 text-red-600 transition hover:bg-red-50 disabled:opacity-60"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}
    </div>

    <p className="mt-3 text-xs leading-5 text-slate-500">
      Rekomendasi ukuran 1600×700 px. Format PNG, WEBP, atau GIF maksimal 5 MB.
    </p>
    <div className="mt-6 grid gap-5 border-t border-slate-200 pt-6">
  <div>
    <label
      htmlFor="flashSaleBannerLabel"
      className="mb-2 block text-sm font-semibold text-slate-700"
    >
      Label
    </label>

    <input
      id="flashSaleBannerLabel"
      name="flashSaleBannerLabel"
      type="text"
      value={flashSaleBannerLabel}
      onChange={(event) =>
        setFlashSaleBannerLabel(event.target.value)
      }
      disabled={isPending}
      className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-50"
      placeholder="FLASH SALE"
    />
  </div>

  <div>
    <label
      htmlFor="flashSaleBannerTitle"
      className="mb-2 block text-sm font-semibold text-slate-700"
    >
      Judul
    </label>

    <input
      id="flashSaleBannerTitle"
      name="flashSaleBannerTitle"
      type="text"
      value={flashSaleBannerTitle}
      onChange={(event) =>
        setFlashSaleBannerTitle(event.target.value)
      }
      disabled={isPending}
      className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-50"
      placeholder="Seafood Favorit,"
    />
  </div>

  <div>
    <label
      htmlFor="flashSaleBannerHighlight"
      className="mb-2 block text-sm font-semibold text-slate-700"
    >
      Highlight
    </label>

    <input
      id="flashSaleBannerHighlight"
      name="flashSaleBannerHighlight"
      type="text"
      value={flashSaleBannerHighlight}
      onChange={(event) =>
        setFlashSaleBannerHighlight(event.target.value)
      }
      disabled={isPending}
      className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-50"
      placeholder="Harga Lebih Menarik."
    />
  </div>

  <div>
    <label
      htmlFor="flashSaleBannerDescription"
      className="mb-2 block text-sm font-semibold text-slate-700"
    >
      Deskripsi
    </label>

    <textarea
      id="flashSaleBannerDescription"
      name="flashSaleBannerDescription"
      value={flashSaleBannerDescription}
      onChange={(event) =>
        setFlashSaleBannerDescription(event.target.value)
      }
      disabled={isPending}
      rows={3}
      className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-50"
      placeholder="Promo terbatas untuk produk pilihan. Dapatkan harga spesial sebelum waktunya berakhir."
    />
  </div>
</div>
  </div>
</section>

{/* ====================================================== */}
{/* KONTAK */}
{/* ====================================================== */}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-6 flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white">
            <Phone className="h-5 w-5" />
          </div>

          <div>
            <h2 className="text-base font-bold text-slate-900">
              Kontak
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Informasi kontak yang dapat digunakan pelanggan.
            </p>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Email
            </label>

            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                id="email"
                name="email"
                type="email"
                defaultValue={
                  settings.email ?? ""
                }
                disabled={isPending}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-50"
                placeholder="email@example.com"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="whatsapp"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              WhatsApp
            </label>

            <div className="relative">
              <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                id="whatsapp"
                name="whatsapp"
                type="text"
                defaultValue={
                  settings.whatsapp ?? ""
                }
                disabled={isPending}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-50"
                placeholder="081234567890"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================== */}
      {/* ALAMAT TOKO */}
      {/* ====================================================== */}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-6 flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white">
            <MapPin className="h-5 w-5" />
          </div>

          <div>
            <h2 className="text-base font-bold text-slate-900">
              Alamat Toko
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Tentukan alamat dan lokasi origin untuk pengiriman.
            </p>
          </div>
        </div>

        <div className="grid gap-5">
          <div>
            <label
              htmlFor="address"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Alamat Lengkap
            </label>

            <textarea
              id="address"
              name="address"
              rows={3}
              defaultValue={
                settings.address ?? ""
              }
              disabled={isPending}
              className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-50"
              placeholder="Masukkan alamat lengkap toko..."
            />
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            <div>
              <label
                htmlFor="city"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Kota
              </label>

              <input
                id="city"
                name="city"
                type="text"
                defaultValue={
                  settings.city ?? ""
                }
                disabled={isPending}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-50"
                placeholder="Jakarta"
              />
            </div>

            <div>
              <label
                htmlFor="province"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Provinsi
              </label>

              <input
                id="province"
                name="province"
                type="text"
                defaultValue={
                  settings.province ?? ""
                }
                disabled={isPending}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-50"
                placeholder="DKI Jakarta"
              />
            </div>

            <div>
              <label
                htmlFor="postalCode"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Kode Pos
              </label>

              <input
                id="postalCode"
                name="postalCode"
                type="text"
                defaultValue={
                  settings.postalCode ?? ""
                }
                disabled={isPending}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-50"
                placeholder="12345"
              />
            </div>
          </div>

          {/* ================================================== */}
          {/* STORE GPS / SHIPPING ORIGIN */}
          {/* ================================================== */}

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
            <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white">
                  <Navigation className="h-5 w-5" />
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Lokasi Origin Toko
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Digunakan sebagai titik awal perhitungan jarak dan ongkos kirim kurir internal.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={
                  handleGetCurrentLocation
                }
                disabled={
                  isPending ||
                  isLocating
                }
                className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLocating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Mengambil...
                  </>
                ) : (
                  <>
                    <LocateFixed className="h-4 w-4" />
                    Ambil Lokasi
                  </>
                )}
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label
                  htmlFor="latitude"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Latitude
                </label>

                <input
                  id="latitude"
                  name="latitude"
                  type="number"
                  step="any"
                  value={latitude}
                  onChange={(event) =>
                    setLatitude(
                      event.target.value
                    )
                  }
                  disabled={isPending}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                  placeholder="-6.2000000"
                />
              </div>

              <div>
                <label
                  htmlFor="longitude"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Longitude
                </label>

                <input
                  id="longitude"
                  name="longitude"
                  type="number"
                  step="any"
                  value={longitude}
                  onChange={(event) =>
                    setLongitude(
                      event.target.value
                    )
                  }
                  disabled={isPending}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                  placeholder="106.8166667"
                />
              </div>
            </div>

            <p className="mt-4 text-xs leading-5 text-slate-500">
              Klik <strong>Ambil Lokasi</strong> saat Anda berada di lokasi toko, atau masukkan koordinat secara manual.
              Lokasi ini akan digunakan sebagai origin pengiriman.
            </p>

            {hasValidLocation && (
              <div className="mt-5">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900">
                      Preview Lokasi Origin
                    </h4>

                    <p className="mt-1 text-xs text-slate-500">
                      Pastikan titik pada peta sesuai dengan lokasi toko.
                    </p>
                  </div>

                  <div className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-[11px] font-semibold text-emerald-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Lokasi Valid
                  </div>
                </div>

                <StoreLocationMapPreview
                  latitude={
                    previewLatitude
                  }
                  longitude={
                    previewLongitude
                  }
                  label={
                    settings.storeName ||
                    "Lokasi Origin Toko"
                  }
                />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ====================================================== */}
      {/* INTERNAL SHIPPING CONFIGURATION */}
      {/* ====================================================== */}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-6 flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white">
            <Truck className="h-5 w-5" />
          </div>

          <div>
            <h2 className="text-base font-bold text-slate-900">
              Konfigurasi Pengiriman
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Atur layanan dan perhitungan ongkos kirim kurir internal.
            </p>
          </div>
        </div>

        <div className="mb-6 flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Aktifkan Kurir Internal
            </h3>

            <p className="mt-1 text-xs leading-5 text-slate-500">
              Jika dinonaktifkan, layanan kurir internal tidak akan tersedia pada checkout.
            </p>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={
              internalShippingEnabled
            }
            onClick={() =>
              setInternalShippingEnabled(
                (previous) => !previous
              )
            }
            disabled={isPending}
            className={[
              "relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition",
              internalShippingEnabled
                ? "bg-emerald-600"
                : "bg-slate-300",
              isPending
                ? "cursor-not-allowed opacity-60"
                : "cursor-pointer",
            ].join(" ")}
          >
            <span
              className={[
                "inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition",
                internalShippingEnabled
                  ? "translate-x-6"
                  : "translate-x-1",
              ].join(" ")}
            />
          </button>
        </div>

        <div
          className={[
            "grid gap-5 transition",
            !internalShippingEnabled
              ? "pointer-events-none opacity-50"
              : "",
          ].join(" ")}
        >
          <div>
            <label
              htmlFor="internalShippingName"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Nama Layanan
            </label>

            <input
              id="internalShippingName"
              name="internalShippingName"
              type="text"
              defaultValue={
                settings.internalShippingName ||
                "Kurir Internal"
              }
              disabled={
                isPending ||
                !internalShippingEnabled
              }
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-100"
              placeholder="Contoh: Pisjo Market Express"
            />
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label
                htmlFor="internalShippingBaseFee"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Biaya Dasar
              </label>

              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-500">
                  Rp
                </span>

                <input
                  id="internalShippingBaseFee"
                  name="internalShippingBaseFee"
                  type="number"
                  min="0"
                  step="1"
                  defaultValue={
                    settings.internalShippingBaseFee
                  }
                  disabled={
                    isPending ||
                    !internalShippingEnabled
                  }
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                  placeholder="0"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="internalShippingPerKmFee"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Biaya per KM
              </label>

              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-500">
                  Rp
                </span>

                <input
                  id="internalShippingPerKmFee"
                  name="internalShippingPerKmFee"
                  type="number"
                  min="0"
                  step="1"
                  defaultValue={
                    settings.internalShippingPerKmFee
                  }
                  disabled={
                    isPending ||
                    !internalShippingEnabled
                  }
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                  placeholder="0"
                />
              </div>
            </div>
          </div>

<div className="grid gap-5 md:grid-cols-2">
  {/* MINIMUM ONGKIR */}
  <div>
    <label
      htmlFor="internalShippingMinFee"
      className="mb-2 block text-sm font-semibold text-slate-700"
    >
      Minimum Ongkir
    </label>

    <div className="relative">
      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-500">
        Rp
      </span>

      <input
        id="internalShippingMinFee"
        name="internalShippingMinFee"
        type="number"
        min="0"
        step="1"
        defaultValue={settings.internalShippingMinFee}
        disabled={
          isPending ||
          !internalShippingEnabled
        }
        className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-100"
        placeholder="5000"
      />
    </div>

    <p className="mt-2 text-xs leading-5 text-slate-500">
      Batas minimum ongkir kotor sebelum subsidi gratis ongkir diterapkan.
    </p>
  </div>

  {/* JARAK MAKSIMUM */}
  <div>
    <label
      htmlFor="internalShippingMaxDistance"
      className="mb-2 block text-sm font-semibold text-slate-700"
    >
      Jarak Maksimum Pengiriman
    </label>

    <div className="relative">
      <input
        id="internalShippingMaxDistance"
        name="internalShippingMaxDistance"
        type="number"
        min="0.1"
        step="0.1"
        defaultValue={settings.internalShippingMaxDistance}
        disabled={
          isPending ||
          !internalShippingEnabled
        }
        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 pr-12 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-100"
        placeholder="20"
      />

      <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-500">
        KM
      </span>
    </div>

    <p className="mt-2 text-xs leading-5 text-slate-500">
      Pesanan di luar jarak ini tidak dapat menggunakan kurir internal.
    </p>
  </div>

  {/* MINIMUM BELANJA GRATIS ONGKIR */}
  <div>
    <label
      htmlFor="internalShippingFreeThreshold"
      className="mb-2 block text-sm font-semibold text-slate-700"
    >
      Minimum Belanja untuk Subsidi Ongkir
    </label>

    <div className="relative">
      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-500">
        Rp
      </span>

      <input
        id="internalShippingFreeThreshold"
        name="internalShippingFreeThreshold"
        type="number"
        min="0"
        step="1"
        defaultValue={
          settings.internalShippingFreeThreshold ?? ""
        }
        disabled={
          isPending ||
          !internalShippingEnabled
        }
        className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-100"
        placeholder="250000"
      />
    </div>

    <p className="mt-2 text-xs leading-5 text-slate-500">
      Minimum subtotal agar customer mendapatkan subsidi ongkir.
    </p>
  </div>

  {/* MAKSIMUM SUBSIDI */}
  <div>
    <label
      htmlFor="internalShippingFreeMaxDiscount"
      className="mb-2 block text-sm font-semibold text-slate-700"
    >
      Maksimum Subsidi Gratis Ongkir
    </label>

    <div className="relative">
      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-500">
        Rp
      </span>

      <input
        id="internalShippingFreeMaxDiscount"
        name="internalShippingFreeMaxDiscount"
        type="number"
        min="0"
        step="1"
        defaultValue={
          settings.internalShippingFreeMaxDiscount
        }
        disabled={
          isPending ||
          !internalShippingEnabled
        }
        className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-100"
        placeholder="10000"
      />
    </div>

    <p className="mt-2 text-xs leading-5 text-slate-500">
      Batas maksimal subsidi yang ditanggung toko untuk satu transaksi.
    </p>
  </div>
</div>

<div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
  <p className="text-xs leading-5 text-blue-700">
    Ongkir dihitung dari lokasi toko ke alamat customer berdasarkan
    <strong> biaya dasar + (jarak × biaya per KM)</strong>.
    Hasilnya memiliki batas minimum sesuai pengaturan Minimum Ongkir.
    Jika subtotal mencapai minimum belanja subsidi, toko memberikan
    subsidi ongkir maksimal sesuai Maksimum Subsidi Gratis Ongkir.
    Customer membayar sisa ongkir setelah subsidi.
  </p>
</div>
        </div>
      </section>

      {/* ====================================================== */}
      {/* JAM OPERASIONAL */}
      {/* ====================================================== */}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-6 flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white">
            <Clock className="h-5 w-5" />
          </div>

          <div>
            <h2 className="text-base font-bold text-slate-900">
              Jam Operasional
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Tentukan jam buka dan jam tutup toko.
            </p>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label
              htmlFor="openingTime"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Jam Buka
            </label>

            <input
              id="openingTime"
              name="openingTime"
              type="time"
              defaultValue={
                settings.openingTime ?? ""
              }
              disabled={isPending}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-50"
            />
          </div>

          <div>
            <label
              htmlFor="closingTime"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Jam Tutup
            </label>

            <input
              id="closingTime"
              name="closingTime"
              type="time"
              defaultValue={
                settings.closingTime ?? ""
              }
              disabled={isPending}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-50"
            />
          </div>
                </div>
      </section>

      {/* ====================================================== */}
      {/* PENGATURAN ORDER */}
      {/* ====================================================== */}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-6 flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white">
            <Clock className="h-5 w-5" />
          </div>

          <div>
            <h2 className="text-base font-bold text-slate-900">
              Pengaturan Order
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Atur batas waktu pembayaran order sebelum
              sistem membatalkannya secara otomatis.
            </p>
          </div>
        </div>

        <div className="max-w-md">
          <label
            htmlFor="paymentTimeoutHours"
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            Batas Waktu Pembayaran
          </label>

          <div className="relative">
            <input
              id="paymentTimeoutHours"
              name="paymentTimeoutHours"
              type="number"
              min="1"
              step="1"
              value={paymentTimeoutHours}
              onChange={(event) =>
                setPaymentTimeoutHours(
                  event.target.value
                )
              }
              disabled={isPending}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 pr-14 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-50"
              placeholder="24"
            />

            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-500">
              jam
            </span>
          </div>

          <p className="mt-2 text-xs leading-5 text-slate-500">
            Order dengan status menunggu pembayaran akan
            dianggap expired setelah melewati batas waktu ini.
            Nilai default adalah 24 jam.
          </p>
        </div>

        <div className="mt-5 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3">
          <p className="text-xs leading-5 text-amber-700">
            Pengaturan ini digunakan oleh sistem expiration
            order. Jangan mengatur nilai terlalu pendek karena
            customer membutuhkan waktu untuk menyelesaikan
            pembayaran.
          </p>
        </div>
      </section>

      {/* ====================================================== */}
      {/* SUBMIT */}
      {/* ====================================================== */}

<div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
  <button
    type="submit"
disabled={
  isPending ||
  isLocating ||
  isUploadingLogo ||
  uploadingHeroSlide !== null ||
  uploadingLoginSlide !== null ||
  isUploadingFlashSaleBanner
}
    className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
  >
{isPending ? (
  <>
    <Loader2 className="h-4 w-4 animate-spin" />
    Menyimpan...
  </>
) : isUploadingLogo ? (
  <>
    <Loader2 className="h-4 w-4 animate-spin" />
    Mengupload Logo...
  </>
) : uploadingHeroSlide ? (
  <>
    <Loader2 className="h-4 w-4 animate-spin" />
    Mengupload Gambar Hero...
  </>
) : uploadingLoginSlide ? (
  <>
    <Loader2 className="h-4 w-4 animate-spin" />
    Mengupload Gambar Login...
  </>
) : (
  <>
    <Save className="h-4 w-4" />
    Simpan Pengaturan
  </>
)}
        </button>
      </div>
    </form>
  );
}
