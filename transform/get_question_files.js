const fs = require('fs');
const path = require('path');
const util = require('util');

const getQuestionFiles = (questionSet, flags) => {

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

  const traverseFiles = function(questionSet, dir, allFlag) {

      // list files in directory and loop through
      fs.readdirSync(dir).forEach((file) => {

          // builds full path of file
          const fPath = path.resolve(dir, file);

          // file is a directory
          if (fs.statSync(fPath).isDirectory()) {
              return traverseFiles(questionSet, fPath, allFlag)
          }
          // file is not a directory
          const match = file.match(regex);
          if (allFlag)
            data.questions.push(JSON.parse(fs.readFileSync(fPath)))
          else if (questionSet.includes(match[0]))
            data.questions.push(JSON.parse(fs.readFileSync(fPath)))
      });
  };

  if (flags.includes('--all'))
    traverseFiles(questionSet,`./metabase_questions/${latestFolder.name}`, true);
  else
    traverseFiles(questionSet,`./metabase_questions/${latestFolder.name}`, false);

return data;
}

module.exports = getQuestionFiles;
