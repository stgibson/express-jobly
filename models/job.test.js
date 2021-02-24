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
    equity: 0.45,
    companyHandle: "c1"
  };

  test("works", async function () {
    let job = await Job.create(newJob);
    expect(job).toEqual({ ...newJob, id: expect.any(Number), equity: "0.45" });

    const result = await db.query(
          `SELECT title, salary, equity, company_handle AS "companyHandle"
           FROM jobs
           WHERE title = 'new'`);
    expect(result.rows).toEqual([
      {
        title: "new",
        salary: 60000,
        equity: "0.45",
        companyHandle: "c1"
      }
    ]);
  });

  test("bad request with invalid companyHandle", async function () {
    try {
      newJob = { ...newJob, companyHandle: "c" };
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
        title: "j1",
        salary: 70000,
        equity: "0.65",
        companyHandle: "c1"
      },
      {
        id: expect.any(Number),
        title: "j2",
        salary: 85000,
        equity: "0.55",
        companyHandle: "c1"
      },
      {
        id: expect.any(Number),
        title: "j3",
        salary: 75000,
        equity: null,
        companyHandle: "c1"
      }
    ]);
  });

  test("filters by titleLike", async function () {
    const titleLike = "j1";
    const filters = { titleLike };
    const jobs = await Job.findAll(filters);
    expect(jobs).toEqual([
      {
        id: expect.any(Number),
        title: "j1",
        salary: 70000,
        equity: "0.65",
        companyHandle: "c1"
      }
    ]);
  });

  test("filters by minSalary", async function () {
    const minSalary = "75000";
    const filters = { minSalary };
    const jobs = await Job.findAll(filters);
    expect(jobs).toEqual([
      {
        id: expect.any(Number),
        title: "j2",
        salary: 85000,
        equity: "0.55",
        companyHandle: "c1"
      },
      {
        id: expect.any(Number),
        title: "j3",
        salary: 75000,
        equity: null,
        companyHandle: "c1"
      }
    ]);
  });

  test("filters by hasEquity", async function () {
    const hasEquity = "true";
    const filters = { hasEquity };
    const jobs = await Job.findAll(filters);
    expect(jobs).toEqual([
      {
        id: expect.any(Number),
        title: "j1",
        salary: 70000,
        equity: "0.65",
        companyHandle: "c1"
      },
      {
        id: expect.any(Number),
        title: "j2",
        salary: 85000,
        equity: "0.55",
        companyHandle: "c1"
      }
    ]);
  });

  test("handles all filters at once", async function () {
    const titleLike = "j";
    const minSalary = "75000";
    const hasEquity = "true";
    const filters = { titleLike, minSalary, hasEquity };
    const jobs = await Job.findAll(filters);
    expect(jobs).toEqual([
      {
        id: expect.any(Number),
        title: "j2",
        salary: 85000,
        equity: "0.55",
        companyHandle: "c1"
      }
    ]);
  });

  test("lists all jobs if hasEquity is false", async function () {
    const hasEquity = "false";
    const filters = { hasEquity };
    const jobs = await Job.findAll(filters);
    expect(jobs).toEqual([
      {
        id: expect.any(Number),
        title: "j1",
        salary: 70000,
        equity: "0.65",
        companyHandle: "c1"
      },
      {
        id: expect.any(Number),
        title: "j2",
        salary: 85000,
        equity: "0.55",
        companyHandle: "c1"
      },
      {
        id: expect.any(Number),
        title: "j3",
        salary: 75000,
        equity: null,
        companyHandle: "c1"
      }
    ]);
  });

  test("throws error if minSalary isnt integer", async function () {
    try {
      const minSalary = "thousands";
      const filters = { minSalary };
      await Job.findAll(filters);
      fail();
    }
    catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });

  test("throws error if hasEquity isnt true or false", async function () {
    try {
      const hasEquity = "yes";
      const filters = { hasEquity };
      await Job.findAll(filters);
      fail();
    }
    catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });

  test("throws error if additional filters", async function () {
    try {
      const titleLike = "c";
      const minSalary = "75000";
      const hasEquity = "true";
      const badFilter = "Bad Filter";
      const filters = { titleLike, minSalary, hasEquity, badFilter };
      await Job.findAll(filters);
      fail();
    }
    catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
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
      title: "j1",
      salary: 70000,
      equity: "0.65",
      companyHandle: "c1"
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
      companyHandle: "c1"
    });

    const result = await db.query(
          `SELECT title, salary, equity, company_handle AS "companyHandle"
           FROM jobs
           WHERE id = $1`,
        [id]);
    expect(result.rows).toEqual([{
      title: "new",
      salary: 60000,
      equity: "0.45",
      companyHandle: "c1"
    }]);
  });

  test("works: null fields", async function () {
    // first get id of first job
    const resultId = await db.query(`SELECT id FROM jobs WHERE title = 'j1'`);
    const { id } = resultId.rows[0];

    const updateDataSetNulls = {
      title: "j1",
      salary: null,
      equity: null
    };

    const job = await Job.update(id, updateDataSetNulls);
    expect(job).toEqual({
      id,
      ...updateDataSetNulls,
      companyHandle: "c1"
    });

    const result = await db.query(
          `SELECT title, salary, equity, company_handle AS "companyHandle"
           FROM jobs
           WHERE id = $1`,
        [id]);
    expect(result.rows).toEqual([{
      title: "j1",
      salary: null,
      equity: null,
      companyHandle: "c1"
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
