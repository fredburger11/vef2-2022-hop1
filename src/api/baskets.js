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
  const { cartid } = req.params;
  /*... vantar að útfæra summu af verði ...*/
  const q = `
    SELECT *
    FROM basket
    INNER JOIN
    (SELECT basketId,sum(price) FROM linesinbasket)
    WHERE id = $1
  `;

  const result = await singleQuery(
    'SELECT * FROM linesinbasket WHERE basketId =$1;',
    [xss(cartid)]
  );

  if (!result || result.rowCount === 0) {
    return res.status(400).json({ error: 'No cart found' });
  }
  return res.status(200).json(result);
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
    logger.error(`unable to delete basket ${id}`, e);
  }
  return res.status(500).json(null);
}


export async function addLineToBasket(req, res) {
  const { productId, nrofproducts } = req.body;
  const { cartid } = req.params;

  const result = await insertLineToBasket(cartid, productId, nrofproducts);

  if (!result) {
    return res.status(500).json({ error: 'Unable to insert line' });
  }
  return res.status(201).json(result);
}

export async function getLineFromBasket(req, res) {
  const { cartid, id } = req.params;

  const result = await singleQuery(`
    SELECT *
    FROM
      linesinbasket
    WHERE
      basketId = $1
      AND
      productId = $2;`,
    [xss(cartid), xss(id)]
  );

  if (result.rowCount === 0) {
    return res.status(404).json({ error: 'Line not found' });
  }
  return res.status(200).json(result.rows[0]);
}

export async function updateLineInBasket(req, res) {
  const { cartid, id } = req.params;
  const { nrofproducts } = req.body;

  const result = await singleQuery(`
    UPDATE
      linesinbasket
    SET
      nrofproducts = $3
    WHERE
      basketId = $1
      AND
      productId = $2
    RETURNING *;`,
    [xss(cartid), xss(id), xss(nrofproducts)]
  );

  if (!result || !result.rows[0]) {
    return res.status(400).json({ error: 'Nothing to update' });
  }
  return res.status(200).json(result.rows[0]);
}

export async function deleteLineFromBasket(req, res) {
  const { cartid, id } = req.params;

  try {
    const result = await deleteQuery(`
      DELETE FROM
        linesinbasket
      WHERE
        basketId = $1
        AND
        productId = $2;`,
      [xss(cartid), xss(id)]
    );

    if (deletionrowCount === 0) {
      return res.status(404).end();
    }

    return res.status(200).json({});
  } catch (e) {
    logger.error(`Unable to delete line ${id}`, e);
  }
  return res.status(500).json(null);
}
