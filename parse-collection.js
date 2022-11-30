const { t_attribute, t_collection } = require('./lib/attributes');

const {
  getDirectories,
  getImageFiles,
  readOSCollection,
  parseOSCollection,
  readCollection,
  writeCollection,
  parseTraitImages,
  readTraitImages
} = require('./lib/parse-lib');

class t_collection_parser {

  serial;
  collection;

  constructor() {

    this.serial = 0;
    this.collection = new t_collection();
  }

  async db_insert_collection(collection) { return this.serial++; }
  async db_insert_category(category) { return this.serial++; }
  async db_insert_trait(trait) { return this.serial++; }

  async db_update_collection(collection) { return 0; }
  async db_update_category(category) { return 0; }
  async db_update_trait(trait) { return 0; }

  async readOSCollection(dir) {
    return await readOSCollection(dir);
  }

  parseOSCollection(os_collection) {
    this.collection =  parseOSCollection(os_collection);
  }

  async readTraitImages(dir) {
    return await readTraitImages(this.collection, dir)
  }

  async writeCollection(filename) {
    return await writeCollection(filename, this.collection);
  }

  async readCollection(filename) {

    const collection = await readCollection(filename);
    if (!collection)
      return -1;

    this.collection = collection;
    return 0;
  }

  async updateCollection() {

    let result = 0;

    result = await this.db_update_collection(this.collection);
    if (result == -1)
      return -1;

    const categories = this.collection.getCategories();
    for (const category of categories) {

      result = await this.db_update_category(category);
      if (result == -1)
        return -1;
    }

    const traits = this.collection.getTraits();
    for (const trait of traits) {

      result = await this.db_update_trait(trait);
      if (result == -1)
        return -1;
    }

    return 0;
  }

  async insertCollection() {

    const collection_id = await this.db_insert_collection(this.collection);
    if (collection_id == -1)
      return -1;

    const categories = this.collection.getCategories();
    for (const category of categories) {

      const category_id = await this.db_insert_category(category);
      if (category_id == -1)
        return -1;

      category.id = category_id;
    }

    const traits = this.collection.getTraits();
    for (const trait of traits) {

      const trait_id = await this.db_insert_trait(trait);
      if (trait_id == -1)
        return -1;

      trait.id = trait_id;
    }

    this.collection.convertCollectionSerial();
    this.collection.convertCategorySerials();
    this.collection.convertTraitSerials();

    let result = await this.updateCollection();
    if (result == -1)
      return -t;

    this.collection.updateSerials();
    return 0;
  }

  async mergeCollection(collection) {

    const collection_id = await this.db_insert_collection(collection);
    if (collection_id == -1)
      return -1;

    const categories = collection.getCategories();
    for (const category of categories) {

      const category_id = await this.db_insert_category(category);
      if (category_id == -1)
        return -1;

      category.id = category_id;
    }

    const traits = collection.getTraits();
    for (const trait of traits) {

      const trait_id = await this.db_insert_trait(trait);
      if (trait_id == -1)
        return -1;

      trait.id = trait_id;
    }

    collection.convertCollectionSerial();
    collection.convertCategorySerials();
    collection.convertTraitSerials();

    let result = await this.updateCollection();
    if (result == -1)
      return -t;

    collection.updateSerials();
    this.collection.push(collection);

    return 0;
  }
}

async function plague_parse_collection(type, dir) {

  const parser = new t_collection_parser();

  const os_collection = await parser.readOSCollection(
    "collections/the-plague-nft/metadata");

  const _os_collection = [];

  for (const [ tokenId, metadata ] of os_collection) {

    for (const attribute of metadata.attributes) {

      const category = attribute.trait_type;
      if (category == "Type") {

        const trait_value = attribute.value;
	if (trait_value == type)
          _os_collection.push([ tokenId, metadata ]); break;
      }
    }
  }

  parser.parseOSCollection(_os_collection);
  if (typeof dir == 'undefined')
    return parser.collection;

  await parser.readTraitImages(dir);
  return parser.collection;
}

async function parse_collection() {

  const one_collection = await plague_parse_collection("1 of 1");
  const og_collection = await plague_parse_collection("OG", "collections/the-plague-nft/images/og");
  const army_collection = await plague_parse_collection("Army", "collections/the-plague-nft/images/army");

  const parser = new t_collection_parser();

  await parser.mergeCollection(one_collection);
  await parser.mergeCollection(og_collection);
  await parser.mergeCollection(army_collection);

  await parser.writeCollection("the-plague-nft.json");

  process.exit();
}

async function read_collection() {

  let parser = new t_collection_parser();

  await parser.readCollection("the-plague-nft-og.json");
  await parser.insertCollection();
  await parser.writeCollection("the-plague-nft-og.json");

  process.exit();
}

parse_collection();
// read_collection();
