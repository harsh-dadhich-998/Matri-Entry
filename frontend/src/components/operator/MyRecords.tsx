import React, { useState } from 'react';
import { Search, Eye, ArrowUpRight, CheckCircle2, Clock } from 'lucide-react';
import { User, MatrimonialRecord } from '../../types';
import { getOperatorSlots } from '../../services/storage';

interface MyRecordsProps {
  currentUser: User;
  onSelectSlot: (slot: number) => void;
  onViewRecordModal: (record: MatrimonialRecord) => void;
}

export const MyRecords: React.FC<MyRecordsProps> = ({
  currentUser,
  onSelectSlot,
  onViewRecordModal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<
    'all' | 'Submitted' | 'Draft'
  >('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const slots = getOperatorSlots(currentUser);

  // Filter slots
  const filteredSlots = slots.filter((slot) => {
    const rec = slot.record;
    const matchesSearch =
      searchTerm.trim() === '' ||
      (rec?.profileId &&
        rec.profileId.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (rec?.fullName &&
        rec.fullName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      String(slot.slotNumber).includes(searchTerm.trim());

    const status = rec?.status || 'Draft';
    const matchesStatus = filterStatus === 'all' || status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.max(
    1,
    Math.ceil(filteredSlots.length / itemsPerPage),
  );
  const paginatedSlots = filteredSlots.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const completedCount = slots.filter(
    (s) => s.record?.status === 'Submitted',
  ).length;

  return (
    <div className="space-y-6">
      {/* Title Header matching Figure A3 */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            My Records
          </h2>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            {currentUser.assignedRecords ?? 0} total slots assigned •{' '}
            {completedCount} submitted
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {completedCount} Completed
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-700 text-xs font-bold border border-amber-200">
            <Clock className="w-3.5 h-3.5" />
            {(currentUser.assignedRecords ?? 0) - completedCount} Remaining
          </span>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by profile ID, slot # or name..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-slate-800 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Status filter tabs */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-600">
          <button
            onClick={() => {
              setFilterStatus('all');
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              filterStatus === 'all'
                ? 'bg-white text-indigo-700 font-bold shadow-xs'
                : 'hover:text-slate-900'
            }`}
          >
            All Slots ({slots.length})
          </button>
          <button
            onClick={() => {
              setFilterStatus('Submitted');
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              filterStatus === 'Submitted'
                ? 'bg-white text-emerald-700 font-bold shadow-xs'
                : 'hover:text-slate-900'
            }`}
          >
            Submitted ({completedCount})
          </button>
          <button
            onClick={() => {
              setFilterStatus('Draft');
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              filterStatus === 'Draft'
                ? 'bg-white text-amber-700 font-bold shadow-xs'
                : 'hover:text-slate-900'
            }`}
          >
            Draft ({(currentUser.assignedRecords ?? 0) - completedCount})
          </button>
        </div>
      </div>

      {/* Records Table Matching Figure A3 */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-extrabold text-[11px]">
              <tr>
                <th className="py-3.5 px-4 sm:px-6">SLOT</th>
                <th className="py-3.5 px-4">PROFILE ID</th>
                <th className="py-3.5 px-4">NAME</th>
                <th className="py-3.5 px-4">RELIGION / CASTE</th>
                <th className="py-3.5 px-4">SUBMITTED AT</th>
                <th className="py-3.5 px-4">STATUS</th>
                <th className="py-3.5 px-4 text-center">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedSlots.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    No slot records found matching your query.
                  </td>
                </tr>
              ) : (
                paginatedSlots.map((slot) => {
                  const rec = slot.record;
                  const isSubmitted = rec?.status === 'Submitted';

                  return (
                    <tr
                      key={slot.slotNumber}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      {/* Slot Number */}
                      <td className="py-3.5 px-4 sm:px-6 font-bold text-slate-900 font-mono">
                        #{slot.slotNumber}
                      </td>

                      {/* Profile ID */}
                      <td className="py-3.5 px-4 font-mono font-medium text-slate-800">
                        {rec?.profileId ? (
                          rec.profileId
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>

                      {/* Name */}
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        {rec?.fullName ? (
                          rec.fullName
                        ) : (
                          <span className="text-slate-300 font-normal">—</span>
                        )}
                      </td>

                      {/* Religion / Caste */}
                      <td className="py-3.5 px-4 text-slate-600">
                        {rec?.religion || rec?.caste ? (
                          <span>
                            {rec.religion || ''}{' '}
                            {rec.caste ? `• ${rec.caste}` : ''}
                          </span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>

                      {/* Submitted At */}
                      <td className="py-3.5 px-4 text-slate-500 text-xs">
                        {rec?.submittedAt ? (
                          rec.submittedAt
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {isSubmitted ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Submitted
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100/70 text-amber-800 border border-amber-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            Draft
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {rec && rec.fullName ? (
                            <button
                              onClick={() => onViewRecordModal(rec)}
                              className="p-1.5 text-slate-500 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors cursor-pointer"
                              title="View Full Record Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          ) : null}

                          <button
                            onClick={() => onSelectSlot(slot.slotNumber)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors cursor-pointer"
                            title={
                              isSubmitted ? 'Edit Slot' : 'Continue Slot Entry'
                            }
                          >
                            <span>{isSubmitted ? 'Edit' : 'Enter'}</span>
                            <ArrowUpRight className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              Showing {(currentPage - 1) * itemsPerPage + 1} -{' '}
              {Math.min(currentPage * itemsPerPage, filteredSlots.length)} of{' '}
              {filteredSlots.length} slots
            </span>

            <div className="flex items-center gap-1.5">
              <button
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => p - 1)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 font-semibold cursor-pointer"
              >
                Previous
              </button>
              <span className="px-2 font-mono font-bold text-slate-700">
                {currentPage} / {totalPages}
              </span>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 font-semibold cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
