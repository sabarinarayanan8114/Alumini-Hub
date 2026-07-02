import { User, AlumniProfile, StudentProfile, ReferralPost, BookingRequest } from './models';

export async function seedDatabase() {
  try {
    const userCount = await User.count();
    if (userCount > 0) {
      console.log('Database already has data. Skipping seeding.');
      return;
    }

    console.log('Starting database seeding...');

    // 1. Create Users
    // --- Alumni ---
    const userElena = await User.create({
      email: 'elena.rostova@techcorp.com',
      name: 'Elena Rostova',
      provider: 'LOCAL',
      role: 'ALUMNI',
    });

    const userMarcus = await User.create({
      email: 'marcus.chen@mediastream.com',
      name: 'Marcus Chen',
      provider: 'LINKEDIN',
      role: 'ALUMNI',
    });

    const userSarah = await User.create({
      email: 'sarah.jenkins@financehub.com',
      name: 'Sarah Jenkins',
      provider: 'LOCAL',
      role: 'ALUMNI',
    });

    // --- Students ---
    const userAlex = await User.create({
      email: 'alex.patel@stateuni.edu',
      name: 'Alex Patel',
      provider: 'LOCAL',
      role: 'STUDENT',
    });

    const userZoe = await User.create({
      email: 'zoe.martinez@techinstitute.edu',
      name: 'Zoe Martinez',
      provider: 'GOOGLE',
      role: 'STUDENT',
    });

    // 2. Create Alumni Profiles
    const profileElena = await AlumniProfile.create({
      userId: userElena.id,
      company: 'Google',
      jobTitle: 'Senior Software Engineer, Google Cloud',
      graduationYear: 2018,
      linkedinUrl: 'https://linkedin.com/in/elena-rostova-demo',
    });

    const profileMarcus = await AlumniProfile.create({
      userId: userMarcus.id,
      company: 'Netflix',
      jobTitle: 'Staff UI Engineer',
      graduationYear: 2016,
      linkedinUrl: 'https://linkedin.com/in/marcus-chen-demo',
    });

    const profileSarah = await AlumniProfile.create({
      userId: userSarah.id,
      company: 'Stripe',
      jobTitle: 'Backend Engineering Lead',
      graduationYear: 2019,
      linkedinUrl: 'https://linkedin.com/in/sarah-jenkins-demo',
    });

    // 3. Create Student Profiles
    const profileAlex = await StudentProfile.create({
      userId: userAlex.id,
      major: 'Computer Science & Engineering',
      expectedGraduation: 2027,
      resumeUrl: 'https://drive.google.com/file/d/alex-patel-resume/view',
    });

    const profileZoe = await StudentProfile.create({
      userId: userZoe.id,
      major: 'Data Science & Artificial Intelligence',
      expectedGraduation: 2026,
      resumeUrl: 'https://drive.google.com/file/d/zoe-martinez-resume/view',
    });

    // 4. Create Referral Posts (Offers)
    // --- Elena's Offers ---
    const postElena1 = await ReferralPost.create({
      alumniId: profileElena.id,
      type: 'REFERRAL',
      description: 'Offering referrals for full-time Software Engineer (L3/L4) and Site Reliability Engineer (SRE) roles globally. I can review your resume and write an internal endorsement if we align. Please include your targeted role link.',
      totalSlots: 5,
      availableSlots: 4,
    });

    const postElena2 = await ReferralPost.create({
      alumniId: profileElena.id,
      type: 'MOCK_INTERVIEW',
      description: 'System Design & Coding Mock Interview. Focusing on scalable web servers, distributed caching, and algorithmic challenges. I will provide written feedback on your performance.',
      totalSlots: 2,
      availableSlots: 2,
    });

    // --- Marcus's Offers ---
    const postMarcus1 = await ReferralPost.create({
      alumniId: profileMarcus.id,
      type: 'REFERRAL',
      description: 'Netflix Front-End and UI Engineer referrals. Looking for candidates with strong JavaScript/React fundamentals and performance tuning knowledge. Let me help get your resume in front of recruiters.',
      totalSlots: 3,
      availableSlots: 1,
    });

    const postMarcus2 = await ReferralPost.create({
      alumniId: profileMarcus.id,
      type: 'MOCK_INTERVIEW',
      description: 'Front-End Mock Interview. Focuses on React architecture, Web Performance, CSS Layouts, and dynamic UI systems. 45-minute technical session + 15-minute feedback.',
      totalSlots: 3,
      availableSlots: 3,
    });

    // --- Sarah's Offers ---
    const postSarah1 = await ReferralPost.create({
      alumniId: profileSarah.id,
      type: 'REFERRAL',
      description: 'Stripe API / Backend engineering referrals. If you love building elegant infrastructure, API design, and highly available systems, Stripe is hiring. I will share tips for the technical phone screen.',
      totalSlots: 4,
      availableSlots: 4,
    });

    // 5. Create some seed bookings
    // Zoe Martinez books Elena's Referral Post
    await BookingRequest.create({
      postId: postElena1.id,
      studentId: profileZoe.id,
      status: 'PENDING',
      studentNotes: 'Hi Elena! I am very interested in the Software Engineer role on the Google Cloud team. I have completed two internships and love cloud architecture. Here is my resume link, and I look forward to your guidance!',
    });

    // Alex Patel books Marcus's Referral Post (Already accepted to demonstrate history)
    await BookingRequest.create({
      postId: postMarcus1.id,
      studentId: profileAlex.id,
      status: 'ACCEPTED',
      studentNotes: 'Hello Marcus, I am a huge fan of Netflix engineering culture! I have a strong foundation in React and web animations. I hope to get considered for the front-end internship program.',
    });

    // Alex Patel also books Marcus's Mock Interview (Pending)
    await BookingRequest.create({
      postId: postMarcus2.id,
      studentId: profileAlex.id,
      status: 'PENDING',
      studentNotes: 'I would love to practice React and Web performance questions with you, Marcus! Preparing for my upcoming technical screens.',
    });

    console.log('Database successfully seeded with mock data!');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
}
