import xss from 'xss';
import { conditionalUpdate, deleteQuery, insertProduct, pagedQuery, singleQuery } from '../db.js';
import { addPageMetadata } from '../utils/addPageMetadata.js';
import { uploadImage } from '../utils/cloudinary.js';
import { logger } from '../utils/logger.js';

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
