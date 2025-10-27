/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_OAUTH_CLIENT_NAME: string;
  readonly VITE_OAUTH_REDIRECT_URI: string;
  readonly VITE_OAUTH_ORIGIN: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}