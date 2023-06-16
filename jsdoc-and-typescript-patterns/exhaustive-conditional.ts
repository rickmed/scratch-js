type Fish = { swim: () => void };
type Bird = { fly: () => void };
type Dog = { bark: () => void };

type Animal = Fish | Bird | Dog

function move(animal: Animal) {
  if ("swim" in animal) {
    return animal.swim();
  }
  if ("fly" in animal) {
    return animal.fly();
  }
  return exhaustiveCheck(animal)  // does not typecheck bc not handling Dog
}


function exhaustiveCheck( param: never ): never {
  throw new Error( 'should not reach here' )
}