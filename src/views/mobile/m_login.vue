<template>
  <div>
    <h1>移动端用户登录页面</h1>
    <van-form @submit="onSubmit">
      <van-cell-group inset>
        <van-field
          v-model="email"
          name="email"
          label="邮箱"
          placeholder="邮箱"
          :rules="emailRules"
        />
        <van-field
          v-model="password"
          type="password"
          name="password"
          label="密码"
          placeholder="密码"
          :rules="passwordRules"
        />
      </van-cell-group>
      <div style="margin: 2rem; width: 5rem">
        <van-button round block type="primary" native-type="submit">
          提交
        </van-button>
      </div>
    </van-form>
  </div>
</template>

<style></style>

<script setup lang="ts">
import { ref } from "vue";
import { emailRules, passwordRules } from "@/utils/validators";

const email = ref("");
const password = ref("");
const onSubmit = (values: { email: string; password: string }) => {
  console.log("提交" + values);
  console.log("提交的邮箱: " + values.email);
  console.log("提交的密码: " + values.password);
};
</script>
