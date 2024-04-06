import * as v from 'valibot';

try {
	const schema = v.pipe(
		v.string(),
		v.regex(/^\d+px$/),
		v.transform(parseInt),
		v.number(),
		v.maxValue(100)
	 );
	const schema = v.transform(v.string([v.length(2)]), );
	// const schema2 =

  const profile = v.parse(
		schema,
    "hola",
  );

  console.log(profile)

  // Handle errors if one occurs
} catch (error) {
  console.log(error);
}
