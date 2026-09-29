import React from 'react';
import {
  Users,
  UserCheck,
  UserX,
  Layers,
  Activity,
  Award,
  UserPlus,
} from 'lucide-react';
import { User, MatrimonialRecord, ActivityLog } from '../../types';

interface AdminDashboardProps {
  users: User[];
  records: MatrimonialRecord[];
  logs: ActivityLog[];
  onNavigate: (tab: string) => void;
  onOpenCreateUser: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  users,
  records,
  logs,
  onNavigate,
  onOpenCreateUser,
}) => {
  const operators = users.filter((u) => u.role === 'operator');
  const totalUsers = operators.length;
  const activeUsers = operators.filter((u) => u.status === 'active').length;
  const expiredUsers = operators.filter((u) => u.status === 'expired').length;
  const totalSlots = operators.reduce(
    (acc, u) => acc + (u.assignedRecords || 0),
    0,
  );
  const totalSubmitted = records.filter((r) => r.status === 'Submitted').length;

  // Top performers ranked by completed records
  const topPerformers = [...operators]
    .filter((u) => u.completedRecords > 0)
    .sort((a, b) => b.completedRecords - a.completedRecords)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Welcome & Quick Bar */}
      <div className="dashboard-hero bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <p className="eyebrow">Workspace overview</p>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            A clear view of your team.
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage your operators, follow their progress, and keep every profile
            on track.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={onOpenCreateUser}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Create operator</span>
          </button>

          <button
            onClick={() => onNavigate('monitoring')}
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span>Live Monitor</span>
          </button>
        </div>
      </div>

      {/* 4 Dashboard Metric Cards matching BRD Section 4.2 */}
      <div className="dashboard-metrics grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Users */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Users
            </p>
            <p className="text-3xl font-black text-slate-900 mt-2">
              {totalUsers}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Registered operators
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Active Users */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Active Users
            </p>
            <p className="text-3xl font-black text-emerald-600 mt-2">
              {activeUsers}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Accounts with active access
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <UserCheck className="w-6 h-6" />
          </div>
        </div>

        {/* Expired Users */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Expired Users
            </p>
            <p className="text-3xl font-black text-rose-600 mt-2">
              {expiredUsers}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">Account expired</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
            <UserX className="w-6 h-6" />
          </div>
        </div>

        {/* Total Slots */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Slots
            </p>
            <p className="text-3xl font-black text-purple-600 mt-2">
              {totalSlots}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              {totalSubmitted} submitted
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
            <Layers className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Grid: Top Performers & Recent Activity matching BRD Section 4.2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performers */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" />
                <h3 className="font-extrabold text-slate-900 text-base">
                  Top Performers
                </h3>
              </div>
              <button
                onClick={() => onNavigate('users')}
                className="text-xs text-indigo-600 hover:text-indigo-700 font-bold hover:underline cursor-pointer"
              >
                View all users &rarr;
              </button>
            </div>

            {topPerformers.length === 0 ? (
              /* Empty state matching BRD specification */
              <div className="text-center py-12 px-4 border border-dashed border-slate-200 rounded-xl my-2">
                <Award className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-700">
                  No Operator Activity Recorded
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Operator performance statistics will automatically appear as
                  records are submitted.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {topPerformers.map((operator, index) => {
                  const rate = Math.round(
                    (operator.completedRecords /
                      (operator.assignedRecords || 1)) *
                      100,
                  );
                  return (
                    <div
                      key={operator.id}
                      className="p-3.5 rounded-xl border border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/30 transition-colors flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
                            index === 0
                              ? 'bg-amber-100 text-amber-800'
                              : index === 1
                                ? 'bg-slate-200 text-slate-700'
                                : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          #{index + 1}
                        </span>
                        <div>
                          <p className="font-bold text-slate-900 text-xs sm:text-sm">
                            {operator.name}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            @{operator.username} • {operator.mobile}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-sm font-extrabold text-emerald-600 font-mono">
                          {operator.completedRecords} /{' '}
                          {operator.assignedRecords}
                        </span>
                        <div className="w-24 bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1 ml-auto">
                          <div
                            className="bg-emerald-500 h-full rounded-full"
                            style={{ width: `${Math.min(100, rate)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Ranked by submitted records</span>
            <span className="font-semibold text-slate-600">
              {operators.length} total operators
            </span>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-indigo-600" />
                <h3 className="font-extrabold text-slate-900 text-base">
                  Recent System Activity
                </h3>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                Audit Stream
              </span>
            </div>

            {logs.length === 0 ? (
              /* Empty state matching BRD specification */
              <div className="text-center py-12 px-4 border border-dashed border-slate-200 rounded-xl my-2">
                <Activity className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-700">
                  No Recent Activity Available
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Account updates and record changes will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {logs.slice(0, 5).map((log) => (
                  <div
                    key={log.id}
                    className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 flex items-start justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">
                          {log.action}
                        </span>
                        <span className="font-mono text-[10px] text-slate-400">
                          @{log.username}
                        </span>
                      </div>
                      <p className="text-slate-600 mt-0.5">{log.description}</p>
                    </div>
                    <span className="text-[10px] text-slate-400 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Workspace activity log</span>
            <button
              onClick={() => onNavigate('records')}
              className="text-indigo-600 hover:text-indigo-700 font-bold hover:underline cursor-pointer"
            >
              Go to Records &rarr;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
