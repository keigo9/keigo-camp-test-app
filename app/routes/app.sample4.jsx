import { useEffect, useState, useCallback } from "react";
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
  Text,
  VerticalStack,
  Card,
  Button,
  HorizontalStack,
  Box,
  Divider,
  List,
  Link,
  Modal,
  Thumbnail,
  TextField,
  Tag,
} from "@shopify/polaris";

import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);

  return json({ shop: session.shop.replace(".myshopify.com", "") });
};

export async function action({ request }) {
  const formData = await request.formData();
  const productId = await formData.get("productId");
  const tagList = await formData.get("tagList");
  //console.log(formData)
  console.log("---formdata---")
  console.log(productId)
  console.log(tagList)
  console.log("---/ formdata---")
  //console.log("---request---")
  
  //console.log(request)
  //console.log("---/ request---")
  const { admin } = await authenticate.admin(request);

  const response = await admin.graphql(
    `#graphql
      mutation updateProduct($input: ProductInput!) {
        productUpdate(input: $input) {
          product {
            handle
            id
            title
            tags
          }
        }
      }`,
    {
      variables: {
        input: {
          id: productId,
          tags: tagList,
        },
      },
    }
  );

  const responseJson = await response.json();

  return json({
    product: responseJson.data.productUpdate.product,
  });
  //return null;
}

export default function Index() {
  const nav = useNavigation();
  const { shop } = useLoaderData();
  const actionData = useActionData();
  const submit = useSubmit();

  const isLoading =
    ["loading", "submitting"].includes(nav.state) && nav.formMethod === "POST";

  const [value, setValue] = useState('');
  const [formState, setFormState] = useState({});
  const [selectedTags, setSelectedTags] = useState([]);

  const productId = actionData?.product?.id.replace(
    "gid://shopify/Product/",
    ""
  );

  useEffect(() => {
    if (productId) {
      shopify.toast.show("Product updated");
    }
  }, [productId]);

  const removeTag = useCallback(
    (tag) => () => {
      setSelectedTags((previousTags) =>
        previousTags.filter((previousTag) => previousTag !== tag),
      );
    },
    [],
  );

  const addTag = useCallback(
    () => {
      if (value === "" || selectedTags.includes(value)) {
        return;
      }
      const newTags = [...selectedTags, value];
      setSelectedTags(newTags);
      setValue("");
    },
    [value],
  )

  const handleSave = () => {
    setSelectedTags([]);
    const data = {
      tagList: selectedTags, 
      productId: formState.productId,
    }
    submit(data, { method: "POST" })
  };

  async function selectProduct() {
    const products = await window.shopify.resourcePicker({
      type: "product",
      action: "select", // customized action verb, either 'select' or 'add',
    });

    if (products) {
      const { images, id, variants, title, handle } = products[0];

      setFormState({
        ...formState,
        productId: id,
        productVariantId: variants[0].id,
        productTitle: title,
        productHandle: handle,
        productAlt: images[0]?.altText,
        productImage: images[0]?.originalSrc,
      });
    }
  }

  return (
    <Page>
      <VerticalStack gap="5">
        <Layout>
          <Layout.Section>
            <Card>
              <VerticalStack gap="5">
                <VerticalStack gap="2">
                  <Text as="h2" variant="headingMd">
                    商品を選択してタグ付けを行います
                  </Text>
                  <Text as="p" variant="bodyMd">
                    商品を選択してください
                  </Text>
                </VerticalStack>
                <HorizontalStack gap="3" align="end">
                  <Button loading={isLoading} primary onClick={selectProduct}>
                    Choose product
                  </Button>
                </HorizontalStack>
                {formState.productId ? (
                  <VerticalStack gap="2">
                    <HorizontalStack blockAlign="center" gap={"5"}>
                      <Thumbnail
                        source={formState.productImage || ImageMajor}
                        alt={formState.productAlt}
                      />
                      <Text as="span" variant="headingMd" fontWeight="semibold">
                        {formState.productTitle}
                      </Text>
                    </HorizontalStack>
                    <HorizontalStack blockAlign="center" gap={"5"}>
                      <TextField
                        label="Enter Tag name"
                        value={value}
                        onChange={(newValue) => setValue(newValue)}
                        autoComplete="off"
                        //onBlur={(event) => addTag(event)}
                      />
                      {
                        selectedTags.map((option, index) => (
                          <Tag key={index} onRemove={removeTag(option)}>
                            {option}
                          </Tag>
                        ))
                      }
                      <Button primary onClick={addTag}>
                        add
                      </Button>
                      <Button loading={isLoading} primary onClick={handleSave} disabled={selectedTags.length > 0 ? false : true}>
                        Save
                      </Button>
                    </HorizontalStack>
                  </VerticalStack>
                ) : null}
              </VerticalStack>
            </Card>
          </Layout.Section>
        </Layout>
      </VerticalStack>
    </Page>
  );
}
