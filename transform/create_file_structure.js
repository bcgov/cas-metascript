const util = require('util');
const callAPI = require('../api_calls/call_api');
const mkdirp = require('mkdirp');
require('dotenv').config();

async function createFileStructure(session) {
  const database_id = process.env.DATABASE_ID;
  const unixTimestamp = Date.now();
  const collections = {};
  const collectionData = await callAPI(session, '/collection', 'GET', null, {database: database_id});
  for (let i = 0; i < collectionData.length; i++){
    collectionItems = await callAPI(session, `/collection/${collectionData[i].id}/items`, 'GET', null, {database: database_id});
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
    collectionItems.forEach(item => {
      if (item.model === 'card') {
        collections[collectionData[i].id].cards.push(item.id);
      }
    });
  };
  await Promise.all(Object.keys(collections).map(key => new Promise((resolve, reject) => {
    mkdirp(`./metabase_questions/${unixTimestamp}/${collections[key].location}`, function (err) {
      if (err) {
        console.error(err);
        return reject();
      }
      resolve();
    })
  })));
  
  collections.unixTimestamp = unixTimestamp;
  return collections;
}

module.exports = createFileStructure