// Config file. In addition to this, index.html uses process.env.SERVER_URL (dev vs. prod server)
import 'dotenv/config';

if (!process.env.PINECONE_API_KEY) {
  console.error('Please set PINECONE_API_KEY in .env');
  process.exit(1);
}

export const config = {
  serverPort: 4000,
  showerThoughtsCount: 1000,  // fetch no more than this many shower thoughts; reddit appears to stop at 1000 anyway
  insertBatchSize: 50,
  apiKey: process.env.PINECONE_API_KEY,
  indexName: 'shower-thoughts',
  filename: 'shower-thoughts.json',
  filenameWithEmbeddings: 'shower-thoughts+embeddings.json',
  // https://www.pinecone.io/docs/manage-data/#specify-an-index-endpoint
  endpoint: 'https://controller.us-west1-gcp.pinecone.io/',
  openAiApiKey: process.env.OPENAI_API_KEY,
};
