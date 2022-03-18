import xss from 'xss';
import { pagedQuery, singleQuery } from '../db.js';
import { addPageMetadata } from '../utils/addPageMetadata.js';
import { logger } from '../utils/logger.js';


export async function listCategories(req, res) {
  const { offset = 0, limit = 10 } = req.query;

  const categories = await pagedQuery(
    `SELECT
        name
      FROM
        categories
      ORDER BY id ASC`,
    [],
    { offset, limit },
  );

  const categoriesWithPage = addPageMetadata(
    categories,
    req.path,
    { offset, limit, length: categories.items.length },
  );

  return res.json(categoriesWithPage);
}

export async function createcategory(req, res) {
  const { name } = req.body;
  const result = await insertCategory(name);

  if (!result) {
    return res.status(500).end();
  }
  return res.status(201).json(result);
}

export async function updateCategory(req, res) {
  const { id } = req.params;
  const { name } = req.body;

  const result = await singleQuery(`
    UPDATE
      categories
    SET
      name = $2
    WHERE
      id = $1
    RETURNING *;`,
    [id, xss(name)]
  );

  if (!result || !result.rows[0]) {
    return res.status(400).json({ error: 'Nothing to update' });
  }
  return res.status(200).json(result.rows[0]);
}

export async function deleteCategory(req, res) {
  const { id } = req.params;

  try {
    const deletionrowCount = await deleteQuery(
      `DELETE FROM categories WHERE id = $1;`, [id]
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
