import { useState, FormEvent } from 'react';
import { User } from '../types';
import { UserCheck, RefreshCw, PlusCircle, GraduationCap, Briefcase, Mail } from 'lucide-react';

interface IdentitySelectorProps {
  users: User[];
  currentUser: User | null;
  onSelectUser: (userId: number) => void;
  onRegisterUser: (data: any) => Promise<boolean>;
}

export default function IdentitySelector({
  users,
  currentUser,
  onSelectUser,
  onRegisterUser,
}: IdentitySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  
  // Registration form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'STUDENT' | 'ALUMNI'>('STUDENT');
  const [company, setCompany] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [gradYear, setGradYear] = useState('2026');
  const [linkedin, setLinkedin] = useState('');
  const [major, setMajor] = useState('');
  const [expectedGrad, setExpectedGrad] = useState('2027');
  
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    if (!name || !email) {
      setError('Name and Email are required.');
      setIsSubmitting(false);
      return;
    }

    const registrationData = {
      name,
      email,
      role,
      company: role === 'ALUMNI' ? company : undefined,
      jobTitle: role === 'ALUMNI' ? jobTitle : undefined,
      graduationYear: role === 'ALUMNI' ? Number(gradYear) : undefined,
      linkedinUrl: role === 'ALUMNI' ? linkedin : undefined,
      major: role === 'STUDENT' ? major : undefined,
      expectedGraduation: role === 'STUDENT' ? Number(expectedGrad) : undefined,
    };

    const success = await onRegisterUser(registrationData);
    setIsSubmitting(false);
    if (success) {
      setIsRegistering(false);
      // Reset form
      setName('');
      setEmail('');
      setCompany('');
      setJobTitle('');
      setLinkedin('');
      setMajor('');
    } else {
      setError('Registration failed. Email might already be registered.');
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 border border-slate-200 hover:border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-lg text-sm font-medium shadow-xs transition cursor-pointer"
        id="identity-selector-btn"
      >
        {currentUser ? (
          <>
            <span className={`inline-block w-2.5 h-2.5 rounded-full ${currentUser.role === 'ALUMNI' ? 'bg-emerald-500' : 'bg-indigo-500'}`} />
            <span className="text-slate-700 dark:text-slate-300 max-w-[120px] md:max-w-[200px] truncate">
              {currentUser.name} ({currentUser.role})
            </span>
          </>
        ) : (
          <span className="text-red-500 flex items-center gap-1">Select Persona</span>
        )}
        <RefreshCw size={14} className="text-slate-400 animate-pulse" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl shadow-xl z-50 p-4 max-h-[80vh] overflow-y-auto">
          {!isRegistering ? (
            <div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800 mb-3">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Select Demo Account</span>
                <button
                  onClick={() => setIsRegistering(true)}
                  className="text-xs text-indigo-600 hover:text-indigo-500 font-medium flex items-center gap-1 cursor-pointer"
                >
                  <PlusCircle size={12} />
                  Add New
                </button>
              </div>

              <div className="space-y-2">
                {users.map((user) => {
                  const isActive = currentUser?.id === user.id;
                  const isAlumni = user.role === 'ALUMNI';
                  return (
                    <button
                      key={user.id}
                      onClick={() => {
                        onSelectUser(user.id);
                        setIsOpen(false);
                      }}
                      className={`w-full text-left p-3 rounded-lg flex items-start gap-3 transition-all cursor-pointer ${
                        isActive
                          ? 'bg-slate-50 dark:bg-slate-900 border-2 border-slate-900 dark:border-slate-300 shadow-xs'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-900/50 border border-slate-100 dark:border-slate-900'
                      }`}
                    >
                      <div className={`p-2 rounded-lg ${isAlumni ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600' : 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600'}`}>
                        {isAlumni ? <Briefcase size={16} /> : <GraduationCap size={16} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-sm text-slate-800 dark:text-slate-100 truncate">{user.name}</p>
                          {isActive && <UserCheck size={14} className="text-slate-900 dark:text-white" />}
                        </div>
                        <p className="text-xs text-slate-500 truncate flex items-center gap-1">
                          <Mail size={10} /> {user.email}
                        </p>
                        {isAlumni && user.alumniProfile && (
                          <p className="text-xs text-emerald-600 font-medium mt-1 truncate">
                            {user.alumniProfile.jobTitle} at {user.alumniProfile.company}
                          </p>
                        )}
                        {!isAlumni && user.studentProfile && (
                          <p className="text-xs text-indigo-600 font-medium mt-1 truncate">
                            {user.studentProfile.major} (Class of {user.studentProfile.expectedGraduation})
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800 mb-3">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Create Custom Persona</span>
                <button
                  onClick={() => setIsRegistering(false)}
                  className="text-xs text-slate-500 hover:text-slate-700 font-medium cursor-pointer"
                >
                  Back to List
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3">
                {error && (
                  <div className="p-2 bg-red-50 text-red-600 border border-red-100 rounded text-xs">
                    {error}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Jane Doe"
                    className="w-full text-sm px-3 py-1.5 border border-slate-200 dark:border-slate-850 rounded bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="jane.doe@example.com"
                    className="w-full text-sm px-3 py-1.5 border border-slate-200 dark:border-slate-850 rounded bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Role Type</label>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <button
                      type="button"
                      onClick={() => setRole('STUDENT')}
                      className={`py-1.5 text-xs font-medium rounded border transition cursor-pointer ${
                        role === 'STUDENT'
                          ? 'bg-indigo-50 border-indigo-400 text-indigo-700 dark:bg-indigo-950/20 dark:border-indigo-600 dark:text-indigo-400'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-600 dark:border-slate-800 dark:hover:bg-slate-900 dark:text-slate-400'
                      }`}
                    >
                      Student
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole('ALUMNI')}
                      className={`py-1.5 text-xs font-medium rounded border transition cursor-pointer ${
                        role === 'ALUMNI'
                          ? 'bg-emerald-50 border-emerald-400 text-emerald-700 dark:bg-emerald-950/20 dark:border-emerald-600 dark:text-emerald-400'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-600 dark:border-slate-800 dark:hover:bg-slate-900 dark:text-slate-400'
                      }`}
                    >
                      Alumni
                    </button>
                  </div>
                </div>

                {role === 'ALUMNI' ? (
                  <>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Current Company</label>
                      <input
                        type="text"
                        required={role === 'ALUMNI'}
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        placeholder="Google, Stripe, etc."
                        className="w-full text-sm px-3 py-1.5 border border-slate-200 dark:border-slate-850 rounded bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Job Title</label>
                      <input
                        type="text"
                        required={role === 'ALUMNI'}
                        value={jobTitle}
                        onChange={(e) => setJobTitle(e.target.value)}
                        placeholder="Staff Engineer"
                        className="w-full text-sm px-3 py-1.5 border border-slate-200 dark:border-slate-850 rounded bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Graduation Year</label>
                        <input
                          type="number"
                          required={role === 'ALUMNI'}
                          value={gradYear}
                          onChange={(e) => setGradYear(e.target.value)}
                          className="w-full text-sm px-3 py-1.5 border border-slate-200 dark:border-slate-850 rounded bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">LinkedIn Profile URL</label>
                        <input
                          type="url"
                          required={role === 'ALUMNI'}
                          value={linkedin}
                          onChange={(e) => setLinkedin(e.target.value)}
                          placeholder="https://linkedin.com/..."
                          className="w-full text-sm px-3 py-1.5 border border-slate-200 dark:border-slate-850 rounded bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Field of Study / Major</label>
                      <input
                        type="text"
                        required={role === 'STUDENT'}
                        value={major}
                        onChange={(e) => setMajor(e.target.value)}
                        placeholder="Computer Science"
                        className="w-full text-sm px-3 py-1.5 border border-slate-200 dark:border-slate-850 rounded bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Expected Graduation Year</label>
                      <input
                        type="number"
                        required={role === 'STUDENT'}
                        value={expectedGrad}
                        onChange={(e) => setExpectedGrad(e.target.value)}
                        className="w-full text-sm px-3 py-1.5 border border-slate-200 dark:border-slate-850 rounded bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
                      />
                    </div>
                  </>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-medium py-2 rounded text-xs transition duration-150 flex items-center justify-center gap-1 cursor-pointer"
                >
                  {isSubmitting ? 'Registering...' : 'Register and Login'}
                </button>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
