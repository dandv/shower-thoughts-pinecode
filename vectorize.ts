/**
 * @file Create embeddings via OpenAI (babbage-doc)
 */
import { config } from './config';
import { Configuration, OpenAIApi } from 'openai';
import showerThoughts from './shower-thoughts.json' assert { type: 'json' };
import { writeFileSync } from 'fs';

const openai = new OpenAIApi(new Configuration({
  apiKey: config.openAiApiKey,
}));

try {
  // https://beta.openai.com/docs/api-reference/embeddings
  const embedding = await openai.createEmbedding({
    model: 'text-search-babbage-doc-001', // https://beta.openai.com/docs/guides/embeddings/what-are-embeddings
    input: showerThoughts.map(st => st.text),  // all embeddings can be created in one shot (< 1000 shower thoughts)
  });

  // Assign the embeddings back to each shower thought
  let i = 0;
  for (const st of showerThoughts)
    st['values'] = embedding.data.data[i++].embedding;

  // Dump the shower thoughts with embeddings to a new JSON file
  writeFileSync(config.filenameWithEmbeddings, JSON.stringify(showerThoughts, null, 4));
  console.log(`Dumped ${showerThoughts.length} shower thoughts with embeddings to ${config.filenameWithEmbeddings}`);
} catch (error) {
  if (error.response) {
    console.log(error.response.status);
    console.log(error.response.data);
  } else {
    console.log(error.message);
  }
}
