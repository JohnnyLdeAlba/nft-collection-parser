
export class t_binary_node {

  id;
  resource;

  left;
  right;

  constructor() {

    this.id = 0;
    this.resource = null;
    this.left = null;
    this.right = null;
  }
}

export class t_binary_tree {

  root;

  constructor() {
    this.root = new t_binary_node();
  }

  add_node(id, resource, root) {

    if (typeof root == "undefined")
      root = this.root;

    if (root.resource == null) {

      root.id = id;
      root.resource = resource;
    }
    else if (id < root.id) {

      if (root.left == null) {

        root.left = new t_binary_node();
	root.left.id = id;
	root.left.resource = resource;

        return;
      }

      this.add_node(id, resource, root.left); 
    }
    else if (id > root.id) {

      if (root.right == null) {

        root.right = new t_binary_node();
        root.right.id = id;
	root.right.resource = resource;

        return;
      }

      this.add_node(id, resource, root.right); 
    }
    else {

      root.id = id;
      root.resource = resource;
    }
  }

  search(id, root) {

    if (typeof root == "undefined")
      root = this.root;
    else if (root == null)
      return new t_binary_tree();

    if (id < root.id)
      return this.search(id, root.left);
    else if (id > root.id)
      return this.search(id, root.right);
    
    return root;
  }

  asc(root, array) {

    if (typeof root == "undefined")
      root = this.root;
    if (typeof array == "undefined")
      array = [];

    if (root == null)
      return;

    this.asc(root.left, array);
    array.push(root.resource);
    this.asc(root.right, array);

    return array;
  }

  desc(root, array) {

    if (typeof root == "undefined")
      root = this.root;
    if (typeof array == "undefined")
      array = [];

    if (root == null)
      return;

    this.asc(root.right, array);
    array.push(root.resource);
    this.asc(root.left, array);

    return array;
  }

  array() {
    return this.asc();
  }
}

