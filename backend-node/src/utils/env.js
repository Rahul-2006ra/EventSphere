const normalizeEnvironment = () => {
  if (process.env.DATABASE_URL) {
    process.env.DATABASE_URL = process.env.DATABASE_URL.trim();
  }
};

module.exports = {
  normalizeEnvironment,
};
