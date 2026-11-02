# 纯净驾考

为大字号、无干扰而生的科目一 / 科目四 学习 App。专为长辈（如帮爸妈考驾照摇号）设计。

## 特点
- **大字适老**：默认超大字号，练习 / 考试页可再微调
- **纯净无广告**：无弹窗、无诱导充值、无诱导分享
- **离线可用**：题库内置本地，断网也能刷题
- **一键问 AI**：遇到不会的题，一键调起系统分享，转发给豆包 / 千问 讲解

## 功能
- 科目一 / 科目四 一键切换
- 顺序练习（选完即时反馈 + 解析）
- 模拟考试（科一 100 题 / 45 分，科四 50 题 / 30 分，90 分合格判定）
- 错题本 / 收藏
- 字体调节

## 技术栈
Vue 3 + Vite + Capacitor。H5 可直接用浏览器打开；可打包为安卓 App。

## 本地运行（H5）
```bash
npm install
npm run dev      # 本地预览 http://localhost:5173
npm run build    # 产出 www/ 静态包
```

## 打包安卓 APK
```bash
npm install
npx cap add android     # 生成本地安卓工程
npx cap sync android   # 同步最新 web 资源与插件
npx cap build android  # 产出 android/app/build/outputs/apk/debug/app-debug.apk
```
或 `npx cap open android` 用 Android Studio 打开后运行（开启「未知来源安装」即可装到手机）。

## 题库说明
题库整理自公开开源数据，合计科目一 2545 题 + 科目四 1833 题，答案已统一整理为字母格式。
考试以公安部最新官方题库为准；临考前建议用最新驾考 App 再刷一遍补漏。

> 题库基于 2022 年法规整理，法规每年会有微调，请留意时效性。

## 致谢（数据来源）
本项目的题库与配图均来自以下开源项目与公开资源的无私分享，在此一并郑重感谢：

- **科目一 / 科目四 题库文本**：[doupoa/DrivingTestSubjectOne](https://github.com/doupoa/DrivingTestSubjectOne)（`q.json` 同时包含科目一 2545 题与科目四 1833 题）。
- **科目一 题库补充**：[AgentMystia/driving-test-subject1](https://github.com/AgentMystia/driving-test-subject1)（科目一专题目库）。
- **科目四 题库备选**：[GaoJiasheng/driving-quiz-app](https://github.com/GaoJiasheng/driving-quiz-app)（其 `cn_subject4_v1.json` 作为科目四对照与备选来源）。
- **题目配图**：车态联 CDN（`app.static.public.chetailian.com`，chetailian.com）提供的题目图片资源。

没有以上开源作者与资源方的付出，就没有这份纯净、离线的题库。感谢他们！

## 开源声明
本项目仅供学习交流，题库与配图的版权归原作者 / 原平台所有。如涉及授权问题，请联系我们删除。
