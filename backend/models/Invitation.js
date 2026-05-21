import mongoose from "mongoose";

const invitationSchema = new mongoose.Schema({
  email: { 
    type: String, 
    required: [true, "Email address is required"], 
    trim: true, 
    lowercase: true 
  },
  boardId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Board", 
    required: true 
  },
  role: { 
    type: String, 
    enum: ["admin", "editor", "viewer"], 
    default: "editor" 
  },
  token: { 
    type: String, 
    unique: true, 
    required: true 
  },
  status: { 
    type: String, 
    enum: ["pending", "accepted", "revoked"], 
    default: "pending" 
  },
  invitedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  }
}, { 
  timestamps: true 
});

export default mongoose.model("Invitation", invitationSchema);
