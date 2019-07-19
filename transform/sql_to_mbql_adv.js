const util = require('util');
const { Parser } = require('node-sql-parser');
const parser = new Parser();

/**Function to convert an SQL query to MBQL format 
 * @param sql - A query in sql format to be converted
 * @return mbql_query - An object housing the various pieces of data needed to complete a metabase question request
*/
const sql_to_mbql = (question) => {

// Object to house the converted sql in pieces necessary for the mbql query
mbql_query = {
  source_table: [],
  fields: [],
  filter: [],
  breakout: [],
  aggregation: [],
  "order-by": [],
  columns: [],
  foreign_columns: []
}

// astify parses the sql query into a traversable tree
const ast = parser.astify(question.sql);

// Add the from table name to the source table
mbql_query.source_table.push(ast[0].from[0].table);

/*************************************
 *          SELECT CLAUSE            *
 *************************************/

 // The selected fields in Select....From
const select = ast[0].columns;

if (select !== '*') {
  select.forEach(field => {
    if (field.expr.type === 'column_ref' && question.dataset_query.query.fields) {
      const fkeyTest = /\w+__/gi;
      if (fkeyTest.test(field.expr.table)) {
        const tableName = field.expr.table.split('__')[0];
        mbql_query.fields.push(['fk->', `${tableName}_id`, `${tableName}.${field.expr.column}`]);
        mbql_query.columns.push([`${tableName}_id`]);
        mbql_query.foreign_columns.push([tableName, field.expr.column]) 
      }
      else {
        mbql_query.fields.push(field.expr.column)
        mbql_query.columns.push([field.expr.column]);
      }
    }
    else if (field.expr.type === 'aggr_func') {
      const fkeyTest = /\w+__/gi;
      if (fkeyTest.test(field.expr.args.expr.table)) {
        const tableName = field.expr.args.expr.table.split('__')[0]
        mbql_query.aggregation.push([field.expr.name, ['fk->', `${tableName}_id`, `${tableName}.${field.expr.args.expr.column}`]])
        mbql_query.foreign_columns.push([tableName, field.expr.args.expr.column]) 
      }
      else {
        mbql_query.aggregation.push([field.expr.name, field.expr.args.expr.column])
        mbql_query.columns.push([field.expr.args.expr.column]);
      }

    }
  });
}

/*************************************
 *          WHERE CLAUSE             *
 *************************************/

 // The where clause from the astified sql tree
const where = ast[0].where;

/** Calling function for the recursive traverseObject function 
 *  @param obj - The object to iterate on
 *  @param array - The array to push the data (mbql-ized sql) to
 *  @param parent - The value's node parent (left or right) - Deprecated
*/
const traverse = (obj, array, parent) => {
  if ((typeof obj === 'object') && (obj !== null)) {
    traverseObject(obj, array, parent)
  }
}

const traverseObject = (obj, array) => {
  // If the current object has a 'left' node then it is an operation, push the operator and traverse the left and right branches
  if (obj.hasOwnProperty('left')) {
    array.push([])
    array = array[array.length-1]
    if (obj.operator === '<>')
      obj.operator = '!=';
    array.push(obj.operator);
    // Deprecated to be removed on testing
    if (!obj.left.hasOwnProperty('left')) {
      
    }
    traverse(obj.left, array, 'left')
    traverse(obj.right, array, 'right')
  }
  // If the current object has no 'left' node then it is a value, push the value
  else {
    if (obj.column) {
      const fkeyTest = /\w+__/gi;
      const fkeyTableName = /\w+(?=__via)/gi;
      // test for join by searching astified table for pattern 'table__via__table_id 
      if (fkeyTest.test(obj.table)) {
        const fk = obj.table.replace(fkeyTest, '');
        const foreignTableName = obj.table.match(fkeyTableName)[0]
        array.push([])
        array = array[array.length-1]
        array.push('fk->')
        array.push(fk)
        array.push(`${foreignTableName}.${obj.column}`)
        mbql_query.columns.push([fk]);
        mbql_query.foreign_columns.push([foreignTableName, obj.column])
      }
      else {  
        array.push(obj.column);   
        mbql_query.columns.push([obj.column]);
      }
    }
    else if (obj.type === 'null')
      array.push(null);
    else
      array.push(obj.value);
  }
}

if (where) {
  // Call traverse function on astifieid 'where' object and push data to filter in mbql_query object
  traverse(where, mbql_query.filter, '');

  // The function finishes with one too many outer arrays housing all the inner arrays. So pop goes the weasel
  mbql_query.filter = mbql_query.filter.pop();
}

/*************************************
 *    GROUPBY / ORDERBY CLAUSE       *
 *************************************/

const groupBy = ast[0].groupby;
const orderBy = ast[0].orderby;
if (groupBy) {
  groupBy.forEach(groupField => {
    if (groupField.type === 'column_ref') {
      const fkeyTest = /\w+__/gi;
      if (fkeyTest.test(groupField.table)) {
        const tableName = groupField.table.split('__')[0];
        mbql_query.breakout.push(['fk->', `${tableName}_id`, `${tableName}.${groupField.column}`]);
        mbql_query.columns.push([`${tableName}_id`])
        mbql_query.foreign_columns.push([`${tableName}`, groupField.column])
      }
      else {
        mbql_query.breakout.push(groupField.column)
        mbql_query.columns.push([groupField.column]);
      }
    }
  })
}

if (orderBy) {
  orderBy.forEach(orderedField => {
    if (orderedField.expr.type === 'column_ref') {
      const fkeyTest = /\w+__/gi;
      if (fkeyTest.test(orderedField.expr.table)) {
        const tableName = orderedField.expr.table.split('__')[0];
        mbql_query['order-by'].push([orderedField.type, ['fk->', `${tableName}_id`, `${tableName}.${orderedField.expr.column}`]]);
        mbql_query.columns.push([`${tableName}_id`])
        mbql_query.foreign_columns.push([`${tableName}`, orderedField.expr.column])
      }
      else {
        mbql_query['order-by'].push([orderedField.type, orderedField.expr.column])
        mbql_query.columns.push([orderedField.expr.column]);
      }
    }
  })
}

return mbql_query;

}

module.exports = sql_to_mbql;