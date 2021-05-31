const {testables} = require("../processGribData")

const {convertKelvinToFahrenheit} = testables

const kelvinTestArray = [
    [270,305],
    [257,282]
]

const fahrenheitResultArray = [
    [26.33,89.33],
    [2.93,47.93]
]

test("Converting array of Kelvin temperatures into Fahrenheit.", () => {
    const resultArray = convertKelvinToFahrenheit(kelvinTestArray)

    expect(resultArray).not.toBeNull();
    expect(resultArray[0]).not.toBeNull();

    expect(resultArray.length).toBe(fahrenheitResultArray.length)
    expect(resultArray[0].length).toBe(fahrenheitResultArray[0].length)

    for(let i = 0; i < resultArray.length; ++i){
        for(let j = 0; j < resultArray[i].length; ++j){
            expect(resultArray[i][j]).toBeCloseTo(fahrenheitResultArray[i][j],2)
        }
    }
})
