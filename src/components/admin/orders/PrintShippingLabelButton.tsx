
"use client";

import { Printer } from "lucide-react";

export default function PrintShippingLabelButton() {
  function handlePrint() {
    const label = document.getElementById("shipping-label");

    if (!label) {
      console.error("[PRINT_SHIPPING_LABEL] Template resi tidak ditemukan.");
      return;
    }

    const printWindow = window.open(
      "",
      "_blank",
      "width=900,height=1200",
    );

    if (!printWindow) {
      window.alert(
        "Jendela cetak diblokir browser. Izinkan pop-up untuk halaman ini.",
      );
      return;
    }

    const styles = Array.from(
      document.querySelectorAll(
        'link[rel="stylesheet"], style',
      ),
    )
      .map((element) => element.outerHTML)
      .join("\n");

    const clonedLabel = label.cloneNode(true) as HTMLElement;

    clonedLabel.removeAttribute("style");
    clonedLabel.classList.remove(
      "mx-auto",
      "max-w-4xl",
      "max-w-5xl",
    );

    printWindow.document.open();

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="id">
        <head>
          <meta charset="UTF-8" />
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1.0"
          />

          <title>Cetak Resi Pisjo Market</title>

          ${styles}

          <style>
            @page {
              size: A4 portrait;
              margin: 4mm;
            }

            * {
              box-sizing: border-box;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }

            html,
            body {
              width: 100%;
              min-height: 100%;
              margin: 0 !important;
              padding: 0 !important;
              background: #ffffff !important;
            }

            body {
              overflow: visible !important;
            }

            #shipping-label {
              display: block !important;
              width: 190mm !important;
              max-width: 190mm !important;
              min-height: 0 !important;
              margin: 0 auto !important;
              padding: 4mm !important;
              background: #ffffff !important;
              color: #17202b !important;
              font-size: 10px !important;
              line-height: 1.25 !important;
              overflow: visible !important;
              transform: none !important;
              zoom: 0.78;
              transform-origin: top left;
            }

            #shipping-label header {
              padding-top: 3mm !important;
              padding-bottom: 3mm !important;
            }

            #shipping-label section {
              break-inside: avoid !important;
              page-break-inside: avoid !important;
            }

            #shipping-label footer {
              break-before: avoid !important;
              break-inside: avoid !important;
              page-break-before: avoid !important;
              page-break-inside: avoid !important;
            }

            #shipping-label img {
              max-width: 100%;
              break-inside: avoid;
            }

            #shipping-label .p-8 {
              padding: 4mm !important;
            }

            #shipping-label .p-7,
            #shipping-label .px-7 {
              padding-left: 4mm !important;
              padding-right: 4mm !important;
            }

            #shipping-label .px-6 {
              padding-left: 4mm !important;
              padding-right: 4mm !important;
            }

            #shipping-label .py-6 {
              padding-top: 3mm !important;
              padding-bottom: 3mm !important;
            }

            #shipping-label .py-5 {
              padding-top: 2.5mm !important;
              padding-bottom: 2.5mm !important;
            }

            #shipping-label .py-4 {
              padding-top: 2mm !important;
              padding-bottom: 2mm !important;
            }

            #shipping-label .mt-5 {
              margin-top: 3mm !important;
            }

            #shipping-label .mt-4 {
              margin-top: 2mm !important;
            }

            #shipping-label .mt-3 {
              margin-top: 1.5mm !important;
            }

            #shipping-label .mt-2 {
              margin-top: 1mm !important;
            }

            #shipping-label .text-5xl {
              font-size: 26px !important;
              line-height: 1 !important;
            }

            #shipping-label .text-3xl {
              font-size: 20px !important;
              line-height: 1.05 !important;
            }

            #shipping-label .text-2xl {
              font-size: 16px !important;
              line-height: 1.15 !important;
            }

            #shipping-label .text-xl {
              font-size: 14px !important;
              line-height: 1.15 !important;
            }

            #shipping-label .text-lg {
              font-size: 12px !important;
              line-height: 1.2 !important;
            }

            #shipping-label .text-base {
              font-size: 10px !important;
              line-height: 1.2 !important;
            }

            #shipping-label .text-sm {
              font-size: 8.5px !important;
              line-height: 1.25 !important;
            }

            #shipping-label .text-xs {
              font-size: 7.5px !important;
              line-height: 1.2 !important;
            }

            #shipping-label .h-\\[104px\\],
            #shipping-label .w-\\[104px\\] {
              width: 60px !important;
              height: 60px !important;
            }

            #shipping-label .h-\\[132px\\],
            #shipping-label .w-\\[132px\\],
            #shipping-label .h-\\[145px\\],
            #shipping-label .w-\\[145px\\] {
              width: 82px !important;
              height: 82px !important;
            }

            @media print {
              html,
              body {
                width: 100%;
                height: auto;
                overflow: visible !important;
              }
            }
          </style>
        </head>

        <body>
          ${clonedLabel.outerHTML}

          <script>
            (() => {
              const images = Array.from(
                document.images,
              );

              const waitForImages = Promise.all(
                images.map((image) => {
                  if (image.complete) {
                    return Promise.resolve();
                  }

                  return new Promise((resolve) => {
                    image.addEventListener("load", resolve, {
                      once: true,
                    });

                    image.addEventListener("error", resolve, {
                      once: true,
                    });
                  });
                }),
              );

              waitForImages.then(() => {
                setTimeout(() => {
                  window.focus();
                  window.print();
                }, 400);
              });
            })();
          </script>
        </body>
      </html>
    `);

    printWindow.document.close();
  }

  return (
    <button
      type="button"
      onClick={handlePrint}
      className="
        inline-flex
        items-center
        gap-2
        rounded-lg
        bg-slate-900
        px-5
        py-2.5
        text-sm
        font-semibold
        text-white
        transition
        hover:bg-slate-800
      "
    >
      <Printer className="h-4 w-4" />
      Cetak Resi
    </button>
  );
}
