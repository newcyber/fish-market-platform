"use client";

import {
  useRef,
  useState,
  useTransition,
} from "react";

import Image from "next/image";

import {
  AlertCircle,
  CheckCircle2,
  ImagePlus,
  Loader2,
  Save,
  Sparkles,
  Trash2,
} from "lucide-react";

import {
  updateImageBannerSettingsAction,
} from "@/actions/admin/settings/update-image-banner-settings";

type HeroSlideKey =
  | "slide1"
  | "slide2"
  | "slide3";

type LoginSlideKey =
  | "slide1"
  | "slide2"
  | "slide3"
  | "slide4";

type ImageBannerSettings = {
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

  promoSectionLabel: string | null;
  promoSectionTitle: string | null;
  promoSectionLinkLabel: string | null;
  promoSectionLinkHref: string | null;

  promoCard1Image: string | null;
  promoCard1Eyebrow: string | null;
  promoCard1Title: string | null;
  promoCard1Description: string | null;
  promoCard1Button: string | null;
  promoCard1Href: string | null;

  promoCard2Image: string | null;
  promoCard2Eyebrow: string | null;
  promoCard2Title: string | null;
  promoCard2Description: string | null;
  promoCard2Button: string | null;
  promoCard2Href: string | null;
};

interface ImageBannerSettingsFormProps {
  settings: ImageBannerSettings;
}

const ALLOWED_IMAGE_TYPES = [
  "image/png",
  "image/webp",
  "image/gif",
] as const;

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

