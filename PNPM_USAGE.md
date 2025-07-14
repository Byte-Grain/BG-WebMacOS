# 包管理工具使用说明

本项目强制使用 **pnpm** 作为包管理工具。

## 安装 pnpm

```bash
# 使用 npm 全局安装 pnpm
npm install -g pnpm

# 或使用 Corepack (Node.js 16.13+)
corepack enable
corepack prepare pnpm@latest --activate
```

## 常用命令

```bash
# 安装依赖
pnpm install

# 添加依赖
pnpm add <package-name>
pnpm add -D <package-name>  # 开发依赖

# 移除依赖
pnpm remove <package-name>

# 运行脚本
pnpm run dev
pnpm run build
pnpm run serve
```

## 为什么使用 pnpm？

1. **节省磁盘空间**：通过硬链接共享依赖
2. **更快的安装速度**：并行安装和缓存机制
3. **严格的依赖管理**：避免幽灵依赖问题
4. **更好的 monorepo 支持**

## 注意事项

- 请勿使用 `npm install` 或 `yarn install`
- 项目已配置 `preinstall` 脚本来阻止使用其他包管理工具
- 只提交 `pnpm-lock.yaml`，不要提交 `package-lock.json` 或 `yarn.lock`