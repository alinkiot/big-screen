/* SPDX-License-Identifier: MIT — 城市供水管网3D孪生 model.js */
(() => {
  const { THREE, box, cylinder, line, standard, glow, label, seed, halo, batchStatic } =
    window.AstraGeometry;

  /* ---- 压力等级材质（绿→黄→红） ---- */
  const matNormal  = glow('#00e5a0', 0.9);  // 绿：正常压力
  const matMid     = glow('#f5c400', 0.9);  // 黄：偏低压力
  const matHigh    = glow('#ff6030', 0.95); // 橙红：压力偏高
  const matAlarm   = glow('#ff2040', 1.0);  // 红：报警（爆管疑似）

  /* 压力等级 → 材质映射 */
  function pressureMat(level) {
    if (level === 'alarm') return matAlarm;
    if (level === 'high')  return matHigh;
    if (level === 'mid')   return matMid;
    return matNormal;
  }

  function buildWaterNetwork(sceneRoot) {
    const root     = new THREE.Group();
    const pipes    = new THREE.Group();  // 管道层（可独立控制显隐）
    const pumps    = new THREE.Group();  // 泵站层
    const sensors  = new THREE.Group(); // 监测点层
    const cityBase = new THREE.Group(); // 城市底图层
    sceneRoot.add(root);
    root.add(cityBase, pipes, pumps, sensors);

    /* ======== 1. 城市地面底图 ======== */
    const matGround = standard('#07111e');
    const matBlock  = standard('#0c1e30');
    const matBlock2 = standard('#0e2438');
    const matRoad   = standard('#091828');
    const matWater  = standard('#0a2a45', { metalness: 0.6, roughness: 0.3 });
    const matBldLow = standard('#112240', { metalness: 0.3, roughness: 0.5 });
    const matBldHi  = standard('#162d52', { metalness: 0.4, roughness: 0.4 });
    const matBldGlass = standard('#1a4870', { metalness: 0.8, roughness: 0.15 });
    const matAccent = glow('#00d4ff', 0.5);

    // 地面
    box(cityBase, 0, -0.12, 0, 42, 0.08, 38, matGround);

    // 主干道网格（竖向+横向）
    const vRoads = [-14, -6, 2, 10, 18];
    const hRoads = [-14, -6, 2, 10];
    vRoads.forEach(x => box(cityBase, x, 0, 0, 1.2, 0.04, 38, matRoad));
    hRoads.forEach(z => box(cityBase, 2, 0, z, 42, 0.04, 1.0, matRoad));

    // 城市街区（小地块）
    const blocks = [
      [-18, 0.06, -10, 6, 0.12, 5],
      [-10, 0.06, -10, 5, 0.12, 5],
      [-1,  0.06, -10, 6, 0.12, 5],
      [7,   0.06, -10, 5, 0.12, 5],
      [14,  0.06, -10, 6, 0.12, 5],
      [-18, 0.06, -2,  6, 0.12, 5],
      [-10, 0.06, -2,  5, 0.12, 5],
      [-1,  0.06, -2,  6, 0.12, 5],
      [7,   0.06, -2,  5, 0.12, 5],
      [14,  0.06, -2,  6, 0.12, 5],
      [-18, 0.06,  6,  6, 0.12, 5],
      [-10, 0.06,  6,  5, 0.12, 5],
      [-1,  0.06,  6,  6, 0.12, 5],
      [7,   0.06,  6,  5, 0.12, 5],
      [14,  0.06,  6,  6, 0.12, 5],
    ];
    blocks.forEach(([x,y,z,w,h,d]) => box(cityBase, x, y, z, w, h, d, matBlock));

    // 楼房群（密集小盒子模拟城市肌理）
    const bldgDefs = [
      // [区域中心x, 中心z, 列数, 行数, 高度范围min, max, wBase]
      [-18, -10, 3, 3, 0.8, 3.2, 1.4],
      [-10, -10, 3, 3, 0.6, 2.4, 1.2],
      [-1,  -10, 3, 3, 0.8, 4.0, 1.5],
      [7,   -10, 3, 3, 0.6, 2.8, 1.2],
      [14,  -10, 3, 3, 1.0, 3.8, 1.4],
      [-18,  -2, 3, 3, 0.8, 3.0, 1.3],
      [-10,  -2, 3, 3, 0.6, 2.2, 1.1],
      [-1,   -2, 3, 3, 1.2, 5.0, 1.6],  // 高层区
      [7,    -2, 3, 3, 0.8, 3.5, 1.3],
      [14,   -2, 3, 3, 0.6, 2.8, 1.2],
      [-18,   6, 3, 3, 0.7, 2.6, 1.2],
      [-10,   6, 3, 3, 0.8, 3.2, 1.3],
      [-1,    6, 3, 3, 1.0, 4.2, 1.5],
      [7,     6, 3, 3, 0.8, 3.0, 1.3],
      [14,    6, 3, 3, 0.6, 2.5, 1.1],
    ];
    const batchBldg = new THREE.Group();
    root.add(batchBldg);
    bldgDefs.forEach(([cx, cz, cols, rows, hmin, hmax, wb], bi) => {
      for (let c = 0; c < cols; c++) {
        for (let r = 0; r < rows; r++) {
          const x = cx - (cols-1)*0.9 + c*1.8;
          const z = cz - (rows-1)*0.8 + r*1.6;
          const h = hmin + seed(bi*9+c*3+r) * (hmax - hmin);
          const w = wb * (0.8 + seed(bi*7+c+r)*0.4);
          const d = wb * 0.8 * (0.8 + seed(bi*5+c*2+r)*0.3);
          const mat = h > 3.0 ? matBldGlass : h > 1.8 ? matBldHi : matBldLow;
          box(batchBldg, x, h/2 + 0.05, z, w, h, d, mat);
          // 顶部灯带
          if (h > 2.0) {
            box(batchBldg, x, h + 0.06, z, w+0.04, 0.03, d+0.04, matAccent);
          }
        }
      }
    });
    batchStatic(batchBldg);

    // 水体（河道）
    box(cityBase, 0, 0.02, 14, 42, 0.06, 4, matWater);

    /* ======== 2. 供水主干管网 ======== */
    // 管道截面直径用box模拟（宽度代表管径）
    // 初始状态：全部正常（绿色），运行时动态变色
    const PIPE_DIAM = 0.22;  // 主干管径（视觉宽度）
    const PIPE_H    = 0.15;  // 管道离地高度

    // 主干管道段定义：[起点x,z  终点x,z  管段id  初始压力等级]
    // 以管网中心(0,0)为原点，参考城市路网布置
    const pipeDefs = [
      // 东西主干
      { id: 'p-ew-1', pts: [[-20, -10], [-14, -10], [-6, -10], [2, -10], [10, -10], [18, -10]], level: 'normal' },
      { id: 'p-ew-2', pts: [[-20, -2],  [-14, -2],  [-6, -2],  [2, -2],  [10, -2],  [18, -2]],  level: 'normal' },
      { id: 'p-ew-3', pts: [[-20, 6],   [-14, 6],   [-6, 6],   [2, 6],   [10, 6],   [18, 6]],   level: 'mid'    },
      // 南北主干
      { id: 'p-ns-1', pts: [[-14, -14], [-14, -10], [-14, -2], [-14, 6], [-14, 12]], level: 'normal' },
      { id: 'p-ns-2', pts: [[-6,  -14], [-6,  -10], [-6,  -2], [-6,  6], [-6,  12]], level: 'normal' },
      { id: 'p-ns-3', pts: [[2,   -14], [2,   -10], [2,   -2], [2,   6], [2,   12]], level: 'high'   },
      { id: 'p-ns-4', pts: [[10,  -14], [10,  -10], [10,  -2], [10,  6], [10,  12]], level: 'normal' },
      { id: 'p-ns-5', pts: [[18,  -14], [18,  -10], [18,  -2], [18,  6], [18,  12]], level: 'normal' },
      // 支管（报警段示例）
      { id: 'p-alarm', pts: [[-6, -2],  [-6, -6],   [-10, -6]], level: 'alarm' },
    ];

    const pipeMeshes = {};
    pipeDefs.forEach(def => {
      const mat = pressureMat(def.level);
      const threePoints = def.pts.map(([x, z]) => new THREE.Vector3(x, PIPE_H, z));
      const geom = new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3(threePoints),
        threePoints.length * 4,
        PIPE_DIAM / 2,
        6,
        false
      );
      const mesh = new THREE.Mesh(geom, mat);
      pipes.add(mesh);
      pipeMeshes[def.id] = { mesh, level: def.level, pts: def.pts };
    });

    // 管道水流粒子效果（沿管道行进的小点）
    const flowParticles = [];
    pipeDefs.slice(0, 6).forEach((def, di) => {
      const pts3 = def.pts.map(([x,z]) => new THREE.Vector3(x, PIPE_H + 0.03, z));
      const curve = new THREE.CatmullRomCurve3(pts3);
      for (let j = 0; j < 3; j++) {
        const pGeom = new THREE.SphereGeometry(0.08, 4, 4);
        const pMat  = new THREE.MeshBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.85 });
        const pm = new THREE.Mesh(pGeom, pMat);
        root.add(pm);
        flowParticles.push({ mesh: pm, curve, offset: j / 3 + di * 0.11 });
      }
    });

    /* ======== 3. 泵站 ======== */
    // 泵站定义：[x, z, id, name, 运行状态]
    const pumpDefs = [
      { id: 'pump-a', x: -14, z: -14, name: 'PS-A 一水厂', status: 'running' },
      { id: 'pump-b', x:  10, z: -14, name: 'PS-B 二水厂', status: 'running' },
      { id: 'pump-c', x:  18, z:  6,  name: 'PS-C 加压站', status: 'warning' },
      { id: 'pump-d', x: -14, z:  12, name: 'PS-D 加压站', status: 'running' },
    ];

    const matPumpBase  = standard('#1a3a5a', { metalness: 0.5 });
    const matPumpBody  = standard('#1e4f78', { metalness: 0.6, roughness: 0.3 });
    const matPumpTop   = standard('#2d6fa0', { metalness: 0.7, roughness: 0.25 });
    const matPumpRun   = glow('#00e5a0', 0.9);
    const matPumpWarn  = glow('#f5c400', 1.0);

    const pumpMeshes = {};
    pumpDefs.forEach(def => {
      const g = new THREE.Group();
      // 主体
      box(g, 0, 0.6, 0, 2.8, 1.2, 2.2, matPumpBody);
      box(g, 0, 1.25, 0, 2.6, 0.06, 2.0, matPumpTop);
      // 水塔
      cylinder(g, 0, 3.0, 0, 0.55, 3.5, matPumpBase, 0.5);
      cylinder(g, 0, 4.9, 0, 0.9, 0.6, matPumpTop);
      // 状态灯带
      const glowMat = def.status === 'warning' ? matPumpWarn : matPumpRun;
      box(g, 0, 1.32, 0, 2.8, 0.05, 2.2, glowMat);
      // 地面光环
      halo(root, def.x, def.z, def.status === 'warning' ? '#f5c400' : '#00e5a0', 2.5);
      g.position.set(def.x, 0, def.z);
      pumps.add(g);
      pumpMeshes[def.id] = { group: g, status: def.status };
    });

    /* ======== 4. 监测点（传感器节点） ======== */
    // 在管道交叉点布置压力监测站
    const monitorDefs = [
      { id: 'mon-01', x: -14, z: -10, label: 'M01', pressure: 0.42, flow: 185, level: 'normal' },
      { id: 'mon-02', x:  -6, z: -10, label: 'M02', pressure: 0.38, flow: 162, level: 'normal' },
      { id: 'mon-03', x:   2, z: -10, label: 'M03', pressure: 0.45, flow: 190, level: 'normal' },
      { id: 'mon-04', x:  10, z: -10, label: 'M04', pressure: 0.41, flow: 175, level: 'normal' },
      { id: 'mon-05', x: -14, z:  -2, label: 'M05', pressure: 0.35, flow: 148, level: 'mid'    },
      { id: 'mon-06', x:  -6, z:  -2, label: 'M06', pressure: 0.18, flow: 290, level: 'alarm'  }, // 爆管疑似
      { id: 'mon-07', x:   2, z:  -2, label: 'M07', pressure: 0.48, flow: 201, level: 'high'   },
      { id: 'mon-08', x:  10, z:  -2, label: 'M08', pressure: 0.40, flow: 170, level: 'normal' },
      { id: 'mon-09', x:  -6, z:   6, label: 'M09', pressure: 0.36, flow: 155, level: 'mid'    },
      { id: 'mon-10', x:   2, z:   6, label: 'M10', pressure: 0.43, flow: 182, level: 'normal' },
    ];

    const monMeshes = {};
    const matMonBase   = standard('#0d2a42');
    const matMonPole   = standard('#16405e', { metalness: 0.5 });

    monitorDefs.forEach(def => {
      const g = new THREE.Group();
      // 基座
      cylinder(g, 0, 0.18, 0, 0.32, 0.36, matMonBase);
      // 立杆
      cylinder(g, 0, 0.9, 0, 0.06, 1.2, matMonPole);
      // 传感器头（颜色按压力等级）
      const headMat = pressureMat(def.level);
      cylinder(g, 0, 1.55, 0, 0.22, 0.3, headMat);
      // 光环
      halo(root, def.x, def.z, def.level === 'alarm' ? '#ff2040' : def.level === 'mid' ? '#f5c400' : '#00e5a0', 0.9);
      g.position.set(def.x, 0, def.z);
      sensors.add(g);
      monMeshes[def.id] = { group: g, def };
    });

    /* ======== 5. 扫描面 & 边框 ======== */
    // 蓝色格线扫描面（城市鸟瞰感）
    const scan = new THREE.Mesh(
      new THREE.PlaneGeometry(44, 40),
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: { time: { value: 0 } },
        vertexShader:
          'varying vec2 v;void main(){v=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
        fragmentShader: `
          varying vec2 v;
          uniform float time;
          void main(){
            float r = length((v - 0.5) * vec2(1.1, 1.0));
            float wave = 1.0 - smoothstep(0.0, 0.018, abs(r - mod(time * 0.055, 0.7)));
            float gridX = pow(max(0.0, 1.0 - abs(sin(v.x * 220.0))), 22.0);
            float gridZ = pow(max(0.0, 1.0 - abs(sin(v.y * 200.0))), 22.0);
            float grid = (gridX + gridZ) * 0.5;
            gl_FragColor = vec4(0.05, 0.55, 0.9, wave * 0.22 + grid * 0.028);
          }
        `,
      }),
    );
    scan.rotation.x = -Math.PI / 2;
    scan.position.y = 0.08;
    root.add(scan);

    // 外框
    line(root, [[-21, 0.18, -15],[21, 0.18, -15],[21, 0.18, 15],[-21, 0.18, 15],[-21, 0.18, -15]], '#00d4ff', 0.55);

    /* ======== 6. 批合静态几何 ======== */
    batchStatic(cityBase);
    batchStatic(pipes);
    batchStatic(pumps, []);
    batchStatic(sensors);
    batchStatic(root, [cityBase, pipes, pumps, sensors, scan, ...flowParticles.map(p=>p.mesh), batchBldg]);

    return {
      root,
      home: [38, 32, 44],
      target: [0, 0.5, 0],
      pipeMeshes,
      pumpMeshes,
      monMeshes,
      scan,
      flowParticles,
      labels: [
        label('PS-A 一水厂',  [-14, 6, -14], '一水厂 · 供水能力 6万m³/日 · 扬程 45m · 运行正常'),
        label('PS-B 二水厂',  [10,  6, -14], '二水厂 · 供水能力 8万m³/日 · 扬程 52m · 运行正常'),
        label('PS-C 加压站',  [18,  6,  6],  '加压站C · 出口压力偏低 · 建议巡检'),
        label('M06 爆管预警', [-6,  4, -2],  '⚠ M06监测点：压力异常低 0.18MPa，流量骤增290m³/h，疑似管道破损'),
      ],
      setLayer(value) {
        pipes.visible   = value !== 'pumps';
        pumps.visible   = value !== 'pipes';
        sensors.visible = true;
      },
      update(t, running = true) {
        if (!running) return;
        scan.material.uniforms.time.value = t;
        // 水流粒子动画
        flowParticles.forEach((fp) => {
          const progress = ((fp.offset + t * 0.09) % 1);
          const pos = fp.curve.getPoint(progress);
          fp.mesh.position.copy(pos);
          fp.mesh.material.opacity = 0.5 + Math.sin(t * 3 + fp.offset * 6) * 0.3;
        });
        // 报警监测点闪烁（M06）
        const alarmSensor = monMeshes['mon-06'];
        if (alarmSensor) {
          alarmSensor.group.children.forEach(c => {
            if (c.material && c.material.emissive) {
              c.material.emissiveIntensity = 0.5 + Math.sin(t * 4) * 0.5;
            }
          });
        }
      },
    };
  }

  ObservatoryScenes.builders['water-network'] = ({ root, animations, pick, state }) => {
    const model = buildWaterNetwork(root);

    // 注册可点击对象：泵站
    pick('pump-a', null, [-14, 3, -14], [4, 6, 4], 'pumps');
    pick('pump-b', null, [10,  3, -14], [4, 6, 4], 'pumps');
    pick('pump-c', null, [18,  3,  6],  [4, 6, 4], 'pumps');
    pick('pump-d', null, [-14, 3,  12], [4, 6, 4], 'pumps');

    // 注册可点击对象：关键管段
    pick('pipe-alarm', null, [-8, 1, -4], [6, 2, 6], 'pipes');
    pick('pipe-main',  null, [0,  1, -10], [14, 2, 4], 'pipes');

    model.update(0, true);
    animations.push((t) => model.update(t, true));

    return {
      setLayer: (value) => model.setLayer(value),
      root: model.root,
    };
  };
})();
