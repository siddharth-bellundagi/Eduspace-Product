/**
 * create-admin.js — One-time script to create an admin user in Firebase Auth
 *
 * Usage:
 *   cd backend
 *   node scripts/create-admin.js
 *
 * This will:
 *   1. Create a Firebase Auth user with email/password
 *   2. Set custom claim { admin: true } on that user
 *   3. Print the credentials for you to use
 */

require('dotenv').config();
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK using env variables (same as src/config/firebase.js)
admin.initializeApp({
    credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    }),
});

// ═══════════════════════════════════════════
// ✏️  CHANGE THESE TO YOUR DESIRED CREDENTIALS
// ═══════════════════════════════════════════
const ADMIN_EMAIL = 'admin@edusphere.app';
const ADMIN_PASSWORD = 'EduSphere@2026#SecureAdmin';
const ADMIN_DISPLAY_NAME = 'School Admin';
// ═══════════════════════════════════════════

async function createAdmin() {
    try {
        console.log('🔧 Creating admin user...\n');

        // Step 1: Create the user (or get existing)
        let user;
        try {
            user = await admin.auth().createUser({
                email: ADMIN_EMAIL,
                password: ADMIN_PASSWORD,
                displayName: ADMIN_DISPLAY_NAME,
                emailVerified: true,
            });
            console.log('✅ User created successfully');
        } catch (error) {
            if (error.code === 'auth/email-already-exists') {
                console.log('ℹ️  User already exists — updating...');
                user = await admin.auth().getUserByEmail(ADMIN_EMAIL);
                await admin.auth().updateUser(user.uid, {
                    password: ADMIN_PASSWORD,
                    displayName: ADMIN_DISPLAY_NAME,
                    emailVerified: true,
                });
                console.log('✅ User updated successfully');
            } else {
                throw error;
            }
        }

        // Step 2: Set admin custom claim
        await admin.auth().setCustomUserClaims(user.uid, { admin: true });
        console.log('✅ Admin claim set successfully');

        // Step 3: Print summary
        console.log('\n═══════════════════════════════════════════');
        console.log('🎉 ADMIN USER READY!');
        console.log('═══════════════════════════════════════════');
        console.log(`   Email:    ${ADMIN_EMAIL}`);
        console.log(`   Password: ${ADMIN_PASSWORD}`);
        console.log(`   Name:     ${ADMIN_DISPLAY_NAME}`);
        console.log(`   UID:      ${user.uid}`);
        console.log('═══════════════════════════════════════════');
        console.log('\nUse these credentials to log in via the Admin Login button.');

        process.exit(0);
    } catch (error) {
        console.error('❌ Failed to create admin:', error.message);
        process.exit(1);
    }
}

createAdmin();
