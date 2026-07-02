import { useState } from 'react';
import { BookingRequest, User } from '../types';
import { Check, X, ShieldAlert, GraduationCap, Briefcase, Calendar, Info, Clock, AlertTriangle } from 'lucide-react';

interface BookingListProps {
  bookings: BookingRequest[];
  currentUser: User | null;
  onUpdateStatus: (
    bookingId: number,
    status: 'ACCEPTED' | 'REJECTED',
    simulateConflict?: boolean
  ) => Promise<{ success: boolean; errorType?: string; errorMessage?: string }>;
}

export default function BookingList({
  bookings,
  currentUser,
  onUpdateStatus,
}: BookingListProps) {
  const [isSimulateChecked, setIsSimulateChecked] = useState(false);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [conflictMessage, setConflictMessage] = useState<{ id: number; msg: string } | null>(null);

  const isAlumni = currentUser?.role === 'ALUMNI';
  const isStudent = currentUser?.role === 'STUDENT';

  const handleAction = async (bookingId: number, status: 'ACCEPTED' | 'REJECTED') => {
    setProcessingId(bookingId);
    setConflictMessage(null);

    const result = await onUpdateStatus(bookingId, status, status === 'ACCEPTED' ? isSimulateChecked : false);
    setProcessingId(null);

    if (!result.success && result.errorType === 'CONCURRENCY_CONFLICT') {
      setConflictMessage({
        id: bookingId,
        msg: result.errorMessage || 'Optimistic Locking triggered! An out-of-sync update occurred.'
      });
    }
  };

  if (bookings.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl p-8 text-center shadow-xs">
        <div className="max-w-md mx-auto">
          <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3 text-slate-400">
            <Calendar size={20} />
          </div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-1">No bookings found</h3>
          <p className="text-xs text-slate-500">
            {isAlumni
              ? 'You do not have any candidate booking requests for your slots yet.'
              : 'You have not requested any referral or interview slots yet.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Simulation Controls for Alumni */}
      {isAlumni && (
        <div className="p-4 bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/80 rounded-xl flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
              <ShieldAlert size={16} />
              <h4 className="text-xs font-bold uppercase tracking-wider">Optimistic Locking Sandbox</h4>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Check this box to simulate a concurrent request race condition. Sequelize will reject the approval to prevent double-booking.
            </p>
          </div>
          <label className="inline-flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-slate-300 transition-colors shadow-xs select-none cursor-pointer">
            <input
              type="checkbox"
              checked={isSimulateChecked}
              onChange={(e) => setIsSimulateChecked(e.target.checked)}
              className="rounded text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Force Version Conflict
            </span>
          </label>
        </div>
      )}

      {/* Booking List Cards */}
      <div className="space-y-4">
        {bookings.map((booking) => {
          const isPending = booking.status === 'PENDING';
          const isAccepted = booking.status === 'ACCEPTED';
          const isRejected = booking.status === 'REJECTED';

          return (
            <div
              key={booking.id}
              className={`bg-white dark:bg-slate-950 border rounded-xl overflow-hidden shadow-xs transition-all duration-200 ${
                conflictMessage?.id === booking.id
                  ? 'border-red-300 dark:border-red-900 shadow-md ring-2 ring-red-500/10'
                  : 'border-slate-100 dark:border-slate-800'
              }`}
            >
              <div className="p-5">
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-50 dark:border-slate-900 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-slate-400">Booking #{booking.id}</span>
                    <span className="text-slate-200 dark:text-slate-800">•</span>
                    <span className="text-xs text-slate-400">
                      Posted {new Date(booking.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Status Badge */}
                  <div>
                    {isPending && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400">
                        <Clock size={12} /> Pending Approval
                      </span>
                    )}
                    {isAccepted && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400">
                        <Check size={12} /> Booking Accepted
                      </span>
                    )}
                    {isRejected && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400">
                        <X size={12} /> Rejected
                      </span>
                    )}
                  </div>
                </div>

                {/* Main Content Body */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                  {/* Left Column: Post Info */}
                  <div className="md:col-span-5 space-y-3">
                    <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Target Slot Details</h5>
                    <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl space-y-2">
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-md ${booking.post?.type === 'REFERRAL' ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700' : 'bg-indigo-100 dark:bg-indigo-950/40 text-indigo-700'}`}>
                          {booking.post?.type === 'REFERRAL' ? <Briefcase size={14} /> : <GraduationCap size={14} />}
                        </div>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          {booking.post?.type === 'REFERRAL' ? 'Job Referral' : 'Mock Interview'}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {isAlumni 
                          ? booking.post?.description 
                          : `${booking.post?.alumni?.jobTitle} at ${booking.post?.alumni?.company}`}
                      </p>
                      {!isAlumni && (
                        <p className="text-[10px] text-slate-500">
                          Hosted by: {booking.post?.alumni?.user?.name} ({booking.post?.alumni?.user?.email})
                        </p>
                      )}
                      <p className="text-[10px] text-slate-400 font-mono">
                        Post Version: v{booking.post?.version} | Slots left: {booking.post?.availableSlots}
                      </p>
                    </div>
                  </div>

                  {/* Right Column: Party Info & Notes */}
                  <div className="md:col-span-7 space-y-3">
                    <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      {isAlumni ? 'Applicant Details & Notes' : 'Your Application Notes'}
                    </h5>

                    {isAlumni && booking.student ? (
                      <div className="space-y-1.5">
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                          {booking.student.user?.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          Major: <strong className="text-slate-700 dark:text-slate-300">{booking.student.major}</strong> • Graduating: {booking.student.expectedGraduation}
                        </p>
                        {booking.student.resumeUrl && (
                          <a
                            href={booking.student.resumeUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-indigo-600 hover:underline font-medium inline-block"
                          >
                            View Resume Link
                          </a>
                        )}
                      </div>
                    ) : null}

                    {booking.studentNotes && (
                      <div className="p-3 bg-slate-50 dark:bg-slate-900/30 rounded-xl border border-slate-100 dark:border-slate-900/40">
                        <p className="text-xs italic text-slate-600 dark:text-slate-400 leading-relaxed">
                          "{booking.studentNotes}"
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Concurrency Conflict Alert Container */}
                {conflictMessage?.id === booking.id && (
                  <div className="mt-4 p-4 border border-red-200 bg-red-50/50 dark:border-red-950 dark:bg-red-950/20 rounded-xl">
                    <div className="flex items-start gap-2.5">
                      <AlertTriangle className="text-red-600 dark:text-red-500 shrink-0 mt-0.5" size={18} />
                      <div>
                        <h6 className="text-xs font-bold text-red-800 dark:text-red-400">
                          Database Version Conflict Blocked Request!
                        </h6>
                        <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                          {conflictMessage.msg}
                        </p>
                        <p className="text-[10px] text-red-600 dark:text-red-400 mt-2 font-mono">
                          Mechanism: The raw SQL background writer increased the ReferralPost version in SQLite to v{Number(booking.post?.version || 0) + 1} before saving. The Sequelize context detected this discrepancy and threw <code>SequelizeOptimisticLockError</code>.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Toolbar for Pending Bookings (Alumni only) */}
              {isAlumni && isPending && (
                <div className="bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-900 px-5 py-3 flex justify-between items-center gap-3">
                  <div className="text-xs text-slate-400 flex items-center gap-1">
                    <Info size={12} />
                    <span>Using version v{booking.post?.version}</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      disabled={processingId !== null}
                      onClick={() => handleAction(booking.id, 'REJECTED')}
                      className="px-3 py-1.5 border border-slate-200 hover:bg-slate-100 dark:border-slate-800 dark:hover:bg-slate-900 text-xs font-semibold text-slate-600 rounded-lg cursor-pointer transition disabled:opacity-50"
                    >
                      Reject Candidate
                    </button>
                    <button
                      disabled={processingId !== null}
                      onClick={() => handleAction(booking.id, 'ACCEPTED')}
                      className={`px-4 py-1.5 text-white text-xs font-semibold rounded-lg cursor-pointer transition flex items-center gap-1 disabled:opacity-50 ${
                        isSimulateChecked
                          ? 'bg-amber-600 hover:bg-amber-500'
                          : 'bg-indigo-600 hover:bg-indigo-500'
                      }`}
                    >
                      <Check size={12} />
                      {processingId === booking.id
                        ? 'Processing...'
                        : isSimulateChecked
                        ? 'Accept (Simulate Conflict)'
                        : 'Accept & Grant Slot'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
