import { useEffect, useState } from "react";
import { json } from "@remix-run/node";
import {
  useActionData,
  useLoaderData,
  useNavigation,
  useSubmit,
} from "@remix-run/react";
import {
  Page,
  Layout,
  VerticalStack,
  Card,
  Button,
  ChoiceList,
} from "@shopify/polaris";

import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  const { session, admin } = await authenticate.admin(request);

  const response = await admin.graphql(
    `#graphql
    query order {
      orders(first: 10, query: "fulfillment_status:unshipped") {
        nodes {
          id
          name
          fulfillable
          fulfillmentOrders(first: 10, query: "status:open") {
            nodes {
              id
              createdAt
              status
            }
          }
        }
      }
    }`
  );

  const responseJson = await response.json();

  return json({ shop: session.shop.replace(".myshopify.com", ""), orders: responseJson.data.orders.nodes });
};

export async function action({ request }) {
  const formData = await request.formData();
  const orderId = await formData.get("orderId");
  const { admin } = await authenticate.admin(request);

  console.log("---formdata---")
  console.log(orderId);
  console.log("---/ formdata---")

  const fulfillmentOrderObject = await admin.graphql(
    `#graphql
    query fulfillmentOrder($orderId: ID!) {
      order(id: $orderId) {
        fulfillmentOrders(first: 10, query: "status:open") {
          nodes {
            id
            createdAt
            status
          }
        }
      }
    }`,
    {
      variables: {
        orderId: orderId,
      },
    }
  );

  const fulfillmentOrderObjectJson = await fulfillmentOrderObject.json();

  // console.log(fulfillmentOrderObject)
  console.log("---fulfillmentOrderObjectJson---");
  console.log(fulfillmentOrderObjectJson.data.order.fulfillmentOrders.nodes);
  console.log("---/ fulfillmentOrderObjectJson---");

  if (fulfillmentOrderObjectJson.data.order.fulfillmentOrders.nodes.length === 0) return json({status: "failed"});

  const createFulfillment = await admin.graphql(
    `#graphql
    mutation fulfillmentCreateV2($fulfillment: FulfillmentV2Input!) {
      fulfillmentCreateV2(fulfillment: $fulfillment) {
        fulfillment {
          id
        }
        userErrors {
          field
          message
        }
      }
    }`,
    {
      variables: {
        fulfillment: {
          lineItemsByFulfillmentOrder: [
            {
              fulfillmentOrderId: fulfillmentOrderObjectJson.data.order.fulfillmentOrders.nodes[0].id,
            }
          ]
        },
      },
    }
  );

  const createFulfillmentJson = await createFulfillment.json();

  console.log("---createFulfillmentJson---");
  console.log(createFulfillmentJson);
  console.log("---/ createFulfillmentJson---");

  if (!createFulfillmentJson.data?.fulfillmentCreateV2?.fulfillment?.id) return json({status: "failed"});

  return json({
    orders: createFulfillmentJson.data,
    status: "success",
  });
}

export default function Index() {
  const nav = useNavigation();
  const { shop, orders } = useLoaderData();
  const actionData = useActionData();
  const submit = useSubmit();

  const [formState, setFormState] = useState({});
  const [selected, setSelected] = useState(['hidden']);
  const [orderList, setOrderList] = useState(orders);
  console.log("orderList", orderList)
  console.log("formState", formState)

  // console.log(orders)

  const isLoading =
    ["loading", "submitting"].includes(nav.state) && nav.formMethod === "POST";

  const productId = actionData?.product?.id.replace(
    "gid://shopify/Product/",
    ""
  );

  useEffect(() => {
    if (actionData?.status === "success") {
      shopify.toast.show("fullfillment success");
      setOrderList(orderList.filter((order) => order.id !== formState.orderId[0]));
    } else if (actionData?.status === "failed") {
      shopify.toast.show("fullfillment failed");
    }
  }, [actionData]);

  const fulfillOrder = () => {
    const data = {
      orderId: formState.orderId,
    };
    submit(data, { replace: true, method: "POST" });
  }

  const handleChange = (value) => {
    setSelected(value);
    setFormState({ ...formState, orderId: value });
  }
  

  return (
    <Page>
      <VerticalStack gap="5">
        <Layout>
          <Layout.Section>
            <Card>
              <VerticalStack gap="5">
                  <ChoiceList
                    title="Select Order"
                    choices={orderList.map((order) => ({
                      label: order.name,
                      value: order.id,
                    }))}
                    selected={selected}
                    onChange={handleChange}
                  />
                  <Button loading={isLoading} primary onClick={fulfillOrder}>
                      Fulfillment order
                  </Button>
              </VerticalStack>
            </Card>
          </Layout.Section>
        </Layout>
      </VerticalStack>
    </Page>
  );
}
