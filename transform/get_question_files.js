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

  const traverseFiles = function(questionSet, dir) {

      // list files in directory and loop through
      fs.readdirSync(dir).forEach((file) => {

          // builds full path of file
          const fPath = path.resolve(dir, file);

          // file is a directory
          if (fs.statSync(fPath).isDirectory()) {
              return traverseFiles(questionSet, fPath)
          }
          // file is not a directory
          if (questionSet.length > 0) {
            const match = file.match(regex);
            if (questionSet.includes(match[0]))
              data.questions.push(JSON.parse(fs.readFileSync(fPath)))
            else if (questionSet[0] === 'all')
              data.questions.push(JSON.parse(fs.readFileSync(fPath)))
          }
          else {
            throw `Missing Argument: Valid Arguments: 1) A list of space separated IDs (post questions with those IDs to metabase) 2) all (posts all questions in directory to metabase)`
          }
      });
  };
  traverseFiles(questionSet,`./metabase_questions/${latestFolder.name}`)

return data;
}

module.exports = getQuestionFiles;
