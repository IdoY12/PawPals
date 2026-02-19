import mongoose from 'mongoose';
import { Request, IRequest, RequestStatus } from '../../models/Request';
import { User, UserType } from '../../models/User';
import {
  throwAuthError,
  throwValidationError,
  throwNotFoundError,
  throwForbiddenError,
  validateCoordinates,
  validateDateRange,
  calculateDistance,
} from '../../utils/validation';
import { GraphQLContext, pubsub } from '../../config/apollo';

// Subscription events
const REQUEST_CREATED = 'REQUEST_CREATED';
const REQUEST_UPDATED = 'REQUEST_UPDATED';

// Input types
interface LocationInput {
  coordinates: [number, number];
  address?: string;
}

interface CreateRequestInput {
  message: string;
  startDate: string;
  endDate: string;
  location: LocationInput;
  specialInstructions?: string;
  preferredRate?: number;
}

interface UpdateRequestInput {
  message?: string;
  startDate?: string;
  endDate?: string;
  location?: LocationInput;
  specialInstructions?: string;
  preferredRate?: number;
  status?: RequestStatus;
}

export const requestResolvers = {
  Query: {
    // Get request by ID
    getRequest: async (
      _: unknown,
      { id }: { id: string },
      { user }: GraphQLContext
    ): Promise<IRequest | null> => {
      if (!user) return throwAuthError();

      const request = await Request.findById(id);
      if (!request) {
        throwNotFoundError('Request');
      }
      return request;
    },

    // Get current user's requests
    myRequests: async (
      _: unknown,
      { status }: { status?: RequestStatus },
      { user }: GraphQLContext
    ): Promise<IRequest[]> => {
      if (!user) return throwAuthError();

      if (user.userType !== UserType.OWNER) {
        throwValidationError('Only owners can view their requests');
      }

      const query: any = { ownerId: user._id };
      if (status) {
        query.status = status;
      }

      return Request.find(query).sort({ createdAt: -1 });
    },

    // Get nearby active requests (for sitters)
    nearbyRequests: async (
      _: unknown,
      {
        radius,
        longitude,
        latitude,
      }: {
        radius: number;
        longitude: number;
        latitude: number;
      },
      { user }: GraphQLContext
    ): Promise<(IRequest & { distance?: number })[]> => {
      if (!user) return throwAuthError();

      const radiusInMeters = radius * 1000;

      const requests = await Request.find({
        status: RequestStatus.ACTIVE,
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
        const distance = calculateDistance(
          [longitude, latitude],
          r.location.coordinates as [number, number]
        );
        return { ...r.toObject(), id: r._id.toString(), distance } as any;
      });
    },
  },

  Mutation: {
    // Create a new request
    createRequest: async (
      _: unknown,
      { input }: { input: CreateRequestInput },
      { user }: GraphQLContext
    ): Promise<IRequest> => {
      if (!user) return throwAuthError();

      if (user.userType !== UserType.OWNER) {
        throwValidationError('Only owners can create requests');
      }

      const { message, startDate, endDate, location, ...rest } = input;

      // Validate coordinates
      if (!validateCoordinates(location.coordinates)) {
        throwValidationError('Invalid coordinates');
      }

      // Validate dates
      const start = new Date(startDate);
      const end = new Date(endDate);
      const dateValidation = validateDateRange(start, end);
      if (!dateValidation.valid) {
        throwValidationError(dateValidation.message!);
      }

      const request = new Request({
        ownerId: user._id,
        message,
        startDate: start,
        endDate: end,
        location: {
          type: 'Point',
          coordinates: location.coordinates,
          address: location.address,
        },
        status: RequestStatus.ACTIVE,
        ...rest,
      });

      await request.save();

      // Publish subscription event
      pubsub.publish(REQUEST_CREATED, { newRequestNearby: request });

      return request;
    },

    // Update a request
    updateRequest: async (
      _: unknown,
      { id, input }: { id: string; input: UpdateRequestInput },
      { user }: GraphQLContext
    ): Promise<IRequest> => {
      if (!user) return throwAuthError();

      const request = await Request.findById(id);
      if (!request) {
        throwNotFoundError('Request');
      }

      // Check ownership
      if (request!.ownerId.toString() !== user._id.toString()) {
        throwForbiddenError('Not authorized to update this request');
      }

      const updateData: any = { ...input };

      // Format location if provided
      if (input.location) {
        if (!validateCoordinates(input.location.coordinates)) {
          throwValidationError('Invalid coordinates');
        }
        updateData.location = {
          type: 'Point',
          coordinates: input.location.coordinates,
          address: input.location.address,
        };
      }

      // Validate dates if provided
      if (input.startDate || input.endDate) {
        const start = input.startDate ? new Date(input.startDate) : request!.startDate;
        const end = input.endDate ? new Date(input.endDate) : request!.endDate;
        const dateValidation = validateDateRange(start, end);
        if (!dateValidation.valid) {
          throwValidationError(dateValidation.message!);
        }
        if (input.startDate) updateData.startDate = start;
        if (input.endDate) updateData.endDate = end;
      }

      const updatedRequest = await Request.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true, runValidators: true }
      );

      // Publish subscription event
      pubsub.publish(REQUEST_UPDATED, { requestUpdated: updatedRequest });

      return updatedRequest!;
    },

    // Delete a request
    deleteRequest: async (
      _: unknown,
      { id }: { id: string },
      { user }: GraphQLContext
    ): Promise<boolean> => {
      if (!user) return throwAuthError();

      const request = await Request.findById(id);
      if (!request) {
        throwNotFoundError('Request');
      }

      // Check ownership
      if (request!.ownerId.toString() !== user._id.toString()) {
        throwForbiddenError('Not authorized to delete this request');
      }

      await Request.findByIdAndDelete(id);
      return true;
    },

    // Complete a request
    completeRequest: async (
      _: unknown,
      { id }: { id: string },
      { user }: GraphQLContext
    ): Promise<IRequest> => {
      if (!user) return throwAuthError();

      const request = await Request.findById(id);
      if (!request) {
        throwNotFoundError('Request');
      }

      if (request!.ownerId.toString() !== user._id.toString()) {
        throwForbiddenError('Not authorized to complete this request');
      }

      request!.status = RequestStatus.COMPLETED;
      await request!.save();

      pubsub.publish(REQUEST_UPDATED, { requestUpdated: request });

      return request!;
    },

    // Cancel a request
    cancelRequest: async (
      _: unknown,
      { id }: { id: string },
      { user }: GraphQLContext
    ): Promise<IRequest> => {
      if (!user) return throwAuthError();

      const request = await Request.findById(id);
      if (!request) {
        throwNotFoundError('Request');
      }

      if (request!.ownerId.toString() !== user._id.toString()) {
        throwForbiddenError('Not authorized to cancel this request');
      }

      request!.status = RequestStatus.CANCELLED;
      await request!.save();

      pubsub.publish(REQUEST_UPDATED, { requestUpdated: request });

      return request!;
    },
  },

  Subscription: {
    newRequestNearby: {
      subscribe: (_: unknown, args: { radius: number; longitude: number; latitude: number }) => {
        return pubsub.asyncIterator([REQUEST_CREATED]);
      },
      resolve: (
        payload: { newRequestNearby: IRequest },
        args: { radius: number; longitude: number; latitude: number }
      ) => {
        // Filter by distance
        const distance = calculateDistance(
          [args.longitude, args.latitude],
          payload.newRequestNearby.location.coordinates as [number, number]
        );
        if (distance <= args.radius) {
          return { ...payload.newRequestNearby.toObject(), distance };
        }
        return null;
      },
    },
    requestUpdated: {
      subscribe: (_: unknown, { id }: { id: string }) => {
        return pubsub.asyncIterator([REQUEST_UPDATED]);
      },
      resolve: (payload: { requestUpdated: IRequest }, { id }: { id: string }) => {
        if (payload.requestUpdated._id.toString() === id) {
          return payload.requestUpdated;
        }
        return null;
      },
    },
  },

  // Field resolvers
  Request: {
    id: (parent: IRequest) => parent._id.toString(),
    owner: async (parent: IRequest) => {
      return User.findById(parent.ownerId);
    },
  },
};
