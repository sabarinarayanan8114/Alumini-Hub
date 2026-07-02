import { useState, FormEvent } from 'react';
import { ReferralPost, User } from '../types';
import { Briefcase, GraduationCap, Link2, HelpCircle, Send, CheckCircle, Info } from 'lucide-react';

interface PostCardProps {
  key?: any;
  post: ReferralPost;
  currentUser: User | null;
  onBookPost: (postId: number, studentNotes: string) => Promise<boolean>;
  hasBooked: boolean;
  bookingStatus?: 'PENDING' | 'ACCEPTED' | 'REJECTED';
}

export default function PostCard({
  post,
  currentUser,
  onBookPost,
  hasBooked,
  bookingStatus,
}: PostCardProps) {
  const [isBookingFormOpen, setIsBookingFormOpen] = useState(false);
  const [studentNotes, setStudentNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const isAlumni = currentUser?.role === 'ALUMNI';
  const isOwner = isAlumni && currentUser?.alumniProfile?.id === post.alumniId;
  const isStudent = currentUser?.role === 'STUDENT';

  const handleBook = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!studentNotes.trim()) {
      setError('Please add a short note introducing yourself.');
      return;
    }

    setIsSubmitting(true);
    const ok = await onBookPost(post.id, studentNotes);
    setIsSubmitting(false);

    if (ok) {
      setSuccess(true);
      setIsBookingFormOpen(false);
    } else {
      setError('Failed to request booking. Please try again.');
    }
  };

  const pctAvailable = Math.round((post.availableSlots / post.totalSlots) * 100);

  return (
    <div className="bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs hover:shadow-md transition duration-200">
      {/* Top Card Header */}
      <div className="p-6">
        <div className="flex justify-between items-start gap-3 mb-4">
          <div className="flex gap-3">
            <div className={`p-3 rounded-lg ${post.type === 'REFERRAL' ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600' : 'bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600'}`}>
              {post.type === 'REFERRAL' ? <Briefcase size={20} /> : <GraduationCap size={20} />}
            </div>
            <div>
              <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider mb-1 ${
                post.type === 'REFERRAL' 
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' 
                  : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400'
              }`}>
                {post.type === 'REFERRAL' ? 'Job Referral' : 'Mock Interview'}
              </span>
              <h3 className="font-bold text-base text-slate-800 dark:text-slate-100 leading-tight">
                {post.alumni?.jobTitle || 'Alumni Host'}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {post.alumni?.company || 'Company'} • Class of {post.alumni?.graduationYear}
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs text-slate-400 block font-mono">ID: #{post.id}</span>
            <span className="text-[10px] text-slate-400 block font-mono">v{post.version}</span>
          </div>
        </div>

        {/* Post Description */}
        <p className="text-sm text-slate-600 dark:text-slate-300 mb-6 leading-relaxed whitespace-pre-wrap">
          {post.description}
        </p>

        {/* Stats Slider / Progress */}
        <div className="space-y-1.5 mb-6">
          <div className="flex justify-between text-xs font-semibold text-slate-500">
            <span>Slots Allocated</span>
            <span>
              {post.availableSlots} of {post.totalSlots} available
            </span>
          </div>
          <div className="w-full h-2 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                pctAvailable === 0 
                  ? 'bg-slate-300 dark:bg-slate-700' 
                  : pctAvailable <= 25 
                  ? 'bg-amber-500' 
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${pctAvailable}%` }}
            />
          </div>
        </div>

        {/* Footer Meta */}
        <div className="flex justify-between items-center border-t border-slate-50 dark:border-slate-900 pt-4 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="font-medium text-slate-700 dark:text-slate-300">
              {post.alumni?.user?.name || 'Anonymous Alumni'}
            </span>
          </div>
          {post.alumni?.linkedinUrl && (
            <a
              href={post.alumni.linkedinUrl}
              target="_blank"
              rel="noreferrer"
              className="text-slate-400 hover:text-indigo-600 transition flex items-center gap-0.5"
            >
              <Link2 size={12} />
              LinkedIn
            </a>
          )}
        </div>
      </div>

      {/* Booking Actions Panel */}
      <div className="bg-slate-50 dark:bg-slate-900/40 border-t border-slate-50 dark:border-slate-900 p-4 flex flex-col gap-3">
        {isOwner && (
          <div className="text-xs text-slate-500 flex items-center gap-1">
            <Info size={12} />
            <span>You created this slot. You can moderate booking requests on the Bookings dashboard.</span>
          </div>
        )}

        {isStudent && (
          <>
            {hasBooked || success ? (
              <div className="flex items-center gap-2 text-xs font-semibold p-2.5 rounded-lg border border-indigo-100 bg-indigo-50/30 text-indigo-700 dark:border-indigo-900/50 dark:text-indigo-400 dark:bg-indigo-950/20">
                <CheckCircle size={14} className="text-indigo-600 dark:text-indigo-400" />
                <span>
                  Booking Request Submitted: 
                  <strong className="ml-1 uppercase tracking-wider">{bookingStatus || 'PENDING'}</strong>
                </span>
              </div>
            ) : post.availableSlots <= 0 ? (
              <div className="text-xs text-slate-500 font-medium p-2 bg-slate-100 dark:bg-slate-900/50 rounded-lg text-center">
                All slots filled for this post.
              </div>
            ) : (
              <div>
                {!isBookingFormOpen ? (
                  <button
                    onClick={() => setIsBookingFormOpen(true)}
                    className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white font-medium py-2 rounded-lg text-xs transition duration-150 cursor-pointer text-center"
                  >
                    Request Slot Booking
                  </button>
                ) : (
                  <form onSubmit={handleBook} className="space-y-3 mt-1">
                    {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1">
                        Introduce Yourself (Major, Interests, Target Role)
                      </label>
                      <textarea
                        required
                        rows={3}
                        value={studentNotes}
                        onChange={(e) => setStudentNotes(e.target.value)}
                        placeholder="Hi Elena! I am major in Computer Science and very interested in your team at Google Cloud. I have standard background in React/Golang. Could we connect?"
                        className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                    <div className="flex gap-2 justify-end">
                      <button
                        type="button"
                        onClick={() => setIsBookingFormOpen(false)}
                        className="px-3 py-1.5 border border-slate-200 hover:bg-slate-100 dark:border-slate-800 dark:hover:bg-slate-900 text-[11px] font-semibold text-slate-500 rounded-lg cursor-pointer transition"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-semibold rounded-lg cursor-pointer transition flex items-center gap-1 disabled:opacity-50"
                      >
                        <Send size={10} />
                        {isSubmitting ? 'Requesting...' : 'Submit Request'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </>
        )}

        {!currentUser && (
          <div className="text-xs text-slate-400 text-center">
            Please select a demo identity in the top right to book this slot.
          </div>
        )}
      </div>
    </div>
  );
}
