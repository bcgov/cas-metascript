#!/usr/bin/env node

const getBrokenQuestions = require('./test/get_broken_questions');
const getQuestionsFromMetabase = require('./get_questions_from_metabase');
const getDashboardsFromMetabase = require('./get_dashboards_from_metabase');
// const saveQuestionsToMetabase = require('./save_questions_to_metabase');
// const saveDashboardsToMetabase = require('./save_dashboards_to_metabase');

const commander = require('commander');
const program = new commander.Command();
program.version('0.0.1');

// program
// .option('-D, --debug', 'show options')
// .option('-g, --get <destination>', 'pull entities from metabase & save to destination folder')
// .option('-p, --post', 'push entities to metabase')
// .option('-q, --question', 'pull / push questions')
// .option('-d, --dashboard', 'pull / push dashboards')
// .option('-s, --save', 'save new instances of the entities to metabase (new metabase IDs)')
// .option('-e, --edit', 'save edited instances of the entities in place (keep current metabase IDs)')
// .option('-a, --all', 'pull / push all questions / dashboards')
// .option('-l, --entity-list <list>', 'pull / push a set of questions / dashboards')
// .option('-B, --ignore-broken-question-check', 'ignores the broken question check and proceeds anyway')


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
.option('-q, --question', 'push questions to metabase')
.option('-d, --dashboard', 'push dashboards to metabase')
.option('-l, --entity-list <list>', 'push a set of questions / dashboards (default: [] pushes all)', [])
.option('-s, --save', 'save new instances of the entities to metabase (new metabase IDs)')
.option('-e, --edit', 'save edited instances of the entities in place (keep current metabase IDs)')
.option('-B, --ignore-broken-question-check', 'ignores the broken question check and proceeds anyway')
.action((push) => {
  if (push.debug) { console.log(push.opts()); }

  if (push.question) {
    console.log('push question')
  }
  else if (push.dashboard) {
    console.log('push dashboard')
  }
})

program.parse(process.argv);

// if (program.get) {
//   if (program.question) {
//     if (program.all) {
//       (async () => { 
//         try {
//           const brokenQuestions = await getBrokenQuestions();
//           if (brokenQuestions.length === 0 || program.ignoreBrokenQuestionCheck) {
//             const brokenIDs = [];
//             brokenQuestions.forEach(question => {
//               const id = Number(question.split('').shift());
//               brokenIDs.push(id);
//             });
//             await getQuestionsFromMetabase([], brokenIDs);
//           }
//           else {
//             console.log('Metabase contains broken questions:')
//             console.log(brokenQuestions)
//             process.exit(1);
//           }
//         } catch(e) { console.log(e); } 
//       })();
//       console.log('get question all');
//     }
//     else if (program.entityList) {
//       console.log('get question list')
//     }
//   }
//   else if (program.dashboard) {
//     if (program.all) {
//       console.log('get dashboard all')
//     }
//     else if (program.entityList) {
//       console.log('get dashboard list')
//     }
//   }
// }
// else if (program.post) {
//   if (program.question) {
//     if (program.all) {
//       if (program.save) {
//         console.log('post question all save')
//       }
//       else if (program.edit) {
//         console.log('post question all edit')
//       }
//     }
//     else if (program.entityList) {
//       if (program.save) {
//         console.log('post question list save')
//       }
//       else if (program.edit) {
//         console.log('post question list edit')
//       }
//     }
//   }
//   if (program.dashboard) {
//     if (program.all) {
//       if (program.save) {
//         console.log('post dashboard all save')
//       }
//       else if (program.edit) {
//         console.log('post dashboard all edit')
//       }
//     }
//     else if (program.entityList) {
//       if (program.save) {
//         console.log('post dashboard list save')
//       }
//       else if (program.edit) {
//         console.log('post dashboard list edit')
//       }
//     }
//   }
// }
