<template>
  <div class="m_bills">
    <!-- 顶部导航 -->
    <van-nav-bar title="汐落" right-text="🔍" />

    <!-- Sticky 固定顶部 -->
    <van-sticky>
      <van-cell
        :title="`${currentMonth}月支出`"
        :value="`￥${MonthCost.toFixed(2)}`"
        :label="`本月收入 ￥${MonthEarn.toFixed(2)}`"
        title-class="month-title"
        value-class="month-cost"
        label-class="month-earn"
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
        :value-class="item.type === '支出' ? 'bill-cost' : 'bill-earn'"
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

// 定义月收入总金额
const MonthEarn = ref(0);
// 定义月支出总金额
const MonthCost = ref(0);

// 定义账单结构
interface Bill {
  id: number;
  amount: number;
  type: string;
  categoryId: number;
  categoryName?: string;
  detail: string;
  date: string;
}

// 定义账单数据
const bills = ref<Bill[]>([
  // 下面是一条示例数据
  // {
  //   id: 1881413490334248961,
  //   amount: 52.52,
  //   type: "支出",
  //   categoryId: 1881412697430437889,
  //   categoryName: "汐落",
  //   detail: "爱丽丝也很可爱",
  //   date: "2025-01-12",
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

      bills.value = billsData
        .map((bill: any) => ({
          ...bill,
          categoryName:
            categoriesData.find((cat: any) => cat.id === bill.categoryId)
              ?.name || "未知分类",
        }))
        .sort(
          (a: any, b: any) =>
            new Date(b.date).getTime() - new Date(a.date).getTime()
        );

      //  计算月度支出和月度收入
      MonthCost.value = bills.value
        .filter((bill) => bill.type === "支出")
        .reduce((sum, bill) => sum + bill.amount, 0);

      MonthEarn.value = bills.value
        .filter((bill) => bill.type === "收入")
        .reduce((sum, bill) => sum + bill.amount, 0);
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

::v-deep(.van-cell__value.month-cost) {
  color: #39c5bb;
  font-weight: bold;
}
:deep(.van-cell__title.month-title) {
  font-weight: bold;
  color: #52a1e5;
}

:deep(.van-cell__label.month-earn) {
  font-weight: bold;
  color: #ff7875;
}

::v-deep(.van-cell__value.bill-cost) {
  color: #39c5bb;
}

::v-deep(.van-cell__value.bill-earn) {
  color: #ff7875;
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
