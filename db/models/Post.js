const mongoose = require('mongoose');

const Post = mongoose.model('Post', {
  author_id: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Number,
    default: Date.now,
  },
  content: {
    type: String,
    minLength: 2,
    maxLength: 280,
    required: true,
  },
  photo: {
    type: String,
    default: null,
  },
  likes: [String],
  comments: [
    {
      author_id: String,
      timestamp: Number,
      content: {
        type: String,
        minLength: 2,
        maxLength: 140,
      },
    },
  ],
});

module.exports = Post;
