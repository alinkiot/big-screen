/* SPDX-License-Identifier: MIT */
/* 高速公路边坡地质灾害智能监测预警平台 – demo data */
(() => {
  const H = ObservatoryDashboard.helpers;

  // ── 演示数据 ───────────────────────────────────────────────────────────────
  const SECTIONS = [
    {
      id: 'k3+200', name: 'K3+200', level: 'normal',
      hz: 1.2, vt: 0.6, rate: 0.4,
      rain24: 18.4, rainRate: 0.0,
      gwl: -3.2,
      incl: [0.0, 0.3, 0.8, 1.1, 1.2],   // 各深度(1m间隔)测斜值 mm
    },
    {
      id: 'k5+480', name: 'K5+480', level: 'watch',
      hz: 5.8, vt: 3.1, rate: 1.3,
      rain24: 64.2, rainRate: 2.8,
      gwl: -1.8,
      incl: [0.0, 0.6, 1.4, 2.2, 3.0],
    },
    {
      id: 'k8+060', name: 'K8+060', level: 'warning',
      hz: 12.4, vt: 7.6, rate: 2.6,
      rain24: 88.6, rainRate: 6.4,
      gwl: -0.6,
      incl: [0.0, 1.2, 3.5, 5.8, 8.2],
    },
    {
      id: 'k11+320', name: 'K11+320', level: 'alarm',
      hz: 28.6, vt: 16.2, rate: 4.1,
      rain24: 126.8, rainRate: 12.6,
      gwl: 0.4,
      incl: [0.0, 2.6, 7.4, 13.2, 18.8],
    },
    {
      id: 'k14+760', name: 'K14+760', level: 'normal',
      hz: 0.8, vt: 0.3, rate: 0.2,
      rain24: 12.0, rainRate: 0.0,
      gwl: -4.1,
      incl: [0.0, 0.2, 0.5, 0.7, 0.8],
    },
  ];

  const LEVEL_LABEL  = { normal:'正常', watch:'注意', warning:'预警', alarm:'告警' };
  const LEVEL_COLOR  = { normal:'#3ad7ff', watch:'#ffe066', warning:'ff9a3c', alarm:'#ff4d6a' };
  const LEVEL_GLYPH  = { normal:'check', watch:'target', warning:'alert', alarm:'alert' };

  // 触发规则：位移速率>2mm/d 或 降雨量>100mm/24h → 告警；>1mm/d 或 >60mm/24h → 预警
  function computeLevel(sec) {
    if (sec.rate >= 2.0 && sec.rain24 >= 100) return 'alarm';
    if (sec.rate >= 2.0)                       return 'warning';
    if (sec.rain24 >= 60 || sec.rate >= 1.0)  return 'watch';
    return 'normal';
  }

  // 激活断面数
  function activeAlarms() { return SECTIONS.filter(s => computeLevel(s) !== 'normal').length; }

  // ── 左侧面板 ──────────────────────────────────────────────────────────────
  // 面板1：断面预警等级列表
  const alertBars = SECTIONS.map(s => {
    const lv   = computeLevel(s);
    const col  = { normal:'#3ad7ff', watch:'#ffe066', warning:'#ff9a3c', alarm:'#ff4d6a' }[lv];
    const pct  = { normal:12, watch:38, warning:68, alarm:92 }[lv];
    return [s.name, pct, LEVEL_LABEL[lv], col, ''];
  });
  const panel1 = H.panel(
    '断面预警状态',
    '01 / ALERT',
    H.bars(alertBars) +
    '<p class="ob-note"><b>橙/红</b>断面触发预警规则，需现场核查</p>',
    'alert',
  );

  // 面板2：表面位移速率
  const dispBars = SECTIONS.map(s => {
    const pct = Math.min(Math.round(s.rate / 5.0 * 100), 100);
    const col = s.rate >= 2.0 ? '#ff4d6a' : s.rate >= 1.0 ? '#ff9a3c' : '#3ad7ff';
    return [s.name, pct, s.rate.toFixed(1) + ' mm/d', col, ''];
  });
  const panel2 = H.panel(
    '表面位移速率',
    '02 / DISPLACEMENT',
    H.bars(dispBars) +
    '<p class="ob-note">阈值：<b>2 mm/d</b> 预警 · 速率越高风险越大</p>',
    'sensor',
  );

  // 面板3：地下水位变化（以 facts 展示）
  const panel3 = H.panel(
    '孔隙水压 / 水位',
    '03 / GROUNDWATER',
    H.facts([
      ['K3+200 水位', SECTIONS[0].gwl.toFixed(1), 'm'],
      ['K5+480 水位', SECTIONS[1].gwl.toFixed(1), 'm'],
    ]) +
    H.facts([
      ['K8+060 水位', SECTIONS[2].gwl.toFixed(1), 'm（↑ 上升趋势）'],
      ['K11+320 水位', '+' + SECTIONS[3].gwl.toFixed(1), 'm（超警戒线）'],
    ]) +
    '<p class="ob-note">K11+320 地下水位高于坡面，孔压偏高</p>',
    'water',
  );

  const left = panel1 + panel2 + panel3;

  // ── 右侧面板 ──────────────────────────────────────────────────────────────
  // 面板4：深部位移（最危险断面 K11+320 的测斜曲线，用 ob-incl-chart 自定义渲染）
  const panel4 = H.panel(
    '深部位移曲线',
    '04 / INCLINOMETER',
    '<div id="geo-incl-chart" style="width:100%;height:110px;position:relative;"></div>' +
    H.facts([
      ['5m 深测斜', SECTIONS[3].incl[4].toFixed(1), 'mm'],
      ['3m 深测斜', SECTIONS[3].incl[2].toFixed(1), 'mm'],
    ]) +
    '<p class="ob-note">K11+320 断面深部最大位移 <b>' + SECTIONS[3].incl[4].toFixed(1) + ' mm</b>，位于坡面以下 5 m</p>',
    'chart',
  );

  // 面板5：降雨量监测
  const rainBars = SECTIONS.map(s => {
    const pct = Math.min(Math.round(s.rain24 / 150 * 100), 100);
    const col = s.rain24 >= 100 ? '#ff4d6a' : s.rain24 >= 60 ? '#ff9a3c' : '#3ad7ff';
    return [s.name, pct, s.rain24.toFixed(1) + ' mm', col, ''];
  });
  const panel5 = H.panel(
    '24h 累计降雨量',
    '05 / RAINFALL',
    H.bars(rainBars) +
    '<p class="ob-note">阈值：<b>60 mm</b> 注意 · <b>100 mm</b> 叠加预警升级</p>',
    'wind',
  );

  // 面板6：预警事件流
  const panel6 = H.panel(
    '预警事件动态',
    '06 / EVENTS',
    '<div class="ob-task">' + H.icon('alert') +
      '<div><strong>K11+320 断面触发红色告警</strong><p>位移速率 4.1 mm/d，降雨 126.8 mm/24h</p></div><span style="color:#ff4d6a">告警</span></div>' +
    '<div class="ob-task">' + H.icon('alert') +
      '<div><strong>K8+060 断面位移速率越限</strong><p>2.6 mm/d &gt; 2 mm/d 触发橙色预警</p></div><span style="color:#ff9a3c">预警</span></div>' +
    '<div class="ob-task">' + H.icon('target') +
      '<div><strong>K5+480 断面降雨量达注意阈值</strong><p>64.2 mm/24h，当前雨强 2.8 mm/h</p></div><span style="color:#ffe066">注意</span></div>' +
    '<div class="ob-task">' + H.icon('check') +
      '<div><strong>K3+200 / K14+760 断面正常</strong><p>位移速率与降雨量均在安全范围内</p></div><span style="color:#3ad7ff">正常</span></div>',
    'clock',
  );

  const right = panel4 + panel5 + panel6;

  // ── 指标行数据（4 个）──────────────────────────────────────────────────────
  const metricsData = [
    [
      ['监测断面总数', 5,    '处', '全线覆盖'],
      ['最大位移速率', 4.1,  'mm/d', '↑ K11+320'],
      ['24h 最大降雨', 126.8, 'mm', '↑ K11+320'],
      ['活跃预警数',   activeAlarms(), '处', '含 1 红 1 橙'],
    ],
    [
      ['K3+200 位移', SECTIONS[0].hz.toFixed(1),  'mm', '正常'],
      ['K5+480 位移', SECTIONS[1].hz.toFixed(1),  'mm', '注意'],
      ['K8+060 位移', SECTIONS[2].hz.toFixed(1),  'mm', '预警'],
      ['K11+320 位移',SECTIONS[3].hz.toFixed(1),  'mm', '告警'],
    ],
    [
      ['K3+200 雨量', SECTIONS[0].rain24.toFixed(1), 'mm', '安全'],
      ['K5+480 雨量', SECTIONS[1].rain24.toFixed(1), 'mm', '注意'],
      ['K8+060 雨量', SECTIONS[2].rain24.toFixed(1), 'mm', '偏多'],
      ['K11+320 雨量',SECTIONS[3].rain24.toFixed(1), 'mm', '超阈值'],
    ],
    [
      ['在线传感器', 25,   '个', '全部在线'],
      ['通讯正常率', 100,  '%',  ''],
      ['今日告警次数', 4,  '次', '较昨日 +2'],
      ['应急响应状态', 1,  '级', 'I 级响应中'],
    ],
  ];

  // ── 历史变形趋势（主图）──────────────────────────────────────────────────
  const insight = {
    title: '断面累计位移趋势',
    label: '监测周期',
    metricUnit: 'mm',
    metrics: ['28.6', '12.4'],
    periods: ['近 7 天', '近 30 天', '近 90 天'],
    notes: [
      'K11+320 在第 6 天出现位移加速，速率突破 2 mm/d 阈值。',
      '30 天来 K11+320 累计水平位移达 28.6 mm，趋势明显上升。',
      '90 天长期监测显示 K8+060 与 K11+320 均存在持续蠕变特征。',
    ],
    values: [
      // 近 7 天（8 个时间点）：K11+320 / K8+060
      [16.2, 18.4, 20.6, 22.8, 24.4, 26.2, 27.8, 28.6,  // K11+320
        6.4,  7.2,  8.0,  9.1, 10.2, 11.0, 12.0, 12.4], // K8+060
      // 近 30 天（8 个时间点）
      [ 4.2,  8.6, 12.4, 15.8, 19.2, 22.6, 26.0, 28.6,
        1.8,  3.2,  5.0,  7.4,  9.2, 10.6, 11.8, 12.4],
      // 近 90 天
      [ 0.8,  4.4,  8.2, 13.6, 18.4, 22.8, 26.4, 28.6,
        0.4,  2.0,  4.2,  6.8,  9.0, 10.8, 11.6, 12.4],
    ],
    labels: ['D-7', 'D-6', 'D-5', 'D-4', 'D-3', 'D-2', 'D-1', '今日'],
    unit: '累计位移 mm',
    type: 'line',
  };

  // ── 场景点选资产 ─────────────────────────────────────────────────────────
  const assets = SECTIONS.map(s => ({
    id: s.id,
    short: s.name,
    name: s.name + ' 监测断面',
    description: `${s.name} 断面实时监测数据，包含表面位移、深部测斜、降雨量与地下水位。当前预警等级：${LEVEL_LABEL[computeLevel(s)]}。`,
    fields: [
      ['预警等级',   LEVEL_LABEL[computeLevel(s)]],
      ['水平位移',   s.hz.toFixed(1) + ' mm'],
      ['垂直沉降',   s.vt.toFixed(1) + ' mm'],
      ['位移速率',   s.rate.toFixed(1) + ' mm/d'],
      ['24h 雨量',   s.rain24.toFixed(1) + ' mm'],
      ['当前雨强',   s.rainRate.toFixed(1) + ' mm/h'],
      ['地下水位',   (s.gwl >= 0 ? '+' : '') + s.gwl.toFixed(1) + ' m'],
      ['深部最大测斜', s.incl[s.incl.length - 1].toFixed(1) + ' mm @5m'],
    ],
  }));

  // ── 挂载 ─────────────────────────────────────────────────────────────────
  ObservatoryDashboard.mount({
    id: 'geo-hazard',
    glyph: 'layers',
    accent: '#3ad7ff',
    brand: '高速公路地灾监测',
    brandEnglish: 'HIGHWAY SLOPE MONITORING · GEO SENTINEL',
    title: '边坡地灾智能监测预警平台',
    eyebrow: 'GEOLOGICAL HAZARD MONITORING / INTELLIGENT WARNING SYSTEM',
    site: 'G××高速 K3+200—K14+760 段',
    season: '17 °C · 中雨',
    scopeLabel: '选择监测范围',
    scopes: [
      { id: 'all',   name: '全线监测' },
      { id: 'north', name: 'K3+200—K8+060' },
      { id: 'south', name: 'K8+060—K14+760' },
    ],
    topics: [
      { name: '综合态势', layer: 'all',      note: '全线断面预警等级与实时状态' },
      { name: '位移监测', layer: 'sensors',  note: '各断面表面位移与深部测斜' },
      { name: '降雨分析', layer: 'sensors',  note: '累计降雨与当前雨强分布' },
      { name: '公路设施', layer: 'highway',  note: '高速公路本体与设施状态' },
    ],
    metricIcons: ['layers', 'sensor', 'wind', 'alert'],
    left,
    right,
    sceneTitle: '沿线地形数字孪生',
    sceneEnglish: 'HIGHWAY SLOPE 3D MODEL',
    coordinates: '25°28′ N · 110°18′ E',
    focusNote: '边坡地形 · 测斜传感器 · 雨量计节点',
    layers: [
      { id: 'all',     name: '全景总览' },
      { id: 'sensors', name: '监测传感器', note: '高亮显示测斜管与雨量计位置' },
      { id: 'highway', name: '公路设施',   note: '聚焦高速公路本体与护栏' },
    ],
    metrics(state) {
      const data = metricsData[state.topic].map(row => [...row]);
      return data;
    },
    insight,
    assets,
    actions: {},
    update(state, ui) {
      // 根据预警等级高亮最危险断面
      const worst = SECTIONS.reduce((a, b) => {
        const order = { normal:0, watch:1, warning:2, alarm:3 };
        return order[computeLevel(b)] > order[computeLevel(a)] ? b : a;
      });
      ui.bind('worst-section', worst.name);
      ui.bind('worst-level',   LEVEL_LABEL[computeLevel(worst)]);
    },
    footer: '演示数据 · 本地模拟 · 预警阈值：位移速率 2 mm/d · 降雨量 100 mm/24h',
  });

  // ── 深部位移曲线自绘（D3 横向折线：深度 vs 测斜值）──────────────────────
  VizLabRuntime.onDispose(() => {});
  requestAnimationFrame(() => {
    const container = document.getElementById('geo-incl-chart');
    if (!container || typeof d3 === 'undefined') return;
    const W = container.clientWidth || 240;
    const H2 = container.clientHeight || 110;
    const m = { top: 8, right: 22, bottom: 20, left: 30 };
    const iw = W - m.left - m.right;
    const ih = H2 - m.top - m.bottom;

    const depths = [0, 1, 2, 3, 4, 5]; // 深度(m)
    const series = [
      { name: 'K11+320', color: '#ff4d6a', vals: [0, 2.6, 7.4, 13.2, 18.8, 22.4] },
      { name: 'K8+060',  color: '#ff9a3c', vals: [0, 1.2, 3.5, 5.8,  8.2,  9.6] },
      { name: 'K5+480',  color: '#ffe066', vals: [0, 0.6, 1.4, 2.2,  3.0,  3.5] },
    ];

    const xMax = 24;
    const xScale = d3.scaleLinear().domain([0, xMax]).range([0, iw]);
    const yScale = d3.scaleLinear().domain([0, 5]).range([0, ih]);

    const svg = d3.select(container).append('svg')
      .attr('width', W).attr('height', H2)
      .append('g').attr('transform', `translate(${m.left},${m.top})`);

    // 网格
    svg.append('g').attr('class', 'grid')
      .selectAll('line').data(xScale.ticks(4)).enter().append('line')
      .attr('x1', d => xScale(d)).attr('x2', d => xScale(d))
      .attr('y1', 0).attr('y2', ih)
      .attr('stroke', 'rgba(120,170,255,.12)').attr('stroke-dasharray', '3 4');

    // 坐标轴
    svg.append('g').attr('transform', `translate(0,${ih})`)
      .call(d3.axisBottom(xScale).ticks(4).tickSize(2).tickFormat(d => d + ''))
      .call(g => g.select('.domain').attr('stroke', 'rgba(120,170,255,.25)'))
      .call(g => g.selectAll('text').attr('fill', '#8ea3c2').attr('font-size', 8));

    svg.append('g')
      .call(d3.axisLeft(yScale).ticks(5).tickSize(2).tickFormat(d => d + 'm'))
      .call(g => g.select('.domain').attr('stroke', 'rgba(120,170,255,.25)'))
      .call(g => g.selectAll('text').attr('fill', '#8ea3c2').attr('font-size', 8));

    // 折线
    const lineGen = d3.line()
      .x((d, i) => xScale(d))
      .y((_, i, nodes) => {
        const series = nodes[0].parentNode.__data__;
        return yScale(series.depths[i]);
      });

    series.forEach(s => {
      const points = s.vals.map((v, i) => [v, depths[i]]);
      const path = d3.line()
        .x(d => xScale(d[0]))
        .y(d => yScale(d[1]));
      svg.append('path')
        .datum(points)
        .attr('fill', 'none')
        .attr('stroke', s.color)
        .attr('stroke-width', 1.5)
        .attr('d', path);
      // 节点
      svg.selectAll(null).data(points).enter().append('circle')
        .attr('cx', d => xScale(d[0])).attr('cy', d => yScale(d[1]))
        .attr('r', 2.5).attr('fill', s.color);
    });

    // 图例
    series.forEach((s, i) => {
      svg.append('rect')
        .attr('x', iw - 68).attr('y', i * 13)
        .attr('width', 10).attr('height', 2).attr('fill', s.color);
      svg.append('text')
        .attr('x', iw - 55).attr('y', i * 13 + 5)
        .attr('fill', '#8ea3c2').attr('font-size', 7.5)
        .text(s.name);
    });

    // x轴标签
    svg.append('text')
      .attr('x', iw / 2).attr('y', ih + 18)
      .attr('text-anchor', 'middle').attr('fill', '#54688a').attr('font-size', 7.5)
      .text('测斜值 (mm)');
  });
})();
