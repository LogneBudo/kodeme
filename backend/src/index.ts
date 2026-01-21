import dotenv from 'dotenv';
dotenv.config({ path: '../.env.local' });
import express from 'express';
import cors from './middleware/cors';
import routes from './routes';
import docsRoutes from './routes/docs';

const app = express();
const PORT = 4000;

app.use(cors);
app.use(express.json());
// serve API routes under /api
app.use('/api', routes);
// serve Swagger UI for OpenAPI at root /api-docs for convenience
app.use('/api-docs', docsRoutes);

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
