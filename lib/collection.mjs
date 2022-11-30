import { utils } from 'ethers';

import {
  base64,
  createJSONDatabase,
  getSubDirectories,
  getImageFilenames
} from './utils.mjs';

export class t_collection {

  collection_id;
  category_id;
  trait_id;

  hash;
  label;
  previewURI;
  mediaURI;
  bitmapIndex;
  metadata;

  categories;
  traits;

  constructor() {

    this.collection_id = 0;
    this.category_id = 0;
    this.trait_id = 0;

    this.hash = "";
    this.label = "";
    this.previewURI = "";
    this.mediaURI = "";
    this.bitmapIndex = 0;
    this.metadata = null;

    this.categories = [];
    this.traits = [];
  }

  createHash(string) {

    this.hash = base64(string);
    return this.hash;
  }

  createMetadata() {

    return {

      immutable: true,
      label: "",
      previewURI: "",
      mediaURI: ""
    };
  }

  createItem() {
    return t_collection();
  }

  getCategoryByHash(hash) {

    const category = this.categories.find(category => category.hash == hash);

    if (typeof category == "undefined")
      return null;

    return category;
  }

  getCategory(id) {

    if (typeof id == "string" || id instanceof String)
      return this.getCategoryByHash(id);

    const category = this.categories.find(category => category.category_id == id);
    if (typeof category == "undefined")
      return null;

    return category;
  }

  addCategory(trait) {
    this.categories.push(trait);
  }

  getTraitByHash(category, hash) {

    const trait = category.traits.find(trait => trait.hash == hash);
    if (typeof trait == "undefined")
      return null;

    return trait;
  }

  getTrait(category, id) {

    if (typeof id == "string" || id instanceof String)
      return this.getTraitByHash(category, id);

    const trait = category.traits.find(trait => trait.trait_id == id);
    if (typeof trait == "undefined")
      return null;

    return trait;
  }

  addTrait(category, trait) {
    category.traits.push(trait);
  }

  set_label(label) {

    this.label = label;
    this.hash = base64(label);

    this.media = label
      .toLowerCase()
      .replace(/ |-/g, '_');

    this.metadata = this.createMetadata();
    this.metadata.label = this.label;
  }

  parse_os_category(trait_type) {

    const category_hash = base64(trait_type);
    const category = (() => { 

      const category = this.getCategory(category_hash);

      if (category == null)
        return new t_collection();

        return category;
      })();

      if (category.hash != "")
        return category;
  
      category.createHash(trait_type);
      category.label = trait_type;

      category.metadata = category.createMetadata();
      category.metadata.label = trait_type,

      this.addCategory(category);
      return category;
  }

  parse_os_trait(category, value) {

    const trait_hash = base64(value);
    const trait = (() => {

    const trait = this.getTrait(category, trait_hash);

      if (trait == null)
        return new t_collection();

        return null;
    })();
	  
    if (trait == null)
      return;

    trait.createHash(value);
    trait.label = value;

    trait.metadata = trait.createMetadata();
    trait.metadata.label = value,

    this.addTrait(
      category,
      trait
    );
  }

  async parse_os_collection(path) {

    const collection = new t_collection();

    const database = await createJSONDatabase(path);
    if (database == null)
      return { code: -1, payload: "PARSE_COLLECTION_FAILED" };

    for (const json of database) {

      if (typeof json.attributes == "undefined")
        continue

      for (const attribute of json.attributes) {

        const trait_type = attribute.trait_type;
        const value = attribute.value;

        const category = this.parse_os_category(trait_type);
        this.parse_os_trait(category, value);
      }  
    }

    return { code: 0, payload: "PARSE_COLLECTION_SUCCESS" }
  }

  async parse_trait_media(dir, traits, setMediaURI) {

    let response = await getImageFilenames(dir);
    if (response.code == -1)
      return response;

    const traitMedia = response.payload;

    for (const trait of traits) {

      const label = trait.label
        .toLowerCase()
        .replace(/ |-/g, '_');

      for (const image of traitMedia) {

        if (label == image.label) {

          setMediaURI(
	    trait, `${dir}/${image.filename}`
	  );
        }
      }
    }
  }  

  async parse_all_media(dir, setMediaURI) {

    if (typeof setMediaURI == "undefined") {

      setMediaURI = (item, value) => {

        item.mediaURI = value;
	item.metadata.mediaURI = value;
      }
    }

    let response = await getImageFilenames(dir);
    // if (response.code == -1)
    //  return response;

    console.log(response);

    const categoryMedia = response.payload;

    response = await getSubDirectories(dir);
    if (response.code == -1)
      return response;

    const directories = response.payload;

    const collection_label = this.label
      .toLowerCase()
      .replace(/ |-/g, '_');

    for (const category of this.categories) {

      const label = category.label
        .toLowerCase()
        .replace(/ |-/g, '_');

      for (const image of categoryMedia) {

        if (collection_label == image.label) {

          setMediaURI(
            this,
            `${dir}/${image.filename}`
	  );
        }
        else if (label == image.label) {

          setMediaURI(
            category,
            `${dir}/${image.filename}`
	  );
        }
      }

      for (const sub_dir of directories) {

        if (label == sub_dir) {

	  await this.parse_trait_media(
            `${dir}/${sub_dir}`,
            category.traits,
            setMediaURI
	  );
        }
      }
    }

    return { code: 0, payload: "PARSE_MEDIA_SUCCESS" }
  }

  async parse_all_previews(dir, setMediaURI) {

    if (typeof setMediaURI == "undefined") {

      setMediaURI = (item, value) => {

        item.previewURI = value;
	item.metadata.previewURI = value;
      }
    }

    return await this.parse_all_media(dir, setMediaURI);
 }
}
