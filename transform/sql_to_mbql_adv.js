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


const testSQL = `
select emission.gas_type, sum(facility.swrs_facility_id), facility.facility_name
from ggircs.emission
join facility on emission.facility_id = facility.id
where emission.gas_type = 'N20'
and facility.facility_type = 'LFO'
order by facility.facility_name;
`
// astify parses the sql query into a traversable tree
// const ast = parser.astify(testSQL);
const ast = parser.astify(question.sql);

// console.log(util.inspect(ast, false, null, true /* enable colors */));
// Add the from table name to the source table
mbql_query.source_table.push(ast[0].from[0].table);
const from = ast[0].from;

/*************************************
 *          SELECT CLAUSE            *
 *************************************/

 // The selected fields in Select....From
const select = ast[0].columns;

if (select !== '*') {
  select.forEach(field => {
    // If the field in the select statement is a column reference and the dataset_query contains fields
    if (field.expr.type === 'column_ref' && question.dataset_query.query.fields) {
      let joinTable = {};
      // If the table in the expression is a foreign table reference
      if (field.expr.table !== mbql_query.source_table[0]) {
        for (let i = 1; i < from.length; i++) {
          // Find the correct foreign table reference in the join clause
          if (field.expr.table === from[i].table || field.expr.table === from[i].as)
            joinTable = from[i];
        }
        const tableName = {
          table: joinTable.table,
          alias: joinTable.as
        }
        /* Find the foreign key in the join clause (if the foreign table is on the right side of the clause,
           then the foreign key in the source table is on the left side of the clause) */
        if (joinTable.on.right.table === tableName.table || joinTable.on.right.table === tableName.alias) {
          mbql_query.fields.push(['fk->', `${joinTable.on.left.column}`, `${tableName.table}.${field.expr.column}`]);
          mbql_query.columns.push([`${joinTable.on.left.column}`]);
        }
        else {
          mbql_query.fields.push(['fk->', `${joinTable.on.right.column}`, `${tableName.table}.${field.expr.column}`]);
          mbql_query.columns.push([`${joinTable.on.right.column}`]);
        }
        mbql_query.foreign_columns.push([tableName.table, field.expr.column]);
      }
      else {
        mbql_query.fields.push(field.expr.column)
        mbql_query.columns.push([field.expr.column]);
      }
    }
    // If the field in the select statement is an aggregate function
    else if (field.expr.type === 'aggr_func') {
      let joinTable = {};
      // If the table in the expression is a foreign table reference
      if (field.expr.args.expr.table !== mbql_query.source_table[0]) {
        for (let i = 1; i < from.length; i++) {
          // Find the correct foreign table reference in the join clause
          if (field.expr.args.expr.table === from[i].table || field.expr.args.expr.table === from[i].as)
            joinTable = from[i];
        }
        const tableName = {
          table: joinTable.table,
          alias: joinTable.as
        }
        /* Find the foreign key in the join clause (if the foreign table is on the right side of the clause,
           then the foreign key in the source table is on the left side of the clause) */
        if (joinTable.on.right.table === tableName.table || joinTable.on.right.table === tableName.alias) {
          mbql_query.aggregation.push(['fk->', `${joinTable.on.left.column}`, `${tableName.table}.${field.expr.args.expr.column}`]);
          mbql_query.columns.push([`${joinTable.on.left.column}`]);
        }
        else {
          mbql_query.aggregation.push(['fk->', `${joinTable.on.right.column}`, `${tableName.table}.${field.expr.args.expr.column}`]);
          mbql_query.columns.push([`${joinTable.on.right.column}`]);
        }
        mbql_query.foreign_columns.push([tableName.table, field.expr.args.expr.column]);
      }
      // If the table in the expression is the same as the source table
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
const traverse = (obj, array, from) => {
  if ((typeof obj === 'object') && (obj !== null)) {
    traverseObject(obj, array, from)
  }
}

const traverseObject = (obj, array, from) => {
  // If the current object has a 'left' node then it is an operation, push the operator and traverse the left and right branches
  if (obj.hasOwnProperty('left')) {
    array.push([])
    array = array[array.length-1]
    if (obj.operator === '<>')
      obj.operator = '!=';
    array.push(obj.operator);

    traverse(obj.left, array, from);
    traverse(obj.right, array, from);
  }
  // If the current object has no 'left' node then it is a value, push the value
  else {
    if (obj.column) {
      if (obj.table !== mbql_query.source_table[0]) {
        let joinTable = {};
        array.push([]);
        array = array[array.length-1]

        for (let i = 1; i < from.length; i++) {
          if (obj.table === from[i].table || obj.table === from[i].as)
            joinTable = from[i]
        }
        const tableName = {
          table: joinTable.table,
          alias: joinTable.as
        }
        /* Find the foreign key in the join clause (if the foreign table is on the right side of the clause,
           then the foreign key in the source table is on the left side of the clause) */
        if (joinTable.on.right.table === tableName.table || joinTable.on.right.table === tableName.alias) {
          array.push('fk->', `${joinTable.on.left.column}`, `${tableName.table}.${obj.column}`);
          mbql_query.columns.push([`${joinTable.on.left.column}`]);
        }
        else {
          array.push('fk->', `${joinTable.on.right.column}`, `${tableName.table}.${obj.column}`);
          mbql_query.columns.push([`${joinTable.on.right.column}`]);
        }
        mbql_query.foreign_columns.push([tableName.table, obj.column])
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
  traverse(where, mbql_query.filter, from);

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
      if (groupField.table !== mbql_query.source_table[0]) {
        for (let i = 1; i < from.length; i++) {
          // Find the correct foreign table reference in the join clause
          if (groupField.table === from[i].table || groupField.table === from[i].as)
            joinTable = from[i];
        }
        const tableName = {
          table: joinTable.table,
          alias: joinTable.as
        }
        /* Find the foreign key in the join clause (if the foreign table is on the right side of the clause,
           then the foreign key in the source table is on the left side of the clause) */
        if (joinTable.on.right.table === tableName.table || joinTable.on.right.table === tableName.alias) {
          mbql_query.breakout.push(['fk->', `${joinTable.on.left.column}`, `${tableName.table}.${groupField.column}`]);
          mbql_query.columns.push([`${joinTable.on.left.column}`]);
        }
        else {
          mbql_query.breakout.push(['fk->', `${joinTable.on.right.column}`, `${tableName.table}.${groupField.column}`]);
          mbql_query.columns.push([`${joinTable.on.right.column}`]);
        }
        mbql_query.foreign_columns.push([`${tableName.table}`, groupField.column])
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
      if (orderedField.expr.table !== mbql_query.source_table[0]) {
        let joinTable;
        for (let i = 1; i < from.length; i++) {
          // Find the correct foreign table reference in the join clause
          if (orderedField.expr.table === from[i].table || orderedField.expr.table === from[i].as)
            joinTable = from[i];
        }
        const tableName = {
          table: joinTable.table,
          alias: joinTable.as
        }

        /* Find the foreign key in the join clause (if the foreign table is on the right side of the clause,
           then the foreign key in the source table is on the left side of the clause) */
        if (joinTable.on.right.table === tableName.table || joinTable.on.right.table === tableName.alias) {
          mbql_query['order-by'].push([orderedField.type, ['fk->', `${joinTable.on.left.column}`, `${tableName.table}.${orderedField.expr.column}`]]);
          mbql_query.columns.push([`${joinTable.on.left.column}`]);
        }
        else {
          mbql_query['order-by'].push([orderedField.type, ['fk->', `${joinTable.on.right.column}`, `${tableName.table}.${orderedField.expr.column}`]]);
          mbql_query.columns.push([`${joinTable.on.right.column}`]);
        }
        mbql_query.foreign_columns.push([`${tableName.table}`, orderedField.expr.column])
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