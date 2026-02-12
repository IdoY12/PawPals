"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userResolvers = void 0;
const User_1 = require("../../models/User");
const jwt_1 = require("../../utils/jwt");
const validation_1 = require("../../utils/validation");
exports.userResolvers = {
    Query: {
        // Get current authenticated user
        me: async (_, __, { user }) => {
            if (!user)
                return null;
            return User_1.User.findById(user._id);
        },
        // Get user by ID
        getUser: async (_, { id }) => {
            const user = await User_1.User.findById(id);
            if (!user) {
                (0, validation_1.throwNotFoundError)('User');
            }
            return user;
        },
        // Get nearby users based on location
        nearbyUsers: async (_, { radius, userType, longitude, latitude, }, { user }) => {
            if (!user)
                (0, validation_1.throwAuthError)();
            // Convert radius from km to meters for MongoDB
            const radiusInMeters = radius * 1000;
            const users = await User_1.User.find({
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
                const distance = (0, validation_1.calculateDistance)([longitude, latitude], u.location.coordinates);
                return { ...u.toObject(), id: u._id.toString(), distance };
            });
        },
        // Get nearby available sitters
        nearbyAvailableSitters: async (_, { radius, longitude, latitude, }, { user }) => {
            if (!user)
                (0, validation_1.throwAuthError)();
            const radiusInMeters = radius * 1000;
            const sitters = await User_1.User.find({
                userType: User_1.UserType.SITTER,
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
                const distance = (0, validation_1.calculateDistance)([longitude, latitude], s.location.coordinates);
                return { ...s.toObject(), id: s._id.toString(), distance };
            });
        },
    },
    Mutation: {
        // Register new user
        register: async (_, { input }) => {
            const { email, password, userType, name, location, ...rest } = input;
            // Validate email
            if (!(0, validation_1.validateEmail)(email)) {
                (0, validation_1.throwValidationError)('Invalid email format');
            }
            // Validate password
            const passwordValidation = (0, validation_1.validatePassword)(password);
            if (!passwordValidation.valid) {
                (0, validation_1.throwValidationError)(passwordValidation.message);
            }
            // Validate coordinates
            if (!(0, validation_1.validateCoordinates)(location.coordinates)) {
                (0, validation_1.throwValidationError)('Invalid coordinates');
            }
            // Check if user already exists
            const existingUser = await User_1.User.findOne({ email: email.toLowerCase() });
            if (existingUser) {
                (0, validation_1.throwValidationError)('Email already registered');
            }
            // Create user
            const user = new User_1.User({
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
            const token = (0, jwt_1.generateToken)(user);
            return { token, user };
        },
        // Login user
        login: async (_, { email, password }) => {
            // Find user by email
            const user = await User_1.User.findOne({ email: email.toLowerCase() });
            if (!user) {
                (0, validation_1.throwValidationError)('Invalid email or password');
            }
            // Check password
            const isMatch = await user.comparePassword(password);
            if (!isMatch) {
                (0, validation_1.throwValidationError)('Invalid email or password');
            }
            // Generate token
            const token = (0, jwt_1.generateToken)(user);
            return { token, user: user };
        },
        // Update user profile
        updateProfile: async (_, { input }, { user }) => {
            if (!user)
                (0, validation_1.throwAuthError)();
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
            const updatedUser = await User_1.User.findByIdAndUpdate(user._id, { $set: updateData }, { new: true, runValidators: true });
            if (!updatedUser) {
                (0, validation_1.throwNotFoundError)('User');
            }
            return updatedUser;
        },
        // Update user location
        updateLocation: async (_, { location }, { user }) => {
            if (!user)
                (0, validation_1.throwAuthError)();
            if (!(0, validation_1.validateCoordinates)(location.coordinates)) {
                (0, validation_1.throwValidationError)('Invalid coordinates');
            }
            const updatedUser = await User_1.User.findByIdAndUpdate(user._id, {
                $set: {
                    location: {
                        type: 'Point',
                        coordinates: location.coordinates,
                        address: location.address,
                    },
                },
            }, { new: true });
            if (!updatedUser) {
                (0, validation_1.throwNotFoundError)('User');
            }
            return updatedUser;
        },
        // Toggle sitter availability
        toggleAvailability: async (_, { isAvailable, message }, { user }) => {
            if (!user)
                (0, validation_1.throwAuthError)();
            if (user.userType !== User_1.UserType.SITTER) {
                (0, validation_1.throwValidationError)('Only sitters can toggle availability');
            }
            const updatedUser = await User_1.User.findByIdAndUpdate(user._id, {
                $set: {
                    isAvailable,
                    ...(message !== undefined && { availabilityMessage: message }),
                },
            }, { new: true });
            if (!updatedUser) {
                (0, validation_1.throwNotFoundError)('User');
            }
            return updatedUser;
        },
        // Add a dog (for owners)
        addDog: async (_, { dog }, { user }) => {
            if (!user)
                (0, validation_1.throwAuthError)();
            if (user.userType !== User_1.UserType.OWNER) {
                (0, validation_1.throwValidationError)('Only owners can add dogs');
            }
            const updatedUser = await User_1.User.findByIdAndUpdate(user._id, { $push: { dogs: dog } }, { new: true, runValidators: true });
            if (!updatedUser) {
                (0, validation_1.throwNotFoundError)('User');
            }
            return updatedUser;
        },
        // Update a dog
        updateDog: async (_, { index, dog }, { user }) => {
            if (!user)
                (0, validation_1.throwAuthError)();
            if (user.userType !== User_1.UserType.OWNER) {
                (0, validation_1.throwValidationError)('Only owners can update dogs');
            }
            if (index < 0 || index >= user.dogs.length) {
                (0, validation_1.throwValidationError)('Invalid dog index');
            }
            const updateKey = `dogs.${index}`;
            const updatedUser = await User_1.User.findByIdAndUpdate(user._id, { $set: { [updateKey]: dog } }, { new: true, runValidators: true });
            if (!updatedUser) {
                (0, validation_1.throwNotFoundError)('User');
            }
            return updatedUser;
        },
        // Remove a dog
        removeDog: async (_, { index }, { user }) => {
            if (!user)
                (0, validation_1.throwAuthError)();
            if (user.userType !== User_1.UserType.OWNER) {
                (0, validation_1.throwValidationError)('Only owners can remove dogs');
            }
            if (index < 0 || index >= user.dogs.length) {
                (0, validation_1.throwValidationError)('Invalid dog index');
            }
            // Remove by setting to null then pulling
            const updateKey = `dogs.${index}`;
            await User_1.User.findByIdAndUpdate(user._id, {
                $unset: { [updateKey]: 1 },
            });
            const updatedUser = await User_1.User.findByIdAndUpdate(user._id, { $pull: { dogs: null } }, { new: true });
            if (!updatedUser) {
                (0, validation_1.throwNotFoundError)('User');
            }
            return updatedUser;
        },
    },
    // Field resolvers
    User: {
        id: (parent) => parent._id.toString(),
    },
};
//# sourceMappingURL=user.js.map