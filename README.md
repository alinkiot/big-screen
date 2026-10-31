# big-screen · 工业可视化大屏工作区

把**通用可视化大屏**与**工业 SCADA/HMI** 两套体系整合进同一工作区，配套两个技能让 AI 知道怎么生成大屏。

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

---

## 核心能力

### 全内联单文件交付

两套引擎的交付物都是**单文件 HTML**——CSS、JS、字体、图标、图表库全部打包进去，没有任何外部依赖。

客户收到文件，双击，浏览器打开，看到的就是开发时看到的效果。适用于工厂内网隔离、IT 禁止安装软件、就地屏幕无网络连接等工业场景。

### 截图自检机制

构建完成后自动用 Playwright 截取 1920×1080 画面，检测面板溢出、空白区域、JS 错误。报告中 `ok: true` 且 `audit.overflow` 为空，才算通过，让"交付即可用"成为可验证的标准。

---

## 两个子系统的分工

### 怎么选？

> 看有没有**工艺流程、设备控制、操作防误**——有就选工业引擎（industrial），没有就选通用引擎（vizlab）。

| | vizlab（通用） | industrial（工业） |
|---|---|---|
| 典型场景 | 销售看板、运营监控、园区大屏、3D 孪生展示 | SCADA、HMI、上位机、就地控制屏 |
| 有无操作指令 | 无（只读） | 有（含操作防误联锁） |
| 工业规范 | 不需要 | ISA-101、SBO、Faceplate、P&ID 图元库 |
| 交付形式 | 单文件 HTML（含依赖） | 单文件 HTML（离线可运行） |

---

### vizlab（通用可视化大屏引擎）

