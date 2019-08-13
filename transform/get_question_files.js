const fs = require('fs');
const path = require('path');
const util = require('util');
/**
 * Function getQuestionFiles retrieves the questions from the local file directory to which they were saved
 * @param {Array} questionSet - a list of questions to get
 * @param {Array} flags - The cmd line flags (if --all is set get all questions from the root directory down)
 */
const getQuestionFiles = (args) => {

  const regex = /^\d+/;
  let data = {questions: []};
  const questionSet = args.entityList;
  const allFlag = args.entityList.length === 0 ? true : false;
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
          if (allFlag && file.match(regex))
            data.questions.push(JSON.parse(fs.readFileSync(fPath)))
          else if (file.match(regex) && questionSet.includes(match[0]))
            data.questions.push(JSON.parse(fs.readFileSync(fPath)))
      });
  };

  traverseFiles(questionSet,`${args.questionDirectory}`, allFlag);
  return data;
}

module.exports = getQuestionFiles;
