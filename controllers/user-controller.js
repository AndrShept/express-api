const { prisma } = require('../prisma/prisma');
const bcrypt = require('bcryptjs');
const jdentIcon = require('jdenticon');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const { Resend } = require('resend');
const { onHtml } = require('../bin/utils');
const nodemailer = require('nodemailer');

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
      const avatarName = `${username}_${Date.now()}.png`;
      const avatarPath = path.join(__dirname, '/../uploads/images', avatarName);
      fs.writeFileSync(avatarPath, png);
      const newUser = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          username,
          avatarUrl: `/uploads/images/${avatarName}`,
        },
      });

      return res.status(201).json(newUser);
    } catch (error) {
      console.error(`Error in register ${error} `);
      return res
        .status(500)
        .json({ error: `Internal database error ${error}` });
    }
  },
  login: async (req, res) => {
    const { email, password } = req.body;

    if (!email) {
      return res.status(404).json({ message: 'Field email required' });
    }
    if (!password) {
      return res.status(404).json({ message: 'Field password required' });
    }
    try {
      const user = await prisma.user.findUnique({
        where: {
          email,
        },
      });
      if (!user) {
        return res.status(404).json({ message: 'Invalid email or password ' });
      }

      const valid = await bcrypt.compare(password, user.password);
      if (!valid) {
        return res.status(404).json({ message: 'Invalid email or password ' });
      }
      const token = jwt.sign({ userId: user.id }, process.env.SECRET_KEY);
      res.status(200).json({ token });
    } catch (error) {
      console.error(`Login error ${error} `);
      return res
        .status(500)
        .json({ error: `Internal database error ${error}` });
    }
  },
  getUserById: async (req, res) => {
    const { id } = req.params;
    const userId = req.user.userId;
    try {
      const user = await prisma.user.findUnique({
        where: { id },
        include: { followers: true, following: true },
      });
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      delete user.password;
      const isFollowing = await prisma.follows.findFirst({
        where: {
          AND: [
            { followerId: userId },
            {
              followingId: id,
            },
          ],
        },
      });
      return res
        .status(200)
        .json({ ...user, isFollowing: Boolean(isFollowing) });
    } catch (error) {
      console.error(`User by ID error ${error} `);
      return res
        .status(500)
        .json({ error: `Internal database error ${error}` });
    }
  },
  getUserByUsername: async (req, res) => {
    const { username } = req.params;
    const userId = req.user.userId;
    try {
      const user = await prisma.user.findUnique({
        where: { username },
        include: {
          _count: {
            select: {
              comments: true,
              followers: true,
              following: true,
              posts: true,
              likes: true,
              message: true,
              photos: true,
            },
          },
          photos: {
            take: 3,
            orderBy: {
              createdAt: 'desc',
            },
            include: {
              likes: true,
              _count: {
                select: {
                  likes: true,
                  view: true,
                  comments: true,
                },
              },
            },
          },
        },
      });
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      if (user) {
        delete user.password;
      }
      const isFollowing = await prisma.follows.findFirst({
        where: {
          AND: [
            { followerId: userId },
            {
              followingId: user.id,
            },
          ],
        },
      });

      const userWithFollowingAndLikedByUser = {
        ...user,
        isFollowing: Boolean(isFollowing),
        photos: user.photos.map((photo) => ({
          ...photo,
          likedByUser: photo.likes.some((like) => like.userId === userId),
        })),
      };
      return res.status(200).json(userWithFollowingAndLikedByUser);
    } catch (error) {
      console.error(`User by ID error ${error} `);
      return res
        .status(500)
        .json({ error: `Internal database error ${error}` });
    }
  },
  getAllUsers: async (req, res) => {
    const userId = req.user.userId;
    let { searchValue } = req.params;
    if (searchValue === 'undefined' || searchValue === 'null') {
      searchValue = undefined;
    }

    try {
      const findFollowingUser = await prisma.follows.findMany({
        where: { followerId: userId },
        select: { followingId: true },
      });
      const followingId = findFollowingUser.map((item) => item.followingId);
      const users = await prisma.user.findMany({
        where: {
          id: { notIn: [...followingId, userId] },
          username: {
            startsWith: searchValue,
          },
        },

        orderBy: { createdAt: 'desc' },
        include: { followers: true, following: true },
      });
      if (!users) {
        return res.status(404).json({ message: 'Users not found' });
      }

      return res.status(200).json(
        users.map((user) => {
          const { password, ...userWithoutPassword } = user;
          return {
            ...userWithoutPassword,
            isFollowing: user.followers.some(
              (follower) => follower.followerId === userId
            ),
          };
        })
      );
    } catch (error) {
      console.error(`Get all users error ${error} `);
      return res
        .status(500)
        .json({ error: `Internal database error ${error}` });
    }
  },
  getAllFollowingUsers: async (req, res) => {
    const userId = req.user.userId;
    try {
      const users = await prisma.follows.findMany({
        where: { followerId: userId },
        include: { follower: true, following: true },
        orderBy: { follower: { username: 'asc' } },
      });
      if (!users) {
        return res.status(404).json({ message: 'Users not found' });
      }

      return res.status(200).json(
        users.map((user) => ({
          ...user.following,
          isFollowing: users.some((user) => user.followerId === userId),
        }))
      );
    } catch (error) {
      console.error(`Get all users error ${error} `);
      return res
        .status(500)
        .json({ error: `Internal database error ${error}` });
    }
  },
  updateUser: async (req, res) => {
    const { id } = req.params;
    const body = req.body;
    const profileData = JSON.parse(body.profileData);
    const file = req.file;
    if (!body) {
      return res.status(404).json({ message: 'body not found!' });
    }
    console.log('profileData', profileData);
    console.log('file', file);

    if (id !== req.user.userId) {
      return res.status(403).json({ message: 'no access' });
    }
    if (profileData.email) {
      const existingEmail = await prisma.user.findUnique({
        where: { email: profileData.email },
      });
      if (existingEmail) {
        return res
          .status(400)
          .json({ message: 'Such an email already exists, but another one' });
      }
    }
    if (profileData.username) {
      const existingUsername = await prisma.user.findUnique({
        where: { username: profileData.username },
      });
      if (existingUsername) {
        return res.status(400).json({
          message: 'Such an username already exists, but another one',
        });
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { ...profileData, avatarUrl: file?.location },
    });
    res.status(201).json(updatedUser);
    try {
    } catch (error) {
      console.error(`Update user error ${error} `);
      return res
        .status(500)
        .json({ error: `Internal database error ${error}` });
    }
  },
  current: async (req, res) => {
    const id = req.user.userId;
    try {
      const user = await prisma.user.findUnique({
        where: { id },
      });

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.status(200).json(user);
    } catch (error) {
      console.error(`Current user error ${error} `);
      return res
        .status(500)
        .json({ error: `Internal database error ${error}` });
    }
  },
  userOnline: async (req, res) => {
    const userId = req.user.userId;
    try {
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { isOnline: true },
      });
      res.status(200).json(updatedUser);
    } catch (error) {
      console.error(`userOnline  error ${error} `);
      return res
        .status(500)
        .json({ error: `Internal database error ${error}` });
    }
  },
  userOffline: async (req, res) => {
    const { userId } = req.params;
    try {
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { isOnline: false },
      });
      res.status(200).json(updatedUser);
    } catch (error) {
      console.error(`userOffline  error ${error} `);
      return res
        .status(500)
        .json({ error: `Internal database error ${error}` });
    }
  },
  resetPassword: async (req, res, next) => {
    const { email } = req.body;

    // Налаштування транспорту для SMTP
    // const transporter = nodemailer.createTransport({
    //   service: 'gmail', // або ваш SMTP сервер, наприклад, 'smtp.example.com'
    //   auth: {
    //     user: process.env.EMAIL_USER, // ваш email
    //     pass: process.env.EMAIL_PASS, // ваш пароль
    //   },
    // });

    // Налаштування інформації про лист

    const resend = new Resend(process.env.RESEND_KEY);
    if (!email) {
      return res.status(404).json({ error: 'email not found' });
    }

    try {
      const user = await prisma.user.findUnique({
        where: {
          email,
        },
      });
      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: 'Email not found ' });
      }
      const token = jwt.sign({ userId: user.id }, process.env.SECRET_KEY, {
        expiresIn: '1h',
      });
      const url = `${process.env.BASE_URL}/login/new-password?token=${token}`;

      // const mailOptions = {
      //   from: 'lolokos1986@gmail.com', // ваш email
      //   to: email, // email одержувача
      //   subject: 'Rest Password SOCIAL MEDIA', // тема листа
      //   text: 'This is a test email sent using Nodemailer!', // текстовий контент
      //   html: onHtml(url), // HTML контент
      // };

      // Відправка листа
      // transporter.sendMail(mailOptions, (error, info) => {
      //   if (error) {
      //     console.log('Error occurred:', error);
      //   } else {
      //     console.log('Email sent:', info.response);
      //     return res.status(200).json({ success: true, data: info.response });
      //   }
      // });

      const { data, error } = await resend.emails.send({
        from: 'Acme <onboarding@resend.dev>',
        to: [email],
        subject: 'Reset your password SOCIAL MEDIA',
        html: onHtml(url),
      });
      if (data && user) {
        return res.status(200).json({ success: true, data });
      } else {
        console.error(error);
      }
    } catch (error) {
      next(error);
    }
  },
  updatePassword: async (req, res, next) => {
    const { newPassword, token } = req.body;

    if (!newPassword) {
      return res.status(404).json({ error: 'new password not found' });
    }
    if (!token) {
      return res.status(404).json({ error: 'token not found' });
    }

    try {
      const valid = jwt.verify(token, process.env.SECRET_KEY);
      if (!valid) {
        return res
          .status(403)
          .json({ success: false, message: 'Invalid token' });
      }
      const userId = valid.userId;
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword },
      });
      res.status(200).json({ success: true });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = UserController;
