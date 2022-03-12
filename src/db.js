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
 * @property {number} prize Prize of a product
 * @property {string} description description of a product
 * @property {string} image Path to image
 * @property {number} categorie id of the categorie this product belongs to
 * @property {Date} created Date of first put on the menu
 * @property {Date} updated Date of when this product was updated
 */

/**
 * Categorie.
 * @typedef {Object} Categorie
 * @property {number | null} id - ID of categorie, if defined
 * @property {string} name Name of categorie
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
 * @param {Product} product Serie to create.
 * @return {Product} Procut created, with ID.
 */
export async function insertProduct({
  name,
  prize,
  description,
  image,
  categorie,
}) {
  const q = `
    INSERT INTO
      products
      (name, prize, description, image, categorie)
    VALUES
      ($1, $2, $3, $4, $5)
    RETURNING
      id, name, prize, description, image, categorie
  ;`;
  const values = [
    xss(name),
    prize,
    xss(description),
    xss(image),
    categorie,
  ];

  try {
    const result = await query(q, values);
    return result.rows[0];
  } catch (e) {
    logger.error('Error inserting serie', e);
  }

  return null;
}


/**
 * Insert a categorie.
 *
 * @param {string} name Name of categorie
 * @return {Categorie} Categorie created, with ID.
 */
export async function insertCategorie(name) {
  try {
    const result = await query(
      'INSERT INTO categories (name) VALUES ($1) RETURNING id, name;',
      [xss(name)],
    );
    return result.rows[0];
  } catch (e) {
    logger.error('Error inserting genre', e);
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
