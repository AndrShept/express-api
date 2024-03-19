const { prisma } = require('../prisma/prisma');
const bcrypt = require('bcryptjs');
const jdentIcon = require('jdenticon');
const path = require('path');
const fs = require('fs');
const UserController = {
  register: async (req, res) => {
    const { email, password, username } = req.body;
    if (!email || !password || !username) {
      return res
        .status(400)
        .json({ error: 'Fields name, password, username required' });
    }

    try {
      const existingUserByEmail = await prisma.user.findUnique({
        where: { email },
      });
      if (existingUserByEmail) {
        return res.status(400).json({ message: 'User email already exists' });
      }
      const existingUserByUsername = await prisma.user.findUnique({
        where: { username },
      });
      if (existingUserByUsername) {
        return res
          .status(400)
          .json({ message: 'Username already exists try change username' });
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      const png = jdentIcon.toPng(username, 200);
      const avatarName = `${username}_${new Date().toLocaleDateString()}.png`;
      const avatarPath = path.join(__dirname, '../uploads', avatarName);
      fs.writeFileSync(avatarPath, png);
      const newUser = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          username,
          avatarUrl: avatarPath,
        },
      });

      return res.status(201).json(newUser);
    } catch (error) {
      console.error(`Error in register ${error} `);
      return res.status(500).json({ error: 'Internal database error' });
    }
  },
  login: async (req, res) => {
    await prisma.user.deleteMany();
    return res.send('ok');
  },
  getUserById: async (req, res) => {
    const { userId } = await req.body;
    try {
      const user = prisma.user.findUnique({
        where: { id: userId },
      });
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      return res.status(200).json(user);
    } catch (error) {
      console.error(`Internal database error ${error} `);
      return res.status(500).json({ error: 'Internal database error' });
    }
  },
  getUserByUsername: async (req, res) => {
    console.log(req.url);
    const { username } = req.url;

    try {
      const user = await prisma.user.findUnique({
        where: { username },
      });
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      return res.status(200).json(user);
    } catch (error) {
      console.error(`Internal database error ${error} `);
      return res.status(500).json({ error: 'Internal database error' });
    }
  },
  updateUser: async (req, res) => {
    const {} = await req.body;
    try {
    } catch (error) {
      console.error(`Internal database error ${error} `);
      return res.status(500).json({ error: 'Internal database error' });
    }
  },
  current: async (req, res) => {
    const {} = await req.body;
    try {
    } catch (error) {
      console.error(`Internal database error ${error} `);
      return res.status(500).json({ error: 'Internal database error' });
    }
  },
};

module.exports = UserController;
