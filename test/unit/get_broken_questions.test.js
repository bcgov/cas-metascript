const getBrokenQuestions = require('../get_broken_questions');
const callAPI = require('../../api_calls/call_api');
const getSession = require('../../api_calls/get_session');
const mockedEnv = require('mocked-env');

jest.mock('../../api_calls/call_api');
jest.mock('../../api_calls/get_session');

describe('getQuestionsFromMetabase Integration', () => {
  test('getBrokenQuestions returns an array with the id and name of the broken questions if there are broken questions ' , async () => {
    getSession.mockImplementation(() => {id: 12345})
    callAPI.mockImplementationOnce(() => [{id: 1, name:'broken'}]);
    callAPI.mockImplementation(() => qdata = {error: 'error'});
    const broken = await getBrokenQuestions(1);
    expect(broken).toEqual(['1_broken'])
  });

  test('getBrokenQuestions returns an empty array if there are no broken questions ' , async () => {
    getSession.mockImplementation(() => {id: 12345})
    callAPI.mockImplementationOnce(() => [{id: 1, name:'not_broken'}]);
    callAPI.mockImplementation(() => qdata = {data: 'data'});
    const broken = await getBrokenQuestions(1);
    expect(broken).toEqual([]);
  });
});
