import React, { useEffect, useRef, useState } from 'react';
import '../styles/asteroids.css';

const AsteroidsGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [gameState, setGameState] = useState<'start' | 'playing' | 'paused' | 'gameover'>('start');
  const gameRef = useRef<any>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const CANVAS_WIDTH = 640;
    const CANVAS_HEIGHT = 480;

    // Game variables
    const keys: { [key: string]: boolean } = {};
    let ship: any = null;
    let asteroids: any[] = [];
    let bullets: any[] = [];
    let gameLoop: number;

    // Key handling
    const handleKeyDown = (e: KeyboardEvent) => {
      keys[e.key] = true;
      if (e.key === ' ') e.preventDefault();
      if (e.key === 'p') {
        setGameState(prev => prev === 'playing' ? 'paused' : 'playing');
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keys[e.key] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Ship
    class Ship {
      x: number;
      y: number;
      rot: number;
      velX: number;
      velY: number;
      velRot: number;
      
      constructor() {
        this.x = CANVAS_WIDTH / 2;
        this.y = CANVAS_HEIGHT / 2;
        this.rot = 0;
        this.velX = 0;
        this.velY = 0;
        this.velRot = 0;
      }

      update() {
        // Rotation
        if (keys['ArrowLeft']) this.velRot = -5;
        else if (keys['ArrowRight']) this.velRot = 5;
        else this.velRot = 0;

        // Thrust
        if (keys['ArrowUp']) {
          const rad = (this.rot - 90) * Math.PI / 180;
          this.velX += 0.5 * Math.cos(rad);
          this.velY += 0.5 * Math.sin(rad);
        }

        // Speed limit
        const speed = Math.sqrt(this.velX * this.velX + this.velY * this.velY);
        if (speed > 8) {
          this.velX *= 0.95;
          this.velY *= 0.95;
        }

        // Shooting
        if (keys[' ']) {
          this.shoot();
          keys[' '] = false;
        }

        this.rot += this.velRot;
        this.x += this.velX;
        this.y += this.velY;

        // Wrap around screen
        if (this.x > CANVAS_WIDTH) this.x = 0;
        if (this.x < 0) this.x = CANVAS_WIDTH;
        if (this.y > CANVAS_HEIGHT) this.y = 0;
        if (this.y < 0) this.y = CANVAS_HEIGHT;
      }

      shoot() {
        const rad = (this.rot - 90) * Math.PI / 180;
        bullets.push(new Bullet(
          this.x + Math.cos(rad) * 10,
          this.y + Math.sin(rad) * 10,
          Math.cos(rad) * 10 + this.velX,
          Math.sin(rad) * 10 + this.velY
        ));
      }

      draw() {
        ctx!.save();
        ctx!.translate(this.x, this.y);
        ctx!.rotate(this.rot * Math.PI / 180);
        ctx!.strokeStyle = '#00ff00';
        ctx!.lineWidth = 2;
        ctx!.beginPath();
        ctx!.moveTo(-5, 4);
        ctx!.lineTo(0, -12);
        ctx!.lineTo(5, 4);
        ctx!.closePath();
        ctx!.stroke();
        
        // Exhaust
        if (keys['ArrowUp']) {
          ctx!.fillStyle = '#ff6600';
          ctx!.beginPath();
          ctx!.moveTo(-3, 6);
          ctx!.lineTo(0, 11);
          ctx!.lineTo(3, 6);
          ctx!.fill();
        }
        ctx!.restore();
      }
    }

    // Asteroid
    class Asteroid {
      x: number;
      y: number;
      velX: number;
      velY: number;
      velRot: number;
      rot: number;
      size: number;

      constructor(x: number, y: number, size: number = 60) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.velX = (Math.random() - 0.5) * 3;
        this.velY = (Math.random() - 0.5) * 3;
        this.velRot = (Math.random() - 0.5) * 2;
        this.rot = 0;
      }

      update() {
        this.x += this.velX;
        this.y += this.velY;
        this.rot += this.velRot;

        if (this.x > CANVAS_WIDTH) this.x = 0;
        if (this.x < 0) this.x = CANVAS_WIDTH;
        if (this.y > CANVAS_HEIGHT) this.y = 0;
        if (this.y < 0) this.y = CANVAS_HEIGHT;
      }

      draw() {
        ctx!.save();
        ctx!.translate(this.x, this.y);
        ctx!.rotate(this.rot * Math.PI / 180);
        ctx!.strokeStyle = '#ffffff';
        ctx!.lineWidth = 2;
        ctx!.beginPath();
        const points = [[-10,0],[-5,7],[-3,4],[1,10],[5,4],[10,0],[5,-6],[2,-10],[-4,-10],[-4,-5]];
        ctx!.moveTo(points[0][0] * this.size/60, points[0][1] * this.size/60);
        for (let i = 1; i < points.length; i++) {
          ctx!.lineTo(points[i][0] * this.size/60, points[i][1] * this.size/60);
        }
        ctx!.closePath();
        ctx!.stroke();
        ctx!.restore();
      }

      collidesWith(obj: { x: number, y: number }) {
        const dx = this.x - obj.x;
        const dy = this.y - obj.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < this.size;
      }
    }

    // Bullet
    class Bullet {
      x: number;
      y: number;
      velX: number;
      velY: number;
      life: number;

      constructor(x: number, y: number, velX: number, velY: number) {
        this.x = x;
        this.y = y;
        this.velX = velX;
        this.velY = velY;
        this.life = 50;
      }

      update() {
        this.x += this.velX;
        this.y += this.velY;
        this.life--;

        if (this.x > CANVAS_WIDTH) this.x = 0;
        if (this.x < 0) this.x = CANVAS_WIDTH;
        if (this.y > CANVAS_HEIGHT) this.y = 0;
        if (this.y < 0) this.y = CANVAS_HEIGHT;
      }

      draw() {
        ctx!.fillStyle = '#ffffff';
        ctx!.fillRect(this.x - 2, this.y - 2, 4, 4);
      }
    }

    // Initialize game
    const initGame = () => {
      ship = new Ship();
      asteroids = [];
      bullets = [];
      
      // Spawn initial asteroids
      for (let i = 0; i < 5; i++) {
        let x, y;
        do {
          x = Math.random() * CANVAS_WIDTH;
          y = Math.random() * CANVAS_HEIGHT;
        } while (Math.abs(x - ship.x) < 100 && Math.abs(y - ship.y) < 100);
        asteroids.push(new Asteroid(x, y));
      }
    };

    // Main game loop
    const update = () => {
      if (gameState !== 'playing' || !ship) return;

      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Update ship
      ship.update();
      ship.draw();

      // Update bullets
      bullets = bullets.filter(b => b.life > 0);
      bullets.forEach(b => {
        b.update();
        b.draw();
      });

      // Update asteroids
      asteroids.forEach(a => {
        a.update();
        a.draw();

        // Check collision with ship
        if (a.collidesWith(ship)) {
          setLives(prev => {
            const newLives = prev - 1;
            if (newLives <= 0) {
              setGameState('gameover');
            } else {
              ship.x = CANVAS_WIDTH / 2;
              ship.y = CANVAS_HEIGHT / 2;
              ship.velX = 0;
              ship.velY = 0;
            }
            return newLives;
          });
        }

        // Check collision with bullets
        bullets.forEach((b, bIndex) => {
          if (a.collidesWith(b)) {
            bullets.splice(bIndex, 1);
            const index = asteroids.indexOf(a);
            if (index > -1) {
              asteroids.splice(index, 1);
              setScore(prev => prev + Math.floor(120 / (a.size / 20)));
              
              // Break into smaller asteroids
              if (a.size > 20) {
                for (let i = 0; i < 2; i++) {
                  asteroids.push(new Asteroid(a.x, a.y, a.size / 2));
                }
              }
            }
          }
        });
      });

      // Spawn new level if all asteroids destroyed
      if (asteroids.length === 0) {
        for (let i = 0; i < 5; i++) {
          asteroids.push(new Asteroid(
            Math.random() * CANVAS_WIDTH,
            Math.random() * CANVAS_HEIGHT
          ));
        }
      }

      gameLoop = requestAnimationFrame(update);
    };

    // Start button handler
    const startGame = () => {
      initGame();
      setGameState('playing');
      setScore(0);
      setLives(3);
      requestAnimationFrame(update);
    };

    gameRef.current = { startGame };

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (gameLoop) cancelAnimationFrame(gameLoop);
    };
  }, [gameState]);

  useEffect(() => {
    if (gameState === 'playing') {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#000000';
          ctx.fillRect(0, 0, 640, 480);
        }
      }
    }
  }, [gameState]);

  return (
    <div className="asteroids-container">
      <div className="asteroids-header">
        <h1>🚀 ASTEROIDS 🚀</h1>
        <div className="asteroids-stats">
          <span>Score: {score}</span>
          <span>Lives: {'♥'.repeat(lives)}</span>
        </div>
      </div>

      <canvas
        ref={canvasRef}
        width={640}
        height={480}
        className="asteroids-canvas"
      />

      {gameState === 'start' && (
        <div className="asteroids-overlay">
          <h2>ASTEROIDS</h2>
          <p>Arrow Keys to Move</p>
          <p>Space to Shoot</p>
          <p>P to Pause</p>
          <button onClick={() => gameRef.current?.startGame()}>
            START GAME
          </button>
        </div>
      )}

      {gameState === 'paused' && (
        <div className="asteroids-overlay">
          <h2>PAUSED</h2>
          <p>Press P to Resume</p>
        </div>
      )}

      {gameState === 'gameover' && (
        <div className="asteroids-overlay">
          <h2>GAME OVER</h2>
          <p>Final Score: {score}</p>
          <button onClick={() => gameRef.current?.startGame()}>
            PLAY AGAIN
          </button>
        </div>
      )}

      <div className="asteroids-controls">
        <p>⬆️ Thrust  ⬅️➡️ Rotate  SPACE Fire  P Pause</p>
      </div>
    </div>
  );
};

export default AsteroidsGame;
