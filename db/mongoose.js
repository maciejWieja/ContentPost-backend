require('dotenv').config();

const mongoose = require('mongoose');
const URL = process.env.MONGOD_CONNECT_URI;

mongoose.connect(URL);
