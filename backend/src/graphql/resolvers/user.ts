import { User, IUser, UserType } from '../../models/User';
import { generateToken, AuthPayload } from '../../utils/jwt';
import {
  throwAuthError,
  throwValidationError,
  throwNotFoundError,
  validateEmail,
  validatePassword,
  validateCoordinates,
  calculateDistance,
} from '../../utils/validation';
import { GraphQLContext } from '../../config/apollo';

// Input types
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

export const userResolvers = {
  Query: {
    // Get current authenticated user
    me: async (
      _: unknown,
      __: unknown,
      { user }: GraphQLContext
    ): Promise<IUser | null> => {
      if (!user) return null;
      return User.findById(user._id);
    },

    // Get user by ID
    getUser: async (
      _: unknown,
      { id }: { id: string }
    ): Promise<IUser | null> => {
      const user = await User.findById(id);
      if (!user) {
        throwNotFoundError('User');
      }
      return user;
    },

    // Get nearby users based on location
    nearbyUsers: async (
      _: unknown,
      {
        radius,
        userType,
        longitude,
        latitude,
      }: {
        radius: number;
        userType: UserType;
        longitude: number;
        latitude: number;
      },
      { user }: GraphQLContext
    ): Promise<(IUser & { distance?: number })[]> => {
      if (!user) throwAuthError();

      // Convert radius from km to meters for MongoDB
      const radiusInMeters = radius * 1000;

      const users = await User.find({
        userType,
        _id: { $ne: user._id }, // Exclude current user
        location: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [longitude, latitude],
            },
            $maxDistance: radiusInMeters,
          },
        },
      }).limit(50);

      // Add distance to each user
      return users.map((u) => {
        const distance = calculateDistance(
          [longitude, latitude],
          u.location.coordinates as [number, number]
        );
        return { ...u.toObject(), id: u._id.toString(), distance };
      });
    },

    // Get nearby available sitters
    nearbyAvailableSitters: async (
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
    ): Promise<(IUser & { distance?: number })[]> => {
      if (!user) throwAuthError();

      const radiusInMeters = radius * 1000;

      const sitters = await User.find({
        userType: UserType.SITTER,
        isAvailable: true,
        location: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [longitude, latitude],
            },
            $maxDistance: radiusInMeters,
          },
        },
      }).limit(50);

      return sitters.map((s) => {
        const distance = calculateDistance(
          [longitude, latitude],
          s.location.coordinates as [number, number]
        );
        return { ...s.toObject(), id: s._id.toString(), distance };
      });
    },
  },

  Mutation: {
    // Register new user
    register: async (
      _: unknown,
      { input }: { input: RegisterInput }
    ): Promise<AuthPayload> => {
      const { email, password, userType, name, location, ...rest } = input;

      // Validate email
      if (!validateEmail(email)) {
        throwValidationError('Invalid email format');
      }

      // Validate password
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.valid) {
        throwValidationError(passwordValidation.message!);
      }

      // Validate coordinates
      if (!validateCoordinates(location.coordinates)) {
        throwValidationError('Invalid coordinates');
      }

      // Check if user already exists
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        throwValidationError('Email already registered');
      }

      // Create user
      const user = new User({
        email: email.toLowerCase(),
        password,
        userType,
        name,
        location: {
          type: 'Point',
          coordinates: location.coordinates,
          address: location.address,
        },
        ...rest,
      });

      await user.save();

      // Generate token
      const token = generateToken(user);

      return { token, user };
    },

    // Login user
    login: async (
      _: unknown,
      { email, password }: { email: string; password: string }
    ): Promise<AuthPayload> => {
      // Find user by email
      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        throwValidationError('Invalid email or password');
      }

      // Check password
      const isMatch = await user!.comparePassword(password);
      if (!isMatch) {
        throwValidationError('Invalid email or password');
      }

      // Generate token
      const token = generateToken(user!);

      return { token, user: user! };
    },

    // Update user profile
    updateProfile: async (
      _: unknown,
      { input }: { input: ProfileUpdateInput },
      { user }: GraphQLContext
    ): Promise<IUser> => {
      if (!user) throwAuthError();

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

      const updatedUser = await User.findByIdAndUpdate(
        user._id,
        { $set: updateData },
        { new: true, runValidators: true }
      );

      if (!updatedUser) {
        throwNotFoundError('User');
      }

      return updatedUser!;
    },

    // Update user location
    updateLocation: async (
      _: unknown,
      { location }: { location: LocationInput },
      { user }: GraphQLContext
    ): Promise<IUser> => {
      if (!user) throwAuthError();

      if (!validateCoordinates(location.coordinates)) {
        throwValidationError('Invalid coordinates');
      }

      const updatedUser = await User.findByIdAndUpdate(
        user._id,
        {
          $set: {
            location: {
              type: 'Point',
              coordinates: location.coordinates,
              address: location.address,
            },
          },
        },
        { new: true }
      );

      if (!updatedUser) {
        throwNotFoundError('User');
      }

      return updatedUser!;
    },

    // Toggle sitter availability
    toggleAvailability: async (
      _: unknown,
      { isAvailable, message }: { isAvailable: boolean; message?: string },
      { user }: GraphQLContext
    ): Promise<IUser> => {
      if (!user) throwAuthError();

      if (user.userType !== UserType.SITTER) {
        throwValidationError('Only sitters can toggle availability');
      }

      const updatedUser = await User.findByIdAndUpdate(
        user._id,
        {
          $set: {
            isAvailable,
            ...(message !== undefined && { availabilityMessage: message }),
          },
        },
        { new: true }
      );

      if (!updatedUser) {
        throwNotFoundError('User');
      }

      return updatedUser!;
    },

    // Add a dog (for owners)
    addDog: async (
      _: unknown,
      { dog }: { dog: DogInput },
      { user }: GraphQLContext
    ): Promise<IUser> => {
      if (!user) throwAuthError();

      if (user.userType !== UserType.OWNER) {
        throwValidationError('Only owners can add dogs');
      }

      const updatedUser = await User.findByIdAndUpdate(
        user._id,
        { $push: { dogs: dog } },
        { new: true, runValidators: true }
      );

      if (!updatedUser) {
        throwNotFoundError('User');
      }

      return updatedUser!;
    },

    // Update a dog
    updateDog: async (
      _: unknown,
      { index, dog }: { index: number; dog: DogInput },
      { user }: GraphQLContext
    ): Promise<IUser> => {
      if (!user) throwAuthError();

      if (user.userType !== UserType.OWNER) {
        throwValidationError('Only owners can update dogs');
      }

      if (index < 0 || index >= user.dogs.length) {
        throwValidationError('Invalid dog index');
      }

      const updateKey = `dogs.${index}`;
      const updatedUser = await User.findByIdAndUpdate(
        user._id,
        { $set: { [updateKey]: dog } },
        { new: true, runValidators: true }
      );

      if (!updatedUser) {
        throwNotFoundError('User');
      }

      return updatedUser!;
    },

    // Remove a dog
    removeDog: async (
      _: unknown,
      { index }: { index: number },
      { user }: GraphQLContext
    ): Promise<IUser> => {
      if (!user) throwAuthError();

      if (user.userType !== UserType.OWNER) {
        throwValidationError('Only owners can remove dogs');
      }

      if (index < 0 || index >= user.dogs.length) {
        throwValidationError('Invalid dog index');
      }

      // Remove by setting to null then pulling
      const updateKey = `dogs.${index}`;
      await User.findByIdAndUpdate(user._id, {
        $unset: { [updateKey]: 1 },
      });

      const updatedUser = await User.findByIdAndUpdate(
        user._id,
        { $pull: { dogs: null } },
        { new: true }
      );

      if (!updatedUser) {
        throwNotFoundError('User');
      }

      return updatedUser!;
    },
  },

  // Field resolvers
  User: {
    id: (parent: IUser) => parent._id.toString(),
  },
};
