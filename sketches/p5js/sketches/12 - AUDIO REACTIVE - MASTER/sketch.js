let DESSIN = "AUDIO_MASTER";

let analyser;
let audioContext;
let micSource;
let micStream;
let freqData;
let timeData;
let micReady = false;
let micError = "";
let startingAudio = false;

let smoothedBass = 0;
let smoothedMid = 0;
let smoothedTreble = 0;
let smoothedLevel = 0;

let modes = [];
let currentModeIndex = 0;
let overlayEl;
let overlayStatusEl;
let controlsEl;
let configPanelEl;
let configContentEl;
let themePanelEl;
let themeContentEl;
let uiHintEl;
let pickModeEl;
let startAudioButtons = [];
let statusFlash = "";
let statusFlashUntil = 0;
let chromeVisible = true;
let configPanelVisible = true;
let themePanelVisible = false;
let hideUiAt = 0;
let sectionOpenState = { global: true, color: false, current: false, theme: true };
let currentFavorites = new Set();

const PI_VALUE = Math.PI;
const HALF_PI_VALUE = Math.PI / 2;
const TAU_VALUE = Math.PI * 2;
const UI_HINT_DELAY_MS = 1000;
const AUDIO_SOURCE_OPTIONS = [
  { value: "off", label: "Off" },
  { value: "level", label: "Full Range" },
  { value: "bass", label: "Bass" },
  { value: "mid", label: "Mid" },
  { value: "treble", label: "Treble" },
];
const GLOBAL_ROUTE_KEYS = new Set(["detail"]);
const FAVORITE_DRAWINGS = new Set([80, 84, 92, 105, 106, 107, 108, 114, 176, 221, 222, 223, 224, 225, 226, 227, 228, 229, 230, 231, 232, 233, 234, 235, 236, 237, 238, 239]);

const PALETTES_UI = {
  blue: { label: "Blue / Yellow", bg: "#013abb", stroke: "#f7eb23", accent: "#ffffff" },
  red: { label: "Red / Cream", bg: "#8f080e", stroke: "#f2d9ca", accent: "#ffd166" },
  green: { label: "Green / Mint", bg: "#005b51", stroke: "#c7f2d9", accent: "#f7eb23" },
  night: { label: "Night / White", bg: "#07111f", stroke: "#f5f7ff", accent: "#6ee7ff" },
  custom: { label: "Custom", bg: "#013abb", stroke: "#f7eb23", accent: "#ffffff" },
};

let globalConfig = {
  size: 1,
  speed: 1,
  micSensitivity: 1.2,
  placeX: 0,
  placeY: 0,
  drawColor: "#f7eb23",
  audioAccentColor: "#ffffff",
  colorMode: "palette_audio",
};

let themeConfig = {
  palette: "blue",
  bgColor: "#013abb",
  strokeColor: "#f7eb23",
  accentColor: "#ffffff",
};

let globalAudioRouting = {
  size: { source: "bass", amount: 0.35 },
  speed: { source: "level", amount: 0.55 },
  detail: { source: "treble", amount: 0.4 },
  color: { source: "treble", amount: 0.35 },
};

let presetAudioRouting = {};
let initialGlobalConfig;
let initialGlobalAudioRouting;
let initialPresetByDrawing = {};

const CATEGORY_WEIGHTS = {
  composition: 4,
  orbital: 7,
  tournante: 7,
  modulo: 6,
  batons: 5,
  elastic: 5,
  d3structures: 7,
};

const COMPOSITION1_PRESETS = {
  14: { K1: 6, R1: 0.2, A1: 0, K: 24, H: 11, R: 0.3, AD: 0 },
  15: { K1: 40, R1: 0.25, A1: HALF_PI_VALUE, K: 80, H: 1, R: 0.25, AD: HALF_PI_VALUE },
  16: { K1: 10, R1: 0.35, A1: 0, K: 10, H: 3, R: 0.15, AD: 0 },
  17: { K1: 63, R1: 0.15, A1: 0, K: 4, H: 1, R: 0.35, AD: 0 },
  18: { K1: 25, R1: 0.1, A1: HALF_PI_VALUE, K: 5, H: 2, R: 0.4, AD: HALF_PI_VALUE },
};

const COMPOSITION2_PRESETS = {
  20: { K1: 8, N: 32, K: 16, H: 5, R1: 0.36, R: 0.14, RR: 0.9 },
  21: { K1: 10, N: 30, K: 8, H: 3, R1: 0.35, R: 0.15, RR: 0.85 },
  22: { K1: 10, N: 10, K: 18, H: 7, R1: 0, R: 0.5, RR: 0.8 },
  23: { K1: 10, N: 10, K: 21, H: 10, R1: 0, R: 0.5, RR: 0.75 },
  24: { K1: 28, N: 56, K: 7, H: 3, R1: 0.15, R: 0.35, RR: 0.95 },
  25: { K1: 20, N: 60, K: 8, H: 1, R1: 0.05, R: 0.45, RR: 0.945 },
};

const ORBITAL_PRESETS = {
  78: { detail: 2000, T1: 2, T2: 100, K1: 1, K2: 1, R1: 0.25, yScale: 1, r2Scale: 0.2, r2Mode: "decay" },
  79: { detail: 4000, T1: 1, T2: 200, K1: 1, K2: 1, R1: 0.2, yScale: 1, r2Scale: 0.3, r2Mode: "cos5Wide" },
  80: { detail: 2200, T1: 1, T2: 300, K1: 1, K2: 2, R1: 0.3, yScale: 1.5, r2Scale: 0.2, r2Mode: "pulse10" },
  81: { detail: 2000, T1: 1, T2: 100, K1: 1, K2: 1, R1: 0.27, yScale: 1.4, r2Scale: 0.23, r2Mode: "cos3Wide" },
  82: { detail: 4000, T1: 100, T2: 1, K1: 3, K2: 2, R1: 0.1, yScale: 1.6, r2Scale: 0.4, r2Mode: "decay" },
  83: { detail: 4000, T1: 1, T2: 200, K1: 3, K2: 2, R1: 0.3, yScale: 1.5, r2Scale: 0.2, r2Mode: "decay" },
  84: { detail: 1800, T1: 1, T2: 150, K1: 1, K2: 1, R1: 0.25, yScale: 1.3, r2Scale: 0.25, r2Mode: "swell" },
  85: { detail: 5000, T1: 2, T2: 250, K1: 1, K2: 2, R1: 0.35, yScale: 1.4, r2Scale: 0.15, r2Mode: "cos1" },
  86: { detail: 1400, T1: 1, T2: 600, K1: 1, K2: 1, R1: 0.25, yScale: 1, r2Scale: 0.25, r2Mode: "cos14" },
};

const TOURNANTE_PRESETS = {
  87: { detail: 2000, T1: 1, T2: 100, H1: 1, H2: 1, K1: 1, K2: 1, R1: 1 / 6, R2: 1 / 4, yScale: 1, pulseFreq: 2, pulseMin: 0.2, pulseMax: 1 },
  88: { detail: 3000, T1: 1, T2: 100, H1: 1, H2: 1, K1: 1, K2: 2, R1: 1 / 3, R2: 1 / 7, yScale: 1, pulseFreq: 0, pulseMin: 1, pulseMax: 1 },
  89: { detail: 3000, T1: 0.5, T2: 30, H1: 1, H2: 1, K1: 1, K2: 3, R1: 1 / 8, R2: 0.27, yScale: 1, pulseFreq: 0, pulseMin: 1, pulseMax: 1 },
  90: { detail: 2000, T1: 0.5, T2: 50, H1: 1, H2: 2, K1: 1, K2: 3, R1: 1 / 7, R2: 1 / 4, yScale: 1, pulseFreq: 0, pulseMin: 1, pulseMax: 1 },
  91: { detail: 4000, T1: 1, T2: 800, H1: 3, H2: 5, K1: 1, K2: 1, R1: 5 / 12, R2: 1 / 24, yScale: 1.4, pulseFreq: 15, pulseMin: 0.2, pulseMax: 1 },
  92: { detail: 2200, T1: 1, T2: 100, H1: 1, H2: 1, K1: 1, K2: 2, R1: 1 / 6, R2: 1 / 4, yScale: 1.6 },
  93: { detail: 3000, T1: 1, T2: 100, H1: 1, H2: 2, K1: 1, K2: 2, R1: 1 / 3, R2: 1 / 8, yScale: 1.3, pulseFreq: 4, pulseMin: 0.2, pulseMax: 1 },
  94: { detail: 5000, T1: 1, T2: 200, H1: 1, H2: 2, K1: 1, K2: 2, R1: 3 / 8, R2: 1 / 12, yScale: 1.5, pulseFreq: 9, pulseMin: 0.2, pulseMax: 1 },
  95: { detail: 4000, T1: 1, T2: 100, H1: 1, H2: 1, K1: 1, K2: 2, R1: 1 / 6, R2: 1 / 4, yScale: 1.4, pulseFreq: 2, pulseMin: 0.2, pulseMax: 1 },
  96: { detail: 4000, T1: 1, T2: 100, H1: 1, H2: 1, K1: 1, K2: 2, R1: 1 / 6, R2: 1 / 4, yScale: 1.7, pulseFreq: 3, pulseMin: 0.2, pulseMax: 1 },
};

const MODULO_PRESETS = {
  105: { N: 400, K1: 4, K2: 5, H: 2 },
  106: { N: 500, K1: 11 / 7, K2: 7 / 3, H: 3 },
  107: { N: 400, K1: 4, K2: 2, H: 2 },
  108: { N: 300, K1: 5, K2: 3, H: 2 },
  109: { N: 400, K1: 2, K2: 2, H: 9, M: 200 },
};

const BATONS_PRESETS = {
  110: { N: 100, M: 1, K: 5, ringDecay: 1, batonScale: 1.67, yScale: 1 },
  111: { N: 600, M: 1, K: 5, ringDecay: 1, batonScale: 1.67, yScale: 1 },
  112: { N: 100, M: 6, K: 6, ringDecay: 0.7, batonScale: 1, yScale: 1.2, batonDecay: 0.9 },
  113: { N: 300, M: 4, K: 3, ringDecay: 0.6, batonScale: 1, yScale: 1, batonDecay: 0.5 },
  114: { N: 260, M: 7, K: 7 },
};

