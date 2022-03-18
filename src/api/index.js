import express from 'express';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { requireAdmin } from '../auth/passport.js';
import { catchErrors } from '../utils/catchErrors.js';
import { readFile } from '../utils/fs-helpers.js';
import { createcategory, deleteCategory, listCategories, updateCategory } from './categories.js';
import {
  createProduct, deleteProduct, listProductById,
  listProducts, updateProduct
} from './products.js';
import { listUser, listUsers, updateUser } from './users.js';
import { listOrders, createOrder } from './orders.js';
import {
  adminValidator,
  pagingQuerystringValidator,
  validateResourceExists
} from '../validation/validators.js';
import { validationCheck } from '../validation/helpers.js';
import {
  addLineToBasket, createBasket, deleteBasket, deleteLineFromBasket,
  getLineFromBasket, updateLineInBasket, listBasket
} from './baskets.js';


export const router = express.Router();

function returnResource(req, res) {
  return res.json(req.resource);
}

// Sækjum yfirlit yfir API úr index.json og sendum beint út
router.get('/', async (req, res) => {
  const path = dirname(fileURLToPath(import.meta.url));
  const indexJson = await readFile(join(path, './index.json'));
  res.json(JSON.parse(indexJson));
});

/**
 * Hér fylga allar skilgreiningar á routes, þær fylgja eftirfarandi mynstri:
 *
 * router.HTTP_METHOD(
 *  ROUTE_WITH_PARAM,
 *  VALIDATOR_MIDDLEWARE_1,
 *  ...
 *  VALIDATOR_MIDDLEWARE_N,
 *  validationCheck, // Sendir validation villur, ef einhverjar
 *  RESULT, // Eitthvað sem sendir svar til client ef allt OK
 * );
 */
// Routes fyrir matseðil

router.get(
  '/menu',
  pagingQuerystringValidator,
  validationCheck,
  catchErrors(listProducts)
);

router.post(
  '/menu',
  requireAdmin,
  // býr til nýja vöru á matseðil
  catchErrors(createProduct)
);

router.get(
  '/menu/:id',
  pagingQuerystringValidator,
  validationCheck,
  catchErrors(listProductById)
);

router.patch(
  '/menu/:id',
  requireAdmin,
  adminValidator,
  validationCheck,
  // uppfærir vöru
  catchErrors(updateProduct)
);

router.delete(
  '/menu/:id',
  requireAdmin,
  adminValidator,
  validationCheck,
  // eyðir vöru
  catchErrors(deleteProduct)
);

router.get(
  '/categories',
  pagingQuerystringValidator,
  validationCheck,
  // skilar síðu af flokkum
  catchErrors(listCategories)
);

router.post(
  '/categories',
  requireAdmin,
  adminValidator,
  validationCheck,
  // býr til nýjan flokk
  catchErrors(createcategory)
);

router.patch(
  '/categories/:id',
  requireAdmin,
  adminValidator,
  validationCheck,
  // uppfærir flokk
  catchErrors(updateCategory)
);

router.delete(
  '/categories/:id',
  requireAdmin,
  adminValidator,
  validationCheck,
  // eyðir flokk
  catchErrors(deleteCategory)
);

// Routes fyrir körfu

router.post(
  '/cart',
  pagingQuerystringValidator,
  validationCheck,
  // býr til körfu og skilar
  catchErrors(createBasket)
);

router.get(
  '/cart/:cartid',
  pagingQuerystringValidator,
  validationCheck,
  // skilar körfu með cartid og reiknuðu heildarverði
  catchErrors(listBasket)
);

router.post(
  '/cart/:cartid',
  pagingQuerystringValidator,
  validationCheck,
  // bætir vöru við í körfu
  catchErrors(addLineToBasket)
);

router.delete(
  '/cart/:cartid',
  pagingQuerystringValidator,
  validationCheck,
  // Eyðir körfu með cartid
  catchErrors(deleteBasket)
);

router.get(
  'cart/:cartid/line/:id',
  pagingQuerystringValidator,
  validationCheck,
  // skilar línu í körfu
  catchErrors(getLineFromBasket)
);

router.patch(
  'cart/:cartid/line/:id',
  pagingQuerystringValidator,
  validationCheck,
  // uppfærir fjölda í línu
  catchErrors(updateLineInBasket)
);

router.delete(
  'cart/:cartid/line/:id',
  pagingQuerystringValidator,
  validationCheck,
  // eyðir línu úr körfu
  catchErrors(deleteLineFromBasket)
);

// Routes fyrir pantanir

router.get(
  '/orders',
  requireAdmin,
  pagingQuerystringValidator,
  validationCheck,
  catchErrors(listOrders),
  // Skilar síðu af pöntunum
);

router.post(
  '/orders',
  catchErrors(createOrder),
  // býr til pöntun, skilar stöðu og auðkenni
);

router.get(
  '/orders/:id',
  // skilar pöntun með öllum línum, gildum pöntunar, stöðu pöntunar og reiknuðu heildarverði körfu
);

router.get(
  '/orders/:id/status',
  // skilar pöntun með stöðu pöntunar og lista af öllum stöðubreytingum hennar
);

router.post(
  '/orders/:id/status',
  requireAdmin,
  // uppfærir stöðu pöntunar, aðeins ef notandi er stjórnandi
);

// Routes fyrir notendur

router.get(
  '/users',
  requireAdmin,
  validationCheck,
  pagingQuerystringValidator,
  listUsers,
  // skilar síðu af notendum
);

router.get(
  '/users/:id',
  requireAdmin,
  validateResourceExists(listUser),
  validationCheck,
  returnResource,
  // Skilar notanda
);

router.patch(
  '/users/:id',
  requireAdmin,
  validateResourceExists(listUser),
  adminValidator,
  validationCheck,
  catchErrors(updateUser),
  // breytir hvort notandi er stjórnandi eða ekki, aðeins ef notandi er ekki að breyta sér sjálfum
);
