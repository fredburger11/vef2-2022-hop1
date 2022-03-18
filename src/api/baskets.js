import xss from 'xss';
import { pagedQuery, singleQuery } from '../db.js';
import { addPageMetadata } from '../utils/addPageMetadata.js';
import { logger } from '../utils/logger.js';


export async function createBasket(req, res) {
  const result = await singleQuery(`
    INSERT INTO basket
      DEFAULT VALUES
    RETURNING *;
  `, []
  );
  if (!result || result.rowCount === 0) {
    return res.status(500).json({ error: 'Unable to create cart' });
  }
  return res.status(201).json(result.rows[0]);
}
