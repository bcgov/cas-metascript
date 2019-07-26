const callAPI = require('../api_calls/call_api');

/**
 * @function removeDimensionFields:
 *    This function removes the fk relation from the fields to be used in the mbql query
 *    if the fk relation is only being used to serve as a basis for a dimension (renamed field) in metabase
 * @param {object} question The question object with a parsed mbql query included
 * @param {object} session The session object containing the session ID used in api calls
 *
 * field-id 1234 has a dimension: {id: 1234, human_readable_id: 5678}
 * -- Sample input:
 * dataset_query.query.fields = [
 *  [fk->, [field-id, 1234], [field-id, 5678]] (5678 is in 1234's dimension)
 *  [field-id, 5432]
 *  [field-id, 1234] <-- this id is the same as the fk in the first field
 * ]
 *
 * -- Sample output: :
 * dataset_query.query.fields = [
 *  [field-id, 5432]
 *  [field-id, 1234]
 * ]
 */
async function removeDimensionFields(question, session) {

  const fields = question.mbql.fields;
  const filteredFields = [];
  // native fields are fields in the mbql query in the format ['field-id', 12345] (not an fk relation)
  const nativeFields = [];

  fields.forEach(field => {
    if (field[0] === 'field-id')
      nativeFields.push(field[1]);
  })

  for (let i = 0; i < fields.length; i++) {
    if (fields[i][0] === 'fk->') {
      const fieldDetails = await callAPI(session, `/field/${fields[i][1][1]}`, 'GET');
      // If the fk field has no dimensions then push it to the filtered fields
      if (fieldDetails.dimensions === undefined)
        filteredFields.push(fields[i]);
      // If the fk field is not included in the list of non-foreign key fields push to filtered fields (the dimension is not being used)
      else if (!nativeFields.includes(fields[i][1][1]))
        filteredFields.push(fields[i]);
      // If the fk field has dimensions, but the target of the fk relation is not the human-readable field in the dimension, push to filtered fields
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