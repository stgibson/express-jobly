const request = require("supertest");
const { sqlForPartialUpdate } = require("./sql");
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