import List from "../models/List.js";

export const createList = async (req, res) => {

  try {

    const { title, boardId } = req.body;

    const list = await List.create({
      title,
      boardId
    });

    res.json(list);

  } catch (error) {

    res.status(500).json({ message: error.message });

  }

};

export const getLists = async (req, res) => {

  try {

    const lists = await List.find({
      boardId: req.params.boardId
    });

    res.json(lists);

  } catch (error) {

    res.status(500).json({ message: error.message });

  }

};