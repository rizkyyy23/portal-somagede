// Dummy protect middleware tanpa verifikasi JWT/token
export const protect = (req, res, next) => {
  next();
};

// Dummy admin middleware (semua request lolos)
export const admin = (req, res, next) => {
  next();
};
