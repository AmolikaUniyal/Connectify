const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bcrypt=require("bcryptjs");
const jwt = require("jsonwebtoken");
const auth=require("../middleware/auth");

// Signup route
router.post("/signup", async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const normalizedEmail = email?.trim().toLowerCase();

    if (!username?.trim() || !normalizedEmail || !password || password.length < 6) {
      return res.status(400).json({
        message: "Username, email, and a password of at least 6 characters are required."
      });
    }

    const existingUser = await User.findOne({
      $or: [{ email: normalizedEmail }, { username: username.trim() }]
    });

    if (existingUser) {
      return res.status(409).json({ message: "Email or username is already registered." });
    }

    const salt=await bcrypt.genSalt(10);
    const hashedPassword=await bcrypt.hash(password,salt);
    const user = new User({
      username: username.trim(),
      email: normalizedEmail,
      password: hashedPassword
    });

    await user.save();

    res.status(201).json({
      message: "User created successfully"
    });

  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});

module.exports = router;


router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email?.trim().toLowerCase();

    if (!normalizedEmail || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    // 1. Check if user exists
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    // 2. Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // 3. Success
    const token=jwt.sign(
        {id:user._id },
        process.env.JWT_SECRET,
        {expiresIn:"1h"}
    );


        
    res.json({
      message: "Login successful",
      token,
      user: { id: user._id, username: user.username, email: user.email }
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


//Protected route

router.get("/profile", auth, async (req, res) => {
  const user = await User.findById(req.user.id).select("username email createdAt");

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  res.json({ user });
});
