## Typescript Interview Test

1. Install postgres & nodejs
2. Create the test database using the `./createdb.sh` script
3. Install the `npm_modules` for this project running `npm install`
4. Run `npm run test` to get the program running (modify the user and password if needed)
5. Examine the typescript code under `server.ts`

### Commands

### Insert User

```
npm run test -- -u [username]
```
e.g.: npm run test -- -u anansilva


### List Users in a Location:

```
npm run test -- -l [location]
```
e.g.: npm run test -- -l Lisbon

