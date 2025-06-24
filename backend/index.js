import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.get('/users', async (req, res) => {
  const users = await prisma.user.findMany();
  res.json(users);
});

app.get('/posts', async (req, res) => {
  const posts = await prisma.post.findMany({
    include: { user: true },
    orderBy: { createdAt: 'desc' },
  });
  res.json(posts);
});

app.post('/posts', async (req, res) => {
  const post = await prisma.post.create({
    data: req.body,
    include: { user: true },
  });
  res.status(201).json(post);
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
