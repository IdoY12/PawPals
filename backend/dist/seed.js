"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const User_1 = require("./models/User");
const Request_1 = require("./models/Request");
const Message_1 = require("./models/Message");
const Review_1 = require("./models/Review");
dotenv_1.default.config();
// Seed data for dog owners
const dogOwners = [
    {
        email: 'owner1@example.com',
        password: 'password123',
        userType: User_1.UserType.OWNER,
        name: 'Sarah Johnson',
        phone: '+1234567890',
        profilePicture: 'https://randomuser.me/api/portraits/women/1.jpg',
        location: {
            type: 'Point',
            coordinates: [-73.9857, 40.7484], // NYC - Times Square area
            address: '123 Main St, New York, NY',
        },
        dogs: [
            {
                name: 'Buddy',
                breed: 'Golden Retriever',
                age: 3,
                description: 'Friendly and loves to play fetch',
            },
        ],
    },
    {
        email: 'owner2@example.com',
        password: 'password123',
        userType: User_1.UserType.OWNER,
        name: 'Mike Chen',
        phone: '+1234567891',
        profilePicture: 'https://randomuser.me/api/portraits/men/2.jpg',
        location: {
            type: 'Point',
            coordinates: [-73.9712, 40.7831], // NYC - Upper West Side
            address: '456 Park Ave, New York, NY',
        },
        dogs: [
            {
                name: 'Luna',
                breed: 'Labrador',
                age: 2,
                description: 'Very energetic and loves water',
            },
            {
                name: 'Max',
                breed: 'Beagle',
                age: 5,
                description: 'Calm and great with kids',
            },
        ],
    },
    {
        email: 'owner3@example.com',
        password: 'password123',
        userType: User_1.UserType.OWNER,
        name: 'Emily Davis',
        phone: '+1234567892',
        profilePicture: 'https://randomuser.me/api/portraits/women/3.jpg',
        location: {
            type: 'Point',
            coordinates: [-73.9654, 40.7829], // NYC - Central Park area
            address: '789 5th Ave, New York, NY',
        },
        dogs: [
            {
                name: 'Charlie',
                breed: 'French Bulldog',
                age: 4,
                description: 'Loves cuddles and short walks',
            },
        ],
    },
    {
        email: 'owner4@example.com',
        password: 'password123',
        userType: User_1.UserType.OWNER,
        name: 'David Wilson',
        phone: '+1234567893',
        profilePicture: 'https://randomuser.me/api/portraits/men/4.jpg',
        location: {
            type: 'Point',
            coordinates: [-73.9442, 40.6782], // Brooklyn
            address: '321 Brooklyn Ave, Brooklyn, NY',
        },
        dogs: [
            {
                name: 'Rocky',
                breed: 'German Shepherd',
                age: 6,
                description: 'Well-trained and protective',
            },
        ],
    },
    {
        email: 'owner5@example.com',
        password: 'password123',
        userType: User_1.UserType.OWNER,
        name: 'Jessica Martinez',
        phone: '+1234567894',
        profilePicture: 'https://randomuser.me/api/portraits/women/5.jpg',
        location: {
            type: 'Point',
            coordinates: [-73.9519, 40.7681], // NYC - Upper East Side
            address: '555 Madison Ave, New York, NY',
        },
        dogs: [
            {
                name: 'Daisy',
                breed: 'Poodle',
                age: 2,
                description: 'Hypoallergenic and very smart',
            },
        ],
    },
];
// Seed data for dog sitters
const dogSitters = [
    {
        email: 'sitter1@example.com',
        password: 'password123',
        userType: User_1.UserType.SITTER,
        name: 'Alex Thompson',
        phone: '+1234567895',
        profilePicture: 'https://randomuser.me/api/portraits/men/6.jpg',
        location: {
            type: 'Point',
            coordinates: [-73.9866, 40.7488], // NYC - Near Times Square
            address: '100 W 42nd St, New York, NY',
        },
        isAvailable: true,
        availabilityMessage: 'Available weekends! Love all dogs 🐕',
        hourlyRate: 25,
        bio: 'Professional dog walker with 5 years experience. CPR certified and insured.',
        rating: 4.8,
        reviewCount: 23,
        totalRatingSum: 110.4,
    },
    {
        email: 'sitter2@example.com',
        password: 'password123',
        userType: User_1.UserType.SITTER,
        name: 'Olivia Brown',
        phone: '+1234567896',
        profilePicture: 'https://randomuser.me/api/portraits/women/7.jpg',
        location: {
            type: 'Point',
            coordinates: [-73.9747, 40.7614], // NYC - Midtown
            address: '200 W 57th St, New York, NY',
        },
        isAvailable: true,
        availabilityMessage: 'Flexible schedule! Special rates for long-term bookings',
        hourlyRate: 30,
        bio: 'Veterinary technician by day, dog sitter by night. Your furry friend is in safe hands!',
        rating: 4.9,
        reviewCount: 45,
        totalRatingSum: 220.5,
    },
    {
        email: 'sitter3@example.com',
        password: 'password123',
        userType: User_1.UserType.SITTER,
        name: 'James Anderson',
        phone: '+1234567897',
        profilePicture: 'https://randomuser.me/api/portraits/men/8.jpg',
        location: {
            type: 'Point',
            coordinates: [-73.9876, 40.7558], // NYC - Hell's Kitchen
            address: '300 W 48th St, New York, NY',
        },
        isAvailable: false,
        availabilityMessage: 'Currently booked - available next week',
        hourlyRate: 22,
        bio: 'Dog lover and experienced pet sitter. I treat every dog like my own!',
        rating: 4.6,
        reviewCount: 18,
        totalRatingSum: 82.8,
    },
    {
        email: 'sitter4@example.com',
        password: 'password123',
        userType: User_1.UserType.SITTER,
        name: 'Sophie Garcia',
        phone: '+1234567898',
        profilePicture: 'https://randomuser.me/api/portraits/women/9.jpg',
        location: {
            type: 'Point',
            coordinates: [-73.9632, 40.7794], // NYC - Upper West
            address: '400 W 79th St, New York, NY',
        },
        isAvailable: true,
        availabilityMessage: 'Morning and evening walks available! 🌅',
        hourlyRate: 28,
        bio: 'Former shelter volunteer with experience handling dogs of all sizes and temperaments.',
        rating: 4.7,
        reviewCount: 32,
        totalRatingSum: 150.4,
    },
    {
        email: 'sitter5@example.com',
        password: 'password123',
        userType: User_1.UserType.SITTER,
        name: 'Daniel Lee',
        phone: '+1234567899',
        profilePicture: 'https://randomuser.me/api/portraits/men/10.jpg',
        location: {
            type: 'Point',
            coordinates: [-73.9557, 40.7705], // NYC - East Side
            address: '500 E 72nd St, New York, NY',
        },
        isAvailable: true,
        availabilityMessage: 'Overnight stays welcome! Fenced backyard available',
        hourlyRate: 35,
        bio: 'Running coach who loves taking dogs on long runs. Perfect for high-energy pups!',
        rating: 4.9,
        reviewCount: 28,
        totalRatingSum: 137.2,
    },
];
async function seedDatabase() {
    try {
        // Connect to MongoDB
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/dog-sitting';
        await mongoose_1.default.connect(mongoUri);
        console.log('✅ Connected to MongoDB');
        // Clear existing data
        console.log('🗑️  Clearing existing data...');
        await User_1.User.deleteMany({});
        await Request_1.Request.deleteMany({});
        await Message_1.Message.deleteMany({});
        await Review_1.Review.deleteMany({});
        // Create dog owners
        console.log('👤 Creating dog owners...');
        const createdOwners = await User_1.User.insertMany(dogOwners);
        console.log(`   Created ${createdOwners.length} dog owners`);
        // Create dog sitters
        console.log('🐕 Creating dog sitters...');
        const createdSitters = await User_1.User.insertMany(dogSitters);
        console.log(`   Created ${createdSitters.length} dog sitters`);
        // Create some sample requests
        console.log('📝 Creating sample requests...');
        const requests = [
            {
                ownerId: createdOwners[0]._id,
                message: 'Need someone to watch Buddy this weekend while I\'m traveling!',
                startDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
                endDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // 4 days from now
                location: createdOwners[0].location,
                status: Request_1.RequestStatus.ACTIVE,
                specialInstructions: 'Buddy needs 2 walks per day and loves belly rubs!',
                preferredRate: 25,
            },
            {
                ownerId: createdOwners[1]._id,
                message: 'Looking for a dog walker for Luna and Max - daily walks needed',
                startDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
                endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                location: createdOwners[1].location,
                status: Request_1.RequestStatus.ACTIVE,
                specialInstructions: 'Luna needs extra exercise, Max is calmer',
                preferredRate: 30,
            },
            {
                ownerId: createdOwners[2]._id,
                message: 'Weekend pet sitting for Charlie - he\'s a sweetheart!',
                startDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
                endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                location: createdOwners[2].location,
                status: Request_1.RequestStatus.ACTIVE,
                specialInstructions: 'Charlie has sensitive stomach - special food provided',
                preferredRate: 28,
            },
        ];
        await Request_1.Request.insertMany(requests);
        console.log(`   Created ${requests.length} sample requests`);
        // Create some sample messages
        console.log('💬 Creating sample messages...');
        const conversationId = [createdOwners[0]._id.toString(), createdSitters[0]._id.toString()].sort().join('_');
        const messages = [
            {
                senderId: createdOwners[0]._id,
                receiverId: createdSitters[0]._id,
                conversationId,
                content: 'Hi! I saw you\'re available this weekend. Would you be able to watch my dog Buddy?',
                isRead: true,
                createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
            },
            {
                senderId: createdSitters[0]._id,
                receiverId: createdOwners[0]._id,
                conversationId,
                content: 'Hi Sarah! Yes, I\'d love to help! Buddy sounds adorable. Can you tell me more about his routine?',
                isRead: true,
                createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
            },
            {
                senderId: createdOwners[0]._id,
                receiverId: createdSitters[0]._id,
                conversationId,
                content: 'He needs 2 walks a day and loves to play fetch. He\'s very friendly!',
                isRead: false,
                createdAt: new Date(Date.now() - 30 * 60 * 1000),
            },
        ];
        await Message_1.Message.insertMany(messages);
        console.log(`   Created ${messages.length} sample messages`);
        // Create some reviews
        console.log('⭐ Creating sample reviews...');
        const reviews = [
            {
                reviewerId: createdOwners[0]._id,
                revieweeId: createdSitters[0]._id,
                rating: 5,
                comment: 'Alex was amazing with Buddy! Sent lots of photos and updates. Will definitely book again!',
            },
            {
                reviewerId: createdOwners[1]._id,
                revieweeId: createdSitters[1]._id,
                rating: 5,
                comment: 'Olivia is wonderful! She handled both Luna and Max perfectly. True professional!',
            },
            {
                reviewerId: createdOwners[2]._id,
                revieweeId: createdSitters[3]._id,
                rating: 4,
                comment: 'Sophie took great care of Charlie. Very reliable and communicative.',
            },
        ];
        await Review_1.Review.insertMany(reviews);
        console.log(`   Created ${reviews.length} sample reviews`);
        console.log('\n✅ Database seeded successfully!');
        console.log('\n📋 Test Accounts:');
        console.log('   Dog Owners:');
        dogOwners.forEach(owner => {
            console.log(`   - ${owner.email} / ${owner.password}`);
        });
        console.log('\n   Dog Sitters:');
        dogSitters.forEach(sitter => {
            console.log(`   - ${sitter.email} / ${sitter.password}`);
        });
    }
    catch (error) {
        console.error('❌ Error seeding database:', error);
        process.exit(1);
    }
    finally {
        await mongoose_1.default.disconnect();
        console.log('\n📴 Disconnected from MongoDB');
        process.exit(0);
    }
}
// Run seed
seedDatabase();
//# sourceMappingURL=seed.js.map