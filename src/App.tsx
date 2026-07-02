import { useState, useEffect, FormEvent } from 'react';
import { User, ReferralPost, BookingRequest } from './types';
import IdentitySelector from './components/IdentitySelector';
import OfferForm from './components/OfferForm';
import PostCard from './components/PostCard';
import BookingList from './components/BookingList';
import ProfileForm from './components/ProfileForm';
import { 
  Briefcase, 
  GraduationCap, 
  Search, 
  SlidersHorizontal, 
  ChevronLeft, 
  ChevronRight, 
  ListFilter,
  Users,
  CheckSquare,
  Sparkles,
  Award
} from 'lucide-react';

export default function App() {
  // Application State
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'browse' | 'bookings' | 'profile' | 'create'>('browse');
  
  // Posts & Search/Filter State
  const [posts, setPosts] = useState<ReferralPost[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'REFERRAL' | 'MOCK_INTERVIEW'>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPosts, setTotalPosts] = useState(0);
  const [isPostsLoading, setIsPostsLoading] = useState(false);

  // Bookings State
  const [bookings, setBookings] = useState<BookingRequest[]>([]);
  const [isBookingsLoading, setIsBookingsLoading] = useState(false);

  // Initialize: Load seeded users
  useEffect(() => {
    fetchUsers();
  }, []);

  // Fetch active user details when selected user changes
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('alumni_sim_user_id', String(currentUser.id));
      fetchBookings();
    } else {
      // Clear bookings
      setBookings([]);
    }
    // Return to browse when switching profiles to see the relevant views
    setActiveTab('browse');
  }, [currentUser?.id]);

  // Fetch posts when pagination/filters change
  useEffect(() => {
    fetchPosts();
  }, [currentPage, searchQuery, filterType]);

  // ==========================================
  // API Core Calls
  // ==========================================

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/auth/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
        
        // Auto-select first user (Elena Rostova - ALUMNI) if none selected yet
        const savedId = localStorage.getItem('alumni_sim_user_id');
        const defaultUser = savedId 
          ? data.find((u: User) => u.id === Number(savedId)) 
          : data[0];
        
        if (defaultUser) {
          setCurrentUser(defaultUser);
        }
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
    }
  };

  const handleSelectUser = (userId: number) => {
    const selected = users.find(u => u.id === userId);
    if (selected) {
      setCurrentUser(selected);
    }
  };

  const handleRegisterUser = async (registrationData: any): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registrationData),
      });
      if (res.ok) {
        const newUser = await res.json();
        // Update user pool
        setUsers(prev => [...prev, newUser]);
        // Login as new user
        setCurrentUser(newUser);
        return true;
      }
    } catch (err) {
      console.error('Failed to register user:', err);
    }
    return false;
  };

  const fetchPosts = async () => {
    setIsPostsLoading(true);
    try {
      let url = `/api/posts?page=${currentPage}&limit=5`;
      if (filterType !== 'ALL') {
        url += `&type=${filterType}`;
      }
      if (searchQuery.trim()) {
        url += `&search=${encodeURIComponent(searchQuery.trim())}`;
      }

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts);
        setTotalPages(data.totalPages);
        setTotalPosts(data.totalCount);
      }
    } catch (err) {
      console.error('Failed to fetch posts:', err);
    } finally {
      setIsPostsLoading(false);
    }
  };

  const fetchBookings = async () => {
    if (!currentUser) return;
    setIsBookingsLoading(true);
    try {
      const res = await fetch('/api/bookings', {
        headers: {
          'x-user-id': String(currentUser.id),
        }
      });
      if (res.ok) {
        const data = await res.json();
        setBookings(data);
      }
    } catch (err) {
      console.error('Failed to fetch bookings:', err);
    } finally {
      setIsBookingsLoading(false);
    }
  };

  const handleUpdateProfile = async (profileData: any): Promise<boolean> => {
    if (!currentUser) return false;
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': String(currentUser.id),
        },
        body: JSON.stringify(profileData),
      });

      if (res.ok) {
        const updatedUser = await res.json();
        // Update current user state
        setCurrentUser(updatedUser);
        // Update user pool
        setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
        return true;
      }
    } catch (err) {
      console.error('Failed to update profile:', err);
    }
    return false;
  };

  const handleCreateOffer = async (
    type: 'REFERRAL' | 'MOCK_INTERVIEW',
    description: string,
    totalSlots: number
  ): Promise<boolean> => {
    if (!currentUser) return false;
    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': String(currentUser.id),
        },
        body: JSON.stringify({ type, description, totalSlots }),
      });

      if (res.ok) {
        // Reload posts and redirect to browse
        setCurrentPage(1);
        fetchPosts();
        setActiveTab('browse');
        return true;
      }
    } catch (err) {
      console.error('Failed to create offer:', err);
    }
    return false;
  };

  const handleBookPost = async (postId: number, notes: string): Promise<boolean> => {
    if (!currentUser) return false;
    try {
      const res = await fetch(`/api/posts/${postId}/book`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': String(currentUser.id),
        },
        body: JSON.stringify({ studentNotes: notes }),
      });

      if (res.ok) {
        // Refresh bookings and posts
        fetchBookings();
        fetchPosts();
        return true;
      }
    } catch (err) {
      console.error('Failed to book post:', err);
    }
    return false;
  };

  const handleUpdateBookingStatus = async (
    bookingId: number,
    status: 'ACCEPTED' | 'REJECTED',
    simulateConflict?: boolean
  ): Promise<{ success: boolean; errorType?: string; errorMessage?: string }> => {
    if (!currentUser) return { success: false };
    try {
      const res = await fetch(`/api/bookings/${bookingId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': String(currentUser.id),
        },
        body: JSON.stringify({ status, simulateConflict }),
      });

      const data = await res.json();

      if (res.ok) {
        // Refresh bookings & post state
        fetchBookings();
        fetchPosts();
        return { success: true };
      } else {
        return {
          success: false,
          errorType: data.error,
          errorMessage: data.message
        };
      }
    } catch (err: any) {
      console.error('Failed to update booking status:', err);
      return { success: false, errorMessage: err.message };
    }
  };

  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    setSearchQuery(searchInput);
  };

  const isAlumni = currentUser?.role === 'ALUMNI';
  const isStudent = currentUser?.role === 'STUDENT';

  // Helper: check if student has booked a specific post
  const getStudentBookingStatusForPost = (postId: number) => {
    const booking = bookings.find(b => b.postId === postId);
    return booking ? { hasBooked: true, status: booking.status } : { hasBooked: false };
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
      {/* 1. Global Navigation Top Header */}
      <header className="bg-slate-900 text-white shadow-md border-b border-slate-850 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo Brand Title */}
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-600 rounded-xl text-white">
              <Award size={20} />
            </div>
            <div>
              <h1 className="font-bold text-base leading-none tracking-tight">Alumni Referral Hub</h1>
              <p className="text-[10px] text-slate-400 mt-0.5">Sequelize Concurrency Playground</p>
            </div>
          </div>

          {/* Identity Simulation Selector */}
          <div className="flex items-center gap-3">
            <IdentitySelector
              users={users}
              currentUser={currentUser}
              onSelectUser={handleSelectUser}
              onRegisterUser={handleRegisterUser}
            />
          </div>
        </div>
      </header>

      {/* 2. Top Stats Bar / Hero Widget */}
      {currentUser && (
        <section className="bg-white border-b border-slate-200 py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Welcome Back</span>
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-1.5">
                  {currentUser.name}
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    isAlumni ? 'bg-emerald-50 text-emerald-700' : 'bg-indigo-50 text-indigo-700'
                  }`}>
                    {currentUser.role}
                  </span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {isAlumni && currentUser.alumniProfile 
                    ? `Moderating slots for ${currentUser.alumniProfile.jobTitle} at ${currentUser.alumniProfile.company}`
                    : isStudent && currentUser.studentProfile
                    ? `Browsing opportunities for ${currentUser.studentProfile.major}`
                    : 'Configure your profile details below to get started'}
                </p>
              </div>

              {/* Status Counters */}
              <div className="flex items-center gap-4">
                <div className="px-4 py-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Available Slots</span>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <span className="text-xl font-bold text-slate-850 dark:text-slate-100">{totalPosts}</span>
                    <span className="text-xs text-slate-500 font-medium">Offers</span>
                  </div>
                </div>

                <div className="px-4 py-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">My Bookings</span>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <span className="text-xl font-bold text-slate-850 dark:text-slate-100">{bookings.length}</span>
                    <span className="text-xs text-slate-500 font-medium">Requests</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 3. Main Dashboard Body Grid */}
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Navigation Tabs and Content */}
        <div className="space-y-6">
          {/* Section Tabs */}
          <div className="flex border-b border-slate-200">
            <button
              onClick={() => setActiveTab('browse')}
              className={`py-3 px-5 text-sm font-medium border-b-2 transition -mb-px cursor-pointer ${
                activeTab === 'browse'
                  ? 'border-slate-900 text-slate-900 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Browse Slots ({totalPosts})
            </button>
            <button
              onClick={() => setActiveTab('bookings')}
              className={`py-3 px-5 text-sm font-medium border-b-2 transition -mb-px cursor-pointer ${
                activeTab === 'bookings'
                  ? 'border-slate-900 text-slate-900 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Bookings Dashboard ({bookings.length})
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`py-3 px-5 text-sm font-medium border-b-2 transition -mb-px cursor-pointer ${
                activeTab === 'profile'
                  ? 'border-slate-900 text-slate-900 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              My Profile
            </button>
            {isAlumni && (
              <button
                onClick={() => setActiveTab('create')}
                className={`py-3 px-5 text-sm font-medium border-b-2 transition -mb-px cursor-pointer ${
                  activeTab === 'create'
                    ? 'border-slate-900 text-slate-900 font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Create Slots Offer
              </button>
            )}
          </div>

          {/* Tab Panels */}
          {activeTab === 'browse' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Filter Sidebar */}
              <div className="lg:col-span-4 space-y-4">
                <div className="bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 p-5 rounded-xl shadow-xs">
                  <div className="flex items-center gap-1.5 mb-4">
                    <SlidersHorizontal size={14} className="text-slate-500" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Search & Filters</h3>
                  </div>

                  <form onSubmit={handleSearchSubmit} className="space-y-4">
                    {/* Keywords Search */}
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">Company or Keyword</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={searchInput}
                          onChange={(e) => setSearchInput(e.target.value)}
                          placeholder="Search Google, React..."
                          className="w-full text-xs pl-8 pr-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
                        />
                        <Search size={14} className="absolute left-2.5 top-3 text-slate-400" />
                      </div>
                    </div>

                    {/* Filter Type */}
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">Category</label>
                      <div className="space-y-1">
                        {[
                          { value: 'ALL', label: 'All Categories' },
                          { value: 'REFERRAL', label: 'Job Referrals' },
                          { value: 'MOCK_INTERVIEW', label: 'Mock Interviews' },
                        ].map((opt) => (
                          <label key={opt.value} className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 py-1 cursor-pointer">
                            <input
                              type="radio"
                              name="filterType"
                              value={opt.value}
                              checked={filterType === opt.value}
                              onChange={() => {
                                setFilterType(opt.value as any);
                                setCurrentPage(1);
                              }}
                              className="text-indigo-600 focus:ring-indigo-500"
                            />
                            <span>{opt.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white text-xs font-bold py-2 rounded-lg cursor-pointer transition text-center block"
                    >
                      Apply Filter
                    </button>
                  </form>
                </div>

                {/* Optimistic locking explanation box */}
                <div className="p-5 bg-indigo-50/40 border border-indigo-100 dark:bg-indigo-950/10 dark:border-indigo-900/50 rounded-xl space-y-2.5">
                  <div className="flex items-center gap-1.5 text-indigo-700 dark:text-indigo-400">
                    <SlidersHorizontal size={14} />
                    <h4 className="text-xs font-bold uppercase tracking-wider">How to Test Concurrency</h4>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    This platform uses **Sequelize version-based optimistic locking** (via <code>version: true</code>). To see it:
                  </p>
                  <ol className="text-[11px] text-slate-500 list-decimal list-inside space-y-1 pl-1">
                    <li>Simulate a student request on a slot.</li>
                    <li>Switch persona to the host Alumni in the header.</li>
                    <li>Go to **Bookings** tab, toggle "Force Version Conflict".</li>
                    <li>Click Accept request and observe database block.</li>
                  </ol>
                </div>
              </div>

              {/* Right Column: Listing Cards */}
              <div className="lg:col-span-8 space-y-5">
                {isPostsLoading ? (
                  <div className="py-20 text-center">
                    <p className="text-sm text-slate-500">Loading slot offers...</p>
                  </div>
                ) : posts.length === 0 ? (
                  <div className="bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl p-12 text-center shadow-xs">
                    <p className="text-sm text-slate-500">No slot offers match your criteria.</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-4">
                      {posts.map((post) => {
                        const { hasBooked, status } = getStudentBookingStatusForPost(post.id);
                        return (
                          <PostCard
                            key={post.id}
                            post={post}
                            currentUser={currentUser}
                            onBookPost={handleBookPost}
                            hasBooked={hasBooked}
                            bookingStatus={status}
                          />
                        );
                      })}
                    </div>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                      <div className="flex justify-between items-center bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 px-5 py-3 rounded-xl shadow-xs">
                        <span className="text-xs text-slate-500">
                          Page {currentPage} of {totalPages}
                        </span>
                        <div className="flex gap-2">
                          <button
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            className="p-1.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg text-slate-500 disabled:opacity-30 cursor-pointer"
                          >
                            <ChevronLeft size={16} />
                          </button>
                          <button
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            className="p-1.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg text-slate-500 disabled:opacity-30 cursor-pointer"
                          >
                            <ChevronRight size={16} />
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {activeTab === 'bookings' && (
            <div>
              {isBookingsLoading ? (
                <div className="py-20 text-center">
                  <p className="text-sm text-slate-500">Loading bookings dashboard...</p>
                </div>
              ) : (
                <BookingList
                  bookings={bookings}
                  currentUser={currentUser}
                  onUpdateStatus={handleUpdateBookingStatus}
                />
              )}
            </div>
          )}

          {activeTab === 'profile' && (
            <ProfileForm
              currentUser={currentUser}
              onUpdateProfile={handleUpdateProfile}
            />
          )}

          {activeTab === 'create' && isAlumni && (
            <OfferForm
              onOfferCreated={handleCreateOffer}
            />
          )}
        </div>
      </main>

      {/* 4. Humble and Clean Page Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-400 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p>© 2026 Alumni Referral Hub. Powered by Sequelize, Express, and React.</p>
        </div>
      </footer>
    </div>
  );
}
