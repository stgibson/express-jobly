"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate, generateJobFiltersSql } = require("../helpers/sql");

/** Related functions for jobs. */

class Job {
  /** Create a job (from data), update db, return new job data.
   *
   * data should be { title, salary, equity, companyHandle }
   *
   * Returns { id, title, salary, equity, companyHandle }
   *
   * Throws BadRequestError if company_handle doesn't match any company
   * */

  static async create({ title, salary, equity, companyHandle }) {
    const companyExistsCheck = await db.query(
          `SELECT handle
           FROM companies
           WHERE handle = $1`,
        [companyHandle]);

    if (!companyExistsCheck.rows[0])
      throw new BadRequestError(`Company does not exist: ${companyHandle}`);

    const result = await db.query(
          `INSERT INTO jobs
           (title, salary, equity, company_handle)
           VALUES ($1, $2, $3, $4)
           RETURNING id,
                     title,
                     salary,
                     equity,
                     company_handle AS "companyHandle"`,
        [title, salary, equity, companyHandle],
    );
    const job = result.rows[0];

    return job;
  }

  /** Find all jobs.
   *
   * Can filter on provided search filters:
   * - title (will find case-insensitive, partial matches)
   * - minSalary
   * - hasEquity
   * 
   * Returns [{ id, title, salary, equity, companyHandle }, ...]
   * */

  static async findAll(filters) {
    if (!filters || !Object.keys(filters).length) { // Adapted from https://stackoverflow.com/questions/5223/length-of-a-javascript-object
      const jobsRes = await db.query(
        `SELECT id, title, salary, equity, company_handle AS "companyHandle"
         FROM jobs
         ORDER BY title`);
      return jobsRes.rows;
    }
    let { titleLike, minSalary, hasEquity, ...badFilters } = filters;
    // convert minSalary to in and hasEquity to bool
    if (minSalary) {
      minSalary = Number.parseInt(minSalary);
    }
    if (hasEquity === "true") {
      hasEquity = true;
    }
    if (hasEquity === "false") {
      hasEquity = false;
    }
    if (Number.isNaN(minSalary)) {
      throw new BadRequestError("minSalary must be an integer");
    }
    if (hasEquity !== undefined && hasEquity !== true && hasEquity !== false) {
      throw new BadRequestError("hasEquity must be either true or false");
    }
    // validate request
    if (Object.keys(badFilters).length) {
      throw new BadRequestError(
        "Can only pass titleLike, minSalary, and hasEquity as filters"
      );
    }
    // create SQL filtering only for filters passed
    const { filtersSql, values } =
      generateJobFiltersSql({ titleLike, minSalary, hasEquity });
    const jobsRes = await db.query(
      `SELECT id, title, salary, equity, company_handle AS "companyHandle"
       FROM jobs ${filtersSql}
       ORDER BY title`,
      values
    );
    return jobsRes.rows;
  }

  /** Given an, return data about company.
   *
   * Returns { id, title, salary, equity, companyHandle }
   *
   * Throws NotFoundError if not found.
   **/

  static async get(id) {
    const jobRes = await db.query(
          `SELECT id, title, salary, equity, company_handle AS "companyHandle"
           FROM jobs
           WHERE id = $1`,
        [id]);

    const job = jobRes.rows[0];

    if (!job) throw new NotFoundError(`No job with id: ${id}`);

    return job;
  }

  /** Update job data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: { title, salary, equity }
   *
   * Returns { id, title, salary, equity, companyHandle }
   *
   * Throws NotFoundError if not found.
   */

  static async update(id, data) {
    const { setCols, values } = sqlForPartialUpdate(data, {});
    const idVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE jobs 
                      SET ${setCols} 
                      WHERE id = ${idVarIdx} 
                      RETURNING id,
                                title,
                                salary,
                                equity,
                                company_handle AS "companyHandle"`;
    const result = await db.query(querySql, [...values, id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job with id: ${id}`);

    return job;
  }

  /** Delete given job from database; returns undefined.
   *
   * Throws NotFoundError if company not found.
   **/

  static async remove(id) {
    const result = await db.query(
          `DELETE
           FROM jobs
           WHERE id = $1
           RETURNING id`,
        [id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job with id: ${id}`);
  }
}


module.exports = Job;
