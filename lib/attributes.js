const Properties = {

  Mandatory: 1,
  Locked: 1 << 1,
  PlaceHolder: 1 << 2,
  Remove: 1 << 3,
  RemoveAll: 1 << 4
};

exports.Properties = Properties;

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

  type_mandatory() { return this.properties & Properties.Mandatory; }
  type_locked() { return this.properties & Properties.Locked; }
  type_place_holder() { return this.properties & Properties.PlaceHolder; }
  type_remove() { return this.properties & Properties.Remove; }
  type_remove_all() { return this.properties & Properties.RemoveAll; }

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

  get_serial(serial) {
    return this.attributes.find(
      attribute => attribute.serial == serial);
  }

  get_hash(hash) {
    return this.attributes.find(
      attribute => attribute.hash == hash);
  }

  get_collection(collection_id) {
    return this.attributes.find(
      attribute => attribute.collection_id == collection_id);
  }

  get_category(category_id) {
    return this.attributes.find(
      attribute => attribute.category_id == category_id);
  }

  get_trait(trait_id) {
    return this.attributes.find(
      attribute => attribute.trait_id == trait_id);
  }

  get_all_category_id(category_id) {

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

  push_all(attributes) {

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

    const _attribute = this.get_hash(attribute.hash);

    if (_attribute)
      return _attribute;

    attribute.serial = this.serial;
    this.serial++;

    this.push(attribute);
    return attribute;
  }

  convert_serial(serial) {

    const attribute = this.get_serial(serial)
    if (!attribute)
      return 0;

    return attribute.id;
  }

  convert_serial_array(array) {

    const _array = [];

    for (const serial of array) {

      const id = this.convert_serial(serial);
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

    this.categories.push_all(
      collection.categories.attributes);

    this.traits.push_all(
      collection.traits.attributes);
  }

  get_categories() {
    return this.categories.get();
  }

  push_category(category) {
    this.category.push(category);
  }

  push_all_categories(categories) {
    this.categories.push_all(categories);
  }

  update_categories(categories) {
    this.categories.update(categories);
  }

  get_traits() {
    return this.traits.get();;
  }

  push_trait(trait) {
    this.traits.push(trait);
  }

  push_all_traits(traits) {
    this.traits.push_all(traits);
  }

  update_traits(traits) {
    this.traits.update(traits);
  }

  // Parser Only

  convert_collection_serial() {
    this.serial = this.id;
  }

  convert_category_serials() {

    const categories = this.get_categories();

    let id = 0;
    let array = []

    for (const category of categories) {

      category.collection_id = this.id;

      id = this.categories.convert_serial(
        category.default_id);

      if (id) category.default_id = id;

      id = this.categories.convert_serial(
        category.alias_id);

      if (id) category.alias_id = id;

      array = this.traits.convert_serial_array(
        category.trait_filter);

      if (array.length)
        category.trait_filter = array;

      array = this.categories.convert_serial_array(
        category.chain);

      if (array.length)
        category.chain = array;
    }
  }

  convert_trait_serials() {

    const traits = this.get_traits();

    let id = 0;
    let array = []

    for (const trait of traits) {

      trait.collection_id = this.id;

      id = this.categories.convert_serial(
        trait.category_id);

      if (id) trait.category_id = id;

      id = this.traits.convert_serial(
        trait.default_id);

      if (id) trait.default_id = id;

      id = this.traits.convert_serial(
        trait.alias_id);

      if (id) trait.alias_id = id;

      array = this.traits.convert_serial_array(
        trait.trait_filter);

      if (array.length)
        trait.trait_filter = array;

      array = this.traits.convert_serial_array(
        trait.chain);

      if (array.length)
        trait.chain = array;
    }
  }

  update_serials() {

    const categories = this.get_categories();

    for (const category of categories)
      category.serial = category.id;

    const traits = this.get_traits();

    for (const trait of traits)
      trait.serial = trait.id;
  }
}

exports.t_collection = t_collection;
