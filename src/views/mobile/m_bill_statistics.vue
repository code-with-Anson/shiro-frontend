<template>
  <div class="m-statistics-container">
    <!-- 头部导航 -->
    <van-nav-bar
      title="账单统计"
      left-text="返回"
      left-arrow
      @click-left="onClickLeft"
    />

    <!-- 时间范围选择 - 修改后的代码 -->
    <div class="time-selector">
      <div class="selector-container">
        <div class="selector-tabs">
          <div
            class="selector-tab"
            :class="{ active: timeRange === 'week' }"
            @click="
              timeRange = 'week';
              handleTimeRangeChange();
            "
          >
            周
          </div>
          <div
            class="selector-tab"
            :class="{ active: timeRange === 'month' }"
            @click="
              timeRange = 'month';
              handleTimeRangeChange();
            "
          >
            月
          </div>
          <div
            class="selector-tab"
            :class="{ active: timeRange === 'year' }"
            @click="
              timeRange = 'year';
              handleTimeRangeChange();
            "
          >
            年
          </div>
          <!-- 滑动指示器 -->
          <div class="slider-indicator" :style="sliderStyle"></div>
        </div>
      </div>

      <!-- 使用 Vant 日期选择器 -->
      <div class="date-picker-container" v-if="timeRange === 'month'">
        <div class="date-display" @click="showMonthPicker = true">
          {{ formatMonthDate }}
          <van-icon name="arrow-down" />
        </div>
        <van-popup v-model:show="showMonthPicker" position="bottom" round>
          <van-date-picker
            v-model="currentMonthDate"
            title="选择月份"
            :min-date="minDate"
            :max-date="maxDate"
            :columns-type="['year', 'month']"
            @confirm="confirmMonthPicker"
            @cancel="showMonthPicker = false"
          />
        </van-popup>
      </div>
      <div class="date-picker-container" v-else-if="timeRange === 'year'">
        <div class="date-display" @click="showYearPicker = true">
          {{ formatYearDate }}
          <van-icon name="arrow-down" />
        </div>
        <van-popup v-model:show="showYearPicker" position="bottom" round>
          <van-date-picker
            v-model="currentYearDate"
            title="选择年份"
            :min-date="minDate"
            :max-date="maxDate"
            :columns-type="['year']"
            @confirm="confirmYearPicker"
            @cancel="showYearPicker = false"
          />
        </van-popup>
      </div>
    </div>

    <!-- 添加AI分析按钮 -->
    <div class="time-selector">
      <div class="selector-container">
        <!-- 现有的时间选择器代码 -->
      </div>

      <div class="ai-analysis-button">
        <van-button
          type="primary"
          icon="chat-o"
          :loading="isAnalyzing"
          @click="handleAiAnalysis"
          block
        >
          AI智能分析
        </van-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="summary-cards">
      <!-- 总支出卡片 -->
      <div class="custom-card">
        <div class="card-header">
          <div class="card-title">总支出</div>
          <div class="card-amount expense-text">
            ¥{{ formatAmount(summaryData.totalExpense) }}
          </div>
        </div>
        <div class="card-footer">
          <div v-if="timeRange === 'month'" class="card-avg">
            日均支出: ¥{{ calculateDailyAvg(summaryData.totalExpense) }}
          </div>
          <div v-if="timeRange === 'year'" class="card-avg">
            月均支出: ¥{{ calculateMonthlyAvg(summaryData.totalExpense) }}
          </div>
        </div>
      </div>

      <!-- 总收入卡片 -->
      <div class="custom-card">
        <div class="card-header">
          <div class="card-title">总收入</div>
          <div class="card-amount income-text">
            ¥{{ formatAmount(summaryData.totalIncome) }}
          </div>
        </div>
        <div class="card-footer">
          <div v-if="timeRange === 'month'" class="card-avg">
            日均收入: ¥{{ calculateDailyAvg(summaryData.totalIncome) }}
          </div>
          <div v-if="timeRange === 'year'" class="card-avg">
            月均收入: ¥{{ calculateMonthlyAvg(summaryData.totalIncome) }}
          </div>
        </div>
      </div>

      <!-- 收支结余卡片 -->
      <div class="custom-card">
        <div class="card-header">
          <div class="card-title">收支结余</div>
          <div class="card-amount balance-text">
            ¥{{ formatAmount(summaryData.netIncome) }}
          </div>
        </div>
        <div class="card-footer">
          <div v-if="summaryData.billCount" class="card-avg">
            账单数量: {{ summaryData.billCount }}笔
          </div>
        </div>
      </div>
    </div>

    <!-- 加载中 -->
    <van-loading
      v-if="loading"
      class="loading-container"
      type="spinner"
      color="#1989fa"
      vertical
    >
      加载中...
    </van-loading>

    <template v-else>
      <!-- 趋势图 -->
      <div class="chart-container">
        <div class="chart-title">收支趋势</div>
        <div ref="trendChartRef" class="trend-chart"></div>
      </div>

      <!-- 分类统计 -->
      <div class="chart-container">
        <div class="chart-title">支出分类占比</div>
        <div ref="expensePieChartRef" class="pie-chart"></div>
      </div>

      <div class="chart-container">
        <div class="chart-title">收入分类占比</div>
        <div ref="incomePieChartRef" class="pie-chart"></div>
      </div>

      <!-- 无数据提示 -->
      <van-empty
        v-if="showEmpty"
        description="暂无数据"
        class="empty-container"
      >
      </van-empty>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, computed } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import * as echarts from "echarts/core";