const SPIRAL_PRESETS = {
  97: { detail: 2000, T: 40, R: 0.8, L: 0.1, turnScale: 1, yScale: 1, yOffset: 0 },
  98: { detail: 3000, T: 60, R: 0.1, L: 0.1, turnScale: 1, yScale: 1.3, yOffset: -0.16 },
  99: { detail: 2000, T: 40, R: 0.8, L: 0.1, turnScale: 1, yScale: 1.7, yOffset: -0.09 },
  100: { detail: 9000, T: 50, R: 0.7, L: 0.1, turnScale: 4, yScale: 1.4, yOffset: 0 },
};

const ELASTIC_PRESETS = {
  164: { gridX: 20, gridY: 20, angleMode: "none", angleAmount: 0, angleWave: 0, distPower: 0.3 },
  165: { gridX: 20, gridY: 20, angleMode: "none", angleAmount: 0, angleWave: 0, distPower: 3 },
  166: { gridX: 20, gridY: 20, angleMode: "linear", angleAmount: HALF_PI_VALUE, angleWave: 0, distPower: 1 },
  167: { gridX: 20, gridY: 20, angleMode: "linear", angleAmount: 3.5, angleWave: 0, distPower: 0.3 },
  168: { gridX: 20, gridY: 20, angleMode: "linear", angleAmount: TAU_VALUE, angleWave: 0, distPower: 1 },
  169: { gridX: 20, gridY: 20, angleMode: "linear", angleAmount: PI_VALUE, angleWave: 0, distPower: 3 },
  170: { gridX: 20, gridY: 20, angleMode: "sin1", angleAmount: HALF_PI_VALUE, angleWave: PI_VALUE, distPower: 0.2 },
  171: { gridX: 20, gridY: 20, angleMode: "sin2", angleAmount: PI_VALUE / 4, angleWave: TAU_VALUE, distPower: 1 },
  172: { gridX: 20, gridY: 20, angleMode: "sin2", angleAmount: PI_VALUE / 4, angleWave: TAU_VALUE, distPower: 2 },
  173: { gridX: 20, gridY: 20, angleMode: "sin2", angleAmount: PI_VALUE / 4, angleWave: TAU_VALUE, distPower: 1 },
  174: { gridX: 20, gridY: 20, angleMode: "linear", angleAmount: PI_VALUE, angleWave: 0, distPower: 0.3 },
  175: { gridX: 20, gridY: 20, angleMode: "linear", angleAmount: TAU_VALUE, angleWave: 0, distPower: 1 },
  176: { gridX: 20, gridY: 40, angleMode: "linear", angleAmount: TAU_VALUE, angleWave: 0, distPower: 1 },
};

const D3CUBE_PRESETS = {
  207: { variant: "single", OX: 1.9, OY: -0.8, OZ: 0.25, AZ: 3 * PI_VALUE / 4, AY: 0, AX: 0, QX: 0, QY: 0, QZ: 0, unit: 0.7 },
  208: { variant: "scaled_stack", OX: 0, OY: 0, OZ: 0, AZ: PI_VALUE / 5, AY: -PI_VALUE / 7, AX: 0, QX: -3.5, QY: 0, QZ: 1.5, unit: 0.82 },
  210: { variant: "rotation_sweep_raw", OX: 0, OY: 0.5, OZ: 0, AZ: PI_VALUE / 3, AY: 0, AX: 0, QX: -4, QY: 0.1, QZ: 0.3, unit: 0.82 },
  212: { variant: "rotation_sweep_centered", OX: 0, OY: 0, OZ: 0, AZ: PI_VALUE / 5, AY: -PI_VALUE / 4, AX: 0, QX: -5, QY: 0.2, QZ: 0.3, unit: 0.85 },
  213: { variant: "rotation_sweep_centered", OX: 0, OY: 0, OZ: 0, AZ: PI_VALUE / 3, AY: -PI_VALUE / 7, AX: 0, QX: -6, QY: 0.3, QZ: 0.5, unit: 0.88 },
  215: { variant: "grid2d", OX: 0, OY: 0, OZ: 0, AZ: PI_VALUE / 2, AY: 0, AX: 0, QX: -14, QY: -6.5, QZ: 7, gridX: 5, gridY: 21, stepX: 3, stepY: 3, unit: 0.92 },
  216: { variant: "grid2d", OX: 0, OY: 0, OZ: 0, AZ: PI_VALUE / 3, AY: -PI_VALUE / 6, AX: 0, QX: -15, QY: -1, QZ: 3, gridX: 5, gridY: 21, stepX: 3, stepY: 3, unit: 0.92 },
  217: { variant: "grid2d", OX: 0, OY: 0, OZ: 0, AZ: PI_VALUE / 2, AY: -PI_VALUE / 6, AX: 0, QX: -14, QY: -6.5, QZ: 7, gridX: 5, gridY: 21, stepX: 3, stepY: 3, unit: 0.92 },
  219: { variant: "grid3d", OX: 0, OY: 0, OZ: 0, AZ: PI_VALUE / 4, AY: Math.atan(Math.sqrt(0.5)), AX: 0, QX: -10, QY: 0, QZ: 0, gridX: 4, gridY: 4, gridZ: 4, stepX: 3, stepY: 3, stepZ: 3, unit: 0.9 },
  220: { variant: "grid3d", OX: 0, OY: 0, OZ: 0, AZ: PI_VALUE / 4, AY: 0, AX: 0, QX: -10, QY: 0, QZ: 3.5, gridX: 4, gridY: 4, gridZ: 4, stepX: 3, stepY: 3, stepZ: 3, unit: 0.9 },
};

const CUBE_POLYLINES = [
  [[1, 0, 0], [0, 0, 0], [0, 0, 1], [1, 0, 1], [1, 0, 0], [1, 1, 0], [1, 1, 1], [0, 1, 1], [0, 0, 1]],
  [[1, 0, 1], [1, 1, 1]],
  [[0, 0, 0], [0, 1, 0], [0, 1, 1]],
  [[1, 1, 0], [0, 1, 0]],
];

const D3STRUCTURES_A_PRESETS = {
  221: { N: 900, M: 30, K: 0, AZ: PI_VALUE / 4, AY: -PI_VALUE / 8, AX: 0, QX: -2.5 },
  222: { N: 280, M: 4, K: 0, AZ: PI_VALUE / 4, AY: -PI_VALUE / 8, AX: 0, QX: -2.5 },
  223: { N: 360, M: 7, K: 0, AZ: PI_VALUE / 4, AY: -PI_VALUE / 8, AX: 0, QX: -2.5 },
  224: { N: 420, M: 100, K: 0, AZ: 0, AY: -PI_VALUE / 5, AX: 0, QX: -2.5 },
  225: { N: 420, M: 100, K: 8, AZ: 0, AY: (-2 * PI_VALUE) / 5, AX: 0, QX: -2.5 },
  226: { N: 200, M: 30, K: 8, AZ: 0, AY: -PI_VALUE / 5, AX: 0, QX: -2.5, raMode: "wide" },
  227: { N: 200, M: 30, K: 8, AZ: 0, AY: (-2 * PI_VALUE) / 5, AX: 0, QX: -2.5, raMode: "wide" },
  228: { N: 360, M: 100, K: 0, AZ: PI_VALUE / 4, AY: -PI_VALUE / 8, AX: 0, QX: -2.5 },
  229: { N: 360, M: 100, K: 0, AZ: 0, AY: (-2 * PI_VALUE) / 5, AX: 0, QX: -2.5 },
  230: { N: 360, M: 60, K: 0, AZ: PI_VALUE / 4, AY: -PI_VALUE / 8, AX: 0, QX: -2.5 },
  231: { N: 360, M: 60, K: 0, AZ: 0, AY: (-2 * PI_VALUE) / 5, AX: 0, QX: -2.5 },
  232: { N: 520, M: 100, K: 0, AZ: 0, AY: -PI_VALUE / 5, AX: 0, QX: -2.5 },
  233: { N: 520, M: 100, K: 0, AZ: 0, AY: (-2 * PI_VALUE) / 5, AX: 0, QX: -2.5 },
  234: { N: 720, M: 20, K: 3, AZ: 0, AY: -PI_VALUE / 5, AX: 0, QX: -2.5 },
  235: { N: 720, M: 20, K: 3, AZ: 0, AY: (-2 * PI_VALUE) / 5, AX: 0, QX: -2.5 },
};

const D3STRUCTURES_B_PRESETS = {
  236: { N: 1800, M: 100, R1: 0.6, R2: 0.15, AY: 0, QX: -2.5 },
  237: { N: 1800, M: 100, R1: 0.6, R2: 0.15, AY: -PI_VALUE / 4, QX: -3 },
  238: { N: 1800, M: 100, R1: 0.5, R2: 0.5, AY: -PI_VALUE / 4, QX: -2.5 },
  239: { N: 1800, M: 100, R1: 0.6, R2: 0.25, AY: -PI_VALUE / 4, QX: -2 },
};

const D3STRUCTURES_C_PRESETS = {
  240: { variant: "box_lines", N: 7, AZ: (2 * PI_VALUE) / 5, AY: 0, AX: 0, QX: -2.5, QY: 0, QZ: 0 },
  241: { variant: "box_lines", N: 7, AZ: PI_VALUE / 4, AY: Math.atan(Math.sqrt(0.5)), AX: 0, QX: -12, QY: -1.4, QZ: 0.8 },
  242: { variant: "plane_grid", N: 100, AZ: PI_VALUE / 4, AY: 0, AX: 0, QX: -2, QY: 0, QZ: 3 },
};

