<template>
  <div class="statistics-container">
    <!-- 头部标题和时间范围选择 -->
    <div class="header-container">
      <div class="title-section">
        <h1>账单统计</h1>
      </div>
      <div class="time-selector">
        <el-radio-group v-model="timeRange" @change="handleTimeRangeChange">
          <el-radio-button label="week">一周</el-radio-button>
          <el-radio-button label="month">月度</el-radio-button>
          <el-radio-button label="year">全年</el-radio-button>
        </el-radio-group>

        <!-- 月度选择器 -->
        <el-config-provider :locale="zhCn">
          <el-date-picker
            v-if="timeRange === 'month'"
            v-model="monthDate"
            type="month"
            format="YYYY年MM月"
            value-format="YYYY-MM"
            placeholder="选择月份"
            style="margin-left: 16px; width: 150px"
            @change="handleMonthChange"
          />
        </el-config-provider>

        <!-- 年度选择器 -->
        <el-config-provider :locale="zhCn">
          <el-date-picker
            v-if="timeRange === 'year'"
            v-model="yearDate"
            type="year"
            format="YYYY年"
            value-format="YYYY"
            placeholder="选择年份"
            style="margin-left: 16px; width: 120px"
            @change="handleYearChange"
          />
        </el-config-provider>

        <!-- 添加AI分析按钮 -->
        <el-button
          type="primary"
          :icon="ChatLineRound"
          @click="handleAiAnalysis"
          style="margin-left: 16px"
          :loading="isAnalyzing"
        >
          AI分析
        </el-button>
      </div>
    </div>

    <!-- 加载状态 -->
    <el-skeleton :loading="loading" animated :count="3" :throttle="500">
      <template #template>
        <div class="skeleton-container">
          <el-skeleton-item
            variant="rect"
            style="height: 300px; margin-bottom: 20px"
          />
          <div style="display: flex; justify-content: space-between">
            <el-skeleton-item
              variant="rect"
              style="width: 48%; height: 300px"
            />
            <el-skeleton-item
              variant="rect"
              style="width: 48%; height: 300px"
            />
          </div>
        </div>
      </template>

      <template #default>
        <!-- 统计卡片区域 -->
        <div class="summary-cards">
          <el-card class="summary-card" shadow="hover">
            <div class="card-content expense">
              <div class="card-title">总支出</div>
              <div class="card-amount">
                ¥{{ formatAmount(summaryData.totalExpense) }}
              </div>
              <div v-if="timeRange === 'month'" class="card-avg">
                <span
                  >日均支出: ¥{{
                    calculateDailyAvg(summaryData.totalExpense)
                  }}</span
                >
              </div>
              <div v-if="timeRange === 'year'" class="card-avg">
                <span
                  >月均支出: ¥{{
                    calculateMonthlyAvg(summaryData.totalExpense)
                  }}</span
                >
              </div>
            </div>
          </el-card>

          <el-card class="summary-card" shadow="hover">
            <div class="card-content income">
              <div class="card-title">总收入</div>
              <div class="card-amount">
                ¥{{ formatAmount(summaryData.totalIncome) }}
              </div>
              <div v-if="timeRange === 'month'" class="card-avg">
                <span
                  >日均收入: ¥{{
                    calculateDailyAvg(summaryData.totalIncome)
                  }}</span
                >
              </div>
              <div v-if="timeRange === 'year'" class="card-avg">
                <span
                  >月均收入: ¥{{
                    calculateMonthlyAvg(summaryData.totalIncome)
                  }}</span
                >
              </div>
            </div>
          </el-card>

          <el-card class="summary-card" shadow="hover">
            <div class="card-content balance">
              <div class="card-title">收支结余</div>
              <div class="card-amount">
                ¥{{ formatAmount(summaryData.netIncome) }}
              </div>
              <div v-if="summaryData.billCount" class="card-avg">
                <span>账单数量: {{ summaryData.billCount }}笔</span>
              </div>
            </div>
          </el-card>
        </div>

        <!-- 趋势图区域 -->
        <el-card class="chart-card" shadow="hover">
          <div class="chart-title">收支趋势</div>
          <div ref="trendChartRef" class="trend-chart"></div>
        </el-card>

        <!-- 分类统计区域 -->
        <div class="category-section">
          <el-card class="chart-card" shadow="hover">
            <div class="chart-title">支出分类占比</div>
            <div ref="expensePieChartRef" class="pie-chart"></div>
          </el-card>

          <el-card class="chart-card" shadow="hover">
            <div class="chart-title">收入分类占比</div>
            <div ref="incomePieChartRef" class="pie-chart"></div>
          </el-card>
        </div>

        <!-- 无数据提示 -->
        <el-empty v-if="showEmpty" description="暂无数据" :image-size="200">
        </el-empty>
      </template>
    </el-skeleton>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, computed } from "vue";
