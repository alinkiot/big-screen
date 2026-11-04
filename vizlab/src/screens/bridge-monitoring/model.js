/* Scene geometry adapted with owner permission from big-screen-astra; MIT in this distribution. */
(() => {
  const { THREE, box, cylinder, line, standard, glow, label, seed, halo, batchStatic } =
    window.AstraGeometry;
  function buildBridge(scene) {
    const root = new THREE.Group();
    scene.add(root);
    const structure = new THREE.Group(),
      sensors = new THREE.Group(),
      maintenance = new THREE.Group();
    root.add(structure, sensors, maintenance);
    
    const base = standard('#151b37'),
      road = standard('#222b47'),
      concrete = standard('#697ab0', { metalness: 0.3, roughness: 0.8 }),
      steel = standard('#b6c9e8', { metalness: 0.9, roughness: 0.2 }),
      bridgeBlue = glow('#70b8ff'),
      sensorGreen = glow('#70ff8d'),
      warningOrange = glow('#ffb870');
    
    // River base
    box(root, 0, -0.65, 0, 35, 1, 27, base);
    box(root, 0, -0.5, 0, 33, 0.3, 25, standard('#1a2958'));
    
    // Bridge deck
    box(root, 0, 0.2, 0, 25, 0.4, 5, concrete);
    for (let z = -4; z <= 4; z += 2) {
      box(root, 0, 0.1, z * 3, 25, 0.2, 1, road);
    }
    
    // Main girders
    for (const x of [-8, 8]) {
      box(structure, x, 0.1, 0, 0.8, 0.8, 25, steel);
      for (let z = -12; z <= 12; z += 4) {
        cylinder(structure, x, 0.8, z, 0.3, 1.6, steel);
      }
    }
    
    // Piers
    const piers = [
      [-12, -4, 4],
      [-4, -4, 4],
      [4, -4, 4],
      [12, -4, 4],
      [-12, 4, 4],
      [-4, 4, 4],
      [4, 4, 4],
      [12, 4, 4],
    ];
    
    piers.forEach(([x, z, h], i) => {
      box(structure, x, h/2, z, 1.2, h, 1.2, concrete);
      box(structure, x, h + 0.1, z, 2, 0.2, 2, steel);
      
      // Add sensor points on piers
      for (let y = 0.8; y < h; y += 1.5) {
        cylinder(sensors, x, y, z, 0.08, 0.1, sensorGreen);
        box(sensors, x, y + 0.15, z, 0.15, 0.05, 0.15, bridgeBlue);
      }
    });
    
    // Cable-stayed bridge cables
    for (let i = 0; i < 5; i++) {
      const x = -10 + i * 5;
      line(structure, [[x, 8, -10], [x, 0.8, -2]], bridgeBlue, 0.05);
      line(structure, [[x, 8, 10], [x, 0.8, 2]], bridgeBlue, 0.05);
    }
    
    // Pylons
    for (const x of [-10, 10]) {
      box(structure, x, 4, 0, 0.8, 8, 0.8, steel);
      box(structure, x, 8.2, 0, 1.2, 0.4, 1.2, bridgeBlue);
      for (let y = 2; y < 8; y += 1.5) {
        cylinder(structure, x, y, 0, 0.5, 0.2, steel);
      }
    }
    
    // Sensor network visualization
    for (let i = 0; i < 24; i++) {
      const x = -11 + (i % 12) * 2;
      const z = i < 12 ? -8 : 8;
      cylinder(sensors, x, 1.5, z, 0.05, 0.2, sensorGreen);
      const sensorGlow = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), sensorGreen);
      sensorGlow.position.set(x, 1.7, z);
      sensors.add(sensorGlow);
    }
    
    // Maintenance activity points
    const maintenancePoints = [
      [-6, 0.8, -6],
      [0, 0.8, 0],
      [8, 0.8, 4],
    ];
    
    maintenancePoints.forEach(([x, y, z], i) => {
      const maintenanceMarker = new THREE.Group();
      cylinder(maintenanceMarker, 0, 0, 0, 0.3, 0.1, warningOrange);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.03, 6, 24), warningOrange);
      ring.rotation.x = Math.PI / 2;
      maintenanceMarker.add(ring);
      maintenanceMarker.position.set(x, y, z);
      maintenance.add(maintenanceMarker);
    });
    
    // Scan overlay for monitoring
    const scan = new THREE.Mesh(
      new THREE.PlaneGeometry(35, 27),
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: { time: { value: 0 } },
        vertexShader:
          'varying vec2 v;void main(){v=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
        fragmentShader:
          'varying vec2 v;uniform float time;void main(){float r=length((v-.5)*vec2(1.3,1.));float wave=1.-smoothstep(0.,.024,abs(r-mod(time*.065,.8)));float grid=pow(max(0.,1.-abs(sin(v.x*180.)*sin(v.y*140.))),18.);gl_FragColor=vec4(.37,.49,1.,wave*.24+grid*.025);}',
      }),
    );
    scan.rotation.x = -Math.PI / 2;
    scan.position.y = 0.18;
    root.add(scan);
    
    // Boundary lines
    line(
      root,
      [
        [-17, 0.2, -13],
        [17, 0.2, -13],
        [17, 0.2, 13],
        [-17, 0.2, 13],
        [-17, 0.2, -13],
      ],
      '#70b8ff',
      0.6,
    );
    
    // Vehicle traffic simulation
    const vehicles = [];
    for (let i = 0; i < 5; i++) {
      const vehicle = new THREE.Group();
      box(vehicle, 0, 0.3, 0, 0.6, 0.3, 1.0, i % 2 ? steel : concrete);
      box(vehicle, 0, 0.5, 0, 0.4, 0.15, 0.5, standard('#b6c9e8', { metalness: 0.7, roughness: 0.3 }));
      root.add(vehicle);
      vehicles.push(vehicle);
    }
    
    // Drone for inspection simulation
    const drone = new THREE.Group();
    box(drone, 0, 0.2, 0, 0.3, 0.1, 0.3, warningOrange);
    for (const x of [-0.2, 0.2]) {
      for (const z of [-0.2, 0.2]) {
        cylinder(drone, x, 0.25, z, 0.06, 0.1, sensorGreen);
      }
    }
    root.add(drone);
    
    batchStatic(structure);
    batchStatic(sensors);
    batchStatic(maintenance);
    batchStatic(root, [structure, sensors, maintenance, scan, ...vehicles, drone]);
    
    return {
      root,
      home: [40, 25, 45],
      target: [0, 2, 0],
      labels: [
        label(
          '01 · 跨江大桥',
          [10, 6, -4],
          '主跨 320m 斜拉桥 · 监测点位 86 个 · 安全指数 98.6 分',
        ),
        label('02 · 城市高架桥', [-6, 4, 4], '装配式连续梁桥 · 设备在线率 99.5% · 巡检周期每周'),
        label('03 · 大型立交桥', [-10, 3, -8], '多层互通式立交 · 无人机巡检 3 架次/日 · 健康评级 A 级'),
      ],
      setLayer(v) {
        sensors.visible = v !== 'maintenance';
        maintenance.visible = v !== 'devices';
        structure.children.forEach((o) => {
          if (o.material?.color) o.material.opacity = 1;
        });
      },
      update(t, running = true) {
        if (!running) return;
        scan.material.uniforms.time.value = t;
        
        // Vehicle movement
        vehicles.forEach((v, i) => {
          const p = (t * 2.0 + i * 12) % 50;
          v.position.set(
            p < 25 ? -12 + p : 12 - (p - 25),
            0.3,
            i < 3 ? -1 : 1
          );
        });
        
        // Drone movement
        const dronePath = (t * 0.8) % 20;
        drone.position.set(
          -10 + dronePath,
          3 + Math.sin(t * 2) * 0.5,
          -6 + Math.cos(t * 1.5) * 2
        );
        
        // Sensor pulsing
        sensors.children.forEach((sensor, i) => {
          if (sensor.material?.emissive) {
            const pulse = Math.sin(t * 3 + i * 0.5) * 0.5 + 0.5;
            sensor.material.emissiveIntensity = pulse * 0.3;
          }
        });
      },
    };
  }

  ObservatoryScenes.builders['bridge-monitoring'] = ({ root, animations, pick, state }) => {
    const model = buildBridge(root);
    [
      ['main-bridge', [10, 4, -4], [8, 8, 8], 'response'],
      ['viaduct', [-6, 2.5, 4], [6, 5, 6], 'devices'],
      ['interchange', [-10, 2, -8], [7, 5, 7], 'maintenance'],
    ].forEach(([id, position, size, layer]) => pick(id, null, position, size, layer));
    model.update(0, true);
    animations.push((t) => model.update(t, true));
    return { setLayer: (value) => model.setLayer(value), root: model.root };
  };
})();
