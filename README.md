# Pinecone Demo App - Shower thoughts

Node.js app that imports the top ~1000 [shower thoughts](https://reddit.com/r/showerthoughts) from reddit, and displays the most amusing ones (per redditors' opinions) that match a given topic.

## Live demo

https://shower-thoughts-pinecone.dandv.me/

## Usage

1. Check out the repo and install the dependencies:
   ```bash
   git clone https://github.com/dandv/shower-thoughts-pinecone
   cd shower-thoughts-pinecone
   npm install
   nano .env
   ```
2. Obtain [Pinecone](https://www.pinecone.io/docs/quickstart/#2-get-and-verify-your-pinecone-api-key) and [OpenAI](https://beta.openai.com/account/api-keys) keys and store them in the `.env` file:

       PINECONE_API_KEY=...
       OPENAI_API_KEY=...

3. Optionally fetch the shower thoughts into a JSON file (`shower-thoughts.json` is included for convenience in the repo):

       npm run reddit

4. Create the embeddings (this results in a ~50MB JSON file):

       npm run vectorize

5. Insert the vectors:

       npm run insert

6. Launch the app server:

       npm run server

7. In a different terminal, launch the web app:

       npm start


## Pinecone feedback

There is no official JavaScript client. This code uses the [node-pinecone](https://github.com/maxdotio/node-pinecone) community-contributed library. When calculating the endpoint of an index, the library [sets the port](https://github.com/maxdotio/node-pinecone/blob/main/index.js#L35) to the port returned by Pinecode via [describe_index](https://www.pinecone.io/docs/api/operation/describe_index/). So far, this has been `433`, but there appears to be no server listening at that point, and all requests time out. As a workaround, the code patches the host string by removing the port.