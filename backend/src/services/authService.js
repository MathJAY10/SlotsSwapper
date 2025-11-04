import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const signup = async (name, email, password) => {
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { name, email, password: hashedPassword }
  });
  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
  return { user: { id: user.id, name: user.name, email: user.email }, token };
};

export const login = async (email, password) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error('User not found');
  
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) throw new Error('Invalid password');
  
  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
  return { user: { id: user.id, name: user.name, email: user.email }, token };
};
