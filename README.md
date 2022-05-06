##Monorepo helper

A node script - CLI tool - which is able to do the following (based on the user input (y/n)):
- Run [npm audit] in each defined *project** (see later in the requirements section) and creates an audit.txt report file (in each folder)
- Run [npm outdated] in each project and creates an outdated.tx report file
- Run [npm update] in each project (this script must be handled with attention as it will update the dependencies without supervision)
- Update [node engine] in every app folder given the following input format:

```
>= [node version],  >= [npm version]
eg.:
>= 18.0.0, >=9.0.0
{code}
```
- Run [npm install] to install newly added dependencies

###Requirements:
- node version 16 or higher
- having a **projects* entry at the root level package.json file, like
  ```
  "projects": {
  "root": "/",
  "a": "projects/a",
  "b": "projects/b"
  },
  ```

- add the following dependencies (ora, chalk) at the root level

```
npm i ora chalk -S
```

- add the following run script at the root level package.json file:

```
"start": "node --experimental-json-modules index.js"

```

- optional: (audit.txt, outdated.txt) have been added to the .gitignore at the root level

###Run the script

```
npm run start
```
