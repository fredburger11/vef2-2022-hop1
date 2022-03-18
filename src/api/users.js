import { pagedQuery, singleQuery } from '../db.js';
import { addPageMetadata } from '../utils/addPageMetadata.js';
import { logger } from '../utils/logger.js';

export async function listUsers(req, res) {
  const { offset = 0, limit = 10 } = req.query;

  const users = await pagedQuery(
    `SELECT
        id, name, username, email, admin, created, updated
      FROM
        users
      ORDER BY id ASC`,
    [],
    { offset, limit },
  );

  const usersWithPage = addPageMetadata(
    users,
    req.path,
    { offset, limit, length: users.items.length },
  );

  return res.json(usersWithPage);
}

export async function listUser(userId) {
  const episode = await singleQuery(
    `
      SELECT
        id, name, username, email, admin, created, updated
      FROM
        users
      WHERE
        id = $1
    `,
    [userId],
  );

  if (!episode) {
    return null;
  }

  return episode;
}

export async function updateUser(req, res) {
  const { admin } = req.body;
  const userId = req.params.id;

  try {
    const updatedUser = await singleQuery(
      `
        UPDATE
          users
        SET
          admin = $1,
          updated = current_timestamp
        WHERE
          id = $2
        RETURNING
          id, name, username, email, admin, created, updated
      `,
      [admin, userId],
    );
    return res.status(200).json(updatedUser);
  } catch (e) {
    logger.error(`unable to change admin to "${admin}" for user "${userId}"`, e);
  }

  return res.status(500).json(null);
}
