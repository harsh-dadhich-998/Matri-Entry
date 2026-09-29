import React, { useState, useEffect } from 'react';
import {
  Check,
  Save,
  ArrowLeft,
  ArrowRight,
  ShieldAlert,
  Command,
  Lock,
  Unlock,
} from 'lucide-react';
import { User, MatrimonialRecord } from '../../types';
import { saveOperatorRecord, getStoredRecords } from '../../services/storage';
import { errorMessage } from '../../services/api';
import { useToast } from '../common/Toast';

interface DataEntryFormProps {
  currentUser: User;
  slotNumber: number;
  onSlotChange: (slot: number) => void;
  onRecordSaved: () => void | Promise<void>;
}

type FieldErrors = Partial<Record<keyof MatrimonialRecord, string>>;

function validateEntry(data: Partial<MatrimonialRecord>, submitting: boolean) {
  const errors: FieldErrors = {};
  if (submitting) {
    if (!data.profileId?.trim()) errors.profileId = 'Profile ID is required.';
    if (!data.fullName?.trim()) errors.fullName = 'Full name is required.';
    if (!data.gender) errors.gender = 'Select gender.';
    const age = Number(data.age);
    if (data.age === '' || data.age == null || Number.isNaN(age))
      errors.age = 'Age is required.';
    else if (age < 18 || age > 99) errors.age = 'Age must be between 18 and 99.';
  }
  const mobile = String(data.mobileNumber || '').replace(/\D/g, '');
  if (data.mobileNumber?.trim() && !/^\d{10}$/.test(mobile))
    errors.mobileNumber = 'Enter a 10-digit mobile number.';
  return errors;
}

