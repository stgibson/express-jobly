"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Job = require("./job.js");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */

describe("create", function () {
  let newJob = {
    title: "new",
    salary: 60000,
    equity: "0.45",
    companyHandle: 'c1'
  };

  test("works", async function () {
    let job = await Job.create(newJob);
    expect(job).toEqual({ ...newJob, id: expect.any(Number) });

    const result = await db.query(
          `SELECT title, salary, equity, company_handle AS "companyHandle"
           FROM jobs
           WHERE title = 'new'`);
    expect(result.rows).toEqual([
      {
        title: "new",
        salary: 60000,
        equity: "0.45",
        companyHandle: 'c1'
      }
    ]);
  });

  test("bad request with invalid companyHandle", async function () {
    try {
      newJob = { ...newJob, companyHandle: 'c' };
      await Job.create(newJob);
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** findAll */

describe("findAll", function () {
  test("works", async function () {
    const jobs = await Job.findAll();
    expect(jobs).toEqual([
      {
        id: expect.any(Number),
        title: 'j1',
        salary: 70000,
        equity: "0.65",
        companyHandle: 'c1'
      },
      {
        id: expect.any(Number),
        title: 'j2',
        salary: 85000,
        equity: "0.55",
        companyHandle: 'c1'
      }
    ]);
  });

  // test("filters by nameLike", async function () {
  //   const nameLike = "c1";
  //   const filters = { nameLike };
  //   const companies = await Company.findAll(filters);
  //   expect(companies).toEqual([
  //     {
  //       handle: "c1",
  //       name: "C1",
  //       description: "Desc1",
  //       numEmployees: 1,
  //       logoUrl: "http://c1.img"
  //     }
  //   ]);
  // });

  // test("filters by min employees", async function () {
  //   const minEmployees = 2;
  //   const filters = { minEmployees };
  //   const companies = await Company.findAll(filters);
  //   expect(companies).toEqual([
  //     {
  //       handle: "c2",
  //       name: "C2",
  //       description: "Desc2",
  //       numEmployees: 2,
  //       logoUrl: "http://c2.img",
  //     },
  //     {
  //       handle: "c3",
  //       name: "C3",
  //       description: "Desc3",
  //       numEmployees: 3,
  //       logoUrl: "http://c3.img",
  //     }
  //   ]);
  // });

  // test("filters by max employees", async function () {
  //   const maxEmployees = 2;
  //   const filters = { maxEmployees };
  //   const companies = await Company.findAll(filters);
  //   expect(companies).toEqual([
  //     {
  //       handle: "c1",
  //       name: "C1",
  //       description: "Desc1",
  //       numEmployees: 1,
  //       logoUrl: "http://c1.img",
  //     },
  //     {
  //       handle: "c2",
  //       name: "C2",
  //       description: "Desc2",
  //       numEmployees: 2,
  //       logoUrl: "http://c2.img",
  //     }
  //   ]);
  // });

  // test("handles all filters at once", async function () {
  //   const nameLike = "c";
  //   const minEmployees = 2
  //   const maxEmployees = 2;
  //   const filters = { nameLike, minEmployees, maxEmployees };
  //   const companies = await Company.findAll(filters);
  //   expect(companies).toEqual([
  //     {
  //       handle: "c2",
  //       name: "C2",
  //       description: "Desc2",
  //       numEmployees: 2,
  //       logoUrl: "http://c2.img",
  //     }
  //   ]);
  // });

  // test("throws error if minEmployees > maxEmployees", async function () {
  //   try {
  //     const minEmployees = 3
  //     const maxEmployees = 2;
  //     const filters = { minEmployees, maxEmployees };
  //     await Company.findAll(filters);
  //   }
  //   catch (err) {
  //     expect(err instanceof BadRequestError).toBeTruthy();
  //   }
  // });

  // test("throws error if additional filters", async function () {
  //   try {
  //     const nameLike = "c";
  //     const minEmployees = 2;
  //     const maxEmployees = 2;
  //     const badFilter = "Bad Filter";
  //     const filters = { nameLike, minEmployees, maxEmployees, badFilter };
  //     await Company.findAll(filters);
  //   }
  //   catch (err) {
  //     expect(err instanceof BadRequestError).toBeTruthy();
  //   }
  // });
});

/************************************** get */

describe("get", function () {
  test("works", async function () {
    // first get id of first job
    const result = await db.query(`SELECT id FROM jobs WHERE title = 'j1'`);
    const { id } = result.rows[0];

    const job = await Job.get(id);
    expect(job).toEqual({
      id,
      title: 'j1',
      salary: 70000,
      equity: "0.65",
      companyHandle: 'c1'
    });
  });

  test("not found if no such job", async function () {
    try {
      await Job.get(0);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

/************************************** update */

describe("update", function () {
  const updateData = {
    title: "new",
    salary: 60000,
    equity: 0.45
  };

  test("works", async function () {
    // first get id of first job
    const resultId = await db.query(`SELECT id FROM jobs WHERE title = 'j1'`);
    const { id } = resultId.rows[0];

    const job = await Job.update(id, updateData);
    expect(job).toEqual({
      id,
      ...updateData,
      equity: "0.45",
      companyHandle: 'c1'
    });

    const result = await db.query(
          `SELECT title, salary, equity, company_handle AS "companyHandle"
           FROM jobs
           WHERE id = $1`,
        [id]);
    expect(result.rows).toEqual([{
      title: 'new',
      salary: 60000,
      equity: "0.45",
      companyHandle: 'c1'
    }]);
  });

  test("works: null fields", async function () {
    // first get id of first job
    const resultId = await db.query(`SELECT id FROM jobs WHERE title = 'j1'`);
    const { id } = resultId.rows[0];

    const updateDataSetNulls = {
      title: 'j1',
      salary: null,
      equity: null
    };

    const job = await Job.update(id, updateDataSetNulls);
    expect(job).toEqual({
      id,
      ...updateDataSetNulls,
      companyHandle: 'c1'
    });

    const result = await db.query(
          `SELECT title, salary, equity, company_handle AS "companyHandle"
           FROM jobs
           WHERE id = $1`,
        [id]);
    expect(result.rows).toEqual([{
      title: 'j1',
      salary: null,
      equity: null,
      companyHandle: 'c1'
    }]);
  });

  test("not found if no such job", async function () {
    try {
      await Job.update(0, updateData);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("bad request with no data", async function () {
    // first get id of first job
    const resultId = await db.query(`SELECT id FROM jobs WHERE title = 'j1'`);
    const { id } = resultId.rows[0];
    try {
      await Job.update(id, {});
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** remove */

describe("remove", function () {
  test("works", async function () {
    // first get id of first job
    const result = await db.query(`SELECT id FROM jobs WHERE title = 'j1'`);
    const { id } = result.rows[0];

    await Job.remove(id);
    const res = await db.query(
        "SELECT id FROM jobs WHERE id=$1",
      [id]);
    expect(res.rows.length).toEqual(0);
  });

  test("not found if no such job", async function () {
    try {
      await Job.remove(0);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});
