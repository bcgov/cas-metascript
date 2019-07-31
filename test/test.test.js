const sql_to_mbql = require('../transform/sql_to_mbql_adv');

const question = {
  sql: 'select fuel.abc, fuel.cde, report.fgh from ggircs.fuel left join ggircs.report on fuel.report_id = report.id',
  dataset_query:{
    query: {
      fields:{
        0:[123]
      }
    }
  }
}

test('test the sql_to_mbql translator', () => {
  expect(sql_to_mbql(question))
  .toBe(
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
