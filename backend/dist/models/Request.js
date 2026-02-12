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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Request = exports.RequestStatus = void 0;
const mongoose_1 = __importStar(require("mongoose"));
// Request status enum
var RequestStatus;
(function (RequestStatus) {
    RequestStatus["ACTIVE"] = "active";
    RequestStatus["COMPLETED"] = "completed";
    RequestStatus["CANCELLED"] = "cancelled";
})(RequestStatus || (exports.RequestStatus = RequestStatus = {}));
// Location schema with GeoJSON Point
const RequestLocationSchema = new mongoose_1.Schema({
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
                    coords[0] >= -180 && coords[0] <= 180 &&
                    coords[1] >= -90 && coords[1] <= 90;
            },
            message: 'Invalid coordinates. Format: [longitude, latitude]',
        },
    },
    address: { type: String },
});
// Request schema
const RequestSchema = new mongoose_1.Schema({
    ownerId: {
        type: mongoose_1.Schema.Types.ObjectId,
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
            validator: function (date) {
                return date >= new Date(new Date().setHours(0, 0, 0, 0));
            },
            message: 'Start date cannot be in the past',
        },
    },
    endDate: {
        type: Date,
        required: [true, 'End date is required'],
        validate: {
            validator: function (date) {
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
}, {
    timestamps: true,
});
// Create geospatial index for location-based queries
RequestSchema.index({ location: '2dsphere' });
// Compound index for finding active requests by owner
RequestSchema.index({ ownerId: 1, status: 1 });
// Index for finding active requests
RequestSchema.index({ status: 1, startDate: 1 });
// Virtual to check if request is currently active and within date range
RequestSchema.virtual('isCurrentlyActive').get(function () {
    const now = new Date();
    return this.status === RequestStatus.ACTIVE &&
        this.startDate <= now &&
        this.endDate >= now;
});
// Virtual to check if request is upcoming
RequestSchema.virtual('isUpcoming').get(function () {
    const now = new Date();
    return this.status === RequestStatus.ACTIVE && this.startDate > now;
});
// Remove __v from JSON output
RequestSchema.set('toJSON', {
    transform: function (doc, ret) {
        delete ret.__v;
        return ret;
    },
    virtuals: true,
});
exports.Request = mongoose_1.default.model('Request', RequestSchema);
exports.default = exports.Request;
//# sourceMappingURL=Request.js.map