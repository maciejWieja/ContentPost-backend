const imageSize = require('image-size');

const isFileImage = (bufferFile) => {
  try {
    const info = imageSize(bufferFile);
    return info;
  } catch (err) {
    return false;
  }
};

module.exports = isFileImage;
