const sql_to_mbql = require('../../../transform/sql_to_mbql_adv');
const util = require('util');

describe('sql -> mbql format conversion tests', () => {
  const question = {
    sql: '',
    dataset_query:{query:{}}
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

  test('test conversion of a query with an aggregation', () => {
    question.sql = 'select sum(fuel.abc), fuel.cde, report.fgh from ggircs.fuel left join ggircs.report on fuel.report_id = report.id';
    question.dataset_query = {query:{fields:{0:[123]}}};
    expect(sql_to_mbql(question))
    .toStrictEqual(
      {"aggregation": [["SUM", 'abc']],
      "breakout": [],
      "columns": [["abc"], ["cde"], ["report_id"]],
      "fields": ["cde", ["fk->", "report_id", "report.fgh"]],
      "filter": [],
      "foreign_columns": [["report", "fgh"]],
      "order-by": [],
      "source_table": ["fuel"]}
    );
  });

  test('test conversion of a query with an group by / order by', () => {
    question.sql = 'select sum(fuel.abc), fuel.cde, report.fgh from ggircs.fuel left join ggircs.report on fuel.report_id = report.id group by fuel.cde order by fuel.cde DESC';
    question.dataset_query = {query:{fields:{0:[123]}}};
    expect(sql_to_mbql(question))
    .toStrictEqual(
      {"aggregation": [["SUM", 'abc']],
      "breakout": ["cde"],
      "columns": [["abc"], ["cde"], ["report_id"]],
      "fields": ["cde", ["fk->", "report_id", "report.fgh"]],
      "filter": [],
      "foreign_columns": [["report", "fgh"]],
      "order-by": [['DESC', 'cde']],
      "source_table": ["fuel"]}
    );
  });
});

describe('sql -> mbql comparison operator conversion tests', () => {
  const question = {
    sql: '',
    dataset_query:{query:{}}
  };

  test('sql operator <> gets parsed to != when converted to mbql', () => {
    question.sql = 'select fuel.abc from ggircs.fuel where fuel.abc <> 5';
    expect(sql_to_mbql(question))
    .toStrictEqual(
      {"aggregation": [],
      "breakout": [],
      "columns": [["abc"]],
      "fields": [],
      "filter": ['!=', 'abc', 5],
      "foreign_columns": [],
      "order-by": [],
      "source_table": ["fuel"]}
    )
  });

  test('sql operator IS NULL gets parsed to is-null when converted to mbql', () => {
    question.sql = 'select fuel.abc from ggircs.fuel where fuel.abc is null';
    expect(sql_to_mbql(question))
    .toStrictEqual(
      {"aggregation": [],
      "breakout": [],
      "columns": [["abc"]],
      "fields": [],
      "filter": ['is-null', 'abc'],
      "foreign_columns": [],
      "order-by": [],
      "source_table": ["fuel"]}
    )
  });

  test('sql operator IS NOT NULL gets parsed to not-null when converted to mbql', () => {
    question.sql = 'select fuel.abc from ggircs.fuel where fuel.abc IS NOT NULL';
    expect(sql_to_mbql(question))
    .toStrictEqual(
      {"aggregation": [],
      "breakout": [],
      "columns": [["abc"]],
      "fields": [],
      "filter": ['not-null', 'abc'],
      "foreign_columns": [],
      "order-by": [],
      "source_table": ["fuel"]}
    )
  });

  test('sql operator pattern [table.column LIKE %\w%] (case sensitive) gets parsed to contains when converted to mbql', () => {
    question.sql = "select fuel.abc from ggircs.fuel where fuel.abc like '%word%'";
    expect(sql_to_mbql(question))
    .toStrictEqual(
      {"aggregation": [],
      "breakout": [],
      "columns": [["abc"]],
      "fields": [],
      "filter": ['contains', 'abc', 'word', {'case-sensitive': true}],
      "foreign_columns": [],
      "order-by": [],
      "source_table": ["fuel"]}
    )
  });

  test('sql operator pattern [NOT table.column LIKE %\w%] (case sensitive) gets parsed to ends-with when converted to mbql', () => {
    question.sql = "select fuel.abc from ggircs.fuel where fuel.abc NOT like '%word%'";
    expect(sql_to_mbql(question))
    .toStrictEqual(
      {"aggregation": [],
      "breakout": [],
      "columns": [["abc"]],
      "fields": [],
      "filter": ['not-contains', 'abc', 'word', {'case-sensitive': true}],
      "foreign_columns": [],
      "order-by": [],
      "source_table": ["fuel"]}
    )
  });

  test('sql operator pattern [table.column NOT LIKE %\w%] (case sensitive) gets parsed to ends-with when converted to mbql', () => {
    question.sql = "select fuel.abc from ggircs.fuel where fuel.abc NOT like '%word%'";
    expect(sql_to_mbql(question))
    .toStrictEqual(
      {"aggregation": [],
      "breakout": [],
      "columns": [["abc"]],
      "fields": [],
      "filter": ['not-contains', 'abc', 'word', {'case-sensitive': true}],
      "foreign_columns": [],
      "order-by": [],
      "source_table": ["fuel"]}
    )
  });

  test('sql operator pattern [table.column LIKE %\w] (case sensitive) gets parsed to ends-with when converted to mbql', () => {
    question.sql = "select fuel.abc from ggircs.fuel where (fuel.abc like '%word')";
    expect(sql_to_mbql(question))
    .toStrictEqual(
      {"aggregation": [],
      "breakout": [],
      "columns": [["abc"]],
      "fields": [],
      "filter": ['ends-with', 'abc', 'word', {'case-sensitive': true}],
      "foreign_columns": [],
      "order-by": [],
      "source_table": ["fuel"]}
    )
  });

  test('sql operator pattern [table.column LIKE \w%] (case sensitive) gets parsed to starts-with when converted to mbql', () => {
    question.sql = "select fuel.abc from ggircs.fuel where (fuel.abc like 'word%')";
    expect(sql_to_mbql(question))
    .toStrictEqual(
      {"aggregation": [],
      "breakout": [],
      "columns": [["abc"]],
      "fields": [],
      "filter": ['starts-with', 'abc', 'word', {'case-sensitive': true}],
      "foreign_columns": [],
      "order-by": [],
      "source_table": ["fuel"]}
    )
  });

  test('sql operator pattern [foreign_table.column LIKE %\w%] (case sensitive) gets parsed to contains when converted to mbql', () => {
    question.sql = "select fuel.abc from ggircs.fuel left join ggircs.facility on fuel.facility_id = facility.id where facility.cde like '%word%'";
    expect(sql_to_mbql(question))
    .toStrictEqual(
      {"aggregation": [],
      "breakout": [],
      "columns": [["facility_id"], ["cde"]],
      "fields": [],
      "filter": ['contains', [['fk->', 'facility_id', 'facility.cde'], 'word', {'case-sensitive': true}]],
      "foreign_columns": [['facility', 'cde']],
      "order-by": [],
      "source_table": ["fuel"]}
    )
  });

  test('sql operator pattern [NOT foreign_table.column LIKE %\w%] (case sensitive) gets parsed to not-contains when converted to mbql', () => {
    question.sql = "select fuel.abc from ggircs.fuel left join ggircs.facility on fuel.facility_id = facility.id where not facility.cde like '%word%'";
    expect(sql_to_mbql(question))
    .toStrictEqual(
      {"aggregation": [],
      "breakout": [],
      "columns": [["facility_id"], ["cde"]],
      "fields": [],
      "filter": ['not-contains', [['fk->', 'facility_id', 'facility.cde'], 'word', {'case-sensitive': true}]],
      "foreign_columns": [['facility', 'cde']],
      "order-by": [],
      "source_table": ["fuel"]}
    )
  });

  test('sql operator pattern [foreign_table.column LIKE %\w] (case sensitive) gets parsed to ends-with when converted to mbql', () => {
    question.sql = "select fuel.abc from ggircs.fuel left join ggircs.facility on fuel.facility_id = facility.id where not facility.cde like '%word'";
    expect(sql_to_mbql(question))
    .toStrictEqual(
      {"aggregation": [],
      "breakout": [],
      "columns": [["facility_id"], ["cde"]],
      "fields": [],
      "filter": ['ends-with', [['fk->', 'facility_id', 'facility.cde'], 'word', {'case-sensitive': true}]],
      "foreign_columns": [['facility', 'cde']],
      "order-by": [],
      "source_table": ["fuel"]}
    )
  });

  test('sql operator pattern [foreign_table.column LIKE \w%] (case sensitive) gets parsed to starts-with when converted to mbql', () => {
    question.sql = "select fuel.abc from ggircs.fuel left join ggircs.facility on fuel.facility_id = facility.id where not facility.cde like 'word%'";
    expect(sql_to_mbql(question))
    .toStrictEqual(
      {"aggregation": [],
      "breakout": [],
      "columns": [["facility_id"], ["cde"]],
      "fields": [],
      "filter": ['starts-with', [['fk->', 'facility_id', 'facility.cde'], 'word', {'case-sensitive': true}]],
      "foreign_columns": [['facility', 'cde']],
      "order-by": [],
      "source_table": ["fuel"]}
    )
  });

  test('sql operator pattern [lower(table.column LIKE %\w%)] (case insensitive) gets parsed to contains when converted to mbql', () => {
    question.sql = "select fuel.abc from ggircs.fuel where lower(fuel.abc) like '%word%'";
    expect(sql_to_mbql(question))
    .toStrictEqual(
      {"aggregation": [],
      "breakout": [],
      "columns": [["abc"]],
      "fields": [],
      "filter": ['contains', 'abc', 'word', {'case-sensitive': false}],
      "foreign_columns": [],
      "order-by": [],
      "source_table": ["fuel"]}
    )
  });

  test('sql operator pattern [NOT table.column LIKE %\w%] (case insensitive) gets parsed to ends-with when converted to mbql', () => {
    question.sql = "select fuel.abc from ggircs.fuel where lower(fuel.abc) NOT like '%word%'";
    expect(sql_to_mbql(question))
    .toStrictEqual(
      {"aggregation": [],
      "breakout": [],
      "columns": [["abc"]],
      "fields": [],
      "filter": ['not-contains', 'abc', 'word', {'case-sensitive': false}],
      "foreign_columns": [],
      "order-by": [],
      "source_table": ["fuel"]}
    )
  });

  test('sql operator pattern [table.column NOT LIKE %\w%] (case insensitive) gets parsed to ends-with when converted to mbql', () => {
    question.sql = "select fuel.abc from ggircs.fuel where (lower(fuel.abc) NOT like '%word%')";
    expect(sql_to_mbql(question))
    .toStrictEqual(
      {"aggregation": [],
      "breakout": [],
      "columns": [["abc"]],
      "fields": [],
      "filter": ['not-contains', 'abc', 'word', {'case-sensitive': false}],
      "foreign_columns": [],
      "order-by": [],
      "source_table": ["fuel"]}
    )
  });

  test('sql operator pattern [table.column LIKE %\w] (case insensitive) gets parsed to ends-with when converted to mbql', () => {
    question.sql = "select fuel.abc from ggircs.fuel where (lower(fuel.abc) like '%word')";
    expect(sql_to_mbql(question))
    .toStrictEqual(
      {"aggregation": [],
      "breakout": [],
      "columns": [["abc"]],
      "fields": [],
      "filter": ['ends-with', 'abc', 'word', {'case-sensitive': false}],
      "foreign_columns": [],
      "order-by": [],
      "source_table": ["fuel"]}
    )
  });

  test('sql operator pattern [table.column LIKE \w%] (case insensitive) gets parsed to starts-with when converted to mbql', () => {
    question.sql = "select fuel.abc from ggircs.fuel where (lower(fuel.abc) like 'word%')";
    expect(sql_to_mbql(question))
    .toStrictEqual(
      {"aggregation": [],
      "breakout": [],
      "columns": [["abc"]],
      "fields": [],
      "filter": ['starts-with', 'abc', 'word', {'case-sensitive': false}],
      "foreign_columns": [],
      "order-by": [],
      "source_table": ["fuel"]}
    )
  });

  test('sql operator pattern [foreign_table.column LIKE %\w%] (case insensitive) gets parsed to contains when converted to mbql', () => {
    question.sql = "select fuel.abc from ggircs.fuel left join ggircs.facility on fuel.facility_id = facility.id where lower(facility.cde) like '%word%'";
    expect(sql_to_mbql(question))
    .toStrictEqual(
      {"aggregation": [],
      "breakout": [],
      "columns": [["facility_id"], ["cde"]],
      "fields": [],
      "filter": ['contains', [['fk->', 'facility_id', 'facility.cde'], 'word', {'case-sensitive': false}]],
      "foreign_columns": [['facility', 'cde']],
      "order-by": [],
      "source_table": ["fuel"]}
    )
  });

  test('sql operator pattern [NOT foreign_table.column LIKE %\w%] (case insensitive) gets parsed to not-contains when converted to mbql', () => {
    question.sql = "select fuel.abc from ggircs.fuel left join ggircs.facility on fuel.facility_id = facility.id where not lower(facility.cde) like '%word%'";
    expect(sql_to_mbql(question))
    .toStrictEqual(
      {"aggregation": [],
      "breakout": [],
      "columns": [["facility_id"], ["cde"]],
      "fields": [],
      "filter": ['not-contains', [['fk->', 'facility_id', 'facility.cde'], 'word', {'case-sensitive': false}]],
      "foreign_columns": [['facility', 'cde']],
      "order-by": [],
      "source_table": ["fuel"]}
    )
  });

  test('sql operator pattern [foreign_table.column LIKE %\w] (case insensitive) gets parsed to ends-with when converted to mbql', () => {
    question.sql = "select fuel.abc from ggircs.fuel left join ggircs.facility on fuel.facility_id = facility.id where not lower(facility.cde) like '%word'";
    expect(sql_to_mbql(question))
    .toStrictEqual(
      {"aggregation": [],
      "breakout": [],
      "columns": [["facility_id"], ["cde"]],
      "fields": [],
      "filter": ['ends-with', [['fk->', 'facility_id', 'facility.cde'], 'word', {'case-sensitive': false}]],
      "foreign_columns": [['facility', 'cde']],
      "order-by": [],
      "source_table": ["fuel"]}
    )
  });

  test('sql operator pattern [foreign_table.column LIKE \w%] (case insensitive) gets parsed to starts-with when converted to mbql', () => {
    question.sql = "select fuel.abc from ggircs.fuel left join ggircs.facility on fuel.facility_id = facility.id where not lower(facility.cde) like 'word%'";
    expect(sql_to_mbql(question))
    .toStrictEqual(
      {"aggregation": [],
      "breakout": [],
      "columns": [["facility_id"], ["cde"]],
      "fields": [],
      "filter": ['starts-with', [['fk->', 'facility_id', 'facility.cde'], 'word', {'case-sensitive': false}]],
      "foreign_columns": [['facility', 'cde']],
      "order-by": [],
      "source_table": ["fuel"]}
    )
  });
});
