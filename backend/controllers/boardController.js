import Board from "../models/Board.js";
import User from "../models/User.js";

export const createBoard = async (req, res) => {

    const board = await Board.create({
        title: req.body.title,
        owner: req.user.id
    });

    res.json(board);

}

export const getBoards = async (req, res) => {

    const boards = await Board.find({
        owner: req.user.id
    });

    res.json(boards);

}

export const inviteMember = async (req,res)=>{

  try{

    const {boardId,email} = req.body;

    const user = await User.findOne({email});

    if(!user){
      return res.status(404).json({message:"User not found"});
    }

    const board = await Board.findByIdAndUpdate(
      boardId,
      {$addToSet:{members:user._id}},
      {new:true}
    );

    res.json(board);

  }catch(error){
    res.status(500).json({message:error.message});
  }

}