import { ref } from "vue";
import { useRoute } from "vue-router";

// 定义自定义 Hook，用于管理 Tabbar 的状态
export function useTabbar() {
  // 定义一个响应式变量 active，用于存储当前激活的 Tabbar 索引
  const active = ref(0);

  // 获取当前的路由信息
  const route = useRoute();

  // 定义路由路径和 Tabbar 索引的映射关系
  const routeMap = {
    "/": 0, // 账单统计页面（现在是首页）
    "/bill-management": 0, // 常规账单页面
    "/bill-add": 0, // 常规账单添加页面
    "/bill-detail": 0, // 常规账单编辑页面
    "/renew-bill": 1, // 循环账单页面
    "/edit-renew-category": 1, // 循环账单分类编辑页面
    "/add-renew-bill": 1, // 循环账单添加页面
    "/edit-renew-bill": 1, // 循环账单编辑页面
    "/me": 2, // 用户信息页面
  };

  // 根据当前的路由路径，设置激活的 Tabbar 索引
  if (route.path in routeMap) {
    active.value = routeMap[route.path];
  }

  return {
    active,
  };
}
