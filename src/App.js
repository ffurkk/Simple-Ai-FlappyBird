import React, { Component } from "react";
import "./App.css";
import furkiNeuralNetwork from "./lib/furkiNeuralNetwork";

const TOTAL_BIRD = 100;
const HEIGHT = 500;
const WIDTH = 800;
const PIPE_WIDHT = 60;
const MIN_PIPE_HEIGHT = 40;
const FPS = 1000;

class Pipe {
  constructor(ctx, height, space) {
    this.ctx = ctx;
    this.x = WIDTH;
    this.y = height ? HEIGHT - height : 0;
    this.width = PIPE_WIDHT;
    this.height =
      height ||
      MIN_PIPE_HEIGHT + Math.random() * (HEIGHT - space - MIN_PIPE_HEIGHT * 2);
  }
  draw() {
    this.ctx.fillStyle = "black";
    this.ctx.fillRect(this.x, this.y, this.width, this.height);
  }

  update = () => {
    this.x -= 1;
    if (this.x + PIPE_WIDHT < 0) {
      this.isDead = true;
    }
    if (this.x + PIPE_WIDHT < 100) {
      this.passed = true;
    }
  };
}

function getRandomColor() {
  var letters = "0123456789ABCDEF";
  var color = "#";
  for (var i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

class Bird {
  constructor(ctx, brain, i) {
    this.ctx = ctx;
    this.x = 100;
    this.y = 100 + HEIGHT / i;
    this.gravity = 0;
    this.velocity = 0.1;
    this.brain = brain ? brain.copy() : new furkiNeuralNetwork(4, 10, 2);
    this.isDead = false;
    this.color = getRandomColor();
    this.fitness = 0;
    this.age = 0;
  }

  draw() {
    this.ctx.fillStyle = this.color;
    this.ctx.beginPath();
    this.ctx.arc(this.x, this.y, 10, 0, 2 * Math.PI);
    this.ctx.fill();
  }

  update = (gapCenter) => {
    this.age += 1;
    this.gravity += this.velocity;
    this.gravity = Math.min(5, this.gravity);
    this.y += this.gravity;

    this.think(gapCenter);
  };

  think = (gapCenter) => {
    const inputs = [
      this.y / HEIGHT,
      this.x / WIDTH,
      gapCenter / HEIGHT,
      this.gravity / 10,
    ];
    const result = this.brain.feedforward(inputs);

    if (result[1] < result[0]) {
      this.jump();
    }
  };

  mutate = () => {
    this.brain.mutate((x) => {
      if (Math.random() < 0.1) {
        let offset = (Math.random() * 2 - 1) / 4;
        return x + offset;
      } else {
        return x;
      }
    });
  };

  jump = () => {
    this.gravity = -3.5;
  };
}

class App extends Component {
  constructor(props) {
    super(props);
    this.canvasRef = React.createRef();
    this.frameCount = 0;
    this.space = 100;
    this.pipes = [];
    this.birds = [];
    this.deadBirds = [];
    this.state = { LiveScore: 0, SCORE: 0, Generation: 1, LiveBird: null };
  }

  componentDidMount() {
    document.addEventListener("keydown", this.onKeyDown);
    this.startGame();
  }

  startGame = (birdBrain) => {
    this.frameCount = 0;
    clearInterval(this.loop);
    this.pipes = [];
    this.pipes = this.generatePipes();
    this.birds = this.generateBirds(birdBrain);
    this.loop = setInterval(this.gameLoop, 0.001);
  };

  onKeyDown = (e) => {
    if (e.code === "Space") {
      this.birds[0].jump();
    }
  };

  getCtx = () => this.canvasRef.current.getContext("2d");

  generateBirds = (brain) => {
    const birds = [];
    const ctx = this.getCtx();
    for (let i = 0; i <= TOTAL_BIRD; i += 1) {
      birds.push(new Bird(ctx, brain, i));
      birds[i].mutate();
    }
    return birds;
  };

  generatePipes = () => {
    const ctx = this.getCtx();
    const firstPipe = new Pipe(ctx, null, this.space);
    const secondPipeHeight = HEIGHT - firstPipe.height - this.space;
    const secondPipe = new Pipe(ctx, secondPipeHeight, 80);

    return [firstPipe, secondPipe];
  };

  gameLoop = () => {
    this.update();
    this.draw();
  };

  update = () => {
    this.frameCount = this.frameCount + 1;
    if (this.frameCount % 320 === 0) {
      const pipes = this.generatePipes();
      this.pipes.push(...pipes);
    }
    this.pipes.forEach((pipe) => pipe.update());
    this.pipes = this.pipes.filter((pipe) => !pipe.isDead);

    const topPipe = this.pipes.filter((pipe) => !pipe.passed)[0];
    const gapCenter = topPipe.height + this.space / 2;

    this.birds = this.birds.filter((bird) => !bird.isDead);
    this.state.LiveBird = this.birds.length;

    this.birds.forEach((bird) => bird.update(gapCenter));

    this.isGameOver();
    this.deadBirds.push(...this.birds.filter((bird) => bird.isDead));

    if (this.birds.length === 0) {
      this.deadBirds.sort((a, b) => b.age - a.age);
      const strongest = this.deadBirds[0];
      this.setState({ SCORE: strongest.age });
      this.startGame(strongest.brain);
      this.setState({ Generation: this.state.Generation + 1 });

      this.deadBirds = [];
      this.deadBirds.push(strongest);
    }

    this.frameCount % 100 === 0 &&
      this.setState({ LiveScore: this.frameCount });
  };

  isGameOver = () => {
    let gameOver = false;
    this.birds.forEach((bird) => {
      this.pipes.forEach((pipe) => {
        if (
          bird.y < 0 ||
          bird.y > HEIGHT ||
          (bird.x >= pipe.x &&
            bird.x <= pipe.x + pipe.width &&
            bird.y >= pipe.y &&
            bird.y <= pipe.y + pipe.height)
        ) {
          gameOver = true;
          bird.isDead = true;
        }
      });
    });
    return gameOver;
  };

  draw() {
    const ctx = this.canvasRef.current.getContext("2d");
    ctx.clearRect(0, 0, WIDTH, HEIGHT);

    this.pipes.forEach((pipe) => pipe.draw());
    this.birds.forEach((bird) => bird.draw());
  }

  render() {
    return (
      <div className='App'>
        <canvas
          ref={this.canvasRef}
          id='gameCanvas'
          width={WIDTH}
          height={HEIGHT}
          style={{ marginTop: "24px", border: "1px solid black" }}
        ></canvas>

        <div>En Yüksek Skor: {this.state.SCORE}</div>
        <div>Jenerasyon: {this.state.Generation}</div>
        <div>Canlı Skor: {this.state.LiveScore}</div>
        <div>Canlı Kuş sayısı: {this.state.LiveBird}</div>
      </div>
    );
  }
}

export default App;
