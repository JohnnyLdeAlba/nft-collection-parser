const fs = require('fs/promises');
const { t_attribute, t_attributes, t_collection } = require('./attributes');

async function get_directories(dir) {

  const filenames = await fs.readdir(dir)
    .catch(error => null);

  if (filenames == null)
    return [];

  const directories = [];

  for (const filename of filenames) {

    const stats = await fs.lstat(`${dir}/${filename}`);
    if (!stats.isDirectory())
      continue;

    directories.push(filename);
  }

  if (directories.length == 0)
    return [];

  return directories;
}

exports.get_directories = get_directories;

async function get_image_files(dir) {

  const filenames = await fs.readdir(dir)
    .catch(error => null);

  if (filenames == null)
    return [];

  const imageFiles = [];

  for (const filename of filenames) {

    const isImage = filename.search(/\.png|\.jpg|\.jpeg|\.gif$/) == -1 
      ? false : true;

    if (!isImage)
      continue;

    imageFiles.push(filename);
  }

  if (imageFiles.length == 0)
    return [];

  return imageFiles;
}

exports.get_image_files = get_image_files;

async function read_os_metadata(filename) {

  const stats = await fs.lstat(filename);
  if (!stats.isFile())
    return null;

  if (filename.search(/[0-9]+[\.json]?$/) == -1)
    return null;

  const match = filename.match(/([0-9]+)/);
  const tokenId = match == null ? -1 : match[0];

  const data = await fs.readFile(filename)
    .catch(error => null);

  if (!data)
    return null;

  let metadata = null;

  try { metadata = await JSON.parse(data); }
  catch { return null; }

  return [ tokenId, metadata ];
}

exports.read_os_metadata = read_os_metadata;

async function read_os_collection(dir) {

  const filenames = await fs.readdir(dir)
    .catch(error => null);

  if (filenames == null)
    return null;

  const osCollection = [];

  for (const filename of filenames) {

    const metadata = await read_os_metadata(`${dir}/${filename}`);

    if (metadata)
      osCollection.push(metadata);
  }

  return osCollection;
}

exports.read_os_collection = read_os_collection;

function parse_os_collection(osCollection) {

  const collection = new t_collection();
  const categories = new t_attributes();
  const traits = new t_attributes();

  for (const [ tokenId, metadata ] of osCollection) {

    if (typeof metadata.attributes == "undefined")
      continue;

    for (const attribute of metadata.attributes) {

      const trait_type = attribute.trait_type;
      const value = attribute.value;

      let category = new t_attribute();;
      let trait = new t_attribute();

      category.hash = trait_type;
      category.label = trait_type;
      category.mandatory = 1;
      category = categories.add(category);

      trait.category_id = category.serial;
      trait.hash = value;
      trait.label = value;
      trait = traits.add(trait);
    }  
  }

  collection.categories = categories;
  collection.traits = traits;

  return collection;
}

exports.parse_os_collection = parse_os_collection;

function hash_from_filename(filename) {

  return filename
    .toLowerCase()
    .replace(/\.[a-z]+$/g, '')
    .replace(/[ |-|_]/g, '-');
}

function hashFromDir(hash) {

  return hash
    .toLowerCase()
    .replace(/[ |-|_]/g, '-');
}

async function parse_trait_images(collection, dir) {

  const directories = await get_directories(dir);
  const traits = [];

  for (const subdir of directories) {

    const files = await get_image_files(`${dir}/${subdir}`);

    const category_hash = hashFromDir(subdir);
    const categories = collection
      .categories.get();

    const category = categories.find(category => {

      const hash = hashFromDir(category.hash);
      return category_hash == hash;
    });

    if (!category)
      continue;

    for (const file of files) {

      const hash = hash_from_filename(file);
      const trait = new t_attribute();

      trait.category_id = category.serial;
      trait.hash = hash;
      trait.image = `${dir}/${subdir}/${file}`;

      traits.push(trait);
    }
  }

  return traits;
}

exports.parse_trait_images = parse_trait_images;

async function read_trait_images(collection, dir) {

  const traits = await parse_trait_images(
    collection, dir);

  for (const trait of traits) {

    const trait_hash = trait.hash;

    const _traits = collection.traits.get();
    const _trait = _traits.find(trait => {

      const hash = hashFromDir(trait.hash);
      return trait_hash == hash;
    });

    if (!_trait)
      continue;

    _trait.category_id = trait.category_id;
    _trait.image = trait.image;
  }

  return collection;
}

exports.read_trait_images = read_trait_images;

async function read_collection(filename) {

  const rawCollection = await fs.readFile(filename)
    .catch(error => null);

  if (!rawCollection)
    return null;

  const jsonCollection = JSON.parse(rawCollection);

  const collection = new t_collection();
  collection.push(jsonCollection);

  return collection;
}

exports.read_collection = read_collection;

async function write_collection(filename, collection) {

  const json = JSON.stringify(collection, null, 2);

  return await fs.writeFile(filename, json)
    .catch(error => false) ? true : false;
}

exports.write_collection = write_collection;
