-- vef2-2022-hop1 --

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- menu tables --

CREATE TABLE categories (
  id SERIAL PRIMARY KEY UNIQUE,
  name VARCHAR(64) NOT NULL UNIQUE
);

CREATE TABLE products (
  id SERIAL PRIMARY KEY UNIQUE,
  name VARCHAR(64) NOT NULL UNIQUE,
  prize INTEGER NOT NULL,
  description TEXT NOT NULL,
  image VARCHAR(255) NOT NULL,
  categorie INTEGER NOT NULL,
  created TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT FK_products_categories FOREIGN KEY (categorie) REFERENCES categories (id) ON DELETE CASCADE
);

-- basket tables --

CREATE TABLE basket (
  id uuid PRIMARY KEY UNIQUE,
  created TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE linesinbasket (
  productId INTEGER NOT NULL,
  basketId uuid NOT NULL,
  nrofproducts INTEGER NOT NULL,
  CONSTRAINT nrofprodnotnull check (nrofproducts > 0),
  CONSTRAINT FK_prod_product FOREIGN KEY (productId) REFERENCES products (id) ON DELETE CASCADE,
  CONSTRAINT FK_bask_basket FOREIGN KEY (basketId) REFERENCES basket (id) ON DELETE CASCADE
);

-- order tables --

CREATE TABLE anorder (
  id uuid PRIMARY KEY UNIQUE,
  created TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  name TEXT NOT NULL
);

CREATE TABLE linesinorder (
  productId INTEGER NOT NULL,
  basketId uuid NOT NULL,
  nrofproducts INTEGER NOT NULL,
  CONSTRAINT nrofprodnotnull check (nrofproducts > 0),
  CONSTRAINT FK_prod_product FOREIGN KEY (productId) REFERENCES products (id) ON DELETE CASCADE,
  CONSTRAINT FK_bask_basket FOREIGN KEY (basketId) REFERENCES basket (id) ON DELETE CASCADE
);

CREATE TYPE stateoforder AS ENUM ('NEW', 'PREPARE','COOKING', 'READY', 'FINISHED');

CREATE TABLE statusoforders (
  id SERIAL PRIMARY KEY,
  status stateoforder,
  created TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(256) NOT NULL,
  username VARCHAR(256) NOT NULL UNIQUE,
  email VARCHAR(256) NOT NULL UNIQUE,
  password VARCHAR(256) NOT NULL,
  admin BOOLEAN DEFAULT false,
  created TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT current_timestamp,
  updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT current_timestamp
);




