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
 * - OWNER can change STAFF/MANAGER roles
 * - STAFF/MANAGER cannot change anyone's role
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
    const newRole = req.body.role;

    // Rule 1: No one can change their own role
    if (requesterId === targetId) {
        return res.status(403).json({
            status: 403,
            message: 'You cannot change your own role. Contact another OWNER for assistance.'
        });
    }

    // Rule 2: Only OWNER can change roles
    if (requesterRole !== 'OWNER') {
        return res.status(403).json({
            status: 403,
            message: 'Access denied. Only OWNER can change roles.'
        });
    }

    // Rule 3: Validate new role
    const validRoles = ['STAFF', 'MANAGER', 'OWNER'];
    if (!validRoles.includes(newRole.toUpperCase())) {
        return res.status(400).json({
            status: 400,
            message: 'Invalid role. Must be one of: STAFF, MANAGER, OWNER'
        });
    }

    // All checks passed, allow role change
    next();
}
