import app from './app';
import { startSerendipityCron, serendipityWorker } from './modules/serendipity/serendipity.worker';
import { aiWorker } from './modules/ai/ai.worker'; // by simply importing aiWorker Node.js executes the code inside

const PORT = process.env.PORT || 3000;

void aiWorker;
void serendipityWorker;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);

  startSerendipityCron().catch(console.error);

  console.log(`AI Worker initialized and listening for jobs...`);
  console.log(`Serendipity Worker initialized and listening for jobs...`);
});