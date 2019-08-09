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

  // console.log(util.inspect(ast, false, null, true /* enable colors */));
  // Add the from table name to the source table
  mbql_query.source_table.push(ast.from[0].table);
  const from = ast.from;

  const parseForeignTable = (mbqlClause, from, tablePath) => {
    let joinTable = {};
    for (let i = 1; i < from.length; i++) {
      // Find the correct foreign table reference in the join clause
      if (tablePath.table === from[i].table || tablePath.table === from[i].as)
        joinTable = from[i];
    }
    const tableName = {
      table: joinTable.table,
      alias: joinTable.as
    }
    /* Find the foreign key in the join clause (if the foreign table is on the right side of the clause,
      then the foreign key in the source table is on the left side of the clause) */
    if (joinTable.on.right.table === tableName.table || joinTable.on.right.table === tableName.alias) {
      mbql_query[mbqlClause].push(['fk->', `${joinTable.on.left.column}`, `${tableName.table}.${tablePath.column}`]);
      if (!mbql_query.columns.flat().includes(`${joinTable.on.left.column}`)) { mbql_query.columns.push([`${joinTable.on.left.column}`]); }
    }
    else {
      mbql_query[mbqlClause].push(['fk->', `${joinTable.on.right.column}`, `${tableName.table}.${tablePath.column}`]);
      if (!mbql_query.columns.flat().includes(`${joinTable.on.right.column}`)) { mbql_query.columns.push([`${joinTable.on.right.column}`]); }
    }
    mbql_query.foreign_columns.push([tableName.table, tablePath.column]);
  }

  /*************************************
   *          SELECT CLAUSE            *
   *************************************/

  // The selected fields in Select....From
  const select = ast.columns;

  if (select !== '*') {
    select.forEach(field => {
      // If the field in the select statement is a column reference and the dataset_query contains fields
      if (field.expr.type === 'column_ref' && question.dataset_query.query.fields) {
        // If the table in the expression is a foreign table reference
        if (field.expr.table !== mbql_query.source_table[0]) {
          parseForeignTable('fields', from, field.expr);
        }
        else {
          mbql_query.fields.push(field.expr.column)
          if (!mbql_query.columns.flat().includes(field.expr.column)) { mbql_query.columns.push([field.expr.column]); }
        }
      }
      // If the field in the select statement is an aggregate function
      else if (field.expr.type === 'aggr_func') {
        // If the aggregate function is a function on all push only the function name (sum, count, etc)
        if (field.expr.args.expr.type === 'star') {
          mbql_query.aggregation.push([field.expr.name])
        }
        // If the table in the expression is a foreign table reference
        else if (field.expr.args.expr.table !== mbql_query.source_table[0]) {
          parseForeignTable('aggregate', from, field.expr.args.expr)
        }
        // If the table in the expression is the same as the source table
        else {
          mbql_query.aggregation.push([field.expr.name, field.expr.args.expr.column])
          if (!mbql_query.columns.flat().includes(field.expr.args.expr.column)) { mbql_query.columns.push([field.expr.args.expr.column]); }
        }
      }
    });
  }

  /*************************************
   *          WHERE CLAUSE             *
   *************************************/

  // The where clause from the astified sql tree
  const where = ast.where;

  // This function is like parseForeignTable but accounts for differences in the like clause
  const parseLikeClauseForeignTable = (array, from, tablePath) => {
    let joinTable = {};
    for (let i = 1; i < from.length; i++) {
      // Find the correct foreign table reference in the join clause
      if (tablePath.table === from[i].table || tablePath.table === from[i].as)
        joinTable = from[i];
    }
    const tableName = {
      table: joinTable.table,
      alias: joinTable.as
    }
    /* Find the foreign key in the join clause (if the foreign table is on the right side of the clause,
      then the foreign key in the source table is on the left side of the clause) */
    if (joinTable.on.right.table === tableName.table || joinTable.on.right.table === tableName.alias) {
      array.push(['fk->', `${joinTable.on.left.column}`, `${tableName.table}.${tablePath.column}`]);
      if (!mbql_query.columns.flat().includes(`${joinTable.on.left.column}`)) { mbql_query.columns.push([`${joinTable.on.left.column}`]); }
    }
    else {
      array.push(['fk->', `${joinTable.on.right.column}`, `${tableName.table}.${tablePath.column}`]);
      if (!mbql_query.columns.flat().includes(`${joinTable.on.right.column}`)) { mbql_query.columns.push([`${joinTable.on.right.column}`]); }
    }
    mbql_query.foreign_columns.push([tableName.table, tablePath.column]);
    return array;
  }

  /** Calling function for the recursive traverseObject function
   *  @param obj - The object to iterate on
   *  @param array - The array to push the data (mbql-ized sql) to
   *  @param parent - The value's node parent (left or right) - Deprecated
  */
  const traverse = (obj, array, from, lastOperator) => {
    if ((typeof obj === 'object') && (obj !== null)) {
      traverseObject(obj, array, from, lastOperator)
    }
  }

  // TODO: this function is long and ugly, it could use some refactoring
  const traverseObject = (obj, array, from, lastOperator) => {
    // If the current object has a 'left' node then it is an operation, push the operator and traverse the left and right branches
    if (obj.hasOwnProperty('left')) {
      let loggedOperator;
      array.push([]);
      array = array[array.length-1]
      if (obj.operator === '<>')
        obj.operator = '!=';
      else if (obj.operator === 'IS NOT' && obj.right.value === null) {
        obj.operator = 'not-null';
      }
      else if (obj.operator === 'IS' && obj.right.value === null) {
        obj.operator = 'is-null';
      }
      else if (obj.operator === 'NOT') {
        loggedOperator = obj.operator;
      }
      else if (obj.operator === 'LIKE') {
        loggedOperator = obj.operator;
        startsWithRegex = /^\w+%/;
        endsWithRegex = /%\w+$/;
        containsRegex = /%\w+%/;
        if (startsWithRegex.test(obj.right.value)) { obj.operator = 'starts-with' }
        else if (endsWithRegex.test(obj.right.value)) { obj.operator = 'ends-with' }
        else if (containsRegex.test(obj.right.value) && lastOperator === 'NOT') { obj.operator = 'not-contains' }
        else if (containsRegex.test(obj.right.value)) { obj.operator = 'contains' }
      }
      lastOperator = loggedOperator;
      if (lastOperator !== 'NOT') { array.push(obj.operator); }

      traverse(obj.left, array, from, lastOperator);
      traverse(obj.right, array, from, lastOperator);
    }
    // If the current object has no 'left' node then it is a value, push the value
    else {
      if (obj.column && lastOperator !== 'LIKE') {
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
            if (!mbql_query.columns.flat().includes(joinTable.on.left.column)) { mbql_query.columns.push([`${joinTable.on.left.column}`]); }
          }
          else {
            array.push('fk->', `${joinTable.on.right.column}`, `${tableName.table}.${obj.column}`);
            if (!mbql_query.columns.flat().includes(joinTable.on.right.column)) { mbql_query.columns.push([`${joinTable.on.right.column}`]); }
          }
          mbql_query.foreign_columns.push([tableName.table, obj.column])
        }
        else {
          array.push(obj.column);
          if (!mbql_query.columns.flat().includes(obj.column)) { mbql_query.columns.push([obj.column]); }
        }
      }
      else if (lastOperator === 'LIKE') {
        if (obj.type === 'function' && obj.args.value[0].table === mbql_query.source_table[0]) {
          array.push(obj.args.value[0].column);
          array.push({['case-sensitive']: false});
          if (!mbql_query.columns.flat().includes(obj.args.value[0].column)) { mbql_query.columns.push([obj.args.value[0].column]); }
        }
        else if (obj.type === 'column_ref' && obj.table === mbql_query.source_table[0]) {
          array.push(obj.column);
          if (!mbql_query.columns.flat().includes(obj.column)) { mbql_query.columns.push([obj.column]); }
        }
        else if (obj.type === 'string' && obj.table === mbql_query.source_table[0]) {
          const likeClauseValue = array[array.length-1];
          if (typeof likeClauseValue === 'object') {
            array[array.length-1] = obj.value
            array.push(likeClauseValue);
          }
          else {
            array.push(obj.value);
            array.push({['case-sensitive']: true});
          }
        }

        else if (obj.type === 'function' && obj.args.value[0].table !== mbql_query.source_table[0]) {
          array.push([]);
          array = array[array.length-1];
          array = parseLikeClauseForeignTable(array, from, obj.args.value[0]);
          array.push({['case-sensitive']: false});
          if (!mbql_query.columns.flat().includes(obj.args.value[0].column)) { mbql_query.columns.push([obj.args.value[0].column]); }
        }

        else if (obj.type === 'column_ref' && obj.table !== mbql_query.source_table[0]) {
          array.push([]);
          array = array[array.length-1];
          array = parseLikeClauseForeignTable(array, from, obj);
          array.push({['case-sensitive']: true});
          if (!mbql_query.columns.flat().includes(obj.column)) { mbql_query.columns.push([obj.column]); }
        }

        else if (obj.type === 'string' && obj.table !== mbql_query.source_table[0]) {

          const likeClauseValue = array[array.length-1];
          if (typeof likeClauseValue === 'object') {
            array[array.length-1] = obj.value
            array.push(likeClauseValue);
          }
          else {
            array.push(obj.value);
            array.push({['case-sensitive']: true});
          }
        }
      }
      else if (obj.value !== null)
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

  const groupBy = ast.groupby;
  const orderBy = ast.orderby;
  if (groupBy) {
    groupBy.forEach(groupField => {
      if (groupField.type === 'column_ref') {
        if (groupField.table !== mbql_query.source_table[0]) {
          parseForeignTable('breakout', from, groupField);
        }
        else {
          mbql_query.breakout.push(groupField.column)
          if (!mbql_query.columns.flat().includes(groupField.column)) { mbql_query.columns.push([groupField.column]); }
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
            if (!mbql_query.columns.flat().includes(joinTable.on.left.column)) { mbql_query.columns.push([`${joinTable.on.left.column}`]); }
          }
          else {
            mbql_query['order-by'].push([orderedField.type, ['fk->', `${joinTable.on.right.column}`, `${tableName.table}.${orderedField.expr.column}`]]);
            if (!mbql_query.columns.flat().includes(joinTable.on.right.column)){ mbql_query.columns.push([`${joinTable.on.right.column}`]); }
          }
          mbql_query.foreign_columns.push([`${tableName.table}`, orderedField.expr.column])
        }
        else {
          mbql_query['order-by'].push([orderedField.type, orderedField.expr.column])
          if (!mbql_query.columns.flat().includes(orderedField.expr.column)) { mbql_query.columns.push([orderedField.expr.column]); }
        }
      }
    })
  }

  return mbql_query;
}

module.exports = sql_to_mbql;
