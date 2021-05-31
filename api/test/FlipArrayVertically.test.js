const {testables} = require("../processGribData")

const {flipDataVertically} = testables

var oddTestArray = [
    [1,2,3],
    [4,5,6],
    [7,8,9]
]

var desiredOddArrayAfterConversion = [
    [7,8,9],
    [4,5,6],
    [1,2,3]
]

test("Flip an array vertically (odd number of rows)",() => {
    const resultArray = flipDataVertically(oddTestArray)
    expect(resultArray).toEqual(desiredOddArrayAfterConversion)
})


var evenTestArray = [
    [1,2,3],
    [4,5,6],
    [7,8,9],
    [10,11,12]
]

var desiredEvenArrayAfterConversion = [
    [10,11,12],
    [7,8,9],
    [4,5,6],
    [1,2,3]
]

test("Flip an array vertically (even number of rows)",() => {
    const resultArray = flipDataVertically(evenTestArray)
    expect(resultArray).toEqual(desiredEvenArrayAfterConversion)
})


var emptyTestArray = []

test("Flip an empty array", () => {
    const resultArray = flipDataVertically(emptyTestArray);
    expect(resultArray).toEqual([]);
})