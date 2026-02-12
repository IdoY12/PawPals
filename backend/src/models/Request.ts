import mongoose, { Document, Schema, Model } from 'mongoose';

// Request status enum
export enum RequestStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

// Location interface using GeoJSON Point format
export interface IRequestLocation {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
  address?: string;
}

// Request document interface
export interface IRequest extends Document {
  _id: mongoose.Types.ObjectId;
  ownerId: mongoose.Types.ObjectId;
  message: string;
  startDate: Date;
  endDate: Date;
  location: IRequestLocation;
  status: RequestStatus;
  // Optional fields
  specialInstructions?: string;
  preferredRate?: number;
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

// Location schema with GeoJSON Point
const RequestLocationSchema = new Schema<IRequestLocation>({
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
          coords[0] >= -180 && coords[0] <= 180 &&
          coords[1] >= -90 && coords[1] <= 90;
      },
      message: 'Invalid coordinates. Format: [longitude, latitude]',
    },
  },
  address: { type: String },
});

// Request schema
const RequestSchema = new Schema<IRequest>(
  {
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Owner ID is required'],
      index: true,
    },
    message: {
      type: String,
      required: [true, 'Request message is required'],
      trim: true,
      maxlength: [500, 'Message cannot exceed 500 characters'],
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
      validate: {
        validator: function(date: Date) {
          return date >= new Date(new Date().setHours(0, 0, 0, 0));
        },
        message: 'Start date cannot be in the past',
      },
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
      validate: {
        validator: function(this: IRequest, date: Date) {
          return date >= this.startDate;
        },
        message: 'End date must be after or equal to start date',
      },
    },
    location: {
      type: RequestLocationSchema,
      required: [true, 'Location is required'],
    },
    status: {
      type: String,
      enum: Object.values(RequestStatus),
      default: RequestStatus.ACTIVE,
      index: true,
    },
    specialInstructions: {
      type: String,
      maxlength: [1000, 'Special instructions cannot exceed 1000 characters'],
    },
    preferredRate: {
      type: Number,
      min: [0, 'Preferred rate cannot be negative'],
    },
  },
  {
    timestamps: true,
  }
);

// Create geospatial index for location-based queries
RequestSchema.index({ location: '2dsphere' });

// Compound index for finding active requests by owner
RequestSchema.index({ ownerId: 1, status: 1 });

// Index for finding active requests
RequestSchema.index({ status: 1, startDate: 1 });

// Virtual to check if request is currently active and within date range
RequestSchema.virtual('isCurrentlyActive').get(function(this: IRequest) {
  const now = new Date();
  return this.status === RequestStatus.ACTIVE && 
         this.startDate <= now && 
         this.endDate >= now;
});

// Virtual to check if request is upcoming
RequestSchema.virtual('isUpcoming').get(function(this: IRequest) {
  const now = new Date();
  return this.status === RequestStatus.ACTIVE && this.startDate > now;
});

// Remove __v from JSON output
RequestSchema.set('toJSON', {
  transform: function(doc: any, ret: any) {
    delete ret.__v;
    return ret;
  },
  virtuals: true,
});

export const Request: Model<IRequest> = mongoose.model<IRequest>('Request', RequestSchema);
export default Request;
