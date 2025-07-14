<template>
  <div class="login">
    <div class="language-switcher-container">
      <LanguageSwitcher />
    </div>
    <div class="head" :style="{ backgroundImage: 'url(' + headImage + ')' }"></div>
    <div class="message">
      {{ haveSavedUserName ? user_name : $t('login.welcome') }}
    </div>
    <div class="form">
      <div class="item" v-if="!haveSavedUserName" :class="isUserNameError ? 'error' : ''">
        <input class="account" :placeholder="$t('login.username')" type="email" v-model="user_name"
          @keyup.enter="login" />
      </div>
      <div class="item" :class="isUserPasswordError ? 'error' : ''">
        <input class="password" :placeholder="$t('login.password')" type="password" v-model="user_password"
          :class="user_password ? 'password-in' : ''" @keyup.enter="login" />
        <i class="login-button iconfont icon-icon_send" :class="user_password ? 'click-enable' : ''" @click="login"></i>
      </div>
    </div>
    <div class="guest-login">
      <button class="guest-btn" @click="guest">{{ $t('login.guest') }}</button>
    </div>
  </div>
</template>

<style scoped lang="scss">
  ::-webkit-input-placeholder {
    color: #fff;
  }

  ::-moz-placeholder {
    color: #fff;
  }

  :-ms-input-placeholder {
    color: #fff;
  }

  .login {
    position: fixed;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    color: white;
    margin-top: -100px;
    z-index: 99999;
    backdrop-filter: blur(100px);

    .language-switcher-container {
      position: absolute;
      top: 30px;
      right: 30px;
    }

    .guest-login {
      margin-top: 30px;

      .guest-btn {
        background-color: rgba(255, 255, 255, 0.2);
        border: 1px solid rgba(255, 255, 255, 0.3);
        color: white;
        padding: 8px 20px;
        border-radius: 20px;
        cursor: pointer;
        font-size: 14px;
        transition: all 0.3s ease;

        &:hover {
          background-color: rgba(255, 255, 255, 0.3);
          border-color: rgba(255, 255, 255, 0.5);
        }
      }
    }

    .head {
      background-size: 40% auto;
      background-position: center center;
      height: 150px;
      width: 150px;
      border-radius: 100%;
      box-shadow: 0px 0px 5px 5px rgba(0, 0, 0, 0.1);
      margin-top: -50px;
    }

    .message {
      margin-top: 20px;
      font-size: 20px;
      text-shadow: 0px 0px 2px 2px rgba(0, 0, 0, 0.3);
      color: #eee;
      margin-bottom: 50px;
    }

    .form {
      display: flex;
      flex-direction: column;
      align-items: center;

      .error {
        animation: loginErrorAnimation 0.2s ease 3;
      }

      .item {
        vertical-align: middle;
        position: relative;
        width: 250px;
        display: flex;
        flex-direction: row;
        justify-content: flex-start;
        align-items: center;
        overflow: hidden;

        input {
          color: white;
          outline: none;
          border: none;
          margin: 5px;
          font-size: 16px;
          background-color: rgba(255, 255, 255, 0.3);
          padding: 8px 24px;
          border-radius: 20px;
          box-shadow: 0px 0px 5px rgba(0, 0, 0, 0.1);
          width: 100%;
        }

        .password-in {
          width: 155px;
        }

        .password {
          transition: width 0.3s;
        }

        .login-button {
          position: absolute;
          top: 5px;
          right: -50px;
          transition: right 0.3s;
        }

        .iconfont {
          vertical-align: middle;
          display: inline-block;
          background-color: rgba(255, 255, 255, 0.3);
          font-size: 18px;
          border-radius: 100%;
          width: 36px;
          height: 36px;
          text-align: center;
          line-height: 36px;
          cursor: pointer;
          box-shadow: 0px 0px 5px rgba(0, 0, 0, 0.1);
        }

        .iconfont:hover {
          background-color: rgba(255, 255, 255, 0.5);
        }

        .click-enable {
          right: 0;
        }
      }
    }
  }
</style>
<script setup>
  import { ref, onMounted } from 'vue'
  import bgImageUrl from '@/asset/img/bg.jpg'
  import tool from '@/utils/tool'
  // import LanguageSwitcher from './business/LanguageSwitcher'
  import { useUtils } from '@/composables/useUtils'

  const emit = defineEmits(['logined'])
  const { storage } = useUtils()

  const headImage = ref(bgImageUrl)
  const user_name = ref('')
  const user_password = ref('')
  const haveSavedUserName = ref(false)
  const isUserNameError = ref(false)
  const isUserPasswordError = ref(false)

  const guest = () => {
    storage.set('user_name', 'Guest')
    emit('logined')
  }

  const login = () => {
    if (!user_name.value) {
      isUserNameError.value = true
      setTimeout(() => {
        isUserNameError.value = false
      }, 1000)
      return
    }
    if (!user_password.value) {
      isUserPasswordError.value = true
      setTimeout(() => {
        isUserPasswordError.value = false
      }, 1000)
      return
    }

    tool.saveAccessToken('guest')
    emit('logined')
    storage.set('user_name', user_name.value)
  }

  onMounted(() => {
    haveSavedUserName.value = false
    const savedUserName = storage.get('user_name')
    if (savedUserName) {
      user_name.value = savedUserName
      haveSavedUserName.value = true
    }
  })
</script>