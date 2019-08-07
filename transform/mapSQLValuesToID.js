const util = require('util');
const callAPI = require('../api_calls/call_api');

/**
 * Function replaceValues() recursively traverses the nested array mbqlClause object and replaces the named tables with the metabase ID's
 * @param {ARRAY[]} mbqlClause
 * @param {ARRAY[]} columns 
 */
const replaceValues = (mbqlClause, columns, foreign_columns) => {
  for (let i = 0; i < mbqlClause.length; i++) {
    if (Array.isArray(mbqlClause[i])) {
      replaceValues(mbqlClause[i], columns, foreign_columns);
    }
    else {
      columns.forEach(column => {
        if (mbqlClause[i] === column[0]) {
          mbqlClause[i] = ['field-id', column[1]];
        }
      })
      foreign_columns.forEach(column => {
        if (mbqlClause[i] === `${column[0]}.${column[1]}`) {
          mbqlClause[i] = ['field-id', column[2]];
        }
      })
    }
  }
  return mbqlClause;
}

/**
 * mapSQLValues takes data from a metabase API call then uses this data to convert named values in
 * the parsedSQL object to ID's (ie source_table: 'facility_details' --> source:table: 219)
 * @param {object} question - the current metabase question object to be mapped
 * @param {object} session - the user's session object containing their session id
 */
async function mapSQLValuesToID(question, session) {
  // The metadata is a complete list of all the tables / columns / fields in the metabase database
  const metadata = await callAPI(session, `/database/${question.database_id}/metadata`, 'GET')
  metadata.tables.forEach(table => {
    if (table.name === question.mbql.source_table[0] && table.schema.toUpperCase() === question.schema.toUpperCase()) {
      question.mbql.source_table.push(table.id);
      // find the metabase field id that corresponds to the sql column name
      question.mbql.columns.forEach(column => {
        table.fields.forEach(field => {
          if (field.name === column[0]) {
            column.push(field.id);
          }
        })
      })
    }
    // find the metabase field id that corresponds to the sql column name (for fk relations)
    question.mbql.foreign_columns.forEach(foreign_column => {
      if (table.name === foreign_column[0] && table.schema.toUpperCase() === question.schema.toUpperCase()) {
        table.fields.forEach(field => {
          if (field.name === foreign_column[1]) {
            foreign_column.push(field.id);
          }
        })
      }
    })
  })
  // replace the values in each of the mbql structure items
  question.mbql.filter = replaceValues(question.mbql.filter, question.mbql.columns, question.mbql.foreign_columns)
  question.mbql.breakout = replaceValues(question.mbql.breakout, question.mbql.columns, question.mbql.foreign_columns)
  question.mbql.fields = replaceValues(question.mbql.fields, question.mbql.columns, question.mbql.foreign_columns)
  question.mbql.aggregation = replaceValues(question.mbql.aggregation, question.mbql.columns, question.mbql.foreign_columns)
  question.mbql['order-by'] = replaceValues(question.mbql['order-by'], question.mbql.columns, question.mbql.foreign_columns)

  return question;
}

module.exports = mapSQLValuesToID;
