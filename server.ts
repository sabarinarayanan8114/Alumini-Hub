import express from 'express';
import path from 'path';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import { Op } from 'sequelize';
import sequelize from './src/db/db';
import { User, AlumniProfile, StudentProfile, ReferralPost, BookingRequest } from './src/db/models';
import { seedDatabase } from './src/db/seed';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware
  app.use(cors());
  app.use(express.json());

  // Log all incoming requests for debugging
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
  });

  // ==========================================
  // Role & User Simulation Middleware
  // ==========================================
  app.use(async (req: any, res, next) => {
    const userId = req.headers['x-user-id'];
    if (userId) {
      try {
        const user = await User.findByPk(Number(userId), {
          include: [
            { model: AlumniProfile, as: 'alumniProfile' },
            { model: StudentProfile, as: 'studentProfile' }
          ]
        });
        if (user) {
          req.user = user;
        }
      } catch (err) {
        console.error('Error in identity middleware:', err);
      }
    }
    next();
  });

  // ==========================================
  // 1. Authentication / Identity Simulation API
  // ==========================================

  // Get list of all seeded users to allow switching roles easily in the frontend UI
  app.get('/api/auth/users', async (req, res) => {
    try {
      const users = await User.findAll({
        include: [
          { model: AlumniProfile, as: 'alumniProfile' },
          { model: StudentProfile, as: 'studentProfile' }
        ]
      });
      res.json(users);
    } catch (err: any) {
      console.error('Error listing users:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // Get current active user
  app.get('/api/auth/me', async (req: any, res) => {
    if (req.user) {
      res.json(req.user);
    } else {
      res.status(401).json({ error: 'Not authenticated. Please switch identity in the header.' });
    }
  });

  // Register a new user and profile
  app.post('/api/auth/register', async (req, res) => {
    try {
      const { email, name, role, company, jobTitle, graduationYear, linkedinUrl, major, expectedGraduation } = req.body;
      
      if (!email || !name || !role) {
        return res.status(400).json({ error: 'Email, name, and role are required.' });
      }

      const existing = await User.findOne({ where: { email } });
      if (existing) {
        return res.status(400).json({ error: 'User with this email already exists.' });
      }

      const user = await User.create({
        email,
        name,
        provider: 'LOCAL',
        role,
      });

      if (role === 'ALUMNI') {
        await AlumniProfile.create({
          userId: user.id,
          company: company || 'Acme Corp',
          jobTitle: jobTitle || 'Software Engineer',
          graduationYear: Number(graduationYear) || 2026,
          linkedinUrl: linkedinUrl || 'https://linkedin.com/in/demo',
        });
      } else if (role === 'STUDENT') {
        await StudentProfile.create({
          userId: user.id,
          major: major || 'Computer Science',
          expectedGraduation: Number(expectedGraduation) || 2027,
          resumeUrl: '',
        });
      }

      const createdUser = await User.findByPk(user.id, {
        include: [
          { model: AlumniProfile, as: 'alumniProfile' },
          { model: StudentProfile, as: 'studentProfile' }
        ]
      });

      res.status(201).json(createdUser);
    } catch (err: any) {
      console.error('Error registering user:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // ==========================================
  // 2. Profile API
  // ==========================================

  // Update current user profile
  app.put('/api/profile', async (req: any, res) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required. Set x-user-id.' });
    }

    try {
      const { name, company, jobTitle, graduationYear, linkedinUrl, major, expectedGraduation, resumeUrl } = req.body;
      
      // Update User name
      if (name) {
        req.user.name = name;
        await req.user.save();
      }

      if (req.user.role === 'ALUMNI' && req.user.alumniProfile) {
        const profile = req.user.alumniProfile;
        profile.company = company || profile.company;
        profile.jobTitle = jobTitle || profile.jobTitle;
        profile.graduationYear = graduationYear ? Number(graduationYear) : profile.graduationYear;
        profile.linkedinUrl = linkedinUrl || profile.linkedinUrl;
        await profile.save();
      } else if (req.user.role === 'STUDENT' && req.user.studentProfile) {
        const profile = req.user.studentProfile;
        profile.major = major || profile.major;
        profile.expectedGraduation = expectedGraduation ? Number(expectedGraduation) : profile.expectedGraduation;
        profile.resumeUrl = resumeUrl !== undefined ? resumeUrl : profile.resumeUrl;
        await profile.save();
      }

      const updatedUser = await User.findByPk(req.user.id, {
        include: [
          { model: AlumniProfile, as: 'alumniProfile' },
          { model: StudentProfile, as: 'studentProfile' }
        ]
      });

      res.json(updatedUser);
    } catch (err: any) {
      console.error('Error updating profile:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // ==========================================
  // 3. Referral Posts API (Browse and Search)
  // ==========================================

  // GET posts with robust SQL Pagination, Filtering, and Joins
  app.get('/api/posts', async (req, res) => {
    try {
      const page = Math.max(1, Number(req.query.page) || 1);
      const limit = Math.max(1, Number(req.query.limit) || 5);
      const offset = (page - 1) * limit;

      const { type, search } = req.query;

      const whereClause: any = {};
      
      // Filter by offer type
      if (type === 'REFERRAL' || type === 'MOCK_INTERVIEW') {
        whereClause.type = type;
      }

      // Base include structure to pull in alumni profiles and associated users
      const alumniInclude: any = {
        model: AlumniProfile,
        as: 'alumni',
        required: true,
        include: [{ model: User, as: 'user', required: true, attributes: ['name', 'email'] }]
      };

      // Handle search queries across descriptions, companies, job titles, or alumni names
      if (search) {
        const searchStr = `%${search}%`;
        whereClause[Op.or] = [
          { description: { [Op.like]: searchStr } },
          { '$alumni.company$': { [Op.like]: searchStr } },
          { '$alumni.jobTitle$': { [Op.like]: searchStr } },
          { '$alumni.user.name$': { [Op.like]: searchStr } }
        ];
      }

      const { count, rows } = await ReferralPost.findAndCountAll({
        where: whereClause,
        include: [alumniInclude],
        limit,
        offset,
        order: [['createdAt', 'DESC']],
        subQuery: false, // Ensure MySQL/SQLite compiles pagination and joins correctly
      });

      res.json({
        posts: rows,
        totalCount: count,
        currentPage: page,
        totalPages: Math.ceil(count / limit),
      });
    } catch (err: any) {
      console.error('Error fetching posts:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // GET single post details
  app.get('/api/posts/:id', async (req, res) => {
    try {
      const post = await ReferralPost.findByPk(req.params.id, {
        include: [
          {
            model: AlumniProfile,
            as: 'alumni',
            include: [{ model: User, as: 'user', attributes: ['name', 'email'] }]
          }
        ]
      });

      if (!post) {
        return res.status(404).json({ error: 'Post not found.' });
      }

      res.json(post);
    } catch (err: any) {
      console.error('Error fetching single post:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // POST create a new referral or mock interview slot (ALUMNI only)
  app.post('/api/posts', async (req: any, res) => {
    if (!req.user || req.user.role !== 'ALUMNI' || !req.user.alumniProfile) {
      return res.status(403).json({ error: 'Only alumni profiles can create referral/interview slots.' });
    }

    try {
      const { type, description, totalSlots } = req.body;
      
      if (!type || !description || totalSlots === undefined) {
        return res.status(400).json({ error: 'Type, description, and totalSlots are required.' });
      }

      const slotsNum = Number(totalSlots);
      if (isNaN(slotsNum) || slotsNum <= 0) {
        return res.status(400).json({ error: 'Total slots must be a positive integer.' });
      }

      const post = await ReferralPost.create({
        alumniId: req.user.alumniProfile.id,
        type,
        description,
        totalSlots: slotsNum,
        availableSlots: slotsNum,
        version: 0,
      });

      res.status(201).json(post);
    } catch (err: any) {
      console.error('Error creating referral post:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // ==========================================
  // 4. Booking Requests API & OPTIMISTIC LOCKING
  // ==========================================

  // POST book a slot (STUDENT only)
  app.post('/api/posts/:id/book', async (req: any, res) => {
    if (!req.user || req.user.role !== 'STUDENT' || !req.user.studentProfile) {
      return res.status(403).json({ error: 'Only registered student profiles can book slots.' });
    }

    try {
      const postId = Number(req.params.id);
      const { studentNotes } = req.body;

      const post = await ReferralPost.findByPk(postId);
      if (!post) {
        return res.status(404).json({ error: 'Slot post not found.' });
      }

      if (post.availableSlots <= 0) {
        return res.status(400).json({ error: 'This post has no available slots left.' });
      }

      // Check if student already requested a booking for this specific post
      const existing = await BookingRequest.findOne({
        where: {
          postId,
          studentId: req.user.studentProfile.id
        }
      });

      if (existing) {
        return res.status(400).json({ error: 'You have already requested a booking for this offer.' });
      }

      const booking = await BookingRequest.create({
        postId,
        studentId: req.user.studentProfile.id,
        status: 'PENDING',
        studentNotes: studentNotes || '',
      });

      res.status(201).json(booking);
    } catch (err: any) {
      console.error('Error booking slot:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // GET bookings for current user
  app.get('/api/bookings', async (req: any, res) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required. Set x-user-id.' });
    }

    try {
      if (req.user.role === 'ALUMNI' && req.user.alumniProfile) {
        // Fetch bookings for slots created by this alumni
        const bookings = await BookingRequest.findAll({
          include: [
            {
              model: ReferralPost,
              as: 'post',
              where: { alumniId: req.user.alumniProfile.id }
            },
            {
              model: StudentProfile,
              as: 'student',
              include: [{ model: User, as: 'user', attributes: ['name', 'email'] }]
            }
          ],
          order: [['createdAt', 'DESC']]
        });
        res.json(bookings);
      } else if (req.user.role === 'STUDENT' && req.user.studentProfile) {
        // Fetch bookings requested by this student
        const bookings = await BookingRequest.findAll({
          where: { studentId: req.user.studentProfile.id },
          include: [
            {
              model: ReferralPost,
              as: 'post',
              include: [
                {
                  model: AlumniProfile,
                  as: 'alumni',
                  include: [{ model: User, as: 'user', attributes: ['name', 'email'] }]
                }
              ]
            }
          ],
          order: [['createdAt', 'DESC']]
        });
        res.json(bookings);
      } else {
        res.json([]);
      }
    } catch (err: any) {
      console.error('Error fetching bookings:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // PUT update booking status (ALUMNI only - accept/reject)
  // Demonstrates OPTIMISTIC LOCKING when accepting and decrementing slot counts
  app.put('/api/bookings/:id/status', async (req: any, res) => {
    if (!req.user || req.user.role !== 'ALUMNI' || !req.user.alumniProfile) {
      return res.status(403).json({ error: 'Only alumni can approve/reject booking requests.' });
    }

    const bookingId = Number(req.params.id);
    const { status, simulateConflict } = req.body;

    if (!status || !['ACCEPTED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ error: "Status must be 'ACCEPTED' or 'REJECTED'." });
    }

    try {
      const booking = await BookingRequest.findByPk(bookingId, {
        include: [{ model: ReferralPost, as: 'post' }]
      });

      if (!booking) {
        return res.status(404).json({ error: 'Booking request not found.' });
      }

      const post = booking.post;
      if (!post) {
        return res.status(404).json({ error: 'Associated offer post not found.' });
      }

      if (post.alumniId !== req.user.alumniProfile.id) {
        return res.status(403).json({ error: 'You are not authorized to moderate booking requests for this offer.' });
      }

      if (booking.status !== 'PENDING') {
        return res.status(400).json({ error: 'This booking request has already been processed.' });
      }

      if (status === 'ACCEPTED') {
        if (post.availableSlots <= 0) {
          return res.status(400).json({ error: 'No slots available left to accept this booking!' });
        }

        // Decrement the slot count on our in-memory model representation
        post.availableSlots -= 1;

        // If requested, simulate an out-of-sync concurrency update!
        if (simulateConflict) {
          console.log(`[CONCURRENCY LOCK SIMULATOR] Direct MySQL/SQLite query updating ReferralPost version on DB before save...`);
          // Directly increment the version and decrement availableSlots in the DB using raw SQL.
          // This makes the in-memory 'post' model's 'version' attribute stale!
          await sequelize.query(
            `UPDATE ReferralPosts SET version = version + 1, availableSlots = availableSlots - 1, updatedAt = datetime('now') WHERE id = ${post.id}`
          );
        }

        // Save the post.
        // Since { version: true } is configured, Sequelize executes an UPDATE where version = post.version.
        // If the database version is higher (due to simulateConflict or a parallel request),
        // it throws a "SequelizeOptimisticLockError".
        await post.save();
      }

      // Update the booking request status
      booking.status = status;
      await booking.save();

      res.json({
        success: true,
        booking,
        post,
      });
    } catch (err: any) {
      console.error('Error processing booking status:', err);
      
      if (err.name === 'SequelizeOptimisticLockError') {
        return res.status(409).json({
          error: 'CONCURRENCY_CONFLICT',
          message: 'Optimistic Locking triggered! The slot post was modified by another concurrent request. Your operation was aborted to prevent over-allocation of slots. Please reload the dashboard and try again.'
        });
      }

      res.status(500).json({ error: err.message });
    }
  });

  // ==========================================
  // Vite Server Middleware Setup & DB Sync
  // ==========================================

  // Authenticate and sync the database
  try {
    console.log('Synchronizing database models with SQLite...');
    await sequelize.authenticate();
    await sequelize.sync(); // Create tables if they do not exist
    await seedDatabase();   // Seed with demo accounts and data
  } catch (dbErr) {
    console.error('Database connection or syncing failed:', dbErr);
  }

  // Development VS Production Assets Serving
  if (process.env.NODE_ENV !== "production") {
    console.log('Starting server in development mode with Vite middleware...');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log('Starting server in production mode...');
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Bind to host 0.0.0.0 and port 3000
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Alumni Referral Hub backend running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
