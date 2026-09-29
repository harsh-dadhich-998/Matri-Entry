import React from 'react';
import { ArrowRight, CheckCircle2, Clock, BookOpen } from 'lucide-react';
import { User, MatrimonialRecord } from '../../types';
import { CountdownTimer } from '../common/CountdownTimer';

interface OperatorDashboardProps {
  currentUser: User;
  records: MatrimonialRecord[];
  onNavigateToDataEntry: (slotNumber?: number) => void;
  onNavigateToRecords: () => void;
}

export const OperatorDashboard: React.FC<OperatorDashboardProps> = ({
  currentUser,
  records,
  onNavigateToDataEntry,
  onNavigateToRecords,
}) => {
  const operatorRecords = records.filter(
    (r) => r.operatorId === currentUser.id,
  );
  const completedCount = operatorRecords.filter(
    (r) => r.status === 'Submitted',
  ).length;
  const assignedCount = currentUser.assignedRecords ?? 0;
  const pendingCount = Math.max(0, assignedCount - completedCount);
  const completionPercentage =
    assignedCount > 0
      ? Math.min(100, Math.round((completedCount / assignedCount) * 100))
      : 0;

  // Find next unfinished slot number
  const nextUnfinishedSlot = (() => {
    for (let i = 1; i <= assignedCount; i++) {
      const rec = operatorRecords.find((r) => r.slotNumber === i);
      if (!rec || rec.status !== 'Submitted') {
        return i;
      }
    }
    return 1;
  })();

  return (
    <div className="space-y-6">
      {/* Top Banner matching Figure A1 */}
      <div className="dashboard-hero flex flex-col xl:flex-row xl:items-center justify-between gap-6 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <p className="eyebrow">Your workspace</p>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Welcome back, {currentUser.name.split(' ')[0]}. 👋
            </h2>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Every profile brings people closer. Pick up where you left off.
          </p>
        </div>

        <button
          onClick={() =>
            pendingCount > 0
              ? onNavigateToDataEntry(nextUnfinishedSlot)
              : onNavigateToRecords()
          }
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-600/25 transition-all cursor-pointer group"
        >
          <span>
            {pendingCount > 0 ? 'Continue data entry' : 'View my records'}
          </span>
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </button>
      </div>

      {/* 3 Metric Cards matching Figure A1 */}
      <div className="dashboard-metrics grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Assigned Records */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Assigned Records
            </p>
            <p className="text-3xl font-extrabold text-slate-900 mt-2">
              {assignedCount}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Total records to complete
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <BookOpen className="w-6 h-6" />
          </div>
        </div>

        {/* Completed */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Completed
            </p>
            <p className="text-3xl font-extrabold text-emerald-600 mt-2">
              {completedCount}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Successfully submitted
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        {/* Pending */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Pending
            </p>
            <p className="text-3xl font-extrabold text-amber-500 mt-2">
              {pendingCount}
            </p>
            <p className="text-xs text-slate-400 mt-1">Still remaining</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-500">
            <Clock className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 2 Bottom Cards: Completion Progress & Account Validity (Figure A1) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Completion Progress Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 text-base">
                Completion Progress
              </h3>
              <span className="text-xs font-semibold text-slate-500">
                {completedCount} / {assignedCount} records
              </span>
            </div>

            <div className="my-3">
              <span className="text-4xl font-extrabold text-slate-900 tracking-tight">
                {completionPercentage}%
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden mt-3">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${Math.min(100, Math.max(0, completionPercentage))}%`,
                }}
              />
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex flex-wrap gap-3 items-center justify-between text-xs text-slate-500">
            <span>
              {pendingCount} records remaining to complete your assignment
            </span>
            <button
              onClick={onNavigateToRecords}
              className="text-indigo-600 hover:text-indigo-700 font-bold hover:underline cursor-pointer"
            >
              View My Records &rarr;
            </button>
          </div>
        </div>

        {/* Account Validity Card matching Figure A1 */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 text-base">
                Account Validity
              </h3>
              <span className="text-xs font-semibold text-slate-400">
                Account access
              </span>
            </div>

            <CountdownTimer
              targetDate={currentUser.expiryDate}
              variant="segmented"
            />
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex flex-wrap gap-3 items-center justify-between text-xs text-slate-500">
            <span>
              Expires on:{' '}
              {currentUser.expiryDate
                ? new Date(currentUser.expiryDate).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })
                : 'No expiry'}
            </span>
            <span className="font-semibold text-slate-700">
              {new Date(currentUser.expiryDate).getTime() <= Date.now()
                ? 'Expired'
                : currentUser.status === 'active'
                  ? 'Active'
                  : currentUser.status}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
