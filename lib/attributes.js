const Attributes = {

  Mandatory: 1,
  PlaceHolder: 1 << 1,
  Remove: 1 << 2,
  RemoveAll: 1 << 3
};

exports.Attributes = Attributes;

class t_attribute {

  serial;
  id;
  hash;

  token_id;
  collection_id;
  category_id;

  properties;
  default_id;
  alias_id;
  trait_filter;
  chain;

  priority;
  layer;
  width;
  height;
  bytecode;

  label;
  description;
  media;
  animation_sheet;
  image;
  preview;

  owner;
  contract_address;

  constructor() {

    this.serial = 0;
    this.id = 0;
    this.hash = "";

    this.token_id = 0;
    this.collection_id = 0;
    this.category_id = 0;

    this.properties = 0;
    this.default_id = 0;
    this.alias_id = 0;
    this.trait_filter = [];
    this.chain = [];

    this.priority = 1;
    this.layer = 0;
    this.width = 0;
    this.height = 0;
    this.bytecode = [];

    this.label = "";
    this.description = "";

    this.media = "";
    this.animation_sheet = "";
    this.image = "";
    this.preview = "";

    this.owner = "";
    this.contract_address = "";
  }

  clone(attribute) {

    this.serial = attribute.serial;
    this.id = attribute.id;
    this.hash = attribute.hash;

    this.token_id = attribute.token_id;
    this.collection_id = attribute.collection_id;
    this.category_id = attribute.category_id;

    this.properties = attribute.properties;
    this.default_id = attribute.default_id;
    this.alias_id = attribute.alias_id;
    this.trait_filter = [ ...attribute.trait_filter ];
    this.chain = [ ...attribute.chain ];

    this.priority = attribute.priority;
    this.layer = attribute.layer;
    this.width = attribute.width;
    this.height = attribute.height;
    this.bytecode = attribute.bytecode;

    this.label = attribute.label;
    this.description = attribute.description;

    this.media = attribute.media;
    this.animation_sheet = attribute.animation_sheet;
    this.image = attribute.image;
    this.preview = attribute.preview;

    this.owner = attribute.owner;
    this.contract_address = attribute.contract_address;
  }

  copy() {

    const attribute = new t_attribute();

    attribute.serial = this.serial;
    attribute.id = this.id;
    attribute.hash = this.hash;

    attribute.token_id = this.token_id;
    attribute.collection_id = this.collection_id;
    attribute.category_id = this.category_id;

    attribute.properties = this.properties;
    attribute.default_id = this.default_id;
    attribute.alias_id = this.alias_id;
    attribute.trait_filter = [ ...this.trait_filter ];
    attribute.chain = [ ...this.chain ];

    attribute.priority = this.priority;
    attribute.layer = this.layer;
    attribute.width = this.width;
    attribute.height = this.height;
    attribute.bytecode = this.bytecode;

    attribute.label = this.label;
    attribute.description = this.description;

    attribute.media = this.media;
    attribute.animation_sheet = this.animation_sheet;
    attribute.image = this.image;
    attribute.preview = this.preview;
   
    attribute.owner = this.owner;
    attribute.contract_address = this.contract_address;

    return attribute;
  }

  filter_trait_id(trait_id) {
    this.trait_filter.push(trait_id);
  }

  add_chain_link(id) {
    this.chain.push(id);
  }

  type_abstract() {

    return this.media == '' &&
      this.animation_sheet == '' &&
      this.image == '';
  }

  type_mandatory() { return this.properties & Attributes.Mandatory; }
  type_place_holder() { return this.properties & Attributes.PlaceHolder; }
  type_remove() { return this.properties & Attributes.Remove; }
  type_remove_all() { return this.properties & Attributes.RemoveAll; }

  type_alias() { return this.alias_id > 0; }
  type_chain() { return this.chain.length > 0; }
  type_dynamic() { return this.media == '' ? false : true }
  type_gif() { return this.animation_sheet = '' ? false : true }
  type_common() { return !this.type_dynamic() && !this.type_gif(); }
}

