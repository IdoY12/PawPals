"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestResolvers = void 0;
const Request_1 = require("../../models/Request");
const User_1 = require("../../models/User");
const validation_1 = require("../../utils/validation");
const apollo_1 = require("../../config/apollo");
// Subscription events
const REQUEST_CREATED = 'REQUEST_CREATED';
const REQUEST_UPDATED = 'REQUEST_UPDATED';
exports.requestResolvers = {
    Query: {
        // Get request by ID
        getRequest: async (_, { id }, { user }) => {
            if (!user)
                (0, validation_1.throwAuthError)();
            const request = await Request_1.Request.findById(id);
            if (!request) {
                (0, validation_1.throwNotFoundError)('Request');
            }
            return request;
        },
        // Get current user's requests
        myRequests: async (_, { status }, { user }) => {
            if (!user)
                (0, validation_1.throwAuthError)();
            if (user.userType !== User_1.UserType.OWNER) {
                (0, validation_1.throwValidationError)('Only owners can view their requests');
            }
            const query = { ownerId: user._id };
            if (status) {
                query.status = status;
            }
            return Request_1.Request.find(query).sort({ createdAt: -1 });
        },
        // Get nearby active requests (for sitters)
        nearbyRequests: async (_, { radius, longitude, latitude, }, { user }) => {
            if (!user)
                (0, validation_1.throwAuthError)();
            const radiusInMeters = radius * 1000;
            const requests = await Request_1.Request.find({
                status: Request_1.RequestStatus.ACTIVE,
                startDate: { $gte: new Date() },
                location: {
                    $near: {
                        $geometry: {
                            type: 'Point',
                            coordinates: [longitude, latitude],
                        },
                        $maxDistance: radiusInMeters,
                    },
                },
            })
                .sort({ startDate: 1 })
                .limit(50);
            return requests.map((r) => {
                const distance = (0, validation_1.calculateDistance)([longitude, latitude], r.location.coordinates);
                return { ...r.toObject(), id: r._id.toString(), distance };
            });
        },
    },
    Mutation: {
        // Create a new request
        createRequest: async (_, { input }, { user }) => {
            if (!user)
                (0, validation_1.throwAuthError)();
            if (user.userType !== User_1.UserType.OWNER) {
                (0, validation_1.throwValidationError)('Only owners can create requests');
            }
            const { message, startDate, endDate, location, ...rest } = input;
            // Validate coordinates
            if (!(0, validation_1.validateCoordinates)(location.coordinates)) {
                (0, validation_1.throwValidationError)('Invalid coordinates');
            }
            // Validate dates
            const start = new Date(startDate);
            const end = new Date(endDate);
            const dateValidation = (0, validation_1.validateDateRange)(start, end);
            if (!dateValidation.valid) {
                (0, validation_1.throwValidationError)(dateValidation.message);
            }
            const request = new Request_1.Request({
                ownerId: user._id,
                message,
                startDate: start,
                endDate: end,
                location: {
                    type: 'Point',
                    coordinates: location.coordinates,
                    address: location.address,
                },
                status: Request_1.RequestStatus.ACTIVE,
                ...rest,
            });
            await request.save();
            // Publish subscription event
            apollo_1.pubsub.publish(REQUEST_CREATED, { newRequestNearby: request });
            return request;
        },
        // Update a request
        updateRequest: async (_, { id, input }, { user }) => {
            if (!user)
                (0, validation_1.throwAuthError)();
            const request = await Request_1.Request.findById(id);
            if (!request) {
                (0, validation_1.throwNotFoundError)('Request');
            }
            // Check ownership
            if (request.ownerId.toString() !== user._id.toString()) {
                (0, validation_1.throwForbiddenError)('Not authorized to update this request');
            }
            const updateData = { ...input };
            // Format location if provided
            if (input.location) {
                if (!(0, validation_1.validateCoordinates)(input.location.coordinates)) {
                    (0, validation_1.throwValidationError)('Invalid coordinates');
                }
                updateData.location = {
                    type: 'Point',
                    coordinates: input.location.coordinates,
                    address: input.location.address,
                };
            }
            // Validate dates if provided
            if (input.startDate || input.endDate) {
                const start = input.startDate ? new Date(input.startDate) : request.startDate;
                const end = input.endDate ? new Date(input.endDate) : request.endDate;
                const dateValidation = (0, validation_1.validateDateRange)(start, end);
                if (!dateValidation.valid) {
                    (0, validation_1.throwValidationError)(dateValidation.message);
                }
                if (input.startDate)
                    updateData.startDate = start;
                if (input.endDate)
                    updateData.endDate = end;
            }
            const updatedRequest = await Request_1.Request.findByIdAndUpdate(id, { $set: updateData }, { new: true, runValidators: true });
            // Publish subscription event
            apollo_1.pubsub.publish(REQUEST_UPDATED, { requestUpdated: updatedRequest });
            return updatedRequest;
        },
        // Delete a request
        deleteRequest: async (_, { id }, { user }) => {
            if (!user)
                (0, validation_1.throwAuthError)();
            const request = await Request_1.Request.findById(id);
            if (!request) {
                (0, validation_1.throwNotFoundError)('Request');
            }
            // Check ownership
            if (request.ownerId.toString() !== user._id.toString()) {
                (0, validation_1.throwForbiddenError)('Not authorized to delete this request');
            }
            await Request_1.Request.findByIdAndDelete(id);
            return true;
        },
        // Complete a request
        completeRequest: async (_, { id }, { user }) => {
            if (!user)
                (0, validation_1.throwAuthError)();
            const request = await Request_1.Request.findById(id);
            if (!request) {
                (0, validation_1.throwNotFoundError)('Request');
            }
            if (request.ownerId.toString() !== user._id.toString()) {
                (0, validation_1.throwForbiddenError)('Not authorized to complete this request');
            }
            request.status = Request_1.RequestStatus.COMPLETED;
            await request.save();
            apollo_1.pubsub.publish(REQUEST_UPDATED, { requestUpdated: request });
            return request;
        },
        // Cancel a request
        cancelRequest: async (_, { id }, { user }) => {
            if (!user)
                (0, validation_1.throwAuthError)();
            const request = await Request_1.Request.findById(id);
            if (!request) {
                (0, validation_1.throwNotFoundError)('Request');
            }
            if (request.ownerId.toString() !== user._id.toString()) {
                (0, validation_1.throwForbiddenError)('Not authorized to cancel this request');
            }
            request.status = Request_1.RequestStatus.CANCELLED;
            await request.save();
            apollo_1.pubsub.publish(REQUEST_UPDATED, { requestUpdated: request });
            return request;
        },
    },
    Subscription: {
        newRequestNearby: {
            subscribe: (_, args) => {
                return apollo_1.pubsub.asyncIterator([REQUEST_CREATED]);
            },
            resolve: (payload, args) => {
                // Filter by distance
                const distance = (0, validation_1.calculateDistance)([args.longitude, args.latitude], payload.newRequestNearby.location.coordinates);
                if (distance <= args.radius) {
                    return { ...payload.newRequestNearby.toObject(), distance };
                }
                return null;
            },
        },
        requestUpdated: {
            subscribe: (_, { id }) => {
                return apollo_1.pubsub.asyncIterator([REQUEST_UPDATED]);
            },
            resolve: (payload, { id }) => {
                if (payload.requestUpdated._id.toString() === id) {
                    return payload.requestUpdated;
                }
                return null;
            },
        },
    },
    // Field resolvers
    Request: {
        id: (parent) => parent._id.toString(),
        owner: async (parent) => {
            return User_1.User.findById(parent.ownerId);
        },
    },
};
//# sourceMappingURL=request.js.map