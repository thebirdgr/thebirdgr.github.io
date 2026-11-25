// Interactive 3D MEMS scenes for the portfolio (three.js, no build step).
//  - #v-sensor: piezoresistive pressure sensor, cutaway through a KOH-etched die.
//    Pressure slider deflects the Si3N4 membrane (clamped-plate shape) and colors
//    it by bending stress, which peaks at the edge midpoints where the NiCr
//    sense resistor sits.
//  - #v-soi: SOI cantilever release. Etch-time slider grows the isotropic HF
//    undercut u; the beam frees itself once 2u exceeds its width while the wide
//    anchor keeps an oxide core.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

function stage(root, { cam, target, fov = 32, shadowBox = 4 }) {
  const host = root.querySelector('.stage');
  const layer = root.querySelector('.labels');
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.localClippingEnabled = true;
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  const camera = new THREE.PerspectiveCamera(fov, 1, 0.01, 1000);
  camera.position.set(...cam);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(...target);
  Object.assign(controls, {
    enableDamping: true, enableZoom: false, enablePan: false,
    minPolarAngle: 0.35, maxPolarAngle: 1.42,
  });
  // Gentle side-to-side sway (keeps the cutaway facing the viewer) until the user grabs it.
  let swaying = !reduceMotion, baseTheta = null;
  const sph = new THREE.Spherical(), off = new THREE.Vector3();
  controls.addEventListener('start', () => { swaying = false; });
  const hooks = [];

  const key = new THREE.DirectionalLight(0xffffff, 2.4);
  key.position.set(cam[0] * 0.6 + shadowBox, shadowBox * 3, cam[2] * 0.3 + shadowBox);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.radius = 4;
  Object.assign(key.shadow.camera, { left: -shadowBox * 2, right: shadowBox * 2, top: shadowBox * 2, bottom: -shadowBox * 2, near: 0.1, far: shadowBox * 12 });
  key.target.position.set(...target);
  const rim = new THREE.DirectionalLight(0x8fd8ff, 0.9);
  rim.position.set(-shadowBox * 3, shadowBox, -shadowBox * 3);
  scene.add(key, key.target, rim, new THREE.HemisphereLight(0xcfe6ff, 0x0a0e13, 0.35));

  const labels = [];
  const addLabel = (html, pos, cls = '') => {
    const d = document.createElement('div');
    d.className = 'lbl ' + cls; d.innerHTML = html;
    layer.appendChild(d); labels.push({ d, pos }); return d;
  };

  let w = 1, h = 1;
  const resize = () => {
    w = host.clientWidth; h = host.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
  };
  new ResizeObserver(resize).observe(host); resize();

  let visible = true;
  new IntersectionObserver((e) => { visible = e[0].isIntersecting; }).observe(root);
  const v = new THREE.Vector3();
  const loop = () => {
    requestAnimationFrame(loop);
    if (!visible) return;
    const now = performance.now();
    if (swaying) {
      off.copy(camera.position).sub(controls.target); sph.setFromVector3(off);
      if (baseTheta === null) baseTheta = sph.theta;
      sph.theta = baseTheta + Math.sin(now / 1000 * 0.32) * 0.42;
      off.setFromSpherical(sph); camera.position.copy(controls.target).add(off);
    }
    for (const f of hooks) f(now);
    controls.update();
    renderer.render(scene, camera);
    for (const l of labels) {
      v.copy(l.pos).project(camera);
      l.d.style.transform = `translate(${(v.x * 0.5 + 0.5) * w}px, ${(-v.y * 0.5 + 0.5) * h}px) translate(-50%, -50%)`;
    }
  };
  loop();
  root.classList.add('ready');
  return { scene, addLabel, onFrame: (f) => hooks.push(f) };
}

const mat = {
  si: () => new THREE.MeshPhysicalMaterial({ color: 0x7d8796, metalness: 0.55, roughness: 0.32, clearcoat: 0.4, clearcoatRoughness: 0.25 }),
  siCut: () => new THREE.MeshPhysicalMaterial({ color: 0x9aa5b4, metalness: 0.35, roughness: 0.55, side: THREE.DoubleSide }),
  gold: () => new THREE.MeshPhysicalMaterial({ color: 0xe0a94a, metalness: 1, roughness: 0.22 }),
  oxide: () => new THREE.MeshPhysicalMaterial({ color: 0xff8f3a, metalness: 0, roughness: 0.28, clearcoat: 0.8, emissive: 0x3a1500, emissiveIntensity: 0.6 }),
};

