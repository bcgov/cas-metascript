const util = require('util');
const callAPI = require('../api_calls/call_api');
const mkdirp = require('mkdirp');
require('dotenv').config();

/**
 * CreateFileStructure reads all the collections in metabase and recreates that hierarchy structure on disk. It saves each collection id, 
 * name, location, and an array of the id's of the questions the collection contains to the collections object.
 * @param {object} session - The session for the logged in user, contains a session id to be passed in when calling the api 
 * @returns {object} collections - the collections object is returned to be used when writing the questions to disk
 */
async function createFileStructure(session) {
  const database_id = process.env.DATABASE_ID;
  const unixTimestamp = Date.now();
  // information about the collection is stored in this object to be returned and used later when writing to disk
  const collections = {};
  // Get all the collections
  const collectionData = await callAPI(session, '/collection', 'GET', null, {database: database_id});
  for (let i = 0; i < collectionData.length; i++){
    // For each collection, get all the items inside
    collectionItems = await callAPI(session, `/collection/${collectionData[i].id}/items`, 'GET', null, {database: database_id});
    // This is the 'Our Analytics collection
    if (collectionData[i].id === 'root') {
      collections[collectionData[i].id] = {
        id: collectionData[i].id,
        name: collectionData[i].name,
        location: 'root',
        cards: []
      };
    }
    else {
      collections[collectionData[i].id] = {
        id: collectionData[i].id,
        name: collectionData[i].name,
        location: `root${collectionData[i].location}${collectionData[i].id}`,
        cards: []
      }
    }
    // Push the id of each card in the collection to the cards array inside the collections object
    collectionItems.forEach(item => {
      if (item.model === 'card') {
        collections[collectionData[i].id].cards.push(item.id);
      }
    });
  };
  // Create the file structure (based on the collection hierarchy in metabase) that will house all the questions locally
  await Promise.all(Object.keys(collections).map(key => new Promise((resolve, reject) => {
    mkdirp(`${process.env.QUESTION_PATH}/${collections[key].location}`, function (err) {
      if (err) {
        console.error(err);
        return reject();
      }
      resolve();
    })
  })));
  // Add the timestamp (for debugging, to be removed)
  collections.unixTimestamp = unixTimestamp;
  return collections;
}

module.exports = createFileStructure