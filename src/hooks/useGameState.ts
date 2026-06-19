import { useState, useEffect } from 'react';

export interface GameState {
  tunaBalance: number;
  hearts: number;
  heartRegenTime: number | null; // Timestamp when hearts reached 0
  unlockedMessages: boolean[];
  lastRewardTime: number | null;
  rewardStreak: number;
  totalTunaCollected: number;
  longestStreak: number;
}

const INITIAL_MSG = [true, ...Array(19).fill(false)];
const REGEN_TIME_MS = 2 * 60 * 60 * 1000;

export const INITIAL_STATE: GameState = {
  tunaBalance: 0,
  hearts: 3,
  heartRegenTime: null,
  unlockedMessages: INITIAL_MSG,
  lastRewardTime: null,
  rewardStreak: 0,
  totalTunaCollected: 0,
  longestStreak: 0,
};

export function useGameState() {
  const [state, setState] = useState<GameState>(() => {
    try {
      const saved = localStorage.getItem('romantic_game_state');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Merge with initial state to ensure all fields exist
        return {
          ...INITIAL_STATE,
          ...parsed,
          unlockedMessages: parsed.unlockedMessages?.length === 20 ? parsed.unlockedMessages : INITIAL_MSG,
        };
      }
    } catch (e) {
      console.error("Failed to load state", e);
    }
    return INITIAL_STATE;
  });

  useEffect(() => {
    localStorage.setItem('romantic_game_state', JSON.stringify(state));
  }, [state]);

  // Check heart regeneration
  useEffect(() => {
    if (state.hearts === 0 && state.heartRegenTime) {
      const checkRegen = () => {
        const now = Date.now();
        if (now - state.heartRegenTime! >= REGEN_TIME_MS) {
          setState(prev => ({
            ...prev,
            hearts: 3,
            heartRegenTime: null
          }));
        }
      };
      
      checkRegen(); // Check immediately
      const interval = setInterval(checkRegen, 1000); // Check every second
      return () => clearInterval(interval);
    }
  }, [state.hearts, state.heartRegenTime]);

  const addTuna = (amount: number) => {
    setState(prev => ({ 
      ...prev, 
      tunaBalance: prev.tunaBalance + amount,
      totalTunaCollected: (prev.totalTunaCollected || 0) + amount
    }));
  };

  const spendTuna = (amount: number) => {
    setState(prev => {
      if (prev.tunaBalance >= amount) {
        return { ...prev, tunaBalance: prev.tunaBalance - amount };
      }
      return prev;
    });
  };

  const loseHeart = () => {
    setState(prev => {
      if (prev.hearts <= 0) return prev;
      const newHearts = prev.hearts - 1;
      return {
        ...prev,
        hearts: newHearts,
        heartRegenTime: newHearts === 0 ? Date.now() : prev.heartRegenTime
      };
    });
  };

  const unlockMessage = (index: number, cost: number) => {
    setState(prev => {
      if (prev.tunaBalance >= cost && !prev.unlockedMessages[index]) {
        const newMsgs = [...prev.unlockedMessages];
        newMsgs[index] = true;
        return {
          ...prev,
          tunaBalance: prev.tunaBalance - cost,
          unlockedMessages: newMsgs
        };
      }
      return prev;
    });
  };

  const claimDailyReward = () => {
    setState(prev => {
      const now = Date.now();
      const last = prev.lastRewardTime || 0;
      const diff = now - last;
      const waitTime = 24 * 60 * 60 * 1000;
      
      let nextStreak = 1;
      if (last === 0 || diff < waitTime * 2) {
         nextStreak = prev.rewardStreak + 1;
      }

      let newMsgs = prev.unlockedMessages;
      if (nextStreak === 7) {
        newMsgs = Array(20).fill(true);
      }

      const nextLoopStreak = nextStreak > 7 ? 1 : nextStreak;
      const newLongest = Math.max(prev.longestStreak || 0, nextLoopStreak);

      return {
        ...prev,
        tunaBalance: prev.tunaBalance + 10,
        totalTunaCollected: (prev.totalTunaCollected || 0) + 10,
        lastRewardTime: now,
        rewardStreak: nextLoopStreak,
        longestStreak: newLongest,
        unlockedMessages: newMsgs
      };
    });
  };

  return {
    state,
    addTuna,
    spendTuna,
    loseHeart,
    unlockMessage,
    claimDailyReward,
    REGEN_TIME_MS
  };
}
