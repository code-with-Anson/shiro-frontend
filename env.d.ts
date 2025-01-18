/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string; // 类型声明，不需要赋值
}

interface ImportMeta {
  readonly env: ImportMetaEnv; // 将其挂载到 ImportMeta
}

declare module "*.vue" {
  import { DefineComponent } from "vue";
  const component: DefineComponent<{}, {}, any>;
  export default component;
}
