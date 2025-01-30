import { ref, watch } from "vue"; // 从 Vue 中引入 ref 和 watch
import { useRoute } from "vue-router"; // 从 vue-router 中引入 useRoute

// 定义自定义 Hook，用于管理 Tabbar 的状态
export function useTabbar() {
  // 定义一个响应式变量 active，用于存储当前激活的 Tabbar 索引
  const active = ref(0);

  // 获取当前的路由信息
  const route = useRoute();

  // 定义路由路径和 Tabbar 索引的映射关系
  const routeMap = {
    "/": 0, // 常规账单页面
    "/bill-add": 0, //常规账单添加页面
    "/bill-detail": 0, //常规账单编辑页面
    "/renew_bill": 1, // 循环账单页面
    "/edit-renew-category": 1, //循环账单分类编辑页面
    "/add-renew-bill": 1, //循环账单添加页面
    "/edit-renew-bill": 1, //循环账单编辑页面
    "/me": 2, // 个人信息页面
  };

  // 监听路由路径的变化，并根据新的路径更新 active 的值
  watch(
    () => route.path, // 监听 route.path 的变化
    (newPath) => {
      // 检查新路径是否在 routeMap 中
      if (newPath in routeMap) {
        // 如果路径存在于 routeMap，则更新 active 为对应的索引
        active.value = routeMap[newPath as keyof typeof routeMap];
      } else {
        // 如果路径不存在于 routeMap，默认设置 active 为 0
        active.value = 0;
      }
    },
    { immediate: true } // 设置 immediate 为 true，确保在初始化时立即执行一次回调
  );

  // 返回 active 变量，供组件使用
  return { active };
}
