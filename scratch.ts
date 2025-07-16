function processUser({ name, age }) {
  console.log(`Name: ${name}, Age: ${age}`);
}

const userData = {
  firstName: 'Jane',
  userAge: 30
};

const userProxy = new Proxy(userData, {
  get(target, prop, receiver) {
    console.log(`Accessing property: ${prop}`);
    // Accessing property: name
    // Accessing property: age
    if (prop === 'name') {
      return target.firstName; // Map 'name' to 'firstName'
    }
    if (prop === 'age') {
      return target.userAge; // Map 'age' to 'userAge'
    }
    return Reflect.get(target, prop, receiver); // Default behavior for other properties
  }
});

processUser(userProxy); // Output: Name: Jane, Age: 30