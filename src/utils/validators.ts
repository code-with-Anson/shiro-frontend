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
