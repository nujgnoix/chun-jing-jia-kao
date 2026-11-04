# 贡献指南

欢迎任何形式的贡献：反馈问题、补充题库、改进适老化体验、修正文档，或提交 Pull Request。

## 反馈问题

请在 [Issues](https://github.com/nujgnoix/chun-jing-jia-kao/issues) 中说明：

- 使用的 APP 版本 / APK 版本（Releases 里的 `apk-N` 编号）
- 手机型号与 Android 版本
- 具体操作步骤、期望结果与实际结果
- 如能附上截图最好

## 本地开发

需要 Node.js 20+（CI 使用 22）。

```bash
npm install
npm run dev      # 浏览器预览 H5，http://localhost:5173
npm run build    # 产出 www/ 静态资源
```

## 打包安卓

本地打包需要 JDK 21 与 Android SDK（platform 36 / build-tools 36.0.0）。
更简单的方式是**直接用 GitHub Actions**：向 `main` 推送代码会自动构建 APK 并发布到
[Releases](https://github.com/nujgnoix/chun-jing-jia-kao/releases)；也可在 Actions 页面手动触发 `Build Android APK`。

```bash
npm install
npx vite build --outDir www
npx cap add android
python3 scripts/patch-share-plugin.py   # 让分享目标在独立任务栈打开
npx cap copy android
cd android && ./gradlew assembleDebug
```

> `scripts/patch-share-plugin.py` 会 patch `@capacitor/share` 的原生源码，
> 让豆包 / 千问在独立任务栈打开，避免「分享后回不到驾考」。详见脚本内注释。

## 提交 PR

- 保持界面**极简、白底 + 单一主色 `#2196F3`**，不引入第三方 UI 库、广告或统计 SDK
- 面向长辈使用：字号、按钮触摸区、文案都要易读易懂，避免增加操作步骤
- 改动前端后请先 `npm run build` 确认通过
- 若改动影响界面，建议附上真机截图
- 题库 / 配图属于第三方素材，提交相关内容时请一并更新 [NOTICE.md](NOTICE.md)

## 行为准则

参与本项目请遵守 [Contributor Covenant](https://www.contributor-covenant.org/) 的基本精神：
友善、尊重、就事论事。本项目以「帮长辈安心学习」为初衷，讨论请保持耐心。

---

本项目以 [MIT License](LICENSE) 开源；第三方素材的授权边界见 [NOTICE.md](NOTICE.md)。
