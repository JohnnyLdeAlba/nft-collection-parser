const { t_psql } = require('./psql');
const { t_collection } = require('./attributes');
const { config } = require('../config');

class t_db_attributes extends t_psql {

  table_id;
  table;

  constructor(table_id) {

    super();

    this.table_id = config.psql_prefix + table_id;
    this.table = this.get_table();
  }

  get_table() {

    const table = this.create_psql_table(this.table_id);

    table.addItem("id", "SERIAL PRIMARY KEY");
    table.addItem("serial", "INT");
    table.addItem("hash", "VARCHAR(256) NOT NULL");

    table.addItem("token_id", "INT");
    table.addItem("collection_id", "INT");
    table.addItem("category_id", "INT");
    table.addItem("trait_id", "INT");

    table.addItem("default_id", "INT");
    table.addItem("chain_id", "INT");

    table.addItem("mandatory", "INT");
    table.addItem("priority", "INT");
    table.addItem("layer", "INT");
    table.addItem("width", "INT");
    table.addItem("height", "INT");
    table.addItem("opcodes", "INT[]");

    table.addItem("label", "VARCHAR(256) NOT NULL");
    table.addItem("description", "TEXT NOT NULL");

    table.addItem("media", "VARCHAR(1024) NOT NULL");
    table.addItem("image", "VARCHAR(1024) NOT NULL");
    table.addItem("preview", "VARCHAR(1024) NOT NULL");

    table.addItem("owner", "VARCHAR(255) NOT NULL");
    table.addItem("contract_address", "VARCHAR(256) NOT NULL");

    return table;
  }

  async create_table() {
    return await super.create_table(this.table);
  }

  async drop_table() {
    return await super.drop_table(this.table);
  }

  convert(attribute) {

    return [
      0,
      attribute.serial,
      attribute.hash,

      attribute.token_id,
      attribute.collection_id,
      attribute.category_id,
      attribute.trait_id,

      attribute.default_id,
      attribute.chain_id,

      attribute.mandatory,
      attribute.priority,
      attribute.layer,
      attribute.width,
      attribute.height,
      attribute.opcodes,

      attribute.label,
      attribute.description,

      attribute.media,
      attribute.image,
      attribute.preview,

      attribute.owner,
      attribute.contract_address
    ];
  }

  async insert(attribute) {

    const values = this.convert(attribute);
    return await super.table_insert(this.table, values);
  }

  async insert_all(attributes) {

    const _attributes = [];

    for (const attribute of attributes) {

      const response = await this.insert(attribute);
      if (response.code == -1)
        return response;

      attribute.id = response.payload;
      _attributes.push(attribute.copy());
    }

    return { code: 0, payload: _attributes };
  }

  async update(attribute) {

    attribute.serial = attribute.id;
    const values = this.convert(attribute);

    return await super.table_update(
      this.table,
      "id",
      attribute.id,
      values
    );
  }

  async update_all(attributes) {

    const _attributes = [];

    for (const attribute of attributes) {

      const response = await this.update(attribute);
      if (response.code == -1)
        return response;

      _attributes.push(attribute.copy());
    }

    return { code: 0, payload: _attributes };
  }

  async add(attribute) {

    if (attribute.id == 0 && attribute.serial == 0) {

      const response = await this.insert(attribute);
      if (response.code == -1)
        return response;

      attribute.id = response.payload;
    }
    
    attribute.serial = attribute.id;
    return await this.update(attribute);
  }

  async add_all(attributes) {

    const _attributes = [];

    for (const attribute of attributes) {

      const response = await this.add(attribute);
      if (response.code == -1)
        return response;

      _attributes.push(attribute.copy());
    }

    return { code: 0, payload: _attributes };
  }

  async count() {
    return await super.table_count(this.table);
  }

  async count_by(label, id) {
    return await super.table_count_by(this.table, label, id);
  }

  async select(id) {

    return await super.table_select(
      this.table, "id", id	
    );
  }

  async select_token(token_id) {

    return await super.table_select(
      this.table,
      "token_id",
      token_id	
    );
  }

  async select_collection(collection_id) {

    return await super.table_select(
      this.table,
      "collection_id",
      collection_id	
    );
  }

  async select_category(category_id) {

    return await super.table_select(
      this.table,
      "category_id",
      category_id	
    );
  }

  async select_trait(trait_id) {

    return await super.table_select(
      this.table,
      "trait_id",
      trait_id	
    );
  }

  async multi_select(values) {

    return await super.table_multi_select(
      this.table, "id", values);
  }

  async multi_select_tokens(values) {

    return await super.table_multi_select(
      this.table, "token_id", values);
  }

  async select_all(index, total) {

    return await super.table_select_all(
      this.table,
      "label",
      index,
      total
    );
  }

