const sql_to_mbql = require('../../transform/sql_to_mbql_adv');
const util = require('util');

const question = {
  sql: '',
  dataset_query:{}
}

test('test conversion of a single table query', () => {
  question.sql = 'select fuel.abc, fuel.cde from ggircs.fuel';
  question.dataset_query = {query:{fields:{0:[123]}}};
  
  expect(sql_to_mbql(question))
  .toStrictEqual(
    {"aggregation": [],
     "breakout": [],
     "columns": [["abc"], ["cde"]],
     "fields": ["abc", "cde"],
     "filter": [],
     "foreign_columns": [],
     "order-by": [],
     "source_table": ["fuel"]}
  );
});

test('test conversion of a query with a where clause', () => {
  question.sql = `select fuel.abc, fuel.cde from ggircs.fuel where fuel.abc = 'Rick Sanchez' `;
  question.dataset_query = {query:{fields:{0:[123]}}};
  
  console.log(util.inspect(sql_to_mbql(question), false, null, true /* enable colors */));
  expect(sql_to_mbql(question))
  .toStrictEqual(
    {"aggregation": [],
     "breakout": [],
     "columns": [["abc"], ["cde"]],
     "fields": ["abc", "cde"],
     "filter": ["=", "abc", "Rick Sanchez"],
     "foreign_columns": [],
     "order-by": [],
     "source_table": ["fuel"]}
  );
});

test('test conversion of a query with a foreign table', () => {
  question.sql = 'select fuel.abc, fuel.cde, report.fgh from ggircs.fuel left join ggircs.report on fuel.report_id = report.id';
  question.dataset_query = {query:{fields:{0:[123]}}};
  expect(sql_to_mbql(question))
  .toStrictEqual(
    {"aggregation": [],
     "breakout": [],
     "columns": [["abc"], ["cde"], ["report_id"]],
     "fields": ["abc", "cde", ["fk->", "report_id", "report.fgh"]],
     "filter": [],
     "foreign_columns": [["report", "fgh"]],
     "order-by": [],
     "source_table": ["fuel"]}
  );
});
