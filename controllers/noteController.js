const User = require("../models/User");
const Note = require("../models/Note");
const mongoose = require("mongoose");
const asyncHandler = require("express-async-handler");

// @desc Get all Notes with usernames
// @routes GET /notes
// @access Private
const getAllNotes = asyncHandler(async (req, res) => {
  const notes = await Note.find().lean();

  // If no notes
  if (!notes?.length) {
    return res.status(400).json({ message: "No Notes found" });
  }

  // Add username to each note before sending the response
  const noteWithUser = await Promise.all(
    notes.map(async (note) => {
      const user = await User.findById(note.user).lean().exec();
      return { username: user.username, ...note };
    })
  );

  res.json(noteWithUser);
});

// @desc Create a new note
// @routes POST /notes
// @access Private
const createNewNote = asyncHandler(async (req, res) => {
  const { title, text, user } = req.body;

  // Check data
  if (!title || !text || !user) {
    return res.status(400).json({ message: "All fields are required" });
  }

  // Check for Duplicate title
  const duplicate = await Note.findOne({ title }).lean().exec();
  if (duplicate) {
    return res.status(409).json({ message: "Duplicate title" });
  }

  // Create and store new note
  const note = await Note.create({ title, text, user });

  if (note) {
    return res.status(201).json({ message: `New note has been created` }); //note created
  } else {
    return res.status(400).json({ message: "Invalid note data recieved" });
  }
});

// @desc Update a note
// @routes PATCH /notes
// @access Private
const updateNote = asyncHandler(async (req, res) => {
  const { id, title, text, user, completed } = req.body;

  // Confirm Data
  if (!title || !text || !user || !id || typeof completed !== "boolean") {
    return res.status(400).json({ message: "All fields are required" });
  }

  // Confirm requested notes existance in DB
  const note = await Note.findById(id).exec();
  if (!note) {
    return res
      .status(400)
      .json({ message: "The requested note doesn't exist" });
  }

  // Check for duplicate title
  const duplicate = await Note.findOne({ title }).lean().exec();

  // Allow renaming of the original note
  if (duplicate && duplicate?._id.toString() !== id) {
    return res.status(409).json({ message: "Duplicate note title" });
  }

  note.user = user;
  note.title = title;
  note.text = text;
  note.completed = completed;

  const updatedNote = await note.save();

  res.json({ message: `Note '${updatedNote.title}' updated` });
});

// @desc Delete a note
// @routes DELETE /notes
// @access Private
const deleteNote = asyncHandler(async (req, res) => {
  const { id } = req.body;

  // Confirm data
  if (!id) {
    return res.status(400).json({ message: "Note ID required" });
  }

  // Get note and check if it exists in db
  const note = await Note.findById(id).exec();

  if (!note) {
    return res.status(400).json({ message: "Note not found" });
  }

  await note.deleteOne();
  const reply = `Note with title '${note.title}' is deleted`;
  res.json(reply);
});

module.exports = { getAllNotes, createNewNote, updateNote, deleteNote };
