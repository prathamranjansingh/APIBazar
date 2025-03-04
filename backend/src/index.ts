import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import authRoutes from './routes/authRoutes';
import errorHandler from './utils/errorHandler';
import  apiRoutes  from './routes/apiRoutes';
import  endpointRoutes  from "./routes/endpointRoutes";
dotenv.config();
const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

app.use('/auth', authRoutes);

//TESTING 
app.use("/api/apis", apiRoutes);
app.use("/api/endpoints", endpointRoutes);



app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});