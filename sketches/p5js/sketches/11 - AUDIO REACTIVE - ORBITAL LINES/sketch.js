let DESSIN = "AUDIO_ORBITAL_LINES";

let NP = 900;
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

function setup() {
  PALETTE("NEW_BLUE");
  INIT();
  frameRate(30);
  strokeWeight(1.2);
}

function draw() {
  background(BG_COLOR);

  if (micReady) {
    updateAudioMetrics();
    drawOrbitalField();
  } else {
    drawIdleField();
  }

  drawHud();
}

function drawOrbitalField() {
  let bass = smoothedBass;
  let mid = smoothedMid;
  let treble = smoothedTreble;
  let level = smoothedLevel;

  let time = millis() * 0.00045;
  let cx = width * 0.5;
  let cy = height * 0.5;
  let baseRadius = width * (0.18 + bass * 0.2);
  let orbitRadius = width * (0.06 + mid * 0.12);
  let rippleRadius = width * (0.02 + treble * 0.08);
  let loops = 6 + floor(bass * 10);
  let detail = 1400;

  push();
  translate(cx, cy);
  rotate(time * (0.7 + bass * 1.3));

  noFill();
  stroke(247, 235, 35, 220);
  beginShape();
  for (let i = 0; i <= detail; i++) {
    let t = i / detail;
    let angle = TWO_PI * t * loops;
    let drift = time * (1.5 + treble * 4);
    let radial =
      baseRadius +
      orbitRadius * sin(angle * (2 + mid * 5) + drift) +
      rippleRadius * sin(angle * (18 + treble * 30) - drift * 1.7) +
      width * 0.04 * level * sin(angle * 3 - drift * 0.6);

    let x = radial * cos(angle + drift * 0.3);
    let y =
      radial * sin(angle * (1 + bass * 0.25) - drift * 0.2) *
      (0.7 + treble * 0.45);
    vertex(x, y);
  }
  endShape();

  stroke(247, 235, 35, 60);
  beginShape();
  for (let i = 0; i <= detail; i++) {
    let t = i / detail;
    let angle = TWO_PI * t * (loops + 1);
    let drift = time * (0.9 + mid * 2.2);
    let radial =
      baseRadius * 0.7 +
      orbitRadius * 0.8 * cos(angle * (3 + bass * 4) - drift) +
      rippleRadius * 1.4 * sin(angle * (10 + treble * 18) + drift * 2.1);

    let x = radial * cos(angle * (1.1 + treble * 0.25));
    let y = radial * sin(angle + drift) * (0.95 - bass * 0.18);
    vertex(x, y);
  }
  endShape();
  pop();
}

function drawIdleField() {
  let time = millis() * 0.00035;
  let cx = width * 0.5;
  let cy = height * 0.5;
  let baseRadius = width * 0.24;
  let detail = 900;

  push();
  translate(cx, cy);
  rotate(time * 0.5);
  noFill();
  stroke(247, 235, 35, 120);
  beginShape();
  for (let i = 0; i <= detail; i++) {
    let t = i / detail;
    let angle = TWO_PI * t * 8;
    let radial =
      baseRadius +
      width * 0.04 * sin(angle * 3 + time * 3) +
      width * 0.015 * sin(angle * 15 - time * 5);
    vertex(radial * cos(angle), radial * sin(angle) * 0.82);
  }
  endShape();
  pop();
}

function drawHud() {
  noStroke();
  fill(247, 235, 35, 255);
  textAlign(LEFT, TOP);
  textSize(14);

  let message = "Click or press any key to enable microphone";
  if (startingAudio) message = "Requesting microphone access...";
  if (micReady) {
    message =
      "Mic live  bass " +
      nf(smoothedBass, 1, 2) +
      "  mid " +
      nf(smoothedMid, 1, 2) +
      "  treble " +
      nf(smoothedTreble, 1, 2);
  }
  if (micError) message = micError;

  text(message, 18, 18);
  text("Space saves a frame. Serve over localhost or https for mic access.", 18, 38);
}

function mousePressed() {
  startAudio();
}

function touchStarted() {
  startAudio();
  return false;
}

function keyPressed() {
  startAudio();
  if (key == " ") {
    save("audio_orbital_lines.png");
  }
}

async function startAudio() {
  if (micReady || startingAudio) return;
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    micError = "This browser does not expose microphone input.";
    return;
  }

  startingAudio = true;
  micError = "";

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
  } catch (error) {
    micError = "Microphone access failed: " + error.message;
  } finally {
    startingAudio = false;
  }
}

function updateAudioMetrics() {
  analyser.getByteFrequencyData(freqData);
  analyser.getByteTimeDomainData(timeData);

  let bass = averageBand(20, 140);
  let mid = averageBand(140, 1600);
  let treble = averageBand(1600, 6400);
  let level = waveformLevel();

  smoothedBass = lerp(smoothedBass, bass, 0.16);
  smoothedMid = lerp(smoothedMid, mid, 0.14);
  smoothedTreble = lerp(smoothedTreble, treble, 0.12);
  smoothedLevel = lerp(smoothedLevel, level, 0.18);
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
