const getScrubbedSQL = require('../../../transform/get_scrubbed_sql');
const callAPI = require('../../../api_calls/call_api');
const util = require('util');
jest.mock('../../../api_calls/call_api');

describe('scrub metabase sql tests', () => {

  describe('when fields or aggregation are defined', () => {
    let question;
    beforeEach(() => {

      callAPI.mockReset();
      question = {
        dataset_query: {
          query: {
            fields: ['abc', 'cde'],
            aggregation: []
          }
        }
      }
    });

    test('getScrubbedSQL gets the native sql from queryData.data.native_form path' , async () => {
      let returnValue = {
        data: {
          native_form: {
            query: 'select schema.table1.abc, schema.table1.cde from schema.table1'
          }
        }
      }

      callAPI.mockImplementation(() => returnValue);
      const session = {id: 12345};
      const scrubbedSQL = await getScrubbedSQL(question, session)
      expect(scrubbedSQL)
      .toEqual(
        'select table1.abc, table1.cde from schema.table1'
      )
    });
    
    test('getScrubbedSQL gets the native sql from queryData.native path' , async () => {
      let returnValue = {
        native: {
          query: 'select schema.table1.abc, schema.table1.cde from schema.table1'
        }
      }

      callAPI.mockImplementation(() => returnValue);
      const session = {id: 12345};
      const scrubbedSQL = await getScrubbedSQL(question, session)
      expect(scrubbedSQL)
      .toEqual(
        'select table1.abc, table1.cde from schema.table1'
      )
    });
    
    test('getScrubbedSQL gets the schema name from pattern \w.\w.\w, removes it from that pattern but leaves it alone in any other pattern ' , async () => {
      const returnValue = {
        data: {
          native_form: {
            query: 'select schema.table1.abc, schema.table1.cde from schema.table1'
          }
        }
      }

      callAPI.mockImplementation(() => returnValue);
      const session = {id: 12345};
      const scrubbedSQL = await getScrubbedSQL(question, session)
      expect(question.schema)
      .toEqual(
        'schema'
      );
      expect(scrubbedSQL)
      .toEqual(
        'select table1.abc, table1.cde from schema.table1'
      )
    });

    test('getScrubbedSQL removes double quotes' , async () => {
      const returnValue = {
        data: {
          native_form: {
            query: 'select "schema.table1.abc", "schema.table1.cde" from "schema.table1"'
          }
        }
      }

      callAPI.mockImplementation(() => returnValue);
      const session = {id: 12345};
      const scrubbedSQL = await getScrubbedSQL(question, session)
      expect(scrubbedSQL)
      .toEqual(
        'select table1.abc, table1.cde from schema.table1'
      )
    });

    test('getScrubbedSQL replaces all ? in the query from the params array in order if params are defined' , async () => {
      const returnValue = {
        data: {
          native_form: {
            query: 'select schema.table1.abc, schema.table1.cde from schema.table1 where abc = ? and cde = ?',
            params: ['duck', 'goose']
          }
        }
      }

      callAPI.mockImplementation(() => returnValue);
      const session = {id: 12345};
      const scrubbedSQL = await getScrubbedSQL(question, session)
      expect(scrubbedSQL)
      .toEqual(
        "select table1.abc, table1.cde from schema.table1 where abc = 'duck' and cde = 'goose'"
      )
    });
  });

  describe('when fields and aggregation are an empty array or undefined', () => {
    test('getScrubbedSQL replaces all fields from select clause with a `*` if dataset_query.query.fields is empty and dataset_query.query.aggregation is empty' , async () => {
      const question = {
        dataset_query: {
          query: {
            fields: [],
            aggregation: []
          }
        }
      }
      const returnValue = {
        data: {
          native_form: {
            query: 'select schema.table1.abc, schema.table1.cde from schema.table1'
          }
        }
      }

      callAPI.mockImplementation(() => returnValue);
      const session = {id: 12345};
      const scrubbedSQL = await getScrubbedSQL(question, session)
      expect(scrubbedSQL)
      .toEqual(
        'select * from schema.table1'
      )
    });
  });
});
