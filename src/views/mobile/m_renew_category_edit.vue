<template>
  <div>
    <!-- 顶部导航 -->
    <van-nav-bar
      title="编辑循环账单分类"
      left-text="返回"
      left-arrow
      @click-left="onClickLeft"
    />
    <div class="cell-group-renew-categories">
      <!-- 循环账单分类列表 -->
      <van-cell-group>
        <template v-for="item in RenewCategories" :key="item.id">
          <!-- 账单项目 -->
          <van-cell :title="item.name" title-class="renew-category-name" />
        </template>
      </van-cell-group>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { getAllRenewCategories } from "@/api/renew_category";
import { ElMessage } from "element-plus";
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";

// 定义循环账单分类结构
interface RenewCategory {
  id: string;
  name: string;
}

const router = useRouter();
// 这里定义使用到的循环账单分类的数据结构
const RenewCategories = ref<RenewCategory[]>([]);

// 获取用户循环账单分类
const getUserRenewCategories = async () => {
  try {
    await getAllRenewCategories();
    const storedRenewCategories = localStorage.getItem("RenewCategories");
    if (storedRenewCategories) {
      RenewCategories.value = JSON.parse(storedRenewCategories);
      console.log("存储的循环账单分类:", RenewCategories.value);
    }
  } catch (error: any) {
    console.error("获取分类失败:", error);
    ElMessage({
      message: "获取分类失败" + "\n" + error.message,
      type: "error",
      plain: true,
    });
  }
};

// 返回上一页
const onClickLeft = () => {
  router.back();
};
onMounted(async () => {
  getUserRenewCategories();
});
</script>

<style>
.renew-category-name {
  font-weight: bold;
  color: #52a1e5;
}

.cell-group-renew-categories {
  margin-left: 1rem;
  margin-right: 1rem;
}
</style>
