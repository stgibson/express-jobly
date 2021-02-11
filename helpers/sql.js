const { BadRequestError } = require("../expressError");

/*
 * Generates SQL code to make an update
 *
 * dataToUpdate is an object of columns and values to update
 * jsToSql is a mapping of JavaScript variable names to its corresponding SQL
 * variable names
 *
 * Returns SQL code for setting columns, and a list of values to set the
 * columns to
 */

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map((colName, idx) =>
      `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );

  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

module.exports = { sqlForPartialUpdate };
