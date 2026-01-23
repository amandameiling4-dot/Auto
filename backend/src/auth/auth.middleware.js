import jwt from "jsonwebtoken";

export function authGuard(roles = []) {
    return (req, res, next) => {
        try {
            const token = req.headers.authorization?.split(" ")[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            if (roles.length && !roles.includes(decoded.role)) {
                return res.status(403).json({ error: "Forbidden" });
            }

            req.user = decoded;
            next();
        } catch {
            res.status(401).json({ error: "Unauthorized" });
        }
    };
}

// Alias for backward compatibility
export const guard = authGuard;
