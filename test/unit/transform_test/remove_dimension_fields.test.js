const removeDimensionFields = require('../../../transform/remove_dimension_fields');
const callAPI = require('../../../api_calls/call_api');
const util = require('util');
jest.mock('../../../api_calls/call_api');

describe('remove_dimension_fields tests', () => {
  const question = {
    mbql:{
      fields: []
    }  
  }
  beforeEach(() => {
    callAPI.mockReset();
  });

  test('test no fields are removed when there are no dimension fields present', async () => {
    const returnValue = {
      dimensions: []
    }

    callAPI.mockImplementation(() => returnValue);
    const session = {id: 12345};
    question.mbql.fields = [['field-id', 1234], ['field-id', 5678], ['fk->', ['field-id', 4321], ['field-id', 1111]]];

    expect(await removeDimensionFields(question, session))
    .toStrictEqual(
      {mbql: {fields:[['field-id', 1234], ['field-id', 5678], ['fk->', ['field-id', 4321], ['field-id', 1111]]]}}
    );
  });

  test('test no fields are removed when the fk field id is not repeated in the non-fk fields', async () => {
    const returnValue = {
      dimensions: {
        field_id: 4321,
        human_readable_field_id: 1111
      }
    }
    
    callAPI.mockImplementation(() => returnValue);
    const session = {id: 12345};
    question.mbql.fields = [['field-id', 1234], ['field-id', 5678], ['fk->', ['field-id', 4321], ['field-id', 1111]]];

    expect(await removeDimensionFields(question, session))
    .toStrictEqual(
      {mbql: {fields:[['field-id', 1234], ['field-id', 5678], ['fk->', ['field-id', 4321], ['field-id', 1111]]]}}
    );
  });

  test('test no fields are removed when the fk field id is repeated in the non-fk fields but the human-readable field does not match the fk target', async () => {
    const returnValue = {
      dimensions: {
        field_id: 4321,
        human_readable_field_id: 2222
      }
    }
    
    callAPI.mockImplementation(() => returnValue);
    const session = {id: 12345};
    question.mbql.fields = [['field-id', 1234], ['field-id', 5678], ['field-id', 4321], ['fk->', ['field-id', 4321], ['field-id', 1111]]];

    expect(await removeDimensionFields(question, session))
    .toStrictEqual(
      {mbql: {fields:[['field-id', 1234], ['field-id', 5678], ['field-id', 4321], ['fk->', ['field-id', 4321], ['field-id', 1111]]]}}
    );
  });

  test('test the fk field is removed when the fk field id is repeated in the non-fk fields and the fk target === dimension.human_readable_field', async () => {
    const returnValue = {
      dimensions: {
        field_id: 4321,
        human_readable_field_id: 1111
      }
    }
    
    callAPI.mockImplementation(() => returnValue);
    const session = {id: 12345};
    question.mbql.fields = [['field-id', 1234], ['field-id', 5678], ['field-id', 4321], ['fk->', ['field-id', 4321], ['field-id', 1111]]];

    expect(await removeDimensionFields(question, session))
    .toStrictEqual(
      {mbql: {fields:[['field-id', 1234], ['field-id', 5678], ['field-id', 4321]]}}
    );
  });
});
