const callAPI = require('../api_calls/call_api');

async function removeDimensionFields(question, session) {

  const fields = question.mbql.fields;
  const filteredFields = []
  
  for (let i = 0; i < fields.length; i++) {
    if (fields[i][0] === 'fk->') {
      const fieldDetails = await callAPI(session, `/field/${fields[i][1][1]}`, 'GET');
      if (fieldDetails.dimensions === undefined)
        filteredFields.push(fields[i]);
      else if (fieldDetails.dimensions.field_id === undefined  || (fields[i][1][1] === fieldDetails.dimensions.field_id && fields[i][2][1] !== fieldDetails.dimensions.human_readable_field_id))
        filteredFields.push(fields[i]);
    }
    else
      filteredFields.push(fields[i])
  };

  question.mbql.fields = filteredFields;
  return question;
}

module.exports = removeDimensionFields;