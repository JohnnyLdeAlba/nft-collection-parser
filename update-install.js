const { t_psql } = require('./lib/psql');
const { t_attribute, t_collection } = require('./lib/attributes');
const { t_db_collection } = require('./lib/db-collection');

const {
  getDirectories,
  getImageFiles,
  readOSCollection,
  parseOSCollection,
  readCollection,
  writeCollection
} = require('./lib/parse-media');

const { config } = require('./config');
const { plague_collection } = require('./the-plague-nft');

function tag_categories(collection, serial) {

  const categories = collection.categories.get();

  for (const category of categories)
    category.trait_id = serial;

  collection.categories.updateAll(categories);
}

function parse_filename(filename) {

  return filename
    .toLowerCase()
    .replace(/\.[a-z]+$/g, '')
    .replace(/[ |-|_]/g, '-');
}

function parse_hash(hash) {

  return hash
    .toLowerCase()
    .replace(/[ |-|_]/g, '-');
}

async function parseTraitMedia(collection, dir) {

  const directories = await getDirectories(dir);
  const traits = [];

  for (const subdir of directories) {

    const files = await getImageFiles(`${dir}/${subdir}`);

    const category_hash = parse_hash(subdir);
    const categories = collection
      .categories.get();

    const category = categories.find(category => {

      const hash = parse_hash(category.hash);
      return category_hash == hash;
    });

    if (!category)
      continue;

    for (const file of files) {

      const hash = parse_filename(file);
      const trait = new t_attribute();

      trait.category_id = category.serial;
      trait.hash = hash;
      trait.image_file = `${dir}/${subdir}/${file}`;
      trait.preview_file = `${dir}/${subdir}/${file}`;

      traits.push(trait);
    }
  }

  return traits;
}

async function plague_parse_trait_media(os_collection, dir) {

  const collection = parseOSCollection(os_collection);

  const traits = await parseTraitMedia(
    collection, dir);

  for (const trait of traits) {

    trait.hash = trait.hash.replace("og-", '');
    trait.hash = trait.hash.replace("army-", '');

    const trait_hash = trait.hash;

    const _traits = collection.traits.get();
    const _trait = _traits.find(trait => {

      const hash = parse_hash(trait.hash);
      return trait_hash == hash;
    });

    if (!_trait)
      continue;

    const preview_file = trait.image_file.replace("images", "previews");

    _trait.category_id = trait.category_id;
    _trait.image_file = trait.image_file;
    _trait.preview_file = preview_file;
  }

  return collection;
}

async function plague_parse_collection() {

  const os_collection = await readOSCollection(
    "collections/the-plague-nft/metadata");

  let one_collection = [];
  let og_collection = [];
  let army_collection = [];

  for (const [ tokenId, metadata ] of os_collection) {

    for (const attribute of metadata.attributes) {

      const category = attribute.trait_type;
      if (category == "Type") {

        const trait = attribute.value;
        switch  (trait) {

          case "1 of 1": one_collection.push([ tokenId, metadata ]); break;
          case "OG": og_collection.push([ tokenId, metadata ]); break;
          case "Army": army_collection.push([ tokenId, metadata ]); break;
	}
      }
    }
  }

  one_collection = parseOSCollection(one_collection);

  og_collection = await plague_parse_trait_media(
    og_collection, "collections/the-plague-nft/images/og");

  army_collection = await plague_parse_trait_media(
    army_collection, "collections/the-plague-nft/images/army");

  tag_categories(one_collection, 9000);
  tag_categories(og_collection, 9001);
  tag_categories(army_collection, 9002);

  const collection = new t_collection();

  collection.merge(one_collection, 1000);
  collection.merge(og_collection, 2000);
  collection.merge(army_collection, 3000);

  return collection;
}

async function update() {

  const psql = new t_psql();
  const db_collection = new t_db_collection();

  psql.create_session(
    config.psql_username,
    config.psql_password,
    config.psql_database,
    config.psql_host,
    config.psql_port
  );

  let response = await psql.connect();
  if (response.code == -1)
    throw response;

  db_collection.use(psql);

  const collection = new t_collection();
  collection.add(plague_collection);

  db_collection.use(psql);
  await db_collection.drop_table();

  response = await db_collection
    .create_table();
  if (response.code == -1)
    throw response;

  response = await db_collection
    .insert_collection(collection);
  if (response.code == -1)
    throw response;

  response = await writeCollection(
    "the-plague-nft.json", collection);

  response = await db_collection
    .select_all_traits(20, 0, 100);
  if (response.code == -1)
    throw response;

  console.log(response.payload);

  process.exit();
}

try { update(); }
catch(response) {
  console.log(response);
}
