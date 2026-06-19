import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Gift, CalendarDays, Check } from 'lucide-react';
import { useGameState } from '../hooks/useGameState';

interface Props {
  gameState: ReturnType<typeof useGameState>;
}

export default function RewardsSection({ gameState }: Props) {
  const [timeUntilNext, setTimeUntilNext] = useState<string | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    const checkTime = () => {
      const now = Date.now();
      const last = gameState.state.lastRewardTime;
      if (!last) {
        setTimeUntilNext(null);
        return;
      }

      const diff = now - last;
      const waitTime = 24 * 60 * 60 * 1000;
      
      if (diff >= waitTime) {
        setTimeUntilNext(null);
      } else {
        const remaining = waitTime - diff;
        const hours = Math.floor(remaining / (1000 * 60 * 60));
        const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
        setTimeUntilNext(`${hours}h ${minutes}m ${seconds}s`);
      }
    };

    checkTime();
    const interval = setInterval(checkTime, 1000);
    return () => clearInterval(interval);
  }, [gameState.state.lastRewardTime]);

  const canClaim = timeUntilNext === null;

  const handleClaim = () => {
    if (canClaim) {
      gameState.claimDailyReward();
      // If it becomes day 7 after claim (streak was 6)
      if (gameState.state.rewardStreak === 6) {
        setShowCelebration(true);
        setTimeout(() => setShowCelebration(false), 4000);
      }
    }
  };

  return (
    <div className="px-4 py-8 flex-1 flex flex-col items-center">
      <div className="text-center mb-12">
        <h2 className="font-script text-4xl text-pink-500 mb-2">Daily Rewards</h2>
        <p className="text-pink-400">Come back every day for more tuna!</p>
      </div>

      <div className="bg-white border text-center border-pink-100 shadow-xl rounded-3xl p-8 w-full max-w-sm mb-8 relative overflow-hidden">
        
        <div className="absolute top-0 left-0 w-full h-2 bg-pink-100">
          <div 
            className="h-full bg-pink-400 transition-all duration-1000" 
            style={{ width: `${(gameState.state.rewardStreak / 7) * 100}%` }}
          />
        </div>

        <div className="flex justify-center mb-6 mt-4">
          <div className="w-24 h-24 bg-pink-50 rounded-full flex items-center justify-center text-4xl shadow-inner text-pink-500">
             <Gift size={40} className={canClaim ? "animate-bounce" : ""} />
          </div>
        </div>
        
        <h3 className="text-2xl font-semibold mb-2">Daily Bonus</h3>
        <p className="text-gray-500 mb-6 flex items-center justify-center gap-2">
          Reward: <span className="font-bold text-pink-500">10 🐟</span>
        </p>

        <div className="bg-pink-50 rounded-2xl p-4 mb-6 flex items-center justify-between text-sm">
           <div className="flex items-center gap-2 text-pink-600">
             <CalendarDays size={18} />
             <span className="font-medium">Current Streak</span>
           </div>
           <div className="font-bold text-pink-500">
             Day {gameState.state.rewardStreak}/7
           </div>
        </div>

        <motion.button
          whileHover={canClaim ? { scale: 1.05 } : {}}
          whileTap={canClaim ? { scale: 0.95 } : {}}
          onClick={handleClaim}
          disabled={!canClaim}
          className={`w-full py-4 rounded-2xl font-bold text-lg transition-colors flex items-center justify-center gap-2 ${
            canClaim 
              ? "bg-pink-400 text-white shadow-lg shadow-pink-200 hover:bg-pink-500" 
              : "bg-gray-100 text-gray-400 cursor-not-allowed"
          }`}
        >
          {canClaim ? (
            <>Claim Reward!</>
          ) : (
            <>Available in {timeUntilNext}</>
          )}
        </motion.button>
        
        <div className="mt-4 text-xs text-gray-400">
          Day 7 unlocks all remaining messages!
        </div>
      </div>

      <div className="w-full max-w-sm mb-8">
        <h3 className="font-script text-3xl text-pink-500 mb-4 text-center">Achievements</h3>
        <div className="grid grid-cols-1 gap-3">
          <AchievementItem 
            title="Novice Fisher" 
            desc="Collect 100 Tuna"
            progress={Math.min(gameState.state.totalTunaCollected || 0, 100)} 
            goal={100} 
            icon="🐟"
          />
          <AchievementItem 
            title="Expert Catcher" 
            desc="Collect 500 Tuna"
            progress={Math.min(gameState.state.totalTunaCollected || 0, 500)} 
            goal={500} 
            icon="👑"
          />
          <AchievementItem 
            title="Loyal Player" 
            desc="Reach 5 Day Streak"
            progress={Math.min(gameState.state.longestStreak || 0, 5)} 
            goal={5} 
            icon="🔥"
          />
          <AchievementItem 
            title="Romantic Soul" 
            desc="Unlock 10 Messages"
            progress={Math.min(gameState.state.unlockedMessages.filter(m => m).length - 1, 10)} 
            goal={10} 
            icon="💌"
          />
        </div>
      </div>

      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.2 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center pointer-events-none"
          >
            <div className="text-8xl mb-4">🎉</div>
            <h2 className="font-script text-5xl text-pink-500 bg-white/80 backdrop-blur-sm px-6 py-2 rounded-full shadow-lg text-center">
              Day 7 Unlocked! <br/> All messages are yours!
            </h2>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function AchievementItem({ title, desc, progress, goal, icon }: { title: string, desc: string, progress: number, goal: number, icon: string }) {
  const isComplete = progress >= goal;
  return (
    <div className={`bg-white rounded-2xl p-4 shadow-sm border flex items-center gap-4 transition-all ${isComplete ? 'border-pink-300 bg-pink-50' : 'border-pink-100 opacity-80'}`}>
      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl shadow-inner ${isComplete ? 'bg-pink-200' : 'bg-gray-100 grayscale'}`}>
        {icon}
      </div>
      <div className="flex-1">
        <h4 className="font-bold text-gray-800">{title}</h4>
        <p className="text-xs text-gray-500 mb-1">{desc}</p>
        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all ${isComplete ? 'bg-pink-500' : 'bg-pink-300'}`}
            style={{ width: `${(progress / goal) * 100}%` }}
          />
        </div>
      </div>
      <div className="text-xs font-bold text-pink-400 w-10 text-right">
        {progress}/{goal}
      </div>
    </div>
  );
}
