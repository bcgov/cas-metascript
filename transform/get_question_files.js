const fs = require('fs');
const path = require('path');
const util = require('util');
/**
 * Function getQuestionFiles retrieves the questions from the local file directory to which they were saved
 * @param {Array} questionSet - a list of questions to get
 * @param {Array} flags - The cmd line flags (if --all is set get all questions from the root directory down)
 */
const getQuestionFiles = (questionSet, flags) => {

  const regex = /\d+/
  // const questionFolders = fs.readdirSync(process.env.QUESTION_PATH);
    // const latestFolder = {
    //   name: '',
    //   timestamp: '0'
    // }
    // questionFolders.forEach(folder => {
    //   const timestamp = folder.match(regex);
    //   if (timestamp[0] > latestFolder.timestamp) {
    //     latestFolder.name = folder;
    //     latestFolder.timestamp = timestamp[0];
    //   }
    // });

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
    traverseFiles(questionSet,`${process.env.QUESTION_PATH}`, true);
  else
    traverseFiles(questionSet,`${process.env.QUESTION_PATH}`, false);

return data;
}

module.exports = getQuestionFiles;
