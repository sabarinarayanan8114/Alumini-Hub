import { useState, useEffect, FormEvent } from 'react';
import { User } from '../types';
import { UserCheck, Briefcase, GraduationCap, Save, CheckCircle2 } from 'lucide-react';

interface ProfileFormProps {
  currentUser: User | null;
  onUpdateProfile: (data: any) => Promise<boolean>;
}

export default function ProfileForm({ currentUser, onUpdateProfile }: ProfileFormProps) {
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [graduationYear, setGraduationYear] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [major, setMajor] = useState('');
  const [expectedGraduation, setExpectedGraduation] = useState('');
  const [resumeUrl, setResumeUrl] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || '');
      if (currentUser.role === 'ALUMNI' && currentUser.alumniProfile) {
        setCompany(currentUser.alumniProfile.company || '');
        setJobTitle(currentUser.alumniProfile.jobTitle || '');
        setGraduationYear(String(currentUser.alumniProfile.graduationYear) || '');
        setLinkedinUrl(currentUser.alumniProfile.linkedinUrl || '');
      } else if (currentUser.role === 'STUDENT' && currentUser.studentProfile) {
        setMajor(currentUser.studentProfile.major || '');
        setExpectedGraduation(String(currentUser.studentProfile.expectedGraduation) || '');
        setResumeUrl(currentUser.studentProfile.resumeUrl || '');
      }
    }
  }, [currentUser]);

  if (!currentUser) {
    return (
      <div className="bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl p-6 text-center shadow-xs">
        <p className="text-sm text-slate-500">Please select a demo identity in the header to view profile settings.</p>
      </div>
    );
  }

  const isAlumni = currentUser.role === 'ALUMNI';

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setStatus(null);

    const updateData: any = { name };
    if (isAlumni) {
      updateData.company = company;
      updateData.jobTitle = jobTitle;
      updateData.graduationYear = Number(graduationYear);
      updateData.linkedinUrl = linkedinUrl;
    } else {
      updateData.major = major;
      updateData.expectedGraduation = Number(expectedGraduation);
      updateData.resumeUrl = resumeUrl;
    }

    const success = await onUpdateProfile(updateData);
    setIsSaving(false);

    if (success) {
      setStatus({ type: 'success', msg: 'Profile updated successfully!' });
      setTimeout(() => setStatus(null), 3000);
    } else {
      setStatus({ type: 'error', msg: 'Failed to update profile. Please try again.' });
    }
  };

  return (
    <div className="bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl p-6 shadow-xs">
      <div className="flex items-center gap-2 mb-6">
        <div className={`p-2 rounded-lg ${isAlumni ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600' : 'bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600'}`}>
          {isAlumni ? <Briefcase size={18} /> : <GraduationCap size={18} />}
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">Profile Settings</h2>
          <p className="text-xs text-slate-500">Manage your credentials and details for scheduling</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {status && (
          <div
            className={`p-3 rounded-lg text-xs font-semibold flex items-center gap-1.5 border ${
              status.type === 'success'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900/40 dark:text-emerald-400'
                : 'bg-red-50 text-red-600 border-red-100 dark:bg-red-950/20 dark:border-red-900/40 dark:text-red-400'
            }`}
          >
            {status.type === 'success' && <CheckCircle2 size={14} />}
            <span>{status.msg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Full Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-sm px-3.5 py-2 border border-slate-200 dark:border-slate-850 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Email Address</label>
            <input
              type="text"
              disabled
              value={currentUser.email}
              className="w-full text-sm px-3.5 py-2 border border-slate-200 dark:border-slate-850 rounded-xl bg-slate-50 dark:bg-slate-900/60 text-slate-400 cursor-not-allowed outline-none"
            />
            <span className="text-[10px] text-slate-400 mt-0.5 block">Email address cannot be changed.</span>
          </div>

          {isAlumni ? (
            <>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Current Company</label>
                <input
                  type="text"
                  required
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Stripe, Google, etc."
                  className="w-full text-sm px-3.5 py-2 border border-slate-200 dark:border-slate-850 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Job Title</label>
                <input
                  type="text"
                  required
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="Senior Backend Engineer"
                  className="w-full text-sm px-3.5 py-2 border border-slate-200 dark:border-slate-850 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Graduation Year</label>
                <input
                  type="number"
                  required
                  value={graduationYear}
                  onChange={(e) => setGraduationYear(e.target.value)}
                  className="w-full text-sm px-3.5 py-2 border border-slate-200 dark:border-slate-850 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">LinkedIn Profile URL</label>
                <input
                  type="url"
                  required
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  placeholder="https://linkedin.com/in/username"
                  className="w-full text-sm px-3.5 py-2 border border-slate-200 dark:border-slate-850 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Major / Course of Study</label>
                <input
                  type="text"
                  required
                  value={major}
                  onChange={(e) => setMajor(e.target.value)}
                  placeholder="Data Science & Engineering"
                  className="w-full text-sm px-3.5 py-2 border border-slate-200 dark:border-slate-850 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Expected Graduation Year</label>
                <input
                  type="number"
                  required
                  value={expectedGraduation}
                  onChange={(e) => setExpectedGraduation(e.target.value)}
                  className="w-full text-sm px-3.5 py-2 border border-slate-200 dark:border-slate-850 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-slate-500 mb-1">Resume Link (Google Drive / Dropbox)</label>
                <input
                  type="url"
                  value={resumeUrl}
                  onChange={(e) => setResumeUrl(e.target.value)}
                  placeholder="https://drive.google.com/file/d/.../view"
                  className="w-full text-sm px-3.5 py-2 border border-slate-200 dark:border-slate-850 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                />
              </div>
            </>
          )}
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl cursor-pointer transition flex items-center gap-1.5 disabled:opacity-50"
          >
            <Save size={14} />
            {isSaving ? 'Saving Changes...' : 'Save Profile'}
          </button>
        </div>
      </form>
    </div>
  );
}
