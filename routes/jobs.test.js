"use strict";

const request = require("supertest");

const app = require("../app");
const db = require("../db");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  u2Token
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

// function that gets id for job given title
async function getId(title) {
  const result = await
    db.query("SELECT id FROM jobs WHERE title = $1", [title]);
  return result.rows[0].id;
}

/************************************** POST /jobs */

describe("POST /jobs", function () {
  const newJob = {
    title: "new",
    salary: 60000,
    equity: 0.45,
    companyHandle: 'c1'
  };

  test("ok for admins", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send(newJob)
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      job: { ...newJob, id: expect.any(Number), equity: "0.45" }
    });
  });

  test("unauth for non-admins", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send(newJob)
        .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for anon", async function () {
    const resp = await request(app).post("/jobs").send(newJob);
    expect(resp.statusCode).toEqual(401);
  });

  test("bad request with missing data", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send({
          salary: 60000,
          equity: 0.45,
          companyHandle: 'c1'
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request with invalid data", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send({
          ...newJob,
          companyHandle: 'none'
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** GET /jobs */

describe("GET /jobs", function () {
  test("ok for anon", async function () {
    const resp = await request(app).get("/jobs");
    expect(resp.body).toEqual({
      jobs:
      [
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
      ]
    });
  });

  test("filters work", async function () {
    const params = {
      titleLike: "j",
      minSalary: "75000",
      hasEquity: "true"
    };
    const resp = await request(app).get("/jobs").query(params); // Adapted from https://stackoverflow.com/questions/40309713/how-to-send-query-string-parameters-using-supertest
    expect(resp.body).toEqual({
      jobs:
        [
          {
            id: expect.any(Number),
            title: "j2",
            salary: 85000,
            equity: "0.55",
            companyHandle: "c1"
          }
        ]
    });
  });

  test("get 400 if send bad filter", async function () {
    const params = {
      titleLike: "j",
      minSalary: "75000",
      hasEquity: "true",
      badFilter: "Bad Filter"
    };
    const resp = await request(app).get("/jobs").query(params);
    expect(resp.status).toEqual(400);
  });
});

/************************************** GET /jobs/:handle */

describe("GET /jobs/:id", function () {
  test("works for anon", async function () {
    const id = await getId("j1");
    const resp = await request(app).get(`/jobs/${id}`);
    expect(resp.body).toEqual({
      job: {
        id,
        title: "j1",
        salary: 70000,
        equity: "0.65",
        companyHandle: "c1"
      }
    });
  });

  test("not found for no such job", async function () {
    const resp = await request(app).get(`/jobs/0`);
    expect(resp.statusCode).toEqual(404);
  });
});

/************************************** PATCH /jobs/:id */

describe("PATCH /jobs/:id", function () {
  test("works for admins", async function () {
    const id = await getId("j1");
    const resp = await request(app)
        .patch(`/jobs/${id}`)
        .send({
          title: "J1-new"
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({
      job: {
        id,
        title: "J1-new",
        salary: 70000,
        equity: "0.65",
        companyHandle: "c1"
      }
    });
  });

  test("unauth for non-admins", async function () {
    const id = await getId("j1");
    const resp = await request(app)
        .patch(`/jobs/${id}`)
        .send({
          title: "J1-new"
        })
        .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for anon", async function () {
    const id = await getId("j1");
    const resp = await request(app)
        .patch(`/jobs/${id}`)
        .send({
          title: "J1-new"
        });
    expect(resp.statusCode).toEqual(401);
  });

  test("not found on no such job", async function () {
    const resp = await request(app)
        .patch(`/jobs/0`)
        .send({
          title: "J1-new"
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(404);
  });

  test("bad request on id change attempt", async function () {
    const id = await getId("j1"); 
    const resp = await request(app)
        .patch(`/jobs/${id}`)
        .send({
          id: 100
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request on companyHandle change attempt", async function () {
    const id = await getId("j1"); 
    const resp = await request(app)
        .patch(`/jobs/${id}`)
        .send({
          companyHandle: "c2"
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request on invalid data", async function () {
    const id = await getId("j1");
    const resp = await request(app)
        .patch(`/jobs/${id}`)
        .send({
          title: 22
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** DELETE /jobs/:id */

describe("DELETE /jobs/:id", function () {
  test("works for admins", async function () {
    const id = await getId("j1");
    const resp = await request(app)
        .delete(`/jobs/${id}`)
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({ deleted: `${id}` });
  });

  test("unauth for non-admins", async function () {
    const id = await getId("j1");
    const resp = await request(app)
        .delete(`/jobs/${id}`)
        .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for anon", async function () {
    const id = await getId("j1");
    const resp = await request(app)
        .delete(`/jobs/${id}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("not found for no such job", async function () {
    const resp = await request(app)
        .delete(`/jobs/0`)
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(404);
  });
});
