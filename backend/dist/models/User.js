"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = exports.UserType = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
// User types enum
var UserType;
(function (UserType) {
    UserType["OWNER"] = "owner";
    UserType["SITTER"] = "sitter";
})(UserType || (exports.UserType = UserType = {}));
// Dog schema
const DogSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    breed: { type: String, required: true },
    age: { type: Number, required: true, min: 0 },
    photo: { type: String },
    description: { type: String },
});
// Location schema with GeoJSON Point
const LocationSchema = new mongoose_1.Schema({
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
            validator: function (coords) {
                return coords.length === 2 &&
                    coords[0] >= -180 && coords[0] <= 180 && // longitude
                    coords[1] >= -90 && coords[1] <= 90; // latitude
            },
            message: 'Invalid coordinates. Format: [longitude, latitude]',
        },
    },
    address: { type: String },
});
// User schema
const UserSchema = new mongoose_1.Schema({
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
}, {
    timestamps: true,
});
// Create geospatial index for location-based queries
UserSchema.index({ location: '2dsphere' });
// Index for finding available sitters
UserSchema.index({ userType: 1, isAvailable: 1 });
// Hash password before saving
UserSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }
    try {
        const salt = await bcryptjs_1.default.genSalt(12);
        this.password = await bcryptjs_1.default.hash(this.password, salt);
        next();
    }
    catch (error) {
        next(error);
    }
});
// Compare password method
UserSchema.methods.comparePassword = async function (candidatePassword) {
    return bcryptjs_1.default.compare(candidatePassword, this.password);
};
// Update rating method
UserSchema.methods.updateRating = async function (newRating) {
    this.totalRatingSum += newRating;
    this.reviewCount += 1;
    this.rating = this.totalRatingSum / this.reviewCount;
    await this.save();
};
// Remove password from JSON output
UserSchema.set('toJSON', {
    transform: function (doc, ret) {
        delete ret.password;
        delete ret.__v;
        return ret;
    },
});
exports.User = mongoose_1.default.model('User', UserSchema);
exports.default = exports.User;
//# sourceMappingURL=User.js.map