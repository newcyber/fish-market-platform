"use client";

import { useEffect } from "react";

const ONE_SIGNAL_APP_ID =
  process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;

const ONE_SIGNAL_SCRIPT =
  "https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js";

const ONE_SIGNAL_SW_PATH =
  "/push/onesignal/OneSignalSDKWorker.js";

const ONE_SIGNAL_SW_SCOPE =
  "/push/onesignal/";

type OneSignalInstance = {
  init: (
    options: Record<string, unknown>
  ) => Promise<void>;
};

type OneSignalDeferred = (
  oneSignal: OneSignalInstance
) => void | Promise<void>;

declare global {
  interface Window {
    OneSignalDeferred?: OneSignalDeferred[];
  }
}

export default function OneSignalProvider() {
  useEffect(() => {
    if (
      !ONE_SIGNAL_APP_ID ||
      typeof window === "undefined"
    ) {
      return;
    }

    if (
      !("Notification" in window) ||
      !("serviceWorker" in navigator)
    ) {
      return;
    }

    const initializeOneSignal = async () => {
      try {
        if (
          !document.querySelector(
            `script[src="${ONE_SIGNAL_SCRIPT}"]`
          )
        ) {
          const script =
            document.createElement("script");

          script.src = ONE_SIGNAL_SCRIPT;
          script.defer = true;

          const scriptLoaded = new Promise<void>(
            (resolve, reject) => {
              script.addEventListener(
                "load",
                () => resolve(),
                { once: true }
              );

              script.addEventListener(
                "error",
                () =>
                  reject(
                    new Error(
                      "Gagal memuat OneSignal Web SDK."
                    )
                  ),
                { once: true }
              );
            }
          );

          document.head.appendChild(script);

          await scriptLoaded;
        }

        window.OneSignalDeferred =
          window.OneSignalDeferred ?? [];

        window.OneSignalDeferred.push(
          async (OneSignal) => {
            await OneSignal.init({
              appId: ONE_SIGNAL_APP_ID,
              serviceWorkerPath:
                ONE_SIGNAL_SW_PATH,
              serviceWorkerParam: {
                scope: ONE_SIGNAL_SW_SCOPE,
              },
            });
          }
        );
      } catch (error) {
        console.error(
          "[ONESIGNAL_INIT_ERROR]",
          error
        );
      }
    };

    void initializeOneSignal();
  }, []);

  return null;
}