import { LineChart, PieChart } from "echarts/charts";
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import {
  getWeekStatistics,
  getMonthStatistics,
  getYearStatistics,
} from "@/api/statistics";
import { createConversation } from "@/api/aiChat";

// 注册ECharts组件
echarts.use([
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  LineChart,
  PieChart,
  CanvasRenderer,
]);

const router = useRouter();

// 状态变量
const timeRange = ref<"week" | "month" | "year">("week");
const loading = ref(true);
const monthDate = ref(new Date());
const yearDate = ref(new Date());
const showMonthPicker = ref(false);
const showYearPicker = ref(false);

// 新增兼容 van-date-picker 的日期变量
const currentMonthDate = ref([
  String(new Date().getFullYear()),
  String(new Date().getMonth() + 1).padStart(2, "0"),
]);
const currentYearDate = ref([String(new Date().getFullYear())]);

// 日期范围设置
const minDate = new Date(2020, 0, 1);
const maxDate = new Date(2030, 11, 31);

// 图表引用
const trendChartRef = ref<HTMLElement | null>(null);
const expensePieChartRef = ref<HTMLElement | null>(null);
const incomePieChartRef = ref<HTMLElement | null>(null);

// 图表实例
let trendChart: echarts.ECharts | null = null;
let expensePieChart: echarts.ECharts | null = null;
let incomePieChart: echarts.ECharts | null = null;

// 统计数据
const weekData = ref<any>({
  dailyData: [],
  categoryDetails: {},
  expenseCategoryDetails: {},
  incomeCategoryDetails: {},
  totalExpense: 0,
  totalIncome: 0,
  netIncome: 0,
});

const monthData = ref<any>({
  billCount: 0,
  categoryDetails: {},
  expenseCategoryDetails: {},
  incomeCategoryDetails: {},
  month: null,
  netIncome: 0,
  totalExpense: 0,
  totalIncome: 0,
  year: new Date().getFullYear(),
});

const yearData = ref<any>({
  billCount: 0,
  categoryDetails: {},
  expenseCategoryDetails: {},
  incomeCategoryDetails: {},
  monthDetails: [],
  netIncome: 0,
  totalExpense: 0,
  totalIncome: 0,
  year: new Date().getFullYear(),
});

