<template>
  <!-- 移除 van-sticky，改用 CSS 固定定位 -->
  <div class="fixed-header-container">
    <!-- 导航栏 -->
    <van-nav-bar title="我的账单">
      <template #right>
        <van-icon name="chart-trending-o" size="18" @click="goToStatistics" />
      </template>
    </van-nav-bar>

    <!-- 优化月份选择栏布局 -->
    <div class="compact-month-selector">
      <div class="month-selector-left" @click="changeMonthEditStatus">
        <span class="month-title">{{ currentYear }}年{{ currentMonth }}月</span>
      </div>
      <div class="month-stats">
        <span class="month-cost">支出: ￥{{ MonthCost.toFixed(2) }}</span>
        <span class="month-earn">收入: ￥{{ MonthEarn.toFixed(2) }}</span>
      </div>
    </div>
  </div>

  <div class="m_bills">
    <!-- 弹出层形式的日期选择器 -->
    <van-popup v-model:show="showMonthEdit" position="bottom" round>
      <van-date-picker
        v-model="currentDate"
        title="选择年月"
        :min-date="minDate"
        :max-date="maxDate"
        :columns-type="columnsType"
        @confirm="getMonthBill"
        @cancel="hideMonthEdit"
      />
    </van-popup>

    <!-- 记录列表 -->
    <van-cell-group>
      <template v-for="(item, index) in bills" :key="item.id">
        <!-- 日期汇总信息 -->
        <van-cell v-if="shouldShowDateHeader(index)" class="date-header">
          <template #title>
            <div class="date-summary">
              <span class="date-text">{{ formatDate(item.date) }}</span>
              <span class="daily-amount">
                支出: ￥{{ getDayTotal(item.date, "支出") }}
                <span class="amount-divider">|</span>
                收入: ￥{{ getDayTotal(item.date, "收入") }}
              </span>
            </div>
          </template>
        </van-cell>
        <!-- 账单项目 -->
        <van-cell
          :title="item.categoryName"
          :value="`${item.type}:
        ￥${item.amount}`"
          :label="item.detail"
          label-class="bill-detail"
          is-link
          :value-class="item.type === '支出' ? 'bill-cost' : 'bill-earn'"
          @click="() => navigateToBillDetail(item)"
        />
      </template>
    </van-cell-group>

    <div class="bottom-bar">
      <van-button
        id="add-button"
        icon="plus"
        color="#39C5BB"
        @click="toAddNewBill"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { getAllCategories } from "@/api/category";
import { ref, onMounted, nextTick } from "vue";
import { type DatePickerColumnType } from "vant";
import { getMonthBills } from "@/api/bill";
import { useRouter } from "vue-router";
import { ElMessage, roleTypes } from "element-plus";

// 定义修改年份和月份数据对象
const showMonthEdit = ref(false);
// 从 localStorage 获取当前日期,如果没有则使用当前日期
const storedDate = localStorage.getItem("currentDate");
const currentDate = ref(
  storedDate
    ? JSON.parse(storedDate)
    : [String(new Date().getFullYear()), String(new Date().getMonth() + 1)]
);
// 定义日期范围
const minDate = new Date(1900, 0);
const maxDate = new Date(new Date().getFullYear() + 100, 0);

const changeMonthEditStatus = () => {
  showMonthEdit.value = !showMonthEdit.value;
};
const hideMonthEdit = () => {
  showMonthEdit.value = false;
};

// 获取指定年月账单
const getMonthBill = async () => {
  hideMonthEdit();
  try {
    // 将日期选择器的值转换为合适的格式
    const month = parseInt(currentDate.value[1]);
    const year = parseInt(currentDate.value[0]);

    // 更新当前月份时保持两位数格式
    currentMonth.value = String(month).padStart(2, "0");
    currentYear.value = year;

    //  1.发送请求按照年月获取账单
    await getMonthBills(month, year);
    // 保存传入的年月到currentDate
    currentDate.value = [currentYear.value, currentMonth.value];
    localStorage.setItem("currentDate", JSON.stringify(currentDate.value));

    //  2.从localStorage读取处理后的分类数据
    const storedBills = localStorage.getItem("bills");
    const storedCategories = localStorage.getItem("categories");
    if (storedBills && storedCategories) {
      const billsData = JSON.parse(storedBills);
      const categoriesData = JSON.parse(storedCategories);
      currentMonth.value = currentDate.value[1];
      currentYear.value = parseInt(currentDate.value[0]);
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
    ElMessage({
      message: "获取账单失败" + "\n" + error.message,
      type: "error",
      plain: true,
    });
  }
};

// 定义请求传参-年月

const defaultYear = storedDate
  ? JSON.parse(storedDate)[0]
  : String(new Date().getFullYear());
const defaultMonth = storedDate
  ? JSON.parse(storedDate)[1]
  : String(new Date().getMonth() + 1).padStart(2, "0");

// 之所以需要定义这两个值，而不是直接获取上面定义的currentDate数组里面的值
// 是因为那个值与日期选择器绑定，我需要确定日期并获取对应数据后再改变顶部栏的日期现实
const currentYear = ref(defaultYear);
// +1 因为 getMonth() 返回 0-11
// 使用 padStart 确保月份始终是两位数
const currentMonth = ref(defaultMonth);
// 指定选择器显示的列类型
const columnsType: DatePickerColumnType[] = ["year", "month"];

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

// 格式化日期显示
const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return `${date.getMonth() + 1}月${date.getDate()}日`;
};

// 判断是否需要显示日期头部
const shouldShowDateHeader = (index: number) => {
  if (index === 0) return true;
  const currentDate = bills.value[index].date;
  const prevDate = bills.value[index - 1].date;
  return currentDate !== prevDate;
};

// 计算指定日期的收支总额
const getDayTotal = (date: string, type: string) => {
  return bills.value
    .filter((bill) => bill.date === date && bill.type === type)
    .reduce((sum, bill) => sum + bill.amount, 0)
    .toFixed(2);
};

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
    ElMessage({
      message: "获取分类失败" + "\n" + error.message,
      type: "error",
      plain: true,
    });
  }
};

// 跳转账单详情页
const router = useRouter();
const navigateToBillDetail = (bill: Bill) => {
  // 将当前选中的账单信息存储到 localStorage
  localStorage.setItem("currentBill", JSON.stringify(bill));
  // 直接跳转到详情页
  router.push("/bill-detail");
};
const toAddNewBill = () => {
  router.push("/bill-add");
};

// 更新统计页面导航方法
const goToStatistics = () => {
  router.push("/statistics");
};

// 添加这个函数来调整内容容器的顶部内边距
const adjustContentPadding = () => {
  nextTick(() => {
    const headerContainer = document.querySelector(".fixed-header-container");
    const contentContainer = document.querySelector(".m_bills");
    if (headerContainer && contentContainer) {
      const height = headerContainer.getBoundingClientRect().height;
      // 增加5px的安全边距
      contentContainer.style.paddingTop = `${height + 5}px`;
    }
  });
};

onMounted(async () => {
  console.log(currentMonth.value, currentYear.value);
  try {
    await getUserCategories();
    await getMonthBill();
    // 在数据加载后调整内边距
    adjustContentPadding();
  } catch (error) {
    console.error("初始化数据失败：", error);
  }

  // 添加窗口大小变化事件监听器
  window.addEventListener("resize", adjustContentPadding);
});
</script>

<style scoped>
/* 固定顶部容器样式 */
.fixed-header-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background-color: #fff;
  width: 100%;
  z-index: 999;
  box-shadow: 0px 2px 8px rgba(0, 0, 0, 0.1);
}

/* 为新的紧凑月份选择器添加样式 */
.compact-month-selector {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  background-color: #fff;
  border-bottom: 0.1rem solid #39c5bb;
}

.month-selector-left {
  display: flex;
  align-items: center;
}

.month-title {
  font-size: 16px;
  font-weight: bold;
  color: #52a1e5;
}

.month-stats {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.month-cost {
  font-size: 14px;
  color: #39c5bb;
  font-weight: bold;
}

.month-earn {
  font-size: 14px;
  color: #ff7875;
  font-weight: bold;
  margin-top: 2px;
}

/* 移除占位符和固定的顶部内边距 */
.m_bills {
  padding-bottom: 9rem;
  /* 不设置固定的padding-top，让JavaScript动态设置 */
}

.top-bar {
  border-bottom-style: solid;
  border-bottom-color: #39c5bb;
  border-width: 0.1rem;
  margin-top: -1px; /* 消除可能的间隙 */
  padding-top: 6px !important;
  padding-bottom: 6px !important;
}

:deep(.van-cell__value.month-cost) {
  font-size: 14px; /* 原来是 0.7rem */
  color: #39c5bb;
  font-weight: bold;
}
:deep(.van-cell__title.month-title) {
  font-size: 16px; /* 原来是 0.8rem */
  font-weight: bold;
  color: #52a1e5;
}

:deep(.van-cell__label.month-earn) {
  font-size: 14px; /* 原来是 0.7rem */
  font-weight: bold;
  color: #ff7875;
}

::v-deep(.van-cell__value.bill-cost) {
  color: #39c5bb;
}

::v-deep(.van-cell__value.bill-earn) {
  color: #ff7875;
}

/* 新增日期头部样式 */
.date-header {
  background-color: #f8f8f8;
}

.date-summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.date-text {
  font-weight: bold;
  color: #52a1e5;
}

.daily-amount {
  font-size: 14px; /* 原来是 0.7rem */
  color: #666;
}

.amount-divider {
  margin: 0 0.5rem;
  color: #ddd;
}

.van-cell {
  padding-left: 1.5rem;
  padding-right: 1rem;
}
#add-button {
  border-radius: 50%;
  font-size: 20px; /* 原来是 1.2rem */
  width: 3rem;
  height: 3rem;
  position: fixed;
  bottom: 5rem;
  right: 1rem;
}

:deep(.van-cell__label.bill-detail) {
  width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 10rem;
}

/* 调整 van-nav-bar 和月份选择栏的样式 */
:deep(.van-nav-bar) {
  height: 40px !important; /* 默认通常是 46px */
  line-height: 40px !important;
}

:deep(.van-nav-bar__title) {
  font-size: 16px !important; /* 如果需要可以减小标题字体大小 */
}
</style>
