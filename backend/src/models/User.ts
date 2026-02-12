import mongoose, { Document, Schema, Model } from 'mongoose';
import bcrypt from 'bcryptjs';

// Dog interface for dog owners
export interface IDog {
  name: string;
  breed: string;
  age: number;
  photo?: string;
  description?: string;
}

// Location interface using GeoJSON Point format
export interface ILocation {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
  address?: string;
}

// User types enum
export enum UserType {
  OWNER = 'owner',
  SITTER = 'sitter',
}

// User document interface
export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  password: string;
  userType: UserType;
  name: string;
  phone?: string;
  profilePicture?: string;
  location: ILocation;
  // Dog Owner specific fields
  dogs: IDog[];
  // Dog Sitter specific fields
  isAvailable: boolean;
  availabilityMessage?: string;
  hourlyRate?: number;
  bio?: string;
  // Rating system
  rating: number;
  reviewCount: number;
  totalRatingSum: number;
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  // Methods
  comparePassword(candidatePassword: string): Promise<boolean>;
  updateRating(newRating: number): Promise<void>;
}

// Dog schema
const DogSchema = new Schema<IDog>({
  name: { type: String, required: true },
  breed: { type: String, required: true },
  age: { type: Number, required: true, min: 0 },
  photo: { type: String },
  description: { type: String },
});

// Location schema with GeoJSON Point
const LocationSchema = new Schema<ILocation>({
  type: {
    type: String,
    enum: ['Point'],
    default: 'Point',
    required: true,
  },
  coordinates: {
    type: [Number],
    required: true,
    validate: {
      validator: function(coords: number[]) {
        return coords.length === 2 &&
          coords[0] >= -180 && coords[0] <= 180 && // longitude
          coords[1] >= -90 && coords[1] <= 90;     // latitude
      },
      message: 'Invalid coordinates. Format: [longitude, latitude]',
    },
  },
  address: { type: String },
});

// User schema
const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
    },
    userType: {
      type: String,
      enum: Object.values(UserType),
      required: [true, 'User type is required'],
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
    },
    phone: {
      type: String,
      trim: true,
    },
    profilePicture: {
      type: String,
    },
    location: {
      type: LocationSchema,
      required: true,
      index: '2dsphere', // Geospatial index for location queries
    },
    // Dog Owner fields
    dogs: {
      type: [DogSchema],
      default: [],
    },
    // Dog Sitter fields
    isAvailable: {
      type: Boolean,
      default: false,
    },
    availabilityMessage: {
      type: String,
      maxlength: [200, 'Availability message cannot exceed 200 characters'],
    },
    hourlyRate: {
      type: Number,
      min: [0, 'Hourly rate cannot be negative'],
    },
    bio: {
      type: String,
      maxlength: [500, 'Bio cannot exceed 500 characters'],
    },
    // Rating system
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    reviewCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalRatingSum: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Create geospatial index for location-based queries
UserSchema.index({ location: '2dsphere' });

// Index for finding available sitters
UserSchema.index({ userType: 1, isAvailable: 1 });

// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Compare password method
UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Update rating method
UserSchema.methods.updateRating = async function(newRating: number): Promise<void> {
  this.totalRatingSum += newRating;
  this.reviewCount += 1;
  this.rating = this.totalRatingSum / this.reviewCount;
  await this.save();
};

// Remove password from JSON output
UserSchema.set('toJSON', {
  transform: function(doc: any, ret: any) {
    delete ret.password;
    delete ret.__v;
    return ret;
  },
});

export const User: Model<IUser> = mongoose.model<IUser>('User', UserSchema);
export default User;
