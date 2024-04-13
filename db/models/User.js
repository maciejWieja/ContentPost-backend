const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// const defaultBackgroundImagePath = path.join(
//   __dirname,
//   '../../media/defaultBackgroundImage.png'
// );
// const defaultBackgroundImageData = fs.readFileSync(
//   defaultBackgroundImagePath,
//   'base64'
// );

// const defaultProfilePicturePath = path.join(
//   __dirname,
//   '../../media/defaultProfilePicture.png'
// );
// const defaultProfilePictureData = fs.readFileSync(
//   defaultProfilePicturePath,
//   'base64'
// );

const User = mongoose.model('User', {
  username: {
    type: String,
    required: true,
    validate: /^[a-zA-Z0-9_ -]{3,16}$/,
  },
  email: {
    type: String,
    required: true,
    validate: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  },
  password: {
    type: String,
    required: true,
  },
  profilePicture: {
    type: String,
    default: 'default',
  },
  backgroundImage: {
    type: String,
    default: 'default',
  },
  bio: {
    type: String,
    maxLength: 60,
    default: '',
  },
  info: {
    phoneNumber: {
      type: String,
      validate: {
        validator: (tel) => {
          return /^\d{9}$/.test(tel) || tel === '';
        },
      },
      default: '',
    },
    country: {
      type: String,
      maxLength: 30,
      default: '',
    },
    city: {
      type: String,
      maxLength: 30,
      default: '',
    },
    workplace: {
      type: String,
      maxLength: 30,
      default: '',
    },
    school: {
      type: String,
      maxLength: 30,
      default: '',
    },
  },
});

module.exports = User;
