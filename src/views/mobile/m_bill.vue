<template>
  <div class="m_bills">
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
        :key="item.id"
        :title="item.categoryName"
        :label="item.date"
        :value="`${item.type} :￥${item.amount}`"
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
import { getMonthBills } from "@/api/bill";

// 定义请求传参-年月
const currentYear = ref(new Date().getFullYear());
const currentMonth = ref(new Date().getMonth() + 1); // +1 因为 getMonth() 返回 0-11

// 定义账单数据
const bills = ref([
  // 下面是一条示例数据
  // {
  //   id: 1881413490334248961,
  //   amount: 52.52,
  //   type: "支出",
  //   categoryId: 1881412697430437889,
  //   categoryName: "汐落",
  //   detail: "爱丽丝也很可爱",
  //   date: "2025-01-12",
  //   isDeleted: "正常",
  // },
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
// 按年月获取用户常规账单
const getUserMonthBills = async () => {
  try {
    //  1.发送请求按照年月获取账单
    await getMonthBills(currentMonth.value, currentYear.value);

    //  2.从localStorage读取处理后的分类数据
    const storedBills = localStorage.getItem("bills");
    const storedCategories = localStorage.getItem("categories");
    if (storedBills && storedCategories) {
      const billsData = JSON.parse(storedBills);
      const categoriesData = JSON.parse(storedCategories);

      bills.value = billsData.map((bill: any) => ({
        ...bill,
        categoryName:
          categoriesData.find((cat: any) => cat.id === bill.categoryId)?.name ||
          "未知分类",
      }));
      console.log("处理后的账单:", bills.value);
    }
  } catch (error: any) {
    console.error("获取账单失败:", error);
    showFailToast({
      message: "获取账单失败" + "\n" + error.message,
      position: "middle",
    });
  }
};

onMounted(async () => {
  console.log(currentMonth.value, currentYear.value);
  try {
    await getUserCategories();
    await getUserMonthBills();
  } catch (error) {
    console.error("初始化数据失败：", error);
  }
});
</script>

<style scoped>
.m_bills {
  margin-bottom: 5rem;
}

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
