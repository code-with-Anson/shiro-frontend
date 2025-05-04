import { ref } from "vue";
import { useRoute } from "vue-router";

export function useTabbar() {
  const route = useRoute();

  // 创建响应式的active状态
  const active = ref(getActiveTabFromPath(route.path));

  // 根据路径获取对应的标签名
  function getActiveTabFromPath(path: string) {
    if (path.startsWith("/bill-management")) return "bill-management";
    if (path.startsWith("/renew-bill")) return "renew-bill";
    if (path.startsWith("/ai-chat-mobile")) return "ai-chat-mobile";
    if (path.startsWith("/me")) return "me";
    return "bill-management"; // 默认标签
  }

  return {
    active,
  };
}
