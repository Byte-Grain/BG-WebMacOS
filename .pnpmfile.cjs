// pnpm 配置文件
// 确保项目只使用 pnpm 作为包管理工具

module.exports = {
  hooks: {
    readPackage(pkg) {
      // 确保所有依赖都通过 pnpm 安装
      return pkg;
    }
  }
};