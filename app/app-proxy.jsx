// import { authenticate } from "../shopify.server";
// import { json } from "@remix-run/node";
import shopify from "./shopify.server.js";

export const action = async ({ request }) => {
  // const { admin, session } = await authenticate.admin(request);

  // const response = await admin.graphql(
  //   `#graphql
  //     query shopInfo {
  //       shop {
  //         name
  //       }
  //     }`
  // );

  // const responseJson = await response.json();

  // return json({
  //   shopName: responseJson.data.shop.name,
  // });

  // throw new Response();

  const { admin, session } = await shopify.unauthenticated.admin(shop);
  const productCount = await admin.rest.resources.Product.count({ session });
};
