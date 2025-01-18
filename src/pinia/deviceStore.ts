import { defineStore } from "pinia";
import { ref } from "vue";

export const useDeviceStore = defineStore("device", () => {
  // TODO 为了开发方便，这里的窗口边界宽度设置为了420
  // 实际上线需要改成小于768
  const isMobile = ref(window.innerWidth < 420);

  return { isMobile };
});
