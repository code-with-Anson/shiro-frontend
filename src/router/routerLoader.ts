// routerLoader.js
// 这里是路由判断器
// 根据设备不同返回不同的路由
// 通过动态导入的方式实现路由的按需加载，适配不同的设备
import { useDeviceStore } from "@/pinia/deviceStore";

export const getRouterByDevice = async () => {
  const deviceStore = useDeviceStore(); // 在函数内部获取 Store,防止运行时没有 Store 实例，无法初始化路由
  const isMobile = deviceStore.isMobile; // 动态获取 isMobile 状态
  if (isMobile) {
    return (await import("./mobile")).default;
  } else {
    return (await import("./desktop")).default;
  }
};