// 格式化日期显示
const formatMonthDate = computed(() => {
  if (currentMonthDate.value && currentMonthDate.value.length >= 2) {
    return `${currentMonthDate.value[0]}年${currentMonthDate.value[1]}月`;
  }
  return `${new Date().getFullYear()}年${new Date().getMonth() + 1}月`;
});

const formatYearDate = computed(() => {
  if (currentYearDate.value && currentYearDate.value.length >= 1) {
    return `${currentYearDate.value[0]}年`;
  }
  return `${new Date().getFullYear()}年`;
});

// 根据当前选择的时间范围显示对应数据
const summaryData = computed(() => {
  switch (timeRange.value) {
    case "week":
      return weekData.value;
    case "month":
      return monthData.value;
    case "year":
      return yearData.value;
  }
});

// 是否显示空状态
const showEmpty = computed(() => {
  if (timeRange.value === "week") {
    return !weekData.value.dailyData || weekData.value.dailyData.length === 0;
  } else if (timeRange.value === "month") {
    return monthData.value.billCount === 0;
  } else {
    return (
      !yearData.value.monthDetails || yearData.value.monthDetails.length === 0
    );
  }
});

// 格式化金额，保留两位小数
const formatAmount = (amount: number) => {
  return (amount || 0).toFixed(2);
};

// 计算日均值
const calculateDailyAvg = (total: number) => {
  const currentDate = new Date(monthDate.value);
  const daysInMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0
  ).getDate();
  return ((total || 0) / daysInMonth).toFixed(2);
};

// 计算月均值
const calculateMonthlyAvg = (total: number) => {
  const monthCount = yearData.value.monthDetails
    ? yearData.value.monthDetails.length
    : 12;
  return ((total || 0) / (monthCount || 1)).toFixed(2);
};

// 初始化趋势图
const initTrendChart = () => {
  if (!trendChartRef.value) return;

  trendChart = echarts.init(trendChartRef.value);

  const option: echarts.EChartsOption = {
    tooltip: {
      trigger: "axis",
      formatter: (params: any) => {
        const income = params.find((item: any) => item.seriesName === "收入");
        const expense = params.find((item: any) => item.seriesName === "支出");
        const incomeValue = income ? income.value : 0;
        const expenseValue = expense ? expense.value : 0;
        const balance = incomeValue - expenseValue;

        return `${params[0].axisValue}<br/>
                收入: ¥${incomeValue.toFixed(2)}<br/>
                支出: ¥${expenseValue.toFixed(2)}<br/>
                结余: ¥${balance.toFixed(2)}`;
      },
    },
    legend: {
      data: ["收入", "支出"],
      bottom: 0,
    },
    grid: {
      left: "3%",
      right: "5%",
      top: "8%",
      bottom: "15%",
      containLabel: true,
    },
    xAxis: {
      type: "category",
      data: [],
    },
    yAxis: {
      type: "value",
      name: "金额",
      axisLabel: {
        formatter: "{value}元",
      },
    },
    series: [
      {
        name: "收入",
        type: "line",
        smooth: true,
        itemStyle: {
          color: "#67C23A",
        },
        data: [],
      },
      {
        name: "支出",
        type: "line",
        smooth: true,
        itemStyle: {
          color: "#F56C6C",
        },
        data: [],
      },
    ],
  };

  trendChart.setOption(option);
};

// 初始化饼图
const initPieCharts = () => {
  if (!expensePieChartRef.value || !incomePieChartRef.value) return;

  expensePieChart = echarts.init(expensePieChartRef.value);
  incomePieChart = echarts.init(incomePieChartRef.value);

  const expenseOption: echarts.EChartsOption = {
    tooltip: {
      trigger: "item",
      formatter: "{b}: ¥{c} ({d}%)",
    },
    legend: {
      orient: "horizontal",
      bottom: 0,
      type: "scroll",
      textStyle: {
        fontSize: 12,
      },
    },
    series: [
      {
        name: "支出分类",
        type: "pie",
        radius: ["30%", "60%"],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 5,
          borderColor: "#fff",
          borderWidth: 1,
        },
        label: {
          show: false,
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: "bold",
          },
        },
        labelLine: {
          show: false,
        },
        data: [],
      },
    ],
  };

  const incomeOption = { ...expenseOption };
  incomeOption.series[0].name = "收入分类";

  expensePieChart.setOption(expenseOption);
  incomePieChart.setOption(incomeOption);
};