exports.t_attribute = t_attribute;

class t_attributes {

  serial;
  attributes;

  constructor() {

    this.serial = 1;
    this.attributes = [];
  }

  get() {
    return this.attributes;
  }

  getSerial(serial) {
    return this.attributes.find(
      attribute => attribute.serial == serial);
  }

  getHash(hash) {
    return this.attributes.find(
      attribute => attribute.hash == hash);
  }

  getCollection(collection_id) {
    return this.attributes.find(
      attribute => attribute.collection_id == collection_id);
  }

  getCategory(category_id) {
    return this.attributes.find(
      attribute => attribute.category_id == category_id);
  }

  getTrait(trait_id) {
    return this.attributes.find(
      attribute => attribute.trait_id == trait_id);
  }

  getAllCategoryId(category_id) {

    const attributes = this.attributes.filter(
      attribute => attribute.category_id == category_id);

    return attributes ? attributes : [];
  }

  push(attribute) {

    const _attribute = new t_attribute();
    _attribute.clone(attribute);

    this.attributes.push(_attribute);
    return _attribute;
  }

  pushAll(attributes) {

    for (const attribute of attributes)
      this.push(attribute);
  }

  update(attributes) {

    this.attributes = [];

    for (const attribute of attributes)
      this.push(attribute);
  }

  // Parser Only

  add(attribute) {

    const _attribute = this.getHash(attribute.hash);

    if (_attribute)
      return _attribute;

    attribute.serial = this.serial;
    this.serial++;

    this.push(attribute);
    return attribute;
  }

  convertSerial(serial) {

    const attribute = this.getSerial(serial)
    if (!attribute)
      return 0;

    return attribute.id;
  }

  convertSerialArray(array) {

    const _array = [];

    for (const serial of array) {

      const id = this.convertSerial(serial);
      if (id) _array.push(id);
    }

    return _array;
  }
}

exports.t_attributes = t_attributes;

class t_collection extends t_attribute {

  categories;
  traits;

  constructor() {

    super();

    this.categories = new t_attributes();
    this.traits = new t_attributes();
  }

  push(collection) {

    this.categories.pushAll(
      collection.categories.attributes);

    this.traits.pushAll(
      collection.traits.attributes);
  }

  getCategories() {
    return this.categories.get();
  }

  getTraits() {
    return this.traits.get();;
  }

  // Parser Only

  convertCollectionSerial() {
    this.serial = this.id;
  }

  convertCategorySerials() {

    const categories = this.getCategories();

    let id = 0;
    let array = []

    for (const category of categories) {

      category.collection_id = this.id;

      id = this.categories.convertSerial(
        category.default_id);

      if (id) category.default_id = id;

      id = this.categories.convertSerial(
        category.alias_id);

      if (id) category.alias_id = id;

      array = this.traits.convertSerialArray(
        category.trait_filter);

      if (array.length)
        category.trait_filter = array;

      array = this.categories.convertSerialArray(
        category.chain);

      if (array.length)
        category.chain = array;
    }
  }

  convertTraitSerials() {

    const traits = this.getTraits();

    let id = 0;
    let array = []

    for (const trait of traits) {

      trait.collection_id = this.id;

      id = this.categories.convertSerial(
        trait.category_id);

      if (id) trait.category_id = id;

      id = this.traits.convertSerial(
        trait.default_id);

      if (id) trait.default_id = id;

      id = this.traits.convertSerial(
        trait.alias_id);

      if (id) trait.alias_id = id;

      array = this.traits.convertSerialArray(
        trait.trait_filter);

      if (array.length)
        trait.trait_filter = array;

      array = this.traits.convertSerialArray(
        trait.chain);

      if (array.length)
        trait.chain = array;
    }
  }

  updateSerials() {

    const categories = this.getCategories();

    for (const category of categories)
      category.serial = category.id;

    const traits = this.getTraits();

    for (const trait of traits)
      trait.serial = trait.id;
  }
}

exports.t_collection = t_collection;
