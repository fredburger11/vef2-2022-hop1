import xss from 'xss';
import { pagedQuery, singleQuery } from '../db.js';
import { addPageMetadata } from '../utils/addPageMetadata.js';
import { logger } from '../utils/logger.js';


export async function listCategories(req, res) {
  const { offset = 0, limit = 10 } = req.query;

  const genres = await pagedQuery(
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

  try {
    // TODO refactor, use db.js insertCategory
    const newCategory = await singleQuery(
      `
        INSERT INTO
        categories (name)
        VALUES
          ($1)
        RETURNING
          id, name
      `,
      [xss(name)],
    );
    return res.status(201).json(newCategory);
  } catch (e) {
    logger.error(`unable to create genre "${name}"`, e);
  }

  return res.status(500).json(null);
}
