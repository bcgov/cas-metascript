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

  const traverse = function(questionSet, dir) {

      // list files in directory and loop through
      fs.readdirSync(dir).forEach((file) => {

          // builds full path of file
          const fPath = path.resolve(dir, file);

          // file is a directory
          if (fs.statSync(fPath).isDirectory()) {
              return traverse(questionSet, fPath)
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
            throw `Missing Argument:   A space separated list of question ids to be posted to metabase or 'all' to post all questions in directory`
          }
      });
  };
  traverse(questionSet,`./metabase_questions/${latestFolder.name}`)

return data;
}

module.exports = getQuestionFiles;
