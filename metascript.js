#!/usr/bin/env node

const getBrokenQuestions = require('./test/get_broken_questions');
const getQuestionsFromMetabase = require('./get_questions_from_metabase');
const getDashboardsFromMetabase = require('./get_dashboards_from_metabase');
const saveQuestionsToMetabase = require('./save_questions_to_metabase');
const saveDashboardsToMetabase = require('./save_dashboards_to_metabase');

const commander = require('commander');
const program = new commander.Command();
program
.version('0.0.1')
.option('-D, --debug', 'show options');

program
.command('pull')
.description('get entities from Metabase')
.option('-D, --debug', 'show options')
.option('-i, --database-id <id>', 'Metabase database id')
.option('-q, --question-destination <destination>', 'pull questions to a destination folder')
.option('-d, --dashboard-destination <destination>', 'pull dashboards to a destination folder')
.option('-l, --entity-list <list>', 'pull a set of questions / dashboards (default: [] pulls/pushes all)', [])
.option('-B, --ignore-broken-question-check', 'ignores the broken question check and proceeds anyway')
.action((pull) => {
  if (pull.debug) { console.log(pull.opts()); }

  // Option Errors
  // *********************
  if (!pull.databaseId || (!pull.questionDestination && !pull.dashboardDestination)) {
    console.error('Required: databaseId (-i <id>) and one of questionDestination (-q <destination) or dashboardDestination (-d <destination>)')
    console.log(pull.opts());
    console.log(pull.help());
    process.exit(1);
  }

  if (pull.questionDestination && pull.dashboardDestination) {
    console.error('Option conflict: questionDestination (-q <destination>) and dashboardDestination (-d <destination>) are mutually exclusive')
    console.log(pull.opts());
    console.log(pull.help());
    process.exit(1);
  }
  // **********************

  if (pull.questionDestination) {
    (async () => { 
      try {
        const brokenQuestions = await getBrokenQuestions(pull.databaseId);
        if (brokenQuestions.length === 0 || pull.ignoreBrokenQuestionCheck) {
          const brokenIDs = [];
          brokenQuestions.forEach(question => {
            const id = Number(question.split('').shift());
            brokenIDs.push(id);
          });
          await getQuestionsFromMetabase(pull.opts(), brokenIDs);
        }
        else {
          console.error('Metabase contains broken questions:')
          console.error(brokenQuestions)
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
.option('-q, --question-directory <dir>', 'push questions to metabase from directory')
.option('-d, --dashboard-directory <dir>', 'push dashboards to metabase from directory')
.option('-l, --entity-list <list>', 'push a set of questions / dashboards (default: [] pushes all)', [])
.option('-s, --save', 'save new instances of the entities to metabase (new metabase IDs)')
.option('-e, --edit', 'save edited instances of the entities in place (keep current metabase IDs)')
.option('-B, --ignore-broken-question-check', 'ignores the broken question check and proceeds anyway')
.action((push) => {
  if (push.debug) { console.log(push.opts()); }

  // Option Errors
  // *********************
  if (!push.databaseId || (!push.questionDirectory && !push.dashboardDirectory) || (!push.save && !push.edit)) {
    console.error('Required: databaseId (-i <id>), one of questionDestination (-q <destination) or dashboardDestination (-d <destination>) and one of save (-s) or edit (-e)')
    console.log(push.opts());
    console.log(push.help());
    process.exit(1);
  }

  if (push.questionDirectory && push.dashboardDirectory) {
    console.error('Option conflict: questionDestination (-q <destination>) and dashboardDestination (-d <destination>) are mutually exclusive');
    console.log(push.opts());
    console.log(push.help());
    process.exit(1);
  }

  if (push.save && push.edit) {
    console.error('Option conflict: save (-s) and edit (-e) are mutually exclusive');
    console.log(push.opts());
    console.log(push.help());
    process.exit(1);
  }
  // **********************

  if (push.questionDirectory) {
    (async () => {
      await saveQuestionsToMetabase(push.opts())
      const brokenQuestions = await getBrokenQuestions(push.databaseId);
      if (brokenQuestions.length > 0) {
        console.error('Metabase contains broken questions:')
        console.error(brokenQuestions)
        console.log('exiting..');
        console.log(push.help());
        process.exit(1);
      }
    })();
  }
  else if (push.dashboardDirectory) {
    (async () => { await saveDashboardsToMetabase(push.opts()) })();
  }
})

program
.command('get-broken-questions')
.option('-i <id>, --database-id', 'Metabase database id')
.action((broken) => {
  (async () => {
    const broken = await getBrokenQuestions(broken.databaseId)
    if (broken.length === 0) {
      console.log('no broken questions')
      process.exit(0);
    } else {
      console.error('Broken questions: [metabaseID_questionName]')
      console.error(broken);
      process.exit(1);
    }
  })();
});
program.parse(process.argv);
if (program.debug) { console.log(program.opts()); console.log(program.help()) }
