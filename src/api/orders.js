import xss from 'xss';
import { pagedQuery, singleQuery } from '../db.js';
import { addPageMetadata } from '../utils/addPageMetadata.js';
import { logger } from '../utils/logger.js';

async function setStatusOfOrder(req, res) {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const setStatus = await singleQuery(
      `
        INSERT INTO
          statusoforder(status)
        VALUES
          ($1)
        RETURNING
          id, status
      `,
      [id, status],
    );

    return res.status(201).json(setStatus);
  } catch (e) {
    logger.error(`unable to set status for '${id}'`, e);
  }

  return res.status(500);
}



export async function createOrder(req, res) {
  const { name } = req.body;
  // const newOrder = 'NEW';

  try {
    const id = await singleQuery(
      `
        INSERT INTO
          orders (name)
        VALUES
          ($1)
        RETURN id
      `,
      [xss(name)],
    );
    return setStatusOfOrder(id);
  } catch (e) {
    logger.error('unable to create order', e);
  }

  return res.status(500).json(null);

}

export async function listOrders(req, res) {
  const { offset = 0, limit = 10 } = req.query;

  const orders = await pagedQuery(
    `SELECT
      id, created, name
    FROM
     orders
    ORDER BY created DESC`,
    [],
    { offset, limit },
  );

  const ordersWithPage = addPageMetadata(
    orders,
    req.path,
    { offset, limit, length: orders.items.length },
  );

  return res.json(ordersWithPage);
}


