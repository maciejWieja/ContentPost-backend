const createSafeUser = (user) => {
  const {
    _id,
    username,
    bio,
    info: { phoneNumber, country, city, workplace, school },
  } = user.toObject();

  const safeUser = {
    _id,
    username,
    bio,
    info: {
      phoneNumber,
      country,
      city,
      workplace,
      school,
    },
  };

  return safeUser;
};

module.exports = createSafeUser;
