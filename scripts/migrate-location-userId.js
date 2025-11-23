/**
 * Migration script to add userId to existing locations
 * 
 * This script will:
 * 1. Find all locations without userId
 * 2. Assign them to a default user (first user in database)
 * 3. Or delete them if no users exist

 */

require('dotenv').config();
const mongoose = require('mongoose');
const Location = require('../models/Location');
const User = require('../models/User');
const logger = require('../services/logger');

async function migrateLocations() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('MONGODB_URI not found in environment variables');
      process.exit(1);
    }

    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Check if --delete flag is set
    const shouldDelete = process.argv.includes('--delete');

    // Find all locations without userId
    const locationsWithoutUserId = await Location.find({
      $or: [
        { userId: { $exists: false } },
        { userId: null },
      ],
    });

    console.log(`Found ${locationsWithoutUserId.length} locations without userId`);

    if (locationsWithoutUserId.length === 0) {
      console.log('No locations need migration. Exiting...');
      await mongoose.disconnect();
      process.exit(0);
    }

    if (shouldDelete) {
      // Delete locations without userId
      console.log('Deleting locations without userId...');
      const deleteResult = await Location.deleteMany({
        $or: [
          { userId: { $exists: false } },
          { userId: null },
        ],
      });
      console.log(`Deleted ${deleteResult.deletedCount} locations`);
    } else {
      // Find first user to assign locations to
      const firstUser = await User.findOne().sort({ createdAt: 1 });
      
      if (!firstUser) {
        console.error('No users found in database. Cannot assign userId to locations.');
        console.log('Use --delete flag to delete locations without userId instead.');
        await mongoose.disconnect();
        process.exit(1);
      }

      console.log(`Assigning locations to user: ${firstUser.email} (${firstUser._id})`);

      // Update all locations without userId
      const updateResult = await Location.updateMany(
        {
          $or: [
            { userId: { $exists: false } },
            { userId: null },
          ],
        },
        {
          $set: { userId: firstUser._id },
        }
      );

      console.log(`Updated ${updateResult.modifiedCount} locations with userId: ${firstUser._id}`);
    }

    // Verify migration
    const remainingLocations = await Location.find({
      $or: [
        { userId: { $exists: false } },
        { userId: null },
      ],
    });

    if (remainingLocations.length === 0) {
      console.log('✅ Migration completed successfully!');
    } else {
      console.warn(`⚠️  Warning: ${remainingLocations.length} locations still without userId`);
    }

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error);
    logger.error('Migration error', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Run migration
migrateLocations();

