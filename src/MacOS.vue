<template>
  <div class="mac-os"
       @mousedown.self="boot"
       @contextmenu.prevent="onContextShow()">
    <transition name="fade">
      <Bg v-if="isBg"></Bg>
    </transition>
    <transition name="fade">
      <Loading v-if="isLoading"
               @loaded="loaded"></Loading>
    </transition>
    <transition name="fade">
      <Login v-if="isLogin"
             @logined="logined"></Login>
    </transition>
    <transition name="fade">
      <DeskTop
        v-if="isDeskTop"
        @lockScreen="lockScreen"
        @shutdown="shutdown"
        @logout="logout"
        @launchpad="launchpad"
      ></DeskTop>
    </transition>
    <transition name="fade">
      <LaunchPad v-if="isLaunchPad"></LaunchPad>
    </transition>
  </div>
</template>

<style scoped lang="scss">
.mac-os {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
}
</style>
<script lang="ts" setup>
import Bg from "@/components/Bg.vue";
import LaunchPad from "@/components/LaunchPad.vue";
import Loading from "@/components/Loading.vue";
import Login from "@/components/Login.vue";
import DeskTop from "@/components/DeskTop.vue";

import { ref, onMounted } from 'vue'

const isBg = ref<boolean>(true)
const isLoading = ref<boolean>(false)
const isLogin = ref<boolean>(false)
const isDeskTop = ref<boolean>(false)
const isLaunchPad = ref<boolean>(false)

onMounted(() => {
  boot();
})

const onContextShow = (): void => {
  console.log("onContextShow");
}

const boot = (): void => {
  isLoading.value = true;
}

const loaded = (): void => {
  isLoading.value = false;
  isBg.value = true;
  isLogin.value = true;
}

const logined = (): void => {
  isLogin.value = false;
  isDeskTop.value = true;
}

const lockScreen = (): void => {
  isLogin.value = true;
}

const launchpad = (show: boolean): void => {
  isLaunchPad.value = show;
}

const logout = (): void => {
  localStorage.removeItem("user_name");
  isDeskTop.value = false;
  isLogin.value = true;
}

const shutdown = (): void => {
  localStorage.removeItem("user_name");
  isDeskTop.value = false;
  isLogin.value = false;
  isLoading.value = false;
  isBg.value = false;
}
</script>