  async select_all_tokens(collection_id, index, total) {

    return await super.table_select_all_by(
      this.table,
      "collection_id",
      collection_id, 
      index,
      total,
      "label"
    );
  }

  async select_all_categories(collection_id, index, total) {

    return await super.table_select_all_by(
      this.table,
      "collection_id",
      collection_id, 
      index,
      total,
      "label"
    );
  }

  async select_all_traits(category_id, index, total) {

    return await super.table_select_all_by(
      this.table,
      "category_id",
      category_id, 
      index,
      total,
      "label"
    );
  }
}

exports.t_db_attributes = t_db_attributes;

class t_db_collection {

  tokens;
  collections;
  categories;
  traits;

  constructor() {

    this.tokens = new t_db_attributes("tokens");
    this.collections = new t_db_attributes("collections");
    this.categories = new t_db_attributes("categories");
    this.traits = new t_db_attributes("traits");
  }

  use(psql) {

    this.tokens.use(psql);
    this.collections.use(psql);
    this.categories.use(psql);
    this.traits.use(psql);;
  }

  async create_table() {

    let response = await this.tokens.create_table();
    if (response.code == -1)
      return response;

    response = await this.collections.create_table();
    if (response.code == -1)
      return response;

    response = await this.categories.create_table();
    if (response.code == -1)
      return response;

    response = await this.traits.create_table();
    if (response.code == -1)
      return response;

    return { code: 0, payload: null };
  }

  async drop_table() {

    let response = await this.tokens.drop_table();
    if (response.code == -1)
      return response;

    response = await this.collections.drop_table();
    if (response.code == -1)
      return response;

    response = await this.categories.drop_table();
    if (response.code == -1)
      return response;

    response = await this.traits.drop_table();
    if (response.code == -1)
      return response;

    return { code: -1, payload: null };
  }

  set_collection_id(collection) {
     
    const categories = collection.categories.get();
    for (const category of categories)
      category.collection_id = collection.id;

    const traits = collection.traits.get();
    for (const trait of traits)
      trait.collection_id = collection.id;
  }

  async insert_categories(collection) {

    const response = await this.categories
      .insert_all(collection.categories.get());
    if (response.code == -1)
      return response;

    collection.categories
      .updateAll(response.payload);

    return response;
  }

  async insert_collection(collection) {

    let response = await this.collections.insert(collection);
    if (response.code == -1)
      return response;

    collection.id = response.payload;
    this.set_collection_id(collection);

    response = await this.insert_categories(collection);
    if (response.code == -1)
      return response;

    const categories = collection.categories.get();
    const _traits = [];

    for (const category of categories) {

      const traits = collection.traits
        .getAllCategoryId(category.serial);

      for (const trait of traits) {

        trait.category_id = category.id;
        _traits.push(trait.copy());
      }
    }

    collection.traits.updateAll(_traits);

    response = await this.traits
      .insert_all(collection.traits.get());

    if (response.code == -1)
      return response;

    collection.updateSerialCategories();
    collection.updateSerialTraits();

    response = await this.categories
      .update_all(collection.categories.get());

    if (response.code == -1)
      return response;

    response = await this.traits
      .update_all(collection.traits.get());

    if (response.code == -1)
      return response;

    return { code: 0, payload: "INSERT_COLLECTION_SUCCESS" };
  }

  async update_collection(collection) {

    let response = await this.collections.update(collection);
    if (response.code == -1)
      return response;

    const categories = collection.categories.get();
    response = await this.categories
      .add_all(categories);
    if (response.code == -1)
      return response;

    const traits = collection.traits.get();
    response = await this.traits
      .add_all(traits);
    if (response.code == -1)
      return response;

    return { code: 0, payload: "UPDATE_COLLECTION_SUCCESS" };
  }

  async count_collections() {
    return await this.collections.count();
  }

  async count_categories(collection_id) {
    return await this.categories.count_by("collection_id", collection_id);
  }

  async count_traits(category_id) {
    return await this.traits.count_by("category_id", category_id);
  }

  async select_collection(id) {
    return await this.collections.select(id);
  }

  async select_category(id) {
    return await this.categories.select(id);
  }

  async select_trait(id) {
    return await this.traits.select(id);
  }

  async multi_select_categories(values) {
    return await this.categories.multi_select(values);
  }

  async multi_select_traits(values) {
    return await this.traits.multi_select(values);
  }

  async select_all_collections(index, total) {
    return await this.collections.select_all(index, total);
  }

  async select_all_categories(collection_id, index, total) {
    return await this.categories.select_all_categories(
      collection_id, index, total);
  }

  async select_all_traits(category_id, index, total) {

    return await this.traits.select_all_traits(
      category_id, index, total);
  }
}

exports.t_db_collection = t_db_collection;
