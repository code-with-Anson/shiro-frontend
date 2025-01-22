<template>
  <div>
    <!-- 顶部导航 -->
    <van-nav-bar title="汐落" right-text="🔍" />

    <!-- Sticky 固定顶部 -->
    <van-sticky>
      <van-cell
        title="1月支出"
        value="￥883.10"
        label="本月收入 0.00"
        value-class="highlight"
      />
    </van-sticky>

    <!-- 记录列表 -->
    <van-cell-group>
      <van-cell
        v-for="item in bills"
        :key="item.date + item.category"
        :title="item.category"
        :label="item.date"
        :value="`支出: ￥${item.amount}`"
        is-link
      />
    </van-cell-group>
    <van-button id="add-button" icon="plus" color="#39C5BB" />
  </div>
</template>

<script setup lang="ts">
import { getAllCategories } from "@/api/category";
import { ref } from "vue";
import { onMounted } from "vue";
import { showFailToast, showSuccessToast } from "vant";

const bills = ref([
  { category: "餐饮", amount: 100, date: "2021-01-01", icon: "smile-o" },
  { category: "交通", amount: 200, date: "2021-01-02", icon: "smile-o" },
  { category: "购物", amount: 300, date: "2021-01-03", icon: "smile-o" },
  // 其他数据省略
]);

// 获取用户常规账单分类
const getUserCategories = async () => {
  try {
    await getAllCategories();

    // 从localStorage读取处理后的分类数据
    const storedCategories = localStorage.getItem("categories");
    if (storedCategories) {
      const categories = JSON.parse(storedCategories);
      console.log("存储的分类:", categories);
    }
  } catch (error: any) {
    console.error("获取分类失败:", error);
    showFailToast({
      message: "获取分类失败" + "\n" + error.message,
      position: "middle",
    });
  }
};
onMounted(() => {
  // 这里是个获取用户信息的示例
  const userStr = localStorage.getItem("user");
  if (userStr) {
    const user = ref(JSON.parse(userStr));
    console.log("当前的用户昵称是" + user.value.name);
  }
  getUserCategories();
});
</script>

<style scoped>
::v-deep(.van-cell__value.highlight) {
  color: #39c5bb;
  font-weight: bold;
}
.van-cell {
  padding-left: 1.5rem;
  padding-right: 1rem;
}
#add-button {
  border-radius: 50%;
  font-size: 1.5rem;
  width: 4rem;
  height: 4rem;
  position: fixed;
  bottom: 8rem;
  right: 1rem;
  z-index: 100;
}
</style>
