import bcrypt from "bcryptjs";

export const isValidPassword = async (
  password: string,
  hashedPassword: string,
) => {
  return bcrypt.compare(password, hashedPassword);
};
