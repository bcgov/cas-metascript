const sql_to_mbql = require('../transform/sql_to_mbql_adv');

/**
 * This is a stand-in for the eventual test suite
 */

// Test the sql -> mbql translator
test('test the sql_to_mbql translator', () => {
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

//TODO: write test suite
