import xss from 'xss';
import { conditionalUpdate, deleteQuery, pagedQuery, singleQuery } from '../db.js';
import { addPageMetadata } from '../utils/addPageMetadata.js';
import { uploadImage } from '../utils/cloudinary.js';
import { logger } from '../utils/logger.js';

/*
async function serieGenres(id) {
  let genres = [];
  try {
    const result = await query(
      `SELECT
        genres.name
      FROM
        series_genres
      JOIN
        genres ON genres.id = series_genres.genre
      WHERE
        series_genres.serie = $1`,
      [id],
    );

    if (result.rows && result.rows.length > 0) {
      genres = result.rows;
    }
  } catch (e) {
    logger.warn('Unable to query genres for serie', id, e);
  }

  return genres;
}
*/
/*
async function serieSeasons(id) {
  let seasons = [];
  try {
    const result = await query(
      `SELECT
        name, "number", air_date, overview, poster
      FROM
        seasons
      WHERE
        serieId = $1`,
      [id],
    );

    if (result.rows && result.rows.length > 0) {
      seasons = result.rows;
    }
  } catch (e) {
    logger.warn('Unable to query seasons for serie', id, e);
  }

  return seasons;
}
*/
export async function listProducts(req, res) {
  const { offset = 0, limit = 10 } = req.query;

  const series = await pagedQuery(
    `SELECT
        id, name, prize, description, image, category, created, updated
      FROM
        series
      ORDER BY id created ASC`,
    [],
    { offset, limit },
  );

  const seriesWithPage = addPageMetadata(
    series,
    req.path,
    { offset, limit, length: series.items.length },
  );

  return res.json(seriesWithPage);
}

export async function listSerie(_, req) {
  const { serieId: id } = req.params;

  const serie = await singleQuery(
    `
      SELECT
        series.id AS id,
        series.name AS name,
        series.air_date AS air_date,
        series.in_production AS in_production,
        series.tagline AS tagline,
        series.image AS image,
        series.description AS description,
        series.language AS language,
        series.network AS network,
        series.url AS url,
        COALESCE(ROUND(AVG(users_series_rating.rating), 2), 0) AS averagerating,
        COUNT(users_series_rating.serieId) AS ratingcount
      FROM
        series
      LEFT JOIN
        users_series_rating ON users_series_rating.serieId = series.id
      WHERE
        series.id = $1
      GROUP BY
        series.id
    `,
    [id],
  );

  if (!serie) {
    return null;
  }

  if (serie.averagerating) {
    serie.averagerating = parseFloat(serie.averagerating);
  }

  if (serie.ratingcount) {
    serie.ratingcount = parseInt(serie.ratingcount, 10);
  }

  const genres = await serieGenres(id);
  const seasons = await serieSeasons(id);

  if (req.user && req.user.id) {
    const rating = await getSerieRatingForUser(id, req.user.id);
    if (rating) {
      serie.rating = rating.rating;
    }

    const state = await getSerieStateForUser(id, req.user.id);
    if (state) {
      serie.state = state.state;
    }
  }

  serie.genres = genres;
  serie.seasons = seasons;

  return serie;
}

export async function createSerie(req, res) {
  const {
    name,
    airDate = null,
    inProduction,
    tagline = null,
    description,
    language,
    network = null,
    url = null,
  } = req.body;
  const { path: imagePath } = req.file;

  // TODO refactor into helper in cloudinary.js
  let poster;
  try {
    const uploadResult = await uploadImage(imagePath);
    if (!uploadResult || !uploadResult.secure_url) {
      throw new Error('no secure_url from cloudinary upload');
    }
    poster = uploadResult.secure_url;
  } catch (e) {
    logger.error('Unable to upload file to cloudinary', e);
    return res.status(500).end();
  }

  const insertSeasonResult = await insertSerie({
    name,
    airDate,
    inProduction,
    tagline,
    image: poster,
    description,
    language,
    network,
    url,
  });

  if (insertSeasonResult) {
    return res.status(201).json(insertSeasonResult);
  }

  return res.status(500).end();
}

export async function deleteSerie(req, res) {
  const { serieId } = req.params;

  try {
    const deletionRowCount = await deleteQuery(
      'DELETE FROM series WHERE id = $1;',
      [serieId],
    );

    if (deletionRowCount === 0) {
      return res.status(404).end();
    }

    return res.status(200).json({});
  } catch (e) {
    logger.error(`unable to delete serie "${serieId}"`, e);
  }

  return res.status(500).json(null);
}

// TODO move to utils
function isString(s) {
  return typeof s === 'string';
}

export async function updateSerie(req, res) {
  const { serieId: id } = req.params;
  const { body } = req;
  const { file: { path: imagePath } = {} } = req;

  const fields = [
    isString(body.name) ? 'name' : null,
    isString(body.airdate) ? 'air_date' : null,
    isString(body.inproduction) ? 'in_production' : null,
    isString(body.tagline) ? 'tagline' : null,
    isString(body.description) ? 'description' : null,
    isString(body.language) ? 'language' : null,
    isString(body.network) ? 'network' : null,
    isString(body.url) ? 'url' : null,
  ];

  const values = [
    isString(body.name) ? xss(body.name) : null,
    isString(body.airdate) ? xss(body.airdate) : null,
    isString(body.inproduction) ? xss(body.inproduction) : null,
    isString(body.tagline) ? xss(body.tagline) : null,
    isString(body.description) ? xss(body.description) : null,
    isString(body.language) ? xss(body.language) : null,
    isString(body.network) ? xss(body.network) : null,
    isString(body.url) ? xss(body.url) : null,
  ];

  if (imagePath) {
    // TODO refactor into helper in cloudinary.js, same as above
    let poster;
    try {
      const uploadResult = await uploadImage(imagePath);
      if (!uploadResult || !uploadResult.secure_url) {
        throw new Error('no secure_url from cloudinary upload');
      }
      poster = uploadResult.secure_url;
    } catch (e) {
      logger.error('Unable to upload file to cloudinary', e);
      return res.status(500).end();
    }

    fields.push('image');
    values.push(poster);
  }

  const result = await conditionalUpdate('series', id, fields, values);

  if (!result || !result.rows[0]) {
    return res.status(400).json({ error: 'Nothing to update' });
  }

  return res.status(200).json(result.rows[0]);
}
