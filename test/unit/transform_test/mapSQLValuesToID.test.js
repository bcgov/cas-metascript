const mapSQLValuesToID = require('../../../transform/mapSQLValuesToID');
const callAPI = require('../../../api_calls/call_api');
const util = require('util');
jest.mock('../../../api_calls/call_api');

describe('mapSQLValuesToID tests', () => {
  // mock value to be returned when mapSQLValuesToID calls callAPI in order to get the table/field metadata
  const returnValue = {
    tables:[
      {
        name: 'table1',
        id: 1,
        schema: 'test',
        fields:
          [
            { name: 'abc', id: 123 },
            { name: 'cde', id: 456 }
          ]
      },
      {
        name: 'table2',
        id: 2,
        schema: 'test',
        fields:
          [
            { name: 'cba', id: 321 },
            { name: 'edc', id: 654 }
          ]
      }
    ]
  }

  const mbql = {
    source_table: [],
    fields: [],
    filter: [],
    breakout: [],
    aggregation: [],
    "order-by": [],
    columns: [],
    foreign_columns: []
  }

  const defaultQuestion = {
    schema: 'test',
    mbql
  }

  beforeEach(() => {
    callAPI.mockReset();
  });

  describe('fields (select statement) tests', () => {
    test('named fields columns in simple queries (no fk relations) can be converted to corresponding mbql field IDs' , async () => {
      const question = {
        ...defaultQuestion,
        mbql:{
          ...defaultQuestion.mbql,
          source_table: ['table1'],
          fields: ['abc', 'cde'],
          columns: [['abc'], ['cde']]
        }
      };

      callAPI.mockImplementation(() => returnValue);
      const session = {id: 12345};
      expect(await mapSQLValuesToID(question, session))
      .toStrictEqual(
        {schema: 'test',
        mbql: {
          source_table:['table1', 1],
          fields:[['field-id', 123], ['field-id', 456]],
          filter: [],
          breakout: [],
          aggregation: [],
          "order-by": [],
          columns: [['abc',123], ['cde',456]],
          foreign_columns: []}}
      );
    });

    test('named fields columns in fk relations can be converted to corresponding mbql field IDs' , async () => {
      const question = {
        ...defaultQuestion,
        mbql:{
          ...defaultQuestion.mbql,
          source_table: ['table1'],
          fields: [['fk->', 'abc', 'table2.cba'], ['fk->', 'cde', 'table2.edc']],
          columns: [['abc'], ['cde']],
          foreign_columns: [['table2', 'cba'], ['table2', 'edc']]
        }
      };

      callAPI.mockImplementation(() => returnValue);
      const session = {id: 12345};
      expect(await mapSQLValuesToID(question, session))
      .toStrictEqual(
        {schema: 'test',
        mbql: {
          source_table:['table1', 1],
          fields:[['fk->', ['field-id', 123], ['field-id', 321]], ['fk->', ['field-id', 456], ['field-id', 654]]],
          filter: [],
          breakout: [],
          aggregation: [],
          "order-by": [],
          columns: [['abc', 123], ['cde', 456]],
          foreign_columns: [['table2', 'cba', 321], ['table2', 'edc', 654]]}}
      );
    });
  });

  describe('filter (where clause) tests', () => {
    test('named filter columns can be converted to corresponding mbql field IDs' , async () => {
      const question = {
        ...defaultQuestion,
        mbql:{
          ...defaultQuestion.mbql,
          source_table: ['table1'],
          filter: [['=', 'abc', 1]],
          columns: [['abc']]
        }
      };

      callAPI.mockImplementation(() => returnValue);
      const session = {id: 12345};
      expect(await mapSQLValuesToID(question, session))
      .toStrictEqual(
        {schema: 'test',
        mbql: {
          source_table:['table1', 1],
          fields:[],
          filter: [['=', ['field-id', 123], 1]],
          breakout: [],
          aggregation: [],
          "order-by": [],
          columns: [['abc',123]],
          foreign_columns: []}}
      );
    });

    test('named filter columns with foreign keys can be converted to corresponding mbql field IDs' , async () => {
      const question = {
        ...defaultQuestion,
        mbql:{
          ...defaultQuestion.mbql,
          source_table: ['table1'],
          filter: [['=', ['fk->', 'abc', 'table2.cba'], 1]],
          columns: [['abc']],
          foreign_columns: [['table2', 'cba']]
        }
      };

      callAPI.mockImplementation(() => returnValue);
      const session = {id: 12345};
      expect(await mapSQLValuesToID(question, session))
      .toStrictEqual(
        {schema: 'test',
        mbql: {
          source_table:['table1', 1],
          fields:[],
          filter: [['=', ['fk->', ['field-id', 123], ['field-id', 321]], 1]],
          breakout: [],
          aggregation: [],
          "order-by": [],
          columns: [['abc',123]],
          foreign_columns: [['table2', 'cba', 321]]}}
      );
    });
  });

  describe('breakout (group by) & order by tests', () => {
    test('named breakout columns can be converted to corresponding mbql field IDs' , async () => {
      const question = {
        ...defaultQuestion,
        mbql:{
          ...defaultQuestion.mbql,
          source_table: ['table1'],
          breakout: ['abc'],
          columns: [['abc']]
        }
      };

      callAPI.mockImplementation(() => returnValue);
      const session = {id: 12345};
      expect(await mapSQLValuesToID(question, session))
      .toStrictEqual(
        {schema: 'test',
        mbql: {
          source_table:['table1', 1],
          fields:[],
          filter: [],
          breakout: [['field-id', 123]],
          aggregation: [],
          "order-by": [],
          columns: [['abc',123]],
          foreign_columns: []}}
      );
    });

    test('named breakout columns with foreign keys can be converted to corresponding mbql field IDs' , async () => {
      const question = {
        ...defaultQuestion,
        mbql:{
          ...defaultQuestion.mbql,
          source_table: ['table1'],
          breakout: [['fk->', 'abc', 'table2.cba']],
          columns: [['abc']],
          foreign_columns: [['table2', 'cba']]
        }
      };

      callAPI.mockImplementation(() => returnValue);
      const session = {id: 12345};
      expect(await mapSQLValuesToID(question, session))
      .toStrictEqual(
        {schema: 'test',
        mbql: {
          source_table:['table1', 1],
          fields:[],
          filter: [],
          breakout: [['fk->', ['field-id', 123], ['field-id', 321]]],
          aggregation: [],
          "order-by": [],
          columns: [['abc',123]],
          foreign_columns: [['table2', 'cba', 321]]}}
      );
    });

    test('named order-by columns can be converted to corresponding mbql field IDs' , async () => {
      const question = {
        ...defaultQuestion,
        mbql:{
          ...defaultQuestion.mbql,
          source_table: ['table1'],
          ['order-by']: ['abc'],
          columns: [['abc']]
        }
      };

      callAPI.mockImplementation(() => returnValue);
      const session = {id: 12345};
      expect(await mapSQLValuesToID(question, session))
      .toStrictEqual(
        {schema: 'test',
        mbql: {
          source_table:['table1', 1],
          fields:[],
          filter: [],
          breakout: [],
          aggregation: [],
          "order-by": [['field-id', 123]],
          columns: [['abc',123]],
          foreign_columns: []}}
      );
    });

    test('named ordery-by columns with foreign keys can be converted to corresponding mbql field IDs' , async () => {
      const question = {
        ...defaultQuestion,
        mbql:{
          ...defaultQuestion.mbql,
          source_table: ['table1'],
          ['order-by']: [['ASC', ['fk->', 'abc', 'table2.cba']]],
          columns: [['abc']],
          foreign_columns: [['table2', 'cba']]
        }
      };

      callAPI.mockImplementation(() => returnValue);
      const session = {id: 12345};
      expect(await mapSQLValuesToID(question, session))
      .toStrictEqual(
        {schema: 'test',
        mbql: {
          source_table:['table1', 1],
          fields:[],
          filter: [],
          breakout: [],
          aggregation: [],
          "order-by": [['ASC', ['fk->', ['field-id', 123], ['field-id', 321]]]],
          columns: [['abc',123]],
          foreign_columns: [['table2', 'cba', 321]]}}
      );
    });
  });

  describe('aggregation tests', () => {
    test('named aggregation columns in simple queries (no fk relations) can be converted to corresponding mbql field IDs' , async () => {
      const question = {
        ...defaultQuestion,
        mbql:{
          ...defaultQuestion.mbql,
          source_table: ['table1'],
          aggregation: [['SUM', 'abc']],
          columns: [['abc']]
        }
      };

      callAPI.mockImplementation(() => returnValue);
      const session = {id: 12345};
      expect(await mapSQLValuesToID(question, session))
      .toStrictEqual(
        {schema: 'test',
        mbql: {
          source_table:['table1', 1],
          fields:[],
          filter: [],
          breakout: [],
          aggregation: [['SUM', ['field-id', 123]]],
          "order-by": [],
          columns: [['abc',123]],
          foreign_columns: []}}
      );
    });

    test('named aggregation columns with fk relations can be converted to corresponding mbql field IDs' , async () => {
      const question = {
        ...defaultQuestion,
        mbql:{
          ...defaultQuestion.mbql,
          source_table: ['table1'],
          aggregation: [['SUM', ['fk->', 'abc', 'table2.cba']]],
          columns: [['abc']],
          foreign_columns: [['table2', 'cba']]
        }
      };

      callAPI.mockImplementation(() => returnValue);
      const session = {id: 12345};
      expect(await mapSQLValuesToID(question, session))
      .toStrictEqual(
        {schema: 'test',
        mbql: {
          source_table:['table1', 1],
          fields:[],
          filter: [],
          breakout: [],
          aggregation: [['SUM', ['fk->', ['field-id', 123], ['field-id', 321]]]],
          "order-by": [],
          columns: [['abc', 123]],
          foreign_columns: [['table2', 'cba', 321]]}}
      );
    });
  });
});
