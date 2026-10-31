/* SPDX-License-Identifier: MIT — 城市供水管网3D孪生调度中心 */
(() => {
  const H = ObservatoryDashboard.helpers;

  /* ---- 监测点状态数据（动态） ---- */
  const MONITORS = [
    { id: 'M01', name: '一水厂出口', pressure: 0.42, flow: 185, status: 'normal' },
    { id: 'M02', name: '城北路交叉', pressure: 0.38, flow: 162, status: 'normal' },
    { id: 'M03', name: '中央大道',   pressure: 0.45, flow: 190, status: 'normal' },
    { id: 'M04', name: '东区主管',   pressure: 0.41, flow: 175, status: 'normal' },
    { id: 'M05', name: '南环路节点', pressure: 0.35, flow: 148, status: 'mid'    },
    { id: 'M06', name: '解放路支管', pressure: 0.18, flow: 290, status: 'alarm'  },
    { id: 'M07', name: '高新区主干', pressure: 0.48, flow: 201, status: 'high'   },
    { id: 'M08', name: '商业区环管', pressure: 0.40, flow: 170, status: 'normal' },
    { id: 'M09', name: '西区加压后', pressure: 0.36, flow: 155, status: 'mid'    },
    { id: 'M10', name: '市政广场',   pressure: 0.43, flow: 182, status: 'normal' },
  ];

  const statusLabel = { normal: '正常', mid: '偏低', high: '偏高', alarm: '报警' };
  const statusColor = { normal: '#00e5a0', mid: '#f5c400', high: '#ff6030', alarm: '#ff2040' };

  /* ---- 监测点列表面板 ---- */
  function monitorListHTML() {
    // 显示前7条（报警/预警优先排前），防面板溢出
    const sorted = [...MONITORS].sort((a, b) => {
      const pri = { alarm: 0, high: 1, mid: 2, normal: 3 };
      return pri[a.status] - pri[b.status];
    }).slice(0, 6);   // 改为前6条
    return '<div class="wn-monitor-list">' +
      sorted.map(m =>
        '<div class="wn-mon-row ' + (m.status === 'alarm' ? 'alarm' : '') + '">' +
          '<span class="wn-mon-id">' + m.id + '</span>' +
          '<span class="wn-mon-name">' + m.name + '</span>' +
          '<span class="wn-mon-val" style="color:' + statusColor[m.status] + '">' + m.pressure.toFixed(2) + '<small>MPa</small></span>' +
          '<span class="wn-mon-flow">' + m.flow + '<small>m³/h</small></span>' +
          '<span class="wn-status-dot" style="background:' + statusColor[m.status] + ';box-shadow:0 0 6px ' + statusColor[m.status] + '">' + statusLabel[m.status] + '</span>' +
        '</div>'
      ).join('') +
      '<p style="margin:3px 0 0;font-size:8.5px;color:var(--dim);padding:0 4px">共10个监测点 · 显示报警优先级前6条</p>' +
    '</div>';
  }

  /* ---- 压力分布 bars ---- */
  function pressureBarsHTML() {
    const items = MONITORS.slice(0, 5).map(m => {
      const pct = Math.round(m.pressure / 0.6 * 100);
      const col = statusColor[m.status];
      return [m.id + ' ' + m.name.substring(0,4), pct, m.pressure.toFixed(2) + ' MPa', col];
    });
    return H.bars(items);
  }

  /* ---- 泵站状态 ---- */
  const PUMPS = [
    { id: 'PS-A', name: '一水厂主泵站',   flow: 6.2, pressure: 0.48, status: '运行', rpm: 1450, temp: 42 },
    { id: 'PS-B', name: '二水厂主泵站',   flow: 8.0, pressure: 0.52, status: '运行', rpm: 1480, temp: 45 },
    { id: 'PS-C', name: '高新区加压站',   flow: 3.1, pressure: 0.31, status: '预警', rpm: 1200, temp: 58 },
    { id: 'PS-D', name: '西区加压站',     flow: 2.8, pressure: 0.42, status: '运行', rpm: 1430, temp: 40 },
  ];

  function pumpStatusHTML() {
    return '<div class="wn-pump-list">' +
      PUMPS.map(p => {
        const sc = p.status === '预警' ? '#f5c400' : '#00e5a0';
        return '<div class="wn-pump-row">' +
          '<div class="wn-pump-id" style="color:' + sc + '">' + p.id + '</div>' +
          '<div class="wn-pump-info"><b>' + p.name + '</b><small>' + p.flow + ' 万m³/日 · ' + p.pressure.toFixed(2) + ' MPa · ' + p.rpm + ' rpm</small></div>' +
          '<span class="wn-pump-badge" style="color:' + sc + ';border-color:' + sc + '44;background:' + sc + '12">' + p.status + '</span>' +
        '</div>';
      }).join('') +
    '</div>';
  }

  /* ---- 报警列表 ---- */
  function alarmHTML() {
    return '<div class="wn-alarms">' +
      '<div class="wn-alarm-row critical" data-action="goto-alarm">' +
        H.icon('alert') +
        '<div><strong>M06 解放路 · 压力异常低 0.18 MPa</strong><p>流量骤增 290 m³/h，疑似管道破损，抢修队已出发</p><small data-bind="alarm-time">14:38 · P1 紧急 · 点击定位</small></div>' +
      '</div>' +
      '<div class="wn-alarm-row warning">' +
        H.icon('alert') +
        '<div><strong>PS-C 加压站出口压力偏低</strong><p>出口 0.31 MPa，低于设定值 0.40 MPa，建议巡检</p><small>14:22 · P2 注意</small></div>' +
      '</div>' +
      '<div class="wn-alarm-row info">' +
        H.icon('clock') +
        '<div><strong>M05/M09 节点压力偏低预警</strong><p>0.35/0.36 MPa，接近阈值下限 0.30 MPa</p><small>14:10 · P3 提醒</small></div>' +
      '</div>' +
    '</div>';
  }

  /* ---- 调度日志 ---- */
  function dispatchLogHTML() {
    return '<div class="wn-log">' +
      '<div class="wn-log-row"><time>14:38</time><i class="bad"></i><p>M06 压力骤降告警，已派抢修队</p></div>' +
      '<div class="wn-log-row"><time>14:22</time><i class="warn"></i><p>PS-C 出口压力低，已提高泵频</p></div>' +
      '<div class="wn-log-row"><time>13:50</time><i class="ok"></i><p>漏损率计算完成：5.2%，较昨日降0.3%</p></div>' +
      '<div class="wn-log-row"><time>12:00</time><i class="ok"></i><p>日供水量达标：14.2万m³（100.6%）</p></div>' +
    '</div>';
  }

  /* ---- 面板组装 ---- */
  const left =
    H.panel('监测点实时状态', '01 / MONITORS', monitorListHTML(), 'sensor') +
    H.panel('管网压力分布',   '02 / PRESSURE', pressureBarsHTML() +
      '<p class="ob-note" style="margin-top:8px">M06 红色预警 · M05/M09 偏低预警 · 阈值 ≥0.30 MPa</p>', 'water') +
    H.panel('今日供水量趋势', '03 / SUPPLY',
      '<div class="ob-summary" style="margin-bottom:4px"><div><span class="ob-eyebrow">今日累计供水</span><div class="ob-large" style="margin:2px 0"><strong class="ob-num" data-bind="total-supply">14.2</strong><small>万 m³</small><span data-bind="supply-delta" style="color:#00e5a0;font-size:11px;margin-left:4px">↑ 0.6%</span></div></div></div>' +
      '<div class="wn-supply-bars" aria-label="分时供水量趋势">' +
        [52,48,44,58,76,88,82,94,86,78,72,68,80,86].map(v =>
          '<i style="height:' + v + '%;background:linear-gradient(#00e5a099,#00e5a022)"></i>'
        ).join('') +
      '</div>' +
      '<div style="display:flex;gap:14px;font-size:9.5px;color:var(--muted)">' +
        '<span>漏损率 <b style="color:#00e5a0">5.2%</b></span>' +
        '<span>管网均压 <b style="color:#00d4ff">0.39 MPa</b></span>' +
        '<span>泵站总流量 <b style="color:#7ad4ee">20.1 万m³</b></span>' +
      '</div>',
      'chart');

  const right =
    H.panel('泵站运行状态', '04 / PUMP STATIONS', pumpStatusHTML(), 'energy') +
    H.panel('异常报警', '05 / ALARMS', alarmHTML(), 'alert') +
    H.panel('调度日志', '06 / DISPATCH', dispatchLogHTML(), 'clock');

  /* ---- 指标行数据（按topic切换） ---- */
  const metricsData = [
    // 总览
    [['总供水量', 14.2, '万m³', '日供水达标'], ['系统平均压力', 0.39, 'MPa', '正常范围'], ['漏损率', 5.2, '%', '↓ 0.3%'], ['泵站在线率', '3/4', '台', 'PS-C预警']],
    // 管网监测
    [['监测点总数', 10, '个', '全部在线'], ['报警点数', 1, '个', 'M06 P1'], ['平均压力', 0.39, 'MPa', '正常'], ['流量总计', 1858, 'm³/h', '当前']],
    // 泵站调度
    [['总供水能力', 20.1, '万m³', '日'], ['运行泵站', 3, '台', '1台预警'], ['综合能耗', 186, 'kWh/万m³', '较昨降2%'], ['扬程均值', 47, 'm', '稳定']],
    // 漏损分析
    [['漏损率', 5.2, '%', '↓ 0.3%'], ['疑似漏点', 1, '处', 'M06区域'], ['漏损量估算', 0.74, '万m³', '今日'], ['修复中', 0, '处', '已派队']],
  ];

  /* ---- mount ---- */
  ObservatoryDashboard.mount({
    id: 'water-network',
    glyph: 'water',
    accent: '#00d4ff',
    brand: '城市水务',
    brandEnglish: 'URBAN WATER · SMART DISPATCH',
    title: '供水管网调度中心',
    eyebrow: 'WATER NETWORK / 3D DIGITAL TWIN',
    site: '市区 · 供水主干网',
    season: '晴 · 23°C · 供水正常',
    scopeLabel: '选择供水区域',
    scopes: [
      { id: 'all',   name: '全市管网' },
      { id: 'north', name: '北区主干' },
      { id: 'south', name: '南区管网' },
    ],
    topics: [
      { name: '总览',     layer: 'all',   note: '供水主干网 · 全域监控' },
      { name: '管网监测', layer: 'pipes', note: '压力/流量节点 · 实时状态' },
      { name: '泵站调度', layer: 'pumps', note: '4座泵站 · 调度优化' },
      { name: '漏损分析', layer: 'all',   note: '疑似漏损区段 · 分析预警' },
    ],
    metricIcons: ['water', 'sensor', 'leaf', 'energy'],
    left,
    right,
    sceneTitle: '供水管网数字孪生',
    sceneEnglish: 'WATER NETWORK TWIN',
    coordinates: '31°14′N · 121°28′E',
    focusNote: '主干管网 · 10个监测点 · 4座泵站',
    layers: [
      { id: 'all',   name: '全要素叠加' },
      { id: 'pipes', name: '管网层',    note: '压力等级渐变色管道' },
      { id: 'pumps', name: '泵站层',    note: '泵站设备及状态' },
    ],
    metrics(state) {
      return metricsData[state.topic] || metricsData[0];
    },
    insight: {
      title: '分时供水量趋势',
      label: '日供水量',
      metricUnit: '万m³',
      metrics: ['14.2', '14.1'],
      periods: ['今日', '昨日'],
      notes: [
        '今日8:00—10:00为早高峰，供水量达峰值94万m³/h。M06报警发生于14:38。',
        '昨日供水平稳，无异常，漏损率5.5%，较今日偏高0.3%。',
      ],
      values: [
        [44, 38, 34, 52, 88, 94, 82, 78, 86, 80, 74, 68, 76, 82],
        [40, 35, 32, 48, 82, 88, 80, 76, 82, 76, 70, 65, 72, 78],
      ],
      labels: ['04:00', '06:00', '08:00', '10:00', '12:00', '14:00', '16:00'],
      unit: '流量指数',
      type: 'line',
    },
    assets: [
      {
        id: 'pump-a',
        short: 'PS-A',
        name: 'PS-A · 一水厂主泵站',
        description: '城市一水厂主泵站，负责北区供水主干加压，设计供水能力6万m³/日。',
        fields: [
          ['当前流量', '6.2 万m³/日'],
          ['出口压力', '0.48 MPa'],
          ['运行转速', '1,450 rpm'],
          ['机组状态', '正常运行'],
        ],
      },
      {
        id: 'pump-b',
        short: 'PS-B',
        name: 'PS-B · 二水厂主泵站',
        description: '城市二水厂主泵站，负责中南区供水主干，设计供水能力8万m³/日。',
        fields: [
          ['当前流量', '8.0 万m³/日'],
          ['出口压力', '0.52 MPa'],
          ['运行转速', '1,480 rpm'],
          ['机组状态', '正常运行'],
        ],
      },
      {
        id: 'pump-c',
        short: 'PS-C',
        name: 'PS-C · 高新区加压站',
        description: '高新区末端加压泵站，当前出口压力低于设定值，需巡检。',
        fields: [
          ['当前流量', '3.1 万m³/日'],
          ['出口压力', '0.31 MPa ⚠'],
          ['运行转速', '1,200 rpm'],
          ['机组状态', '压力偏低预警'],
        ],
      },
      {
        id: 'pump-d',
        short: 'PS-D',
        name: 'PS-D · 西区加压站',
        description: '西区末端加压泵站，负责西部低压区供水保障，运行正常。',
        fields: [
          ['当前流量', '2.8 万m³/日'],
          ['出口压力', '0.42 MPa'],
          ['运行转速', '1,430 rpm'],
          ['机组状态', '正常运行'],
        ],
      },
      {
        id: 'pipe-alarm',
        short: 'M06报警',
        name: 'M06 · 解放路管段异常',
        description: '解放路支管14:38发现压力骤降，流量骤增，疑似管道破损，已派出抢修队。',
        fields: [
          ['当前压力', '0.18 MPa（正常≥0.30）'],
          ['当前流量', '290 m³/h（骤增）'],
          ['报警级别', 'P1 紧急'],
          ['处置状态', '抢修队已出发'],
        ],
      },
      {
        id: 'pipe-main',
        short: '主干管',
        name: '城北路主干管段',
        description: '城市北区供水主干管，DN800，当前运行压力正常，历史趋势稳定。',
        fields: [
          ['管径规格', 'DN800'],
          ['当前压力', '0.42 MPa'],
          ['当前流量', '185 m³/h'],
          ['管段状态', '正常运行'],
        ],
      },
    ],
    actions: {
      'goto-alarm'(state, ui) {
        ui.notify('⚠ 已定位 M06 报警点，正在聚焦场景…');
        const s = ui.scene();
        if (s) s.select('pipe-alarm');
      },
    },
    update(state, ui) {
      ui.bind('alarm-time', '14:38 · P1 紧急 · 点击定位');
      ui.bind('total-supply', '14.2');
      ui.bind('supply-delta', '↑ 0.6%');
    },
    footer: '演示数据 · 城市供水管网数字孪生 · 数据均为本地模拟',
  });
})();
