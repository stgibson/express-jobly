const request = require("supertest");
const { sqlForPartialUpdate, generateCompanyFiltersSql, generateJobFiltersSql }
  = require("./sql");
const { BadRequestError } = require("../expressError");

describe("sqlForPartialUpdate", function () {
  test("gets correct SQL code and values with valid input", () => {
    const data = {
      username: "test",
      firstName: "Test",
      isAdmin: true
    };
    const { setCols, values } = sqlForPartialUpdate(
      data,
      {
        firstName: "first_name",
        lastName: "last_name",
        isAdmin: "is_admin"
      });
  
    expect(setCols).toEqual('"username"=$1, "first_name"=$2, "is_admin"=$3');
    expect(values).toEqual(["test", "Test", true]);
  });

  test("throws error if no data", function () {
    try {
      sqlForPartialUpdate({}, {
        firstName: "first_name",
        lastName: "last_name",
        isAdmin: "is_admin"
      });
    }
    catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

describe("generateCompanyFiltersSql", function () {
  test("gets correct SQL code when filtering by nameLike", () => {
    const nameLike = "name";
    const { filtersSql, values } = generateCompanyFiltersSql({ nameLike });
    expect(filtersSql).toEqual("WHERE name ILIKE $1");
    expect(values).toEqual(["%name%"]);
  });

  test("gets correct SQL code when filtering by minEmployees", () => {
    const minEmployees = 2;
    const { filtersSql, values } = generateCompanyFiltersSql({ minEmployees });
    expect(filtersSql).toEqual("WHERE num_employees >= $1");
    expect(values).toEqual([2]);
  });

  test("gets correct SQL code when filtering by maxEmployees", () => {
    const maxEmployees = 2;
    const { filtersSql, values } = generateCompanyFiltersSql({ maxEmployees });
    expect(filtersSql).toEqual("WHERE num_employees <= $1");
    expect(values).toEqual([2]);
  });

  test("gets correct SQL code using all filters", () => {
    const nameLike = "name";
    const minEmployees = 2;
    const maxEmployees = 3;
    const { filtersSql, values } =
      generateCompanyFiltersSql({ nameLike, minEmployees, maxEmployees });
    expect(filtersSql).toEqual(
      "WHERE name ILIKE $1 AND num_employees >= $2 AND num_employees <= $3"
    );
    expect(values).toEqual(["%name%", 2, 3]);
  });

  test("gets empty string if no parameters", function () {
    const { filtersSql, values } = generateCompanyFiltersSql({});
    expect(filtersSql).toEqual("");
    expect(values).toEqual([]);
  });
});

describe("generateJobFiltersSql", function () {
  test("gets correct SQL code when filtering by titleLike", () => {
    const titleLike = "title";
    const { filtersSql, values } = generateJobFiltersSql({ titleLike });
    expect(filtersSql).toEqual("WHERE title ILIKE $1");
    expect(values).toEqual(["%title%"]);
  });

  test("gets correct SQL code when filtering by minSalary", () => {
    const minSalary = 60000;
    const { filtersSql, values } = generateJobFiltersSql({ minSalary });
    expect(filtersSql).toEqual("WHERE salary >= $1");
    expect(values).toEqual([60000]);
  });

  test("gets correct SQL code when filtering by hasEquity", () => {
    const hasEquity = true;
    const { filtersSql, values } = generateJobFiltersSql({ hasEquity });
    expect(filtersSql).toEqual("WHERE equity IS NOT NULL");
    expect(values).toEqual([]);
  });

  test("gets correct SQL code using all filters", () => {
    const titleLike = "title";
    const minSalary = 60000;
    const hasEquity = true;
    const { filtersSql, values } =
      generateJobFiltersSql({ titleLike, minSalary, hasEquity });
    expect(filtersSql).toEqual(
      "WHERE title ILIKE $1 AND salary >= $2 AND equity IS NOT NULL"
    );
    expect(values).toEqual(["%title%", 60000]);
  });

  test("gets empty string if no parameters", function () {
    const { filtersSql, values } = generateJobFiltersSql({});
    expect(filtersSql).toEqual("");
    expect(values).toEqual([]);
  });
});