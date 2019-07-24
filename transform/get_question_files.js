const fs = require('fs');
const path = require('path');
const util = require('util');

const getQuestionFiles = (questionSet) => {

  const regex = /\d+/
  const questionFolders = fs.readdirSync('./metabase_questions');
    const latestFolder = {
      name: '',
      timestamp: '0'
    }
    questionFolders.forEach(folder => {
      const timestamp = folder.match(regex);
      if (timestamp[0] > latestFolder.timestamp) {
        latestFolder.name = folder;
        latestFolder.timestamp = timestamp[0];
      }
    });

  let data = {questions: []};

  const traverse = function(questionSet, dir, result = []) {

      // list files in directory and loop through
      fs.readdirSync(dir).forEach((file) => {

          // builds full path of file
          const fPath = path.resolve(dir, file);

          // prepare stats obj
          const fileStats = { file, path: fPath };

          // is the file a directory ? 
          // if yes, traverse it also, if no just add it to the result
          if (fs.statSync(fPath).isDirectory()) {
              fileStats.type = 'dir';
              fileStats.files = [];
              result.push(fileStats);
              return traverse(questionSet, fPath, fileStats.files)
          }
          if (questionSet.length > 0) {
            const match = file.match(regex);
            if (questionSet.includes(match[0])) {
              data.questions.push(JSON.parse(fs.readFileSync(fPath)))
            }
            else if (questionSet[0] === 'all') {
              data.questions.push(JSON.parse(fs.readFileSync(fPath)))
            }
            fileStats.type = 'file';
            result.push(fileStats);
          }
          else {
            throw `Missing Argument:   A space separated list of question ids to be posted to metabase or 'all' to post all questions in directory`
          }
      });
      return result;
  };
  traverse(questionSet,`./metabase_questions/${latestFolder.name}`)

return data;
}

module.exports = getQuestionFiles;
