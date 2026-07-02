import { useState, FormEvent } from 'react';
import { Send, Sparkles, CheckSquare } from 'lucide-react';

interface OfferFormProps {
  onOfferCreated: (type: 'REFERRAL' | 'MOCK_INTERVIEW', description: string, totalSlots: number) => Promise<boolean>;
}

export default function OfferForm({ onOfferCreated }: OfferFormProps) {
  const [type, setType] = useState<'REFERRAL' | 'MOCK_INTERVIEW'>('REFERRAL');
  const [description, setDescription] = useState('');
  const [totalSlots, setTotalSlots] = useState(3);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!description.trim()) {
      setMessage({ text: 'Please write a description explaining what you are offering.', isError: true });
      return;
    }

    if (totalSlots <= 0) {
      setMessage({ text: 'Please offer at least 1 slot.', isError: true });
      return;
    }

    setIsSubmitting(true);
    const success = await onOfferCreated(type, description, totalSlots);
    setIsSubmitting(false);

    if (success) {
      setDescription('');
      setTotalSlots(3);
      setMessage({ text: 'Slot created and posted successfully!', isError: false });
      // Reset success message after 3 seconds
      setTimeout(() => setMessage(null), 3000);
    } else {
      setMessage({ text: 'Failed to create slot. Please check your connection and try again.', isError: true });
    }
  };

  return (
    <div className="bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 rounded-lg">
          <Sparkles size={18} />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Post a Referral / Interview Slot</h2>
          <p className="text-xs text-slate-500">Share your bandwidth to help college students unlock opportunities</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {message && (
          <div
            className={`p-3 rounded-lg text-xs font-medium border ${
              message.isError
                ? 'bg-red-50 text-red-600 border-red-100 dark:bg-red-950/10 dark:border-red-900/50 dark:text-red-400'
                : 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/10 dark:border-emerald-900/50 dark:text-emerald-400'
            }`}
          >
            {message.text}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Slot Type</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setType('REFERRAL')}
              className={`py-3 px-4 text-sm font-medium rounded-xl border-2 transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                type === 'REFERRAL'
                  ? 'border-indigo-600 bg-indigo-50/20 text-indigo-700 dark:border-indigo-500 dark:text-indigo-400'
                  : 'border-slate-100 hover:border-slate-200 dark:border-slate-900 text-slate-600 dark:text-slate-400 dark:hover:border-slate-800'
              }`}
            >
              <CheckSquare size={16} />
              <span>Job Referral Slot</span>
            </button>
            <button
              type="button"
              onClick={() => setType('MOCK_INTERVIEW')}
              className={`py-3 px-4 text-sm font-medium rounded-xl border-2 transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                type === 'MOCK_INTERVIEW'
                  ? 'border-indigo-600 bg-indigo-50/20 text-indigo-700 dark:border-indigo-500 dark:text-indigo-400'
                  : 'border-slate-100 hover:border-slate-200 dark:border-slate-900 text-slate-600 dark:text-slate-400 dark:hover:border-slate-800'
              }`}
            >
              <CheckSquare size={16} />
              <span>Mock Interview Session</span>
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Description / Requirements
          </label>
          <textarea
            rows={4}
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={
              type === 'REFERRAL'
                ? 'Explain which roles or locations you can refer for. Example: "Referrals for Google Cloud L3/L4 roles. Please link your target job ID and upload a resume with relevant cloud projects."'
                : 'Describe the interview format. Example: "45-minute Front-End React & System Design mock interview. Focusing on state machines, performance profiling, and web security."'
            }
            className="w-full text-sm px-4 py-3 border border-slate-200 dark:border-slate-850 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Total Slots Available
          </label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min="1"
              max="50"
              required
              value={totalSlots}
              onChange={(e) => setTotalSlots(Math.max(1, Number(e.target.value)))}
              className="w-32 text-sm px-4 py-2.5 border border-slate-200 dark:border-slate-850 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
            <span className="text-xs text-slate-500">
              {type === 'REFERRAL' ? 'Number of candidate referrals you can submit.' : 'Number of practice sessions you can conduct.'}
            </span>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white font-medium py-3 rounded-xl text-sm transition duration-150 flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
        >
          <Send size={14} />
          {isSubmitting ? 'Posting Offer...' : 'Post Offer'}
        </button>
      </form>
    </div>
  );
}