// 更新趋势图
const updateTrendChart = () => {
  if (!trendChart) return;

  let xAxisData: string[] = [];
  let incomeData: number[] = [];
  let expenseData: number[] = [];

  if (timeRange.value === "week" && weekData.value.dailyData) {
    weekData.value.dailyData.forEach((day: any) => {
      xAxisData.push(formatDateForDisplay(day.date));
      incomeData.push(day.income || 0);
      expenseData.push(day.expense || 0);
    });
  } else if (timeRange.value === "month") {
    const daysInMonth = new Date(
      monthDate.value.getFullYear(),
      monthDate.value.getMonth() + 1,
      0
    ).getDate();

    for (let i = 1; i <= daysInMonth; i++) {
      xAxisData.push(i + "日");
      const dayData = (monthData.value.dailyData || []).find(
        (d: any) => new Date(d.date).getDate() === i
      );

      incomeData.push(dayData ? dayData.income : 0);
      expenseData.push(dayData ? dayData.expense : 0);
    }
  } else if (timeRange.value === "year" && yearData.value.monthDetails) {
    yearData.value.monthDetails.forEach((month: any) => {
      xAxisData.push(month.month + "月");
      incomeData.push(month.income || 0);
      expenseData.push(month.expense || 0);
    });
  }

  trendChart.setOption({
    xAxis: {
      data: xAxisData,
    },
    series: [
      {
        name: "收入",
        data: incomeData,
      },
      {
        name: "支出",
        data: expenseData,
      },
    ],
  });
};

// 格式化日期显示
const formatDateForDisplay = (dateStr: string) => {
  const date = new Date(dateStr);
  return `${date.getMonth() + 1}/${date.getDate()}`;
};

// 更新饼图
const updatePieCharts = () => {
  if (!expensePieChart || !incomePieChart) return;

  let currentData: any = null;
  switch (timeRange.value) {
    case "week":
      currentData = weekData.value;
      break;
    case "month":
      currentData = monthData.value;
      break;
    case "year":
      currentData = yearData.value;
      break;
  }

  if (!currentData) return;

  // 更新支出饼图
  const expenseData = Object.entries(
    currentData.expenseCategoryDetails || {}
  ).map(([name, value]) => ({
    name,
    // 格式化为两位小数，然后转回数字类型
    value: Number(Number(value).toFixed(2)),
  }));

  expensePieChart.setOption({
    series: [
      {
        data: expenseData,
      },
    ],
  });

  // 更新收入饼图
  const incomeData = Object.entries(
    currentData.incomeCategoryDetails || {}
  ).map(([name, value]) => ({
    name,
    // 格式化为两位小数，然后转回数字类型
    value: Number(Number(value).toFixed(2)),
  }));

  incomePieChart.setOption({
    series: [
      {
        data: incomeData,
      },
    ],
  });
};

// 处理时间范围变化
const handleTimeRangeChange = async () => {
  loading.value = true;
  try {
    switch (timeRange.value) {
      case "week":
        await fetchWeekStatistics();
        break;
      case "month":
        await fetchMonthStatistics();
        break;
      case "year":
        await fetchYearStatistics();
        break;
    }
  } catch (error: any) {
    ElMessage({
      message: error.message || "获取统计数据失败",
      type: "error",
      plain: true,
    });
  } finally {
    loading.value = false;
  }
};

