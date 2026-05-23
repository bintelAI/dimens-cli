/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DIMENS_BASE_URL?: string;
  readonly VITE_DIMENS_TOKEN_ENDPOINT?: string;
  readonly VITE_DEV_TEAM_ID?: string;
  readonly VITE_DEV_PROJECT_ID?: string;
  readonly VITE_DEV_SHEET_ID?: string;
  readonly VITE_DEV_INSTANCE_ID?: string;
  readonly VITE_DEV_MODULE_CODE?: string;
  readonly VITE_DEV_INITIAL_ROUTE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
