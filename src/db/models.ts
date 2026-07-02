import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from './db';

// ==========================================
// 1. User Model
// ==========================================
export interface UserAttributes {
  id?: number;
  email: string;
  name: string;
  provider: 'GOOGLE' | 'LINKEDIN' | 'LOCAL';
  providerId?: string;
  role: 'STUDENT' | 'ALUMNI' | null;
}

export class User extends Model<UserAttributes, Optional<UserAttributes, 'id'>> implements UserAttributes {
  public id!: number;
  public email!: string;
  public name!: string;
  public provider!: 'GOOGLE' | 'LINKEDIN' | 'LOCAL';
  public providerId!: string;
  public role!: 'STUDENT' | 'ALUMNI' | null;
}

User.init({
  email: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  provider: {
    type: DataTypes.ENUM('GOOGLE', 'LINKEDIN', 'LOCAL'),
    defaultValue: 'LOCAL',
    allowNull: false,
  },
  providerId: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  role: {
    type: DataTypes.ENUM('STUDENT', 'ALUMNI'),
    allowNull: true,
  }
}, {
  sequelize,
  modelName: 'User',
});

// ==========================================
// 2. Alumni Profile Model
// ==========================================
export interface AlumniProfileAttributes {
  id?: number;
  userId: number;
  company: string;
  jobTitle: string;
  graduationYear: number;
  linkedinUrl: string;
}

export class AlumniProfile extends Model<AlumniProfileAttributes, Optional<AlumniProfileAttributes, 'id'>> implements AlumniProfileAttributes {
  public id!: number;
  public userId!: number;
  public company!: string;
  public jobTitle!: string;
  public graduationYear!: number;
  public linkedinUrl!: string;
}

AlumniProfile.init({
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
  },
  company: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  jobTitle: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  graduationYear: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  linkedinUrl: {
    type: DataTypes.STRING,
    allowNull: false,
  }
}, {
  sequelize,
  modelName: 'AlumniProfile',
});

// ==========================================
// 3. Student Profile Model
// ==========================================
export interface StudentProfileAttributes {
  id?: number;
  userId: number;
  major: string;
  expectedGraduation: number;
  resumeUrl?: string;
}

export class StudentProfile extends Model<StudentProfileAttributes, Optional<StudentProfileAttributes, 'id'>> implements StudentProfileAttributes {
  public id!: number;
  public userId!: number;
  public major!: string;
  public expectedGraduation!: number;
  public resumeUrl!: string;
}

StudentProfile.init({
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
  },
  major: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  expectedGraduation: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  resumeUrl: {
    type: DataTypes.STRING,
    allowNull: true,
  }
}, {
  sequelize,
  modelName: 'StudentProfile',
});

// ==========================================
// 4. Referral Post Model (with Optimistic Locking)
// ==========================================
export interface ReferralPostAttributes {
  id?: number;
  alumniId: number;
  type: 'REFERRAL' | 'MOCK_INTERVIEW';
  description: string;
  totalSlots: number;
  availableSlots: number;
  version?: number;
}

export class ReferralPost extends Model<ReferralPostAttributes, Optional<ReferralPostAttributes, 'id'>> implements ReferralPostAttributes {
  public id!: number;
  public alumniId!: number;
  public type!: 'REFERRAL' | 'MOCK_INTERVIEW';
  public description!: string;
  public totalSlots!: number;
  public availableSlots!: number;
  public version!: number;

  // Add associations for typing
  public alumni?: AlumniProfile;
}

ReferralPost.init({
  alumniId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  type: {
    type: DataTypes.ENUM('REFERRAL', 'MOCK_INTERVIEW'),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  totalSlots: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  availableSlots: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  version: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  }
}, {
  sequelize,
  modelName: 'ReferralPost',
  version: true, // Enables Optimistic Locking in Sequelize!
});

// ==========================================
// 5. Booking Request Model
// ==========================================
export interface BookingRequestAttributes {
  id?: number;
  postId: number;
  studentId: number;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  studentNotes?: string;
}

export class BookingRequest extends Model<BookingRequestAttributes, Optional<BookingRequestAttributes, 'id'>> implements BookingRequestAttributes {
  public id!: number;
  public postId!: number;
  public studentId!: number;
  public status!: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  public studentNotes!: string;

  // Typing for associations
  public ReferralPost?: ReferralPost;
  public StudentProfile?: StudentProfile;
  public post?: ReferralPost;
  public student?: StudentProfile & { user?: { name: string; email: string } };
}

BookingRequest.init({
  postId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  studentId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('PENDING', 'ACCEPTED', 'REJECTED'),
    defaultValue: 'PENDING',
    allowNull: false,
  },
  studentNotes: {
    type: DataTypes.TEXT,
    allowNull: true,
  }
}, {
  sequelize,
  modelName: 'BookingRequest',
});

// ==========================================
// Relationships & Mappings
// ==========================================

// User <-> AlumniProfile (One-to-One)
User.hasOne(AlumniProfile, { foreignKey: 'userId', as: 'alumniProfile', onDelete: 'CASCADE' });
AlumniProfile.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// User <-> StudentProfile (One-to-One)
User.hasOne(StudentProfile, { foreignKey: 'userId', as: 'studentProfile', onDelete: 'CASCADE' });
StudentProfile.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// AlumniProfile <-> ReferralPost (One-to-Many)
AlumniProfile.hasMany(ReferralPost, { foreignKey: 'alumniId', as: 'posts', onDelete: 'CASCADE' });
ReferralPost.belongsTo(AlumniProfile, { foreignKey: 'alumniId', as: 'alumni' });

// ReferralPost <-> BookingRequest (One-to-Many)
ReferralPost.hasMany(BookingRequest, { foreignKey: 'postId', as: 'bookings', onDelete: 'CASCADE' });
BookingRequest.belongsTo(ReferralPost, { foreignKey: 'postId', as: 'post' });

// StudentProfile <-> BookingRequest (One-to-Many)
StudentProfile.hasMany(BookingRequest, { foreignKey: 'studentId', as: 'bookings', onDelete: 'CASCADE' });
BookingRequest.belongsTo(StudentProfile, { foreignKey: 'studentId', as: 'student' });

export { sequelize };
