//Flocking + Predator/Prey

class Boid {
  constructor() {
    this.position = createVector(random(width), random(height));
    this.velocity = p5.Vector.random2D();
    this.acceleration = createVector();
    this.maxForce = 0.2;
    this.maxSpeed = 4;
    this.alive = true;
  }

  update() {
  this.position.add(this.velocity);
  this.velocity.add(this.acceleration);
  this.velocity.limit(this.maxSpeed);
  this.acceleration.mult(0);

  // Wrap around the canvas
  if (this.position.x > width) {
    this.position.x = 0;
  } else if (this.position.x < 0) {
    this.position.x = width;
  }
  if (this.position.y > height) {
    this.position.y = 0;
  } else if (this.position.y < 0) {
    this.position.y = height;
  }
}

  applyForce(force) {
    this.acceleration.add(force);
  }

	show() {
	  stroke(255);
	  strokeWeight(2);
	  fill(255, 50);
	  ellipse(this.position.x, this.position.y, 8);
	}

  separation(boids) {
    let perceptionRadius = 50;
    let steering = createVector();
    let total = 0;
  
    for (const other of boids) {
      let distance = dist(
        this.position.x,
        this.position.y,
        other.position.x,
        other.position.y
      );
  
      if (other !== this && distance < perceptionRadius) {
        let difference = p5.Vector.sub(this.position, other.position);
        difference.div(distance);
        steering.add(difference);
        total++;
      }
    }
  
    if (total > 0) {
      steering.div(total);
      steering.setMag(this.maxSpeed);
      steering.sub(this.velocity);
      steering.limit(this.maxForce);
    }
  
    return steering;
  }

  cohesion(boids) {
    let perceptionRadius = 100;
    let steering = createVector();
    let total = 0;

    for (const other of boids) {
      let distance = dist(
        this.position.x,
        this.position.y,
        other.position.x,
        other.position.y
      );

      if (other !== this && distance < perceptionRadius) {
        steering.add(other.position);
        total++;
      }
    }

    if (total > 0) {
      steering.div(total);
      steering.sub(this.position);
      steering.setMag(this.maxSpeed);
      steering.sub(this.velocity);
      steering.limit(this.maxForce);
    }

    return steering;
	}

  alignment(boids) {
    let perceptionRadius = 50;
    let steering = createVector();
    let total = 0;

    for (const other of boids) {
      let distance = dist(
        this.position.x,
        this.position.y,
        other.position.x,
        other.position.y
      );

      if (other !== this && distance < perceptionRadius) {
        steering.add(other.velocity);
        total++;
      }
    }

    if (total > 0) {
      steering.div(total);
      steering.setMag(this.maxSpeed);
      steering.sub(this.velocity);
      steering.limit(this.maxForce);
    }

    return steering;
  }

  run(predators) {// avoid predators (separation from predators)
    let sep = this.separation(predators);
    sep.mult(10);
    this.applyForce(sep);
  }

  flock(boids) {
    let sep = this.separation(boids);
    let coh = this.cohesion(boids);
    let ali = this.alignment(boids);

    this.applyForce(sep);
    this.applyForce(coh);
    this.applyForce(ali);
  }
}

class Predator {
  constructor() {
    this.position = createVector(random(width), random(height));
    this.velocity = p5.Vector.random2D();
    this.acceleration = createVector();
    this.maxForce = 0.2;
    this.maxSpeed = 4;
  }

  update() {
    this.position.add(this.velocity);
    this.velocity.add(this.acceleration);
    this.velocity.limit(this.maxSpeed);
    this.acceleration.mult(0);

    // Wrap around the canvas
    if (this.position.x > width) {
      this.position.x = 0;
    } else if (this.position.x < 0) {
      this.position.x = width;
    }
    if (this.position.y > height) {
      this.position.y = 0;
    } else if (this.position.y < 0) {
      this.position.y = height;
    }
  }

  seekPrey(boids) {
    let perceptionRadius = 100;
    let steering = createVector();
    let total = 0;

    for (const other of boids) {
      let distance = dist(
        this.position.x,
        this.position.y,
        other.position.x,
        other.position.y
      );

      if (other !== this && distance < perceptionRadius) {
        steering.add(other.position);
        total++;
      }
    }

    if (total > 0) {
      steering.div(total);
      steering.sub(this.position);
      steering.setMag(this.maxSpeed);
      steering.sub(this.velocity);
      steering.limit(this.maxForce);
    }

    return steering;
  }

  applyForce(force) {
    this.acceleration.add(force);
  }

  show() {
    stroke(color('red'));
    strokeWeight(2);
    fill(255, 50);
    ellipse(this.position.x, this.position.y, 8);
  }

  eat(boids) {
    let consumingRadius = 10;
    for (let i = boids.length - 1; i >= 0; i--) {
      let distance = dist(
        this.position.x,
        this.position.y,
        boids[i].position.x,
        boids[i].position.y
      );
      if (distance < consumingRadius) {
        boids[i].alive = false;
      }
    }
  }
}

const flock = [];
const predators = [];

function setup() {
  createCanvas(windowWidth, windowHeight);
  for (let i =0; i < 5; i++) {
    predators.push(new Predator());
  }
  for (let i = 0; i < 100; i++) {
    flock.push(new Boid());
  }
}

function draw() {
  background(51);

  for (const predator of predators) {
    predator.eat(flock);
    predator.applyForce(predator.seekPrey(flock));
    predator.update();
    predator.show();
  }

  for (const boid of flock) {
    if (boid.alive === true) {
      boid.run(predators);
      boid.flock(flock);
      boid.update();
      boid.show();
    }
  }
}