type AnyObject = Record<string, any>;

/**
  @descripton
  Takes a dictionary and removes any empty key/value pairs from the dictionary
  Note: the original object is not modified instead a new one is returned.

  @example
  Input:  { A: '1', B: 2, C: undefined, D: null, E: false, F: '', G : 0}
  Output: { A: '1', B: 2, G: 0}
 */
export const removeEmptyValuesFromObject = (obj: AnyObject) => {
  const result: AnyObject = {};
  const stack: [string, any][] = Object.entries(obj);

  while (stack.length > 0) {
    const [key, value] = stack.pop()!;

    if (value !== null && value !== undefined && value !== "") {
      if (typeof value === "object") {
        const nested = Object.entries(value).filter(
          ([_, v]) => v !== null && v !== undefined && v !== "",
        );
        if (nested.length > 0) {
          result[key] = Object.fromEntries(nested);
        }
      } else {
        result[key] = value;
      }
    }
  }

  return result;
};
