const prisma = require('../database/prisma');
const { hashPassword, comparePassword } = require('../utils/hash');
const { generateToken } = require('../utils/token');
const logger = require('../utils/logger');

/**
 * Register a new user
 * @param {Object} data - { email, password, role }
 * @returns {Object} - { user, token }
 */
async function register(data) {
    const { email, password, role = 'USER' } = data;

    // Check if user exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
        throw new Error('Email already registered');
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
        data: {
            email,
            password: hashedPassword,
            role: role.toUpperCase(),
            status: 'ACTIVE'
        },
        select: {
            id: true,
            email: true,
            role: true,
            status: true,
            createdAt: true
        }
    });

    // Auto-create wallet for USER role
    if (user.role === 'USER') {
        await prisma.wallet.create({
            data: {
                userId: user.id,
                balance: 0,
                locked: false
            }
        });
        logger.info(`Wallet created for user ${user.id}`);
    }

    // Generate token
    const token = generateToken({
        id: user.id,
        email: user.email,
        role: user.role
    });

    logger.info(`User registered: ${user.email} (${user.role})`);

    return { user, token };
}

/**
 * Login user/admin/master
 * @param {Object} credentials - { email, password }
 * @returns {Object} - { user, token }
 */
async function login(credentials) {
    const { email, password } = credentials;

    // Find user
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
        throw new Error('Invalid credentials');
    }

    // Check if user is active
    if (user.status === 'SUSPENDED') {
        throw new Error('Account suspended');
    }

    if (user.status === 'FROZEN') {
        throw new Error('Account frozen');
    }

    // Verify password
    const isValid = await comparePassword(password, user.password);

    if (!isValid) {
        throw new Error('Invalid credentials');
    }

    // Generate token
    const token = generateToken({
        id: user.id,
        email: user.email,
        role: user.role
    });

    logger.info(`User logged in: ${user.email} (${user.role})`);

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;

    return {
        user: userWithoutPassword,
        token,
        role: user.role
    };
}

/**
 * Register admin account
 * @param {Object} data - { email, password }
 * @returns {Object} - { admin }
 */
async function registerAdmin(data) {
    const { email, password } = data;

    // Check if admin exists
    const existing = await prisma.admin.findUnique({ where: { email } });
    if (existing) {
        throw new Error('Admin email already registered');
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create admin
    const admin = await prisma.admin.create({
        data: {
            email,
            password: hashedPassword,
            active: true
        },
        select: {
            id: true,
            email: true,
            active: true,
            createdAt: true
        }
    });

    logger.info(`Admin registered: ${admin.email}`);

    return { admin };
}

/**
 * Login admin
 * @param {Object} credentials - { email, password }
 * @returns {Object} - { admin, token }
 */
async function loginAdmin(credentials) {
    const { email, password } = credentials;

    // Find admin
    const admin = await prisma.admin.findUnique({ where: { email } });

    if (!admin) {
        throw new Error('Invalid admin credentials');
    }

    if (!admin.active) {
        throw new Error('Admin account disabled');
    }

    // Verify password
    const isValid = await comparePassword(password, admin.password);

    if (!isValid) {
        throw new Error('Invalid admin credentials');
    }

    // Generate token with ADMIN role
    const token = generateToken({
        id: admin.id,
        email: admin.email,
        role: 'ADMIN'
    });

    logger.info(`Admin logged in: ${admin.email}`);

    // Return admin without password
    const { password: _, ...adminWithoutPassword } = admin;

    return {
        admin: adminWithoutPassword,
        token,
        role: 'ADMIN'
    };
}

module.exports = {
    register,
    login,
    registerAdmin,
    loginAdmin
};
