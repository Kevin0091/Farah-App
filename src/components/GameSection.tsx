import { useRef, useEffect, useState, useCallback } from 'react';
import { motion } from 'motion/react';
import { useGameState } from '../hooks/useGameState';

interface Props {
  gameState: ReturnType<typeof useGameState>;
}

let audioCtx: AudioContext | null = null;
const playSound = (type: 'collect' | 'lose') => {
  try {
    if (!audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtxClass) return;
      audioCtx = new AudioCtxClass();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    if (type === 'collect') {
       osc.type = 'sine';
       osc.frequency.setValueAtTime(1200, audioCtx.currentTime);
       osc.frequency.exponentialRampToValueAtTime(2000, audioCtx.currentTime + 0.1);
       gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
       gain.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
       osc.start(audioCtx.currentTime);
       osc.stop(audioCtx.currentTime + 0.1);
    } else if (type === 'lose') {
       osc.type = 'square';
       osc.frequency.setValueAtTime(300, audioCtx.currentTime);
       osc.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + 0.3);
       gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
       gain.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
       osc.start(audioCtx.currentTime);
       osc.stop(audioCtx.currentTime + 0.3);
    }
  } catch (e) {
    console.error("Audio play failed", e);
  }
};

interface Particle {
  x: number; y: number; text: string;
  life: number; maxLife: number;
  color: string; fontSize: number;
  vx: number; vy: number;
}