// 修改月份选择确认方法
const confirmMonthPicker = async (value: { selectedValues: string[] }) => {
  showMonthPicker.value = false;
  if (!value.selectedValues || value.selectedValues.length < 2) return;

  const year = parseInt(value.selectedValues[0]);
  const month = parseInt(value.selectedValues[1]);

  console.log("选择的月份:", year, month);

  // 同步更新 monthDate
  monthDate.value = new Date(year, month - 1);

  // 切换到月视图
  timeRange.value = "month";

  loading.value = true;
  try {
    // 直接调用 fetchMonthStatistics 函数来保持统一的更新流程
    await fetchMonthStatistics(year, month);
  } catch (error) {
    console.error("获取月度统计失败:", error);
    ElMessage.error("获取统计数据失败");
  } finally {
    loading.value = false;
  }
};

// 修改年份选择确认方法
const confirmYearPicker = async (value: { selectedValues: string[] }) => {
  showYearPicker.value = false;
  if (!value.selectedValues || !value.selectedValues[0]) return;

  const year = parseInt(value.selectedValues[0]);
  console.log("选择的年份:", year);

  // 同步更新 yearDate
  yearDate.value = new Date(year, 0);

  // 切换到年视图
  timeRange.value = "year";

  loading.value = true;
  try {
    // 直接调用 fetchYearStatistics 函数来保持统一的更新流程
    await fetchYearStatistics(year);
  } catch (error) {
    console.error("获取年度统计失败:", error);
    ElMessage.error("获取统计数据失败");
  } finally {
    loading.value = false;
  }
};

// 获取周统计数据
const fetchWeekStatistics = async () => {
  try {
    weekData.value = await getWeekStatistics();
    setTimeout(() => {
      initTrendChart();
      initPieCharts();
      updateTrendChart();
      updatePieCharts();
    }, 50);
  } catch (error: any) {
    console.error("获取周统计数据失败:", error);
    ElMessage({
      message: error.message || "获取周统计数据失败",
      type: "error",
      plain: true,
    });
  }
};

// 获取月度统计数据
const fetchMonthStatistics = async (
  year = new Date().getFullYear(),
  month = new Date().getMonth() + 1
) => {
  try {
    monthData.value = await getMonthStatistics(year, month);
    setTimeout(() => {
      initTrendChart();
      initPieCharts();
      updateTrendChart();
      updatePieCharts();
    }, 50);
  } catch (error: any) {
    console.error("获取月度统计数据失败:", error);
    ElMessage({
      message: error.message || "获取月度统计数据失败",
      type: "error",
      plain: true,
    });
  }
};

// 获取年度统计数据
const fetchYearStatistics = async (year = new Date().getFullYear()) => {
  try {
    yearData.value = await getYearStatistics(year);
    setTimeout(() => {
      initTrendChart();
      initPieCharts();
      updateTrendChart();
      updatePieCharts();
    }, 50);
  } catch (error: any) {
    console.error("获取年度统计数据失败:", error);
    ElMessage({
      message: error.message || "获取年度统计数据失败",
      type: "error",
      plain: true,
    });
  }
};

// 返回按钮处理
const onClickLeft = () => {
  router.back();
};

// 窗口大小变化时，重新调整图表大小
const resizeCharts = () => {
  trendChart?.resize();
  expensePieChart?.resize();
  incomePieChart?.resize();
};

// 添加点击空白处关闭tooltip的功能
const handleDocumentClick = (event: MouseEvent) => {
  // 检查点击是否在图表容器外
  if (
    trendChartRef.value &&
    !trendChartRef.value.contains(event.target as Node)
  ) {
    // 如果点击在趋势图外部，隐藏tooltip
    trendChart?.dispatchAction({
      type: "hideTip",
    });
  }

  // 检查点击是否在支出饼图容器外
  if (
    expensePieChartRef.value &&
    !expensePieChartRef.value.contains(event.target as Node)
  ) {
    // 如果点击在饼图外部，隐藏tooltip
    expensePieChart?.dispatchAction({
      type: "hideTip",
    });
  }

  // 检查点击是否在收入饼图容器外
  if (
    incomePieChartRef.value &&
    !incomePieChartRef.value.contains(event.target as Node)
  ) {
    // 如果点击在饼图外部，隐藏tooltip
    incomePieChart?.dispatchAction({
      type: "hideTip",
    });
  }
};

