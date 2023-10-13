// app/routes/**\/.ts
import { authenticate } from '../../shopify.server';

export async function loader({request}) {
  console.log("app proxy loaded")

  try {
    //const proxy = await authenticate.public.appProxy(request);
    const { admin } = await authenticate.public.appProxy(request);
    //console.log("proxy =>",proxy);
    console.log("admin =>",admin);
    //console.log("session =>",session);

    const response = await admin.graphql(
      `query order {
        orders(first: 10) {
          nodes {
            id
            name
            totalPrice
            lineItems(first: 10) {
              nodes {
                title
                quantity
                originalUnitPrice
              }
            }
          }
        }
      }`
    );
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const json = await response.json();
    console.log(json);
    return json;
  } catch(error) {
    console.log("error", error);
    return null;
  }
}