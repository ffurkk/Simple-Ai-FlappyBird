import React, { Component } from "react";
import "./App.css";

const TOTAL_BIRD = 1;
const HEIGHT = 500;
const WIDTH = 800;
const PIPE_WIDHT = 60;
const MIN_PIPE_HEIGHT = 40;
const FPS = 120;

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
  constructor(ctx) {
    this.ctx = ctx;
    this.x = 100;
    this.y = 150;
    this.gravity = 2.5;
    this.velocity = 0.1;
    this.isDead = false;
    this.color = getRandomColor();
    this.age = 0;
  }

  draw() {
    this.ctx.fillStyle = this.color;
    this.ctx.beginPath();
    this.ctx.arc(this.x, this.y, 10, 0, 2 * Math.PI);
    this.ctx.fill();
  }

  update = () => {
    this.age += 1;
    this.gravity += this.velocity;
    this.gravity = Math.min(5, this.gravity);
    this.y += this.gravity;
  };

  jump = () => {
    this.gravity = -3.5;
  };
}

class Play extends Component {
  constructor(props) {
    super(props);
    this.canvasRef2 = React.createRef();
    this.frameCount = 0;
    this.space = 120;
    this.pipes = [];
    this.birds = [];
  }

  componentDidMount() {
    document.addEventListener("keydown", this.onKeyDown);
    this.startGame();
  }
  onKeyDown = (e) => {
    if (e.code === "Space") {
      this.birds[0].jump();
    }
  };
  startGame = () => {
    this.frameCount = 0;
    clearInterval(this.loop);
    this.pipes = [];
    this.pipes = this.generatePipes();
    this.birds = this.generateBirds();
    this.loop = setInterval(this.gameLoop, 1000 / FPS);
  };

  getCtx = () => this.canvasRef2.current.getContext("2d");

  generateBirds = () => {
    const birds = [];
    const ctx = this.getCtx();
    for (let i = 0; i < TOTAL_BIRD; i += 1) {
      birds.push(new Bird(ctx));
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

    this.isGameOver();
    this.birds = this.birds.filter((bird) => !bird.isDead);

    this.birds.forEach((bird) => bird.update());

    if (this.isGameOver()) {
      alert(`Mal Score: ${this.birds[0].age} `);
      clearInterval(this.loop);
    }
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
        }
      });
    });
    return gameOver;
  };

  draw() {
    const ctx = this.canvasRef2.current.getContext("2d");
    ctx.clearRect(0, 0, WIDTH, HEIGHT);

    this.pipes.forEach((pipe) => pipe.draw());
    this.birds.forEach((bird) => bird.draw());
  }

  render() {
    return (
      <div className='App'>
        <canvas
          ref={this.canvasRef2}
          id='gameCanvas2'
          width={WIDTH}
          height={HEIGHT}
          style={{ marginTop: "24px", border: "1px solid black" }}
        ></canvas>
        <div>
          <button onClick={() => this.startGame()}>Yeniden başlat</button>
        </div>
      </div>
    );
  }
}

export default Play;
