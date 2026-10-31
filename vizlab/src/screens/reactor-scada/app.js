/* SPDX-License-Identifier: MIT — 化工厂反应釜安全监控 SCADA
 * ISA-101 深色工业风，报警色 ISA 标准黄/红
 * 监控参数：温度/压力/液位/搅拌转速/进料阀/冷却水流量
 * 操作防误：进料阀操作需压力<0.5MPa；紧急泄压需双人确认
 * 联锁：温度>100°C 自动关闭进料阀
 */
(() => {
  'use strict';
  const stage = document.querySelector('#screen');
  VizLabRuntime.mountStage(stage, 1920, 1080);

  /* ---------- ① 图标 ---------- */
  const ICONS = {
    layers:     'm12 3 10 5-10 5L2 8l10-5ZM2 12l10 5 10-5M2 16l10 5 10-5',
    fullscreen: 'M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5',
    close:      'm6 6 12 12M6 18 18 6',
    chart:      'M4 3v18h17M8 17v-6m5 6V7m5 10V4',
    alert:      'm12 3 10 18H2L12 3Zm0 6v5m0 3h.01',
    shield:     'm12 2 8 3v7c0 5-5 8-8 10-3-2-8-5-8-10V5l8-3Zm-4 10 3 3 5-6',
    energy:     'm13 2-9 12h7l-1 8 10-13h-7l0-7Z',
    clock:      'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18m0 4v6l4 2',
    target:     'M12 3a9 9 0 1 0 9 9M12 7a5 5 0 1 0 5 5m-5 0L22 2m-7 0h7v7',
    box:        'm12 3 9 5v9l-9 5-9-5V8l9-5Zm0 10v9M3 8l9 5 9-5',
    users:      'M16 21v-3c0-3-3-5-6-5s-6 2-6 5v3m6-18a4 4 0 1 0 0 8 4 4 0 0 0 0-8',
    car:        'm4 10 2-6h12l2 6M3 10h18v9H3v-9Zm4 4h1m8 0h1M5 19v2m14-2v2',
  };
  const icon = (name) =>
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="' +
    (ICONS[name] || ICONS.layers) + '"/></svg>';
  const paintIcons = () =>
    document.querySelectorAll('[data-icon]').forEach((el) => {
      el.innerHTML = icon(el.dataset.icon);
    });

  const esc = (v) =>
    String(v).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
  const num = (v) =>
    typeof v === 'number' ? v.toLocaleString('zh-CN', { maximumFractionDigits: 2 }) : v;

  /* ---------- ② 实时状态（动态模拟） ---------- */
  // 反应釜当前状态
  const STATE = {
    temp:    82.4,   // °C
    press:   0.43,   // MPa
    level:   68.2,   // %
    rpm:     120,    // rpm
    feedValve: true, // 进料阀：true=开 false=关
    coolFlow: 4.8,   // m³/h
    alarmMuted: false,
    interlock: false, // 温度联锁触发
    // 双人确认状态
    emergConfirm: { a: false, b: false },
    // 进料阀操作等待状态
    feedValvePending: false,
  };

  /* ---------- ③ 历史/趋势数据 ---------- */
  const DATA = {
    kpis: [
      { label: '反应温度', code: 'TEMP', value: 82.4, unit: '°C',  delta: '+2.1°C/10min', dir: 'up',   spark: [74,75,76,77,78,79,80,81,82,82.4], alarm: 'warn', alarmText: '接近黄色报警阈值(85°C)' },
      { label: '釜内压力', code: 'PRESS', value: 0.43, unit: 'MPa', delta: '+0.02', dir: 'up',   spark: [0.34,0.36,0.37,0.38,0.39,0.40,0.41,0.42,0.43,0.43], alarm: '', alarmText: '' },
      { label: '液位高度', code: 'LEVEL', value: 68.2, unit: '%',   delta: '-1.4%', dir: 'down', spark: [70,70,69,69,69,68,68,68,68,68.2], alarm: '', alarmText: '' },
      { label: '搅拌转速', code: 'RPM',   value: 120, unit: 'rpm', delta: '稳定', dir: 'flat', spark: [120,120,119,120,120,121,120,120,120,120], alarm: '', alarmText: '' },
      { label: '冷却水流量', code: 'COOL', value: 4.8, unit: 'm³/h', delta: '+0.2', dir: 'up', spark: [4.2,4.3,4.4,4.5,4.5,4.6,4.6,4.7,4.8,4.8], alarm: '', alarmText: '' },
    ],
    main: {
      title: '反应温度历史趋势',
      code: 'TEMP TREND / REALTIME',
      unit: '°C',
      periods: [
        { id: 'h1', name: '1小时' },
        { id: 'h4', name: '4小时' },
        { id: 'h8', name: '8小时' },
      ],
      labels: ['T-8', 'T-7', 'T-6', 'T-5', 'T-4', 'T-3', 'T-2', 'T-1', 'NOW'],
      series: [
        { name: '实测温度', color: '#3ad7ff', data: {
          h1:  [78, 79, 79, 80, 81, 81, 82, 82, 82.4],
          h4:  [68, 70, 72, 74, 76, 78, 80, 81, 82.4],
          h8:  [55, 58, 62, 65, 68, 72, 76, 80, 82.4],
        }},
        { name: '设定值', color: '#ffb340', data: {
          h1:  [80, 80, 80, 80, 80, 80, 80, 80, 80],
          h4:  [70, 72, 75, 78, 80, 80, 80, 80, 80],
          h8:  [50, 55, 65, 72, 78, 80, 80, 80, 80],
        }},
      ],
      notes: {
        h1:  '近1小时温度持续上升，当前82.4°C，接近黄色报警阈值(85°C)，建议增大冷却水流量。',
        h4:  '近4小时升温平稳，从68°C升至82.4°C，升温速率约3.6°C/h，在目标曲线上方。',
        h8:  '本批次从55°C开始升温，总历时约8小时，当前温度偏目标曲线+2.4°C。',
      },
    },
    left: [
      {
        type: 'bars',
        title: '工艺参数状态',
        code: '01 / PROCESS',
        items: [
          { name: '温度', value: Math.round(82.4/120*100), display: '82.4°C', color: '#ffb340' },
          { name: '压力', value: Math.round(0.43/1.2*100), display: '0.43 MPa', color: '#3ad7ff' },
          { name: '液位', value: 68, display: '68.2 %', color: '#35e0a6' },
          { name: '转速', value: Math.round(120/200*100), display: '120 rpm', color: '#7b6bff' },
          { name: '冷却流量', value: Math.round(4.8/10*100), display: '4.8 m³/h', color: '#3ad7ff' },
        ],
        note: '当前温度处于<b>黄色预警区间</b>，其余参数正常。',
      },
      {
        type: 'timeline',
        title: '联锁与报警日志',
        code: '02 / ALARM LOG',
        items: [
          { time: '14:32', level: 'warn', text: '温度接近黄色阈值 82.4°C', note: '已自动增加冷却水0.3 m³/h' },
          { time: '14:18', level: 'ok',   text: '进料阀操作已确认执行', note: '操作员：张工 | 压力0.42 MPa ✓' },
          { time: '13:55', level: '',     text: '批次 B-2401 开始进料', note: '初始温度55°C，压力0.12 MPa' },
          { time: '08:00', level: 'ok',   text: '系统自检通过', note: '所有传感器在线，联锁回路完好' },
        ],
      },
      {
        type: 'facts',
        title: '联锁状态',
        code: '03 / INTERLOCK',
        items: [
          ['温度联锁', '未触发', ''],
          ['进料阀位', '开位', ''],
          ['压力联锁', '正常', ''],
          ['搅拌联锁', '正常', ''],
        ],
        note: '联锁正常。<b>温度≥100°C</b>将自动关闭进料阀。',
      },
    ],
    right: [
      // 右栏第1面板：操作控制台（自定义渲染）
      { type: '__custom_ops__', title: '操作控制台', code: '04 / OPERATIONS' },
      {
        type: 'timeline',
        title: '当前报警列表',
        code: '05 / ACTIVE ALARMS',
        items: [
          { time: '14:32', level: 'warn', text: '温度黄色报警：82.4°C > 85°C预警', note: '报警优先级 P2 · 请检查冷却水' },
        ],
      },
      {
        type: 'list',
        title: '传感器诊断',
        code: '06 / DIAGNOSTICS',
        rows: [
          { name: 'TT-101 温度传感器', a: '82.4°C', b: '正常' },
          { name: 'PT-201 压力变送器', a: '0.43 MPa', b: '正常' },
          { name: 'LT-301 液位变送器', a: '68.2 %', b: '正常' },
          { name: 'ST-401 转速传感器', a: '120 rpm', b: '正常' },
          { name: 'FT-501 流量计', a: '4.8 m³/h', b: '正常' },
        ],
      },
    ],
    mini: [
      { type: 'line', title: '压力趋势', code: 'PRESS',  labels: ['T-5','T-4','T-3','T-2','T-1','NOW'], values: [0.39, 0.40, 0.41, 0.42, 0.43, 0.43], color: '#3ad7ff' },
      { type: 'bar',  title: '液位变化', code: 'LEVEL',  labels: ['T-5','T-4','T-3','T-2','T-1','NOW'], values: [70, 70, 69, 69, 68, 68.2], color: '#35e0a6' },
      { type: 'progress', title: '安全裕量', code: 'MARGIN', items: [['温度裕量', Math.min(100, Math.round((100-82.4)/40*100))], ['压力裕量', Math.round((0.8-0.43)/0.8*100)], ['液位水位', 68], ['冷却能力', 75]] },
    ],
    ticker: [
      ['14:32', '⚠️ 温度接近黄色报警阈值，当前82.4°C，阈值85°C，请关注'],
      ['14:18', '✅ 进料阀操作成功，操作员：张工，压力核查：0.42 MPa'],
      ['14:10', '🔵 批次B-2401 进料量累计 1,240 kg，进度68%'],
      ['14:00', '🔵 冷却水流量自动调节至4.8 m³/h（原4.5）'],
    ],
    footer: '演示数据 · 本地模拟 · ISA-101 · 所有操作均为演示，不连接真实设备',
  };

  /* ---------- ④ 渲染核心 ---------- */
  const q = (sel, root = document) => root.querySelector(sel);
  const panel = (title, code, body, opts = {}) =>
    '<section class="ds-panel' + (opts.cls ? ' ' + opts.cls : '') + '"><div class="ds-panel-head"><h2>' +
    icon(opts.icon || 'chart') + esc(title) + '</h2><span>' + esc(code) + '</span></div><div class="ds-panel-body' +
    (opts.flush ? ' flush' : '') + '">' + body + '</div></section>';

  function sparkline(values, color) {
    const w = 92, h = 26, max = Math.max(...values), min = Math.min(...values);
    const x = (i) => (i * w) / (values.length - 1);
    const y = (v) => h - 3 - ((v - min) / (max - min || 1)) * (h - 6);
    const pts = values.map((v, i) => x(i).toFixed(1) + ',' + y(v).toFixed(1)).join(' ');
    return '<svg class="ds-kpi-spark" viewBox="0 0 ' + w + ' ' + h + '" preserveAspectRatio="none" aria-hidden="true"><polyline points="' + pts + '" fill="none" stroke="' + color + '" stroke-width="1.4" stroke-linejoin="round"/></svg>';
  }

  /* KPI 报警样式映射 */
  const alarmColor = { warn: '#ffb340', bad: '#ff5d7a', '': '#3ad7ff' };

  function renderKpis() {
    q('#ds-kpis').innerHTML = DATA.kpis.map((k, i) => {
      const ac = alarmColor[k.alarm] || '#3ad7ff';
      const alarmBadge = k.alarm ? '<span class="scada-alarm-badge ' + k.alarm + '">' + (k.alarm === 'warn' ? '⚠ 预警' : '🔴 报警') + '</span>' : '';
      return '<article class="ds-kpi scada-kpi ' + (k.alarm ? 'kpi-alarm-' + k.alarm : '') + '" data-kpi="' + i + '" tabindex="0" role="button" aria-label="' + esc(k.label + ' ' + num(k.value) + k.unit) + '">' +
        '<span class="ds-kpi-label"><i>0' + (i+1) + '</i>' + esc(k.label) + alarmBadge + '</span>' +
        '<div class="ds-kpi-value"><strong class="ds-num" style="color:' + ac + ';text-shadow:0 0 18px ' + ac + '44">' + num(k.value) + '</strong><small>' + esc(k.unit) + '</small></div>' +
        '<div class="ds-kpi-foot"><span class="ds-kpi-delta ' + (k.dir==='down'?'down':k.dir==='flat'?'flat':'') + '">' + esc(k.delta) + '</span>' + sparkline(k.spark, ac) + '</div>' +
        '</article>';
    }).join('');
  }

  function renderMain(period) {
    const conf = DATA.main, series = conf.series, labels = conf.labels;
    const host = q('#ds-main');
    host.innerHTML =
      '<div class="ds-main-head"><h2 class="ds-main-title">' + icon('chart') + esc(conf.title) + '</h2>' +
      '<div style="display:flex;align-items:center;gap:18px">' +
      '<div class="ds-main-legend">' + series.map((s) => '<span><i style="background:' + s.color + '"></i>' + esc(s.name) + '</span>').join('') + '</div>' +
      '<div class="ds-seg" role="group" aria-label="时间范围">' + conf.periods.map((p) => '<button data-period="' + p.id + '" aria-pressed="' + (p.id === period) + '">' + esc(p.name) + '</button>').join('') + '</div>' +
      '</div></div>' +
      '<div class="ds-panel-body"><svg class="ds-chart" id="ds-main-chart"></svg>' +
      // 报警阈值标注
      '<div class="scada-threshold-legend"><span class="t-warn">── 黄色报警 85°C</span><span class="t-bad">── 红色报警 95°C</span><span class="t-interlock">── 联锁 100°C</span></div>' +
      '<span class="ds-tip" id="ds-main-tip" hidden></span>' +
      '<p class="ds-note" id="ds-main-note">' + esc(conf.notes[period]) + '</p>' +
      '</div>';
    paintIcons();
    drawMain(period);
  }

  function drawMain(period) {
    const svg = d3.select('#ds-main-chart');
    svg.selectAll('*').remove();
    const node = svg.node();
    const W = Math.max(520, node.clientWidth || 900);
    const H = Math.max(200, node.clientHeight || 380);
    svg.attr('viewBox', '0 0 ' + W + ' ' + H);
    const m = { t: 16, r: 16, b: 26, l: 46 };
    const iw = W - m.l - m.r, ih = H - m.t - m.b;
    const conf = DATA.main, labels = conf.labels, series = conf.series;
    const all = series.flatMap((s) => s.data[period]);
    const dataMin = Math.min(...all);
    const dataMax = Math.max(...all);
    // Y 轴：下界 = 数据最小值 -8，向下取整到5的倍数；上界固定110°C（覆盖联锁线并留顶部余量）
    const minY = Math.max(0, Math.floor((dataMin - 8) / 5) * 5);
    const maxY = 112;  // 比联锁100°C高出约10°C留顶部空间，但不要到130
    const x = d3.scalePoint().domain(labels).range([m.l, m.l + iw]);
    const y = d3.scaleLinear().domain([minY, maxY]).range([m.t + ih, m.t]);
    const g = svg.append('g');

    // 网格（从 minY 到 maxY 均匀分5格）
    [0, 0.25, 0.5, 0.75, 1].forEach((f) => {
      const val = minY + (maxY - minY) * f;
      const yy = y(val);
      g.append('line').attr('class', 'ds-grid').attr('x1', m.l).attr('x2', m.l + iw).attr('y1', yy).attr('y2', yy);
      g.append('text').attr('x', m.l - 8).attr('y', yy + 3).attr('text-anchor', 'end').text(Math.round(val));
    });
    g.append('line').attr('class', 'ds-axis').attr('x1', m.l).attr('x2', m.l + iw).attr('y1', m.t + ih).attr('y2', m.t + ih);
    labels.forEach((l) => g.append('text').attr('x', x(l)).attr('y', H - 8).attr('text-anchor', 'middle').text(l));

    // 报警阈值线
    const thresholds = [
      { val: 85, color: '#ffb340', dash: '6 3', label: '85°C' },
      { val: 95, color: '#ff5d7a', dash: '6 3', label: '95°C' },
      { val: 100, color: '#ff2040', dash: '4 2', label: '100°C联锁' },
    ];
    thresholds.forEach((th) => {
      if (th.val <= maxY) {
        const ty = y(th.val);
        g.append('line')
          .attr('x1', m.l).attr('x2', m.l + iw).attr('y1', ty).attr('y2', ty)
          .attr('stroke', th.color).attr('stroke-width', 1).attr('stroke-dasharray', th.dash).attr('opacity', 0.7);
        g.append('text').attr('x', m.l + iw + 3).attr('y', ty + 3).attr('fill', th.color).attr('font-size', '8.5').text(th.label);
      }
    });

    // 渐变定义
    const defs = svg.append('defs');
    series.forEach((s, i) => {
      const grad = defs.append('linearGradient').attr('id', 'rscada-grad-' + i).attr('x1', 0).attr('y1', 0).attr('x2', 0).attr('y2', 1);
      grad.append('stop').attr('offset', 0).attr('stop-color', s.color).attr('stop-opacity', 0.3);
      grad.append('stop').attr('offset', 1).attr('stop-color', s.color).attr('stop-opacity', 0.02);
    });

    // 曲线
    series.forEach((s, i) => {
      const values = s.data[period];
      const area = d3.area().x((d, j) => x(labels[j])).y0(m.t + ih).y1((d) => y(d)).curve(d3.curveMonotoneX);
      const line = d3.line().x((d, j) => x(labels[j])).y((d) => y(d)).curve(d3.curveMonotoneX);
      if (i === 0) g.append('path').datum(values).attr('d', area).attr('fill', 'url(#rscada-grad-' + i + ')');
      g.append('path').datum(values).attr('d', line).attr('fill', 'none').attr('stroke', s.color).attr('stroke-width', i === 0 ? 2 : 1.4).attr('stroke-dasharray', i === 0 ? 'none' : '5 3').attr('stroke-linejoin', 'round');
      g.selectAll('.dot-' + i).data(values).join('circle')
        .attr('class', 'ds-dot').attr('cx', (d, j) => x(labels[j])).attr('cy', (d) => y(d)).attr('r', 3).attr('fill', s.color);
    });

    // Hover
    const tip = q('#ds-main-tip');
    const focus = g.append('line').attr('class', 'ds-axis').attr('y1', m.t).attr('y2', m.t + ih).attr('opacity', 0);
    g.append('rect').attr('x', m.l).attr('y', m.t).attr('width', iw).attr('height', ih).attr('fill', 'transparent')
      .on('pointermove', (event) => {
        const [px] = d3.pointer(event);
        let idx = 0, best = Infinity;
        labels.forEach((l, j) => { const d = Math.abs(x(l) - px); if (d < best) { best = d; idx = j; } });
        focus.attr('x1', x(labels[idx])).attr('x2', x(labels[idx])).attr('opacity', 0.6);
        tip.hidden = false;
        tip.innerHTML = '<b>' + esc(labels[idx]) + '</b> ' + series.map((s) => esc(s.name) + ' <b>' + num(s.data[period][idx]) + '</b>' + esc(DATA.main.unit)).join(' · ');
        tip.style.left = x(labels[idx]) + 'px';
        tip.style.top = y(Math.max(...series.map((s) => s.data[period][idx]))) - 6 + 'px';
      })
      .on('pointerleave', () => { tip.hidden = true; focus.attr('opacity', 0); });
  }

  /* 环形图登记表 */
  const donutTargets = [];
  const donutIdFor = (conf, host, idx) => {
    const id = 'ds-donut-' + host.replace('#', '') + '-' + idx;
    donutTargets.push({ id, conf });
    return id;
  };

  /* ---------- ⑤ 操作控制台（自定义面板） ---------- */
  function renderOpsPanel() {
    const feedValveOpen = STATE.feedValve;
    const interlock = STATE.interlock;
    const pressOk = STATE.press < 0.5; // 进料阀操作条件：压力<0.5MPa

    const feedBtnLabel = feedValveOpen ? '关闭进料阀' : '打开进料阀';
    const feedBtnCls = feedValveOpen ? 'scada-btn scada-btn-close' : 'scada-btn scada-btn-open';
    const feedDisabled = interlock ? 'disabled title="联锁已触发，禁止手动操作"' : '';
    const feedNote = !pressOk ? '<span class="scada-op-warn">⚠ 当前压力 ' + STATE.press.toFixed(2) + ' MPa，未满足操作条件（需 &lt;0.5 MPa）</span>' : '';

    const motorRunning = STATE.rpm > 0;
    const motorBtnLabel = motorRunning ? '停止搅拌' : '启动搅拌';
    const motorBtnCls = motorRunning ? 'scada-btn scada-btn-close' : 'scada-btn scada-btn-open';

    const feedValveStatus = feedValveOpen
      ? '<span class="scada-status-dot open"></span>开位'
      : '<span class="scada-status-dot closed"></span>关位';
    const interlockStatus = interlock
      ? '<span class="scada-status-dot bad"></span>已触发（温度联锁）'
      : '<span class="scada-status-dot ok"></span>正常';

    return '<div class="scada-ops-panel">' +
      // 阀门状态栏
      '<div class="scada-ops-status">' +
        '<div class="scada-status-item"><span>进料阀</span><b>' + feedValveStatus + '</b></div>' +
        '<div class="scada-status-item"><span>联锁状态</span><b>' + interlockStatus + '</b></div>' +
        '<div class="scada-status-item"><span>搅拌电机</span><b><span class="scada-status-dot ' + (motorRunning?'ok':'closed') + '"></span>' + (motorRunning?'运行中':'已停止') + '</b></div>' +
      '</div>' +
      // 操作按钮
      '<div class="scada-ops-btns">' +
        '<div class="scada-btn-group">' +
          '<button class="' + feedBtnCls + '" data-action="toggle-feed" aria-label="' + feedBtnLabel + '" ' + feedDisabled + '>' +
            (feedValveOpen ? icon('box') : icon('energy')) + feedBtnLabel +
          '</button>' +
          feedNote +
        '</div>' +
        '<div class="scada-btn-group">' +
          '<button class="' + motorBtnCls + '" data-action="toggle-motor" aria-label="' + motorBtnLabel + '">' +
            icon('car') + motorBtnLabel +
          '</button>' +
        '</div>' +
        '<div class="scada-btn-group">' +
          '<button class="scada-btn scada-btn-emergency" data-action="emergency-vent" aria-label="紧急泄压（双人确认）">' +
            icon('alert') + '紧急泄压' +
          '</button>' +
          '<small class="scada-op-hint">需双人确认方可执行</small>' +
        '</div>' +
      '</div>' +
    '</div>';
  }

  function renderColumn(host, panels) {
    q(host).innerHTML = panels.map((p, idx) => {
      if (p.type === '__custom_ops__')
        return panel(p.title, p.code, renderOpsPanel(), { icon: 'target', cls: 'scada-ops-card' });
      if (p.type === 'rank')
        return panel(p.title, p.code,
          '<div class="ds-rank">' + p.items.map((it, i) =>
            '<div class="ds-rank-row"><em>' + (i+1) + '</em><span>' + esc(it.name) + '</span><strong class="ds-num">' + num(it.value) + ' <small style="color:var(--dim);font-size:9px">' + esc(p.unit||'') + '</small></strong></div>'
          ).join('') + '</div>', { icon: 'target' });
      if (p.type === 'bars')
        return panel(p.title, p.code,
          '<div class="ds-bars">' + p.items.map((it) =>
            '<div class="ds-bar"><span>' + esc(it.name) + '</span><div><i style="width:' + Math.min(100, it.value) + '%;' + (it.color ? 'background:linear-gradient(90deg,' + it.color + '66,' + it.color + ')' : '') + '"></i></div><strong class="ds-num">' + esc(it.display || it.value + '%') + '</strong></div>'
          ).join('') + '</div>' + (p.note ? '<p class="ds-note">' + p.note + '</p>' : ''), { icon: 'box' });
      if (p.type === 'facts')
        return panel(p.title, p.code,
          '<div class="ds-facts">' + p.items.map(([label, value, unit]) =>
            '<div><span>' + esc(label) + '</span><strong class="ds-num">' + esc(value) + '<small>' + esc(unit||'') + '</small></strong></div>'
          ).join('') + '</div>' + (p.note ? '<p class="ds-note">' + p.note + '</p>' : ''), { icon: 'shield' });
      if (p.type === 'donut')
        return panel(p.title, p.code,
          '<div class="ds-donut-wrap"><div class="ds-donut"><svg class="ds-chart" id="' + donutIdFor(p, host, idx) + '"></svg><div class="ds-donut-center"><strong class="ds-num">' + esc(p.center[0]) + '</strong><span>' + esc(p.center[1]) + '</span></div></div><div class="ds-legend">' + p.items.map((it) =>
            '<div><i style="background:' + it.color + '"></i><span>' + esc(it.name) + '</span><strong>' + it.value + '%</strong></div>'
          ).join('') + '</div></div>', { icon: 'chart' });
      if (p.type === 'timeline')
        return panel(p.title, p.code,
          '<div class="ds-timeline">' + p.items.map((it) =>
            '<div class="ds-event"><time>' + esc(it.time) + '</time><i class="' + it.level + '"></i><p>' + esc(it.text) + '<small>' + esc(it.note||'') + '</small></p></div>'
          ).join('') + '</div>', { icon: 'clock' });
      if (p.type === 'list')
        return panel(p.title, p.code,
          '<div class="ds-list">' + p.rows.map((r) =>
            '<div class="ds-list-row"><b>' + esc(r.name) + '</b><span>' + esc(r.a) + '</span><span class="ds-tag ' + (r.b==='繁忙'?'warn':r.b==='异常'?'bad':'') + '">' + esc(r.b) + '</span></div>'
          ).join('') + '</div>', { icon: 'shield' });
      return '';
    }).join('');
    paintIcons();
  }

  function renderMini() {
    q('#ds-mini').innerHTML = DATA.mini.map((m, idx) => {
      if (m.type === 'progress')
        return panel(m.title, m.code, '<div class="ds-bars">' + m.items.map(([name, v]) =>
          '<div class="ds-bar"><span>' + esc(name) + '</span><div><i style="width:' + v + '%"></i></div><strong class="ds-num">' + v + '%</strong></div>'
        ).join('') + '</div>', { icon: 'energy' });
      return panel(m.title, m.code, '<svg class="ds-chart" id="ds-mini-' + idx + '"></svg>', { icon: m.type === 'bar' ? 'box' : 'chart' });
    }).join('');
    paintIcons();
    DATA.mini.forEach((m, idx) => { if (m.type === 'bar' || m.type === 'line') drawMini(m, idx); });
    drawDonuts();
  }

  function drawMini(m, idx) {
    const svg = d3.select('#ds-mini-' + idx);
    const node = svg.node();
    const W = node.clientWidth || 280, H = node.clientHeight || 140;
    svg.attr('viewBox', '0 0 ' + W + ' ' + H);
    const m2 = { t: 12, r: 8, b: 18, l: 8 };
    const iw = W - m2.l - m2.r, ih = H - m2.t - m2.b;
    const max = Math.max(...m.values) * 1.15;
    const x = d3.scaleBand().domain(m.labels).range([m2.l, m2.l + iw]).padding(0.42);
    if (m.type === 'bar') {
      svg.selectAll('rect').data(m.values).join('rect')
        .attr('x', (d, i) => x(m.labels[i])).attr('y', (d) => m2.t + ih * (1 - d / max))
        .attr('width', x.bandwidth()).attr('height', (d) => ih * (d / max))
        .attr('rx', 2).attr('fill', m.color).attr('opacity', 0.85);
    } else {
      const y = d3.scaleLinear().domain([0, max]).range([m2.t + ih, m2.t]);
      const line = d3.line().x((d, i) => x(m.labels[i]) + x.bandwidth() / 2).y((d) => y(d)).curve(d3.curveMonotoneX);
      svg.append('path').datum(m.values).attr('d', line).attr('fill', 'none').attr('stroke', m.color).attr('stroke-width', 2);
      svg.selectAll('circle').data(m.values).join('circle')
        .attr('cx', (d, i) => x(m.labels[i]) + x.bandwidth() / 2).attr('cy', (d) => y(d)).attr('r', 2.6).attr('fill', m.color);
    }
    m.labels.forEach((l, i) => svg.append('text').attr('x', x(l) + x.bandwidth() / 2).attr('y', H - 4).attr('text-anchor', 'middle').text(l));
  }

  function drawDonuts() {
    donutTargets.forEach(({ id, conf }) => {
      const svg = d3.select('#' + id);
      if (!svg.node()) return;
      const size = 118;
      svg.attr('viewBox', '0 0 ' + size + ' ' + size);
      const arc = d3.arc().innerRadius(38).outerRadius(52).cornerRadius(3).padAngle(0.03);
      const pie = d3.pie().value((d) => d.value).sort(null);
      svg.selectAll('path').data(pie(conf.items)).join('path')
        .attr('transform', 'translate(' + size/2 + ',' + size/2 + ')')
        .attr('d', arc).attr('fill', (d) => d.data.color).attr('opacity', 0.9);
    });
  }

  function renderTicker() {
    const items = DATA.ticker.map(([t, text]) => '<span><b>' + esc(t) + '</b>' + esc(text) + '</span>').join('');
    q('#ds-ticker').innerHTML = items + items;
  }

  /* ---------- ⑥ 报警声音（Web Audio API） ---------- */
  let alarmInterval = null;
  let audioCtx = null;

  function beep(frequency, duration, volume) {
    try {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = 'square';
      osc.frequency.value = frequency;
      gain.gain.setValueAtTime(volume, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
      osc.start(audioCtx.currentTime);
      osc.stop(audioCtx.currentTime + duration);
    } catch(e) {}
  }

  function startAlarmSound(level) {
    stopAlarmSound();
    if (STATE.alarmMuted) return;
    if (level === 'bad') {
      alarmInterval = setInterval(() => { beep(880, 0.25, 0.08); setTimeout(() => beep(660, 0.25, 0.06), 300); }, 1000);
    } else if (level === 'warn') {
      alarmInterval = setInterval(() => beep(660, 0.2, 0.04), 2000);
    }
  }

  function stopAlarmSound() {
    if (alarmInterval) { clearInterval(alarmInterval); alarmInterval = null; }
  }

  /* ---------- ⑦ 实时动态模拟 ---------- */
  function simStep() {
    // 温度缓慢上升（除非冷却水大）
    const tempDrift = STATE.coolFlow > 5.5 ? -0.1 : 0.08;
    STATE.temp = Math.max(60, Math.min(110, STATE.temp + tempDrift + (Math.random()-0.5)*0.3));
    // 压力随温度变化
    STATE.press = Math.max(0.05, Math.min(1.0, STATE.press + (STATE.temp - 80) * 0.002 + (Math.random()-0.5)*0.008));
    // 液位缓慢变化
    STATE.level = Math.max(20, Math.min(95, STATE.level + (STATE.feedValve ? 0.04 : -0.04) + (Math.random()-0.5)*0.1));
    // 转速小幅波动
    if (STATE.rpm > 0) STATE.rpm = Math.max(100, Math.min(150, STATE.rpm + (Math.random()-0.5)*2));
    // 冷却水流量
    if (STATE.temp > 88) STATE.coolFlow = Math.min(8, STATE.coolFlow + 0.05);
    else if (STATE.temp < 78 && STATE.coolFlow > 3) STATE.coolFlow = Math.max(3, STATE.coolFlow - 0.03);

    // 联锁：温度>100°C 自动关闭进料阀
    if (STATE.temp > 100 && !STATE.interlock) {
      STATE.interlock = true;
      STATE.feedValve = false;
      DATA.left[1].items.unshift({ time: fmtTime(), level: 'bad', text: '联锁触发：温度 ' + STATE.temp.toFixed(1) + '°C > 100°C，进料阀已自动关闭', note: '请立即检查反应工况，降温后手动复位联锁' });
      if (DATA.left[1].items.length > 6) DATA.left[1].items.pop();
      notify('🔴 联锁触发！温度超限，进料阀已自动关闭');
      startAlarmSound('bad');
    }
    if (STATE.temp < 98 && STATE.interlock) {
      STATE.interlock = false;
      DATA.left[2].items[0][1] = '未触发';
      notify('✅ 温度恢复，联锁已自动复位');
    }

    // 更新 KPI 数据
    DATA.kpis[0].value = +STATE.temp.toFixed(1);
    DATA.kpis[0].spark = [...DATA.kpis[0].spark.slice(1), +STATE.temp.toFixed(1)];
    if (STATE.temp > 95 || STATE.press > 0.8) { DATA.kpis[0].alarm = 'bad'; if (!STATE.alarmMuted) startAlarmSound('bad'); }
    else if (STATE.temp > 85) { DATA.kpis[0].alarm = 'warn'; if (!STATE.alarmMuted && !alarmInterval) startAlarmSound('warn'); }
    else { DATA.kpis[0].alarm = ''; stopAlarmSound(); }
    DATA.kpis[1].value = +STATE.press.toFixed(2);
    DATA.kpis[1].spark = [...DATA.kpis[1].spark.slice(1), +STATE.press.toFixed(2)];
    if (STATE.press > 0.8) { DATA.kpis[1].alarm = 'bad'; } else { DATA.kpis[1].alarm = ''; }
    DATA.kpis[2].value = +STATE.level.toFixed(1);
    DATA.kpis[2].spark = [...DATA.kpis[2].spark.slice(1), +STATE.level.toFixed(1)];
    DATA.kpis[3].value = Math.round(STATE.rpm);
    DATA.kpis[3].spark = [...DATA.kpis[3].spark.slice(1), Math.round(STATE.rpm)];
    DATA.kpis[4].value = +STATE.coolFlow.toFixed(1);
    DATA.kpis[4].spark = [...DATA.kpis[4].spark.slice(1), +STATE.coolFlow.toFixed(1)];

    // 更新工艺参数进度条
    DATA.left[0].items[0].value = Math.round(STATE.temp / 120 * 100);
    DATA.left[0].items[0].display = STATE.temp.toFixed(1) + '°C';
    DATA.left[0].items[0].color = STATE.temp > 95 ? '#ff5d7a' : STATE.temp > 85 ? '#ffb340' : '#3ad7ff';
    DATA.left[0].items[1].value = Math.round(STATE.press / 1.2 * 100);
    DATA.left[0].items[1].display = STATE.press.toFixed(2) + ' MPa';
    DATA.left[0].items[2].value = Math.round(STATE.level);
    DATA.left[0].items[2].display = STATE.level.toFixed(1) + ' %';
    DATA.left[0].items[3].value = Math.round(STATE.rpm / 200 * 100);
    DATA.left[0].items[3].display = Math.round(STATE.rpm) + ' rpm';
    DATA.left[0].items[4].value = Math.round(STATE.coolFlow / 10 * 100);
    DATA.left[0].items[4].display = STATE.coolFlow.toFixed(1) + ' m³/h';

    // 更新联锁状态面板
    DATA.left[2].items[0][1] = STATE.interlock ? '已触发' : '未触发';
    DATA.left[2].items[1][1] = STATE.feedValve ? '开位' : '关位';

    // 更新安全裕量
    DATA.mini[2].items[0][1] = Math.max(0, Math.min(100, Math.round((100 - STATE.temp) / 40 * 100)));  // 60~100°C 量程内剩余
    DATA.mini[2].items[1][1] = Math.max(0, Math.min(100, Math.round((0.8 - Math.min(STATE.press, 0.8)) / 0.8 * 100)));
    DATA.mini[2].items[2][1] = Math.round(STATE.level);

    // 报警列表更新
    const alarms = [];
    if (STATE.temp > 95 || STATE.press > 0.8) alarms.push({ time: fmtTime(), level: 'bad', text: STATE.temp > 95 ? '红色报警：温度 ' + STATE.temp.toFixed(1) + '°C > 95°C' : '红色报警：压力 ' + STATE.press.toFixed(2) + ' MPa > 0.8 MPa', note: '报警优先级 P1 · 立即处置' });
    if (STATE.temp > 85 && STATE.temp <= 95) alarms.push({ time: fmtTime(), level: 'warn', text: '黄色预警：温度 ' + STATE.temp.toFixed(1) + '°C > 85°C', note: '报警优先级 P2 · 请检查冷却水' });
    if (alarms.length === 0) alarms.push({ time: fmtTime(), level: 'ok', text: '无活跃报警', note: '所有参数在正常范围内' });
    DATA.right[1].items = alarms;

    // 重新渲染
    renderKpis();
    renderColumn('#ds-left', DATA.left);
    renderColumn('#ds-right', DATA.right);
    renderMini();
    drawDonuts();
    paintIcons();
  }

  function fmtTime() {
    const d = new Date();
    return d.getHours().toString().padStart(2,'0') + ':' + d.getMinutes().toString().padStart(2,'0');
  }

  /* ---------- ⑧ 时钟 ---------- */
  const clock = q('#ds-clock');
  function tick() {
    const d = new Date();
    clock.innerHTML = esc(d.toLocaleTimeString('zh-CN', { hour12: false })) +
      '<small>' + esc(d.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit', weekday: 'short' })) + '</small>';
  }
  tick();
  const clockTimer = setInterval(tick, 1000);

  let period = DATA.main.periods[0].id;

  /* ---------- ⑨ 交互 ---------- */
  const toast = q('#ds-toast');
  let toastTimer;
  function notify(text) {
    toast.textContent = text;
    toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (toast.hidden = true), 3200);
  }
  const dialog = q('#ds-dialog');
  function openDialog(title, body) {
    q('#ds-dialog-title').textContent = title;
    q('#ds-dialog-body').innerHTML = body;
    if (!dialog.open) dialog.showModal();
  }

  stage.addEventListener('click', (event) => {
    const seg = event.target.closest('button[data-period]');
    if (seg) { period = seg.dataset.period; renderMain(period); return; }

    const action = event.target.closest('[data-action]')?.dataset.action;

    if (action === 'close') { dialog.close(); return; }
    if (action === 'fullscreen') {
      (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen()).catch(() => notify('当前窗口不支持全屏'));
      return;
    }

    // 进料阀操作
    if (action === 'toggle-feed') {
      if (STATE.interlock) { notify('🔒 联锁已触发，禁止手动操作进料阀！'); return; }
      if (STATE.press >= 0.5) {
        notify('⚠️ 操作拒绝：当前压力 ' + STATE.press.toFixed(2) + ' MPa，需 < 0.5 MPa 方可操作进料阀。');
        return;
      }
      const newState = !STATE.feedValve;
      openDialog('确认操作：' + (newState ? '打开' : '关闭') + '进料阀',
        '<p>当前压力 <b class="ds-num" style="color:#3ad7ff">' + STATE.press.toFixed(2) + ' MPa</b>（✓ 满足条件 &lt;0.5 MPa）</p>' +
        '<p>确认要<b style="color:' + (newState?'#35e0a6':'#ff5d7a') + '"> ' + (newState?'打开':'关闭') + ' </b>进料阀吗？</p>' +
        '<div style="display:flex;gap:12px;margin-top:16px">' +
          '<button class="scada-btn scada-btn-open" data-action="confirm-feed-' + (newState?'open':'close') + '" style="flex:1">✓ 确认执行</button>' +
          '<button class="scada-btn scada-btn-close" data-action="close" style="flex:1">✕ 取消</button>' +
        '</div><p class="ds-note" style="margin-top:10px">操作将记录至审计日志。</p>'
      );
      return;
    }

    if (action === 'confirm-feed-open' || action === 'confirm-feed-close') {
      STATE.feedValve = action === 'confirm-feed-open';
      dialog.close();
      notify('✅ 进料阀已' + (STATE.feedValve ? '打开' : '关闭') + ' — 操作已记录');
      DATA.left[1].items.unshift({ time: fmtTime(), level: 'ok', text: '进料阀操作执行：' + (STATE.feedValve?'开阀':'关阀'), note: '操作员已确认 | 压力 ' + STATE.press.toFixed(2) + ' MPa' });
      if (DATA.left[1].items.length > 6) DATA.left[1].items.pop();
      renderColumn('#ds-left', DATA.left);
      renderColumn('#ds-right', DATA.right);
      paintIcons();
      return;
    }

    // 搅拌电机
    if (action === 'toggle-motor') {
      const newRpm = STATE.rpm > 0 ? 0 : 120;
      STATE.rpm = newRpm;
      notify(newRpm > 0 ? '✅ 搅拌电机已启动 (120 rpm)' : '⏹ 搅拌电机已停止');
      renderColumn('#ds-right', DATA.right);
      paintIcons();
      return;
    }

    // 紧急泄压（双人确认）
    if (action === 'emergency-vent') {
      STATE.emergConfirm = { a: false, b: false };
      openDialog('紧急泄压 — 双人确认',
        '<div class="scada-emergency-dialog">' +
        '<p class="scada-em-warning">⚠️ <b>紧急操作</b>：此操作将立即打开泄压阀降压，请确认工况安全。</p>' +
        '<p>当前状态：压力 <b style="color:#ff5d7a">' + STATE.press.toFixed(2) + ' MPa</b> · 温度 <b style="color:#ffb340">' + STATE.temp.toFixed(1) + '°C</b></p>' +
        '<div class="scada-dual-confirm">' +
          '<button class="scada-btn scada-btn-confirm" id="emg-btn-a" data-action="emg-confirm-a" aria-label="操作员A确认">👤 操作员 A 确认</button>' +
          '<button class="scada-btn scada-btn-confirm" id="emg-btn-b" data-action="emg-confirm-b" aria-label="操作员B确认">👤 操作员 B 确认</button>' +
        '</div>' +
        '<div id="emg-status" class="scada-emg-status">等待双人确认（0/2）…</div>' +
        '<button class="scada-btn scada-btn-close" data-action="close" style="margin-top:12px;width:100%">取消</button>' +
        '</div>'
      );
      return;
    }

    if (action === 'emg-confirm-a' || action === 'emg-confirm-b') {
      if (action === 'emg-confirm-a') STATE.emergConfirm.a = true;
      if (action === 'emg-confirm-b') STATE.emergConfirm.b = true;
      const btn = q('#' + (action === 'emg-confirm-a' ? 'emg-btn-a' : 'emg-btn-b'));
      if (btn) { btn.disabled = true; btn.classList.add('confirmed'); btn.textContent = (action==='emg-confirm-a'?'👤 操作员 A':'👤 操作员 B') + ' ✓'; }
      const cnt = (STATE.emergConfirm.a?1:0) + (STATE.emergConfirm.b?1:0);
      const statusEl = q('#emg-status');
      if (statusEl) statusEl.textContent = '已确认 ' + cnt + '/2' + (cnt < 2 ? '，等待另一人确认…' : '');
      if (STATE.emergConfirm.a && STATE.emergConfirm.b) {
        setTimeout(() => {
          dialog.close();
          STATE.press = Math.max(0.05, STATE.press - 0.3);
          STATE.temp = Math.max(60, STATE.temp - 5);
          DATA.left[1].items.unshift({ time: fmtTime(), level: 'bad', text: '紧急泄压执行：压力降至 ' + STATE.press.toFixed(2) + ' MPa', note: '双人确认完成 | A+B' });
          if (DATA.left[1].items.length > 6) DATA.left[1].items.pop();
          notify('🔴 紧急泄压已执行！压力已降至 ' + STATE.press.toFixed(2) + ' MPa');
          startAlarmSound('bad');
          setTimeout(stopAlarmSound, 3000);
          renderColumn('#ds-left', DATA.left);
          renderColumn('#ds-right', DATA.right);
          renderKpis();
          paintIcons();
        }, 600);
      }
      return;
    }

    if (action === 'mute-alarm') {
      STATE.alarmMuted = !STATE.alarmMuted;
      stopAlarmSound();
      notify(STATE.alarmMuted ? '🔕 报警声音已静音' : '🔔 报警声音已恢复');
      return;
    }

    const kpi = event.target.closest('[data-kpi]');
    if (kpi) {
      const k = DATA.kpis[Number(kpi.dataset.kpi)];
      openDialog(k.label + ' · 详情',
        '<p>当前值 <b class="ds-num" style="color:' + alarmColor[k.alarm||''] + '">' + num(k.value) + ' ' + esc(k.unit) + '</b></p>' +
        (k.alarmText ? '<p class="scada-em-warning">⚠️ ' + esc(k.alarmText) + '</p>' : '') +
        '<div class="ds-facts"><div><span>近期最大值</span><strong class="ds-num">' + num(Math.max(...k.spark)) + '</strong></div><div><span>近期最小值</span><strong class="ds-num">' + num(Math.min(...k.spark)) + '</strong></div></div>' +
        '<p class="ds-note">演示数据，点击关闭。</p>'
      );
    }
  });

  dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });

  /* ---------- ⑩ 初始化 ---------- */
  renderKpis();
  renderColumn('#ds-left', DATA.left);
  renderColumn('#ds-right', DATA.right);
  renderMain(period);
  renderMini();
  renderTicker();
  paintIcons();

  // 启动实时模拟（每2秒更新一次）
  const simTimer = setInterval(simStep, 2000);

  VizLabRuntime.onDispose(() => {
    clearInterval(clockTimer);
    clearInterval(simTimer);
    stopAlarmSound();
    if (audioCtx) { audioCtx.close(); audioCtx = null; }
  });
})();