function shadowCatcher(size, y) {
  const g = new THREE.Mesh(new THREE.PlaneGeometry(size, size), new THREE.ShadowMaterial({ opacity: 0.35 }));
  g.rotation.x = -Math.PI / 2; g.position.y = y; g.receiveShadow = true;
  return g;
}

// ---------------- Pressure sensor ----------------
function sensorScene(root) {
  const F = 3.6, a = 2.0, t = 0.5;                // die size, membrane window, wafer thickness (mm)
  const h = a / 2, G = F / 2;
  const hb = h + t / Math.tan(54.74 * Math.PI / 180);  // KOH {111} sidewall run
  const { scene, addLabel } = stage(root, { cam: [2.7, 2.2, 3.9], target: [0, -0.22, -0.3], shadowBox: 3 });
  const clip = [new THREE.Plane(new THREE.Vector3(0, 0, -1), 0)];   // cut away the front half (z > 0)

  // Silicon die with an inverted-pyramid KOH cavity, built face by face.
  const P = (x, y, z) => new THREE.Vector3(x, y, z);
  const sq = (r, y) => [P(-r, y, -r), P(r, y, -r), P(r, y, r), P(-r, y, r)];
  const Ot = sq(G, 0), It = sq(h, 0), Ob = sq(G, -t), Ib = sq(hb, -t);
  const tris = [];
  const quad = (A, B, C, D) => tris.push(A, B, C, A, C, D);
  for (let i = 0; i < 4; i++) {
    const j = (i + 1) % 4;
    quad(Ot[i], Ot[j], It[j], It[i]);   // top ring
    quad(Ob[j], Ob[i], Ib[i], Ib[j]);   // bottom ring
    quad(Ot[j], Ot[i], Ob[i], Ob[j]);   // outer walls
    quad(It[i], It[j], Ib[j], Ib[i]);   // sloped {111} walls
  }
  const dieGeo = new THREE.BufferGeometry().setFromPoints(tris);
  dieGeo.computeVertexNormals();
  const dieMat = mat.si(); dieMat.side = THREE.DoubleSide; dieMat.clippingPlanes = clip;
  const die = new THREE.Mesh(dieGeo, dieMat);
  die.castShadow = true; die.receiveShadow = true; scene.add(die);

  // Cut face where the die is sectioned (z = 0).
  const cutShape = (s) => new THREE.Shape([new THREE.Vector2(s * G, 0), new THREE.Vector2(s * h, 0), new THREE.Vector2(s * hb, -t), new THREE.Vector2(s * G, -t)]);
  for (const s of [-1, 1]) {
    const c = new THREE.Mesh(new THREE.ShapeGeometry(cutShape(s)), mat.siCut());
    c.position.z = -0.0005; scene.add(c);
  }
  scene.add(shadowCatcher(14, -t - 0.001));

  // Membrane: clamped-plate shape W = (1-xi^2)^2 (1-eta^2)^2, colored by bending stress.
  const N = 90;
  const memGeo = new THREE.PlaneGeometry(a, a, N, N); memGeo.rotateX(-Math.PI / 2);
  const pos = memGeo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  memGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const memMat = new THREE.MeshPhysicalMaterial({ vertexColors: true, metalness: 0.1, roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.12, side: THREE.DoubleSide, clippingPlanes: clip });
  const membrane = new THREE.Mesh(memGeo, memMat); membrane.castShadow = true; scene.add(membrane);
  const cLow = new THREE.Color(0x1b3a52), cMid = new THREE.Color(0x3ee6c1), cHigh = new THREE.Color(0xffb347), tmp = new THREE.Color();
  const shape = (x, z) => { const xi = 2 * x / a, et = 2 * z / a; return (1 - xi * xi) ** 2 * (1 - et * et) ** 2; };
  const stress = (x, z) => {
    const xi = 2 * x / a, et = 2 * z / a;
    const sxx = (12 * xi * xi - 4) * (1 - et * et) ** 2, szz = (1 - xi * xi) ** 2 * (12 * et * et - 4);
    return Math.sqrt(sxx * sxx + szz * szz - sxx * szz) / 8;   // von Mises-like, 1 at edge midpoints
  };

  // Section line of the membrane on the cut plane.
  const profileMat = new THREE.MeshPhysicalMaterial({ color: 0x3ee6c1, emissive: 0x0d4d40, roughness: 0.3 });
  let profile = null;

  // NiCr serpentines: sense resistor at the back edge midpoint, reference on the frame.
  const goldMat = mat.gold();
  let sense = null;
  const serp = (cx, cz, yfn) => {
    const pts = []; const n = 6, wdt = 0.42, len = 0.16;
    for (let i = 0; i <= n; i++) {
      const x = cx - wdt / 2 + (wdt * i) / n;
      const z0 = i % 2 ? cz + len / 2 : cz - len / 2, z1 = i % 2 ? cz - len / 2 : cz + len / 2;
      pts.push(P(x, yfn(x, z0), z0), P(x, yfn(x, z1), z1));
    }
    const path = new THREE.CurvePath();
    for (let i = 0; i < pts.length - 1; i++) path.add(new THREE.LineCurve3(pts[i], pts[i + 1]));
    const m = new THREE.Mesh(new THREE.TubeGeometry(path, 200, 0.011, 8, false), goldMat);
    m.castShadow = true; return m;
  };
  const ref = serp(0, -h - 0.42, () => 0.012); scene.add(ref);
  for (const x of [-0.32, 0.32]) {          // bond pads
    const pad = new THREE.Mesh(new RoundedBoxGeometry(0.22, 0.02, 0.22, 2, 0.008), goldMat);
    pad.position.set(x, 0.01, -G + 0.22); pad.castShadow = true; scene.add(pad);
  }

  // Backside pressure arrows.
  const arrowMat = new THREE.MeshPhysicalMaterial({ color: 0x66a3ff, emissive: 0x10264d, roughness: 0.4, transparent: true, opacity: 0.85 });
  const arrows = [];
  for (const x of [-0.5, 0, 0.5]) for (const z of [-0.5, 0]) {
    const g = new THREE.Group();
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.3, 12), arrowMat);
    const head = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.1, 16), arrowMat); head.position.y = 0.2;
    g.add(shaft, head); g.position.set(x, -t - 0.05, z - 0.05); scene.add(g); arrows.push(g);
  }

  const ui = root.querySelector('input'), out = root.querySelector('output');
  const update = () => {
    const p = parseFloat(ui.value), A = 0.30 * p / 10;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i);
      pos.setY(i, A * shape(x, z));
      const s = stress(x, z) * (p / 10);
      if (s < 0.5) tmp.copy(cLow).lerp(cMid, s / 0.5); else tmp.copy(cMid).lerp(cHigh, (s - 0.5) / 0.5);
      colors[i * 3] = tmp.r; colors[i * 3 + 1] = tmp.g; colors[i * 3 + 2] = tmp.b;
    }
    pos.needsUpdate = true; memGeo.attributes.color.needsUpdate = true; memGeo.computeVertexNormals();
    if (profile) { scene.remove(profile); profile.geometry.dispose(); }
    const curve = new THREE.CatmullRomCurve3(Array.from({ length: 61 }, (_, k) => { const x = -h + (a * k) / 60; return P(x, A * shape(x, 0), -0.004); }));
    profile = new THREE.Mesh(new THREE.TubeGeometry(curve, 120, 0.012, 8, false), profileMat); scene.add(profile);
    if (sense) { scene.remove(sense); sense.geometry.dispose(); }
    sense = serp(0, -h + 0.13, (x, z) => A * shape(x, z) + 0.012); scene.add(sense);
    arrows.forEach((g) => { g.scale.setScalar(0.4 + 0.6 * p / 10); g.visible = p > 0.05; });
    out.textContent = `${p.toFixed(1)} psi`;
  };
  ui.addEventListener('input', update); update();

  addLabel('Si<sub>3</sub>N<sub>4</sub> membrane', P(0.45, 0.48, -0.25));
  addLabel('NiCr sense resistor<br><span>sits where stress peaks</span>', P(0, 0.38, -h - 0.15), 'gold');
  addLabel('KOH cavity<br><span>54.74&deg; {111} walls</span>', P(-hb + 0.05, -t * 0.75, -0.02));
  addLabel('Si frame', P(G - 0.3, 0.06, -0.3), 'dim');
}

