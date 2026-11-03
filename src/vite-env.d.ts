/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_SOCKET_URL?: string;
  readonly VITE_BACKEND_TARGET?: string;
  readonly VITE_SITE_URL?: string;
  readonly VITE_AUTH_TOKEN_KEY?: string;
  readonly VITE_GOOGLE_MAPS_API_KEY?: string;
  readonly VITE_RAZORPAY_KEY_ID?: string;
  readonly VITE_RAZORPAY_NAME?: string;
  readonly VITE_BRAND_LOGO_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