import { useRouter } from "vue-router"; // 添加路由导入
import { ElMessage } from "element-plus";
// 导入 Element Plus 中文语言包
import zhCn from "element-plus/dist/locale/zh-cn.mjs";
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
// 导入ChatLineRound图标和MarkdownIt
import { ChatLineRound } from "@element-plus/icons-vue";
import MarkdownIt from "markdown-it";
// 导入AI账单分析API
import { analyzeBillData, createConversation } from "@/api/aiChat";

const router = useRouter();

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

// 创建markdown-it实例
const md = new MarkdownIt({
  html: true,
  breaks: true,
  linkify: true,
  typographer: true,
});

// 渲染markdown函数
const renderMarkdown = (content: any) => {
  if (!content) return "";
  return md.render(content);
};

// 时间范围选择
const timeRange = ref<"week" | "month" | "year">("week");
const monthDate = ref<Date | string>(new Date());
const yearDate = ref<Date | string>(new Date());
const loading = ref(true);
const isAnalyzing = ref(false);
const analysisDialogVisible = ref(false);
const analysisResult = ref<string | null>(null);

// 图表DOM引用
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
  return amount.toFixed(2);
};

// 计算日均值
const calculateDailyAvg = (total: number) => {
  let year, month;

  if (typeof monthDate.value === "string") {
    // 处理字符串格式 "YYYY-MM"
    const parts = monthDate.value.split("-");
    year = parseInt(parts[0]);
    month = parseInt(parts[1]) - 1; // 月份从0开始计数
  } else if (monthDate.value instanceof Date) {
    // 处理Date对象
    year = monthDate.value.getFullYear();
    month = monthDate.value.getMonth();
  } else {
    // 默认使用当前年月
    const currentDate = new Date();
    year = currentDate.getFullYear();
    month = currentDate.getMonth();
  }

  // 计算指定月份的天数
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  return (total / daysInMonth).toFixed(2);
};

// 计算月均值
const calculateMonthlyAvg = (total: number) => {
  // 如果是显示整年的数据，就除以12，如果是显示部分月份的数据，就除以实际的月份数
  const monthCount = yearData.value.monthDetails
    ? yearData.value.monthDetails.length
    : 12;
  return (total / (monthCount || 1)).toFixed(2);
};

