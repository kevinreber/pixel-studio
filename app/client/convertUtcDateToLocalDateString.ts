/**
 * @description
 * Takes a UTC date formatted string and returns the date as a date string
 * formatted as the clients local time.
 */

export const convertUtcDateToLocalDateString = (
  date: string | Date
): string => {
  // const momentObject = convertUtcDateToLocalMomentObject(UTCDateString);
  // return momentObject.toLocaleString();
  // return momentObject.local().format(DATE_FORMAT);

  return new Date(date).toLocaleString();
};
