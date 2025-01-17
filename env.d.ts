/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string = "http://localhost:3952";
}

declare module "*.vue" {
  import { DefineComponent } from "vue";
  const component: DefineComponent<{}, {}, any>;
  export default component;
}
