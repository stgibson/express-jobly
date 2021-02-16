const request = require("supertest");
const { sqlForPartialUpdate, generateFiltersSql } = require("./sql");
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

describe("generateFiltersSql", function () {
  test("gets correct SQL code when filtering by nameLike", () => {
    const nameLike = "name";
    const { filtersSql, values } = generateFiltersSql({ nameLike });
    expect(filtersSql).toEqual("WHERE name ILIKE $1");
    expect(values).toEqual(["%name%"]);
  });

  test("gets correct SQL code when filtering by minEmployees", () => {
    const minEmployees = 2;
    const { filtersSql, values } = generateFiltersSql({ minEmployees });
    expect(filtersSql).toEqual("WHERE num_employees >= $1");
    expect(values).toEqual([2]);
  });

  test("gets correct SQL code when filtering by maxEmployees", () => {
    const maxEmployees = 2;
    const { filtersSql, values } = generateFiltersSql({ maxEmployees });
    expect(filtersSql).toEqual("WHERE num_employees <= $1");
    expect(values).toEqual([2]);
  });

  test("gets correct SQL code using all filters", () => {
    const nameLike = "name";
    const minEmployees = 2;
    const maxEmployees = 3;
    const { filtersSql, values } =
      generateFiltersSql({ nameLike, minEmployees, maxEmployees });
    expect(filtersSql).toEqual(
      "WHERE name ILIKE $1 AND num_employees >= $2 AND num_employees <= $3"
    );
    expect(values).toEqual(["%name%", 2, 3]);
  });

  test("gets empty string if no parameters", function () {
    const { filtersSql, values } = generateFiltersSql({});
    expect(filtersSql).toEqual("");
    expect(values).toEqual([]);
  });
});