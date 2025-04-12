<template>
  <div class="renew-bill">
    <!-- Sticky 固定顶部 -->
    <van-sticky class="top-bar">
      <div class="page-header">
        <h1 class="page-title">循环账单</h1>
        <el-button
          plain
          @click="toEditRenewCategories"
          class="edit-category-button"
          >编辑分类</el-button
        >
      </div>
    </van-sticky>

    <!-- 循环账单展示：以分类为折叠栏目 -->
    <div class="renew-category-collapse">
      <el-collapse v-model="activeName">
        <el-collapse-item
          v-for="renewcategory in RenewCategories"
          :key="renewcategory.id"
          :title="renewcategory.name"
          :name="renewcategory.id"
        >
          <!-- 循环账单列表 -->
          <van-cell
            v-for="bill in getBillsByCategory(renewcategory.id)"
            :key="bill.id"
            :label="truncateText(bill.details)"
            size="large"
            style="margin-bottom: 1rem"
          >
            <!-- 使用 title 插槽来自定义标题 -->
            <template #title>
              <span class="custom-title">{{ bill.name }}</span>
              <van-tag plain type="success">{{ bill.cycle }}</van-tag>
              <van-tag plain type="warning">实付{{ bill.cost }}元</van-tag>
            </template>
            <!-- 使用 value 插槽来自定义账单细节展示部分 -->
            <template #value>
              <div class="details-display-container">
                <div class="cycle-cost">
                  年付：{{ calculatePeriodCost(bill, "year") }}元 <br />
                  月付：{{ calculatePeriodCost(bill, "month") }}元 <br />
                  周付：{{ calculatePeriodCost(bill, "week") }}元 <br />
                  日付：{{ calculatePeriodCost(bill, "day") }}元
                </div>
                <div class="cycle-display">
                  开始：{{ bill.beginning }}<br />
                  结束：{{ bill.ending }}<br />
                  <div class="renew-status">
                    自动续费：
                    <van-switch
                      :model-value="bill.renew === '开启'"
                      @update:model-value="(val) => onUpdateValue(val, bill)"
                      active-color="#39c5bb"
                      inactive-color="#dcdee0"
                      size="1rem"
                      style="margin-bottom: 0.2rem"
                    ></van-switch>
                  </div>
                  <br />
                  <el-button plain @click="() => toEditRenewBill(bill)"
                    >编辑</el-button
                  >
                </div>
              </div>
            </template>
          </van-cell>
        </el-collapse-item>
      </el-collapse>
    </div>
    <div class="bottom-bar">
      <van-button
        id="add-button"
        icon="plus"
        color="#52a1e5"
        @click="toAddRenewBill"
      />
    </div>
  </div>
</template>
<script lang="ts" setup>
import { getRenewBills, updateAutoRenewStatus } from "@/api/renew_bill";
import { getAllRenewCategories } from "@/api/renew_category";
import { ElMessage } from "element-plus";
import { showConfirmDialog } from "vant";
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

// 循环账单数据 - 这个数据是实际填到表单中的
const RenewBills = ref<RenewBill>({
  records: [],
  total: 0,
  size: 0,
  current: 1,
  pages: 0,
});

// Element组件-Collapse折叠面板所需
const activeName = ref("1");

// 定义router，用于路由跳转
const router = useRouter();

// 这里定义使用到的循环账单分类的数据结构
const RenewCategories = ref<RenewCategory[]>([]);

// 用来表示循环账单的自动续费状态
const AutoRenew = ref(true);

// 修改自动续费状态切换函数
const onUpdateValue = async (
  newValue: boolean,
  bill: RenewBill["records"][0]
) => {
  showConfirmDialog({
    message: "是否切换状态",
    width: "20rem",
    confirmButtonColor: "#39c5bb",
  })
    .then(async () => {
      try {
        // 根据开关状态设置续费状态
        const renewStatus = newValue ? "开启" : "未开启";
        await updateAutoRenewStatus(bill.id, renewStatus);

        // 更新本地数据
        const index = RenewBills.value.records.findIndex(
          (item) => item.id === bill.id
        );
        if (index !== -1) {
          RenewBills.value.records[index].renew = renewStatus;
        }
      } catch (error: any) {
        console.error("更新续费状态失败:", error);
        ElMessage({
          message: error.message || "更新失败，请稍后重试",
          type: "error",
          plain: true,
        });
      }
    })
    .catch(() => {
      // 用户取消操作，不做任何处理
    });
};

