<template>
  <div class="renew-bill">
    <div class="page-header">
      <h1 class="page-title">循环账单</h1>
      <el-button plain @click="toEditRenewCategories">编辑分类</el-button>
    </div>
    <div class="renew-category-collapse">
      <el-collapse v-model="activeName">
        <el-collapse-item
          v-for="renewcategory in RenewCategories"
          :key="renewcategory.id"
          :title="renewcategory.name"
          :name="renewcategory.id"
        >
        </el-collapse-item>
        <el-collapse-item title="测试循环账单用">
          <van-cell
            :label="truncateText(RenewBillTest.records[0].details)"
            size="large"
            is-link
          >
            <!-- 使用 title 插槽来自定义标题 -->
            <template #title>
              <span class="custom-title">{{
                RenewBillTest.records[0].name
              }}</span>
              <van-tag plain type="success">{{
                RenewBillTest.records[0].cycle
              }}</van-tag>
              <van-tag plain type="warning"
                >{{ RenewBillTest.records[0].cost }}元</van-tag
              >
            </template>
            <!-- 使用 value 插槽来自定义账单细节展示部分 -->
            <template #value>
              <div class="details-display-container">
                <div class="cycle-cost">
                  年付：{{ YearCostDisplay }}元 <br />月付：{{
                    MonthCostDisplay
                  }}元 <br />周付：{{ WeekCostDisplay }}元 <br />日付：{{
                    DayCostDisplay
                  }}元
                </div>
                <div class="cycle-display">
                  开始：{{ RenewBillTest.records[0].beginning }}<br />结束：{{
                    RenewBillTest.records[0].ending
                  }}<br />
                </div>
              </div>
            </template>
          </van-cell>
        </el-collapse-item>
      </el-collapse>
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

interface RenewBill {
  records: Array<{
    id: number;
    name: string;
    details: string;
    categoryId: number;
    cycle: string;
    beginning: string;
    ending: string;
    renew: string;
    cost: number;
  }>;
  total: number;
  size: number;
  current: number;
  pages: number;
}

// Element组件-Collapse折叠面板所需
const activeName = ref("1");

// 定义router，用于路由跳转
const router = useRouter();

// 这里定义使用到的循环账单分类的数据结构
const RenewCategories = ref<RenewCategory[]>([]);

const YearCostDisplay = ref(111);
const MonthCostDisplay = ref(0);
const WeekCostDisplay = ref(0);
const DayCostDisplay = ref(0);

// 循环账单的模拟数据
const RenewBillTest = ref<RenewBill>({
  // 注意这里不需要数组
  records: [
    {
      // records 是一个数组
      id: 1,
      name: "天童爱丽丝的循环账单",
      details:
        "这里是天童爱丽丝的循环账单，我是账单信息详情；这里是天童爱丽丝的循环账单，我是账单信息详情；这里是天童爱丽丝的循环账单，我是账单信息详情；这里是天童爱丽丝的循环账单，我是账单信息详情；这里是天童爱丽丝的循环账单，我是账单信息详情；这里是天童爱丽丝的循环账单，我是账单信息详情；这里是天童爱丽丝的循环账单，我是账单信息详情；",
      categoryId: 26,
      cycle: "年付",
      beginning: "2025-01-01",
      ending: "2026-01-01",
      renew: "未开启",
      cost: 23.44,
    },
  ],
  total: 1,
  size: 5,
  current: 1,
  pages: 1,
});

// 文本截断，如果循环账单备注超过一定数量的字符，后面就显示省略号
const truncateText = (text: string, limit: number = 80): string => {
  if (!text) return "";
  return text.length <= limit ? text : `${text.slice(0, limit)}...`;
};

// 计算每种周期的付款金额
const calculateCosts = () => {
  // 获取开始和结束日期
  const startDate = new Date(RenewBillTest.value.records[0].beginning);
  const endDate = new Date(RenewBillTest.value.records[0].ending);
  const totalCost = RenewBillTest.value.records[0].cost;

  // 计算总天数差
  const daysDiff = Math.ceil(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  // 计算每天的成本
  const costPerDay = totalCost / daysDiff;

  // 设置不同周期的显示值，保留2位小数
  DayCostDisplay.value = Number(costPerDay.toFixed(2));
  WeekCostDisplay.value = Number((costPerDay * 7).toFixed(2));
  MonthCostDisplay.value = Number((costPerDay * 30).toFixed(2));
  YearCostDisplay.value = Number((costPerDay * 365).toFixed(2));
};

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

const toEditRenewCategories = () => {
  router.push("/edit-renew-category");
};

onMounted(async () => {
  getUserRenewCategories();
  calculateCosts(); // 添加这行
});
</script>

<style scoped>
/* 因为接下来的样式设置将会很复杂，所以我的说明会写的比较详细 */

.page-header {
  width: 90vw;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* 这个用来设置整个折叠栏目的样式 */
.renew-category-collapse {
  margin-top: 0rem;
  margin-left: 2rem;
  margin-right: 2rem;
}

/* 这个用来设置折叠栏目的标题样式 */
.renew-bill :deep(.el-collapse-item__header) {
  color: #52a1e5;
  font-weight: bold;
}

/* 让标签左边有0.5rem的间隔 */
.renew-bill :deep(.van-tag) {
  margin-left: 0.5rem;
}

/* 让整个单元格的布局是竖向的，这样从上到下的顺序分别是
van-cell__title
van-cell__label
van-cell__value
van-badge__wrapper van-icon van-icon-arrow van-cell__right-icon
这就意味着我可以直接通过编辑value插槽来在单元格自定义一些显示元素 */
.renew-bill :deep(.van-cell) {
  flex-direction: column;
  align-items: flex-start;
  border-style: solid;
  border-width: 0.1rem;
  border-radius: 0.5rem;
  /* 通过将#52a1e5转换成rgba来获取边框透明度的设置选项 */
  border-color: rgba(82, 161, 229, 0.5);
}

/* 把转向详情的按钮推到最右边 */
.renew-bill :deep(.van-cell__right-icon) {
  margin-left: auto;
}

/* 这是单元格标题的容器，这个设定可以让标题和标签在同一垂直高度上 */
.custom-title {
  vertical-align: middle;
  font-weight: bold;
}

/* 这个用于设置页面大标题的样式 */
.page-title {
  margin-bottom: 1rem;
  margin-left: 2rem;
  font-size: 1.5rem;
  color: #39c5bb;
}

/* ----------value样式设置开始---------- */
/* 这里开始设置单元格value容器的样式
  这个container是用来包裹value容器的
  设置容器的展示方式是row的方式
  并且设置计算付款费用的容器和周期展示容器平分单元格宽度
  这里有个很重要的说明
  如果不添加这段样式
  .renew-bill :deep(.van-cell__value) {
  width: 100%;
}
那么就无法让这个value容器的宽度占满整个单元格
这一点非常非常重要 */

.details-display-container {
  display: flex;
  flex-direction: row;
  justify-content: space-between; /* 让容器平分单元格宽度 */
  align-items: center;
}
/* 添加这些样式来覆盖 van-cell 的默认行为 */
.renew-bill :deep(.van-cell__value) {
  margin-top: 1rem;
  width: 100%;
  font-weight: bold;
}

/* 周期费用展示容器 */
.cycle-cost {
  color: #39c5bb;
  text-align: left;
}

/* 周期时间段展示容器 */
.cycle-display {
  color: #52a1e5;
}
/* ----------value样式设置结束---------- */
</style>
