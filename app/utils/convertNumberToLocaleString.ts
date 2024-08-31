/**
 * @description
 * Takes a number and converts it to a en-US locale string that has commas
 *
 * @examples
 *  Input:   10000000
 *  Output:  10,000,000
 *
 *  Input:   100
 *  Output:  100
 */
export const convertNumberToLocaleString = (value = 0) => {
  return value.toLocaleString("en-US");
};
