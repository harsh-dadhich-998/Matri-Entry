import React, { useState, useEffect } from 'react';
import { RefreshCw, Clock, CheckCircle2 } from 'lucide-react';
import { User, MatrimonialRecord } from '../../types';
import { calculateTimeRemaining } from '../common/CountdownTimer';

interface LiveMonitoringProps {
  users: User[];
  records: MatrimonialRecord[];
  onRefreshNow: () => Promise<void>;
}

export const LiveMonitoring: React.FC<LiveMonitoringProps> = ({
  users,
  records,
  onRefreshNow,
}) => {
  const [refreshCountdown, setRefreshCountdown] = useState(10);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<string>(
    new Date().toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }),
  );
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshRef = React.useRef(onRefreshNow);
  refreshRef.current = onRefreshNow;
  const refreshing = React.useRef(false);
  const triggerRefresh = async () => {
    if (refreshing.current) return;
    refreshing.current = true;
    setIsRefreshing(true);
    try {
      await refreshRef.current();
      setLastRefreshedAt(new Date().toLocaleTimeString());
    } catch {
      /* The parent displays the refresh error. */
    } finally {
      refreshing.current = false;
      setIsRefreshing(false);
      setRefreshCountdown(10);
    }
  };
  useEffect(() => {
    const timer = window.setInterval(
      () => setRefreshCountdown((n) => Math.max(0, n - 1)),
      1000,
    );
    return () => window.clearInterval(timer);
  }, []);
  useEffect(() => {
    if (refreshCountdown === 0) void triggerRefresh();
  }, [refreshCountdown]);
  const handleManualRefresh = () => {
    void triggerRefresh();
  };

  const operators = users.filter((u) => u.role === 'operator');
  const activeCount = operators.filter((u) => u.status === 'active').length;
  const expiredCount = operators.filter((u) => u.status === 'expired').length;
  const inactiveCount = operators.filter((u) => u.status === 'inactive').length;
  const totalEntriesSubmitted = records.filter(
    (r) => r.status === 'Submitted',
  ).length;

  return (
    <div className="space-y-6">
      {/* Top Banner with Auto-refresh status & Refresh Now control */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Live Operator Monitoring
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Operator assignments and progress, refreshed every ten seconds.
          </p>
        </div>

        {/* Auto Refresh & Button matching BRD Section 6 */}
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <span className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider">
              Auto-refresh in
            </span>
            <span className="font-mono text-sm font-extrabold text-indigo-600">
              {refreshCountdown}s
            </span>
          </div>

          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 flex items-center gap-2 transition-all cursor-pointer"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`}
            />
            <span>Refresh Now</span>
          </button>
        </div>
      </div>

      {/* Monitoring Metric Cards matching BRD Section 6 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Active Operators */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase">
            <span>Active</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-emerald-600 mt-2">
            {activeCount}
          </p>
          <span className="text-[11px] text-slate-400">Active accounts</span>
        </div>

        {/* Expired Operators */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase">
            <span>Expired</span>
            <span className="w-2 h-2 rounded-full bg-rose-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-rose-600 mt-2">
            {expiredCount}
          </p>
          <span className="text-[11px] text-slate-400">Past validity date</span>
        </div>

        {/* Inactive Operators */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase">
            <span>Inactive</span>
            <span className="w-2 h-2 rounded-full bg-slate-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-700 mt-2">
            {inactiveCount}
          </p>
          <span className="text-[11px] text-slate-400">Suspended / Paused</span>
        </div>

        {/* Total Entries Submitted */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase">
            <span>Total Submitted</span>
            <CheckCircle2 className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-purple-600 mt-2">
            {totalEntriesSubmitted}
          </p>
          <span className="text-[11px] text-slate-400">
            Matrimonial profiles
          </span>
        </div>
      </div>

      {/* Operator Cards Section matching BRD Section 6 */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-extrabold text-slate-900 text-base">
            Operator Status & Quotas
          </h3>
          <span className="text-xs text-slate-400 font-mono">
            Last updated: {lastRefreshedAt}
          </span>
        </div>

        {operators.length === 0 && (
          <div className="p-10 text-center bg-white rounded-2xl border border-slate-200 text-slate-500">
            No operators yet. Invite your team to see their progress here.
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {operators.map((operator) => {
            const assigned = operator.assignedRecords ?? 0;
            const completed = operator.completedRecords || 0;
            const pending = Math.max(0, assigned - completed);
            const percentage =
              assigned > 0 ? Math.round((completed / assigned) * 100) : 0;

            const timeRemaining = calculateTimeRemaining(operator.expiryDate);

            return (
              <div
                key={operator.id}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 flex flex-col justify-between hover:shadow-md transition-shadow"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center font-black text-indigo-700 text-sm">
                        {operator.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm leading-tight">
                          {operator.name}
                        </h4>
                        <span className="text-xs text-slate-400 font-mono">
                          @{operator.username}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        operator.status === 'active'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : operator.status === 'expired'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}
                    >
                      {operator.status}
                    </span>
                  </div>

                  {/* Progress Bar & Percentage */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
                      <span className="text-slate-500">Completion</span>
                      <span className="font-extrabold text-slate-900 font-mono">
                        {percentage}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, percentage)}%` }}
                      />
                    </div>
                  </div>

                  {/* Counts: Completed / Assigned / Pending */}
                  <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-slate-100 text-center">
                    <div className="bg-slate-50 p-2 rounded-xl">
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">
                        Done
                      </span>
                      <span className="font-mono font-extrabold text-emerald-600 text-sm">
                        {completed}
                      </span>
                    </div>

                    <div className="bg-slate-50 p-2 rounded-xl">
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">
                        Assigned
                      </span>
                      <span className="font-mono font-extrabold text-slate-800 text-sm">
                        {assigned}
                      </span>
                    </div>

                    <div className="bg-slate-50 p-2 rounded-xl">
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">
                        Pending
                      </span>
                      <span className="font-mono font-extrabold text-amber-500 text-sm">
                        {pending}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Time Remaining Section matching BRD Section 6 */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-slate-500 font-medium">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-[11px]">Time Left:</span>
                  </div>

                  <span className="font-mono font-bold text-xs text-slate-700">
                    {!operator.expiryDate
                      ? 'No expiry'
                      : timeRemaining.isExpired
                        ? 'Expired'
                        : `${timeRemaining.days}d ${timeRemaining.hours}h ${timeRemaining.minutes}m`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
