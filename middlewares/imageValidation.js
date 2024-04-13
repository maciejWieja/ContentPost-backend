const isFileImage = require('../helpers/isFileImage');

const imageValidation = (req, res, next) => {
  const { photo } = req.body;

  if (photo && photo !== 'default') {
    const bufferPhoto = Buffer.from(photo, 'base64');
    const result = isFileImage(bufferPhoto);
    if (!result) {
      return res.status(400).json({ message: 'File is not an image' });
    }
    if (!['jpg', 'bmp', 'png', 'tiff', 'raw'].includes(result?.type)) {
      return res.status(400).json({ message: 'Invalid image type' });
    }
    if (bufferPhoto.byteLength / 1024 / 1024 > 4) {
      return res.status(400).json({ message: 'Image is too large' });
    }
  }

  next();
};

module.exports = imageValidation;
