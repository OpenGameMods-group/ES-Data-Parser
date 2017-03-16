const fs = require('fs');

const attrSelector = require('../util/attributeSelector');

// regular expressions
const shipReg =  /ship "([\s\S]*?)((?=ship ".*)|(?:description .*))/g;

// ship selector
// /ship "([\s\S]*?)(?:description .*)/g /ship "([\s\S]*?)(?:description .*)/g

// attribute selector
// "?attr"? (.*)
// "?attr"? "?([\d?\w?\s?]*)
// "?category"? "?([\d?\w? ?]*)

// outfit selector
// outfits([\s\S]*?)(?=\s*?\t*?(engine|gun|explode|turret))

// ships by faction
const ships = {
  coalition: {},
  drak: {},
  generic: {},
  hai: {},
  kestrel: {},
  korath: {},
  marauders: {},
  pug: {},
  quarg: {},
  wanderer: {}
};

// return all outfits in an array
const outfitSelector = (ship) => {
  const result = (/outfits([\s\S]*?)(?=\s*?\t*?(engine|gun|explode|turret))/).exec(ship);

  return result != null ? result[1].replace(/\t|"/g, '').trim().split('\n') : false;
};


// return the layout in arrays
const layoutSelector = (ship, retry) => {
  try {
    // num selectors
    const engines = ship.match(/engine (-?\d.*)/g);
    const guns = ship.match(/gun (-?\d.*)/g);
    const turrets = ship.match(/turret (-?\d.*)/g);
    const fighter = ship.match(/fighter (-?\d.*)/g);

    // string selectors
    const explosions = ship.match(/explode (".*)/g);

    return {
      // return number only for engine
      engines: Array.isArray(engines) ? engines.map( item => item.replace(/[a-zA-Z]*/g, '').trim()) : engines,
      explosions,
      fighter,
      guns,
      turrets,
    };
  } catch (err) {
    // retry once assuming it's an array (works for drak)
    if(!retry) {
      console.warn('a ship failed retrying..');
      layoutSelector(ship[0], true);
    } else {
      console.error('Retry failed');
    }
  }
};


// create a ship object from string of data
const scrapeShip = (data) => {
  return {
    name: attrSelector('ship', data, true),
    sprite: attrSelector('sprite', data, true),

    attributes: {
      automation: attrSelector('automation', data),
      bunks: attrSelector('bunks', data),
      cargoSpace: attrSelector('cargo space', data),
      category: attrSelector('category', data, true),
      cost: attrSelector('cost', data),
      drag: attrSelector('drag', data),
      engineCap: attrSelector('engine capacity', data),
      fuelCap: attrSelector('fuel capacity', data),
      heat: attrSelector('heat dissipation', data),
      hull: attrSelector('hull', data),
      mass: attrSelector('mass', data),
      outfitSpace: attrSelector('outfit space', data),
      requiredCrew: attrSelector('required crew', data),
      shields: attrSelector('shields', data),
      weaponCap: attrSelector('weapon capacity', data),

      weapon: {
        blastRadius: attrSelector('blast radius', data),
        hitForce: attrSelector('hit force', data),
        hullDamage: attrSelector('hull damage', data),
        shieldDamage: attrSelector('shield damage', data),
      }
    },

    outfits: outfitSelector(data),

    layout: layoutSelector(data),
    
    description: attrSelector('description', data)
  };
};


// generate ships from array of strings, put into ships[faction]
const shipGenerator = (faction, data) => {
  if( data && data.length > 1 && Array.isArray(data) ) {
    // for many ships
    for (var i=0; i<data.length; i++) {
      const ship = scrapeShip(data[i]);

      ships[faction][ship.name.toLowerCase()] = ship;
    }
  } else if(data) {
    // for single ship
    const ship = scrapeShip(data);
    
    ships[faction][ship.name.toLowerCase()] = ship;
  }
};


// read file, find all ships as strings, generate ships
const scrapeFaction = (faction, fileName, single) => {
  // different paths for files with ships only and ones with
  // outfits, ships, and whatever
  const fileText = !single ? 
  fs.readFileSync(`${__dirname}/data/ships/${fileName}.txt`, 'utf8') :
  fs.readFileSync(`${__dirname}/data/singles/${fileName}.txt`, 'utf8');

  // array of ship strings
  const shipScrape = fileText.match(shipReg);

  shipGenerator(faction, shipScrape);
};


// scrape all current factions then write to file
// TODO use readdir to read directory -> array -> scrapeFaction each item
// dynamically generate ships object and scrape
const scrapeAllShips = () => {
  scrapeFaction('coalition', 'coalition ships');
  scrapeFaction('drak', 'drak', true);
  scrapeFaction('generic', 'ships');
  scrapeFaction('hai', 'hai ships');
  scrapeFaction('kestrel', 'kestrel');
  scrapeFaction('korath', 'korath ships');
  scrapeFaction('marauders', 'marauders');
  scrapeFaction('pug', 'pug', true);
  scrapeFaction('quarg', 'quarg ships');
  scrapeFaction('wanderer', 'wanderer ships');
};


module.exports = {
  scrapeShip,
  scrapeFaction,
  scrapeAllShips,
  shipGenerator,
  ships
};