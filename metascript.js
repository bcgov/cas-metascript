#!/usr/bin/env node

const getBrokenQuestions = require('./test/get_broken_questions');
const getQuestionsFromMetabase = require('./get_questions_from_metabase');
const getDashboardsFromMetabase = require('./get_dashboards_from_metabase');
const saveQuestionsToMetabase = require('./save_questions_to_metabase');
const saveDashboardsToMetabase = require('./save_dashboards_to_metabase');

const commander = require('commander');
const program = new commander.Command();
program.version('0.0.1');

// Add errors for conflicting options here

program
.command('pull')
.description('get entities from Metabase')
.option('-D, --debug', 'show options')
.option('-i, --database-id <id>', 'Metabase database id')
.option('-q, --question-destination <destination>', 'pull questions to a destination folder')
.option('-d, --dashboard-destination <destination>', 'pull dashboards to a destination folder')
.option('-l, --entity-list <list>', 'pull / push a set of questions / dashboards (default: [] pulls/pushes all)', [])
.option('-B, --ignore-broken-question-check', 'ignores the broken question check and proceeds anyway')
.action((pull) => {
  if (pull.debug) { console.log(pull.opts()); }

  if (pull.questionDestination) {
    (async () => { 
      try {
        const brokenQuestions = await getBrokenQuestions();
        if (brokenQuestions.length === 0 || pull.ignoreBrokenQuestionCheck) {
          const brokenIDs = [];
          brokenQuestions.forEach(question => {
            const id = Number(question.split('').shift());
            brokenIDs.push(id);
          });
          await getQuestionsFromMetabase(pull.opts(), brokenIDs);
        }
        else {
          console.log('Metabase contains broken questions:')
          console.log(brokenQuestions)
          console.log('exiting..');
          console.log(pull.help());
          process.exit(1);
        }
      } catch(e) { console.log(e); } 
    })();
  }
  else if (pull.dashboardDestination) {
    (async () => { await getDashboardsFromMetabase(pull.opts()) })();
  }
});

program
.command('push')
.description('push entities to Metabase')
.option('-D, --debug', 'show options')
.option('-i, --database-id <id>', 'Metabase database id')
.option('-q, --questionDirectory <dir>', 'push questions to metabase from directory')
.option('-d, --dashboardDirectory <dir>', 'push dashboards to metabase from directory')
.option('-l, --entity-list <list>', 'push a set of questions / dashboards (default: [] pushes all)', [])
.option('-s, --save', 'save new instances of the entities to metabase (new metabase IDs)')
.option('-e, --edit', 'save edited instances of the entities in place (keep current metabase IDs)')
.option('-B, --ignore-broken-question-check', 'ignores the broken question check and proceeds anyway')
.action((push) => {
  if (push.debug) { console.log(push.opts()); }

  if (push.questionDirectory) {
    (async () => {
      await saveQuestionsToMetabase(push.opts())
      const brokenQuestions = await getBrokenQuestions();
      if (brokenQuestions.length > 0) {
        console.log('Metabase contains broken questions:')
        console.log(brokenQuestions)
        console.log('exiting..');
        console.log(pull.help());
        process.exit(1);
      }
    })();
  }
  else if (push.dashboardDirectory) {
    (async () => { await saveDashboardsToMetabase(push.opts()) })();
  }
})

program.parse(process.argv);
