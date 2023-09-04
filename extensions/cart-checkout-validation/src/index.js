// @ts-check

/**
 * @typedef {import("../generated/api").InputQuery} InputQuery
 * @typedef {import("../generated/api").FunctionResult} FunctionResult
 */

export default /**
 * @param {InputQuery} input
 * @returns {FunctionResult}
 */
(input) => {
  const errors = input.cart.lines
    .filter(({ quantity }) => quantity > 1)
    .map(() => ({
      localizedMessage: "同じ商品を一つ以上購入することはできません。",
      target: "cart",
    }));

  return {
    errors
  }
};