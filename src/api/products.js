import xss from 'xss';
import { conditionalUpdate, deleteQuery, insertProduct, pagedQuery, singleQuery } from '../db.js';
import { addPageMetadata } from '../utils/addPageMetadata.js';
import { logger } from '../utils/logger.js';
import { isString } from '../utils/isString.js'


export async function listProducts(req, res) {
  const { category, search, offset = 0, limit = 10 } = req.query;

  let products;
  if (!category) {
    if (!search) {
      products = await pagedQuery(
        `SELECT
            id, name, price, description, image, categoryId, created, updated
          FROM
            products
          ORDER BY created DESC`,
        [],
        { offset, limit },
      );
    } else {
      products = await pagedQuery(
        `SELECT
            id, name, price, description, image, categoryId, created, updated
          FROM
            products
          WHERE
            name ILIKE $1 OR description ILIKE $1
          ORDER BY created DESC`,
        [`%${xss(search)}%`],
        { offset, limit },
      );
    }
  } else {
    products = await pagedQuery(`
      SELECT
        id, name, price, description, image, categoryId, created, updated
      FROM
        products
      WHERE
        categoryId = $1
      ORDER BY created DESC
      `,
      [xss(category)],
      { offset, limit },
    );
  }
  if (!products || products.rowCount === 0) {
    return res.status(404).json({ error: 'Not found' });
  }

  const productsWithPage = addPageMetadata(
    products,
    req.path,
    { offset, limit, length: products.items.length },
  );

  return res.json(productsWithPage);
}

export async function listProductById(req, res) {
  const { id } = req.params;

  const product = await singleQuery(`
      SELECT
        id, name, price, description, image, categoryId, created, updated
      FROM
        products
      WHERE
        id = $1
      ORDER BY created DESC
      `,
    [xss(id)]
  );

  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }
  return res.status(200).json(product);
}

export async function createProduct(req, res) {
  const result = await insertProduct(req.body);

  if (!result) {
    return res.status(500).end();
  }
  return res.status(201).json(result);
}

export async function updateProduct(req, res) {
  const { id } = req.params;
  const { body } = req;

  const fields = [
    isString(body.name) ? 'name' : null,
    isString(body.price) ? 'price' : null,
    isString(body.description) ? 'description' : null,
    isString(body.image) ? 'image' : null,
    isString(body.categoryId) ? 'categoryId' : null,
  ];

  const values = [
    isString(body.name) ? xss(body.name) : null,
    isString(body.price) ? xss(body.price) : null,
    isString(body.description) ? xss(body.description) : null,
    isString(body.image) ? xss(body.image) : null,
    isString(body.categoryId) ? xss(body.categoryId) : null,
  ];

  // gera eitthvað ef image breytist?

  const result = await conditionalUpdate('products', id, fields, values);

  if (!result || !result.rows[0]) {
    return res.status(400).json({ error: 'Nothing to update' });
  }
  return res.status(200).json(result.rows[0]);
}

export async function deleteProduct(req, res) {
  const { id } = req.params;

  try {
    const deletionrowCount = await deleteQuery(
      'DELETE FROM products WHERE id = $1;', [id]
    );

    if (deletionrowCount === 0) {
      return res.status(404).end();
    }

    return res.status(200).json({});
  } catch (e) {
    logger.error(`unable to delete product ${id}`, e);
  }
  return res.status(500).json(null);
}
