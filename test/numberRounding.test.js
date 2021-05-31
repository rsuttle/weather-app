import testables from "../src/components/Map"

const {round} = testables;

const testNumber1 = 45.24565;
const testNumber2 = 17.8294349;

test("Test if numbers are rounded properly.", () => {
    expect(round(testNumber1,2)).toBeCloseTo(45.24)
    expect(round(testNumber2,5)),toBeCloseTo(17.82943,5)
})