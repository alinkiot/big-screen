/* SPDX-License-Identifier: MIT */
(() => {
  const H = ObservatoryDashboard.helpers;
  const left =
    H.panel(
      '结构响应趋势',
      '01 / RESPONSE',
      '<div class="ob-health">' +
        H.ring(98.6, '安全指数') +
        '<div class="ob-space-facts"><div><span>平均挠度</span><strong class="ob-num">12.3 <small>mm</small></strong></div><div><span>平均应变</span><strong class="ob-num">48.2 <small>με</small></strong></div><div><span>温度修正</span><strong class="ob-num">+1.8 <small>℃</small></strong></div></div></div><div class="ob-space-stack" aria-label="响应分布：主梁挠度42%，裂缝变化28%，支座位移30%"><i style="width:42%"></i><i style="width:28%"></i><i style="width:30%"></i></div><p class="ob-note">主梁挠度 42% · 裂缝变化 28% · 支座位移 30%</p>',
      'activity',
    ) +
    H.panel(
      '设备健康状态',
      '02 / DEVICES',
      '<div class="ob-summary"><div><span class="ob-eyebrow">在线设备</span><div class="ob-large"><strong class="ob-num">286</strong><small>台</small></div></div><span class="ob-pill">在线率 99.2% ✅</span></div>' +
        H.bars([
          ['位移传感器', 42, '14%'],
          ['应变传感器', 36, '12%', '#70b8ff'],
          ['裂缝计', 24, '8%', '#70ff8d'],
          ['振动传感器', 32, '11%', '#ffb870'],
        ]),
      'cpu',
    ) +
    H.panel(
      '告警类型分布',
      '03 / ALERTS',
      '<div class="ob-mobility"><div>' +
        H.icon('alert') +
        '<span>今日告警</span><strong class="ob-num">6 <small>个</small></strong></div><div>' +
        H.icon('check') +
        '<span>已处置</span><strong class="ob-num">4 <small>个</small></strong></div></div><div class="ob-parking" aria-label="告警等级分布示意">' +
        Array.from(
          { length: 12 },
          (_, i) => '<i class="' + (i < 2 ? 'critical' : i < 6 ? 'warning' : 'normal') + '"></i>',
        ).join('') +
        '</div><p class="ob-note"><i class="ob-led"></i>响应效率<strong>平均 2.4 小时</strong></p>',
      'alert',
    );
  const right =
    H.panel(
      '无人机巡检进度',
      '04 / INSPECTION',
      '<span class="ob-eyebrow">今日巡检任务</span><div class="ob-large"><strong class="ob-num">3</strong><small>项</small><span>完成 2 项</span></div><div class="ob-energy-columns" aria-label="巡检进度示意">' +
        [100, 85, 65, 42, 100, 100, 78, 92, 100, 88, 76, 60]
          .map((value) => '<i style="height:' + value + '%"></i>')
          .join('') +
        '</div>' +
        H.facts([
          ['覆盖桥梁', '8', '座'],
          ['采集影像', '246', '张'],
        ]),
      'camera',
    ) +
    H.panel(
      '桥梁健康评级',
      '05 / HEALTH',
      '<div class="ob-security-top"><div class="ob-seal">' +
        H.icon('shield') +
        '</div><div><strong class="ob-num">A</strong><p>整体健康评级 · 良好</p></div></div>' +
        H.matrix(36) +
        H.facts([
          ['A级桥梁', '12', '座'],
          ['B级桥梁', '8', '座'],
          ['C级桥梁', '2', '座'],
        ]),
      'heart',
    ) +
    H.panel(
      '养护任务队列',
      '06 / MAINTENANCE',
      '<button class="ob-alert" id="bridge-alert" data-action="resolve">' +
        H.icon('alert') +
        '<div><strong data-bind="event-title">3#桥裂缝持续变化</strong><p>主梁腹板裂缝需现场复核，建议安排无人机巡检</p><small data-bind="event-status">10:28 · 待处置，点击确认</small></div></button><div class="ob-task">' +
        H.icon('check') +
        '<div><strong>5#桥支座位移超限处置</strong><p>09:45 · 已完成现场检查</p></div><span>已闭环</span></div><div class="ob-task">' +
        H.icon('check') +
        '<div><strong>2#桥振动异常复核</strong><p>08:22 · 智能体已分析完成</p></div><span>已完成</span></div>',
      'clock',
    );
  const rows = [
    [
      ['结构安全指数', 98.6, '分', '运行良好'],
      ['异常事件数', 6, '个', '今日新增'],
      ['在线设备数', 286, '台', '在线率 99.2%'],
      ['监测覆盖率', 89.4, '%', '持续优化'],
    ],
    [
      ['主梁平均挠度', 12.3, 'mm', '在阈值内'],
      ['最大裂缝宽度', 0.42, 'mm', '持续观测'],
      ['墩台平均倾角', 0.12, '°', '姿态稳定'],
      ['环境温度', 24.6, '℃', '↑ 2.4℃'],
    ],
    [
      ['处置完成率', 92.8, '%', '↑ 3.2%'],
      ['平均响应时间', 2.4, '小时', '效率提升'],
      ['智能体研判', 186, '次', '今日调用'],
      ['复核证据完整', 96.4, '%', '关联度高'],
    ],
    [
      ['无人机巡检', 3, '架次', '今日任务'],
      ['采集影像数', 246, '张', '↑ 32张'],
      ['AI病害识别', 18, '处', '待复核'],
      ['待处理养护', 2, '项', '等待派发'],
    ],
  ];
  ObservatoryDashboard.mount({
    id: 'bridge-monitoring',
    glyph: 'bridge',
    accent: '#70b8ff',
    brand: '桥梁智能监测',
    brandEnglish: 'BRIDGE AI · STRUCTURAL HEALTH',
    title: '桥梁智能监测运营中心',
    eyebrow: 'BRIDGE AI / STRUCTURAL HEALTH MONITORING',
    site: '跨江大桥监测群',
    season: '22—28 °C · 晴',
    scopeLabel: '选择监测范围',
    scopes: [
      { id: 'all', name: '全监测网' },
      { id: 'highway', name: '高速公路桥群' },
      { id: 'city', name: '城市立交桥群' },
    ],
    topics: [
      { name: '整体态势', layer: 'all' },
      { name: '结构响应', layer: 'response', note: '主梁挠度 · 应变 · 裂缝 · 位移' },
      { name: '设备状态', layer: 'devices', note: '传感器网络 · 采集链路 · 通信质量' },
      { name: '养护任务', layer: 'maintenance', note: '无人机巡检 · 养护处置 · 任务闭环' },
    ],
    metricIcons: ['activity', 'cpu', 'clock', 'camera'],
    left,
    right,
    sceneTitle: '桥梁数字孪生',
    sceneEnglish: '3D BRIDGE DIGITAL TWIN',
    coordinates: '31°14′ N · 121°29′ E',
    focusNote: '主梁结构 · 桥墩姿态 · 传感器网络',
    layers: [
      { id: 'all', name: '桥梁全景' },
      { id: 'response', name: '结构响应', note: '显示主梁、桥墩关键监测点位' },
      { id: 'devices', name: '设备网络', note: '显示传感器布点与采集链路' },
      { id: 'maintenance', name: '养护活动', note: '显示巡检与养护作业点' },
    ],
    metrics(state) {
      const data = rows[state.topic].map((row) => [...row]);
      if (state.topic === 3) {
        data[3][1] = state.resolved ? 1 : 2;
        data[3][3] = state.resolved ? '剩余 1 项' : '等待派发';
      }
      if (state.scope !== 'all') {
        const ratio = state.scope === 'highway' ? 0.65 : 0.35;
        data.forEach((row) => {
          if (['个', '台', '座', '项', '架次'].includes(row[2]))
            row[1] = row[2] === '项' ? (state.resolved ? 1 : 2) : Math.round(row[1] * ratio);
          if (['mm', '℃', '°', '%', '分', '小时'].includes(row[2])) row[1] = Math.round(row[1] * ratio * 10) / 10;
        });
      }
      return data;
    },
    insight: {
      title: '结构响应变化趋势',
      label: '主梁挠度变化',
      metricUnit: 'mm',
      metrics: ['12.3', '11.8'],
      periods: ['今日', '昨日'],
      notes: ['车辆荷载峰值期挠度增加 0.8mm', '温度变化为主要影响因素 -0.5mm'],
      values: [
        [8.2, 8.6, 9.1, 10.3, 11.8, 12.3, 11.6, 10.8, 9.9, 9.2, 8.8, 8.5],
        [8.4, 8.9, 9.5, 10.6, 11.8, 11.8, 11.1, 10.3, 9.6, 9.0, 8.7, 8.5],
      ],
      labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'],
      unit: '挠度值',
      type: 'line',
    },
    assets: [
      {
        id: 'main-bridge',
        short: '主桥',
        name: '01 · 跨江大桥',
        description: '主跨 320m 斜拉桥，已部署主梁挠度、应变、振动等多维度监测系统。',
        fields: [
          ['监测点位', '86 个'],
          ['平均挠度', '12.3 mm'],
          ['安全指数', '98.6 分'],
          ['监测状态', '持续运行'],
        ],
      },
      {
        id: 'viaduct',
        short: '高架桥',
        name: '02 · 城市高架桥',
        description: '装配式连续梁桥，重点监测支座位移、裂缝发展与动态响应。',
        fields: [
          ['监测点位', '42 个'],
          ['最大裂缝', '0.42 mm'],
          ['设备在线率', '99.5 %'],
          ['巡检周期', '每周一次'],
        ],
      },
      {
        id: 'interchange',
        short: '立交桥',
        name: '03 · 大型立交桥',
        description: '多层互通式立交，采用无人机自动巡检与固定测点联动监测模式。',
        fields: [
          ['监测点位', '68 个'],
          ['无人机巡检', '3 架次/日'],
          ['健康评级', 'A 级'],
          ['养护队列', '2 项'],
        ],
      },
    ],
    actions: {
      resolve(state, ui) {
        state.resolved = !state.resolved;
        ui.notify(state.resolved ? '裂缝异常已确认处置，可再次点击撤销' : '已撤销处置确认');
      },
    },
    update(state, ui) {
      ui.bind('event-title', state.resolved ? '3#桥裂缝异常已确认' : '3#桥裂缝持续变化');
      ui.bind(
        'event-status',
        state.resolved ? '已派发处置 · 再次点击可撤销' : '10:28 · 待处置，点击确认',
      );
      document.querySelector('#bridge-alert').dataset.resolved = String(state.resolved);
    },
    footer: '桥梁监测演示 · 多维度结构健康监测平台',
  });
})();
