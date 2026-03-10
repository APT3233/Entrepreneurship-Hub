import bcrypt from "bcryptjs";

/**
 * Hash a plain text password using bcrypt
 * @param {string} password - The password to hash
 * @returns {Promise<string>} The hashed password
 */
export const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

/**
 * Compare a plain text password with a hashed password
 * @param {string} password - The plain text password
 * @param {string} hashed - The hashed password to compare against
 * @returns {Promise<boolean>} True if match, false otherwise
 */
export const comparePassword = async (password, hashed) => {
  return bcrypt.compare(password, hashed);
};
