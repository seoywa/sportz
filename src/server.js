import express from 'express';

const app = express();

app.use(express.json());

app.get('/', (req, res) => {
  res.send('Hello from Express Server!');
});

const PORT = 8000;

app.listen(PORT, () => {
  console.log(`Server live running at http://localhost:${PORT}`);
});