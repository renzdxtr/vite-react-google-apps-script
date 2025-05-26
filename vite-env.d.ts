/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_GOOGLE_SHEETS_API_KEY: string;
    readonly VITE_GOOGLE_SHEETS_ID: string;
    readonly VITE_FORM_RESPONSES_SHEET: string;
    // add more VITE_ variables as needed
  }
  
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
  