import React, { useState, useEffect } from 'react';
import { X, Save, Trash2, Edit3, Heart } from 'lucide-react';
import { errorMessage } from '../../services/api';
import { useToast } from './Toast';
import { MatrimonialRecord, Role } from '../../types';

interface RecordDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: MatrimonialRecord | null;
  userRole: Role;
  onSave?: (updatedRecord: MatrimonialRecord) => Promise<void>;
  onDelete?: (recordId: string) => Promise<void>;
}

export const RecordDetailModal: React.FC<RecordDetailModalProps> = ({
  isOpen,
  onClose,
  record,
  userRole,
  onSave,
  onDelete,
}) => {
  const { showToast } = useToast();
  const [busy, setBusy] = useState(false);
  const [isEditing, setIsEditing] = useState(userRole === 'admin');
  const [formData, setFormData] = useState<MatrimonialRecord | null>(null);

  useEffect(() => {
    if (record) {
      setFormData({ ...record });
      setIsEditing(userRole === 'admin');
    }
  }, [record, userRole]);

  if (!isOpen || !formData) return null;

  const handleChange = (field: keyof MatrimonialRecord, value: any) => {
    setFormData((prev) => (prev ? { ...prev, [field]: value } : null));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy || !onSave || !formData) return;
    setBusy(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      showToast('error', 'Save failed', errorMessage(error));
    } finally {
      setBusy(false);
    }
  };
  const handleDelete = async () => {
    if (
      busy ||
      !onDelete ||
      !formData ||
      !confirm('Delete this profile? This cannot be undone.')
    )
      return;
    setBusy(true);
    try {
      await onDelete(formData.id);
      onClose();
    } catch (error) {
      showToast('error', 'Delete failed', errorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Heart className="w-5 h-5 fill-indigo-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-slate-900 text-lg">
                  {formData.fullName || 'Matrimonial Profile'}
                </h3>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-bold">
                  {formData.profileId}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${formData.status === 'Submitted' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}
                >
                  {formData.status}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Slot #{formData.slotNumber} • Submitted by{' '}
                {formData.submittedByName} (@{formData.submittedByUsername})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {userRole === 'admin' && (
              <button
                type="button"
                onClick={() => setIsEditing(!isEditing)}
                className={`p-2 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1.5 cursor-pointer ${
                  isEditing
                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Edit3 className="w-4 h-4" />
                <span className="hidden sm:inline">
                  {isEditing ? 'Edit Mode' : 'Read Only'}
                </span>
              </button>
            )}

            <button
              disabled={busy}
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Content matching BRD sections */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-8 text-xs sm:text-sm"
        >
          {/* GENERAL INFORMATION */}
          <div>
            <div className="border-b border-slate-200 pb-2 mb-4">
              <h4 className="text-xs font-black uppercase tracking-wider text-indigo-700 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-600" />
                General Information
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Profile ID
                </label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={formData.profileId || ''}
                  onChange={(e) => handleChange('profileId', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 disabled:bg-slate-50 font-mono text-slate-800"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={formData.fullName || ''}
                  onChange={(e) => handleChange('fullName', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 disabled:bg-slate-50 font-medium text-slate-800"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Posted On
                </label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={formData.postedOn || ''}
                  onChange={(e) => handleChange('postedOn', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 disabled:bg-slate-50 text-slate-800"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Last Updated On
                </label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={formData.lastUpdatedOn || ''}
                  onChange={(e) =>
                    handleChange('lastUpdatedOn', e.target.value)
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 disabled:bg-slate-50 text-slate-800"
                />
              </div>
            </div>
          </div>

          {/* PERSONAL INFORMATION */}
          <div>
            <div className="border-b border-slate-200 pb-2 mb-4">
              <h4 className="text-xs font-black uppercase tracking-wider text-indigo-700 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-600" />
                Personal Information
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Gender
                </label>
                <select
                  disabled={!isEditing}
                  value={formData.gender || ''}
                  onChange={(e) => handleChange('gender', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 disabled:bg-slate-50 bg-white"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Age
                </label>
                <input
                  type="number"
                  disabled={!isEditing}
                  value={formData.age || ''}
                  onChange={(e) => handleChange('age', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 disabled:bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Education
                </label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={formData.education || ''}
                  onChange={(e) => handleChange('education', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 disabled:bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Education Detail
                </label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={formData.educationDetail || ''}
                  onChange={(e) =>
                    handleChange('educationDetail', e.target.value)
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 disabled:bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Occupation
                </label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={formData.occupation || ''}
                  onChange={(e) => handleChange('occupation', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 disabled:bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Marital Status
                </label>
                <select
                  disabled={!isEditing}
                  value={formData.maritalStatus || 'Never Married'}
                  onChange={(e) =>
                    handleChange('maritalStatus', e.target.value)
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 disabled:bg-slate-50 bg-white"
                >
                  <option value="Never Married">Never Married</option>
                  <option value="Divorced">Divorced</option>
                  <option value="Widowed">Widowed</option>
                  <option value="Awaiting Divorce">Awaiting Divorce</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Religion
                </label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={formData.religion || ''}
                  onChange={(e) => handleChange('religion', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 disabled:bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Caste
                </label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={formData.caste || ''}
                  onChange={(e) => handleChange('caste', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 disabled:bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Sub Caste
                </label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={formData.subCaste || ''}
                  onChange={(e) => handleChange('subCaste', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 disabled:bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Gothram
                </label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={formData.gothram || ''}
                  onChange={(e) => handleChange('gothram', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 disabled:bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Mother Tongue
                </label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={formData.motherTongue || ''}
                  onChange={(e) => handleChange('motherTongue', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 disabled:bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Star (Nakshatra)
                </label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={formData.star || ''}
                  onChange={(e) => handleChange('star', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 disabled:bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Raasi / Moon Sign
                </label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={formData.raasiMoonSign || ''}
                  onChange={(e) =>
                    handleChange('raasiMoonSign', e.target.value)
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 disabled:bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Dhosham / Manglik
                </label>
                <select
                  disabled={!isEditing}
                  value={formData.dhoshamManglik || 'No'}
                  onChange={(e) =>
                    handleChange('dhoshamManglik', e.target.value)
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 disabled:bg-slate-50 bg-white"
                >
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                  <option value="Don't Know">Don't Know</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Horoscope Match
                </label>
                <select
                  disabled={!isEditing}
                  value={formData.horoscopeMatch || 'Must'}
                  onChange={(e) =>
                    handleChange('horoscopeMatch', e.target.value)
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 disabled:bg-slate-50 bg-white"
                >
                  <option value="Must">Must</option>
                  <option value="Not Necessary">Not Necessary</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Height / Weight
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    disabled={!isEditing}
                    placeholder="Height"
                    value={formData.height || ''}
                    onChange={(e) => handleChange('height', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 disabled:bg-slate-50"
                  />
                  <input
                    type="text"
                    disabled={!isEditing}
                    placeholder="Weight"
                    value={formData.weight || ''}
                    onChange={(e) => handleChange('weight', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 disabled:bg-slate-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Eating / Smoke / Drink
                </label>
                <div className="grid grid-cols-3 gap-1">
                  <input
                    type="text"
                    disabled={!isEditing}
                    placeholder="Diet"
                    value={formData.eatingHabit || ''}
                    onChange={(e) =>
                      handleChange('eatingHabit', e.target.value)
                    }
                    className="w-full px-2 py-2 rounded-xl border border-slate-200 disabled:bg-slate-50 text-xs"
                  />
                  <input
                    type="text"
                    disabled={!isEditing}
                    placeholder="Smoke"
                    value={formData.smokeHabit || ''}
                    onChange={(e) => handleChange('smokeHabit', e.target.value)}
                    className="w-full px-2 py-2 rounded-xl border border-slate-200 disabled:bg-slate-50 text-xs"
                  />
                  <input
                    type="text"
                    disabled={!isEditing}
                    placeholder="Drink"
                    value={formData.drinkHabit || ''}
                    onChange={(e) => handleChange('drinkHabit', e.target.value)}
                    className="w-full px-2 py-2 rounded-xl border border-slate-200 disabled:bg-slate-50 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Location / Country
                </label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={`${formData.homeState || ''}, ${formData.countryLivingIn || 'India'}`}
                  onChange={(e) => handleChange('homeState', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 disabled:bg-slate-50"
                />
              </div>
            </div>
          </div>

          {/* FAMILY / OTHER INFORMATION */}
          <div>
            <div className="border-b border-slate-200 pb-2 mb-4">
              <h4 className="text-xs font-black uppercase tracking-wider text-indigo-700 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-600" />
                Family / Other Information
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Family Value
                </label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={formData.familyValue || ''}
                  onChange={(e) => handleChange('familyValue', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 disabled:bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Family Status
                </label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={formData.familyStatus || ''}
                  onChange={(e) => handleChange('familyStatus', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 disabled:bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Annual Income
                </label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={formData.annualIncome || ''}
                  onChange={(e) => handleChange('annualIncome', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 disabled:bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Mobile Number
                </label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={formData.mobileNumber || ''}
                  onChange={(e) => handleChange('mobileNumber', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 disabled:bg-slate-50"
                />
              </div>
            </div>
          </div>

          {/* DESCRIPTION SECTIONS */}
          <div>
            <div className="border-b border-slate-200 pb-2 mb-4">
              <h4 className="text-xs font-black uppercase tracking-wider text-indigo-700 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-600" />
                Description Sections
              </h4>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  About Family
                </label>
                <textarea
                  rows={2}
                  disabled={!isEditing}
                  value={formData.aboutFamily || ''}
                  onChange={(e) => handleChange('aboutFamily', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 disabled:bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  More Description
                </label>
                <textarea
                  rows={2}
                  disabled={!isEditing}
                  value={formData.moreDescription || ''}
                  onChange={(e) =>
                    handleChange('moreDescription', e.target.value)
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 disabled:bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Partner Expectations
                </label>
                <textarea
                  rows={2}
                  disabled={!isEditing}
                  value={formData.expectations || ''}
                  onChange={(e) => handleChange('expectations', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 disabled:bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Additional Notes
                </label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={formData.additionalNotes || ''}
                  onChange={(e) =>
                    handleChange('additionalNotes', e.target.value)
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 disabled:bg-slate-50"
                />
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            {userRole === 'admin' ? (
              <button
                type="button"
                disabled={busy}
                onClick={handleDelete}
                className="px-4 py-2 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Delete Record
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer"
              >
                Close
              </button>

              {userRole === 'admin' && isEditing && (
                <button
                  disabled={busy}
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-600/20 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  Save Changes
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
