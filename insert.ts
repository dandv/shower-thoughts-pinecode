/**
 * @file Data ingestion for the Shower Thoughts Pinecone demo app:
 * - create collection and wait until it's ready
 * - parse the JSON exported by the vectorize script (shower-thoughts+embeddings.json)
 * - upsert the data into the index, with batching
 */
import { config } from './config';
import { Pinecone } from 'pinecone-io';
import { readFileSync } from 'fs';

const BATCH_SIZE = 50;

const pinecone = new Pinecone(config.apiKey, config.endpoint);

const name = config.indexName;
type Point = {
  id: string;
  metadata: {
    text: string;
    url: string;
    upvotes: number;
  };
  values: number[];
}
let points: Point[] = [];

let uploadedCount = 0;
/** Upsert a batch of points and clear {@link points} */
async function upsert_batch() {
  // upsert
  const upload_result = await pinecone.upload_points(name, points);
  if (upload_result.err) {
    console.error(`ERROR: Couldn't upload to "${name}":\n`, upload_result.err);
  } else {
    uploadedCount += upload_result.response['upsertedCount'];
    console.log(`Uploaded ${uploadedCount} vectors to "${name}"`);
    points = [];
  }
}

let collection_result = await pinecone.get_collection(name);
if (collection_result.err) {
  // If the index doesn't exist, create it. TODO: check for other error conditions
  // create_collection (https://github.com/maxdotio/node-pinecone/blob/main/index.js#L102) does
  // a POST to /databases, which creates an index - https://www.pinecone.io/docs/api/operation/create_index/
  const create_result = await pinecone.create_collection(name, { name, dimension: 2048 });
  if (create_result.err) {
    console.error(`ERROR: Couldn't create index "${name}":\n`, create_result.err);
    process.exit(1);
  }

  // For a new index, we must wait until it's ready
  console.log(`Created index "${name}". Waiting for it to be ready...`);
  await pinecone.wait_until_ready(name);
  console.log(`Index "${name}" is ready!`);
  collection_result = await pinecone.get_collection(name);
}
console.log(`Index "${name}":\n`, collection_result.response);

// Have the library set the hoste, then patch it by removing port :433 (requests there time out)
await pinecone.set_host(name);
pinecone.host = pinecone.host.replace(':433', '');

// The JSON should be streamed for large data sets, but we have <1000 points.
const vectors = JSON.parse(readFileSync(config.filenameWithEmbeddings, { encoding: 'utf8' }));
for (const showerThought of vectors) {
  const { values, ...metadata } = showerThought;
  points.push({
    id: metadata.url.match(/comments\/(\w+)\//)[1],
    metadata,
    values,
  });
  if (points.length === BATCH_SIZE)
    await upsert_batch();
}

if (points.length) await upsert_batch();
console.log('Inserting finished.');
