const express = require('express');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const stringSimilarity = require('string-similarity');
const cors = require('cors');
const User = require('./db/models/User');
const Post = require('./db/models/Post');
const createSafeUser = require('./helpers/createSafeUser');
const imageValidation = require('./middlewares/imageValidation');
const tokenValidation = require('./middlewares/tokenValidation');
require('./db/mongoose');
require('dotenv').config();

const app = express();
app.use(cors({ origin: [process.env.FRONTEND_URL], credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

const PORT = process.env.PORT || 5000;

app.post('/signup', async (req, res) => {
  const { username, email, password } = req.body;

  const regExp = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/;

  if (!regExp.test(password)) {
    return res.status(401).json({ message: 'Invalid password' });
  }

  if (await User.findOne({ email })) {
    return res
      .status(409)
      .json({ message: 'This email is already registered' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, email, password: hashedPassword });
    await user.save();
    res.json({ message: 'User registered' });
  } catch (err) {
    res.status(500).json({ message: err });
  }
});

app.post('/signin', async (req, res) => {
  const token = req.cookies.token;

  if (token) {
    try {
      const { userId } = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(userId);
      if (user) {
        const safeUser = createSafeUser(user);
        return res.json({ user: safeUser, message: 'Signed in' });
      } else {
        return res.status(401).json({ message: 'Token is invalid' });
      }
    } catch (err) {
      return res.status(401).json({ message: err });
    }
  }

  if (Object.keys(req.body).length) {
    const { username, password } = req.body;

    const user = await User.findOne({ username });
    if (!user) {
      return res
        .status(404)
        .json({ message: 'There is no user with the given username' });
    }

    if (await bcrypt.compare(password, user.password)) {
      const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
      res.cookie('token', token, {
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        sameSite: 'none',
        secure: true,
      });
      const safeUser = createSafeUser(user);
      res.json({ user: safeUser, message: 'Signed in' });
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } else {
    res.status(204).send();
  }
});

app.get('/signout', (_, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    sameSite: 'none',
    secure: true,
  });
  res.json({ message: 'Signed out' });
});

app.get('/user', async (req, res) => {
  const { userId } = req.query;

  try {
    const user = await User.findById(userId);
    const safeUser = createSafeUser(user);
    res.json({ user: safeUser });
  } catch (err) {
    res.status(404).json({ message: 'User not found' });
  }
});

app.patch(
  '/updateUser',
  (req, res, next) => tokenValidation(req, res, next, req.body.userId),
  (req, res, next) => {
    imageValidation(
      { body: { photo: req.body.updates.profilePicture } },
      res,
      next
    );
  },
  (req, res, next) => {
    imageValidation(
      { body: { photo: req.body.updates.backgroundImage } },
      res,
      next
    );
  },
  async (req, res) => {
    const { userId, updates } = req.body;

    Object.keys(updates).forEach((key) => {
      if (
        ![
          'username',
          'profilePicture',
          'backgroundImage',
          'bio',
          'info',
        ].includes(key)
      ) {
        return res.status(400).json({ message: 'Invalid fields for update' });
      }
    });

    try {
      const updatedUser = await User.findByIdAndUpdate(userId, updates, {
        new: true,
        runValidators: true,
      });
      const safeUser = createSafeUser(updatedUser);
      res.json({ user: safeUser, message: 'User has been updated' });
    } catch (err) {
      res.status(400).json({ message: 'Propably entered incorrect data' });
    }
  }
);

app.get('/image', async (req, res) => {
  const { userId, image } = req.query;

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    switch (image) {
      case 'BACKGROUND':
        return res.json({ image: user.backgroundImage });
      case 'PROFILE':
        return res.json({ image: user.profilePicture });
      default:
        return res
          .status(400)
          .json({ message: 'Specified invalid image type' });
    }
  } catch (err) {
    return res.status(500).json({ message: `Something is no yes: ${err}` });
  }
});

app.get('/posts', async (req, res) => {
  const { start, query } = req.query;

  try {
    if (query) {
      const allPosts = await Post.find().sort({ timestamp: -1 });
      const filteredPosts = allPosts.filter((post) => {
        const lowerQuery = query.toLowerCase();
        const lowerContent = post.content.toLowerCase();
        return (
          stringSimilarity.compareTwoStrings(lowerContent, lowerQuery) > 0.75 ||
          lowerContent.includes(lowerQuery)
        );
      });
      const posts = filteredPosts.slice(+start - 1, +start + 7);
      res.json({ posts });
    } else {
      const posts = await Post.find()
        .sort({ timestamp: -1 })
        .skip(+start - 1)
        .limit(8);
      res.json({ posts });
    }
  } catch (err) {
    res.status(500).json({ message: `Something is no yes: ${err}` });
  }
});

app.post(
  '/post',
  (req, res, next) => tokenValidation(req, res, next, req.body.authorId),
  imageValidation,
  async (req, res) => {
    const { content, photo, authorId } = req.body;

    try {
      const post = new Post({ content, photo, author_id: authorId });
      await post.save();
      res.json({ post, message: 'Post added successfully' });
    } catch (err) {
      res.status(500).json({ message: `Something is no yes: ${err}` });
    }
  }
);

app.delete(
  '/post',
  async (req, res, next) => {
    const postToDelete = await Post.findById(req.query.postId);
    tokenValidation(req, res, next, postToDelete.author_id);
  },
  async (req, res) => {
    const { postId } = req.query;

    try {
      const deletedPost = await Post.findByIdAndDelete(postId);
      if (deletedPost) {
        res.json({ message: 'Post deleted successfully' });
      } else {
        res.status(404).json({ message: 'Post with given id not found' });
      }
    } catch (err) {
      res.status(500).json({ message: `Something is no yes: ${err}` });
    }
  }
);

app.patch(
  '/updatePost',
  async (req, res, next) => {
    const postToUpdate = await Post.findById(req.body.postId);
    tokenValidation(req, res, next, postToUpdate.author_id);
  },
  imageValidation,
  async (req, res) => {
    const { postId, content, photo } = req.body;

    try {
      const updatedPost = await Post.findByIdAndUpdate(
        postId,
        { content, photo },
        {
          new: true,
          runValidators: true,
        }
      );
      res.json({ post: updatedPost, message: 'Post has been updated' });
    } catch (err) {
      res.status(500).json({ message: `Something is no yes: ${err}` });
    }
  }
);

app.post(
  '/comment',
  (req, res, next) =>
    tokenValidation(req, res, next, req.body.comment.author_id),
  async (req, res) => {
    const { comment, postId } = req.body;

    try {
      const updatedPost = await Post.findByIdAndUpdate(
        postId,
        { $push: { comments: comment } },
        { new: true, runValidators: true }
      );
      const addedComment =
        updatedPost.comments[updatedPost.comments.length - 1];
      res.json({ addedComment, message: 'Comment added successfully' });
    } catch (err) {
      res.status(500).json({ message: `Something is no yes: ${err}` });
    }
  }
);

app.post(
  '/like',
  (req, res, next) => tokenValidation(req, res, next, req.body.userId),
  async (req, res) => {
    const { userId, postId } = req.body;

    try {
      const post = await Post.findById(postId);
      if (post.likes.includes(userId)) {
        return res
          .status(409)
          .json({ message: 'You have already liked this post' });
      }
      await Post.findByIdAndUpdate(postId, { $push: { likes: userId } });
      res.json({ message: 'Like added successfully' });
    } catch (err) {
      res.status(500).json({ message: `Something is no yes: ${err}` });
    }
  }
);

app.delete(
  '/unlike',
  (req, res, next) => tokenValidation(req, res, next, req.query.userId),
  async (req, res) => {
    const { userId, postId } = req.query;

    try {
      await Post.findByIdAndUpdate(postId, { $pull: { likes: userId } });
      res.json({ message: 'Like has been removed' });
    } catch (err) {
      res.status(500).json({ message: `Something is no yes: ${err}` });
    }
  }
);

app.listen(PORT, () => {
  console.log(`http://localhost:${PORT}`);
});
