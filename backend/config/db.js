import mongoose from "mongoose";

const connectDB = async () => {
    try {
        console.log("🔄 Connecting to MongoDB Atlas...");
        await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 5000,
            family: 4, // Force IPv4 to avoid DNS resolution issues on some local networks
        });
        console.log("✅ MongoDB Connected Successfully to Atlas");
    } catch (error) {
        console.error("❌ MongoDB Atlas Connection Error:", error.message);
        
        // Attempt to fallback to a local MongoDB instance if one is listening on port 27017
        try {
            console.log("🔄 Attempting to connect to Local MongoDB Fallback (127.0.0.1:27017)...");
            await mongoose.connect("mongodb://127.0.0.1:27017/taskmanager", {
                serverSelectionTimeoutMS: 3000,
                family: 4,
            });
            console.log("✅ Connected successfully to Local MongoDB Fallback!");
        } catch (localError) {
            console.error("❌ Local MongoDB Fallback also failed:", localError.message);
            if (error.message.includes('ECONNREFUSED')) {
                console.error("TIP: Your local DNS cannot resolve the MongoDB Atlas SRV record. Try changing your DNS to 8.8.8.8 or use a standard connection string.");
            }
            // Do not crash the entire server; let it run so development remains responsive!
            console.warn("⚠️ Server will run without an active database connection. Some database-related API features will fail, but the server is online.");
        }
    }
};

export default connectDB;