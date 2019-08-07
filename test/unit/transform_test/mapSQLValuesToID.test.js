const mapSQLValuesToID = require('../../../transform/mapSQLValuesToID');
const callAPI = require('../../../api_calls/call_api');
const util = require('util');
jest.mock('../../../api_calls/call_api');

describe('mapSQLValuesToID tests', () => {
  const question = {
    schema: 'test',
    mbql:{
      source_table: [],
      fields: [],
      filter: [],
      breakout: [],
      aggregation: [],
      "order-by": [],
      columns: [],
      foreign_columns: []
    }  
  }
  beforeEach(() => {
    callAPI.mockReset();
  });

  test('fields in simple queries (no fk relations) can be converted to mbql field IDs' , async () => {
    question.mbql.source_table = ['table1'];
    question.mbql.fields = ['abc', 'cde'];
    question.mbql.columns = [['abc'], ['cde']];
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
        }
      ]
    }
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
});
