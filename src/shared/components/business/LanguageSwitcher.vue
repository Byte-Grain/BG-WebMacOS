<template>
  <div class="language-switcher">
    <el-dropdown @command="handleLanguageChange">
      <span class="el-dropdown-link">
        <el-icon><Platform /></el-icon>
        {{ currentLanguageLabel }}
        <el-icon class="el-icon--right"><arrow-down /></el-icon>
      </span>
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item command="zh" :disabled="locale === 'zh'">
            中文
          </el-dropdown-item>
          <el-dropdown-item command="en" :disabled="locale === 'en'">
            English
          </el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Platform, ArrowDown } from '@element-plus/icons-vue'

const { locale } = useI18n()

const currentLanguageLabel = computed(() => {
  return locale.value === 'zh' ? '中文' : 'English'
})

const handleLanguageChange = (command: string) => {
  locale.value = command
  // 保存到本地存储
  localStorage.setItem('language', command)
}

// 从本地存储恢复语言设置
const savedLanguage = localStorage.getItem('language')
if (savedLanguage && (savedLanguage === 'zh' || savedLanguage === 'en')) {
  locale.value = savedLanguage
}
</script>

<style scoped>
.language-switcher {
  display: inline-block;
}

.el-dropdown-link {
  cursor: pointer;
  color: var(--el-color-primary);
  display: flex;
  align-items: center;
  font-size: 14px;
}

.el-dropdown-link:hover {
  color: var(--el-color-primary-light-3);
}
</style>
