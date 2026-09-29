import React, { useState } from 'react';
import { Search, Download, Edit, Trash2 } from 'lucide-react';
import { MatrimonialRecord } from '../../types';
import { deleteRecord } from '../../services/storage';
import { errorMessage } from '../../services/api';
import { useToast } from '../common/Toast';

interface AllRecordsProps {
  records: MatrimonialRecord[];
  onRecordsUpdated: () => void;
  onOpenRecordModal: (record: MatrimonialRecord) => void;
}

export const AllRecords: React.FC<AllRecordsProps> = ({
  records,
  onRecordsUpdated,
  onOpenRecordModal,
}) => {
  const { showToast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'Submitted' | 'Draft'
  >('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const filteredRecords = records.filter((r) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      r.profileId?.toLowerCase().includes(term) ||
      r.fullName?.toLowerCase().includes(term) ||
      r.submittedByUsername?.toLowerCase().includes(term) ||
      r.homeState?.toLowerCase().includes(term) ||
      String(r.slotNumber).includes(term);

    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.max(
    1,
    Math.ceil(filteredRecords.length / itemsPerPage),
  );
  const paginated = filteredRecords.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  // CSV Export (BRD 5.1)
  const handleExportCSV = () => {
    if (records.length === 0) {
      showToast('warning', 'No Records', 'There are no records to export.');
      return;
    }

    const headers = [
      'Slot',
      'Profile ID',
      'Name',
      'Age',
      'Gender',
      'City / State',
      'Religion',
      'Caste',
      'Occupation',
      'Income',
      'Submitted By',
      'Date',
      'Status',
    ];

    const cell = (value: unknown) => {
      let text = String(value ?? '');
      if (/^[\s]*[=+@-]/.test(text)) text = "'" + text;
      return '"' + text.replaceAll('"', '""') + '"';
    };
    const rows = filteredRecords.map((r) => [
      r.slotNumber,
      r.profileId,
      r.fullName,
      r.age,
      r.gender,
      r.homeState,
      r.religion,
      r.caste,
      r.occupation,
      r.annualIncome,
      r.submittedByUsername,
      r.submittedAt || r.createdAt,
      r.status,
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map(cell).join(','))
      .join('\r\n');
    const url = URL.createObjectURL(
      new Blob([csv], { type: 'text/csv;charset=utf-8' }),
    );
    const link = document.createElement('a');
    link.href = url;
    link.download = 'matrientry-records.csv';
    link.click();
    URL.revokeObjectURL(url);

    showToast(
      'success',
      'CSV Exported',
      `Exported ${filteredRecords.length} records successfully.`,
    );
  };

  const handleDeleteRecord = async (id: string, profileId: string) => {
    if (!confirm('Delete this matrimonial record? This cannot be undone.'))
      return;
    try {
      await deleteRecord(id);
      onRecordsUpdated();
      showToast('success', 'Record deleted', profileId);
    } catch (error) {
      showToast('error', 'Delete failed', errorMessage(error));
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header matching BRD Section 5 */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Matrimonial Records
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              {records.length} total entries
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Browse, search, edit, and export submitted matrimonial entries.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md shadow-slate-900/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Toolbar: Search and Status Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by profile ID, name, or username..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-slate-800 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-600">
          <button
            onClick={() => {
              setStatusFilter('all');
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-white text-indigo-700 font-bold shadow-xs'
                : 'hover:text-slate-900'
            }`}
          >
            All ({records.length})
          </button>
          <button
            onClick={() => {
              setStatusFilter('Submitted');
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              statusFilter === 'Submitted'
                ? 'bg-white text-emerald-700 font-bold shadow-xs'
                : 'hover:text-slate-900'
            }`}
          >
            Submitted ({records.filter((r) => r.status === 'Submitted').length})
          </button>
          <button
            onClick={() => {
              setStatusFilter('Draft');
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              statusFilter === 'Draft'
                ? 'bg-white text-amber-700 font-bold shadow-xs'
                : 'hover:text-slate-900'
            }`}
          >
            Draft ({records.filter((r) => r.status === 'Draft').length})
          </button>
        </div>
      </div>

      {/* Records Table matching BRD Section 5 */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-extrabold text-[11px]">
              <tr>
                <th className="py-3.5 px-4 sm:px-6">SLOT</th>
                <th className="py-3.5 px-4">PROFILE ID</th>
                <th className="py-3.5 px-4">NAME</th>
                <th className="py-3.5 px-4">AGE</th>
                <th className="py-3.5 px-4">CITY / STATE</th>
                <th className="py-3.5 px-4">SUBMITTED BY</th>
                <th className="py-3.5 px-4">DATE</th>
                <th className="py-3.5 px-4">STATUS</th>
                <th className="py-3.5 px-4 text-center">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-slate-400">
                    No matrimonial records match your search filter.
                  </td>
                </tr>
              ) : (
                paginated.map((record) => (
                  <tr
                    key={record.id}
                    className="hover:bg-slate-50/70 transition-colors"
                  >
                    {/* Slot */}
                    <td className="py-3.5 px-4 sm:px-6 font-bold text-slate-900 font-mono">
                      #{record.slotNumber}
                    </td>

                    {/* Profile ID */}
                    <td className="py-3.5 px-4 font-mono font-medium text-slate-800">
                      {record.profileId}
                    </td>

                    {/* Name */}
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {record.fullName || '—'}
                    </td>

                    {/* Age */}
                    <td className="py-3.5 px-4 text-slate-600 font-mono">
                      {record.age ? `${record.age} yrs` : '—'}
                    </td>

                    {/* City / State */}
                    <td className="py-3.5 px-4 text-slate-600">
                      {record.homeState || '—'}
                    </td>

                    {/* Submitted By */}
                    <td className="py-3.5 px-4 text-slate-700">
                      <span className="font-semibold">
                        {record.submittedByName}
                      </span>{' '}
                      <span className="text-slate-400 font-mono text-[11px]">
                        @{record.submittedByUsername}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="py-3.5 px-4 text-slate-500 text-xs">
                      {record.submittedAt || record.lastUpdatedOn || '—'}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          record.status === 'Submitted'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            record.status === 'Submitted'
                              ? 'bg-emerald-500'
                              : 'bg-amber-500'
                          }`}
                        />
                        {record.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => onOpenRecordModal(record)}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors cursor-pointer"
                          title="View / Edit Record Details"
                        >
                          <Edit className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() =>
                            handleDeleteRecord(record.id, record.profileId)
                          }
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Delete Record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              Showing {(currentPage - 1) * itemsPerPage + 1} -{' '}
              {Math.min(currentPage * itemsPerPage, filteredRecords.length)} of{' '}
              {filteredRecords.length} records
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
