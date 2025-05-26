/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_GOOGLE_SHEETS_API_KEY: string;
    readonly VITE_GOOGLE_SHEETS_ID: string;
    readonly VITE_FORM_RESPONSES_SHEET: string;
    readonly VITE_INVENTORY_LOGS_SHEET: string;
    readonly VITE_SERVICE_ACCOUNT_EMAIL: string;
    readonly VITE_PRIVATE_KEY: string;
    readonly VITE_APPS_SCRIPT_URL: string;
    // add more VITE_ variables as needed
  }
  
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
  