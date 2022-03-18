import express from 'express';
import multer from 'multer';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { requireAuthentication, requireAdmin, addUserIfAuthenticated } from '../auth/passport.js';
import { catchErrors } from '../utils/catchErrors.js';
import { readFile } from '../utils/fs-helpers.js';
import { listProductById, listProducts } from './products.js';



const {
  MULTER_TEMP_DIR,
} = process.env;

/**
 * Hjálparfall til að bæta multer við route.
 */
function withMulter(req, res, next) {
  multer({ dest: MULTER_TEMP_DIR })
    .single('image')(req, res, (err) => {
      if (err) {
        if (err.message === 'Unexpected field') {
          const errors = [{
            field: 'image',
            error: 'Unable to read image',
          }];
          return res.status(400).json({ errors });
        }

        return next(err);
      }

      return next();
    });
}

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
  catchErrors(listProducts)
);

router.post(
  '/menu',
  requireAdmin,
  /*býr til nýja vöru á matseðil*/
);

router.get(
  '/menu/:id',
  catchErrors(listProductById)
);

router.patch(
  '/menu/:id',
  requireAdmin,
  /*uppfærir vöru*/
);

router.delete(
  '/menu/:id',
  requireAdmin,
  /*eyðir vöru*/
);

router.get(
  '/categories',
  /*skilar síðu af flokkum*/
);

router.post(
  '/categories',
  /*býr til nýjan flokk*/
);

router.patch(
  '/categories/:id',
  requireAdmin,
  /*uppfærir flokk*/
);

router.delete(
  '/categories/:id',
  requireAdmin,
  /*eyðir flokk*/
);

// Routes fyrir körfu

router.post(
  '/cart',
  /*býr til körfu og skilar*/
);

router.get(
  '/cart/:cartid',
  /*skilar körfu með cartid og reiknuðu heildarverði*/
);

router.post(
  '/cart/:cartid',
  /*bætir vöru við í körfu*/
);

router.delete(
  '/cart/:cartid',
  /*Eyðir körfu með cartid*/
);

router.get(
  'cart/:cartid/line/:id',
  /*skilar línu í körfu*/
);

router.patch(
  'cart/:cartid/line/:id',
  /*uppfærir fjölda í línu*/
);

router.delete(
  'cart/:cartid/line/:id',
  /*eyðir línu úr körfu*/
);

// Routes fyrir pantanir

router.get(
  '/orders',
  requireAdmin,
  /*Skilar síðu af pöntunum*/
);

router.post(
  '/orders',
  /*býr til pöntun, skilar stöðu og auðkenni*/
);

router.get(
  '/orders/:id',
  /*skilar pöntun með öllum línum, gildum pöntunar, stöðu pöntunar og reiknuðu heildarverði körfu*/
);

router.get(
  '/orders/:id/status',
  /*skilar pöntun með stöðu pöntunar og lista af öllum stöðubreytingum hennar*/
);

router.post(
  '/orders/:id/status',
  requireAdmin,
  /*uppfærir stöðu pöntunar, aðeins ef notandi er stjórnandi*/
);

// Routes fyrir notendur

router.get(
  '/users',
  requireAdmin,
  /*skilar síðu af notendum*/
);

router.get(
  '/users/:id',
  requireAdmin,
  /*Skilar notanda*/
);

router.patch(
  '/users/:id',
  requireAdmin,
  /*breytir hvort notandi er stjórnandi eða ekki, aðeins ef notandi er ekki að breyta sér sjálfum*/
);

router.post(
  '/users/register',
  /*býr til nýjan (ekki admin) notanda*/
);

router.post(
  '/users/login',
  /* skilar token ef rétt gögn*/
);

router.get(
  '/users/me',
  requireAuthentication,
  /*skilar upplýsingum um notanda sem á token*/
);

router.patch(
  '/users/me',
  requireAuthentication,
  /*uppfærir netfang og/eða lykilorð*/
);