export default function ImageBannerSettingsForm({
  settings,
}: ImageBannerSettingsFormProps) {
  const [isPending, startTransition] =
    useTransition();

  const [message, setMessage] =
    useState<string | null>(null);

  const [isSuccess, setIsSuccess] =
    useState<boolean | null>(null);

  /*
   * ==========================================================
   * HERO SLIDER
   * ==========================================================
   */

  const [heroSlide1Image, setHeroSlide1Image] =
    useState<string | null>(
      settings.heroSlide1Image
    );

  const [heroSlide2Image, setHeroSlide2Image] =
    useState<string | null>(
      settings.heroSlide2Image
    );

  const [heroSlide3Image, setHeroSlide3Image] =
    useState<string | null>(
      settings.heroSlide3Image
    );

  const [heroSlide1Eyebrow, setHeroSlide1Eyebrow] =
    useState(
      settings.heroSlide1Eyebrow ?? ""
    );

  const [heroSlide1Title, setHeroSlide1Title] =
    useState(
      settings.heroSlide1Title ?? ""
    );

  const [heroSlide1Highlight, setHeroSlide1Highlight] =
    useState(
      settings.heroSlide1Highlight ?? ""
    );

  const [heroSlide1Description, setHeroSlide1Description] =
    useState(
      settings.heroSlide1Description ?? ""
    );

  const [heroSlide1Button, setHeroSlide1Button] =
    useState(
      settings.heroSlide1Button ?? ""
    );

  const [heroSlide2Eyebrow, setHeroSlide2Eyebrow] =
    useState(
      settings.heroSlide2Eyebrow ?? ""
    );

  const [heroSlide2Title, setHeroSlide2Title] =
    useState(
      settings.heroSlide2Title ?? ""
    );

  const [heroSlide2Highlight, setHeroSlide2Highlight] =
    useState(
      settings.heroSlide2Highlight ?? ""
    );

  const [heroSlide2Description, setHeroSlide2Description] =
    useState(
      settings.heroSlide2Description ?? ""
    );

  const [heroSlide2Button, setHeroSlide2Button] =
    useState(
      settings.heroSlide2Button ?? ""
    );

  const [heroSlide3Eyebrow, setHeroSlide3Eyebrow] =
    useState(
      settings.heroSlide3Eyebrow ?? ""
    );

  const [heroSlide3Title, setHeroSlide3Title] =
    useState(
      settings.heroSlide3Title ?? ""
    );

  const [heroSlide3Highlight, setHeroSlide3Highlight] =
    useState(
      settings.heroSlide3Highlight ?? ""
    );

  const [heroSlide3Description, setHeroSlide3Description] =
    useState(
      settings.heroSlide3Description ?? ""
    );

  const [heroSlide3Button, setHeroSlide3Button] =
    useState(
      settings.heroSlide3Button ?? ""
    );

  const [uploadingHeroSlide, setUploadingHeroSlide] =
    useState<HeroSlideKey | null>(null);

  const heroSlide1InputRef =
    useRef<HTMLInputElement | null>(null);

  const heroSlide2InputRef =
    useRef<HTMLInputElement | null>(null);

  const heroSlide3InputRef =
    useRef<HTMLInputElement | null>(null);

  /*
   * ==========================================================
   * MOBILE LOGIN SLIDER
   * ==========================================================
   */

  const [loginSlide1Image, setLoginSlide1Image] =
    useState<string | null>(
      settings.loginSlide1Image
    );

  const [loginSlide2Image, setLoginSlide2Image] =
    useState<string | null>(
      settings.loginSlide2Image
    );

  const [loginSlide3Image, setLoginSlide3Image] =
    useState<string | null>(
      settings.loginSlide3Image
    );

  const [loginSlide4Image, setLoginSlide4Image] =
    useState<string | null>(
      settings.loginSlide4Image
    );

  const [uploadingLoginSlide, setUploadingLoginSlide] =
    useState<LoginSlideKey | null>(null);

  const loginSlide1InputRef =
    useRef<HTMLInputElement | null>(null);

  const loginSlide2InputRef =
    useRef<HTMLInputElement | null>(null);

  const loginSlide3InputRef =
    useRef<HTMLInputElement | null>(null);

  const loginSlide4InputRef =
    useRef<HTMLInputElement | null>(null);

  /*
   * ==========================================================
   * FLASH SALE
   * ==========================================================
   */

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
    useRef<HTMLInputElement | null>(null);

  /*
   * ==========================================================
   * PROMO PILIHAN
   * ==========================================================
   */

  const [
    promoSectionLabel,
    setPromoSectionLabel,
  ] = useState(
    settings.promoSectionLabel ?? ""
  );

  const [
    promoSectionTitle,
    setPromoSectionTitle,
  ] = useState(
    settings.promoSectionTitle ?? ""
  );

  const [
    promoSectionLinkLabel,
    setPromoSectionLinkLabel,
  ] = useState(
    settings.promoSectionLinkLabel ?? ""
  );

  const [
    promoSectionLinkHref,
    setPromoSectionLinkHref,
  ] = useState(
    settings.promoSectionLinkHref ?? ""
  );

  const [promoCard1Image, setPromoCard1Image] =
    useState<string | null>(
      settings.promoCard1Image
    );

  const [promoCard1Eyebrow, setPromoCard1Eyebrow] =
    useState(
      settings.promoCard1Eyebrow ?? ""
    );

  const [promoCard1Title, setPromoCard1Title] =
    useState(
      settings.promoCard1Title ?? ""
    );

  const [
    promoCard1Description,
    setPromoCard1Description,
  ] = useState(
    settings.promoCard1Description ?? ""
  );

  const [promoCard1Button, setPromoCard1Button] =
    useState(
      settings.promoCard1Button ?? ""
    );

  const [promoCard1Href, setPromoCard1Href] =
    useState(
      settings.promoCard1Href ?? ""
    );

  const [promoCard2Image, setPromoCard2Image] =
    useState<string | null>(
      settings.promoCard2Image
    );

  const [promoCard2Eyebrow, setPromoCard2Eyebrow] =
    useState(
      settings.promoCard2Eyebrow ?? ""
    );

  const [promoCard2Title, setPromoCard2Title] =
    useState(
      settings.promoCard2Title ?? ""
    );

  const [
    promoCard2Description,
    setPromoCard2Description,
  ] = useState(
    settings.promoCard2Description ?? ""
  );

  const [promoCard2Button, setPromoCard2Button] =
    useState(
      settings.promoCard2Button ?? ""
    );

  const [promoCard2Href, setPromoCard2Href] =
    useState(
      settings.promoCard2Href ?? ""
    );

  const [uploadingPromoCard, setUploadingPromoCard] =
    useState<"card1" | "card2" | null>(null);

  const promoCard1InputRef =
    useRef<HTMLInputElement | null>(null);

  const promoCard2InputRef =
    useRef<HTMLInputElement | null>(null);

  /*
   * ==========================================================
   * HELPERS
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

  function validateImage(
    file: File,
    label: string
  ): boolean {
    if (
      !ALLOWED_IMAGE_TYPES.includes(
        file.type as (typeof ALLOWED_IMAGE_TYPES)[number]
      )
    ) {
      setMessage(
        `Format gambar ${label} harus PNG, WEBP, atau GIF.`
      );
      setIsSuccess(false);
      return false;
    }

    if (
      file.size <= 0 ||
      file.size > MAX_IMAGE_SIZE
    ) {
      setMessage(
        `Ukuran gambar ${label} maksimal 5 MB.`
      );
      setIsSuccess(false);
      return false;
    }

    return true;
  }

  /*
   * ==========================================================
   * HERO UPLOAD
   * ==========================================================
   */

  async function handleHeroImageChange(
    slide: HeroSlideKey,
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    setMessage(null);
    setIsSuccess(null);

    if (!validateImage(file, "Hero")) {
      return;
    }

    try {
      setUploadingHeroSlide(slide);

      const formData = new FormData();

      formData.append("file", file);
      formData.append("slide", slide);

      const response = await fetch(
        "/api/settings/hero-image",
        {
          method: "POST",
          body: formData,
        }
      );

      const result = await response
        .json()
        .catch(() => null);

      console.log(
        "[HERO_IMAGE_UPLOAD_RESPONSE]",
        {
          status: response.status,
          ok: response.ok,
          result,
        }
      );

      if (!response.ok) {
        throw new Error(
          result?.message ||
            "Gagal mengupload gambar Hero."
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

      setHeroSlideImage(
        slide,
        uploadedUrl
      );

      setMessage(
        "Gambar Hero berhasil diupload. Jangan lupa klik Simpan Pengaturan."
      );

      setIsSuccess(true);
    } catch (error) {
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
      setUploadingHeroSlide(null);
    }
  }

  function handleRemoveHeroImage(
    slide: HeroSlideKey
  ) {
    setHeroSlideImage(slide, null);

    setMessage(
      "Gambar Hero akan dihapus setelah Anda menyimpan pengaturan."
    );

    setIsSuccess(true);
  }

  /*
   * ==========================================================
   * LOGIN UPLOAD
   * ==========================================================
   */

  async function handleLoginImageChange(
    slide: LoginSlideKey,
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    setMessage(null);
    setIsSuccess(null);

    if (!validateImage(file, "Login")) {
      return;
    }

    try {
      setUploadingLoginSlide(slide);

      const formData = new FormData();

      formData.append("file", file);
      formData.append("slide", slide);

      const response = await fetch(
        "/api/settings/login-image",
        {
          method: "POST",
          body: formData,
        }
      );

      const result = await response
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

      const uploadedUrl =
        result?.data?.path;

      if (
        typeof uploadedUrl !== "string" ||
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
      setUploadingLoginSlide(null);
    }
  }

  function handleRemoveLoginImage(
    slide: LoginSlideKey
  ) {
    setLoginSlideImage(slide, null);

    setMessage(
      "Gambar Login akan dihapus setelah Anda menyimpan pengaturan."
    );

    setIsSuccess(true);
  }

  /*
   * ==========================================================
   * FLASH SALE UPLOAD
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

    if (!validateImage(file, "Flash Sale")) {
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

      setFlashSaleBannerImage(
        uploadedUrl
      );

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

  /*
   * ==========================================================
   * PROMO UPLOAD
   * ==========================================================
   */

  async function handlePromoImageChange(
    card: "card1" | "card2",
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    setMessage(null);
    setIsSuccess(null);

    if (!validateImage(file, "Promo")) {
      return;
    }

    try {
      setUploadingPromoCard(card);

      const formData = new FormData();

      formData.append("file", file);
      formData.append("card", card);

      const response = await fetch(
        "/api/settings/promo-image",
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
            "Gagal mengupload gambar Promo."
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

      if (card === "card1") {
        setPromoCard1Image(uploadedUrl);
      } else {
        setPromoCard2Image(uploadedUrl);
      }

      setMessage(
        "Gambar Promo berhasil diupload. Jangan lupa klik Simpan Pengaturan."
      );

      setIsSuccess(true);
    } catch (error) {
      console.error(
        "[PROMO_IMAGE_UPLOAD_ERROR]",
        error
      );

      setMessage(
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan saat mengupload gambar Promo."
      );

      setIsSuccess(false);
    } finally {
      setUploadingPromoCard(null);
    }
  }

  function handleRemovePromoImage(
    card: "card1" | "card2"
  ) {
    if (card === "card1") {
      setPromoCard1Image(null);
    } else {
      setPromoCard2Image(null);
    }

    setMessage(
      `Gambar Promo ${
        card === "card1" ? "1" : "2"
      } akan dihapus setelah Anda menyimpan pengaturan.`
    );

    setIsSuccess(true);
  }

  /*
   * ==========================================================
   * SUBMIT
   * ==========================================================
   */

  function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setMessage(null);
    setIsSuccess(null);

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

    if (uploadingPromoCard) {
      setMessage(
        "Tunggu hingga proses upload gambar Promo Pilihan selesai."
      );
      setIsSuccess(false);
      return;
    }

    const input = {
      heroSlide1Image,
      heroSlide1Eyebrow,
      heroSlide1Title,
      heroSlide1Highlight,
      heroSlide1Description,
      heroSlide1Button,

      heroSlide2Image,
      heroSlide2Eyebrow,
      heroSlide2Title,
      heroSlide2Highlight,
      heroSlide2Description,
      heroSlide2Button,

      heroSlide3Image,
      heroSlide3Eyebrow,
      heroSlide3Title,
      heroSlide3Highlight,
      heroSlide3Description,
      heroSlide3Button,

      loginSlide1Image,
      loginSlide2Image,
      loginSlide3Image,
      loginSlide4Image,

      flashSaleBannerImage,
      flashSaleBannerLabel,
      flashSaleBannerTitle,
      flashSaleBannerHighlight,
      flashSaleBannerDescription,

      promoSectionLabel,
      promoSectionTitle,
      promoSectionLinkLabel,
      promoSectionLinkHref,

      promoCard1Image,
      promoCard1Eyebrow,
      promoCard1Title,
      promoCard1Description,
      promoCard1Button,
      promoCard1Href,

      promoCard2Image,
      promoCard2Eyebrow,
      promoCard2Title,
      promoCard2Description,
      promoCard2Button,
      promoCard2Href,
    };

    startTransition(async () => {
      const result =
        await updateImageBannerSettingsAction(
          input
        );

      setMessage(result.message);
      setIsSuccess(result.success);
    });
  }

  /*
   * ==========================================================
   * RENDER HELPERS
   * ==========================================================
   */

  const heroSlides = [
    {
      key: "slide1" as const,
      title: "Hero Slide 1",
      image: heroSlide1Image,
      inputRef: heroSlide1InputRef,
      eyebrow: heroSlide1Eyebrow,
      titleValue: heroSlide1Title,
      highlight: heroSlide1Highlight,
      description: heroSlide1Description,
      button: heroSlide1Button,
      setEyebrow: setHeroSlide1Eyebrow,
      setTitle: setHeroSlide1Title,
      setHighlight: setHeroSlide1Highlight,
      setDescription: setHeroSlide1Description,
      setButton: setHeroSlide1Button,
    },
    {
      key: "slide2" as const,
      title: "Hero Slide 2",
      image: heroSlide2Image,
      inputRef: heroSlide2InputRef,
      eyebrow: heroSlide2Eyebrow,
      titleValue: heroSlide2Title,
      highlight: heroSlide2Highlight,
      description: heroSlide2Description,
      button: heroSlide2Button,
      setEyebrow: setHeroSlide2Eyebrow,
      setTitle: setHeroSlide2Title,
      setHighlight: setHeroSlide2Highlight,
      setDescription: setHeroSlide2Description,
      setButton: setHeroSlide2Button,
    },
    {
      key: "slide3" as const,
      title: "Hero Slide 3",
      image: heroSlide3Image,
      inputRef: heroSlide3InputRef,
      eyebrow: heroSlide3Eyebrow,
      titleValue: heroSlide3Title,
      highlight: heroSlide3Highlight,
      description: heroSlide3Description,
      button: heroSlide3Button,
      setEyebrow: setHeroSlide3Eyebrow,
      setTitle: setHeroSlide3Title,
      setHighlight: setHeroSlide3Highlight,
      setDescription: setHeroSlide3Description,
      setButton: setHeroSlide3Button,
    },
  ];

  const loginSlides = [
    {
      key: "slide1" as const,
      title: "Login Slide 1",
      description:
        "Gambar pertama pada slider login mobile.",
      image: loginSlide1Image,
      inputRef: loginSlide1InputRef,
    },
    {
      key: "slide2" as const,
      title: "Login Slide 2",
      description:
        "Gambar kedua pada slider login mobile.",
      image: loginSlide2Image,
      inputRef: loginSlide2InputRef,
    },
    {
      key: "slide3" as const,
      title: "Login Slide 3",
      description:
        "Gambar ketiga pada slider login mobile.",
      image: loginSlide3Image,
      inputRef: loginSlide3InputRef,
    },
    {
      key: "slide4" as const,
      title: "Login Slide 4",
      description:
        "Gambar keempat pada slider login mobile.",
      image: loginSlide4Image,
      inputRef: loginSlide4InputRef,
    },
  ];

  const promoCards = [
    {
      key: "card1" as const,
      title: "Promo Card 1",
      image: promoCard1Image,
      inputRef: promoCard1InputRef,
      uploading: uploadingPromoCard === "card1",
      eyebrow: promoCard1Eyebrow,
      cardTitle: promoCard1Title,
      description: promoCard1Description,
      button: promoCard1Button,
      href: promoCard1Href,
      setEyebrow: setPromoCard1Eyebrow,
      setTitle: setPromoCard1Title,
      setDescription: setPromoCard1Description,
      setButton: setPromoCard1Button,
      setHref: setPromoCard1Href,
    },
    {
      key: "card2" as const,
      title: "Promo Card 2",
      image: promoCard2Image,
      inputRef: promoCard2InputRef,
      uploading: uploadingPromoCard === "card2",
      eyebrow: promoCard2Eyebrow,
      cardTitle: promoCard2Title,
      description: promoCard2Description,
      button: promoCard2Button,
      href: promoCard2Href,
      setEyebrow: setPromoCard2Eyebrow,
      setTitle: setPromoCard2Title,
      setDescription: setPromoCard2Description,
      setButton: setPromoCard2Button,
      setHref: setPromoCard2Href,
    },
  ];

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      {message && (
        <div
          className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${
            isSuccess
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {isSuccess ? (
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
          ) : (
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          )}

          <p>{message}</p>
        </div>
      )}

      {/* ======================================================
          HERO SLIDER
          ====================================================== */}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-6 flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white">
            <ImagePlus className="h-5 w-5" />
          </div>

          <div>
            <h2 className="text-base font-bold text-slate-900">
              Hero Slider
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Atur tiga slide utama yang tampil pada homepage.
            </p>
          </div>
        </div>

        <div className="grid gap-5 xl:grid-cols-3">
          {heroSlides.map((slide) => {
            const isUploading =
              uploadingHeroSlide === slide.key;

            return (
              <div
                key={slide.key}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50"
              >
                <div className="relative flex aspect-[16/8] items-center justify-center overflow-hidden border-b border-slate-200 bg-white">
                  {slide.image ? (
                    <Image
                      src={slide.image}
                      alt={slide.title}
                      fill
                      sizes="(max-width: 1280px) 100vw, 33vw"
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2 px-4 text-center text-slate-400">
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

                <div className="space-y-4 p-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      {slide.title}
                    </h3>
                  </div>

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

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        slide.inputRef.current?.click()
                      }
                      disabled={
                        isPending ||
                        uploadingHeroSlide !== null
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

                  {[
                    {
                      label: "Eyebrow",
                      value: slide.eyebrow,
                      setValue: slide.setEyebrow,
                      placeholder: "PROMO TERBARU",
                    },
                    {
                      label: "Judul",
                      value: slide.titleValue,
                      setValue: slide.setTitle,
                      placeholder: "Seafood Segar",
                    },
                    {
                      label: "Highlight",
                      value: slide.highlight,
                      setValue: slide.setHighlight,
                      placeholder: "Harga Terbaik",
                    },
                    {
                      label: "Deskripsi",
                      value: slide.description,
                      setValue: slide.setDescription,
                      placeholder:
                        "Deskripsi singkat promo.",
                      textarea: true,
                    },
                    {
                      label: "Tombol",
                      value: slide.button,
                      setValue: slide.setButton,
                      placeholder: "Belanja Sekarang",
                    },
                  ].map((field) => (
                    <div key={field.label}>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        {field.label}
                      </label>

                      {field.textarea ? (
                        <textarea
                          value={field.value}
                          onChange={(event) =>
                            field.setValue(
                              event.target.value
                            )
                          }
                          disabled={isPending}
                          rows={3}
                          className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-50"
                          placeholder={field.placeholder}
                        />
                      ) : (
                        <input
                          type="text"
                          value={field.value}
                          onChange={(event) =>
                            field.setValue(
                              event.target.value
                            )
                          }
                          disabled={isPending}
                          className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-50"
                          placeholder={field.placeholder}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ======================================================
          MOBILE LOGIN SLIDER
          ====================================================== */}

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
          {loginSlides.map((slide) => {
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
                          handleRemoveLoginImage(
                            slide.key
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

      {/* ======================================================
          FLASH SALE
          ====================================================== */}

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
              onClick={() =>
                flashSaleBannerInputRef.current?.click()
              }
              disabled={
                isPending ||
                isUploadingFlashSaleBanner
              }
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
                  {flashSaleBannerImage
                    ? "Ganti Banner"
                    : "Upload Banner"}
                </>
              )}
            </button>

            {flashSaleBannerImage && (
              <button
                type="button"
                onClick={
                  handleRemoveFlashSaleBanner
                }
                disabled={
                  isPending ||
                  isUploadingFlashSaleBanner
                }
                className="inline-flex h-10 items-center justify-center rounded-xl border border-red-200 bg-white px-3 text-red-600 transition hover:bg-red-50 disabled:opacity-60"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>

          <p className="mt-3 text-xs leading-5 text-slate-500">
            Rekomendasi ukuran 1600×700 px. Format PNG,
            WEBP, atau GIF maksimal 5 MB.
          </p>

          <div className="mt-6 grid gap-5 border-t border-slate-200 pt-6">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Label
              </label>
              <input
                type="text"
                value={flashSaleBannerLabel}
                onChange={(event) =>
                  setFlashSaleBannerLabel(
                    event.target.value
                  )
                }
                disabled={isPending}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100 disabled:bg-slate-50"
                placeholder="FLASH SALE"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Judul
              </label>
              <input
                type="text"
                value={flashSaleBannerTitle}
                onChange={(event) =>
                  setFlashSaleBannerTitle(
                    event.target.value
                  )
                }
                disabled={isPending}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100 disabled:bg-slate-50"
                placeholder="Seafood Favorit,"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Highlight
              </label>
              <input
                type="text"
                value={flashSaleBannerHighlight}
                onChange={(event) =>
                  setFlashSaleBannerHighlight(
                    event.target.value
                  )
                }
                disabled={isPending}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100 disabled:bg-slate-50"
                placeholder="Harga Lebih Menarik."
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Deskripsi
              </label>
              <textarea
                value={flashSaleBannerDescription}
                onChange={(event) =>
                  setFlashSaleBannerDescription(
                    event.target.value
                  )
                }
                disabled={isPending}
                rows={3}
                className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100 disabled:bg-slate-50"
                placeholder="Promo terbatas untuk produk pilihan. Dapatkan harga spesial sebelum waktunya berakhir."
              />
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================
          PROMO PILIHAN
          ====================================================== */}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-6 flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white">
            <Sparkles className="h-5 w-5" />
          </div>

          <div>
            <h2 className="text-base font-bold text-slate-900">
              Promo Pilihan
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Atur judul section dan dua kartu promo yang tampil pada homepage.
            </p>
          </div>
        </div>

        <div className="mb-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
          <div className="mb-5">
            <h3 className="text-sm font-bold text-slate-900">
              Pengaturan Section
            </h3>

            <p className="mt-1 text-xs leading-5 text-slate-500">
              Tentukan label, judul, dan tombol pada bagian Promo Pilihan.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {[
              {
                label: "Label Section",
                value: promoSectionLabel,
                setValue: setPromoSectionLabel,
                placeholder: "PROMO PILIHAN",
              },
              {
                label: "Judul Section",
                value: promoSectionTitle,
                setValue: setPromoSectionTitle,
                placeholder: "Belanja Lebih Hemat",
              },
              {
                label: "Teks Link Section",
                value: promoSectionLinkLabel,
                setValue: setPromoSectionLinkLabel,
                placeholder: "Lihat Produk",
              },
              {
                label: "URL Link Section",
                value: promoSectionLinkHref,
                setValue: setPromoSectionLinkHref,
                placeholder: "/products",
              },
            ].map((field) => (
              <div key={field.label}>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  {field.label}
                </label>

                <input
                  type="text"
                  value={field.value}
                  onChange={(event) =>
                    field.setValue(
                      event.target.value
                    )
                  }
                  disabled={isPending}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100 disabled:bg-slate-50"
                  placeholder={field.placeholder}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-5 xl:grid-cols-2">
          {promoCards.map((card) => (
            <div
              key={card.key}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50"
            >
              <div className="border-b border-slate-200 bg-white px-4 py-4 sm:px-5">
                <h3 className="text-sm font-bold text-slate-900">
                  {card.title}
                </h3>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Atur visual dan konten kartu promo.
                </p>
              </div>

              <div className="p-4 sm:p-5">
                <div className="relative flex aspect-[16/8] items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white">
                  {card.image ? (
                    <Image
                      src={card.image}
                      alt={card.title}
                      fill
                      sizes="(max-width: 1280px) 100vw, 50vw"
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2 px-4 text-center text-slate-400">
                      <ImagePlus className="h-10 w-10" />
                      <span className="text-xs font-medium">
                        Belum ada gambar promo
                      </span>
                    </div>
                  )}

                  {card.uploading && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-white/80 backdrop-blur-sm">
                      <Loader2 className="h-7 w-7 animate-spin text-slate-900" />
                      <span className="text-xs font-semibold text-slate-700">
                        Mengupload gambar...
                      </span>
                    </div>
                  )}
                </div>

                <input
                  ref={card.inputRef}
                  type="file"
                  accept=".png,.webp,.gif,image/png,image/webp,image/gif"
                  onChange={(event) =>
                    handlePromoImageChange(
                      card.key,
                      event
                    )
                  }
                  className="hidden"
                />

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      card.inputRef.current?.click()
                    }
                    disabled={
                      isPending ||
                      uploadingPromoCard !== null
                    }
                    className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {card.uploading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Mengupload...
                      </>
                    ) : (
                      <>
                        <ImagePlus className="h-4 w-4" />
                        {card.image
                          ? "Ganti Gambar"
                          : "Upload Gambar"}
                      </>
                    )}
                  </button>

                  {card.image && (
                    <button
                      type="button"
                      onClick={() =>
                        handleRemovePromoImage(
                          card.key
                        )
                      }
                      disabled={
                        isPending ||
                        uploadingPromoCard !== null
                      }
                      className="inline-flex h-10 items-center justify-center rounded-xl border border-red-200 bg-white px-3 text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                      aria-label={`Hapus ${card.title}`}
                      title="Hapus gambar"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <p className="mt-3 text-xs leading-5 text-slate-500">
                  PNG, WEBP, atau GIF maksimal 5 MB.
                  Gambar digunakan sebagai visual pada kartu promo.
                </p>

                <div className="mt-6 grid gap-5 border-t border-slate-200 pt-6">
                  {[
                    {
                      label: "Eyebrow",
                      value: card.eyebrow,
                      setValue: card.setEyebrow,
                      placeholder: "PROMO SPESIAL",
                    },
                    {
                      label: "Judul",
                      value: card.cardTitle,
                      setValue: card.setTitle,
                      placeholder: "Promo Seafood",
                    },
                    {
                      label: "Deskripsi",
                      value: card.description,
                      setValue: card.setDescription,
                      placeholder:
                        "Nikmati promo pilihan hari ini.",
                      textarea: true,
                    },
                    {
                      label: "Tombol",
                      value: card.button,
                      setValue: card.setButton,
                      placeholder: "Belanja Sekarang",
                    },
                    {
                      label: "URL",
                      value: card.href,
                      setValue: card.setHref,
                      placeholder: "/products",
                    },
                  ].map((field) => (
                    <div key={field.label}>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        {field.label}
                      </label>

                      {field.textarea ? (
                        <textarea
                          value={field.value}
                          onChange={(event) =>
                            field.setValue(
                              event.target.value
                            )
                          }
                          disabled={isPending}
                          rows={3}
                          className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100 disabled:bg-slate-50"
                          placeholder={field.placeholder}
                        />
                      ) : (
                        <input
                          type="text"
                          value={field.value}
                          onChange={(event) =>
                            field.setValue(
                              event.target.value
                            )
                          }
                          disabled={isPending}
                          className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100 disabled:bg-slate-50"
                          placeholder={field.placeholder}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ======================================================
          SAVE
          ====================================================== */}

      <div className="sticky bottom-4 z-10 flex justify-end">
        <button
          type="submit"
          disabled={
            isPending ||
            uploadingHeroSlide !== null ||
            uploadingLoginSlide !== null ||
            isUploadingFlashSaleBanner ||
            uploadingPromoCard !== null
          }
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white shadow-lg transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Menyimpan...
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