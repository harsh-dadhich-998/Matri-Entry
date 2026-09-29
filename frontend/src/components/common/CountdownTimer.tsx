import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface CountdownTimerProps {
  targetDate: string;
  variant?: 'inline' | 'segmented' | 'sidebar';
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
}

export function calculateTimeRemaining(targetDateStr: string): TimeRemaining {
  const target = new Date(targetDateStr).getTime();
  const now = Date.now();
  const diff = target - now;

  if (diff <= 0 || isNaN(diff)) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  return { days, hours, minutes, seconds, isExpired: false };
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({
  targetDate,
  variant = 'segmented',
}) => {
  const [timeLeft, setTimeLeft] = useState<TimeRemaining>(() =>
    calculateTimeRemaining(targetDate),
  );

  useEffect(() => {
    setTimeLeft(calculateTimeRemaining(targetDate));
    const interval = setInterval(() => {
      setTimeLeft(calculateTimeRemaining(targetDate));
    }, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  if (!targetDate)
    return (
      <span className="text-sm font-medium text-indigo-600">No expiry set</span>
    );

  if (variant === 'sidebar') {
    return (
      <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-3 text-xs">
        <div className="flex items-center gap-1.5 text-slate-400 font-medium mb-1">
          <Clock className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-300">
            Time Remaining
          </span>
        </div>
        <div className="font-mono text-emerald-400 font-bold text-sm tracking-wide">
          {timeLeft.isExpired
            ? '0d 00h 00m 00s (Expired)'
            : `${timeLeft.days}d ${String(timeLeft.hours).padStart(2, '0')}h ${String(timeLeft.minutes).padStart(2, '0')}m ${String(timeLeft.seconds).padStart(2, '0')}s`}
        </div>
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <span className="font-mono text-emerald-600 font-semibold">
        {timeLeft.isExpired
          ? 'Expired'
          : `${timeLeft.days}d ${timeLeft.hours}h ${timeLeft.minutes}m ${timeLeft.seconds}s`}
      </span>
    );
  }

  // Segmented card variant matching Figure A1 & A4
  return (
    <div className="w-full">
      <div className="flex items-center gap-2 mb-3">
        <Clock className="w-4 h-4 text-emerald-500" />
        <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
          Time Remaining
        </span>
      </div>
      <div className="grid grid-cols-4 gap-2 text-center">
        <div className="bg-emerald-50/70 border border-emerald-100 rounded-xl p-2.5">
          <span className="block font-mono text-xl sm:text-2xl font-extrabold text-emerald-600">
            {timeLeft.days}
          </span>
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
            Days
          </span>
        </div>
        <div className="bg-emerald-50/70 border border-emerald-100 rounded-xl p-2.5">
          <span className="block font-mono text-xl sm:text-2xl font-extrabold text-emerald-600">
            {String(timeLeft.hours).padStart(2, '0')}
          </span>
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
            Hours
          </span>
        </div>
        <div className="bg-emerald-50/70 border border-emerald-100 rounded-xl p-2.5">
          <span className="block font-mono text-xl sm:text-2xl font-extrabold text-emerald-600">
            {String(timeLeft.minutes).padStart(2, '0')}
          </span>
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
            Mins
          </span>
        </div>
        <div className="bg-emerald-50/70 border border-emerald-100 rounded-xl p-2.5">
          <span className="block font-mono text-xl sm:text-2xl font-extrabold text-emerald-600">
            {String(timeLeft.seconds).padStart(2, '0')}
          </span>
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
            Secs
          </span>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-center">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100/80 text-emerald-800">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
          Account is active
        </span>
      </div>
    </div>
  );
};
