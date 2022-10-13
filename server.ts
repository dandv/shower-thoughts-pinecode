/**
 * @file Express server that creates the OpenAI embedding for the query
 * and calls the Pinecone query endpoint. It also protects the OpenAI API key
 * from exposure on the client (see https://beta.openai.com/docs/api-reference/authentication).
 */
import { config } from './config';
import express from 'express';
import { Configuration, OpenAIApi } from 'openai';
import { Pinecone } from 'pinecone-io';

const openai = new OpenAIApi(new Configuration({
  apiKey: config.openAiApiKey,
}));

const pinecone = new Pinecone(config.apiKey, config.endpoint);

// Create Express server
const app = express();

app.get('/search', async (req, res, next) => {
  const query = req.query.q || 'cats';
  try {
    // https://beta.openai.com/docs/api-reference/embeddings
    const embedding = await openai.createEmbedding({
      model: 'text-search-babbage-query-001', // https://beta.openai.com/docs/guides/embeddings/what-are-embeddings
      input: req.query.q,
    });
    // TODO: persist cached embeddings in a key-value store to save OpenAI calls

    const queryEmbedding = embedding.data.data[0].embedding;
    console.log(`\nPinecone searching for <${query}>...`);
    const search_result = await pinecone.search_collection(config.indexName, queryEmbedding, req.query.limit || 10);

    if (search_result.err) {
      console.error(`ERROR: Couldn't search for <${query}>:\n`, search_result.err);
      next(search_result.err);
    } else {
      const matches = search_result.response.results[0].matches.map(m => ({
        score: m.score,
        text: m.metadata.text,
        upvotes: m.metadata.upvotes,
        url: m.metadata.url,
      }));
      res.json(matches);
      console.log(`Response sent for <${query}> starts with:\n${matches[0].text}`);
    }
  } catch (error) {
    if (error.response) {
      console.log(error.response.status);
      console.log(error.response.data);
      next(error.response);
    } else {
      console.log(error.message);
      next(error.message);
    }
  }
});

// Have the library set the host, then patch it by removing port :433 (requests there time out)
await pinecone.set_host(config.indexName);
if (!pinecone.host) {
  console.error(`Index "${config.indexName}" does not exist!`);
  process.exit(1);
}
pinecone.host = pinecone.host.replace(':433', '');

// Start the server
app.listen(config.serverPort, 'localhost', () => {
  console.log(`Express server listening on port ${config.serverPort}`);
});
