import dotenv from 'dotenv';
import pg from 'pg';
import xss from 'xss';
import { logger } from './utils/logger.js';
import { toPositiveNumberOrDefault } from './utils/toPositiveNumberOrDefault.js';


dotenv.config();

const {
  DATABASE_URL: connectionString,
  NODE_ENV: nodeEnv = 'development',
} = process.env;

// Notum SSL tengingu við gagnagrunn ef við erum *ekki* í development mode, þ.e.a.s. á local vél
const ssl = nodeEnv !== 'development' ? { rejectUnauthorized: false } : false;

const pool = new pg.Pool({ connectionString, ssl });

pool.on('error', (err) => {
  console.error('Villa í tengingu við gagnagrunn, forrit hættir', err);
  process.exit(-1);
});

/**
 * Product.
 * @typedef {Object} Product
 * @property {number | null} id - ID of a product, if defined
 * @property {string} name Name of a product
 * @property {number} price Price of a product
 * @property {string} description description of a product
 * @property {string} image Path to image
 * @property {number} category id of the category this product belongs to
 * @property {Date} created Date of first put on the menu
 * @property {Date} updated Date of when this product was updated
 */

/**
 * category.
 * @typedef {Object} category
 * @property {number | null} id - ID of category, if defined
 * @property {string} name Name of category
 */

export async function query(_query, values = []) {
  const client = await pool.connect();

  try {
    const result = await client.query(_query, values);
    return result;
  } finally {
    client.release();
  }
}

export async function singleQuery(_query, values = []) {
  const result = await query(_query, values);

  if (result.rows && result.rows.length === 1) {
    return result.rows[0];
  }

  return null;
}

export async function deleteQuery(_query, values = []) {
  const result = await query(_query, values);

  return result.rowCount;
}

export async function pagedQuery(
  sqlQuery,
  values = [],
  { offset = 0, limit = 10 } = {},
) {
  const sqlLimit = values.length + 1;
  const sqlOffset = values.length + 2;
  const q = `${sqlQuery} LIMIT $${sqlLimit} OFFSET $${sqlOffset}`;

  const limitAsNumber = toPositiveNumberOrDefault(limit, 10);
  const offsetAsNumber = toPositiveNumberOrDefault(offset, 0);

  const combinedValues = values.concat([limitAsNumber, offsetAsNumber]);

  const result = await query(q, combinedValues);

  return {
    limit: limitAsNumber,
    offset: offsetAsNumber,
    items: result.rows,
  };
}

export async function end() {
  await pool.end();
}

/**
 * Insert a new product.
 *
 * @param {Product} product Dish to create.
 * @return {Product} Product created, with ID.
 */
export async function insertProduct({
  name,
  price,
  description,
  image,
  categoryId,
}) {
  const q = `
    INSERT INTO
      products
      (name, price, description, image, categoryId)
    VALUES
      ($1, $2, $3, $4, $5)
    RETURNING
      id, name, price, description, image, categoryId
  ;`;
  const values = [
    xss(name),
    price,
    xss(description),
    xss(image),
    categoryId,
  ];

  try {
    const result = await query(q, values);
    return result.rows[0];
  } catch (e) {
    logger.error('Error inserting product', e);
  }

  return null;
}


/**
 * Insert a category.
 *
 * @param {string} name Name of category
 * @return {category} category created, with ID.
 */
export async function insertCategory(name) {
  try {
    const result = await query(
      'INSERT INTO categories (name) VALUES ($1) RETURNING id, name;',
      [xss(name)],
    );
    return result.rows[0];
  } catch (e) {
    logger.error('Error inserting category', e);
  }

  return null;
}
/*
export async function insertSerieGenre(serieId, genreId) {
  try {
    const result = await query(
      'INSERT INTO series_genres (serie, genre) VALUES ($1, $2);',
      [xss(serieId), xss(genreId)],
    );
    return result.rows[0];
  } catch (e) {
    logger.error('Error inserting serie-genre relation', e);
  }

  return null;
}
*/
// TODO refactor
export async function conditionalUpdate(table, id, fields, values) {
  const filteredFields = fields.filter((i) => typeof i === 'string');
  const filteredValues = values
    .filter((i) => typeof i === 'string'
      || typeof i === 'number'
      || i instanceof Date);

  if (filteredFields.length === 0) {
    return false;
  }

  if (filteredFields.length !== filteredValues.length) {
    throw new Error('fields and values must be of equal length');
  }

  // id is field = 1
  const updates = filteredFields.map((field, i) => `${field} = $${i + 2}`);

  const q = `
    UPDATE ${table}
      SET ${updates.join(', ')}
    WHERE
      id = $1
    RETURNING *
    `;

  const queryValues = [id].concat(filteredValues);

  console.info('Conditional update', q, queryValues);

  const result = await query(q, queryValues);

  return result;
}
