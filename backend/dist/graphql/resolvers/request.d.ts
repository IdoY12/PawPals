import mongoose from 'mongoose';
import { IRequest, RequestStatus } from '../../models/Request';
import { GraphQLContext } from '../../config/apollo';
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
export declare const requestResolvers: {
    Query: {
        getRequest: (_: unknown, { id }: {
            id: string;
        }, { user }: GraphQLContext) => Promise<IRequest | null>;
        myRequests: (_: unknown, { status }: {
            status?: RequestStatus;
        }, { user }: GraphQLContext) => Promise<IRequest[]>;
        nearbyRequests: (_: unknown, { radius, longitude, latitude, }: {
            radius: number;
            longitude: number;
            latitude: number;
        }, { user }: GraphQLContext) => Promise<(IRequest & {
            distance?: number;
        })[]>;
    };
    Mutation: {
        createRequest: (_: unknown, { input }: {
            input: CreateRequestInput;
        }, { user }: GraphQLContext) => Promise<IRequest>;
        updateRequest: (_: unknown, { id, input }: {
            id: string;
            input: UpdateRequestInput;
        }, { user }: GraphQLContext) => Promise<IRequest>;
        deleteRequest: (_: unknown, { id }: {
            id: string;
        }, { user }: GraphQLContext) => Promise<boolean>;
        completeRequest: (_: unknown, { id }: {
            id: string;
        }, { user }: GraphQLContext) => Promise<IRequest>;
        cancelRequest: (_: unknown, { id }: {
            id: string;
        }, { user }: GraphQLContext) => Promise<IRequest>;
    };
    Subscription: {
        newRequestNearby: {
            subscribe: (_: unknown, args: {
                radius: number;
                longitude: number;
                latitude: number;
            }) => AsyncIterator<unknown, any, any>;
            resolve: (payload: {
                newRequestNearby: IRequest;
            }, args: {
                radius: number;
                longitude: number;
                latitude: number;
            }) => any;
        };
        requestUpdated: {
            subscribe: (_: unknown, { id }: {
                id: string;
            }) => AsyncIterator<unknown, any, any>;
            resolve: (payload: {
                requestUpdated: IRequest;
            }, { id }: {
                id: string;
            }) => IRequest | null;
        };
    };
    Request: {
        id: (parent: IRequest) => string;
        owner: (parent: IRequest) => Promise<(mongoose.Document<unknown, {}, import("../../models/User").IUser, {}, {}> & import("../../models/User").IUser & Required<{
            _id: mongoose.Types.ObjectId;
        }> & {
            __v: number;
        }) | null>;
    };
};
export {};
//# sourceMappingURL=request.d.ts.map