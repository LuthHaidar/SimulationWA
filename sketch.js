//https://mikeash.com/pyblog/fluid-simulation-for-dummies.html
//^^ I owe this to the above site
const gridSize = 128;
const diffusion = 0.0001;
const viscosity = 0.0001;
const timeStep = 0.001;

let velocityX, velocityY, prevVelocityX, prevVelocityY;
let density, prevDensity;

function setup() {
  createCanvas(windowWidth, windowHeight);
  pixelDensity(1);

  velocityX = new Array(gridSize * gridSize).fill(0);
  velocityY = new Array(gridSize * gridSize).fill(0);
  prevVelocityX = new Array(gridSize * gridSize).fill(0);
  prevVelocityY = new Array(gridSize * gridSize).fill(0);

  density = new Array(gridSize * gridSize).fill(0);
  prevDensity = new Array(gridSize * gridSize).fill(0);
}

function draw() {
  background(0);

  // Update fluid simulation
  let dt = timeStep;
  diffuse(1, prevVelocityX, velocityX, viscosity, dt, gridSize);
  diffuse(2, prevVelocityY, velocityY, viscosity, dt, gridSize);
  project(prevVelocityX, prevVelocityY, velocityX, velocityY, gridSize);
  advect(1, velocityX, prevVelocityX, prevVelocityX, prevVelocityY, dt, gridSize);
  advect(2, velocityY, prevVelocityY, prevVelocityX, prevVelocityY, dt, gridSize);
  project(velocityX, velocityY, prevVelocityX, prevVelocityY, gridSize);
  diffuse(0, prevDensity, density, diffusion, dt, gridSize);
  advect(0, density, prevDensity, velocityX, velocityY, dt, gridSize);

  // Visualize fluid flow
  loadPixels();
  for (let i = 0; i < gridSize * gridSize; i++) {
    let x = i % gridSize;
    let y = floor(i / gridSize);
    let px = floor(x / gridSize * width);
    let py = floor(y / gridSize * height);
    let col = density[i] * 255;
    col = constrain(col, 0, 255);
    let idx = (px + py * width) * 4;
    pixels[idx] = col;
    pixels[idx + 1] = col;
    pixels[idx + 2] = col;
    pixels[idx + 3] = 255;
  }
  updatePixels();
}

function mouseDragged() {
  let x = floor(mouseX / width * gridSize);
  let y = floor(mouseY / height * gridSize);
  let i = x + y * gridSize;

  if (mouseButton === LEFT) {
    density[i] += 100;
    velocityX[i] += (mouseX - pmouseX) * 5;
    velocityY[i] += (mouseY - pmouseY) * 5;
  }
}

function diffuse(b, x, x0, diff, dt, N) {
  let a = dt * diff * N * N;
  for (let k = 0; k < 20; k++) {
    for (let i = 1; i < N - 1; i++) {
      for (let j = 1; j < N - 1; j++) {
        x[i + j * N] = (x0[i + j * N] + a * (x[i - 1 + j * N] + x[i + (j - 1) * N] + x[i + 1 + j * N] + x[i + (j + 1) * N])) / (1 + 4 * a);
      }
    }
    setBoundary(b, x, N);
  }
}

function advect(b, d, d0, u, v, dt, N) {
  let dt0 = dt * N;
  for (let i = 1; i < N - 1; i++) {
    for (let j = 1; j < N - 1; j++) {
      let x = i - dt0 * u[i + j * N];
      let y = j - dt0 * v[i + j * N];
      if (x < 0.5) x = 0.5;
      if (x > N + 0.5) x = N + 0.5;
      let i0 = floor(x);
      let i1 = i0 + 1;
      if (y < 0.5) y = 0.5;
      if (y > N + 0.5) y = N + 0.5;
      let j0 = floor(y);
      let j1 = j0 + 1;
      let s1 = x - i0;
      let s0 = 1 - s1;
      let t1 = y - j0;
      let t0 = 1 - t1;
      let i0j0 = i0 + j0 * N;
      let i1j0 = i1 + j0 * N;
      let i0j1 = i0 + j1 * N;
      let i1j1 = i1 + j1 * N;
      d[i + j * N] = s0 * (t0 * d0[i0j0] + t1 * d0[i0j1]) + s1 * (t0 * d0[i1j0] + t1 * d0[i1j1]);
    }
  }
  setBoundary(b, d, N);
}

function project(u, v, p, div, N) {
  for (let i = 1; i < N - 1; i++) {
    for (let j = 1; j < N - 1; j++) {
      div[i + j * N] = -0.5 * (u[i + 1 + j * N] - u[i - 1 + j * N] + v[i + (j + 1) * N] - v[i + (j - 1) * N]) / N;
      p[i + j * N] = 0;
    }
  }
  setBoundary(0, div, N);
  setBoundary(0, p, N);
  for (let k = 0; k < 20; k++) {
    for (let i = 1; i < N - 1; i++) {
      for (let j = 1; j < N - 1; j++) {
        p[i + j * N] = (div[i + j * N] + p[i - 1 + j * N] + p[i + (j - 1) * N] + p[i + 1 + j * N] + p[i + (j + 1) * N]) / 4;
      }
    }
    setBoundary(0, p, N);
  }
  for (let i = 1; i < N - 1; i++) {
    for (let j = 1; j < N - 1; j++) {
      u[i + j * N] -= 0.5 * N * (p[i + 1 + j * N] - p[i - 1 + j * N]);
      v[i + j * N] -= 0.5 * N * (p[i + (j + 1) * N] - p[i + (j - 1) * N]);
    }
  }
  setBoundary(1, u, N);
  setBoundary(2, v, N);
}

function setBoundary(b, x, N) {
  for (let i = 1; i < N - 1; i++) {
    x[i + 0 * N] = b === 2 ? -x[i + 1 * N] : x[i + 1 * N];
    x[i + (N - 1) * N] = b === 2 ? -x[i + (N - 2) * N] : x[i + (N - 2) * N];
  }
  for (let j = 1; j < N - 1; j++) {
    x[0 + j * N] = b === 1 ? -x[1 + j * N] : x[1 + j * N];
    x[(N - 1) + j * N] = b === 1 ? -x[(N - 2) + j * N] : x[(N - 2) + j * N];
  }
  x[0 + 0 * N] = 0.5 * (x[1 + 0 * N] + x[0 + 1 * N]);
  x[0 + (N - 1) * N] = 0.5 * (x[1 + (N - 1) * N] + x[0 + (N - 2) * N]);
  x[(N - 1) + 0 * N] = 0.5 * (x[(N - 2) + 0 * N] + x[(N - 1) + 1 * N]);
  x[(N - 1) + (N - 1) * N] = 0.5 * (x[(N - 2) + (N - 1) * N] + x[(N - 1) + (N - 2) * N]);
}