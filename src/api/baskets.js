import xss from 'xss';
import { deleteQuery, pagedQuery, singleQuery } from '../db.js';
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

export async function listBasket(req, res) {
  const { id } = req.params;
  /*... vantar að útfæra ...*/
}

export async function deleteBasket(req, res) {
  const { cartid } = req.params;

  try {
    const deletionrowCount = await deleteQuery(`
      DELETE FROM
        basket
      WHERE
        id = $1;`,
      [xss(cartid)]
    );

    if (deletionrowCount === 0) {
      return res.status(404).end();
    }
    return res.status(200).json({});
  } catch (e) {
    logger.error(`unable to delete category ${id}`, e);
  }
  return res.status(500).json(null);
}

/*
export async function addLineToBasket(req, res) {
  const { productId, nrofproducts } = req.body;
  const { cartid } = req.params;

  const result = await insertLineToBasket(cartid, productId, nrofproducts);

  if (!result) {
    return res.status(500).json({ error: 'Unable to insert line' });
  }
  return res.status(201).json(result);
}
*/
