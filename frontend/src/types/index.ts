export type Role = 'admin' | 'operator';

export type UserStatus = 'active' | 'expired' | 'inactive';

export type RecordStatus = 'Draft' | 'Submitted';

export interface User {
  id: string;
  name: string;
  username: string;
  role: Role;
  mobile: string;
  email: string;
  assignedRecords: number;
  completedRecords: number;
  pendingRecords: number;
  firstLogin: string;
  expiryDate: string; // ISO date string
  expiryDays: number;
  status: UserStatus;
  createdAt: string;
}

export interface MatrimonialRecord {
  id: string;
  slotNumber: number; // e.g. 1 to 100
  operatorId: string;
  submittedByUsername: string;
  submittedByName: string;
  status: RecordStatus;
  createdAt: string;
  submittedAt?: string;
  lastUpdatedOn?: string;

  // General Information
  profileId: string; // e.g. MAT-17210
  postedOn?: string;

  // Personal Information
  fullName: string;
  gender: 'Male' | 'Female' | 'Other' | '';
  age: number | string;
  education: string;
  educationDetail: string;
  occupation: string;
  annualIncome: string;
  maritalStatus:
    'Never Married' | 'Divorced' | 'Widowed' | 'Awaiting Divorce' | '';
  religion: string;
  caste: string;
  subCaste: string;
  gothram: string;
  familyType: 'Joint' | 'Nuclear' | '';
  motherTongue: string;
  star: string;
  raasiMoonSign: string;
  dhoshamManglik: 'No' | 'Yes' | "Don't Know" | '';
  horoscopeMatch: 'Must' | 'Not Necessary' | '';
  height: string;
  weight: string;
  bodyType: 'Slim' | 'Athletic' | 'Average' | 'Heavy' | '';
  physicalStatus: 'Normal' | 'Physically Challenged' | '';
  complexion: 'Fair' | 'Very Fair' | 'Wheatish' | 'Dark' | '';
  eatingHabit: 'Vegetarian' | 'Non-Vegetarian' | 'Eggetarian' | '';
  smokeHabit: 'No' | 'Yes' | 'Occasionally' | '';
  drinkHabit: 'No' | 'Yes' | 'Occasionally' | '';
  citizenOf: string;
  countryLivingIn: string;
  homeState: string;

  // Family / Other Information
  familyValue: 'Traditional' | 'Moderate' | 'Liberal' | '';
  familyStatus: 'Middle Class' | 'Upper Middle Class' | 'Affluent' | '';
  mobileNumber: string;

  // Description Sections
  aboutFamily: string;
  moreDescription: string;
  expectations: string;
  additionalNotes: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  username: string;
  action: string;
  description: string;
  timestamp: string;
  type: 'submission' | 'user_management' | 'auth' | 'system';
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isConnected: boolean;
  lastSyncedAt?: string;
}
