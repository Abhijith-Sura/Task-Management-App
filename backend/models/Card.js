import mongoose from "mongoose";

const cardSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Card title is required"],
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  listId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "List",
    required: true,
  },
  position: {
    type: Number,
    required: true,
  },
  priority: {
    type: String,
    enum: ["low", "medium", "high"],
    default: null
  },
  startDate: {
    type: Date,
    default: null
  },
  dueDate: Date,
  dueDateCompleted: {
    type: Boolean,
    default: false
  },
  coverUrl: {
    type: String,
    default: null
  },
  labels: [{
    text: String,
    color: String
  }],
  assignees: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],

  attachments: [{
    name: String,
    url: String,
    size: Number,
    mimeType: String,
    uploadedAt: { type: Date, default: Date.now }
  }],

  metadata: {
    budget: { type: Number, default: 0 },
    actualCost: { type: Number, default: 0 },
    department: { type: String, default: "" },
    estimatedHours: { type: Number, default: 0 },
    actualHours: { type: Number, default: 0 }
  },

  checklists: [{
    text: { type: String, required: true },
    completed: { type: Boolean, default: false }
  }]

},{timestamps:true});

export default mongoose.model("Card",cardSchema);