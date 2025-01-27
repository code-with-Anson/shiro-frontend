//创建一个用于验证表单的规则接口

interface ValidationRule {
  required?: boolean;
  message?: string;
  pattern?: RegExp;
  validator?: (value: string) => boolean;
}

// 邮箱验证规则
export const emailRules: ValidationRule[] = [
  {
    required: true,
    message: "请填写邮箱",
  },
  {
    pattern: /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/,
    message: "请输入正确的邮箱地址",
  },
];

// 密码验证规则
export const passwordRules: ValidationRule[] = [
  { required: true, message: "请填写密码" },
  {
    validator: (value: string) => value.length >= 6 && value.length <= 15,
    message: "密码在6到15位之间",
  },
];

// 昵称验证规则
export const usernameRules: ValidationRule[] = [
  { required: true, message: "请填写昵称" },
  {
    validator: (value: string) => value.length >= 1 && value.length <= 8,
    message: "昵称在1到8位之间",
  },
];

// 验证码验证规则
export const verificationCodeRules: ValidationRule[] = [
  {
    required: true,
    message: "请填写验证码",
  },
  {
    pattern: /^\d{6}$/,
    message: "验证码是6位数字",
  },
];

// 金额格式化函数
export const formatAmount = (value: string): string => {
  // 移除非数字字符（保留小数点）
  let formatted = value.replace(/[^\d.]/g, "");

  // 确保只有一个小数点
  const parts = formatted.split(".");
  if (parts.length > 2) {
    formatted = parts[0] + "." + parts.slice(1).join("");
  }

  // 限制小数位数为2位
  if (parts.length === 2) {
    formatted = parts[0] + "." + parts[1].slice(0, 2);
  }

  // 限制整数部分为9位
  if (parts[0].length > 9) {
    formatted = parts[0].slice(0, 9) + (parts[1] ? "." + parts[1] : "");
  }

  return formatted;
};

// 金额验证函数
const validateAmount = (value: string) => {
  const num = parseFloat(value);
  return !isNaN(num) && num > 0 && num < 100000000;
};

// 金额验证规则
export const amountRules: ValidationRule[] = [
  { required: true, message: "请填写金额" },
  {
    validator: validateAmount,
    message: "请输入0-1亿元之间的数字",
  },
];