// 获取循环账单数据
const getRenewBillsList = async () => {
  try {
    const response = await getRenewBills();
    RenewBills.value = response;
    console.log("获取到的循环账单:", RenewBills.value);
  } catch (error: any) {
    console.error("获取循环账单失败:", error);
    ElMessage({
      message: "获取循环账单失败" + "\n" + error.message,
      type: "error",
      plain: true,
    });
  }
};

// 通过这个函数过滤账单，确保每个分类下面只显示该分类的循环账单
// 其实我开始是想按照分类获取账单的，后来综合的考量了觉得意义不大
// 正常人的循环账单顶天了也就30条呗
// 而且还有redis缓存，应该没问题
const getBillsByCategory = (categoryId: string) => {
  return RenewBills.value.records.filter(
    (bill) => bill.categoryId.toString() === categoryId
  );
};

// 文本截断，如果循环账单备注超过一定数量的字符，后面就显示省略号
const truncateText = (text: string, limit: number = 80): string => {
  if (!text) return "";
  return text.length <= limit ? text : `${text.slice(0, limit)}...`;
};

// 计算不同周期的费用
const calculatePeriodCost = (
  bill: RenewBill["records"][0],
  period: "day" | "week" | "month" | "year"
) => {
  const startDate = new Date(bill.beginning);
  const endDate = new Date(bill.ending);
  const totalCost = bill.cost;

  // 计算总天数差
  const daysDiff = Math.ceil(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  // 计算每天的成本
  const costPerDay = totalCost / daysDiff;

  // 根据周期返回对应的费用
  const costs = {
    day: costPerDay,
    week: costPerDay * 7,
    month: costPerDay * 30,
    year: costPerDay * 365,
  };

  return Number(costs[period].toFixed(2));
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

const toEditRenewBill = (bill: RenewBill["records"][0]) => {
  // 将当前选中的账单存入localStorage
  localStorage.setItem("currentRenewBill", JSON.stringify(bill));
  console.log(
    "现在存储到本地的循环账单信息" + localStorage.getItem("currentRenewBill")
  );
  // 跳转到编辑页面
  router.push("/edit-renew-bill");
};

const toAddRenewBill = () => {
  router.push("add-renew-bill");
};

onMounted(async () => {
  await getUserRenewCategories();
  await getRenewBillsList(); // 新增: 获取循环账单数据
});

// 这里留一个测试用的模板
// <!-- 循环账单展示：以分类为折叠栏目，展开时获取循环账单 -->
//     <div class="renew-category-collapse">
//       <el-collapse v-model="activeName">
//         <div class="test">
//           <el-collapse-item title="测试循环账单用">
//             <van-cell
//               :label="truncateText(RenewBillTest.records[0].details)"
//               size="large"
//             >
//               <!-- 使用 title 插槽来自定义标题 -->
//               <template #title>
//                 <span class="custom-title">{{
//                   RenewBillTest.records[0].name
//                 }}</span>
//                 <van-tag plain type="success">{{
//                   RenewBillTest.records[0].cycle
//                 }}</van-tag>
//                 <van-tag plain type="warning"
//                   >{{ RenewBillTest.records[0].cost }}元</van-tag
//                 >
//               </template>
//               <!-- 使用 value 插槽来自定义账单细节展示部分 -->
//               <template #value>
//                 <div class="details-display-container">
//                   <div class="cycle-cost">
//                     年付：{{ YearCostDisplay }}元 <br />月付：{{
//                       MonthCostDisplay
//                     }}元 <br />周付：{{ WeekCostDisplay }}元 <br />日付：{{
//                       DayCostDisplay
//                     }}元
//                   </div>
//                   <div class="cycle-display">
//                     开始：{{ RenewBillTest.records[0].beginning }}<br />结束：{{
//                       RenewBillTest.records[0].ending
//                     }}<br />
//                     <div class="renew-status">
//                       自动续费：
//                       <van-switch
//                         :model-value="AutoRenew"
//                         @update:model-value="onUpdateValue"
//                         active-color="#39c5bb"
//                         inactive-color="#dcdee0"
//                         size="1rem"
//                       ></van-switch>
//                     </div>
//                     <br />
//                     <el-button plain @click="toEditRenewBill">编辑</el-button>
//                   </div>
//                 </div>
//               </template>
//             </van-cell>
//           </el-collapse-item>
//         </div>
//       </el-collapse>
//     </div>
// // 所需要的一些变量
// const YearCostDisplay = ref(0);
// const MonthCostDisplay = ref(0);
// const WeekCostDisplay = ref(0);
// const DayCostDisplay = ref(0);

// // 循环账单的模拟数据
// const RenewBillTest = ref<RenewBill>({
//   records: [
//     {
//       // records 是一个数组
//       id: 1,
//       name: "天童爱丽丝的循环账单",
//       details:
//         "这里是天童爱丽丝的循环账单，我是账单信息详情；这里是天童爱丽丝的循环账单，我是账单信息详情；这里是天童爱丽丝的循环账单，我是账单信息详情；这里是天童爱丽丝的循环账单，我是账单信息详情；这里是天童爱丽丝的循环账单，我是账单信息详情；这里是天童爱丽丝的循环账单，我是账单信息详情；这里是天童爱丽丝的循环账单，我是账单信息详情；",
//       categoryId: 26,
//       cycle: "年付",
//       beginning: "2025-01-01",
//       ending: "2026-01-01",
//       renew: "未开启",
//       cost: 23.44,
//     },
//   ],
//   total: 1,
//   size: 5,
//   current: 1,
//   pages: 1,
// });

// // 计算每种周期的付款金额
// const calculateCosts = () => {
//   // 获取开始和结束日期
//   const startDate = new Date(RenewBillTest.value.records[0].beginning);
//   const endDate = new Date(RenewBillTest.value.records[0].ending);
//   const totalCost = RenewBillTest.value.records[0].cost;

//   // 计算总天数差
//   const daysDiff = Math.ceil(
//     (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
//   );

//   // 计算每天的成本
//   const costPerDay = totalCost / daysDiff;

//   // 设置不同周期的显示值，保留2位小数
//   DayCostDisplay.value = Number(costPerDay.toFixed(2));
//   WeekCostDisplay.value = Number((costPerDay * 7).toFixed(2));
//   MonthCostDisplay.value = Number((costPerDay * 30).toFixed(2));
//   YearCostDisplay.value = Number((costPerDay * 365).toFixed(2));
// };

// onMounted(async () => {
//   getUserRenewCategories();
//   calculateCosts();
//   await getRenewBillsList(); // 新增: 获取循环账单数据
// });
</script>

<style scoped>
/* 因为接下来的样式设置将会很复杂，所以我的说明会写的比较详细 */

.renew-bill {
  padding-bottom: 10rem;
}

.page-header {
  width: 100vw;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #fff;
  border-bottom-style: solid;
  border-width: 0.1rem;
  border-bottom-color: #39c5bb;
  border-bottom-style: solid;
}

/* 这个用于设置页面大标题的样式 */
.page-title {
  margin-left: 2rem;
  font-size: 16px; /* 原来是 1rem */
  color: #39c5bb;
}

.edit-category-button {
  margin-right: 2rem;
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
  border-color: rgba(82, 161, 229, 0.3);
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

/* 自动续费状态展示容器 */
.renew-status {
  display: inline-flex;
  align-items: center;
}
/* ----------value样式设置结束---------- */

#add-button {
  border-radius: 50%;
  font-size: 20px; /* 原来是 1.2rem */
  width: 3rem;
  height: 3rem;
  position: fixed;
  bottom: 5rem;
  right: 1rem;
}
</style>
