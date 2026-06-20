import app from './app';
import { startSerendipityCron } from './modules/serendipity/serendipity.worker';
import { aiWorker } from './modules/ai/ai.worker';

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);

  startSerendipityCron().catch(console.error);

  console.log(`AI Worker initialized and listening for jobs...`);
});