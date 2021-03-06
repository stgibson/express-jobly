"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate, generateCompanyFiltersSql } =
  require("../helpers/sql");

/** Related functions for companies. */

class Company {
  /** Create a company (from data), update db, return new company data.
   *
   * data should be { handle, name, description, numEmployees, logoUrl }
   *
   * Returns { handle, name, description, numEmployees, logoUrl }
   *
   * Throws BadRequestError if company already in database.
   * */

  static async create({ handle, name, description, numEmployees, logoUrl }) {
    const duplicateCheck = await db.query(
          `SELECT handle
           FROM companies
           WHERE handle = $1`,
        [handle]);

    if (duplicateCheck.rows[0])
      throw new BadRequestError(`Duplicate company: ${handle}`);

    const result = await db.query(
          `INSERT INTO companies
           (handle, name, description, num_employees, logo_url)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING handle, name, description, num_employees AS "numEmployees", logo_url AS "logoUrl"`,
        [
          handle,
          name,
          description,
          numEmployees,
          logoUrl,
        ],
    );
    const company = result.rows[0];

    return company;
  }

  /** Find all companies.
   *
   * Can filter on provided search filters:
   * - minEmployees
   * - maxEmployees
   * - nameLike (will find case-insensitive, partial matches)
   * 
   * Returns [{ handle, name, description, numEmployees, logoUrl }, ...]
   * */

  static async findAll(filters) {
    if (!filters || !Object.keys(filters).length) { // Adapted from https://stackoverflow.com/questions/5223/length-of-a-javascript-object
      const companiesRes = await db.query(
        `SELECT handle,
                name,
                description,
                num_employees AS "numEmployees",
                logo_url AS "logoUrl"
         FROM companies
         ORDER BY name`);
      return companiesRes.rows;
    }
    let { nameLike, minEmployees, maxEmployees, ...badFilters } = filters;
    // convert minEmployees and maxEmployees to ints
    if (minEmployees) {
      minEmployees = Number.parseInt(minEmployees); // Adapted from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/parseInt
    }
    if (maxEmployees) {
      maxEmployees = Number.parseInt(maxEmployees);
    }
    if (Number.isNaN(minEmployees) || Number.isNaN(maxEmployees)) { // Adapted from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/parseInt
      throw new
        BadRequestError("minEmployees and maxEmployees must both be integers");
    }
    // validate request
    if (minEmployees && maxEmployees && minEmployees > maxEmployees) {
      throw new
        BadRequestError("minEmployees cannot be greater than maxEmployees");
    }
    if (Object.keys(badFilters).length) {
      throw new BadRequestError(
        "Can only pass nameLike, minEmployees, and maxEmployees as filters"
      );
    }
    // create SQL filtering only for filters passed
    const { filtersSql, values } =
      generateCompanyFiltersSql({ nameLike, minEmployees, maxEmployees });
    const companiesRes = await db.query(
      `SELECT handle,
              name,
              description,
              num_employees AS "numEmployees",
              logo_url AS "logoUrl"
       FROM companies ${filtersSql}
       ORDER BY name`,
      values
    );
    return companiesRes.rows;
  }

  /** Given a company handle, return data about company.
   *
   * Returns { handle, name, description, numEmployees, logoUrl, jobs }
   *   where jobs is [{ id, title, salary, equity, companyHandle }, ...]
   *
   * Throws NotFoundError if not found.
   **/

  static async get(handle) {
    const companyRes = await db.query(
          `SELECT handle,
                  name,
                  description,
                  num_employees AS "numEmployees",
                  logo_url AS "logoUrl",
                  id,
                  title,
                  salary,
                  equity,
                  company_handle AS "companyHandle"
           FROM companies c LEFT JOIN jobs j ON c.handle = j.company_handle
           WHERE handle = $1`,
        [handle]);

    if (!companyRes.rows.length) {
      throw new NotFoundError(`No company: ${handle}`);
    }

    const {
      name,
      description,
      numEmployees,
      logoUrl
    } = companyRes.rows[0];
    const company = { handle, name, description, numEmployees, logoUrl };

    // get info on each job at company
    const jobs = [];
    for (let companyJob of companyRes.rows) {
      const { id, title, salary, equity, companyHandle } = companyJob;
      // if no jobs, the first row will have job fields as null
      if (id) {
        const job = { id, title, salary, equity, companyHandle };
        jobs.push(job);
      }
    }
    company.jobs = jobs;

    return company;
  }

  /** Update company data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {name, description, numEmployees, logoUrl}
   *
   * Returns {handle, name, description, numEmployees, logoUrl}
   *
   * Throws NotFoundError if not found.
   */

  static async update(handle, data) {
    const { setCols, values } = sqlForPartialUpdate(
        data,
        {
          numEmployees: "num_employees",
          logoUrl: "logo_url",
        });
    const handleVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE companies 
                      SET ${setCols} 
                      WHERE handle = ${handleVarIdx} 
                      RETURNING handle, 
                                name, 
                                description, 
                                num_employees AS "numEmployees", 
                                logo_url AS "logoUrl"`;
    const result = await db.query(querySql, [...values, handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);

    return company;
  }

  /** Delete given company from database; returns undefined.
   *
   * Throws NotFoundError if company not found.
   **/

  static async remove(handle) {
    const result = await db.query(
          `DELETE
           FROM companies
           WHERE handle = $1
           RETURNING handle`,
        [handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);
  }
}


module.exports = Company;
