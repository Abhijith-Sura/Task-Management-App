import jwt from "jsonwebtoken";

const authMiddleware = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader?.split(" ")[1];

        if (!token) {
            console.log('📡 AUTH_FAILURE: No token detected in request headers');
            return res.status(401).json({ message: "No token provided" });
        }

        if (!process.env.JWT_SECRET) {
            console.error('❌ AUTH_CRITICAL_ERROR: JWT_SECRET is undefined in environment');
            return res.status(500).json({ message: "Server configuration error" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();

    } catch (error) {
        console.log('📡 AUTH_FAILURE: Token verification failed', { error: error.message });
        return res.status(401).json({ message: "Invalid token" });
    }
};

export default authMiddleware;