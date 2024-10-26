/*
Functions that call PokéAPI

https://pokeapi.co/docs/v2
*/

export function generatePokemon() {
  // Fetch json of all available pokemon up to a limit of 2000 (~1200 avilable)
  return (
    fetch("https://pokeapi.co/api/v2/pokemon/?limit=2000")
      // Parse to json
      .then((res) => {
        return res.json();
      })
      // Extract results
      .then((json) => {
        return json.results;
      })
      // Return random item from list
      .then((resultList) => {
        return resultList[Math.floor(Math.random() * resultList.length)];
      })
  );
}

// Fetches the sprite using the pokemon's api url
export function fetchSprite(url) {
  return (
    fetch(url)
      // Converts result to json
      .then((res) => {
        return res.json();
      })
      // returns the url of the sprite
      .then((json) => {
        return json.sprites;
      })
  );
}

// Fetches the pokemon's names in different languages
export function fetchNames(nameOrId) {
  return (
    fetch(`https://pokeapi.co/api/v2/pokemon-species/${nameOrId}/`)
      // Parse to json
      .then((res) => res.json())
      // Get names as array
      .then((json) => json.names)
      // Format names
      .then((names) => {
        let resultNames = [];
        for (let i = 0; i < names.length; i++) {
          resultNames.push({
            languageName: names[i].language.name,
            languageUrl: names[i].language.url,
            name: names[i].name,
          });
        }
        return resultNames;
      })
      .catch((err) => {
        // For example id 10220 gives back Not Found (404)
        return null;
      })
  );
}
