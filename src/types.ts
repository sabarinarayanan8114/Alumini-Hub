export interface User {
  id: number;
  email: string;
  name: string;
  provider: 'GOOGLE' | 'LINKEDIN' | 'LOCAL';
  role: 'STUDENT' | 'ALUMNI' | null;
  alumniProfile?: AlumniProfile | null;
  studentProfile?: StudentProfile | null;
}

export interface AlumniProfile {
  id: number;
  userId: number;
  company: string;
  jobTitle: string;
  graduationYear: number;
  linkedinUrl: string;
}

export interface StudentProfile {
  id: number;
  userId: number;
  major: string;
  expectedGraduation: number;
  resumeUrl?: string;
}

export interface ReferralPost {
  id: number;
  alumniId: number;
  type: 'REFERRAL' | 'MOCK_INTERVIEW';
  description: string;
  totalSlots: number;
  availableSlots: number;
  version: number;
  createdAt: string;
  updatedAt: string;
  alumni?: AlumniProfile & {
    user: {
      name: string;
      email: string;
    }
  };
}

export interface BookingRequest {
  id: number;
  postId: number;
  studentId: number;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  studentNotes?: string;
  createdAt: string;
  updatedAt: string;
  post?: ReferralPost;
  student?: StudentProfile & {
    user: {
      name: string;
      email: string;
    }
  };
}