// 添加一个计算属性来控制滑块的位置
const sliderStyle = computed(() => {
  let position = 0;

  switch (timeRange.value) {
    case "week":
      position = 0;
      break;
    case "month":
      position = 1;
      break;
    case "year":
      position = 2;
      break;
  }

  return {
    transform: `translateX(${position * 100}%)`,
  };
});

// AI分析状态
const isAnalyzing = ref(false);

// AI分析处理函数
const handleAiAnalysis = async () => {
  if (isAnalyzing.value) return;

  try {
    isAnalyzing.value = true;
    ElMessage({
      message: "正在准备AI分析...",
      type: "info",
      plain: true,
    });

    // 获取并格式化数据
    let dataToAnalyze;
    let timeDescription;

    // 根据当前选择的时间范围获取数据并格式化
    switch (timeRange.value) {
      case "week":
        dataToAnalyze = formatAnalysisData(weekData.value);
        timeDescription = "过去一周";
        break;
      case "month":
        dataToAnalyze = formatAnalysisData(monthData.value);
        timeDescription = `${currentMonthDate.value[0]}年${currentMonthDate.value[1]}月`;
        break;
      case "year":
        dataToAnalyze = formatAnalysisData(yearData.value);
        timeDescription = `${currentYearDate.value[0]}年`;
        break;
    }

    // 创建新的聊天会话
    const conversationId = await createConversation(
      `${timeDescription}账单分析`
    );

    if (!conversationId) {
      // 使用 ElMessage 替换 showToast
      ElMessage({
        message: "创建AI分析会话失败",
        type: "error",
        plain: true,
      });
      return;
    }

    // 准备要发送到AI聊天页面的数据
    const analysisData = {
      data: dataToAnalyze,
      timeRange: timeRange.value,
      timeDescription: timeDescription,
    };

    // 将分析数据保存到localStorage，以便在AI聊天页面获取
    localStorage.setItem("billAnalysisData", JSON.stringify(analysisData));

    // 跳转到移动端AI聊天页面
    router.push({
      path: "/ai-chat-mobile",
      query: {
        conversationId: conversationId,
        mode: "analysis",
        timeRange: timeRange.value,
        timeDesc: timeDescription,
      },
    });
  } catch (error) {
    console.error("准备AI分析失败:", error);
    ElMessage({
      message: "启动AI分析失败，请稍后再试",
      type: "error",
      plain: true,
    });
  } finally {
    isAnalyzing.value = false;
  }
};

// 数据格式化函数
const formatAnalysisData = (data: any) => {
  // 创建一个深拷贝以避免修改原始数据
  const formattedData = JSON.parse(JSON.stringify(data));

  // 格式化顶层数字字段
  ["totalExpense", "totalIncome", "netIncome"].forEach((key) => {
    if (typeof formattedData[key] === "number") {
      formattedData[key] = Number(formattedData[key].toFixed(2));
    }
  });

  // 格式化支出分类详情
  if (formattedData.expenseCategoryDetails) {
    for (const category in formattedData.expenseCategoryDetails) {
      formattedData.expenseCategoryDetails[category] = Number(
        Number(formattedData.expenseCategoryDetails[category]).toFixed(2)
      );
    }
  }

  // 格式化收入分类详情
  if (formattedData.incomeCategoryDetails) {
    for (const category in formattedData.incomeCategoryDetails) {
      formattedData.incomeCategoryDetails[category] = Number(
        Number(formattedData.incomeCategoryDetails[category]).toFixed(2)
      );
    }
  }

  // 格式化每日数据
  if (formattedData.dailyData && Array.isArray(formattedData.dailyData)) {
    formattedData.dailyData = formattedData.dailyData.map(
      (day: { income: any; expense: any }) => ({
        ...day,
        income: Number(Number(day.income).toFixed(2)),
        expense: Number(Number(day.expense).toFixed(2)),
      })
    );
  }

  // 格式化月度数据
  if (formattedData.monthDetails && Array.isArray(formattedData.monthDetails)) {
    formattedData.monthDetails = formattedData.monthDetails.map(
      (month: { income: any; expense: any; netIncome: any }) => ({
        ...month,
        income: Number(Number(month.income).toFixed(2)),
        expense: Number(Number(month.expense).toFixed(2)),
        netIncome: Number(Number(month.netIncome || 0).toFixed(2)),
      })
    );
  }

  return formattedData;
};

