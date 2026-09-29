import React from 'react';
import {
  Phone,
  Mail,
  Shield,
  Calendar,
  BookOpen,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { User as UserType, MatrimonialRecord } from '../../types';
import { CountdownTimer } from '../common/CountdownTimer';

interface MyProfileProps {
  currentUser: UserType;
  records: MatrimonialRecord[];
}

export const MyProfile: React.FC<MyProfileProps> = ({
  currentUser,
  records,
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
    assignedCount > 0 ? Math.round((completedCount / assignedCount) * 100) : 0;

  const initial = currentUser.name
    ? currentUser.name.charAt(0).toUpperCase()
    : 'U';

  const expiryFormatted = !currentUser.expiryDate
    ? 'No expiry'
    : new Date(currentUser.expiryDate).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
          My Profile
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          View your account information and statistics
        </p>
      </div>

      {/* Main Profile Grid matching Figure A4 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Profile Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="space-y-6">
            {/* Avatar & Basic Identity */}
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full bg-indigo-50 border-2 border-indigo-200 text-indigo-700 flex items-center justify-center font-extrabold text-3xl shadow-sm">
                {initial}
              </div>
              <h3 className="font-extrabold text-slate-900 text-lg mt-3">
                {currentUser.name}
              </h3>
              <p className="text-xs text-slate-400 font-medium">
                @{currentUser.username}
              </p>

              <div className="mt-2.5">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Active Account
                </span>
              </div>
            </div>

            {/* Contact Details */}
            <div className="space-y-3 pt-4 border-t border-slate-100 text-xs">
              <div className="flex items-center gap-3 text-slate-700 p-2.5 rounded-xl bg-slate-50/70">
                <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold uppercase">
                    Mobile
                  </span>
                  <span className="font-semibold text-slate-800">
                    {currentUser.mobile || 'Not provided'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 text-slate-700 p-2.5 rounded-xl bg-slate-50/70">
                <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                <div className="truncate">
                  <span className="text-[10px] text-slate-400 block font-semibold uppercase">
                    Email
                  </span>
                  <span className="font-semibold text-slate-800 truncate block">
                    {currentUser.email || 'Not provided'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 text-slate-700 p-2.5 rounded-xl bg-slate-50/70">
                <Shield className="w-4 h-4 text-slate-400 shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold uppercase">
                    Role
                  </span>
                  <span className="font-semibold text-indigo-700">
                    Data Operator
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Account Timeline */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-3">
              Account Timeline
            </span>
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  Account created:
                </span>
                <span className="font-bold text-slate-800">
                  {new Date(currentUser.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  Account Expires:
                </span>
                <span className="font-bold text-slate-800">
                  {expiryFormatted}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Statistics & Countdown matching Figure A4 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 3 Summary Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs text-center">
              <div className="w-10 h-10 mx-auto rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-2">
                <BookOpen className="w-5 h-5" />
              </div>
              <span className="text-2xl font-black text-slate-900 block">
                {assignedCount}
              </span>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Assigned
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs text-center">
              <div className="w-10 h-10 mx-auto rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <span className="text-2xl font-black text-emerald-600 block">
                {completedCount}
              </span>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Completed
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs text-center">
              <div className="w-10 h-10 mx-auto rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center mb-2">
                <Clock className="w-5 h-5" />
              </div>
              <span className="text-2xl font-black text-amber-500 block">
                {pendingCount}
              </span>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Pending
              </span>
            </div>
          </div>

          {/* Completion Progress Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-bold text-slate-900 text-sm">
                Completion Progress
              </h4>
              <span className="text-xs font-semibold text-slate-500">
                {completedCount} of {assignedCount}
              </span>
            </div>

            <div className="text-3xl font-black text-slate-900 tracking-tight my-2">
              {completionPercentage}%
            </div>

            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden mt-2">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500 ease-out"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>

          {/* Account Validity Countdown Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-bold text-slate-900 text-sm">
                Account Validity Countdown
              </h4>
              <span className="text-xs font-mono font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                {currentUser.expiryDate ? 'Time remaining' : 'No expiry'}
              </span>
            </div>

            <CountdownTimer
              targetDate={currentUser.expiryDate}
              variant="segmented"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
