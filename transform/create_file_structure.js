const util = require('util');
const callAPI = require('../api_calls/call_api');
const mkdirp = require('mkdirp');

async function createFileStructure() {
  const session = {"id":"effebced-7d21-4a3f-a208-907af28a9240"};
  const unixTimestamp = Date.now();
  const collections = {};
  const collectionData = await callAPI(session, '/collection', 'GET', null, {database: 5});
  for (let i = 0; i < collectionData.length; i++){
    collectionItems = await callAPI(session, `/collection/${collectionData[i].id}/items`, 'GET', null, {database: 5});
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