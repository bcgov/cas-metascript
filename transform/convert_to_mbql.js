const util = require('util');
const sqlToMbql = require('./sql_to_mbql_adv');
const callAPI = require('../api_calls/call_api');

/**
 * Function replaceValues() recursively traverses the nested array filter object and replaces the named tables with the metabase ID's
 * @param {ARRAY[]} filter 
 * @param {ARRAY[]} columns 
 */
const replaceValues = (filter, columns, foreign_columns) => {
  for (let i = 0; i < filter.length; i++) {
    if (Array.isArray(filter[i])) {
      replaceValues(filter[i], columns, foreign_columns);
    }
    else {
      columns.forEach(column => {
        if (filter[i] === column[0]) {
          filter[i] = ['field-id', column[1]];
        }
      })
      foreign_columns.forEach(column => {
        if (filter[i] === `${column[0]}.${column[1]}`) {
          filter[i] = ['field-id', column[2]];
        }
      })
    }
  }
  return filter;
}

/**
 * mapSQLValues takes data from a metabase API call then uses this data to convert named values in
 * the parsedSQL object to ID's (ie source_table: 'facility_details' --> source:table: 219)
 */
async function mapSQLValuesToID(question, session) {
  const metadata = await callAPI(session, `/database/${question.database_id}/metadata`, 'GET')
  metadata.tables.forEach(table => {
    if (table.name === question.mbql.source_table[0] && table.schema.toUpperCase() === 'GGIRCS') {
      question.mbql.source_table.push(table.id)

      question.mbql.columns.forEach(column => {
        table.fields.forEach(field => {
          if (field.name === column[0]) {
            column.push(field.id);
          }
        })
      })
    }
    question.mbql.foreign_columns.forEach(foreign_column => {
      if (table.name === foreign_column[0] && table.schema.toUpperCase() === 'GGIRCS') {
        table.fields.forEach(field => {
          if (field.name === foreign_column[1]) {
            foreign_column.push(field.id)
          }
        })
      }
    })
  })
  question.mbql.filter = replaceValues(question.mbql.filter, question.mbql.columns, question.mbql.foreign_columns)
  question.mbql.breakout = replaceValues(question.mbql.breakout, question.mbql.columns, question.mbql.foreign_columns)
  question.mbql.fields = replaceValues(question.mbql.fields, question.mbql.columns, question.mbql.foreign_columns)
  question.mbql.aggregation = replaceValues(question.mbql.aggregation, question.mbql.columns, question.mbql.foreign_columns)
  question.mbql['order-by'] = replaceValues(question.mbql['order-by'], question.mbql.columns, question.mbql.foreign_columns)
  
  return question
}

const convertToMBQL = (question, session) => {
  question.mbql = sqlToMbql(question);
  const convertedQuestion = mapSQLValuesToID(question, session)
  return convertedQuestion;
}

module.exports = convertToMBQL;