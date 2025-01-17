// routerLoader.js
// 这里是路由判断器
// 根据设备不同返回不同的路由
// 通过动态导入的方式实现路由的按需加载，适配不同的设备
export const getRouterByDevice = async () => {
  if (window.innerWidth < 768) {
    return (await import("./mobile")).default;
  } else {
    return (await import("./desktop")).default;
  }
};