来自 [screen-picture-demo](https://github.com/alinkiot/screen-picture-demo)，7 套可交互 3D 大屏展厅，技术栈为 **Three.js + GLSL Shader + D3**。有完整的 Python 构建系统：模板拆分为 `template.html / styles.css / app.js / model.js`，构建后合并成单文件离线 HTML。

提供两种预设：

**flat 预设**：纯数据看板，布局固定为顶部 KPI 主指标区 + 中部主趋势图 + 底部三联小图（占比/排行/事件），纯 D3 实现，无 WebGL，任何设备都能流畅运行。

**observatory 预设**：3D 数字孪生，Three.js 三维场景 + 悬浮数据面板，支持鼠标点选区域联动数据。

```bash
cd vizlab
npm ci && npm run setup        # 装依赖 + 建 .venv
npm run dev                    # 5173 预览 + 文件监听
npm run build                  # dist/ 网站 + dist/standalone/ 离线单文件
```

---

### industrial（工业大屏工作室）

来自 [scada-deck](https://github.com/zhengweixing/scada-deck)，30 套工业 SCADA/HMI 场景，技术栈为 **Vue 3 + ECharts 5 + Three.js**（全部本地固化在 `vendor/`）。每套场景都是独立 HTML，**无需构建，浏览器直接打开即用**。

五种工业模式：

| 模式 | 定位 | 适合场景 |
|---|---|---|
| `dashboard` | 只读驾驶舱 | 管理层监控，高信息密度，无操作按钮 |
| `hmi-classic` | 西门子博途经典上位机风格 | 已有博途操作员的团队，学习成本低 |
| `scada` | 可写控制 Web SCADA | 化工、水务、电力等需要远程操作的场景 |
| `light-3d` | 浅色 3D 水务孪生 | 供水/排水/热力管网监控 |
| `local-panel` | 单机就地控制屏 | 设备旁触摸屏，离线运行，断网不影响使用 |

```bash
open industrial/apps/showcase/index.html          # 横屏互动体验入口（30 套）
open industrial/apps/scada-designer/index.html    # SCADA 场景设计器
node industrial/../skills/industrial-screen/scripts/validate-dashboard.js industrial/scenarios   # 校验
```

---

## 两个技能

| 技能 | 位置 | 做什么 |
|---|---|---|
| **bigscreen-studio** | `skills/bigscreen-studio/` | 从零生成全新通用大屏。两预设：`flat`（纯数据看板）/ `observatory`（3D 数字孪生）。脚手架 → 写数据与场景 → 构建 → 截图自检 → 输出 `out/` 单文件 |
| **industrial-screen** | `skills/industrial-screen/` | 按工业领域规范生成 SCADA/HMI。5 模式 + 网关集成，遵循 ISA-101 / SBO / Faceplate / P&ID 图元库 |

### bigscreen-studio 用法

```bash
node skills/bigscreen-studio/scripts/scaffold.mjs \
  --id port-ops --preset flat --title "智慧港口运营中心"
# 编辑 vizlab/src/screens/port-ops/app.js（数据与面板）
node skills/bigscreen-studio/scripts/verify.mjs --id port-ops   # 构建+截图+自检 → out/port-ops/
```

### industrial-screen 用法

```bash
# 先判断模式，再按对应契约开发，最后校验
node skills/industrial-screen/scripts/validate-dashboard.js industrial/scenarios   # dashboard / local-panel
node skills/industrial-screen/scripts/validate-hmi.js <html-file>                  # hmi-classic
node skills/industrial-screen/scripts/validate-scada.js <html-file>                # scada
node skills/industrial-screen/scripts/validate-light-3d-hmi.js <html-file>         # light-3d
```

---

## AI 提示词模板

以下提示词可直接发给 AI，生成对应场景的大屏骨架。

### flat 预设（纯数据看板）

```
我需要一个工业物联网数据看板，使用 bigscreen-studio 的 flat 预设。
场景：[你的场景，如：智慧工厂能耗监控]
顶部 KPI 指标（3 个）：[指标名称和单位]
主趋势图：[X 轴时间范围，Y 轴指标名称]
左下图 / 中下图 / 右下图：[类型：占比/排行/事件，内容描述]
配色：深蓝背景，青蓝主色，KPI 数字白色大字
```

### observatory 预设（3D 数字孪生）

```
我需要一个 3D 数字孪生大屏，使用 bigscreen-studio 的 observatory 预设。
场景：[如：智慧园区能源管理中心]
三维场景描述：[俯视视角工业园区，4 栋厂房、2 个储能站]
点选交互：[点击厂房显示该区域用电数据]
悬浮面板内容：[总用电量、光伏发电量、碳排放]
背景：深蓝 / 深灰 / 黑色（三选一）
```

### 工业大屏通用模板

```
我需要一个工业大屏，使用 bigscreen-studio 的 industrial 引擎。
模式：[dashboard / hmi-classic / scada / light-3d / local-panel]
行业场景：[如：化工厂反应釜监控、水厂泵站控制]
监控设备/参数：[列出 3-8 个，如：进水泵状态、液位、出水流量]
操作指令：[如有：启停泵、开关阀门、设置液位报警]
操作防误：[如：停泵前需确认备用泵已启动；阀门操作需二次确认]
报警规则：[如：液位低于 0.5m 报警、超标红色高亮]
界面风格：[深色/浅色，主色调]
```

---

## 行业场景选型

### ⛏️ 智慧矿山安全监控

- **推荐**：`dashboard` 模式 + 工业引擎
- **核心需求**：人员定位、气体浓度（CH4/CO/O2）、通风系统、提升/排水设备状态
- **报警要点**：CH4>1% 预警、>1.5% 断电撤人；人员超员/未按时升井告警

### 🏔️ 高速边坡地质灾害监测

- **推荐**：`observatory` 预设（3D 地形孪生）
- **核心需求**：表面/深部位移、雨量、孔隙水压，点选查看历史变形曲线
- **预警逻辑**：位移速率 >2mm/d 预警；降雨量 >100mm/24h 叠加预警升级

### ☀️ 光伏电站智能运维

- **推荐**：`flat` 预设（整站 KPI 看板）或 `observatory` 预设（电站 3D 孪生）
- **核心需求**：发电量、PR 值、逆变器排行、组串故障（热斑/遮挡/断路）
- **报警要点**：实际 PR < 计划 PR 5% 以上黄色提示；10% 以上红色告警

### 🌪️ 风电智能运维

- **推荐**：`observatory` 预设 + SCADA 数据接入
- **核心需求**：风机健康度评分、发电效率、故障预警，点选风机查看详情
- **特点**：风场偏远，运维人员无需亲临现场即可定位问题风机

### 🧪 化工安全监控

- **推荐**：`scada` 模式，遵循 ISA-101 标准
- **核心需求**：温度/压力/液位实时监控，操作防误联锁（如进料阀操作需压力 <0.5MPa）
- **特点**：支持操作指令下发，紧急联锁自动触发（温度 >100°C 自动关闭进料阀）

### 💧 水务管网 3D 孪生

- **推荐**：`light-3d` 模式
- **核心需求**：GIS 数据与实时监测融合，压力等级渐变色，泄漏点定位
- **报警要点**：压力异常低（疑似爆管）红色高亮；流量骤增（疑似泄漏）橙色预警


---

## 许可

两个子系统均采用 MIT。详见 `vizlab/LICENSE` 与 `industrial/LICENSE`。
