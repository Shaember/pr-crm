/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// moment locale modules
declare module 'moment/locale/ru' {
  const content: void;
  export default content;
}
