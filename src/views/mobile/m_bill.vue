<template>
  <div class="m_bills">
    <!-- 顶部导航 -->
    <van-nav-bar title="汐落" />

    <!-- Sticky 固定顶部 -->
    <van-sticky>
      <van-cell
        :title="`${currentYear}年${currentMonth}月支出 :`"
        :value="`￥${MonthCost.toFixed(2)}`"
        :label="`本月收入 ￥${MonthEarn.toFixed(2)}`"
        title-class="month-title"
        value-class="month-cost"
        label-class="month-earn"
        is-link
        @click="changeMonthEditStatus"
      />
    </van-sticky>
    <van-date-picker
      v-if="showMonthEdit"
      v-model="currentDate"
      title="选择年月"
      :min-date="minDate"
      :max-date="maxDate"
      :columns-type="columnsType"
      @confirm="getMonthBill"
      @cancel="hideMonthEdit"
    />
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
          is-link
          :value-class="item.type === '支出' ? 'bill-cost' : 'bill-earn'"
          @click="() => navigateToBillDetail(item)"
        />
      </template>
    </van-cell-group>
    <van-button
      id="add-button"
      icon="plus"
      color="#39C5BB"
      @click="toAddNewBill"
    />
  </div>
</template>

<script setup lang="ts">
import { getAllCategories } from "@/api/category";
import { ref } from "vue";
import { onMounted } from "vue";
import { type DatePickerColumnType } from "vant";
import { getMonthBills } from "@/api/bill";
import { useRouter } from "vue-router";
import { ElMessage, roleTypes } from "element-plus";

// 定义修改年份和月份数据对象
const showMonthEdit = ref(false);
const currentDate = ref([
  String(new Date().getFullYear()),
  String(new Date().getMonth() + 1),
]);

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
  try {
    // 将日期选择器的值转换为合适的格式
    const month = parseInt(currentDate.value[1]);
    const year = parseInt(currentDate.value[0]);

    // 更新当前月份时保持两位数格式
    currentMonth.value = String(month).padStart(2, "0");
    currentYear.value = year;

    //  1.发送请求按照年月获取账单
    await getMonthBills(month, year);

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
      ElMessage({
        message: "获取成功！",
        type: "success",
        plain: true,
      });
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
// 之所以需要定义这两个值，而不是直接获取上面定义的currentDate数组里面的值
// 是因为那个值于日期选择器绑定，我需要确定日期并获取对应数据后再改变顶部栏的日期现实
const currentYear = ref(new Date().getFullYear());
// +1 因为 getMonth() 返回 0-11
// 使用 padStart 确保月份始终是两位数
const currentMonth = ref(String(new Date().getMonth() + 1).padStart(2, "0"));
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
// 按年月获取用户常规账单
const getUserMonthBills = async () => {
  try {
    //  1.发送请求按照年月获取账单
    await getMonthBills(parseInt(currentMonth.value), currentYear.value);

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

    ElMessage({
      message: "获取账单失败" + "\n" + error.message,
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
  font-size: 0.9rem;
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
  font-size: 1.5rem;
  width: 4rem;
  height: 4rem;
  position: fixed;
  bottom: 8rem;
  right: 1rem;
  z-index: 100;
}
</style>
