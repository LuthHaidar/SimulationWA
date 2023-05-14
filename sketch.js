const gridSize = 256;
const diffusion = 0.0001;
const viscosity = 0.0001;
const timeStep = 0.001;

let velocityX, velocityY, prevVelocityX, prevVelocityY;
let density, prevDensity;

function setup() {
  createCanvas(1024, 1024);
  pixelDensity(1);
  smooth();
  loadPixels();

  velocityX = new Array(gridSize * gridSize).fill(0);
  velocityY = new Array(gridSize * gridSize).fill(0);
  prevVelocityX = new Array(gridSize * gridSize).fill(0);
  prevVelocityY = new Array(gridSize * gridSize).fill(0);

  density = new Array(gridSize * gridSize).fill(0);
  prevDensity = new Array(gridSize * gridSize).fill(0);

  background(0);
}

function draw() {
  // Update fluid simulation
  let dt = timeStep;
  diffuse(1, prevVelocityX, velocityX, viscosity, dt, gridSize);
  diffuse(2, prevVelocityY, velocityY, viscosity, dt, gridSize);
  project(prevVelocityX, prevVelocityY, velocityX, velocityY, gridSize);
  advect(1, velocityX, prevVelocityX, prevVelocityX, prevVelocityY, dt, gridSize);
  advect(2, velocityY, prevVelocityY, velocityX, velocityY, dt, gridSize);
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
    pixels[idx] = 255 - col;
    pixels[idx + 1] = 255 - col;
    pixels[idx + 2] = 255 - col;
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
        let index = i + j * N;
        x[index] = (x0[index] + a * (x[index - 1] + x[index + 1] + x[index - N] + x[index + N])) / (1 + 4 * a);
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
      let index = i + j * N;
      div[index] = -0.5 * (u[index + 1] - u[index - 1] + v[index + N] - v[index - N]) / N;
      p[index] = 0;
    }
  }
  setBoundary(0, div, N);
  setBoundary(0, p, N);
  for (let k = 0; k < 20; k++) {
    for (let i = 1; i < N - 1; i++) {
      for (let j = 1; j < N - 1; j++) {
        let index = i + j * N;
        p[index] = (div[index] + p[index - 1] + p[index + 1] + p[index - N] + p[index + N]) / 4;
      }
    }
    setBoundary(0, p, N);
  }
  for (let i = 1; i < N - 1; i++) {
    for (let j = 1; j < N - 1; j++) {
      let index = i + j * N;
      u[index] -= 0.5 * N * (p[index + 1] - p[index - 1]);
      v[index] -= 0.5 * N * (p[index + N] - p[index - N]);
    }
  }
  setBoundary(1, u, N);
  setBoundary(2, v, N);
}

function setBoundary(b, x, N) {
  for (let i = 1; i < N - 1; i++) {
    let index = i + 0 * N;
    x[index] = b === 2 ? -x[index + N] : x[index + N];
    index = i + (N - 1) * N;
    x[index] = b === 2 ? -x[index - N] : x[index - N];
  }
  for (let j = 1; j < N - 1; j++) {
    let index = 0 + j * N;
    x[index] = b === 1 ? -x[index + 1] : x[index + 1];
    index = (N - 1) + j * N;
    x[index] = b === 1 ? -x[index - 1] : x[index - 1];
  }
  let index = 0 + 0 * N;
  x[index] = 0.5 * (x[index + 1] + x[index + N]);
  index = 0 + (N - 1) * N;
  x[index] = 0.5 * (x[index + 1] + x[index - N]);
  index = (N - 1) + 0 * N;
  x[index] = 0.5 * (x[index - 1] + x[index + N]);
  index = (N - 1) + (N - 1) * N;
  x[index] = 0.5 * (x[index - 1] + x[index - N]);
}