const D3STRUCTURES_D_PRESETS = {
  243: { N: 2000, M: 20, AZ: 0, AY: (-2 * PI_VALUE) / 5, AX: 0, QX: -2.7, QY: 0, QZ: 0, radiusMode: "circle" },
  244: { N: 2000, M: 50, AZ: 0, AY: (-2 * PI_VALUE) / 5, AX: 0, QX: -2.7, QY: 0, QZ: 0, radiusMode: "circle" },
  245: { N: 2000, M: 20, AZ: 0, AY: (-2 * PI_VALUE) / 5, AX: 0, QX: -2.7, QY: 0, QZ: 0, radiusMode: "diamond" },
  246: { N: 2000, M: 50, AZ: 0, AY: (-2 * PI_VALUE) / 5, AX: 0, QX: -2.7, QY: 0, QZ: 0, radiusMode: "diamond" },
  247: { N: 2000, M: 200, AZ: 0, AY: (-2 * PI_VALUE) / 5, AX: 0, QX: -2.7, QY: 0, QZ: 0, radiusMode: "circle", halfSweep: true },
  248: { N: 150, M: 50, AZ: 0, AY: (-2 * PI_VALUE) / 5, AX: 0, QX: -2.7, QY: 0, QZ: 0, radiusMode: "circle" },
  249: { N: 200, M: 50, AZ: -PI_VALUE / 6, AY: 0, AX: 0, QX: -2.7, QY: 0, QZ: 3, radiusMode: "half_circle" },
  250: { N: 200, M: 50, AZ: -PI_VALUE / 6, AY: -PI_VALUE / 5, AX: 0, QX: -2.7, QY: 0, QZ: 0, radiusMode: "circle" },
  251: { N: 200, M: 50, AZ: 0, AY: (-2 * PI_VALUE) / 5, AX: 0, QX: -2.7, QY: 0, QZ: 0, radiusMode: "circle" },
  252: { N: 2000, M: 100, AZ: 0, AY: -PI_VALUE / 9, AX: 0, QX: -2.5, QY: 0, QZ: 0, radiusMode: "wave" },
};

function setup() {
  PALETTE("NEW_BLUE");
  createCanvas(windowWidth, windowHeight);
  pixelDensity(1);
  frameRate(30);
  buildModes();
  applyPalettePreset(themeConfig.palette);
  syncDrawingColorsToTheme(true);
  captureInitialState();
  loadFavorites();
  setupUi();
  window.addEventListener("keydown", handleWindowKeyDown, { passive: false });
}