// 初始化趋势图
const initTrendChart = () => {
  if (!trendChartRef.value) return;

  trendChart = echarts.init(trendChartRef.value);

  const option: echarts.EChartsOption = {
    tooltip: {
      trigger: "axis",
      axisPointer: {
        type: "shadow",
      },
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
    },
    grid: {
      left: "3%",
      right: "4%",
      bottom: "3%",
      containLabel: true,
    },
    xAxis: {
      type: "category",
      data: [],
    },
    yAxis: {
      type: "value",
      name: "金额 (¥)",
    },
    series: [
      {
        name: "收入",
        type: "line",
        smooth: true,
        emphasis: {
          focus: "series",
        },
        itemStyle: {
          color: "#67C23A",
        },
        data: [],
      },
      {
        name: "支出",
        type: "line",
        smooth: true,
        emphasis: {
          focus: "series",
        },
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
      orient: "vertical",
      left: "left",
      type: "scroll",
    },
    series: [
      {
        name: "支出分类",
        type: "pie",
        radius: ["40%", "70%"],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: "#fff",
          borderWidth: 2,
        },
        label: {
          show: false,
          position: "center",
        },
        emphasis: {
          label: {
            show: true,
            fontSize: "18",
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

  const incomeOption: echarts.EChartsOption = {
    tooltip: {
      trigger: "item",
      formatter: "{b}: ¥{c} ({d}%)",
    },
    legend: {
      orient: "vertical",
      left: "left",
      type: "scroll",
    },
    series: [
      {
        name: "收入分类",
        type: "pie",
        radius: ["40%", "70%"],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: "#fff",
          borderWidth: 2,
        },
        label: {
          show: false,
          position: "center",
        },
        emphasis: {
          label: {
            show: true,
            fontSize: "18",
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
    // 处理月份日期，兼容字符串和Date对象
    let year, month;

    if (typeof monthDate.value === "string") {
      // 处理字符串格式 "YYYY-MM"
      const parts = monthDate.value.split("-");
      year = parseInt(parts[0]);
      month = parseInt(parts[1]) - 1; // 月份从0开始计数
    } else {
      // 处理Date对象
      year = monthDate.value.getFullYear();
      month = monthDate.value.getMonth();
    }

    // 计算指定月份的天数
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let i = 1; i <= daysInMonth; i++) {
      xAxisData.push(i + "日");
      // 假设后端返回了每日的收支数据
      const dayData = (monthData.value.dailyData || []).find((d: any) => {
        if (!d.date) return false;
        const date = new Date(d.date);
        return date.getDate() === i;
      });

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
      customClass: "small-message",
    });
  } finally {
    loading.value = false;
  }
};

// 处理月份变化
const handleMonthChange = async () => {
  if (!monthDate.value) return;

  loading.value = true;
  try {
    let year, month;

    if (typeof monthDate.value === "string") {
      // 处理字符串格式 "YYYY-MM"
      const parts = monthDate.value.split("-");
      year = parseInt(parts[0]);
      month = parseInt(parts[1]);
    } else {
      // 处理Date对象
      year = monthDate.value.getFullYear();
      month = monthDate.value.getMonth() + 1;
    }

    await fetchMonthStatistics(year, month);
  } catch (error: any) {
    ElMessage({
      message: error.message || "获取月度统计数据失败",
      type: "error",
      customClass: "small-message",
    });
  } finally {
    loading.value = false;
  }
};

// 处理年份变化
const handleYearChange = async () => {
  if (!yearDate.value) return;

  loading.value = true;
  try {
    let year;

    if (typeof yearDate.value === "string") {
      // 处理字符串格式 "YYYY"
      year = parseInt(yearDate.value);
    } else {
      // 处理Date对象
      year = yearDate.value.getFullYear();
    }

    await fetchYearStatistics(year);
  } catch (error: any) {
    ElMessage({
      message: error.message || "获取年度统计数据失败",
      type: "error",
      customClass: "small-message",
    });
  } finally {
    loading.value = false;
  }
};

// 获取周统计数据
const fetchWeekStatistics = async () => {
  try {
    weekData.value = await getWeekStatistics();
    // 使用 nextTick 确保 DOM 更新后再更新图表
    await nextTick();
    updateTrendChart();
    updatePieCharts();
  } catch (error: any) {
    console.error("获取周统计数据失败:", error);
    ElMessage({
      message: error.message || "获取周统计数据失败",
      type: "error",
      customClass: "small-message",
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
    // 使用 nextTick 确保 DOM 更新后再更新图表
    await nextTick();
    updateTrendChart();
    updatePieCharts();
  } catch (error: any) {
    console.error("获取月度统计数据失败:", error);
    ElMessage({
      message: error.message || "获取月度统计数据失败",
      type: "error",
      customClass: "small-message",
    });
  }
};

// 获取年度统计数据
const fetchYearStatistics = async (year = new Date().getFullYear()) => {
  try {
    yearData.value = await getYearStatistics(year);
    // 使用 nextTick 确保 DOM 更新后再更新图表
    await nextTick();
    updateTrendChart();
    updatePieCharts();
  } catch (error: any) {
    console.error("获取年度统计数据失败:", error);
    ElMessage({
      message: error.message || "获取年度统计数据失败",
      type: "error",
      customClass: "small-message",
    });
  }
};

// 窗口大小变化时，重新调整图表大小
const resizeCharts = () => {
  trendChart?.resize();
  expensePieChart?.resize();
  incomePieChart?.resize();
};

// AI分析处理函数
const handleAiAnalysis = async () => {
  if (isAnalyzing.value) return;

  try {
    isAnalyzing.value = true;

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
        timeDescription = `${monthData.value.year}年${monthData.value.month}月`;
        break;
      case "year":
        dataToAnalyze = formatAnalysisData(yearData.value);
        timeDescription = `${yearData.value.year}年`;
        break;
    }

    // 创建新的聊天会话
    const conversationId = await createConversation(
      `${timeDescription}账单分析`
    );

    if (!conversationId) {
      ElMessage.error("创建AI分析会话失败");
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

    // 跳转到AI聊天页面
    router.push({
      name: "ai_chat",
      query: {
        conversationId: conversationId,
        mode: "analysis",
        timeRange: timeRange.value,
        timeDesc: timeDescription,
      },
    });
  } catch (error) {
    console.error("准备AI分析失败:", error);
    ElMessage.error("启动AI分析失败，请稍后再试");
  } finally {
    isAnalyzing.value = false;
  }
};

// 添加数据格式化函数
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
    formattedData.monthDetails = formattedData.monthDetails.map((month) => ({
      ...month,
      income: Number(Number(month.income).toFixed(2)),
      expense: Number(Number(month.expense).toFixed(2)),
      netIncome: Number(Number(month.netIncome || 0).toFixed(2)),
    }));
  }

  return formattedData;
};

// 生命周期钩子
onMounted(async () => {
  // 确保 DOM 准备好后再初始化图表
  await nextTick();
  initTrendChart();
  initPieCharts();

  window.addEventListener("resize", resizeCharts);

  loading.value = true;
  try {
    // 初始加载周数据
    await fetchWeekStatistics();
  } catch (error) {
    console.error("初始化数据失败:", error);
  } finally {
    loading.value = false;
  }
});

onUnmounted(() => {
  window.removeEventListener("resize", resizeCharts);
  trendChart?.dispose();
  expensePieChart?.dispose();
  incomePieChart?.dispose();
});
</script>

<style scoped>
.statistics-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.header-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.title-section h1 {
  margin: 0;
  color: #333;
  font-size: 24px;
}

.time-selector {
  display: flex;
  align-items: center;
}

.summary-cards {
  display: flex;
  gap: 20px;
  margin-bottom: 24px;
}

.summary-card {
  flex: 1;
}

.card-content {
  padding: 16px;
  text-align: center;
}

.card-title {
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
}

.card-amount {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 8px;
}

.expense .card-amount {
  color: #f56c6c;
}

.income .card-amount {
  color: #67c23a;
}

.balance .card-amount {
  color: #409eff;
}

.card-avg {
  font-size: 12px;
  color: #999;
}

.chart-card {
  margin-bottom: 24px;
}

.chart-title {
  padding: 12px 0;
  font-size: 16px;
  font-weight: bold;
  text-align: center;
  border-bottom: 1px solid #eee;
  color: #333;
}

.trend-chart {
  height: 400px;
  width: 100%;
}

.category-section {
  display: flex;
  gap: 20px;
  margin-bottom: 24px;
}

.category-section .chart-card {
  flex: 1;
  margin-bottom: 0;
}

.pie-chart {
  height: 300px;
  width: 100%;
}

.skeleton-container {
  width: 100%;
  padding: 20px 0;
}

.ai-analysis-content {
  min-height: 300px;
  max-height: 60vh;
  overflow-y: auto;
  padding: 16px;
}

.analysis-loading {
  padding: 20px;
}

.text-center {
  text-align: center;
  margin-top: 20px;
  color: #909399;
}

:deep(.markdown-body) {
  font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Helvetica, Arial,
    sans-serif;
  font-size: 16px;
  line-height: 1.6;
  word-wrap: break-word;
  padding: 16px;
}

:deep(.markdown-body h1),
:deep(.markdown-body h2),
:deep(.markdown-body h3),
:deep(.markdown-body h4) {
  margin-top: 24px;
  margin-bottom: 16px;
  font-weight: 600;
  line-height: 1.25;
}

:deep(.markdown-body table) {
  border-collapse: collapse;
  width: 100%;
  margin: 16px 0;
}

:deep(.markdown-body table th),
:deep(.markdown-body table td) {
  border: 1px solid #dfe2e5;
  padding: 6px 13px;
}

:deep(.markdown-body table tr:nth-child(2n)) {
  background-color: #f6f8fa;
}

.analysis-result {
  margin-top: 20px;
}

.dialog-footer {
  text-align: right;
}

@media (max-width: 768px) {
  .header-container {
    flex-direction: column;
    align-items: flex-start;
  }

  .time-selector {
    margin-top: 16px;
  }

  .summary-cards,
  .category-section {
    flex-direction: column;
  }

  .summary-card,
  .category-section .chart-card {
    margin-bottom: 20px;
  }

  .category-section .chart-card:last-child {
    margin-bottom: 0;
  }
}

.markdown-body {
  font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Helvetica, Arial,
    sans-serif;
  line-height: 1.6;
  word-wrap: break-word;
}

.markdown-body h1 {
  margin-top: 0;
  padding-bottom: 0.3em;
  font-size: 2em;
  border-bottom: 1px solid #eaecef;
}

.markdown-body h2 {
  padding-bottom: 0.3em;
  font-size: 1.5em;
  border-bottom: 1px solid #eaecef;
}

.markdown-body h3 {
  font-size: 1.25em;
}

.markdown-body ul,
.markdown-body ol {
  padding-left: 2em;
}

.markdown-body table {
  width: 100%;
  border-collapse: collapse;
  margin: 16px 0;
}

.markdown-body table th,
.markdown-body table td {
  border: 1px solid #dfe2e5;
  padding: 6px 13px;
  text-align: left;
}

.markdown-body table tr:nth-child(2n) {
  background-color: #f6f8fa;
}
</style>