// ---------------- SOI cantilever release ----------------
function soiScene(root) {
  const La = 12, Wa = 12, Lb = 24, wb = 3;       // um
  const hSub = 4, hBox = 1, hDev = 2;
  const { scene, addLabel, onFrame } = stage(root, { cam: [-2, 19, 47], target: [17, 0.5, 0], fov: 30, shadowBox: 22 });
  const sub = new THREE.Mesh(new RoundedBoxGeometry(52, hSub, 28, 3, 0.5), new THREE.MeshPhysicalMaterial({ color: 0x4a5463, metalness: 0.5, roughness: 0.4, clearcoat: 0.3 }));
  sub.position.set(18, -hSub / 2, 0); sub.receiveShadow = true; scene.add(sub);
  scene.add(shadowCatcher(160, -hSub - 0.01));

  const devMat = mat.si();
  const anchorMat = mat.si(); anchorMat.transparent = true; anchorMat.opacity = 0.42; anchorMat.depthWrite = false;
  const anchor = new THREE.Mesh(new RoundedBoxGeometry(La, hDev, Wa, 3, 0.25), anchorMat);
  anchor.position.set(La / 2, hBox + hDev / 2, 0); anchor.renderOrder = 2; scene.add(anchor);
  const beam = new THREE.Mesh(new RoundedBoxGeometry(Lb, hDev, wb, 3, 0.25), devMat);
  beam.position.set(La + Lb / 2, hBox + hDev / 2, 0); beam.castShadow = true; scene.add(beam);

  const oxMat = mat.oxide();
  const box = (lx, lz, cx, cz) => {
    const m = new THREE.Mesh(new RoundedBoxGeometry(lx, hBox, lz, 2, 0.12), oxMat);
    m.position.set(cx, hBox / 2, cz); m.castShadow = true; m.receiveShadow = true; return m;
  };
  let oxide = new THREE.Group(); scene.add(oxide);

  const ui = root.querySelector('input'), out = root.querySelector('output'), state = root.querySelector('.state');
  const update = () => {
    const u = parseFloat(ui.value);
    scene.remove(oxide); oxide.traverse((o) => o.geometry && o.geometry.dispose());
    oxide = new THREE.Group();
    if (u <= 0.001) {
      oxide.add(box(La + Lb + 6, 22, (La + Lb) / 2, 0));      // unetched BOX under everything
    } else {
      if (La - 2 * u > 0.05 && Wa - 2 * u > 0.05) oxide.add(box(La - 2 * u, Wa - 2 * u, La / 2, 0));
      if (wb - 2 * u > 0.05) oxide.add(box(Lb - u, wb - 2 * u, La + (Lb - u) / 2, 0));
    }
    scene.add(oxide);
    const free = 2 * u >= wb;
    beam.position.y = hBox + hDev / 2 + (free ? 0.25 : 0);
    out.textContent = `u = ${u.toFixed(1)} µm`;
    state.innerHTML = free
      ? `<b class="ok">Beam released.</b> Anchor keeps a ${(Wa - 2 * u).toFixed(1)} µm oxide core.`
      : u <= 0.001
        ? 'Before release: buried oxide under the whole device layer.'
        : `<b class="warn">Beam still pinned</b> by a ${(wb - 2 * u).toFixed(1)} µm oxide strip. Needs 2u &gt; ${wb} µm.`;
  };
  // Plays the etch on a loop until the viewer takes the slider.
  let auto = !reduceMotion, last = -1;
  ui.addEventListener('input', () => { auto = false; update(); });
  onFrame((now) => {
    if (!auto) return;
    const c = (now / 1000) % 10;
    const u = Math.round(Math.min(4.5, Math.max(0, (c - 1.5) / 5.5 * 4.5)) * 10) / 10;
    if (u !== last) { last = u; ui.value = u; update(); }
  });
  update();

  addLabel('anchor pad, 12 &micro;m', new THREE.Vector3(La / 2, hBox + hDev + 1.6, -Wa / 2 + 1));
  addLabel('beam, 3 &micro;m wide', new THREE.Vector3(La + Lb * 0.7, hBox + hDev + 1.4, 0), 'teal');
  addLabel('buried oxide (BOX)', new THREE.Vector3(La / 2 + 1, hBox / 2, Wa / 2 + 2), 'amber');
  addLabel('Si handle', new THREE.Vector3(La + Lb, -hSub / 2, 13), 'dim');
}

const s = document.getElementById('v-sensor'); if (s) sensorScene(s);
const o = document.getElementById('v-soi'); if (o) soiScene(o);
