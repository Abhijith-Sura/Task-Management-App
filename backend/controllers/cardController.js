import Card from "../models/Card.js";
import Activity from "../models/Activity.js";

export const createCard = async (req, res) => {

    try {

        const { cardId, title, description, listId } = req.body;

        const card = await Card.create({
            title,
            description,
            listId
        });
        // Activity log
    await Activity.create({
      user: req.user.id,
      action: "Moved card",
      cardId: cardId
    });

        res.json(card);

    } catch (error) {

        res.status(500).json({ message: error.message });

    }

};

export const getCards = async (req, res) => {

    try {

        const cards = await Card.find({
            listId: req.params.listId
        });

        res.json(cards);

    } catch (error) {

        res.status(500).json({ message: error.message });

    }

};

export const moveCard = async (req, res) => {

  try {

    const { cardId, newListId } = req.body;

    const card = await Card.findByIdAndUpdate(
      cardId,
      { listId: newListId },
      { new: true }
    );

    res.json(card);

  } catch (error) {

    res.status(500).json({ message: error.message });

  }

};

export const uploadAttachment = async (req, res) => {
  try {

    if (!req.body) {
      return res.status(400).json({ message: "Request body missing" });
    }

    const { cardId } = req.body;

    if (!cardId) {
      return res.status(400).json({ message: "cardId is required" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const filePath = req.file.path;

    const card = await Card.findByIdAndUpdate(
      cardId,
      { $push: { attachments: filePath } },
      { new: true }
    );

    res.json(card);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};