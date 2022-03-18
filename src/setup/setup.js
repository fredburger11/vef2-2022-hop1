/* eslint-disable no-await-in-loop */
import csvParser from 'csv-parser';
import fs from 'fs';
import { dirname, extname, join } from 'path';
import { fileURLToPath } from 'url';
import {
  end, insertCategory, insertProduct, query
} from '../db.js';
import { listImages, uploadImage } from '../utils/cloudinary.js';
import { readDir, readFile, stat } from '../utils/fs-helpers.js';
import { logger } from '../utils/logger.js';



const DATA_DIR = './../../data';
const IMG_DIR = './../../data/img';
const SQL_DIR = './../../sql';

const path = dirname(fileURLToPath(import.meta.url));

/**
 * Möppun á milli skráarnafns myndar og slóðar á Cloudinary
 * <skráarnafn> => <url>
 */
const imageCloudinaryUrl = new Map();

// Heiti á category => Id á category í gagnagrunni
const categIds = new Map();

/**
 * Droppar schema til að búa til upp á nýtt.
 */
async function dropSchema() {
  const schemaFile = join(path, SQL_DIR, 'drop.sql');
  const data = await readFile(schemaFile);
  await query(data.toString('utf-8'));
}

/**
 * Les inn schema fyrir gagnagrunn úr SQL skrá.
 */
async function schema() {
  const schemaFile = join(path, SQL_DIR, 'schema.sql');
  const data = await readFile(schemaFile);
  await query(data.toString('utf-8'));
}

/**
 * Les inn SQL skipanir eftir að skema er tilbúið.
 */
async function postSchemaSql() {
  const schemaFile = join(path, SQL_DIR, 'insert.sql');
  const data = await readFile(schemaFile);
  await query(data);
}

/**
 * Hjálparfall sem les CSV skrá með straumum. Gætum útfært sem „one-pass“:
 * lesið inn skrá og unnið með gögn jafnóðum, en það er flóknara vegna blöndu
 * strauma og promises.
 *
 * @param {string} filename CSV skrá til að lesa og skila gögnum frá.
 * @returns {Promise<Array<object>>} Promise með fylki af gögnum
 */
async function readCsv(filename) {
  return new Promise((resolve, reject) => {
    const all = [];
    fs.createReadStream(filename)
      .pipe(csvParser())
      .on('data', (data) => {
        all.push(data);
      })
      .on('end', () => {
        resolve(all);
      })
      .on('error', (err) => {
        reject(err);
      });
  });
}

/**
 * Bætir við tegund eða skilar ID á henni ef til.
 * @param {string} category Tegund sem útbúa skal eða skila ID fyrir
 * @returns {string} ID á tegund.
 */

async function insertCategoryOrExisiting(category) {
  if (!categIds.has(category)) {
    const insertedCategory = await insertCategory(category);
    categIds.set(category, insertedCategory.id);
  }

  return categIds.get(category);
}

/**
 * Les inn gögn um vörur úr CSV skrá, les inn í grunn með tengdum
 * tegundum. Geymir lista af vörum í prodIds Map fyrir önnur
 * innlestrar föll.
 */
async function products() {
  const filename = join(path, DATA_DIR, 'products.csv');

  const data = await readCsv(filename);

  for (const item of data) {

    // Búum til sérstaklega og setjum ID í staðinn
    const { category } = item;

    const categId = await insertCategoryOrExisiting(category);

    const image = imageCloudinaryUrl.get(item.image);

    if (image) {
      item.image = image;
    } else {
      logger.warn(`Missing uploaded image for product "${item.name}"`);
    }
    item.categoryId = categId;

    await insertProduct(item);
  }
}


async function images() {
  const imagesOnDisk = await readDir(join(path, IMG_DIR));
  const filteredImages = imagesOnDisk
    .filter((i) => extname(i).toLowerCase() === '.jpg');

  if (filteredImages.length === 0) {
    logger.warn('No images to upload');
    return;
  }

  const cloudinaryImages = await listImages();
  logger.verbose(`${cloudinaryImages.length} images in Cloudinary`);

  for (const image of filteredImages) {
    let cloudinaryUrl = '';
    const imgPath = join(path, IMG_DIR, image);
    const imgSize = (await stat(imgPath)).size;
    const uploaded = cloudinaryImages.find((i) => i.bytes === imgSize);

    if (uploaded) {
      cloudinaryUrl = uploaded.secure_url;
      logger.verbose(`${imgPath} already uploaded to Cloudinary`);
    } else {
      const upload = await uploadImage(imgPath);
      cloudinaryUrl = upload.secure_url;
      logger.verbose(`${imgPath} uploaded to Cloudinary`);
    }

    imageCloudinaryUrl.set(image, cloudinaryUrl);
  }
}

/**
 * Keyrir inn öll gögn í röð.
 * Mætti bæta villumeðhöndlun, en þar sem þetta er keyrt „handvirkt“ verður
 * villumeðhöndlun mannleg: ef við sjáum villu lögum við villu.
 */
async function main() {
  await images();
  logger.info('Images uploaded');
  await dropSchema()
  logger.info('Schema dropped')
  await schema();
  logger.info('Schema created');
  await postSchemaSql();
  logger.info('Post schema SQL run');
  await products();
  logger.info('products & categories imported');
  await end();
}

main().catch((err) => {
  logger.error(err);
});