export const DataEntryForm: React.FC<DataEntryFormProps> = ({
  currentUser,
  slotNumber,
  onSlotChange,
  onRecordSaved,
}) => {
  const { showToast } = useToast();
  const [copyPasteRestricted, setCopyPasteRestricted] = useState(false);

  const totalSlots = currentUser.assignedRecords ?? 0;
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const saving = React.useRef(false);

  // Find existing record or initialize
  const [formData, setFormData] = useState<Partial<MatrimonialRecord>>({
    slotNumber,
    operatorId: currentUser.id,
    profileId: '',
    postedOn: '',
    lastUpdatedOn: '',
    fullName: '',
    gender: '',
    age: '',
    education: '',
    educationDetail: '',
    occupation: '',
    annualIncome: '',
    maritalStatus: '',
    religion: '',
    caste: '',
    subCaste: '',
    gothram: '',
    familyType: '',
    motherTongue: '',
    star: '',
    raasiMoonSign: '',
    dhoshamManglik: '',
    horoscopeMatch: '',
    height: '',
    weight: '',
    bodyType: '',
    physicalStatus: '',
    complexion: '',
    eatingHabit: '',
    smokeHabit: '',
    drinkHabit: '',
    citizenOf: '',
    countryLivingIn: '',
    homeState: '',
    familyValue: '',
    familyStatus: '',
    mobileNumber: '',
    aboutFamily: '',
    moreDescription: '',
    expectations: '',
    additionalNotes: '',
    status: 'Draft',
  });

  // Load slot data whenever slotNumber changes
  useEffect(() => {
    const allRecords = getStoredRecords();
    const existing = allRecords.find(
      (r) => r.operatorId === currentUser.id && r.slotNumber === slotNumber,
    );

    if (existing) {
      setFormData(existing);
    } else {
      setFormData({
        slotNumber,
        operatorId: currentUser.id,
        profileId: '',
        postedOn: '',
        lastUpdatedOn: '',
        fullName: '',
        gender: '',
        age: '',
        education: '',
        educationDetail: '',
        occupation: '',
        annualIncome: '',
        maritalStatus: '',
        religion: '',
        caste: '',
        subCaste: '',
        gothram: '',
        familyType: '',
        motherTongue: '',
        star: '',
        raasiMoonSign: '',
        dhoshamManglik: '',
        horoscopeMatch: '',
        height: '',
        weight: '',
        bodyType: '',
        physicalStatus: '',
        complexion: '',
        eatingHabit: '',
        smokeHabit: '',
        drinkHabit: '',
        citizenOf: '',
        countryLivingIn: '',
        homeState: '',
        familyValue: '',
        familyStatus: '',
        mobileNumber: '',
        aboutFamily: '',
        moreDescription: '',
        expectations: '',
        additionalNotes: '',
        status: 'Draft',
      });
    }
    setErrors({});
  }, [slotNumber, currentUser.id]);

  // Overall completed count for header progress
  const allRecords = getStoredRecords();
  const operatorRecords = allRecords.filter(
    (r) => r.operatorId === currentUser.id,
  );
  const completedSlots = operatorRecords.filter(
    (r) => r.status === 'Submitted',
  ).length;
  const progressPercent =
    totalSlots > 0 ? Math.round((completedSlots / totalSlots) * 100) : 0;

  // Paste handler
  const handlePaste = (e: React.ClipboardEvent) => {
    if (copyPasteRestricted) {
      e.preventDefault();
      showToast(
        'warning',
        'Copy / Paste Restricted',
        'Direct paste is disabled to ensure typing accuracy and compliance with data entry rules.',
      );
    }
  };

  const handleInputChange = (field: keyof MatrimonialRecord, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const fieldClass = (field: keyof MatrimonialRecord) =>
    `w-full px-3.5 py-2.5 rounded-xl border text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
      errors[field] ? 'border-rose-400 bg-rose-50' : 'border-slate-200'
    }`;

  // Quick submit / Draft save
  const persist = async (status: 'Draft' | 'Submitted') => {
    if (saving.current || totalSlots === 0) return;
    const nextErrors = validateEntry(formData, status === 'Submitted');
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      showToast(
        'error',
        'Check the form',
        Object.values(nextErrors)[0] || 'Please fix the highlighted fields.',
      );
      return;
    }
    saving.current = true;
    setIsSaving(true);
    try {
      const saved = await saveOperatorRecord({
        ...formData,
        slotNumber,
        operatorId: currentUser.id,
        status,
      });
      setFormData(saved);
      showToast(
        'success',
        status === 'Submitted' ? 'Record submitted' : 'Draft saved',
        status === 'Submitted' && slotNumber < totalSlots
          ? `Opening slot #${slotNumber + 1}.`
          : 'Your changes have been saved to the workspace.',
      );
      await onRecordSaved();
      if (status === 'Submitted' && slotNumber < totalSlots)
        onSlotChange(slotNumber + 1);
    } catch (error) {
      showToast('error', 'Save failed', errorMessage(error));
    } finally {
      saving.current = false;
      setIsSaving(false);
    }
  };
  const handleSaveDraft = () => persist('Draft');
  const handleSubmit = (event?: React.FormEvent) => {
    event?.preventDefault();
    return persist('Submitted');
  };

  // Keyboard shortcut Ctrl+Enter or Cmd+Enter
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSubmit();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [formData, slotNumber]);

  if (totalSlots === 0)
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center">
        <h2 className="text-xl font-semibold">No records assigned yet</h2>
        <p className="text-slate-500 mt-2">
          Your administrator will assign records when work is available.
        </p>
      </div>
    );
  return (
    <div aria-busy={isSaving} className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Top Banner Matching Figure A2 */}
      <div className="bg-gradient-to-r from-[#1e1b4b] via-[#2e1065] to-[#3b0764] rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-center">
          {/* Progress */}
          <div className="border-b sm:border-b-0 sm:border-r border-white/10 pb-4 sm:pb-0 sm:pr-4">
            <span className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider block">
              Progress
            </span>
            <div className="text-2xl font-black text-white mt-1">
              {completedSlots} / {totalSlots}
            </div>
            <span className="text-xs text-indigo-200/70 font-medium">
              Records Completed
            </span>
          </div>

          {/* Current Slot */}
          <div className="border-b sm:border-b-0 sm:border-r border-white/10 pb-4 sm:pb-0 sm:pr-4">
            <span className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider block">
              Current Slot
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-indigo-400">
                #{slotNumber}
              </span>
              <span className="text-xs text-indigo-200/80">
                of {totalSlots}
              </span>
            </div>
            <div className="mt-1 flex items-center gap-1.5">
              <span
                className={`inline-block w-2 h-2 rounded-full ${formData.status === 'Submitted' ? 'bg-emerald-400' : 'bg-amber-400'}`}
              />
              <span className="text-xs font-semibold text-slate-300">
                {formData.status === 'Submitted'
                  ? 'Submitted'
                  : 'Draft / In Progress'}
              </span>
            </div>
          </div>

          {/* Completion Bar */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider">
                Completion
              </span>
              <span className="text-sm font-black text-white font-mono">
                {progressPercent}%
              </span>
            </div>
            <div className="w-full bg-white/20 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-emerald-400 h-full rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            {/* Slot Dropdown Jump */}
            <div className="mt-3 flex items-center justify-between text-xs">
              <span className="text-indigo-200/70 text-[11px]">
                Jump to slot:
              </span>
              <select
                disabled={isSaving}
                value={slotNumber}
                onChange={(e) => onSlotChange(Number(e.target.value))}
                className="bg-white/10 hover:bg-white/20 text-white text-xs rounded-lg px-2.5 py-1 border border-white/20 focus:outline-none cursor-pointer"
              >
                {Array.from({ length: totalSlots }, (_, i) => i + 1).map(
                  (num) => (
                    <option
                      key={num}
                      value={num}
                      className="bg-slate-900 text-white"
                    >
                      Slot #{num}
                    </option>
                  ),
                )}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Entry Form Card Matching Figure A2 */}
      <form
        onSubmit={handleSubmit}
        onPaste={handlePaste}
        className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden"
      >
        <fieldset disabled={isSaving} className="contents">
          {/* Card Header with badges matching Figure A2 */}
          <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/60">
            <div className="flex items-center gap-2.5">
              <h3 className="font-extrabold text-slate-900 text-lg">
                Entry Form — Slot #{slotNumber}
              </h3>
              {formData.status === 'Submitted' && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                  <Check className="w-3 h-3 text-emerald-600" />
                  Submitted
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs">
              {/* Copy / Paste Disabled badge */}
              <div
                onClick={() => setCopyPasteRestricted(!copyPasteRestricted)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold border cursor-pointer select-none transition-colors ${
                  copyPasteRestricted
                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                    : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}
                title="Click to toggle paste protection for evaluation"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                <span>
                  Copy/Paste {copyPasteRestricted ? 'disabled' : 'enabled'}
                </span>
                {copyPasteRestricted ? (
                  <Lock className="w-3 h-3 text-amber-600 ml-1" />
                ) : (
                  <Unlock className="w-3 h-3 text-slate-500 ml-1" />
                )}
              </div>

              {/* Ctrl+Enter hint */}
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-600 border border-slate-200 font-semibold">
                <Command className="w-3 h-3 text-slate-500" />
                <span>Ctrl+Enter to quick submit</span>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-8">
            {/* SECTION 1: GENERAL INFORMATION */}
            <div>
              <div className="border-b border-slate-200 pb-2 mb-4">
                <h4 className="text-xs font-black uppercase tracking-wider text-indigo-700 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-600" />
                  General Information
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Profile ID <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. MAT-17210"
                    value={formData.profileId || ''}
                    onChange={(e) =>
                      handleInputChange('profileId', e.target.value)
                    }
                    className={`${fieldClass('profileId')} font-mono font-semibold`}
                  />
                  {errors.profileId && (
                    <p className="mt-1 text-xs font-semibold text-rose-600">
                      {errors.profileId}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Posted On
                  </label>
                  <input
                    type="text"
                    placeholder="Source posting date"
                    value={formData.postedOn || ''}
                    readOnly={formData.status === 'Submitted'}
                    onChange={(e) =>
                      handleInputChange('postedOn', e.target.value)
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Last Updated On
                  </label>
                  <input
                    type="text"
                    placeholder="Set automatically on save"
                    value={formData.lastUpdatedOn || ''}
                    readOnly
                    onChange={(e) =>
                      handleInputChange('lastUpdatedOn', e.target.value)
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 2: PERSONAL INFORMATION */}
            <div>
              <div className="border-b border-slate-200 pb-2 mb-4">
                <h4 className="text-xs font-black uppercase tracking-wider text-indigo-700 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-600" />
                  Personal Information
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {/* Full Name */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Amit Kumar Sharma"
                    value={formData.fullName || ''}
                    onChange={(e) =>
                      handleInputChange('fullName', e.target.value)
                    }
                    className={`${fieldClass('fullName')} font-medium`}
                  />
                  {errors.fullName && (
                    <p className="mt-1 text-xs font-semibold text-rose-600">
                      {errors.fullName}
                    </p>
                  )}
                </div>

                {/* Gender & Age */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Gender / Age <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      required
                      value={formData.gender || ''}
                      onChange={(e) =>
                        handleInputChange('gender', e.target.value)
                      }
                      className={`${fieldClass('gender')} px-3 bg-white`}
                    >
                      <option value="">Select gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                    <input
                      type="number"
                      required
                      min="18"
                      max="99"
                      placeholder="Age"
                      value={formData.age || ''}
                      onChange={(e) => handleInputChange('age', e.target.value)}
                      className={`${fieldClass('age')} px-3 font-mono`}
                    />
                  </div>
                  {(errors.gender || errors.age) && (
                    <p className="mt-1 text-xs font-semibold text-rose-600">
                      {errors.gender || errors.age}
                    </p>
                  )}
                </div>

                {/* Education */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Education
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Bachelor in Computer Science"
                    value={formData.education || ''}
                    onChange={(e) =>
                      handleInputChange('education', e.target.value)
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Education Detail */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Education Detail
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. B.E. Computers, Pune University"
                    value={formData.educationDetail || ''}
                    onChange={(e) =>
                      handleInputChange('educationDetail', e.target.value)
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Occupation */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Occupation
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Senior Software Engineer"
                    value={formData.occupation || ''}
                    onChange={(e) =>
                      handleInputChange('occupation', e.target.value)
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Annual Income */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Annual Income
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 15 - 20 Lakhs INR"
                    value={formData.annualIncome || ''}
                    onChange={(e) =>
                      handleInputChange('annualIncome', e.target.value)
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Marital Status */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Marital Status
                  </label>
                  <select
                    value={formData.maritalStatus || 'Never Married'}
                    onChange={(e) =>
                      handleInputChange('maritalStatus', e.target.value)
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="">Select an option</option>
                    <option value="Never Married">Never Married</option>
                    <option value="Divorced">Divorced</option>
                    <option value="Widowed">Widowed</option>
                    <option value="Awaiting Divorce">Awaiting Divorce</option>
                  </select>
                </div>

                {/* Religion & Caste */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Religion
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Hindu"
                    value={formData.religion || ''}
                    onChange={(e) =>
                      handleInputChange('religion', e.target.value)
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Caste
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Brahmin / Kshatriya"
                    value={formData.caste || ''}
                    onChange={(e) => handleInputChange('caste', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Sub Caste & Gothram */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Sub Caste
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Deshastha"
                    value={formData.subCaste || ''}
                    onChange={(e) =>
                      handleInputChange('subCaste', e.target.value)
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Gothram
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Kashyapa"
                    value={formData.gothram || ''}
                    onChange={(e) =>
                      handleInputChange('gothram', e.target.value)
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Family Type & Mother Tongue */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Family Type
                  </label>
                  <select
                    value={formData.familyType || 'Nuclear'}
                    onChange={(e) =>
                      handleInputChange('familyType', e.target.value)
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="">Select an option</option>
                    <option value="Nuclear">Nuclear</option>
                    <option value="Joint">Joint</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Mother Tongue
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Hindi, Marathi, Tamil"
                    value={formData.motherTongue || ''}
                    onChange={(e) =>
                      handleInputChange('motherTongue', e.target.value)
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Star & Raasi */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Star (Nakshatra)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Rohini / Ashwini"
                    value={formData.star || ''}
                    onChange={(e) => handleInputChange('star', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Raasi / Moon Sign
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Vrishabha (Taurus)"
                    value={formData.raasiMoonSign || ''}
                    onChange={(e) =>
                      handleInputChange('raasiMoonSign', e.target.value)
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Dhosham / Manglik & Horoscope Match */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Dhosham / Manglik
                  </label>
                  <select
                    value={formData.dhoshamManglik || 'No'}
                    onChange={(e) =>
                      handleInputChange('dhoshamManglik', e.target.value)
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="">Select an option</option>
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                    <option value="Don't Know">Don't Know</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Horoscope Match
                  </label>
                  <select
                    value={formData.horoscopeMatch || 'Must'}
                    onChange={(e) =>
                      handleInputChange('horoscopeMatch', e.target.value)
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="">Select an option</option>
                    <option value="Must">Must</option>
                    <option value="Not Necessary">Not Necessary</option>
                  </select>
                </div>

                {/* Height & Weight */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Height
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 5 ft 10 in"
                    value={formData.height || ''}
                    onChange={(e) =>
                      handleInputChange('height', e.target.value)
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Weight
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 70 kg"
                    value={formData.weight || ''}
                    onChange={(e) =>
                      handleInputChange('weight', e.target.value)
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Body Type & Complexion */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Body Type
                  </label>
                  <select
                    value={formData.bodyType || 'Average'}
                    onChange={(e) =>
                      handleInputChange('bodyType', e.target.value)
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="">Select an option</option>
                    <option value="Average">Average</option>
                    <option value="Slim">Slim</option>
                    <option value="Athletic">Athletic</option>
                    <option value="Heavy">Heavy</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Complexion
                  </label>
                  <select
                    value={formData.complexion || 'Wheatish'}
                    onChange={(e) =>
                      handleInputChange('complexion', e.target.value)
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="">Select an option</option>
                    <option value="Wheatish">Wheatish</option>
                    <option value="Fair">Fair</option>
                    <option value="Very Fair">Very Fair</option>
                    <option value="Dark">Dark</option>
                  </select>
                </div>

                {/* Physical Status */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Physical Status
                  </label>
                  <select
                    value={formData.physicalStatus || 'Normal'}
                    onChange={(e) =>
                      handleInputChange('physicalStatus', e.target.value)
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="">Select an option</option>
                    <option value="Normal">Normal</option>
                    <option value="Physically Challenged">
                      Physically Challenged
                    </option>
                  </select>
                </div>

                {/* Habits: Eating, Smoke, Drink */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Eating Habit
                  </label>
                  <select
                    value={formData.eatingHabit || 'Vegetarian'}
                    onChange={(e) =>
                      handleInputChange('eatingHabit', e.target.value)
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="">Select an option</option>
                    <option value="Vegetarian">Vegetarian</option>
                    <option value="Non-Vegetarian">Non-Vegetarian</option>
                    <option value="Eggetarian">Eggetarian</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Smoke Habit
                  </label>
                  <select
                    value={formData.smokeHabit || 'No'}
                    onChange={(e) =>
                      handleInputChange('smokeHabit', e.target.value)
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="">Select an option</option>
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                    <option value="Occasionally">Occasionally</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Drink Habit
                  </label>
                  <select
                    value={formData.drinkHabit || 'No'}
                    onChange={(e) =>
                      handleInputChange('drinkHabit', e.target.value)
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="">Select an option</option>
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                    <option value="Occasionally">Occasionally</option>
                  </select>
                </div>

                {/* Citizen Of, Country Living In, Home State */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Citizen Of
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. India"
                    value={formData.citizenOf || ''}
                    onChange={(e) =>
                      handleInputChange('citizenOf', e.target.value)
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Country Living In
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. India, USA, UAE"
                    value={formData.countryLivingIn || ''}
                    onChange={(e) =>
                      handleInputChange('countryLivingIn', e.target.value)
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Home State
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Maharashtra / Karnataka"
                    value={formData.homeState || ''}
                    onChange={(e) =>
                      handleInputChange('homeState', e.target.value)
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 3: FAMILY / OTHER INFORMATION */}
            <div>
              <div className="border-b border-slate-200 pb-2 mb-4">
                <h4 className="text-xs font-black uppercase tracking-wider text-indigo-700 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-600" />
                  Family / Other Information
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Family Value
                  </label>
                  <select
                    value={formData.familyValue || 'Moderate'}
                    onChange={(e) =>
                      handleInputChange('familyValue', e.target.value)
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="">Select an option</option>
                    <option value="Traditional">Traditional</option>
                    <option value="Moderate">Moderate</option>
                    <option value="Liberal">Liberal</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Family Status
                  </label>
                  <select
                    value={formData.familyStatus || 'Middle Class'}
                    onChange={(e) =>
                      handleInputChange('familyStatus', e.target.value)
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="">Select an option</option>
                    <option value="Middle Class">Middle Class</option>
                    <option value="Upper Middle Class">
                      Upper Middle Class
                    </option>
                    <option value="Affluent">Affluent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Mobile Number
                  </label>
                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    placeholder="e.g. 9820192831"
                    value={formData.mobileNumber || ''}
                    onChange={(e) =>
                      handleInputChange(
                        'mobileNumber',
                        e.target.value.replace(/\D/g, '').slice(0, 10),
                      )
                    }
                    className={fieldClass('mobileNumber')}
                  />
                  {errors.mobileNumber && (
                    <p className="mt-1 text-xs font-semibold text-rose-600">
                      {errors.mobileNumber}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* SECTION 4: DESCRIPTION SECTIONS */}
            <div>
              <div className="border-b border-slate-200 pb-2 mb-4">
                <h4 className="text-xs font-black uppercase tracking-wider text-indigo-700 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-600" />
                  Description Sections
                </h4>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    About Family
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Parents background, siblings, values and family background..."
                    value={formData.aboutFamily || ''}
                    onChange={(e) =>
                      handleInputChange('aboutFamily', e.target.value)
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    More Description
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Hobbies, personality, lifestyle, preferences..."
                    value={formData.moreDescription || ''}
                    onChange={(e) =>
                      handleInputChange('moreDescription', e.target.value)
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Partner Expectations
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Desired qualities, educational background, location preference..."
                    value={formData.expectations || ''}
                    onChange={(e) =>
                      handleInputChange('expectations', e.target.value)
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Additional Notes
                  </label>
                  <input
                    type="text"
                    placeholder="Any other special instructions or remarks..."
                    value={formData.additionalNotes || ''}
                    onChange={(e) =>
                      handleInputChange('additionalNotes', e.target.value)
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="px-6 sm:px-8 py-5 border-t border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={slotNumber <= 1}
                onClick={() => onSlotChange(slotNumber - 1)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold disabled:opacity-40 flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Previous Slot
              </button>

              <button
                type="button"
                disabled={slotNumber >= totalSlots}
                onClick={() => onSlotChange(slotNumber + 1)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold disabled:opacity-40 flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                Next Slot
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={isSaving}
                onClick={handleSaveDraft}
                className="px-5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Save className="w-4 h-4 text-slate-500" />
                Save as Draft
              </button>

              <button
                disabled={isSaving}
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold shadow-md shadow-indigo-600/30 flex items-center gap-2 transition-all cursor-pointer"
              >
                <Check className="w-4 h-4" />
                Submit Slot #{slotNumber}
              </button>
            </div>
          </div>
        </fieldset>
      </form>
    </div>
  );
};