function draw() {
  updatePaletteFromConfig();
  background(BG_COLOR);

  let metrics = getSignalMetrics();
  let mode = modes[currentModeIndex];
  renderMode(mode, metrics);
  if (chromeVisible) drawHud(mode, metrics);
  updateUiHint();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function buildModes() {
  modes = [];
  addPresetModes("composition", "COMPOSITION 1", COMPOSITION1_PRESETS, renderComposition1);
  addPresetModes("composition", "COMPOSITION 2", COMPOSITION2_PRESETS, renderComposition2);
  addPresetModes("orbital", "COURBES ORBITALES", ORBITAL_PRESETS, renderOrbital);
  addPresetModes("tournante", "COURBES TOURNANTES", TOURNANTE_PRESETS, renderTournante);
  addPresetModes("orbital", "COURBES SPIRALES", SPIRAL_PRESETS, renderSpiral);
  addPresetModes("modulo", "LINÉAIRES MODULO", MODULO_PRESETS, renderModulo);
  addPresetModes("batons", "LINÉAIRES BÂTONS", BATONS_PRESETS, renderBatons);
  addPresetModes("elastic", "QUADRILLAGES ÉLASTIQUES", ELASTIC_PRESETS, renderElastic);
  addPresetModes("d3structures", "D3CUBE", D3CUBE_PRESETS, renderD3Cube);
  addPresetModes("d3structures", "D3STRUCTURES", D3STRUCTURES_A_PRESETS, renderD3StructureA);
  addPresetModes("d3structures", "D3STRUCTURES", D3STRUCTURES_B_PRESETS, renderD3StructureB);
  addPresetModes("d3structures", "D3STRUCTURES", D3STRUCTURES_C_PRESETS, renderD3StructureC);
  addPresetModes("d3structures", "D3STRUCTURES", D3STRUCTURES_D_PRESETS, renderD3StructureD);

  currentModeIndex = pickWeightedModeIndex();
}

function addPresetModes(category, label, presets, renderer) {
  let drawings = Object.keys(presets).map(Number).sort((a, b) => a - b);
  for (let drawing of drawings) {
    modes.push({
      category: category,
      drawing: drawing,
      label: label + " / DESSIN " + drawing,
      weight: CATEGORY_WEIGHTS[category],
      preset: presets[drawing],
      renderer: renderer,
    });
  }
}

function setupUi() {
  overlayEl = document.getElementById("start-overlay");
  overlayStatusEl = document.getElementById("overlay-status");
  controlsEl = document.getElementById("controls");
  configPanelEl = document.getElementById("config-panel");
  configContentEl = document.getElementById("config-content");
  themePanelEl = document.getElementById("theme-panel");
  themeContentEl = document.getElementById("theme-content");
  uiHintEl = document.getElementById("ui-hint");
  pickModeEl = document.getElementById("pick-mode");
  startAudioButtons = [
    document.getElementById("start-audio"),
    document.getElementById("overlay-start"),
  ];

  for (let button of startAudioButtons) {
    button.addEventListener("click", () => startAudio());
  }

  document.getElementById("toggle-fullscreen").addEventListener("click", () => toggleFullscreen());
  document.getElementById("toggle-menu").addEventListener("click", () => toggleChrome());
  document.getElementById("next-mode").addEventListener("click", () => nextMode());
  document.getElementById("previous-mode").addEventListener("click", () => previousMode());
  document.getElementById("random-mode").addEventListener("click", () => randomMode());
  pickModeEl.addEventListener("change", () => {
    currentModeIndex = Number(pickModeEl.value);
    renderConfigPanel();
    flashStatus("Picked: " + modes[currentModeIndex].label);
  });
  document.getElementById("show-config").addEventListener("click", () => {
    if (!chromeVisible) {
      chromeVisible = true;
      configPanelVisible = true;
    } else {
      configPanelVisible = !configPanelVisible;
    }
    applyChromeVisibility();
    flashStatus(configPanelVisible ? "Config panel visible" : "Config panel hidden");
  });
  document.getElementById("show-colors").addEventListener("click", () => {
    if (!chromeVisible) {
      chromeVisible = true;
      themePanelVisible = true;
    } else {
      themePanelVisible = !themePanelVisible;
    }
    applyChromeVisibility();
    flashStatus(themePanelVisible ? "Colors panel visible" : "Colors panel hidden");
  });
  document.getElementById("toggle-config").addEventListener("click", () => {
    configPanelVisible = !configPanelVisible;
    applyChromeVisibility();
  });
  document.getElementById("reset-config").addEventListener("click", () => {
    resetConfig();
  });
  document.getElementById("toggle-favorite").addEventListener("click", () => {
    toggleFavorite();
  });
  document.getElementById("overlay-dismiss").addEventListener("click", () => {
    hideOverlay();
    flashStatus("Running without microphone");
  });

  updateOverlayStatus(
    window.isSecureContext
      ? "Ready to request microphone access."
      : "This page is not in a secure context. Use http://localhost or https."
  );
  renderModePicker();
  renderConfigPanel();
  renderThemePanel();
  applyChromeVisibility();
}

function renderModePicker() {
  if (!pickModeEl) return;
  pickModeEl.innerHTML = modes
    .map((mode, index) => {
      let heart = currentFavorites.has(mode.drawing) ? "♥ " : "";
      return `<option value="${index}">${heart}${mode.drawing}. ${mode.label}</option>`;
    })
    .join("");
  syncModePicker();
}

function syncModePicker() {
  if (pickModeEl) pickModeEl.value = String(currentModeIndex);
}

function renderMode(mode, metrics) {
  push();
  translate(width * globalConfig.placeX * 0.4, height * globalConfig.placeY * 0.4);
  stroke(getReactiveStrokeColor(metrics));
  noFill();
  mode.renderer(mode.preset, metrics, mode.drawing);
  pop();
}

function renderComposition1(preset, metrics, drawing) {
  let unit = min(width, height);
  let time = metrics.time;
  let sizeMod = 1 + getGlobalAudioAmount("size", metrics);
  let k1 = max(1, floor(getPresetValue(drawing, "K1", preset.K1, metrics)));
  let centerRadius = unit * getPresetValue(drawing, "R1", preset.R1, metrics) * globalConfig.size * sizeMod;
  let starRadius = unit * getPresetValue(drawing, "R", preset.R, metrics) * globalConfig.size * sizeMod * (0.7 + 0.45 * metrics.mid);
  let a1 = getPresetValue(drawing, "A1", preset.A1, metrics);
  let ad = getPresetValue(drawing, "AD", preset.AD, metrics);
  let k = max(2, floor(getPresetValue(drawing, "K", preset.K, metrics)));
  let h = max(1, getPresetValue(drawing, "H", preset.H, metrics));

  strokeWeight(1 + metrics.level * 1.4);
  for (let i = 0; i < k1; i++) {
    let centerAngle = (TAU_VALUE * i) / k1 + a1 + time * getSpeedMod(metrics) * 0.08;
    let cx = width * 0.5 + centerRadius * cos(centerAngle);
    let cy = height * 0.5 + centerRadius * sin(centerAngle);
    drawStar(cx, cy, starRadius, k, h, ad + time * getSpeedMod(metrics) * 0.22);
  }
}

function renderComposition2(preset, metrics, drawing) {
  let unit = min(width, height);
  let time = metrics.time;
  let sizeMod = 1 + getGlobalAudioAmount("size", metrics);
  let n = max(1, floor(getPresetValue(drawing, "N", preset.N, metrics)));
  let k1 = max(1, getPresetValue(drawing, "K1", preset.K1, metrics));
  let k = max(2, floor(getPresetValue(drawing, "K", preset.K, metrics)));
  let h = max(1, getPresetValue(drawing, "H", preset.H, metrics));
  let r1 = getPresetValue(drawing, "R1", preset.R1, metrics);
  let r = getPresetValue(drawing, "R", preset.R, metrics);
  let rr = constrain(getPresetValue(drawing, "RR", preset.RR, metrics), 0.1, 0.999);

  strokeWeight(0.7 + metrics.level);
  for (let i = 0; i < n; i++) {
    let decay = pow(rr + metrics.treble * 0.015, i);
    let ringRadius = unit * r1 * decay * globalConfig.size * sizeMod;
    let starRadius = unit * r * decay * globalConfig.size * sizeMod * (0.8 + 0.35 * metrics.mid);
    let orbitAngle = (TAU_VALUE * i) / k1 + time * getSpeedMod(metrics) * 0.12;
    let cx = width * 0.5 + ringRadius * cos(orbitAngle);
    let cy = height * 0.5 + ringRadius * sin(orbitAngle);
    drawStar(cx, cy, starRadius, k, h, time * getSpeedMod(metrics) * 0.15 + metrics.treble * PI_VALUE * 0.4);
  }
}

function renderOrbital(preset, metrics, drawing) {
  let unit = min(width, height);
  let time = metrics.time;
  let sizeMod = 1 + getGlobalAudioAmount("size", metrics);
  let baseRadius = unit * getPresetValue(drawing, "R1", preset.R1, metrics) * globalConfig.size * sizeMod;
  let detail = getDetailCount(getPresetValue(drawing, "detail", preset.detail, metrics), metrics);
  let t1 = getPresetValue(drawing, "T1", preset.T1, metrics);
  let t2 = getPresetValue(drawing, "T2", preset.T2, metrics) * getSpeedMod(metrics) * (1 + 0.4 * metrics.bass);
  let k1 = getPresetValue(drawing, "K1", preset.K1, metrics);
  let k2 = getPresetValue(drawing, "K2", preset.K2, metrics);
  let yScale = getPresetValue(drawing, "yScale", preset.yScale, metrics);
  let r2Scale = getPresetValue(drawing, "r2Scale", preset.r2Scale, metrics);

  strokeWeight(1 + metrics.level);
  beginShape();
  for (let i = 0; i <= detail; i++) {
    let ratio = i / detail;
    let a1 = TAU_VALUE * ratio * t1 + time * getSpeedMod(metrics) * 0.14;
    let a2 = TAU_VALUE * ratio * t2 + time * getSpeedMod(metrics) * (0.8 + metrics.treble * 3);
    let r2 = unit * r2Scale * globalConfig.size * sizeMod * orbitalR2(preset.r2Mode, ratio, time, metrics);
    let x = width * 0.5 + baseRadius * cos(k1 * a1) + r2 * cos(a2);
    let y = height * 0.5 + yScale * (baseRadius * sin(k2 * a1) + r2 * sin(a2)) * 0.78;
    vertex(x, y);
  }
  endShape();

  if (drawing === 80 || drawing === 84) {
    beginShape();
    for (let i = 0; i <= detail; i++) {
      let ratio = i / detail;
      let a1 = TAU_VALUE * ratio * t1 - time * getSpeedMod(metrics) * 0.1;
      let a2 = TAU_VALUE * ratio * (t2 * 0.5) - time * getSpeedMod(metrics) * (1 + metrics.mid * 2);
      let r2 = unit * r2Scale * 0.65 * globalConfig.size * sizeMod * orbitalR2(preset.r2Mode, ratio, -time, metrics);
      let x = width * 0.5 + baseRadius * 0.85 * cos(k1 * a1) + r2 * cos(a2);
      let y = height * 0.5 + yScale * 0.72 * (baseRadius * sin(k2 * a1) + r2 * sin(a2));
      vertex(x, y);
    }
    endShape();
  }
}

function orbitalR2(mode, ratio, time, metrics) {
  if (mode === "decay") {
    return 1 - ratio;
  }
  if (mode === "cos1") {
    return 0.5 + 0.5 * cos(TAU_VALUE * ratio + time * (0.3 + metrics.mid));
  }
  if (mode === "cos3Wide") {
    return 0.6 + 0.4 * cos(TAU_VALUE * ratio * 3 + time * (0.4 + metrics.mid));
  }
  if (mode === "cos5Wide") {
    return 0.6 + 0.4 * cos(TAU_VALUE * ratio * 5 + time * (0.5 + metrics.mid));
  }
  if (mode === "cos14") {
    return 0.5 + 0.5 * cos(TAU_VALUE * ratio * 7 + time * (0.7 + metrics.treble * 2));
  }
  if (mode === "pulse10") {
    return 0.5 + 0.5 * cos(TAU_VALUE * ratio * 10 + time * (0.4 + metrics.mid));
  }
  return 0.5 + 0.5 * cos(PI_VALUE * ratio + time * 0.3 + metrics.bass * PI_VALUE * 0.5);
}

function renderTournante(preset, metrics) {
  let unit = min(width, height);
  let time = metrics.time;
  let detail = getDetailCount(getPresetValue(92, "detail", preset.detail, metrics), metrics);
  let sizeMod = 1 + getGlobalAudioAmount("size", metrics);
  let t1 = getPresetValue(92, "T1", preset.T1, metrics);
  let t2 = getPresetValue(92, "T2", preset.T2, metrics) * getSpeedMod(metrics) * (1 + 0.35 * metrics.bass);
  let h1 = getPresetValue(92, "H1", preset.H1, metrics);
  let h2 = getPresetValue(92, "H2", preset.H2, metrics);
  let k1 = getPresetValue(92, "K1", preset.K1, metrics);
  let k2 = getPresetValue(92, "K2", preset.K2, metrics);
  let r1 = getPresetValue(92, "R1", preset.R1, metrics);
  let r2 = getPresetValue(92, "R2", preset.R2, metrics);
  let yScale = getPresetValue(92, "yScale", preset.yScale, metrics);
  let pulseFreq = getPresetValue(92, "pulseFreq", preset.pulseFreq || 0, metrics);
  let pulseMin = getPresetValue(92, "pulseMin", preset.pulseMin || 0.5, metrics);
  let pulseMax = getPresetValue(92, "pulseMax", preset.pulseMax || 1, metrics);

  strokeWeight(1 + metrics.level * 1.3);
  beginShape();
  for (let i = 0; i <= detail; i++) {
    let ratio = i / detail;
    let s = pulseFreq > 0 ? map(cos(TAU_VALUE * ratio * pulseFreq + time * 0.4), -1, 1, pulseMin, pulseMax) : 1;
    let an = TAU_VALUE * ratio;
    let c1 = cos(h1 * an * t1 + time * getSpeedMod(metrics) * 0.3);
    let s1 = sin(h2 * an * t1 - time * getSpeedMod(metrics) * 0.25);
    let c2 = s * cos(k1 * an * t2 + time * getSpeedMod(metrics) * (0.6 + metrics.mid * 2));
    let s2 = s * sin(k2 * an * t2 - time * getSpeedMod(metrics) * (0.5 + metrics.treble * 3));
    let x =
      width * 0.5 +
      unit * globalConfig.size * sizeMod * r1 * c1 +
      unit * globalConfig.size * sizeMod * r2 * (c1 * c2 - s1 * s2);
    let y =
      height * 0.5 +
      yScale *
        0.72 *
        (unit * globalConfig.size * sizeMod * r1 * s1 +
          unit * globalConfig.size * sizeMod * r2 * (s1 * c2 + c1 * s2));
    vertex(x, y);
  }
  endShape();
}

function renderSpiral(preset, metrics, drawing) {
  let unit = min(width, height) * 0.46;
  let sizeMod = 1 + getGlobalAudioAmount("size", metrics);
  let detail = getDetailCount(getPresetValue(drawing, "detail", preset.detail, metrics), metrics);
  let turns = getPresetValue(drawing, "T", preset.T, metrics);
  let ellipseRatio = getPresetValue(drawing, "R", preset.R, metrics);
  let decayBase = constrain(getPresetValue(drawing, "L", preset.L, metrics), 0.001, 0.999);
  let turnScale = getPresetValue(drawing, "turnScale", preset.turnScale, metrics);
  let yScale = getPresetValue(drawing, "yScale", preset.yScale, metrics);
  let yOffset = getPresetValue(drawing, "yOffset", preset.yOffset, metrics);
  let time = metrics.time;

  strokeWeight(0.9 + metrics.level * 1.2);
  beginShape();
  for (let i = 0; i <= detail; i++) {
    let ratio = i / detail;
    let rr = pow(decayBase, ratio);
    let an = TAU_VALUE * turnScale * ratio + time * getSpeedMod(metrics) * 0.08;
    let x = rr * cos(turns * an);
    let y = rr * ellipseRatio * sin(turns * an);
    let co = cos(an);
    let si = sin(an);
    let xx = x * co - y * si;
    let yy = x * si + y * co;
    vertex(width * 0.5 + unit * globalConfig.size * sizeMod * xx, height * 0.5 + unit * globalConfig.size * sizeMod * yScale * yy + unit * yOffset);
  }
  endShape();
}

function renderModulo(preset, metrics, drawing) {
  let unit = min(width, height);
  let sizeMod = 1 + getGlobalAudioAmount("size", metrics);
  let rx = unit * 0.46 * globalConfig.size * sizeMod;
  let ry = unit * 0.42 * globalConfig.size * sizeMod;
  let n = max(2, floor(getPresetValue(drawing, "N", preset.N, metrics)));
  let h = max(1, floor(getPresetValue(drawing, "H", preset.H, metrics) + metrics.treble * 5));
  let m = max(2, floor(getPresetValue(drawing, "M", preset.M || n, metrics)));
  let k1 = getPresetValue(drawing, "K1", preset.K1, metrics);
  let k2 = getPresetValue(drawing, "K2", preset.K2, metrics);
  let phase = metrics.time * getSpeedMod(metrics) * 0.25;
  let centerY = height * 0.5;

  strokeWeight(0.85 + metrics.level);
  for (let i = 0; i < m; i++) {
    let a1 = (k1 * i * PI_VALUE) / n + phase;
    let a2 = (k2 * i * PI_VALUE) / n - phase * 1.4;
    let x1 = width * 0.5 + rx * sin(a1);
    let y1 = centerY + ry * cos(a2);

    let j = (h * i) % n;
    let b1 = (k1 * j * PI_VALUE) / n + phase;
    let b2 = (k2 * j * PI_VALUE) / n - phase * 1.4;
    let x2 = width * 0.5 + rx * sin(b1);
    let y2 = centerY + ry * cos(b2);
    line(x1, y1, x2, y2);
  }
}

function renderBatons(preset, metrics, drawing) {
  let unit = min(width, height);
  let time = metrics.time;
  let centerX = width * 0.5;
  let centerY = height * 0.5;
  let sizeMod = 1 + getGlobalAudioAmount("size", metrics);
  let m = max(1, floor(getPresetValue(drawing, "M", preset.M, metrics)));
  let n = max(2, floor(getPresetValue(drawing, "N", preset.N, metrics)));
  let k = getPresetValue(drawing, "K", preset.K, metrics);
  let ringDecay = getPresetValue(drawing, "ringDecay", preset.ringDecay || 0.8, metrics);
  let batonScale = getPresetValue(drawing, "batonScale", preset.batonScale || 1, metrics);
  let batonDecay = getPresetValue(drawing, "batonDecay", preset.batonDecay || 0.8, metrics);
  let yScale = getPresetValue(drawing, "yScale", preset.yScale || 1, metrics);

  strokeWeight(0.8 + metrics.level * 1.2);
  for (let ring = 1; ring <= m; ring++) {
    let r1 = unit / 3 * globalConfig.size * sizeMod * pow(ringDecay, ring - 1) * (1 + metrics.bass * 0.04);
    let r2 = (unit / 12) * batonScale * globalConfig.size * sizeMod * pow(batonDecay, ring - 1) * (1 + metrics.mid * 0.18);
    for (let j = 0; j < n; j++) {
      let an = (TAU_VALUE * j) / n;
      let wobble = time * getSpeedMod(metrics) * (0.14 + 0.04 * ring);
      let xd = centerX + r1 * cos(an) + r2 * cos(k * an + wobble);
      let yd = centerY + yScale * (r1 * sin(an) + r2 * sin(k * an + wobble));
      let xa = centerX + r1 * cos(an) + r2 * cos(k * an + PI_VALUE - wobble);
      let ya = centerY + yScale * (r1 * sin(an) + r2 * sin(k * an + PI_VALUE - wobble));
      line(xd, yd, xa, ya);
    }
  }
}

function renderD3Cube(preset, metrics, drawing) {
  let unit = min(width, height) * preset.unit;
  let scale = globalConfig.size * (1 + getGlobalAudioAmount("size", metrics) * 0.35);
  let az = getPresetValue(drawing, "AZ", preset.AZ, metrics) + metrics.time * getSpeedMod(metrics) * 0.04;
  let ay = getPresetValue(drawing, "AY", preset.AY, metrics) + metrics.time * getSpeedMod(metrics) * 0.03;
  let ax = getPresetValue(drawing, "AX", preset.AX, metrics) + metrics.treble * 0.12;
  let qx = getPresetValue(drawing, "QX", preset.QX, metrics);
  let qy = getPresetValue(drawing, "QY", preset.QY, metrics);
  let qz = getPresetValue(drawing, "QZ", preset.QZ, metrics);

  strokeWeight(0.9 + metrics.level);

  if (preset.variant === "single") {
    drawCubePolylineSet((point) => point, preset, az, ay, ax, qx, qy, qz, unit, scale);
    return;
  }

  if (preset.variant === "scaled_stack") {
    for (let i = 0; i <= 20; i++) {
      let k = 1 - i / 20;
      drawCubePolylineSet((point) => [k * (2 * point[0] - 1), k * (2 * point[1] - 1), k * (2 * point[2] - 1)], preset, az, ay, ax, qx, qy, qz, unit, scale);
    }
    return;
  }

  if (preset.variant === "rotation_sweep_raw") {
    for (let i = 0; i <= 20; i++) {
      let at = (PI_VALUE / 2 / 20) * i + metrics.time * getSpeedMod(metrics) * 0.1;
      let cc = cos(at);
      let ss = sin(at);
      drawCubePolylineSet((point) => {
        let mx = point[0];
        let my = point[1];
        let mz = point[2];
        return [cc * mx - ss * mz, my, mx * ss + mz * cc];
      }, preset, az, ay, ax, qx, qy, qz, unit, scale);
    }
    return;
  }

  if (preset.variant === "rotation_sweep_centered") {
    for (let i = 0; i <= 20; i++) {
      let at = (PI_VALUE / 80) * i + metrics.time * getSpeedMod(metrics) * 0.1;
      let cc = cos(at);
      let ss = sin(at);
      drawCubePolylineSet((point) => {
        let gr = 2 * point[0] - 1;
        let z0 = 2 * point[2] - 1;
        return [cc * gr - ss * z0, 2 * point[1] - 1, gr * ss + z0 * cc];
      }, preset, az, ay, ax, qx, qy, qz, unit, scale);
    }
    return;
  }

  if (preset.variant === "grid2d") {
    for (let i = 0; i < preset.gridX; i++) {
      for (let j = 0; j < preset.gridY; j++) {
        drawCubePolylineSet((point) => [point[0] + i * preset.stepX, point[1] + j * preset.stepY, point[2]], preset, az, ay, ax, qx, qy, qz, unit, scale);
      }
    }
    return;
  }

  if (preset.variant === "grid3d") {
    for (let i = 0; i < preset.gridX; i++) {
      for (let j = 0; j < preset.gridY; j++) {
        for (let k = 0; k < preset.gridZ; k++) {
          drawCubePolylineSet((point) => [point[0] + i * preset.stepX, point[1] + j * preset.stepY, point[2] + k * preset.stepZ], preset, az, ay, ax, qx, qy, qz, unit, scale);
        }
      }
    }
  }
}

function drawCubePolylineSet(transformPoint, preset, az, ay, ax, qx, qy, qz, unit, scale) {
  let projectedPolylines = [];
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (let polyline of CUBE_POLYLINES) {
    let projectedLine = [];
    for (let point of polyline) {
      let p = transformPoint(point);
      let projected = project3DWithOffsets(
        p[0] - preset.OX,
        p[1] - preset.OY,
        p[2] - preset.OZ,
        az,
        ay,
        ax,
        qx,
        qy,
        qz,
        2,
        2,
        unit
      );
      projectedLine.push(projected);
      minX = min(minX, projected.x);
      minY = min(minY, projected.y);
      maxX = max(maxX, projected.x);
      maxY = max(maxY, projected.y);
    }
    projectedPolylines.push(projectedLine);
  }

  let spanX = max(1, maxX - minX);
  let spanY = max(1, maxY - minY);
  let fit = min(width * 0.7 / spanX, height * 0.7 / spanY) * scale;
  let centerX = (minX + maxX) * 0.5;
  let centerY = (minY + maxY) * 0.5;

  for (let projectedLine of projectedPolylines) {
    beginShape();
    for (let projected of projectedLine) {
      vertex((projected.x - centerX) * fit + width * 0.5, (projected.y - centerY) * fit + height * 0.5);
    }
    endShape();
  }
}

function renderElastic(preset, metrics) {
  let unit = min(width, height) * 0.44 * globalConfig.size * (1 + getGlobalAudioAmount("size", metrics) * 0.6);
  let centerX = width * 0.5;
  let centerY = height * 0.5;
  let time = metrics.time;
  let maxI = preset.gridX || 20;
  let maxJ = preset.gridY || 40;

  strokeWeight(0.95 + metrics.level);
  for (let axis = 0; axis <= 1; axis++) {
    for (let i = 0; i <= maxI; i++) {
      beginShape();
      for (let j = 0; j <= maxJ; j++) {
        let x = (2 * i) / maxI - 1;
        let y = (2 * j) / maxJ - 1;
        if (axis === 1) {
          let swap = x;
          x = y;
          y = swap;
        }

        let di = sqrt(x * x + y * y);
        let an = x !== 0 ? atan(y / x) : HALF_PI_VALUE * (y < 0 ? -1 : 1);
        if (x < 0) an += PI_VALUE;
        if (di < 1) {
          if (preset.angleMode === "linear") {
            an += preset.angleAmount * (1 - di) * (1 + metrics.bass * 0.35);
          } else if (preset.angleMode === "sin1" || preset.angleMode === "sin2") {
            an += preset.angleAmount * sin(preset.angleWave * (1 - di));
          }
          if (preset.distPower && preset.distPower !== 1) di = pow(di, preset.distPower);
          an += time * getSpeedMod(metrics) * (0.18 + metrics.level * 0.4);
        }

        x = di * cos(an);
        y = di * sin(an);
        vertex(centerX + unit * 0.95 * x, centerY + unit * 0.95 * y);
      }
      endShape();
    }
  }
}

function renderD3StructureC(preset, metrics, drawing) {
  let time = metrics.time;
  let az = getPresetValue(drawing, "AZ", preset.AZ, metrics) + time * getSpeedMod(metrics) * 0.04;
  let ay = getPresetValue(drawing, "AY", preset.AY, metrics) + metrics.bass * 0.2;
  let ax = getPresetValue(drawing, "AX", preset.AX, metrics) + metrics.treble * 0.08;
  let qx = getPresetValue(drawing, "QX", preset.QX, metrics);
  let qy = getPresetValue(drawing, "QY", preset.QY, metrics);
  let qz = getPresetValue(drawing, "QZ", preset.QZ, metrics);
  let n = max(2, floor(getPresetValue(drawing, "N", preset.N, metrics)));
  let unit = min(width, height) * 0.8 * globalConfig.size;

  strokeWeight(0.9 + metrics.level);
  let faceCount = preset.variant === "plane_grid" ? 2 : 3;
  for (let face = 1; face <= faceCount; face++) {
    for (let i = 0; i <= n; i++) {
      for (let j = 0; j <= n; j++) {
        let start = d3StructureCPoint(face, i, j, n, 0, preset.variant);
        let end = d3StructureCPoint(face, i, j, n, 1, preset.variant);
        let p1 = project3DWithOffsets(start[0], start[1], start[2], az, ay, ax, qx, qy, qz, 2, 2, unit);
        let p2 = project3DWithOffsets(end[0], end[1], end[2], az, ay, ax, qx, qy, qz, 2, 2, unit);
        line(p1.x, p1.y, p2.x, p2.y);
      }
    }
  }
}

function d3StructureCPoint(face, i, j, n, side, variant) {
  if (variant === "plane_grid") {
    if (face === 1) return [i / n, side, 0];
    return [side, i / n, 0];
  }
  if (face === 1) return [i / n, side, j / n];
  if (face === 2) return [j / n, i / n, side];
  return [side, j / n, i / n];
}

function renderD3StructureD(preset, metrics, drawing) {
  let time = metrics.time;
  let az = getPresetValue(drawing, "AZ", preset.AZ, metrics) + time * getSpeedMod(metrics) * 0.05;
  let ay = getPresetValue(drawing, "AY", preset.AY, metrics) + metrics.bass * 0.15;
  let ax = getPresetValue(drawing, "AX", preset.AX, metrics) + metrics.treble * 0.08;
  let qx = getPresetValue(drawing, "QX", preset.QX, metrics);
  let qy = getPresetValue(drawing, "QY", preset.QY, metrics);
  let qz = getPresetValue(drawing, "QZ", preset.QZ, metrics);
  let n = max(20, floor(getPresetValue(drawing, "N", preset.N, metrics)));
  let m = getPresetValue(drawing, "M", preset.M, metrics);
  let unit = min(width, height) * 0.82 * globalConfig.size * (1 + getGlobalAudioAmount("size", metrics) * 0.35);
  let limit = preset.halfSweep ? floor(n / 2) : n;

  strokeWeight(0.9 + metrics.level);
  beginShape();
  for (let i = 0; i <= limit; i++) {
    let mx = (2 * i) / n - 1;
    let r = d3StructureDRadius(preset.radiusMode, mx, m, i, n);
    let an = (TAU_VALUE * m * i) / n + time * getSpeedMod(metrics) * 0.1;
    let my = r * cos(an);
    let mz = r * sin(an);
    let point = project3DWithOffsets(mx, my, mz, az, ay, ax, qx, qy, qz, 2, 2, unit);
    vertex(point.x, point.y);
  }
  endShape();
}

function d3StructureDRadius(mode, mx, m, i, n) {
  if (mode === "diamond") return 1 - abs(mx);
  if (mode === "half_circle") return 0.5 * sqrt(max(0, 1 - mx * mx));
  if (mode === "wave") return 0.3 + 0.3 * sin((TAU_VALUE * m * i) / n + (3 * PI_VALUE) / 2);
  return sqrt(max(0, 1 - mx * mx));
}

function renderD3StructureA(preset, metrics, drawing) {
  let time = metrics.time;
  let az = getPresetValue(drawing, "AZ", preset.AZ, metrics) + time * getSpeedMod(metrics) * 0.08;
  let ay = getPresetValue(drawing, "AY", preset.AY, metrics) + metrics.bass * 0.3 + time * getSpeedMod(metrics) * 0.03;
  let ax = getPresetValue(drawing, "AX", preset.AX, metrics) + metrics.treble * 0.15;
  let qx = getPresetValue(drawing, "QX", preset.QX, metrics) - metrics.level * 0.12;
  let unit = min(width, height) * globalConfig.size * (1 + getGlobalAudioAmount("size", metrics) * 0.5);
  let n = max(2, floor(getPresetValue(drawing, "N", preset.N, metrics)));
  let m = getPresetValue(drawing, "M", preset.M, metrics);
  let k = max(0, floor(getPresetValue(drawing, "K", preset.K, metrics)));

  strokeWeight(0.9 + metrics.level);
  for (let j = 0; j <= k; j++) {
    let ra = preset.raMode === "wide" ? pow(0.8, j) : pow(0.6, j);
    beginShape();
    for (let i = 0; i <= n; i++) {
      let aa = (TAU_VALUE * i) / n + time * getSpeedMod(metrics) * 0.06;
      let ab = aa * m + time * getSpeedMod(metrics) * (0.2 + metrics.mid * 0.8);
      let ca = cos(aa);
      let sa = sin(aa);
      let cb = cos(ab);
      let sb = sin(ab);
      let point = project3D(ra * ca * cb, ra * sa * cb, ra * sb, az, ay, ax, qx, 2, 2, unit);
      vertex(point.x, point.y);
    }
    endShape();
  }
}

function renderD3StructureB(preset, metrics, drawing) {
  let time = metrics.time;
  let ay = getPresetValue(drawing, "AY", preset.AY, metrics) + time * getSpeedMod(metrics) * 0.06 + metrics.bass * 0.25;
  let az = time * getSpeedMod(metrics) * 0.03 + metrics.treble * 0.1;
  let qx = getPresetValue(drawing, "QX", preset.QX, metrics) - metrics.level * 0.18;
  let unit = min(width, height) * globalConfig.size * (1 + getGlobalAudioAmount("size", metrics) * 0.5);
  let n = max(2, floor(getPresetValue(drawing, "N", preset.N, metrics)));
  let m = getPresetValue(drawing, "M", preset.M, metrics);
  let r1Base = getPresetValue(drawing, "R1", preset.R1, metrics);
  let r2Base = getPresetValue(drawing, "R2", preset.R2, metrics);

  strokeWeight(0.95 + metrics.level);
  beginShape();
  for (let i = 0; i <= n; i++) {
    let aa = (10 * PI_VALUE * i) / n + time * getSpeedMod(metrics) * 0.08;
    let ab = aa * m + time * getSpeedMod(metrics) * (0.15 + metrics.mid * 0.7);
    let ca = cos(aa);
    let sa = sin(aa);
    let cb = cos(ab);
    let sb = sin(ab);
    let mx = -r1Base * ca - r2Base * ca * cb;
    let my;
    let mz;

    if (drawing === 238 || drawing === 239) {
      my = r1Base * sa + r2Base * sa * cb;
      mz = r2Base * sb;
    } else {
      my = -r1Base * sa + r2Base * sa * cb;
      mz = -r2Base * sb + (2 * i) / n - 1;
    }

    let point = project3D(mx, my, mz, az, ay, 0, qx, 2, 2, unit);
    vertex(point.x, point.y);
  }
  endShape();
}

function project3D(mx, my, mz, az, ay, ax, qx, dc, tc, unit) {
  return project3DWithOffsets(mx, my, mz, az, ay, ax, qx, 0, 0, dc, tc, unit);
}

function project3DWithOffsets(mx, my, mz, az, ay, ax, qx, qy, qz, dc, tc, unit) {
  let c1 = cos(az);
  let s1 = -sin(az);
  let c2 = cos(ay);
  let s2 = -sin(ay);
  let c3 = cos(ax);
  let s3 = -sin(ax);

  let uu = mx;
  mx = c1 * uu - s1 * my;
  my = s1 * uu + c1 * my;
  uu = mx;
  mx = c2 * uu - s2 * mz;
  mz = s2 * uu + c2 * mz;
  uu = my;
  my = c3 * uu - s3 * mz;
  mz = s3 * uu + c3 * mz;

  mx -= qx;
  my -= qy;
  mz -= qz;
  let kp = dc / max(0.12, mx);
  let xx = -kp * my;
  let yy = kp * mz;

  return {
    x: width * 0.5 + unit * 0.5 * (xx / tc),
    y: height * 0.5 + unit * 0.5 * (yy / tc),
  };
}

function drawStar(cx, cy, radius, k, h, rotation) {
  beginShape();
  for (let i = 0; i <= floor(k); i++) {
    let angle = (TAU_VALUE * i * h) / k + rotation;
    vertex(cx + radius * cos(angle), cy + radius * sin(angle));
  }
  endShape(CLOSE);
}

function drawHud(mode, metrics) {
  noStroke();
  fill(getReactiveStrokeColor(metrics));
  textAlign(LEFT, TOP);
  textSize(14);

  let micStatus = "reactive demo";
  if (startingAudio) micStatus = "requesting microphone...";
  else if (micReady) micStatus = "microphone live";
  else if (micError) micStatus = micError;
  else micStatus = "use the start button to enable microphone";
  if (statusFlash && millis() < statusFlashUntil) micStatus = statusFlash;

  text(mode.label, 18, 18);
  text("Space next form  R weighted random  S hide or show menu", 18, 38);
  text(micStatus, 18, 58);
  text(
    "bass " +
      nf(metrics.bass, 1, 2) +
      "  mid " +
      nf(metrics.mid, 1, 2) +
      "  treble " +
      nf(metrics.treble, 1, 2) +
      "  fps " +
      nf(frameRate(), 2, 1),
    18,
    78
  );
  text("Full Range = overall level. Routing source is set per control in the panel.", 18, 98);
}

function keyPressed() {
  return false;
}

function touchStarted() {
  return false;
}

function handleWindowKeyDown(event) {
  if (event.repeat) return;

  if (event.code === "Space") {
    event.preventDefault();
    nextMode();
    return;
  }

  if (event.key === "r" || event.key === "R") {
    event.preventDefault();
    randomMode();
    return;
  }

  if (event.key === "s" || event.key === "S") {
    event.preventDefault();
    toggleChrome();
  }
}

function nextMode() {
  currentModeIndex = (currentModeIndex + 1) % modes.length;
  syncModePicker();
  flashStatus("Mode: " + modes[currentModeIndex].label);
  renderConfigPanel();
}

function previousMode() {
  currentModeIndex = (currentModeIndex - 1 + modes.length) % modes.length;
  syncModePicker();
  flashStatus("Mode: " + modes[currentModeIndex].label);
  renderConfigPanel();
}

function randomMode() {
  currentModeIndex = pickWeightedModeIndex();
  syncModePicker();
  flashStatus("Random: " + modes[currentModeIndex].label);
  renderConfigPanel();
}

function toggleChrome() {
  chromeVisible = !chromeVisible;
  hideUiAt = chromeVisible ? 0 : millis();
  applyChromeVisibility();
  if (chromeVisible) flashStatus("Menu visible");
}

function applyChromeVisibility() {
  if (controlsEl) controlsEl.classList.toggle("is-hidden", !chromeVisible);
  if (configPanelEl) configPanelEl.classList.toggle("is-hidden", !chromeVisible || !configPanelVisible);
  if (themePanelEl) themePanelEl.classList.toggle("is-hidden", !chromeVisible || !themePanelVisible);
  let toggleButton = document.getElementById("toggle-config");
  if (toggleButton) toggleButton.textContent = configPanelVisible ? "Hide Panel" : "Show Panel";
}

function updateUiHint() {
  if (!uiHintEl) return;
  let visible = !chromeVisible && millis() - hideUiAt >= UI_HINT_DELAY_MS;
  uiHintEl.classList.toggle("is-visible", visible);
}

function flashStatus(message) {
  statusFlash = message;
  statusFlashUntil = millis() + 1500;
}

function captureInitialState() {
  initialGlobalConfig = JSON.parse(JSON.stringify(globalConfig));
  initialGlobalAudioRouting = JSON.parse(JSON.stringify(globalAudioRouting));
  initialPresetByDrawing = {};
  for (let mode of modes) {
    initialPresetByDrawing[mode.drawing] = JSON.parse(JSON.stringify(mode.preset));
  }
}

function loadFavorites() {
  try {
    let raw = localStorage.getItem("dessinsgeo_favorites");
    if (raw) {
      currentFavorites = new Set(JSON.parse(raw));
      return;
    }
  } catch (_error) {}
  currentFavorites = new Set(Array.from(FAVORITE_DRAWINGS));
}

function saveFavorites() {
  try {
    localStorage.setItem("dessinsgeo_favorites", JSON.stringify(Array.from(currentFavorites)));
  } catch (_error) {}
}

function toggleFavorite() {
  let drawing = modes[currentModeIndex].drawing;
  if (currentFavorites.has(drawing)) currentFavorites.delete(drawing);
  else currentFavorites.add(drawing);
  saveFavorites();
  renderModePicker();
  renderConfigPanel();
  syncModePicker();
  flashStatus(currentFavorites.has(drawing) ? "Favorited" : "Unfavorited");
}

function resetConfig() {
  globalConfig = JSON.parse(JSON.stringify(initialGlobalConfig));
  globalAudioRouting = JSON.parse(JSON.stringify(initialGlobalAudioRouting));
  presetAudioRouting = {};
  for (let mode of modes) {
    Object.assign(mode.preset, JSON.parse(JSON.stringify(initialPresetByDrawing[mode.drawing])));
  }
  syncDrawingColorsToTheme(true);
  renderConfigPanel();
  flashStatus("Config reset");
}

function updateOverlayStatus(message) {
  if (overlayStatusEl) overlayStatusEl.textContent = message;
}

function hideOverlay() {
  if (overlayEl) overlayEl.classList.add("is-hidden");
}

function pickWeightedModeIndex() {
  let total = 0;
  for (let mode of modes) total += mode.weight;
  let target = random(total);
  let running = 0;
  for (let i = 0; i < modes.length; i++) {
    running += modes[i].weight;
    if (target <= running) return i;
  }
  return 0;
}

function getSignalMetrics() {
  if (micReady) {
    analyser.getByteFrequencyData(freqData);
    analyser.getByteTimeDomainData(timeData);

    let bass = averageBand(20, 140) * globalConfig.micSensitivity;
    let mid = averageBand(140, 1600) * globalConfig.micSensitivity;
    let treble = averageBand(1600, 6400) * globalConfig.micSensitivity;
    let level = waveformLevel() * globalConfig.micSensitivity;

    smoothedBass = lerp(smoothedBass, bass, 0.16);
    smoothedMid = lerp(smoothedMid, mid, 0.14);
    smoothedTreble = lerp(smoothedTreble, treble, 0.12);
    smoothedLevel = lerp(smoothedLevel, level, 0.18);
  } else {
    let t = millis() * 0.001;
    smoothedBass = 0.3 + 0.18 * sin(t * 0.8);
    smoothedMid = 0.25 + 0.2 * sin(t * 1.13 + 1.5);
    smoothedTreble = 0.22 + 0.2 * sin(t * 1.61 + 0.4);
    smoothedLevel = 0.3 + 0.12 * sin(t * 1.9);
  }

  return {
    bass: constrain(smoothedBass, 0, 1),
    mid: constrain(smoothedMid, 0, 1),
    treble: constrain(smoothedTreble, 0, 1),
    level: constrain(smoothedLevel, 0, 1),
    time: millis() * 0.001,
  };
}

function getAudioMetric(metrics, source) {
  if (source === "off") return 0;
  if (source === "bass") return metrics.bass;
  if (source === "mid") return metrics.mid;
  if (source === "treble") return metrics.treble;
  return metrics.level;
}

function getGlobalAudioAmount(key, metrics) {
  let route = globalAudioRouting[key];
  if (!route) return 0;
  return route.amount * getAudioMetric(metrics, route.source);
}

function getPresetRouteId(drawing, key) {
  return drawing + ":" + key;
}

function getPresetRoute(drawing, key) {
  let id = getPresetRouteId(drawing, key);
  if (!presetAudioRouting[id]) {
    presetAudioRouting[id] = { source: "level", amount: 0 };
  }
  return presetAudioRouting[id];
}

function getPresetValue(drawing, key, baseValue, metrics) {
  let route = getPresetRoute(drawing, key);
  if (!route.amount) return baseValue;
  let metric = getAudioMetric(metrics, route.source);
  let range = inferRange(key, baseValue === 0 ? 1 : baseValue);
  let span = max(0.01, range.max - range.min);
  return baseValue + metric * route.amount * span * 0.1;
}

function getSpeedMod(metrics) {
  return globalConfig.speed * (1 + getGlobalAudioAmount("speed", metrics));
}

function getDetailCount(baseDetail, metrics) {
  return max(120, floor(baseDetail * (1 + getGlobalAudioAmount("detail", metrics) * 0.5)));
}

function updatePaletteFromConfig() {
  BG_COLOR = themeConfig.bgColor;
  STROKE_COLOR = globalConfig.drawColor;
  updateUiTheme();
}

function updateUiTheme() {
  document.documentElement.style.setProperty("--ui-bg", themeConfig.bgColor);
  document.documentElement.style.setProperty("--ui-fg", themeConfig.strokeColor);
  document.documentElement.style.setProperty("--ui-accent", themeConfig.accentColor);
}

function getReactiveStrokeColor(metrics) {
  let base = color(STROKE_COLOR);
  if (globalConfig.colorMode === "static") return base;
  let accent = color(globalConfig.audioAccentColor);
  return lerpColor(base, accent, constrain(getGlobalAudioAmount("color", metrics), 0, 1));
}

function applyPalettePreset(name) {
  let entry = PALETTES_UI[name];
  if (!entry) return;
  let previousStroke = themeConfig.strokeColor;
  let previousAccent = themeConfig.accentColor;
  themeConfig.palette = name;
  themeConfig.bgColor = entry.bg;
  themeConfig.strokeColor = entry.stroke;
  themeConfig.accentColor = entry.accent;
  if (globalConfig.drawColor === previousStroke) globalConfig.drawColor = themeConfig.strokeColor;
  if (globalConfig.audioAccentColor === previousAccent) globalConfig.audioAccentColor = themeConfig.accentColor;
  renderThemePanel();
}

function syncDrawingColorsToTheme(force) {
  if (force || !globalConfig.drawColor) globalConfig.drawColor = themeConfig.strokeColor;
  if (force || !globalConfig.audioAccentColor) globalConfig.audioAccentColor = themeConfig.accentColor;
}

function toggleFullscreen() {
  fullscreen(!fullscreen());
}

function renderConfigPanel() {
  if (!configContentEl) return;
  let mode = modes[currentModeIndex];
  if (!mode) return;

  let html = "";
  html += renderSection("global", "General", [
    makeSliderControl("size", "Canvas Scale", globalConfig.size, 0.05, 3, 0.01, "percent"),
    makeSliderControl("speed", "Speed", globalConfig.speed, 0.2, 2.5, 0.01),
    makeSliderControl("micSensitivity", "Mic Sensitivity", globalConfig.micSensitivity, 0, 10, 0.01),
    makeSliderControl("placeX", "Placement X", globalConfig.placeX, -1, 1, 0.01),
    makeSliderControl("placeY", "Placement Y", globalConfig.placeY, -1, 1, 0.01),
    makeAudioRouteControls("global", "size", "Size Audio", globalAudioRouting.size),
    makeAudioRouteControls("global", "speed", "Speed Audio", globalAudioRouting.speed),
    makeAudioRouteControls("global", "detail", "Detail Audio", globalAudioRouting.detail),
  ]);
  html += renderSection("color", "Color", [
    makeColorControl("drawColor", "Drawing", globalConfig.drawColor),
    makeColorControl("audioAccentColor", "Audio Accent", globalConfig.audioAccentColor),
    makeSelectControl(
      "colorMode",
      "Color Mode",
      globalConfig.colorMode,
      [
        { value: "palette_audio", label: "Palette Audio" },
        { value: "static", label: "Static" },
      ]
    ),
    makeAudioRouteControls("global", "color", "Color Audio", globalAudioRouting.color),
  ]);
  html += renderSection("current", "Advanced", buildPresetControls(mode.preset));

  configContentEl.innerHTML = html;
  bindGlobalControls();
  bindPresetControls(mode.preset);
  bindAudioRouteControls(mode.drawing);
  bindSectionToggles();
  updateFavoriteButton();
}

function renderThemePanel() {
  if (!themeContentEl) return;
  let html = "";
  html += renderSection("theme", "Theme", [
    makeSelectControl(
      "palette",
      "Palette",
      themeConfig.palette,
      Object.keys(PALETTES_UI).map((key) => ({ value: key, label: PALETTES_UI[key].label })),
      "theme"
    ),
    makeColorControl("bgColor", "Background", themeConfig.bgColor, "theme"),
    makeColorControl("strokeColor", "Interface / Default Line", themeConfig.strokeColor, "theme"),
    makeColorControl("accentColor", "Interface Accent", themeConfig.accentColor, "theme"),
  ]);
  themeContentEl.innerHTML = html;
  bindThemeControls();
}

function updateFavoriteButton() {
  let button = document.getElementById("toggle-favorite");
  if (!button) return;
  let isFavorite = currentFavorites.has(modes[currentModeIndex].drawing);
  button.textContent = isFavorite ? "♥ Favorite" : "♡ Favorite";
}

function bindGlobalControls() {
  configContentEl.querySelectorAll("[data-global-key]").forEach((el) => {
    let handler = () => {
      updateGlobalConfigFromInput(el);
    };
    el.addEventListener("input", handler);
    el.addEventListener("change", handler);
  });
}

function bindThemeControls() {
  themeContentEl.querySelectorAll("[data-theme-key]").forEach((el) => {
    let handler = () => {
      updateThemeConfigFromInput(el);
    };
    el.addEventListener("input", handler);
    el.addEventListener("change", handler);
  });
}

function bindPresetControls(preset) {
  configContentEl.querySelectorAll("[data-preset-key]").forEach((el) => {
      let handler = () => {
        let key = el.dataset.presetKey;
        preset[key] = Number(el.value);
        updateValueText("value-preset-" + key, key, preset[key]);
      };
    el.addEventListener("input", handler);
    el.addEventListener("change", handler);
  });
}

function bindAudioRouteControls(drawing) {
  configContentEl.querySelectorAll("[data-audio-scope]").forEach((el) => {
    let handler = () => {
      let scope = el.dataset.audioScope;
      let key = el.dataset.audioKey;
      let field = el.dataset.audioField;
      let route = scope === "global" ? globalAudioRouting[key] : getPresetRoute(drawing, key);
      route[field] = field === "amount" ? Number(el.value) : el.value;
      updateValueText(`value-audio-${scope}-${key}-${field}`, field === "amount" ? key : field, route[field]);
    };
    el.addEventListener("input", handler);
    el.addEventListener("change", handler);
  });
}

function updateGlobalConfigFromInput(el) {
  let key = el.dataset.globalKey;
  let value = el.type === "checkbox" ? el.checked : el.type === "range" ? Number(el.value) : el.value;
  globalConfig[key] = value;
  updateValueText("value-global-" + key, key, value);
}

function updateThemeConfigFromInput(el) {
  let key = el.dataset.themeKey;
  let value = el.value;
  let previousStroke = themeConfig.strokeColor;
  let previousAccent = themeConfig.accentColor;

  if (key === "palette") {
    if (value !== "custom") applyPalettePreset(value);
    else themeConfig.palette = value;
    renderThemePanel();
    renderConfigPanel();
    return;
  }

  themeConfig[key] = value;
  themeConfig.palette = "custom";
  if (key === "strokeColor" && globalConfig.drawColor === previousStroke) globalConfig.drawColor = value;
  if (key === "accentColor" && globalConfig.audioAccentColor === previousAccent) globalConfig.audioAccentColor = value;
  let paletteSelect = document.getElementById("theme-palette");
  if (paletteSelect) paletteSelect.value = "custom";
  renderConfigPanel();
}

function renderSection(sectionKey, title, rows) {
  return `
    <section class="config-section">
      <details class="config-details" data-section-key="${sectionKey}" ${sectionOpenState[sectionKey] ? "open" : ""}>
        <summary class="config-summary">${title}</summary>
        ${rows.join("")}
      </details>
    </section>
  `;
}

function bindSectionToggles() {
  configContentEl.querySelectorAll("[data-section-key]").forEach((el) => {
    el.addEventListener("toggle", () => {
      sectionOpenState[el.dataset.sectionKey] = el.open;
    });
  });
}

function buildPresetControls(preset) {
  return Object.keys(preset)
    .filter((key) => typeof preset[key] === "number")
    .sort()
    .map((key) => {
      let range = inferRange(key, preset[key]);
      let route = getPresetRoute(modes[currentModeIndex].drawing, key);
  let controls = makePresetSliderControl(key, key, preset[key], range.min, range.max, range.step);
      if (!GLOBAL_ROUTE_KEYS.has(key)) {
        controls += makeAudioRouteControls("preset", key, key + " Audio", route);
      }
      return controls;
    });
}

function inferRange(key, value) {
  let absValue = abs(value);
  if (["detail", "N", "M", "K", "K1", "K2", "H"].includes(key)) {
    return { min: 1, max: max(10, ceil(absValue * 2.5)), step: 1 };
  }
  if (key === "T1" || key === "T2") {
    return { min: 0.1, max: max(5, absValue * 2.5), step: 0.1 };
  }
  if (key === "QX") {
    return { min: -6, max: 1, step: 0.01 };
  }
  if (["AX", "AY", "AZ", "A1", "AD"].includes(key)) {
    return { min: -PI_VALUE, max: PI_VALUE, step: 0.01 };
  }
  if (absValue <= 1.5) {
    return { min: 0, max: max(1.5, absValue * 3), step: 0.01 };
  }
  return { min: 0, max: max(10, absValue * 2.5), step: 0.01 };
}

function makeSliderControl(key, label, value, min, max, step, format = "") {
  return `
    <div class="config-row">
      <label for="global-${key}">${label}</label>
      <span id="value-global-${key}" class="config-value">${formatValue(key, value, format)}</span>
      <input id="global-${key}" data-global-key="${key}" type="range" min="${min}" max="${max}" step="${step}" value="${value}">
    </div>
  `;
}

function makePresetSliderControl(key, label, value, min, max, step) {
  return `
    <div class="config-row">
      <label for="preset-${key}">${label}</label>
      <span id="value-preset-${key}" class="config-value">${formatValue(key, value)}</span>
      <input id="preset-${key}" data-preset-key="${key}" type="range" min="${min}" max="${max}" step="${step}" value="${value}">
    </div>
  `;
}

function makeAudioRouteControls(scope, key, label, route) {
  return `
    <div class="config-row">
      <label for="audio-${scope}-${key}-source">${label} Source</label>
      <select id="audio-${scope}-${key}-source" data-audio-scope="${scope}" data-audio-key="${key}" data-audio-field="source">
        ${AUDIO_SOURCE_OPTIONS.map((option) => `<option value="${option.value}" ${option.value === route.source ? "selected" : ""}>${option.label}</option>`).join("")}
      </select>
    </div>
    <div class="config-row">
      <label for="audio-${scope}-${key}-amount">${label} Sensitivity</label>
      <span id="value-audio-${scope}-${key}-amount" class="config-value">${formatValue(key, route.amount)}</span>
      <input id="audio-${scope}-${key}-amount" data-audio-scope="${scope}" data-audio-key="${key}" data-audio-field="amount" type="range" min="0" max="10" step="0.01" value="${route.amount}">
    </div>
  `;
}

function makeColorControl(key, label, value, scope = "global") {
  let dataKey = scope === "theme" ? "data-theme-key" : "data-global-key";
  return `
    <div class="config-row">
      <label for="${scope}-${key}">${label}</label>
      <input id="${scope}-${key}" ${dataKey}="${key}" type="color" value="${value}">
    </div>
  `;
}

function makeCheckboxControl(key, label, value) {
  return `
    <div class="config-row">
      <label for="global-${key}">${label}</label>
      <input id="global-${key}" data-global-key="${key}" type="checkbox" ${value ? "checked" : ""}>
    </div>
  `;
}

function makeSelectControl(key, label, value, options, scope = "global") {
  let dataKey = scope === "theme" ? "data-theme-key" : "data-global-key";
  let optionsHtml = options
    .map((option) => `<option value="${option.value}" ${option.value === value ? "selected" : ""}>${option.label}</option>`)
    .join("");
  return `
    <div class="config-row">
      <label for="${scope}-${key}">${label}</label>
      <select id="${scope}-${key}" ${dataKey}="${key}">${optionsHtml}</select>
    </div>
  `;
}

function updateValueText(id, key, value) {
  let el = document.getElementById(id);
  if (el) el.textContent = formatValue(key, value, id === "value-global-size" ? "percent" : "");
}

function formatValue(key, value, format = "") {
  if (typeof value === "boolean") return value ? "On" : "Off";
  if (format === "percent") return Math.round(value * 100) + "%";
  return abs(value) >= 100 ? value.toFixed(0) : value.toFixed(2);
}

async function startAudio() {
  if (micReady || startingAudio) return;
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    micError = "This browser does not expose microphone input.";
    updateOverlayStatus(micError + " Use http://localhost or https.");
    flashStatus(micError);
    return;
  }

  if (!window.isSecureContext) {
    micError = "Microphone access requires a secure context.";
    updateOverlayStatus(micError + " Use http://localhost or https.");
    flashStatus(micError);
    return;
  }

  startingAudio = true;
  micError = "";
  updateOverlayStatus("Requesting microphone access...");

  try {
    let AudioContextCtor = window.AudioContext || window.webkitAudioContext;
    audioContext = audioContext || new AudioContextCtor();
    if (audioContext.state === "suspended") {
      await audioContext.resume();
    }

    micStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
      },
    });

    micSource = audioContext.createMediaStreamSource(micStream);
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.82;
    micSource.connect(analyser);

    freqData = new Uint8Array(analyser.frequencyBinCount);
    timeData = new Uint8Array(analyser.fftSize);
    micReady = true;
    updateOverlayStatus("Microphone live.");
    flashStatus("Microphone live");
    hideOverlay();
    let startButton = document.getElementById("start-audio");
    if (startButton) startButton.style.display = "none";
  } catch (error) {
    micError = "Microphone access failed: " + error.message;
    updateOverlayStatus(micError);
    flashStatus(micError);
  } finally {
    startingAudio = false;
  }
}

function averageBand(lowHz, highHz) {
  let nyquist = audioContext.sampleRate * 0.5;
  let lowIndex = floor((lowHz / nyquist) * freqData.length);
  let highIndex = ceil((highHz / nyquist) * freqData.length);
  lowIndex = constrain(lowIndex, 0, freqData.length - 1);
  highIndex = constrain(highIndex, lowIndex + 1, freqData.length);

  let sum = 0;
  for (let i = lowIndex; i < highIndex; i++) {
    sum += freqData[i];
  }
  return sum / ((highIndex - lowIndex) * 255);
}

function waveformLevel() {
  let sum = 0;
  for (let i = 0; i < timeData.length; i++) {
    let centered = (timeData[i] - 128) / 128;
    sum += centered * centered;
  }
  return min(1, sqrt(sum / timeData.length) * 3.5);
}
