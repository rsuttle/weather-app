import testables from "../src/components/Map"

const {convertRGBStringToHex} = testables

const rgbString1 = "rgb(20,152,201)"
const rgbstring2 = "rgb(150,74,129)"

const hexString1 = "0x1498c9"
const hexString2 = "0x964a81"

test("Test rgb string to hex string conversion.", () => {
    const resultString1 = convertRGBStringToHex(rgbString1)
    expect(resultString1).toBe(hexString1)

    const resultString2 = convertRGBStringToHex(rgbstring2)
    expect(resultString2).toBe(hexString2)
})