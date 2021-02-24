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

/**
 * Generates SQL code for filtering companies
 * 
 * Can filter by nameLike, minEmployees, and maxEmployees
 * 
 * Returns SQL code
 */
function generateCompanyFiltersSql({ nameLike, minEmployees, maxEmployees }) {
  let filtersSql = "";
  const values = [];
  if (nameLike) {
    filtersSql += "WHERE name ILIKE $1"; // Learned how to use % as wildcard at https://www.w3schools.com/sql/sql_like.asp
    values.push(`%${nameLike}%`);
  }
  if (minEmployees) {
    // if previous filters weren't passed in, start request with this filter
    if (!filtersSql) {
      filtersSql += "WHERE num_employees >= $1";
    }
    // otherwise, add on filter
    else {
      filtersSql += " AND num_employees >= $2";
    }
    values.push(minEmployees);
  }
  if (maxEmployees) {
    // since variable could be $1, $2, or $3, determine by length of values
    const numVar = values.length + 1
    if (!filtersSql) {
      filtersSql += `WHERE num_employees <= $${numVar}`;
    }
    else {
      filtersSql += ` AND num_employees <= $${numVar}`;
    }
    values.push(maxEmployees);
  }
  return { filtersSql, values };
}

/**
 * Generates SQL code for filtering jobs
 * 
 * Can filter by titleLike, minSalary, and hasEquity
 * 
 * Returns SQL code
 */
function generateJobFiltersSql({ titleLike, minSalary, hasEquity }) {
  let filtersSql = "";
  const values = [];
  if (titleLike) {
    filtersSql += "WHERE title ILIKE $1"; // Learned how to use % as wildcard at https://www.w3schools.com/sql/sql_like.asp
    values.push(`%${titleLike}%`);
  }
  if (minSalary) {
    // if previous filters weren't passed in, start request with this filter
    if (!filtersSql) {
      filtersSql += "WHERE salary >= $1";
    }
    // otherwise, add on filter
    else {
      filtersSql += " AND salary >= $2";
    }
    values.push(minSalary);
  }
  if (hasEquity) {
    // since variable could be $1, $2, or $3, determine by length of values
    const numVar = values.length + 1
    if (!filtersSql) {
      filtersSql += `WHERE equity IS NOT NULL`; // Learned how to use IS NOT NULL at https://www.w3schools.com/sql/sql_null_values.asp
    }
    else {
      filtersSql += ` AND equity IS NOT NULL`;
    }
  }
  return { filtersSql, values };
}

module.exports =
  { sqlForPartialUpdate, generateCompanyFiltersSql, generateJobFiltersSql };
