const express = require("express");
const Task = require("../models/Task");
const { protect } = require("../middleware/auth");

const router = express.Router();

// All routes below require login — every user only ever sees their own tasks
router.use(protect);

// GET all tasks for the logged-in user
router.get("/", async (req, res) => {
  const tasks = await Task.find({ owner: req.user.id }).sort({ createdAt: -1 });
  res.json(tasks);
});

// CREATE task
router.post("/", async (req, res) => {
  try {
    const { title, description, status, priority, dueDate } = req.body;
    const task = await Task.create({
      title,
      description,
      status,
      priority,
      dueDate,
      owner: req.user.id
    });
    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// UPDATE task (edit fields or move status) — owner only
router.put("/:id", async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) return res.status(404).json({ message: "Task not found" });
  if (task.owner.toString() !== req.user.id) {
    return res.status(403).json({ message: "Not your task" });
  }

  const { title, description, status, priority, dueDate } = req.body;
  if (title !== undefined) task.title = title;
  if (description !== undefined) task.description = description;
  if (status !== undefined) task.status = status;
  if (priority !== undefined) task.priority = priority;
  if (dueDate !== undefined) task.dueDate = dueDate;

  await task.save();
  res.json(task);
});

// DELETE task — owner only
router.delete("/:id", async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) return res.status(404).json({ message: "Task not found" });
  if (task.owner.toString() !== req.user.id) {
    return res.status(403).json({ message: "Not your task" });
  }
  await task.deleteOne();
  res.json({ message: "Task deleted" });
});

module.exports = router;
