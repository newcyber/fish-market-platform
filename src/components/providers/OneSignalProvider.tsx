"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";

const ONE_SIGNAL_APP_ID = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;

const ONE_SIGNAL_SCRIPT =
  "https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js";

const ONE_SIGNAL_SW_PATH = "/push/onesignal/OneSignalSDKWorker.js";

const ONE_SIGNAL_SW_SCOPE = "/push/onesignal/";

const MEDIAN_BRIDGE_WAIT_MS = 3000;
const MEDIAN_BRIDGE_POLL_MS = 100;

type OneSignalWebInstance = {
  init: (options: Record<string, unknown>) => Promise<void>;
  login?: (externalId: string) => Promise<unknown>;
  logout?: () => Promise<unknown>;
};

type OneSignalDeferred = (
  oneSignal: OneSignalWebInstance,
) => void | Promise<void>;

type MedianCallbackResult = {
  success?: boolean;
};

type MedianOneSignalBridge = {
  login?: (externalId: string) => Promise<MedianCallbackResult | void>;
  logout?: () => Promise<MedianCallbackResult | void>;
};

type MedianBridge = {
  onesignal?: MedianOneSignalBridge;
};

declare global {
  interface Window {
    OneSignalDeferred?: OneSignalDeferred[];
    median?: MedianBridge;
  }
}

function waitForMedianOneSignalBridge(): Promise<MedianOneSignalBridge | null> {
  return new Promise((resolve) => {
    const startedAt = Date.now();

    const check = () => {
      const bridge = window.median?.onesignal;

      if (bridge?.login || bridge?.logout) {
        resolve(bridge);
        return;
      }

      if (Date.now() - startedAt >= MEDIAN_BRIDGE_WAIT_MS) {
        resolve(null);
        return;
      }

      window.setTimeout(check, MEDIAN_BRIDGE_POLL_MS);
    };

    check();
  });
}

export default function OneSignalProvider() {
  const { data: session, status } = useSession();

  const webOneSignalRef = useRef<OneSignalWebInstance | null>(null);

  const webInitializedRef = useRef(false);

  const nativeIdentityRef = useRef<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || status === "loading") {
      return;
    }

    const userId = status === "authenticated" ? session?.user?.id?.trim() : "";

    let cancelled = false;

    const initialize = async () => {
      /**
       * ------------------------------------------------------
       * MEDIAN NATIVE APP
       * ------------------------------------------------------
       *
       * The native OneSignal plugin owns FCM/APNs.
       * The website must only associate the authenticated
       * Pisjo user with OneSignal through the Median bridge.
       *
       * We deliberately wait briefly for the injected bridge
       * before deciding this is a normal browser session.
       */
      const medianOneSignal = window.median
        ? await waitForMedianOneSignalBridge()
        : null;

      if (cancelled) {
        return;
      }

      if (medianOneSignal) {
        try {
          if (status === "authenticated" && userId && medianOneSignal.login) {
            if (nativeIdentityRef.current === userId) {
              return;
            }

            const result = await medianOneSignal.login(userId);

            if (result && result.success === false) {
              console.error("[ONESIGNAL_NATIVE_LOGIN_FAILED]", result);
              return;
            }

            nativeIdentityRef.current = userId;

            console.info("[ONESIGNAL_NATIVE_LOGIN_SUCCESS]");
            return;
          }

          if (
            status === "unauthenticated" &&
            nativeIdentityRef.current !== null &&
            medianOneSignal.logout
          ) {
            await medianOneSignal.logout();
            nativeIdentityRef.current = null;
            console.info("[ONESIGNAL_NATIVE_LOGOUT_SUCCESS]");
          }
        } catch (error) {
          console.error("[ONESIGNAL_NATIVE_IDENTITY_ERROR]", error);
        }

        return;
      }

      /**
       * ------------------------------------------------------
       * REGULAR WEB BROWSER
       * ------------------------------------------------------
       */
      if (
        !ONE_SIGNAL_APP_ID ||
        !("Notification" in window) ||
        !("serviceWorker" in navigator)
      ) {
        return;
      }

      try {
        if (!document.querySelector(`script[src="${ONE_SIGNAL_SCRIPT}"]`)) {
          const script = document.createElement("script");

          script.src = ONE_SIGNAL_SCRIPT;
          script.defer = true;

          const scriptLoaded = new Promise<void>((resolve, reject) => {
            script.addEventListener("load", () => resolve(), { once: true });

            script.addEventListener(
              "error",
              () => reject(new Error("Gagal memuat OneSignal Web SDK.")),
              { once: true },
            );
          });

          document.head.appendChild(script);
          await scriptLoaded;
        }

        if (cancelled) {
          return;
        }

        window.OneSignalDeferred = window.OneSignalDeferred ?? [];

        window.OneSignalDeferred.push(async (OneSignal) => {
          try {
            if (!webInitializedRef.current) {
              await OneSignal.init({
                appId: ONE_SIGNAL_APP_ID,
                serviceWorkerPath: ONE_SIGNAL_SW_PATH,
                serviceWorkerParam: {
                  scope: ONE_SIGNAL_SW_SCOPE,
                },
              });

              webInitializedRef.current = true;
            }

            webOneSignalRef.current = OneSignal;

            if (status === "authenticated" && userId && OneSignal.login) {
              await OneSignal.login(userId);
            } else if (status === "unauthenticated" && OneSignal.logout) {
              await OneSignal.logout();
            }
          } catch (error) {
            console.error("[ONESIGNAL_WEB_IDENTITY_ERROR]", error);
          }
        });

        if (webInitializedRef.current && webOneSignalRef.current) {
          if (
            status === "authenticated" &&
            userId &&
            webOneSignalRef.current.login
          ) {
            await webOneSignalRef.current.login(userId);
          } else if (
            status === "unauthenticated" &&
            webOneSignalRef.current.logout
          ) {
            await webOneSignalRef.current.logout();
          }
        }
      } catch (error) {
        console.error("[ONESIGNAL_INIT_ERROR]", error);
      }
    };

    void initialize();

    return () => {
      cancelled = true;
    };
  }, [session?.user?.id, status]);

  return null;
}
