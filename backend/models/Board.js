import mongoose from "mongoose";

const boardSchema = new mongoose.Schema({

  title: String,

  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }]

},{timestamps:true});

export default mongoose.model("Board",boardSchema);