// Minimal 2D Game using Canvas
export default function GameSection({ gameState }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);

  // Time formatting for wait time
  const [timeUntilRegen, setTimeUntilRegen] = useState<string | null>(null);

  useEffect(() => {
    if (gameState.state.hearts === 0 && gameState.state.heartRegenTime) {
      const checkTime = () => {
        const now = Date.now();
        const diff = now - gameState.state.heartRegenTime!;
        if (diff >= gameState.REGEN_TIME_MS) {
          setTimeUntilRegen(null);
        } else {
          const remaining = gameState.REGEN_TIME_MS - diff;
          const h = Math.floor(remaining / 3600000);
          const m = Math.floor((remaining % 3600000) / 60000);
          const s = Math.floor((remaining % 60000) / 1000);
          setTimeUntilRegen(`${h}h ${m}m ${s}s`);
        }
      };
      checkTime();
      const interval = setInterval(checkTime, 1000);
      return () => clearInterval(interval);
    } else {
      setTimeUntilRegen(null);
    }
  }, [gameState.state.hearts, gameState.state.heartRegenTime, gameState.REGEN_TIME_MS]);

  // --- Game Engine ---
  const requestRef = useRef<number>();
  
  // Game state refs (to avoid stale closures in requestAnimationFrame)
  const stateRef = useRef({
    catX: 150,
    items: [] as { type: 'tuna' | 'rock', x: number, y: number, id: number }[],
    particles: [] as Particle[],
    speedMod: 1,
    frameCount: 0,
    itemId: 0,
    width: 300,
    height: 400,
    currentScore: 0,
  });

  const startGame = () => {
    if (gameState.state.hearts <= 0) return;
    setIsPlaying(true);
    setGameOver(false);
    setScore(0);
    
    const container = containerRef.current;
    if (container && canvasRef.current) {
       const rect = container.getBoundingClientRect();
       canvasRef.current.width = rect.width;
       canvasRef.current.height = rect.height;
       stateRef.current.width = rect.width;
       stateRef.current.height = rect.height;
       stateRef.current.catX = rect.width / 2;
    }

    stateRef.current.items = [];
    stateRef.current.particles = [];
    stateRef.current.speedMod = 1;
    stateRef.current.frameCount = 0;
    stateRef.current.currentScore = 0;
    
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
    requestRef.current = requestAnimationFrame(gameLoop);
  };

  const stopGame = useCallback((hitRock: boolean, finalScore: number) => {
    setIsPlaying(false);
    setGameOver(true);
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
    
    if (hitRock) {
      gameState.loseHeart();
    }
    // Add collected tuna to balance
    if (finalScore > 0) {
      gameState.addTuna(finalScore);
    }
  }, [gameState]);

  const gameLoop = useCallback(() => {
     if (!canvasRef.current) return;
     const ctx = canvasRef.current.getContext('2d');
     if (!ctx) return;

     const s = stateRef.current;
     s.frameCount++;

     // Difficulty increase
     if (s.frameCount % 300 === 0) { // Every ~5 seconds
         s.speedMod += 0.2;
     }

     // Spawn items
     const spawnRate = Math.max(20, 60 - Math.floor(s.speedMod * 5)); // Spawns faster over time
     if (s.frameCount % spawnRate === 0) {
        const isRock = Math.random() > 0.6; // 40% chance for rock
        s.items.push({
           type: isRock ? 'rock' : 'tuna',
           x: Math.random() * (s.width - 40) + 20,
           y: -40,
           id: s.itemId++
        });
     }

     // Clear canvas
     ctx.clearRect(0, 0, s.width, s.height);

     // Draw Cat (emoji)
     const catY = s.height - 60;
     ctx.font = '40px Arial';
     ctx.textAlign = 'center';
     ctx.textBaseline = 'middle';
     ctx.fillText('🐱', s.catX, catY);

     // Update and Draw items
     let hitRock = false;
     let caughtTuna = 0;

     for (let i = s.items.length - 1; i >= 0; i--) {
        const item = s.items[i];
        item.y += 3 * s.speedMod;

        ctx.font = '30px Arial';
        ctx.fillText(item.type === 'rock' ? '🪨' : '🐟', item.x, item.y);

        // Collision detection (distance based)
        const dx = s.catX - item.x;
        const dy = catY - item.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 35) { // Hit!
           if (item.type === 'rock') {
             hitRock = true;
           } else {
             caughtTuna++;
             playSound('collect');
             s.particles.push({
               x: item.x, y: item.y, text: '+1 🐟',
               life: 30, maxLife: 30, color: '#ec4899', // pink-500
               fontSize: 20, vx: (Math.random() - 0.5) * 2, vy: -2
             });
           }
           s.items.splice(i, 1);
        } else if (item.y > s.height + 40) { // Off screen
           s.items.splice(i, 1);
        }
     }

     for (let i = s.particles.length - 1; i >= 0; i--) {
        const p = s.particles[i];
        p.life--;
        p.x += p.vx;
        p.y += p.vy;
        
        ctx.save();
        ctx.globalAlpha = p.life / p.maxLife;
        ctx.font = `bold ${p.fontSize}px Arial, sans-serif`;
        ctx.fillStyle = p.color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(p.text, p.x, p.y);
        ctx.restore();

        if (p.life <= 0) {
           s.particles.splice(i, 1);
        }
     }

     if (caughtTuna > 0) {
        const prevScore = s.currentScore;
        s.currentScore += caughtTuna;
        setScore(s.currentScore);
        
        if (Math.floor(prevScore / 10) < Math.floor(s.currentScore / 10)) {
           s.particles.push({
               x: s.width / 2, y: s.height / 3, text: '🎉 Awesome!',
               life: 60, maxLife: 60, color: '#eab308', // yellow-500
               fontSize: 40, vx: 0, vy: -1
           });
        }
     }

     if (hitRock) {
        playSound('lose');
        stopGame(true, s.currentScore);
        return;
     }

     requestRef.current = requestAnimationFrame(gameLoop);
  }, [stopGame]);

  // Touch / Mouse controls
  const handleMove = (clientX: number) => {
     if (!isPlaying || !containerRef.current) return;
     const rect = containerRef.current.getBoundingClientRect();
     let x = clientX - rect.left;
     // Clamp
     x = Math.max(30, Math.min(x, rect.width - 30));
     stateRef.current.catX = x;
  };

  return (
    <div className="px-4 py-6 flex-1 min-h-[400px] flex flex-col">
      <div className="text-center mb-6">
        <h2 className="font-script text-4xl text-pink-500 mb-1">Cat & Tuna</h2>
        <p className="text-sm text-pink-400">Collect 🐟, Avoid 🪨</p>
      </div>

      <div 
        ref={containerRef}
        className="flex-1 bg-white/50 backdrop-blur-sm rounded-3xl border-2 border-pink-100 shadow-inner relative overflow-hidden touch-none"
        onMouseMove={(e) => handleMove(e.clientX)}
        onTouchMove={(e) => handleMove(e.touches[0].clientX)}
      >
        <canvas
          ref={canvasRef}
          className="absolute inset-0 block"
        />

        {/* HUD / Overlays */}
        {isPlaying && (
           <div className="absolute top-4 right-4 bg-white/80 px-3 py-1 rounded-full text-pink-500 font-bold shadow-sm">
              Score: {score}
           </div>
        )}

        {!isPlaying && (
           <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/40 backdrop-blur-[2px]">
             
             {gameOver && (
                <div className="mb-6 text-center animate-bounce">
                  <div className="text-5xl mb-2">🙀</div>
                  <h3 className="text-2xl font-bold text-gray-700">Ouch!</h3>
                  <p className="text-pink-500 font-medium">+ {score} Tuna collected!</p>
                </div>
             )}

             {gameState.state.hearts > 0 ? (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={startGame}
                  className="bg-pink-400 text-white px-8 py-4 rounded-full font-bold text-lg shadow-lg shadow-pink-200 hover:bg-pink-500 transition-colors"
                >
                  {gameOver ? 'Play Again' : 'Start Game'}
                </motion.button>
             ) : (
                <div className="text-center bg-white p-6 rounded-3xl shadow-xl max-w-[80%] border border-pink-100">
                  <div className="text-4xl mb-3">😿</div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">Out of Hearts</h3>
                  <p className="text-sm text-gray-500 mb-4">You need to rest for a while.</p>
                  <div className="bg-pink-50 py-2 px-4 rounded-full text-pink-600 font-mono font-medium">
                    {timeUntilRegen}
                  </div>
                </div>
             )}
           </div>
        )}
      </div>
    </div>
  );
}
