const pgPromise = require('pg-promise');
const R         = require('ramda');
const request   = require('request-promise');
const argv      = require('minimist')(process.argv.slice(2));

// Limit the amount of debugging of SQL expressions
const trimLogsSize : number = 200;

// Database interface
interface DBOptions
  { host      : string
  , database  : string
  , user?     : string
  , password? : string
  , port?     : number
  };

// Actual database options
const options : DBOptions = {
  // user: ,
  // password: ,
  host: 'localhost',
  database: 'lovelystay_test',
};

// Get command line arguments
const userName = argv['u'];
const loc = argv['l'];

if(userName == undefined && loc == undefined) {
  console.error('Please insert a valid input');
  console.log('insert user: npm run test -- -u [username]')
  console.log('list users in a location: npm run test -- -l [location]')
  process.exit();
}

console.info('Connecting to the database:',
  `${options.user}@${options.host}:${options.port}/${options.database}`);

const pgpDefaultConfig = {
  promiseLib: require('bluebird'),
  // Log all querys
  query(query) {
    console.log('[SQL   ]', R.take(trimLogsSize,query.query));
  },
  // On error, please show me the SQL
  error(err, e) {
    if (e.query) {
      console.error('[SQL   ]', R.take(trimLogsSize,e.query),err);
    }
  }
};

interface GithubUsers
  { id : number
  };

const pgp = pgPromise(pgpDefaultConfig);
const db = pgp(options);


// Insert user in the db
if(userName !== undefined) {

  db.none('CREATE TABLE IF NOT EXISTS github_users (id BIGSERIAL, login TEXT UNIQUE, name TEXT, company TEXT, followers SERIAL, following SERIAl, location TEXT)')
    .then(() => request({
      uri: `https://api.github.com/users/${userName}`,
      headers: {
           'User-Agent': 'Request-Promise'
      },
      json: true
    }))
    .then((data: GithubUsers) => db.one(
      'INSERT INTO github_users (login, name, company, followers, following, location) VALUES ($[login], $[name], $[company], $[followers], $[following], $[location]) RETURNING id', data)
    ).then(({id}) => console.log(id))
    .catch(error => {
        console.error(error);
        process.exit(1);
    })
    .then(() => {
      locationStats();
      });

}

// List users in a location
if(loc !== undefined) {

  db.any(`SELECT login FROM github_users WHERE location LIKE'%${loc}%'`)
    .then(data => {
      console.info(`Users in ${loc}:`);
      data.forEach(element => {
        console.log(element.login)
      });
    })
    .catch(error => {
        console.error(error);
        process.exit(1);
    })
    .then(() => {
      locationStats();
    });

}

// Show number of users per location
const locationStats = () => {
  db.any(`SELECT COUNT(login), location FROM github_users GROUP BY location ORDER BY COUNT(login) DESC`)
    .then(data => {
      console.info("Users per Location:");
      data.forEach(result => {
        console.log(`${result.location}  ${result.count}` )
      })
    })
    .catch(error => {
        console.error(error);
        process.exit(1);
    })
    .then(() => process.exit(0));
}

