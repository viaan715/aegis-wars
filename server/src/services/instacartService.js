const BASE_URLS = {
  development: 'https://connect.dev.instacart.tools',
  production: 'https://connect.instacart.com',
};

/**
 * Calls the Instacart Developer Platform "Create shopping list page" endpoint
 * (POST /idp/v1/products/products_link) to turn a grocery list into a
 * shoppable Instacart cart link. Docs: https://docs.instacart.com/developer_platform_api
 */
export async function createInstacartShoppingListLink({ title, lineItems }) {
  const apiKey = process.env.INSTACART_API_KEY;
  if (!apiKey) {
    const err = new Error('INSTACART_API_KEY is not configured on the server');
    err.code = 'NOT_CONFIGURED';
    throw err;
  }

  const env = process.env.INSTACART_ENV === 'production' ? 'production' : 'development';
  const baseUrl = BASE_URLS[env];

  const response = await fetch(`${baseUrl}/idp/v1/products/products_link`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      title,
      link_type: 'shopping_list',
      line_items: lineItems.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
      })),
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    const err = new Error(`Instacart API error (${response.status}): ${body}`);
    err.code = 'INSTACART_API_ERROR';
    throw err;
  }

  const data = await response.json();
  return data.products_link_url;
}
