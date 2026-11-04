# 第三方素材声明 / Third-Party Assets Notice

本项目采用 [MIT License](LICENSE)，但 **MIT 授权范围仅覆盖本项目原创的源代码与文档**。
以下第三方素材**不在 MIT 授权范围内**，其版权归各自原作者 / 原平台所有：

| 素材 | 位置 | 来源 |
| --- | --- | --- |
| 科目一 / 科目四 题库文本（2545 + 1833 题） | `public/bank.json` | [doupoa/DrivingTestSubjectOne](https://github.com/doupoa/DrivingTestSubjectOne)（`q.json`），并参考 [AgentMystia/driving-test-subject1](https://github.com/AgentMystia/driving-test-subject1)、[GaoJiasheng/driving-quiz-app](https://github.com/GaoJiasheng/driving-quiz-app) |
| 题目配图（1428 张） | `public/images/` | 车态联 CDN（`app.static.public.chetailian.com`，chetailian.com） |

## 说明

- 这些素材仅为让 App 可以**离线刷题**而随项目附带，我们**不主张**对它们拥有任何权利，也**无法**以 MIT 许可再授权给第三方。
- 各上游仓库的授权条款请以它们自身的 LICENSE 为准；题目配图的使用条款请以车态联平台为准。
- **如需二次分发或商用，请自行向上游确认授权**，必要时移除 `public/bank.json` 与 `public/images/` 后仅使用本项目的源代码。
- 题库基于 2022 年前后法规整理，法规每年可能微调；**实际考试以公安部最新官方题库为准**。
- 若任何权利方认为附带素材不妥，请通过 GitHub Issue 联系，我们会及时移除。

## English

This project is [MIT licensed](LICENSE), but the MIT grant covers **only the
original source code and documentation** written for this project. It does
**not** cover the question bank (`public/bank.json`) or the question images
(`public/images/`), which originate from the third parties listed above and
remain the property of their respective owners. Those assets are bundled
solely so the app can work offline. Before redistributing or using them
commercially, verify the upstream licensing yourself.