// 生命周期钩子
onMounted(async () => {
  loading.value = true;
  try {
    await fetchWeekStatistics();

    // 初始化日期选择器的值
    const now = new Date();
    currentMonthDate.value = [
      now.getFullYear().toString(),
      (now.getMonth() + 1).toString().padStart(2, "0"),
    ];
    currentYearDate.value = [now.getFullYear().toString()];

    // 添加文档点击事件监听
    document.addEventListener("click", handleDocumentClick);
  } catch (error) {
    console.error("初始化数据失败:", error);
  } finally {
    loading.value = false;
  }

  window.addEventListener("resize", resizeCharts);
});

onUnmounted(() => {
  window.removeEventListener("resize", resizeCharts);
  // 移除文档点击事件监听
  document.removeEventListener("click", handleDocumentClick);

  trendChart?.dispose();
  expensePieChart?.dispose();
  incomePieChart?.dispose();
});
</script>

<style scoped>
.m-statistics-container {
  padding-bottom: 30px;
}

.time-selector {
  margin: 15px 16px;
}

/* 选择器容器 */
.selector-container {
  position: relative;
  margin-bottom: 15px;
  border-radius: 8px;
  background-color: #f5f7fa;
  padding: 4px;
  overflow: hidden;
}

.selector-tabs {
  display: flex;
  position: relative;
  height: 36px;
}

.selector-tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 1;
  position: relative;
  font-size: 14px;
  color: #606266;
  transition: color 0.3s;
  font-weight: 500;
}

.selector-tab.active {
  color: #fff;
}

/* 滑动指示器 */
.slider-indicator {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: 33.333%;
  background-color: #409eff;
  border-radius: 6px;
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.date-picker-container {
  margin-top: 12px;
}

.date-display {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px 12px;
  background-color: #f5f7fa;
  border-radius: 6px;
  cursor: pointer;
  color: #409eff;
  font-weight: 500;
}

.date-display .van-icon {
  margin-left: 8px;
}

.summary-cards {
  padding: 0 16px;
}

/* 新的自定义卡片样式 */
.custom-card {
  background-color: #fff;
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.card-title {
  font-size: 16px;
  color: #666;
  font-weight: 500;
}
.card-avg {
  font-size: 14px;
  color: cadetblue;
}

.card-amount {
  font-size: 18px;
  font-weight: bold;
}

.card-footer {
  margin-top: 4px;
}

/* 保留原有的文本颜色样式 */
.expense-text {
  color: #f56c6c;
}

.income-text {
  color: #67c23a;
}

.balance-text {
  color: #409eff;
}

.chart-container {
  margin: 16px;
  background-color: #fff;
  border-radius: 8px;
  padding: 16px 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.chart-title {
  text-align: center;
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 16px;
  color: #333;
}

.trend-chart {
  height: 300px;
}

.pie-chart {
  height: 280px;
}

.loading-container {
  padding: 40px 0;
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-container {
  padding: 40px 0;
}

/* 添加AI分析按钮样式 */
.ai-analysis-button {
  margin-top: 15px;
  width: 100%;
}

.ai-analysis-button .van-button {
  border-radius: 8px;
  padding: 8px 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.ai-analysis-button .van-icon {
  margin-right: 6px;
  font-size: 18px;
  vertical-align: -2px;
}
</style>
