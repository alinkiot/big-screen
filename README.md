# big-screen · 可视化大屏工作区

把"通用可视化大屏"与"工业 SCADA/HMI"两套体系整合进同一工作区，配套两个技能让 AI 知道怎么生成大屏。

```
big-screen/
├── vizlab/                    # 通用可视化大屏引擎（screen-picture-demo）
│   ├── src/screens/            #   7 套 3D 可视化大屏：风电/工厂/人口/巡检/农业/工业/园区
│   ├── src/shared/             #   VizLabRuntime + Observatory 框架
│   ├── config/screens.json     #   大屏注册表（构建入口）
│   ├── scripts/                #   Python 构建链（build.py）+ Node 开发服务
│   └── assets/                 #   本地依赖（d3/three）/预览图/纹理/模型
├── industrial/                # 工业大屏工作室（scada-deck）
│   ├── scenarios/              #   30 套离线可运行 SCADA/HMI 场景（独立 HTML）
│   ├── apps/                   #   showcase 体验入口 + scada-designer 设计器
│   ├── packages/               #   runtime / components / data-adapters / design-system
│   ├── vendor/                 #   本地依赖：Vue 3 / ECharts 5 / Three.js
│   └── docs/                   #   架构、截图、离线交付说明
└── skills/                    # 两个生成技能
    ├── bigscreen-studio/        #   通用大屏生成（flat 数据看板 / observatory 3D 孪生）
    └── industrial-screen/       #   工业大屏（5 模式 + 网关集成）
```

## 两个子系统的分工

### vizlab（通用可视化大屏引擎）

来自 [screen-picture-demo](https://github.com/alinkiot/screen-picture-demo)，7 套可交互 3D 大屏展厅，技术栈为 **Three.js + GLSL Shader + D3**。有完整的 Python 构建系统：模板拆分为 `template.html / styles.css / app.js / model.js`，构建后合并成单文件离线 HTML。

```bash
cd vizlab
npm ci && npm run setup        # 装依赖 + 建 .venv
npm run dev                    # 5173 预览 + 文件监听
npm run build                  # dist/ 网站 + dist/standalone/ 离线单文件
```

### industrial（工业大屏工作室）

来自 [scada-deck](https://github.com/zhengweixing/scada-deck)，30 套工业 SCADA/HMI 场景，技术栈为 **Vue 3 + ECharts 5 + Three.js**（全部本地固化在 `vendor/`）。每套场景都是独立 HTML，**无需构建，浏览器直接打开即用**。

```bash
open industrial/apps/showcase/index.html          # 横屏互动体验入口（30 套）
open industrial/apps/scada-designer/index.html    # SCADA 场景设计器
node industrial/../skills/industrial-screen/scripts/validate-dashboard.js industrial/scenarios   # 校验
```

## 两个技能

| 技能 | 位置 | 做什么 | 驱动 |
| --- | --- | --- | --- |
| **bigscreen-studio** | `skills/bigscreen-studio/` | 从零生成全新通用大屏。两预设：`flat`（纯数据看板，KPI+趋势+排行+三小图）/ `observatory`（3D 数字孪生，Three.js 场景+运营面板）。脚手架 → 写数据与场景 → 构建 → 截图自检 → 输出 `out/` 单文件 | 本地 `vizlab` 引擎（缺失时回退 GitHub 克隆） |
| **industrial-screen** | `skills/industrial-screen/` | 按工业领域规范生成 SCADA/HMI。5 模式 + 网关集成：`dashboard`（只读驾驶舱）/ `hmi-classic`（西门子博途经典上位机）/ `scada`（可写控制 Web SCADA）/ `light-3d`（浅色 3D 水务孪生）/ `local-panel`（单机就地控制屏） | 独立 HTML，遵循 ISA-101 / SBO / Faceplate / P&ID 图元库 |

### 怎么选技能

- **通用业务大屏**（销售/运营/物流/政务/园区/港口…，或"智慧XX大屏"）→ `bigscreen-studio`
- **工业监控 / SCADA / HMI / 上位机 / 就地控制屏**（水务/化工/能源/制造…）→ `industrial-screen`
- 拿不准通用还是工业：先看有没有"工艺流程、设备控制、操作防误"——有就工业，没有就通用。

### bigscreen-studio 用法

```bash
node skills/bigscreen-studio/scripts/scaffold.mjs \
  --id port-ops --preset flat --title "智慧港口运营中心"
# 编辑 vizlab/src/screens/port-ops/app.js（数据与面板）
node skills/bigscreen-studio/scripts/verify.mjs --id port-ops   # 构建+截图+自检 → out/port-ops/
```

### industrial-screen 用法

先按需求判断模式，再遵循对应契约开发独立 HTML，最后按模式校验：

```bash
node skills/industrial-screen/scripts/validate-dashboard.js industrial/scenarios   # dashboard / local-panel
node skills/industrial-screen/scripts/validate-hmi.js <html-file>                  # hmi-classic
node skills/industrial-screen/scripts/validate-scada.js <html-file>                # scada
node skills/industrial-screen/scripts/validate-light-3d-hmi.js <html-file>         # light-3d
```

## 许可

两个子系统均采用 MIT。详见 `vizlab/LICENSE` 与 `industrial/LICENSE`。
