import jwt from 'jsonwebtoken';
const SECRET = process.env.JWT_SECRET || 'default-secret-key';

/**
 * Verify JWT token middleware
 * Extracts user info from token and attaches to req.user
 */
export function verifyToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return res.status(401).json({ message: 'Missing token' });

    const token = authHeader.split(' ')[1];
    jwt.verify(token, SECRET, (err, user) => {
        if (err) return res.status(403).json({ message: 'Invalid token' });
        req.user = user; // { id, username, role, name }
        next();
    });
}

/**
 * Verify admin role middleware
 * @param {Array<String>} allowedRoles - Array of allowed roles (e.g., ['OWNER', 'MANAGER'])
 * @returns {Function} Express middleware
 * 
 * Usage:
 * router.post('/register-admin', verifyToken, verifyRole(['OWNER']), registerAdminController);
 */
export function verifyRole(allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                status: 401,
                message: 'Authentication required'
            });
        }

        const userRole = req.user.role;

        if (!allowedRoles.includes(userRole)) {
            return res.status(403).json({
                status: 403,
                message: `Access denied. Required role: ${allowedRoles.join(' or ')}. Your role: ${userRole}`
            });
        }

        next();
    };
}

/**
 * Verify admin can modify target (self or OWNER can modify anyone)
 * Used for password change, update profile, etc.
 * @param {Boolean} ownerCanModifyAll - If true, OWNER can modify any admin
 */
export function verifySelfOrOwner(ownerCanModifyAll = true) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                status: 401,
                message: 'Authentication required'
            });
        }

        const requesterId = req.user.id;
        const requesterRole = req.user.role;
        const targetId = parseInt(req.params.id);

        // Allow if modifying self
        if (requesterId === targetId) {
            return next();
        }

        // Allow if OWNER and ownerCanModifyAll is true
        if (ownerCanModifyAll && requesterRole === 'OWNER') {
            return next();
        }


        return res.status(403).json({
            status: 403,
            message: 'Access denied. You can only modify your own account.'
        });
    };
}

/**
 * Verify role change permission
 * Rules:
 * - No one can change their own role (including OWNER)
 * - OWNER can change STAFF/MANAGER/OWNER roles
 * - MANAGER can only change STAFF roles
 * - STAFF cannot change anyone's role
 */
export function verifyRoleChangePermission(req, res, next) {
    // Only check if 'role' is being updated
    if (req.body.role === undefined) {
        return next(); // No role change, allow
    }

    if (!req.user) {
        return res.status(401).json({
            status: 401,
            message: 'Authentication required'
        });
    }

    const requesterId = req.user.id;
    const requesterRole = req.user.role;
    const targetId = parseInt(req.params.id);
    const newRole = req.body.role.toUpperCase();

    // Rule 1: No one can change their own role
    if (requesterId === targetId) {
        return res.status(403).json({
            status: 403,
            message: 'You cannot change your own role. Contact another OWNER for assistance.'
        });
    }

    // Rule 2: Validate new role
    const validRoles = ['STAFF', 'MANAGER', 'OWNER'];
    if (!validRoles.includes(newRole)) {
        return res.status(400).json({
            status: 400,
            message: 'Invalid role. Must be one of: STAFF, MANAGER, OWNER'
        });
    }

    // Rule 3: STAFF cannot change roles
    if (requesterRole === 'STAFF') {
        return res.status(403).json({
            status: 403,
            message: 'Access denied. STAFF cannot change roles.'
        });
    }

    // Rule 4: MANAGER can only change to STAFF role
    if (requesterRole === 'MANAGER' && newRole !== 'STAFF') {
        return res.status(403).json({
            status: 403,
            message: 'Access denied. MANAGER can only change roles to STAFF.'
        });
    }

    // Rule 5: OWNER can change any role
    // (implicitly allowed by reaching this point)

    // All checks passed, allow role change
    next();
}

/**
 * Verify management hierarchy permission
 * Rules:
 * - OWNER can manage all accounts (OWNER, MANAGER, STAFF)
 * - MANAGER can only manage STAFF accounts
 * - STAFF cannot manage any accounts
 * 
 * This should be used for operations like:
 * - Creating accounts
 * - Deleting accounts
 * - Resetting passwords
 * - Activating/Deactivating accounts
 */
export function verifyManagementHierarchy(req, res, next) {
    if (!req.user) {
        return res.status(401).json({
            status: 401,
            message: 'Authentication required'
        });
    }

    const requesterRole = req.user.role;

    // For create operations (POST), check the role being created
    if (req.method === 'POST' && req.body.role) {
        const targetRole = req.body.role.toUpperCase();

        // OWNER can create any role
        if (requesterRole === 'OWNER') {
            return next();
        }

        // MANAGER can only create STAFF
        if (requesterRole === 'MANAGER' && targetRole === 'STAFF') {
            return next();
        }

        // STAFF cannot create accounts
        return res.status(403).json({
            status: 403,
            message: requesterRole === 'MANAGER'
                ? 'MANAGER can only create STAFF accounts'
                : 'Access denied. Insufficient permissions.'
        });
    }

    // For operations on existing accounts (PUT, DELETE), we need to check target's role
    // This requires fetching the target account from DB
    // We'll attach this check in the controller itself
    next();
}

