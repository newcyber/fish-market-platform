export class AiSeoProviderNotConfiguredError
  extends Error {
  constructor() {
    super(
      "AI SEO provider belum dikonfigurasi.",
    );

    this.name =
      "AiSeoProviderNotConfiguredError";
  }
}