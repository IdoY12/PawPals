import { IUser, UserType } from '../../models/User';
import { AuthPayload } from '../../utils/jwt';
import { GraphQLContext } from '../../config/apollo';
interface LocationInput {
    coordinates: [number, number];
    address?: string;
}
interface DogInput {
    name: string;
    breed: string;
    age: number;
    photo?: string;
    description?: string;
}
interface RegisterInput {
    email: string;
    password: string;
    userType: UserType;
    name: string;
    phone?: string;
    location: LocationInput;
    dogs?: DogInput[];
    hourlyRate?: number;
    bio?: string;
}
interface ProfileUpdateInput {
    name?: string;
    phone?: string;
    profilePicture?: string;
    location?: LocationInput;
    dogs?: DogInput[];
    isAvailable?: boolean;
    availabilityMessage?: string;
    hourlyRate?: number;
    bio?: string;
}
export declare const userResolvers: {
    Query: {
        me: (_: unknown, __: unknown, { user }: GraphQLContext) => Promise<IUser | null>;
        getUser: (_: unknown, { id }: {
            id: string;
        }) => Promise<IUser | null>;
        nearbyUsers: (_: unknown, { radius, userType, longitude, latitude, }: {
            radius: number;
            userType: UserType;
            longitude: number;
            latitude: number;
        }, { user }: GraphQLContext) => Promise<(IUser & {
            distance?: number;
        })[]>;
        nearbyAvailableSitters: (_: unknown, { radius, longitude, latitude, }: {
            radius: number;
            longitude: number;
            latitude: number;
        }, { user }: GraphQLContext) => Promise<(IUser & {
            distance?: number;
        })[]>;
    };
    Mutation: {
        register: (_: unknown, { input }: {
            input: RegisterInput;
        }) => Promise<AuthPayload>;
        login: (_: unknown, { email, password }: {
            email: string;
            password: string;
        }) => Promise<AuthPayload>;
        updateProfile: (_: unknown, { input }: {
            input: ProfileUpdateInput;
        }, { user }: GraphQLContext) => Promise<IUser>;
        updateLocation: (_: unknown, { location }: {
            location: LocationInput;
        }, { user }: GraphQLContext) => Promise<IUser>;
        toggleAvailability: (_: unknown, { isAvailable, message }: {
            isAvailable: boolean;
            message?: string;
        }, { user }: GraphQLContext) => Promise<IUser>;
        addDog: (_: unknown, { dog }: {
            dog: DogInput;
        }, { user }: GraphQLContext) => Promise<IUser>;
        updateDog: (_: unknown, { index, dog }: {
            index: number;
            dog: DogInput;
        }, { user }: GraphQLContext) => Promise<IUser>;
        removeDog: (_: unknown, { index }: {
            index: number;
        }, { user }: GraphQLContext) => Promise<IUser>;
    };
    User: {
        id: (parent: IUser) => string;
    };
};
export {};
//# sourceMappingURL=user.d.ts.map