const { t_attribute, t_collection } = require('./lib/attributes');

const {
  get_directories,
  get_image_files,
  read_os_collection,
  parse_os_collection,
  read_collection,
  write_collection,
  parseTraitImages,
  read_trait_images
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

  async read_os_collection(dir) {
    return await read_os_collection(dir);
  }

  parse_os_collection(os_collection) {
    this.collection =  parse_os_collection(os_collection);
  }

  async read_trait_images(dir) {
    return await read_trait_images(this.collection, dir)
  }

  async write_collection(filename) {
    return await write_collection(filename, this.collection);
  }

  async read_collection(filename) {

    const collection = await read_collection(filename);
    if (!collection)
      return -1;

    this.collection = collection;
    return 0;
  }

  async update_collection() {

    let result = 0;

    result = await this.db_update_collection(this.collection);
    if (result == -1)
      return -1;

    const categories = this.collection.get_categories();
    for (const category of categories) {

      result = await this.db_update_category(category);
      if (result == -1)
        return -1;
    }

    const traits = this.collection.get_traits();
    for (const trait of traits) {

      result = await this.db_update_trait(trait);
      if (result == -1)
        return -1;
    }

    return 0;
  }

  async insert_collection() {

    const collection_id = await this.db_insert_collection(this.collection);
    if (collection_id == -1)
      return -1;

    const categories = this.collection.get_categories();
    for (const category of categories) {

      const category_id = await this.db_insert_category(category);
      if (category_id == -1)
        return -1;

      category.id = category_id;
    }

    const traits = this.collection.get_traits();
    for (const trait of traits) {

      const trait_id = await this.db_insert_trait(trait);
      if (trait_id == -1)
        return -1;

      trait.id = trait_id;
    }

    this.collection.convert_collection_serial();
    this.collection.convert_category_serials();
    this.collection.convert_trait_serials();

    let result = await this.update_collection();
    if (result == -1)
      return -t;

    this.collection.update_serials();
    return 0;
  }

  async merge_collection(collection) {

    const collection_id = await this.db_insert_collection(collection);
    if (collection_id == -1)
      return -1;

    const categories = collection.get_categories();
    for (const category of categories) {

      const category_id = await this.db_insert_category(category);
      if (category_id == -1)
        return -1;

      category.id = category_id;
    }

    const traits = collection.get_traits();
    for (const trait of traits) {

      const trait_id = await this.db_insert_trait(trait);
      if (trait_id == -1)
        return -1;

      trait.id = trait_id;
    }

    collection.convert_collection_serial();
    collection.convert_category_serials();
    collection.convert_trait_serials();

    let result = await this.update_collection();
    if (result == -1)
      return -t;

    collection.update_serials();
    this.collection.push(collection);

    return 0;
  }
}

async function plague_parse_collection(type, dir) {

  const parser = new t_collection_parser();

  const os_collection = await parser.read_os_collection(
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

  parser.parse_os_collection(_os_collection);
  
  const collection = parser.collection;
  const trait = collection.traits.get_hash(type);

  if (trait) {

    collection.get_categories()
      .map(category => {

        category.filter.push(trait.serial);
        return category;
    });
  }

  if (typeof dir == 'undefined')
    return parser.collection;

  await parser.read_trait_images(dir);
  return parser.collection;
}

async function parse_collection() {

  const one_collection = await plague_parse_collection("1 of 1");
  const og_collection = await plague_parse_collection("OG", "collections/the-plague-nft/images/og");
  const army_collection = await plague_parse_collection("Army", "collections/the-plague-nft/images/army");

  const parser = new t_collection_parser();

  await parser.merge_collection(one_collection);
  await parser.merge_collection(og_collection);
  await parser.merge_collection(army_collection);

  await parser.write_collection("the-plague-nft.json");

  process.exit();
}

async function load_collection() {

  let parser = new t_collection_parser();

  await parser.read_collection("the-plague-nft-og.json");
  await parser.insert_collection();
  await parser.write_collection("the-plague-nft-og.json");

  process.exit();
}

parse_collection();
// load_collection();
