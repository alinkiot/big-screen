/* Scene geometry: highway slope geo-hazard monitoring. MIT license. */
(() => {
  const { THREE, box, cylinder, line, standard, glow, label, seed, halo, batchStatic } =
    window.AstraGeometry;

  // ── 预警等级颜色 ──────────────────────────────────────────
  const LEVEL_COLOR = {
    normal:  '#3ad7ff',  // 蓝 · 正常
    watch:   '#ffe066',  // 黄 · 注意
    warning: '#ff9a3c',  // 橙 · 预警
    alarm:   '#ff4d6a',  // 红 · 告警
  };

  // ── 各监测断面定义 [x, z, 等级, 编号] ────────────────────
  const SECTIONS = [
    { id: 'k3+200', x: -14, z: -3,  level: 'normal',  name: 'K3+200 断面' },
    { id: 'k5+480', x: -7,  z:  2,  level: 'watch',   name: 'K5+480 断面' },
    { id: 'k8+060', x:  0,  z: -1,  level: 'warning', name: 'K8+060 断面' },
    { id: 'k11+320',x:  7,  z:  3,  level: 'alarm',   name: 'K11+320 断面' },
    { id: 'k14+760',x:  14, z: -2,  level: 'normal',  name: 'K14+760 断面' },
  ];

  function buildGeoHazard(scene) {
    const root = new THREE.Group();
    scene.add(root);

    const terrain  = new THREE.Group();
    const highway  = new THREE.Group();
    const sensors  = new THREE.Group();
    const pins     = new THREE.Group();
    root.add(terrain, highway, sensors, pins);

    // ── 材质 ──────────────────────────────────────────────
    const matBase    = standard('#3a2a18');   // 土褐色 基底
    const matSlope   = standard('#4d3520');   // 坡面土褐
    const matRock    = standard('#5c4a34', { metalness: 0.08, roughness: 0.92 }); // 岩石
    const matRoad    = standard('#2b2b2b', { metalness: 0.0, roughness: 0.85 });  // 路面
    const matLine    = standard('#f0f0e8', { metalness: 0.1, roughness: 0.6 });   // 标线
    const matGuard   = standard('#d4c890', { metalness: 0.3, roughness: 0.5 });   // 护栏
    const matCyan    = glow('#3ad7ff');
    const matGreen   = glow('#35e0a6');
    const matYellow  = glow('#ffe066');
    const matOrange  = glow('#ff9a3c');
    const matRed     = glow('#ff4d6a');
    const GLOW_MAT   = { normal: matCyan, watch: matYellow, warning: matOrange, alarm: matRed };

    // ── 地基与地形底层 ────────────────────────────────────
    box(root, 0, -1.2, 0, 40, 1.5, 28, matBase);

    // 地形高低起伏（山体截面感）
    const hillData = [
      // [x, baseY, z, w, h, d]
      [-16, 0.5,  -8, 6, 3.5, 8,  matSlope],
      [-12, 1.0,  -6, 5, 5.0, 6,  matRock],
      [ -8, 0.6,  -7, 5, 3.8, 7,  matSlope],
      [ -4, 1.2,  -5, 4, 5.5, 5,  matRock],
      [  0, 0.8,  -8, 5, 4.2, 8,  matSlope],
      [  4, 1.4,  -6, 4, 6.0, 6,  matRock],
      [  8, 0.7,  -7, 5, 4.5, 7,  matSlope],
      [ 12, 1.1,  -5, 5, 5.2, 5,  matRock],
      [ 16, 0.9,  -8, 6, 4.0, 8,  matSlope],
      // 对侧缓坡
      [-15, 0.3,   8, 6, 1.8, 6,  matSlope],
      [ -7, 0.4,   9, 5, 2.2, 5,  matSlope],
      [  0, 0.3,   8, 5, 1.6, 5,  matSlope],
      [  7, 0.4,   9, 5, 2.0, 5,  matSlope],
      [ 14, 0.3,   8, 6, 1.8, 6,  matSlope],
    ];
    hillData.forEach(([x, by, z, w, h, d, mat]) => {
      box(terrain, x, by + h / 2, z, w, h, d, mat);
    });

    // 裸岩纹理块（小石头堆）
    for (let i = 0; i < 18; i++) {
      const sx = seed(i * 7) * 30 - 15;
      const sz = -(seed(i * 7 + 1) * 8 + 1);
      const sh = seed(i * 7 + 2) * 0.5 + 0.15;
      box(terrain, sx, sh / 2 + 0.02, sz, sh * 1.2, sh, sh * 0.9, matRock);
    }

    // ── 公路（穿越山谷的高速公路）────────────────────────
    // 路面
    box(highway, 0, 0.05, 0, 40, 0.12, 8, matRoad);
    // 中央分隔带
    box(highway, 0, 0.16, 0, 40, 0.10, 0.5, standard('#1a6b2f'));
    // 标线（虚线）
    for (let x = -18; x <= 18; x += 2.4) {
      box(highway, x, 0.18, 2.0,  1.4, 0.02, 0.15, matLine);
      box(highway, x, 0.18, -2.0, 1.4, 0.02, 0.15, matLine);
    }
    // 边界实线
    box(highway, 0, 0.17,  3.6, 40, 0.02, 0.12, matLine);
    box(highway, 0, 0.17, -3.6, 40, 0.02, 0.12, matLine);
    // 护栏（山侧）
    for (let x = -18; x <= 18; x += 1.2) {
      cylinder(highway, x, 0.52, -4.2, 0.06, 0.85, matGuard);
    }
    box(highway, 0, 0.88, -4.2, 40, 0.06, 0.08, matGuard);
    // 护栏（谷侧）
    for (let x = -18; x <= 18; x += 1.2) {
      cylinder(highway, x, 0.52,  4.2, 0.06, 0.85, matGuard);
    }
    box(highway, 0, 0.88,  4.2, 40, 0.06, 0.08, matGuard);

    // ── 监测断面与传感器 ─────────────────────────────────
    SECTIONS.forEach(({ id, x, z: sz, level, name }, i) => {
      const glowMat = GLOW_MAT[level];
      const color   = LEVEL_COLOR[level];

      // 断面标尺（倾斜测斜管，插入坡体）
      const slantZ = sz - 6.5;
      cylinder(sensors, x, 3.5, slantZ, 0.05, 7.0, standard('#c0c8d8', { metalness:0.5, roughness:0.4 }));

      // 传感器节点（发光球）
      const sensorGeo = new THREE.SphereGeometry(0.22, 10, 8);
      const sensorMesh = new THREE.Mesh(sensorGeo, glowMat);
      sensorMesh.position.set(x, 1.6, slantZ);
      sensors.add(sensorMesh);

      // 地面光晕
      halo(sensors, x, slantZ, color, 1.1);

      // 雨量计（圆柱仪器）
      cylinder(sensors, x + 0.5, 0.6, sz - 3, 0.12, 1.2, standard('#8899bb', { metalness:0.4 }));
      cylinder(sensors, x + 0.5, 1.28, sz - 3, 0.18, 0.12, standard('#aab8cc'));

      // 连接线（从测斜管顶到雨量计顶的细线）
      line(sensors, [[x, 7.1, slantZ], [x + 0.5, 1.35, sz - 3]], color, 0.4);

      // 标签
      label(name, [x, 8.5, slantZ], `${name} · ${levelLabel(level)} · 位移速率 ${dispRate(level)} mm/d`);
    });

    // ── 扫描网格平面 ──────────────────────────────────────
    const scanMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { time: { value: 0 } },
      vertexShader:
        'varying vec2 v;void main(){v=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader:
        'varying vec2 v;uniform float time;void main(){float grid=pow(max(0.,1.-abs(sin(v.x*120.)*sin(v.y*100.))),20.);float r=length((v-.5)*vec2(1.8,1.));float wave=1.-smoothstep(0.,.018,abs(r-mod(time*.045,.7)));gl_FragColor=vec4(.3,.6,.35,wave*.25+grid*.025);}',
    });
    const scanPlane = new THREE.Mesh(new THREE.PlaneGeometry(40, 28), scanMat);
    scanPlane.rotation.x = -Math.PI / 2;
    scanPlane.position.y = 0.22;
    root.add(scanPlane);

    // 场景外框
    line(root,
      [[-20,0.2,-14],[20,0.2,-14],[20,0.2,14],[-20,0.2,14],[-20,0.2,-14]],
      '#3ad7ff', 0.6);

    // ── 批量合并静态网格 ──────────────────────────────────
    batchStatic(terrain);
    batchStatic(highway);
    batchStatic(sensors, [scanPlane]);
    batchStatic(root, [terrain, highway, sensors, scanPlane]);

    return {
      root,
      home: [42, 36, 44],
      target: [0, 1, 0],
      scanMat,
      update(t, running) {
        if (!running) return;
        scanMat.uniforms.time.value = t;
      },
      setLayer(v) {
        highway.visible  = v !== 'sensors';
        sensors.visible  = v !== 'highway';
        terrain.visible  = true;
      },
    };
  }

  function levelLabel(l) {
    return { normal:'正常', watch:'注意', warning:'预警', alarm:'告警' }[l];
  }
  function dispRate(l) {
    return { normal:'0.4', watch:'1.3', warning:'2.6', alarm:'4.1' }[l];
  }

  ObservatoryScenes.builders['geo-hazard'] = ({ root, animations, pick, state }) => {
    const model = buildGeoHazard(root);

    // 注册点选拾取盒（在每个断面传感器节点附近）
    SECTIONS.forEach(({ id, x, z: sz }) => {
      const slantZ = sz - 6.5;
      pick(id, null, [x, 3.5, slantZ], [1.8, 7.5, 1.8], 'sensors');
    });

    model.update(0, true);
    animations.push((t) => model.update(t, state.running !== false));

    return {
      setLayer: (v) => model.setLayer(v),
      root: model.root,
    };
  };
})();
